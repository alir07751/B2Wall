/**
 * Modular Loan Repayment Calculator
 * 
 * This calculator implements a day-by-day loan repayment schedule with:
 * - Simple interest (non-compounding) calculated daily
 * - Flexible principal repayment schedule (specific days and amounts)
 * - Interest payment dates (specific days when accrued interest is paid)
 * - Modular fee, guarantee, tax, and cost schedule components
 * - Complete Persian/Farsi output formatting
 * 
 * Architecture:
 * - CoreLoanEngine: Handles only core loan calculations (interest, principal, dates)
 * - FeeModule: Calculates fees independently
 * - GuaranteeModule: Calculates guarantees independently
 * - TaxModule: Calculates taxes based on base values
 * - CostScheduleModule: Distributes one-time costs across days
 * - Main pipeline: Orchestrates all modules
 */

// ============================================================================
// SECTION 1: INPUT DATA HANDLING
// ============================================================================

// Get input data from n8n workflow (supports both direct input and webhook body)
const input = $input?.item?.json?.body || $input?.item?.json || $input?.json || {};

// Extract core loan parameters
// Support new nested structure: { Loan: {...}, Modules: {...} }
// Also support legacy flat structure for backward compatibility
const loanData = input.Loan || input;
const modulesData = input.Modules || {};

const LoanAmount = Number(loanData.amount || loanData.LoanAmount) || 0;
const MonthlyInterestRate = Number(loanData.monthlyInterestRate || loanData.MonthlyInterestRate) || 0;
const PrincipalRepayments = Array.isArray(loanData.principalRepayments || loanData.PrincipalRepayments) 
  ? (loanData.principalRepayments || loanData.PrincipalRepayments).map(pr => ({
      days: Number(pr.days) || 0,
      amount: Number(pr.amount) || 0
    }))
  : [];
const InterestPaymentDates = Array.isArray(loanData.interestPaymentDates || loanData.InterestPaymentDates)
  ? (loanData.interestPaymentDates || loanData.InterestPaymentDates).map(d => Number(d) || 0).filter(d => d > 0)
  : [];

// Extract optional module configurations
// Support new nested structure: Modules.fee, Modules.guarantee, etc.
// Also support legacy flat structure for backward compatibility
let feeConfig = modulesData.fee || input.feeConfig;
if (!feeConfig && (input.FeeRate || input.feeRate)) {
  // Legacy format: convert to new format
  feeConfig = {
    mode: 'percentage',
    rate: Number(input.FeeRate ?? input.feeRate) || 0
  };
} else if (!feeConfig && (input.FeeAmount || input.feeAmount)) {
  // Legacy format: fixed amount
  feeConfig = {
    mode: 'fixed',
    amount: Number(input.FeeAmount ?? input.feeAmount) || 0
  };
}

let guaranteeConfig = modulesData.guarantee || input.guaranteeConfig;
if (!guaranteeConfig && (input.GuaranteeRate || input.guaranteeRate)) {
  // Legacy format: convert to new format
  guaranteeConfig = {
    rate: Number(input.GuaranteeRate ?? input.guaranteeRate) || 0
  };
}

const taxConfig = Array.isArray(modulesData.taxes || input.Taxes || input.TaxRows || input.taxConfig)
  ? (modulesData.taxes || input.Taxes || input.TaxRows || input.taxConfig).map(t => ({
      base: (t.base || t.taxBase || '').toString(),
      rate: Number(t.rate ?? t.taxRate) || 0
    })).filter(t => t.base && t.rate > 0)
  : [];

const costScheduleConfig = Array.isArray(modulesData.costSchedule || input.CostSchedule || input.costSchedule || input.costScheduleConfig)
  ? (modulesData.costSchedule || input.CostSchedule || input.costSchedule || input.costScheduleConfig).map(cs => ({
      day: Number(cs.day ?? cs.days) || 0,
      percent: Number(cs.percent ?? cs.share ?? cs.rate) || 0
    })).filter(cs => cs.day > 0 && cs.percent >= 0)
  : [];

// Core input validation
if (LoanAmount <= 0) {
  return {
    success: false,
    error: 'LoanAmount must be positive',
    message: 'مبلغ وام باید مثبت باشد'
  };
}

if (MonthlyInterestRate <= 0 || MonthlyInterestRate > 100) {
  return {
    success: false,
    error: 'MonthlyInterestRate must be between 0 and 100%',
    message: 'نرخ سود ماهیانه باید بین 0 تا 100 درصد باشد'
  };
}

if (PrincipalRepayments.length === 0 && InterestPaymentDates.length === 0) {
  return {
    success: false,
    error: 'At least one principal repayment or interest payment date must be provided',
    message: 'حداقل یک پرداخت اصل پول یا تاریخ پرداخت سود باید تعیین شود'
  };
}

// ============================================================================
// SECTION 2: CORE LOAN ENGINE
// ============================================================================

/**
 * CoreLoanEngine
 * 
 * Handles ONLY core loan calculations:
 * - Daily interest calculation
 * - Principal repayment schedule
 * - Interest payment dates
 * - Remaining principal tracking
 * - Daily timetable generation
 * 
 * Input:
 *   - loanAmount: number
 *   - monthlyInterestRate: number (percentage)
 *   - principalRepayments: [{ days: number, amount: number }]
 *   - interestPaymentDates: number[]
 * 
 * Output:
 *   {
 *     success: boolean,
 *     schedule: [{ day, remainingPrincipalBefore, principalPayment, interestPayment, 
 *                totalPayment, description, remainingPrincipalAfter }],
 *     summary: { totalPrincipalPaid, totalInterestPaid, totalPayments, finalDay, remainingPrincipal },
 *     dailyRate: number,
 *     error?: string,
 *     message?: string
 *   }
 */
function CoreLoanEngine(loanAmount, monthlyInterestRate, principalRepayments, interestPaymentDates) {
  // Calculate daily interest rate (assumes 30 days per month)
  const dailyRate = monthlyInterestRate / 100 / 30;
  
  // Sort inputs chronologically
  const sortedPrincipalRepayments = [...principalRepayments].sort((a, b) => a.days - b.days);
  const sortedInterestPaymentDates = [...interestPaymentDates].sort((a, b) => a - b);
  
  // Determine final day
  const finalDay = Math.max(
    sortedPrincipalRepayments.length > 0 ? Math.max(...sortedPrincipalRepayments.map(pr => pr.days)) : 0,
    sortedInterestPaymentDates.length > 0 ? Math.max(...sortedInterestPaymentDates) : 0
  );
  
  if (finalDay <= 0) {
    return {
      success: false,
      error: 'Invalid payment schedule',
      message: 'برنامه پرداخت نامعتبر است',
      schedule: [],
      summary: null,
      dailyRate: dailyRate
    };
  }
  
  // Initialize tracking variables
  let remainingPrincipal = loanAmount;
  let totalAccruedInterest = 0;
  let principalRepaymentIndex = 0;
  let interestPaymentIndex = 0;
  
  const schedule = [];
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let totalPayments = 0;
  
  // Iterate day-by-day
  for (let day = 1; day <= finalDay; day++) {
    const dayRecord = {
      day: day,
      remainingPrincipalBefore: remainingPrincipal,
      principalPayment: 0,
      interestPayment: 0,
      totalPayment: 0,
      description: '',
      remainingPrincipalAfter: remainingPrincipal
    };
    
    // Calculate daily interest
    const dailyInterest = remainingPrincipal * dailyRate;
    totalAccruedInterest += dailyInterest;
    
    // Check for principal repayment
    if (principalRepaymentIndex < sortedPrincipalRepayments.length && 
        sortedPrincipalRepayments[principalRepaymentIndex].days === day) {
      const principalAmount = sortedPrincipalRepayments[principalRepaymentIndex].amount;
      
      if (principalAmount > remainingPrincipal) {
        return {
          success: false,
          error: `Principal payment on day ${day} exceeds remaining principal`,
          message: `پرداخت اصل پول در روز ${day} بیشتر از مانده بدهی است`,
          schedule: schedule,
          summary: null,
          dailyRate: dailyRate
        };
      }
      
      dayRecord.principalPayment = principalAmount;
      remainingPrincipal -= principalAmount;
      totalPrincipalPaid += principalAmount;
      dayRecord.remainingPrincipalAfter = remainingPrincipal;
      
      if (dayRecord.description) {
        dayRecord.description += ' + ';
      }
      dayRecord.description += 'پرداخت بخشی از اصل وام';
      principalRepaymentIndex++;
    }
    
    // Check for interest payment
    if (interestPaymentIndex < sortedInterestPaymentDates.length && 
        sortedInterestPaymentDates[interestPaymentIndex] === day) {
      dayRecord.interestPayment = totalAccruedInterest;
      totalInterestPaid += totalAccruedInterest;
      totalAccruedInterest = 0; // Reset after payment (simple interest)
      
      if (dayRecord.description) {
        dayRecord.description += ' + ';
      }
      dayRecord.description += 'پرداخت سود انباشته';
      interestPaymentIndex++;
    }
    
    dayRecord.totalPayment = dayRecord.principalPayment + dayRecord.interestPayment;
    totalPayments += dayRecord.totalPayment;
    
    if (!dayRecord.description) {
      dayRecord.description = 'هیچ پرداختی انجام نشد';
    }
    
    schedule.push(dayRecord);
  }
  
  // Final validation
  if (remainingPrincipal > 0.01) {
    return {
      success: false,
      error: 'Remaining principal not fully repaid',
      message: `مانده بدهی پرداخت نشده: ${remainingPrincipal.toLocaleString('fa-IR')} تومان`,
      warning: true,
      remainingPrincipal: remainingPrincipal,
      schedule: schedule,
      summary: {
        totalPrincipalPaid,
        totalInterestPaid,
        totalPayments,
        finalDay,
        remainingPrincipal
      },
      dailyRate: dailyRate
    };
  }
  
  return {
    success: true,
    schedule: schedule,
    summary: {
      totalPrincipalPaid,
      totalInterestPaid,
      totalPayments,
      finalDay,
      remainingPrincipal
    },
    dailyRate: dailyRate
  };
}

// ============================================================================
// SECTION 3: FEE MODULE
// ============================================================================

/**
 * FeeModule
 * 
 * Calculates fee amount based on loan amount and fee configuration.
 * 
 * Input:
 *   - loanAmount: number
 *   - feeConfig: { mode: "percentage" | "fixed", rate?: number, amount?: number }
 * 
 * Output:
 *   { feeAmount: number }
 */
function FeeModule(loanAmount, feeConfig) {
  if (!feeConfig || !feeConfig.mode) {
    return { feeAmount: 0 };
  }
  
  if (feeConfig.mode === 'percentage') {
    const rate = Number(feeConfig.rate) || 0;
    return { feeAmount: loanAmount * (rate / 100) };
  } else if (feeConfig.mode === 'fixed') {
    return { feeAmount: Number(feeConfig.amount) || 0 };
  }
  
  return { feeAmount: 0 };
}

// ============================================================================
// SECTION 4: GUARANTEE MODULE
// ============================================================================

/**
 * GuaranteeModule
 * 
 * Calculates guarantee amount based on loan amount and guarantee configuration.
 * 
 * Input:
 *   - loanAmount: number
 *   - guaranteeConfig: { rate?: number, customFormula?: string }
 * 
 * Output:
 *   { guaranteeAmount: number }
 */
function GuaranteeModule(loanAmount, guaranteeConfig) {
  if (!guaranteeConfig) {
    return { guaranteeAmount: 0 };
  }
  
  // If custom formula is provided, evaluate it (for future extensibility)
  if (guaranteeConfig.customFormula) {
    // For now, we'll use a simple rate-based calculation
    // In production, you might want to use a safe formula evaluator
    const rate = Number(guaranteeConfig.rate) || 0;
    return { guaranteeAmount: loanAmount * (rate / 100) };
  }
  
  // Standard rate-based calculation
  const rate = Number(guaranteeConfig.rate) || 0;
  return { guaranteeAmount: loanAmount * (rate / 100) };
}

// ============================================================================
// SECTION 5: TAX MODULE
// ============================================================================

/**
 * TaxModule
 * 
 * Calculates taxes based on base values and tax configuration.
 * 
 * Input:
 *   - taxes: [{ base: "interest" | "fees" | "guarantee", rate: number }]
 *   - baseValues: { interest: number, fees: number, guarantee: number }
 * 
 * Output:
 *   {
 *     totalTaxes: number,
 *     breakdown: [{ base, rate, baseAmount, amount }]
 *   }
 */
function TaxModule(taxes, baseValues) {
  if (!Array.isArray(taxes) || taxes.length === 0) {
    return { totalTaxes: 0, breakdown: [] };
  }
  
  const breakdown = taxes.map(t => {
    let baseAmount = 0;
    const base = (t.base || '').toString().toLowerCase();
    
    if (base === 'interest') {
      baseAmount = Number(baseValues.interest) || 0;
    } else if (base === 'fees') {
      baseAmount = Number(baseValues.fees) || 0;
    } else if (base === 'guarantee') {
      baseAmount = Number(baseValues.guarantee) || 0;
    }
    
    const rate = Number(t.rate) || 0;
    const amount = baseAmount * (rate / 100);
    
    return {
      base: t.base,
      rate: rate,
      baseAmount: baseAmount,
      amount: amount
    };
  });
  
  const totalTaxes = breakdown.reduce((sum, item) => sum + item.amount, 0);
  
  return {
    totalTaxes: totalTaxes,
    breakdown: breakdown
  };
}

// ============================================================================
// SECTION 6: COST SCHEDULE MODULE
// ============================================================================

/**
 * CostScheduleModule
 * 
 * Distributes one-time costs across specific days according to schedule configuration.
 * 
 * Input:
 *   - totalOneTimeCosts: number
 *   - scheduleConfig: [{ day: number, percent: number }]
 *   - existingSchedule: array of day records from CoreLoanEngine
 * 
 * Output:
 *   array of { day, amount } representing cost payments to inject into schedule
 */
function CostScheduleModule(totalOneTimeCosts, scheduleConfig, existingSchedule) {
  if (totalOneTimeCosts <= 0 || !Array.isArray(scheduleConfig) || scheduleConfig.length === 0) {
    return [];
  }
  
  // Normalize percentages to sum to 100%
  const sum = scheduleConfig.reduce((s, x) => s + (Number(x.percent) || 0), 0);
  const scale = sum > 0 ? (100 / sum) : 1;
  const normalized = scheduleConfig.map(cs => ({
    day: Number(cs.day) || 0,
    percent: (Number(cs.percent) || 0) * scale
  }));
  
  // Generate cost payments
  const costPayments = normalized.map(cs => ({
    day: cs.day,
    amount: totalOneTimeCosts * (cs.percent / 100)
  }));
  
  return costPayments;
}

// ============================================================================
// SECTION 7: MAIN EXECUTION PIPELINE
// ============================================================================

// Step 1: Run CoreLoanEngine
const coreResult = CoreLoanEngine(LoanAmount, MonthlyInterestRate, PrincipalRepayments, InterestPaymentDates);

if (!coreResult.success) {
  return coreResult;
}

const { schedule, summary, dailyRate } = coreResult;

// Step 2: Run FeeModule
const feeResult = FeeModule(LoanAmount, feeConfig);
const feeAmount = feeResult.feeAmount;

// Step 3: Run GuaranteeModule
const guaranteeResult = GuaranteeModule(LoanAmount, guaranteeConfig);
const guaranteeAmount = guaranteeResult.guaranteeAmount;

// Step 4: Compute baseValues for TaxModule
const baseValues = {
  interest: summary.totalInterestPaid,
  fees: feeAmount,
  guarantee: guaranteeAmount
};

// Step 5: Run TaxModule
const taxResult = TaxModule(taxConfig, baseValues);
const { totalTaxes, breakdown: taxesBreakdown } = taxResult;

// Step 6: Calculate total one-time costs
const totalUpfrontFees = feeAmount + guaranteeAmount;
const totalOneTimeCosts = totalUpfrontFees + totalTaxes;

// Step 7: Run CostScheduleModule
const costPayments = CostScheduleModule(totalOneTimeCosts, costScheduleConfig, schedule);

// Step 8: Merge cost payments into schedule
const finalSchedule = [...schedule];
if (costPayments.length > 0) {
  costPayments.forEach(cp => {
    const idx = finalSchedule.findIndex(d => d.day === cp.day);
    if (idx >= 0) {
      finalSchedule[idx].costPayment = (finalSchedule[idx].costPayment || 0) + cp.amount;
      finalSchedule[idx].totalPayment += cp.amount;
      finalSchedule[idx].description = (finalSchedule[idx].description 
        ? (finalSchedule[idx].description + ' + ') 
        : '') + 'پرداخت هزینه‌ها';
    } else {
      // Add new day entry for cost payment
      finalSchedule.push({
        day: cp.day,
        remainingPrincipalBefore: 0,
        principalPayment: 0,
        interestPayment: 0,
        costPayment: cp.amount,
        totalPayment: cp.amount,
        description: 'پرداخت هزینه‌ها',
        remainingPrincipalAfter: 0
      });
    }
  });
  finalSchedule.sort((a, b) => a.day - b.day);
}

// ============================================================================
// SECTION 8: PERSIAN/FARSI FORMATTING UTILITIES
// ============================================================================

/**
 * Format number as Toman with Persian digit separators
 */
function formatToman(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 تومان';
  }
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('en-US');
  return `${formatted} تومان`;
}

/**
 * Convert Arabic/Western digits to Persian digits (optional enhancement)
 */
function toPersianDigits(str) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

// ============================================================================
// SECTION 9: GENERATE PERSIAN REPORT
// ============================================================================

/**
 * Generate comprehensive repayment schedule table in Persian
 */
function generatePersianReport(schedule, summary, loanAmount, monthlyRate, dailyRate, finalDay, principalRepayments, interestPaymentDates) {
  let report = '';
  
  report += '='.repeat(80) + '\n';
  report += 'جدول برنامه بازپرداخت وام\n';
  report += '='.repeat(80) + '\n\n';
  
  report += 'خلاصه اطلاعات وام:\n';
  report += `- مبلغ کل وام: ${formatToman(loanAmount)}\n`;
  report += `- نرخ سود ماهیانه: ${monthlyRate}%\n`;
  report += `- نرخ سود روزانه: ${(dailyRate * 100).toFixed(4)}%\n`;
  report += `- تعداد روزهای دوره: ${finalDay} روز\n`;
  report += `- تعداد پرداخت‌های اصل پول: ${principalRepayments.length}\n`;
  report += `- تعداد پرداخت‌های سود: ${interestPaymentDates.length}\n\n`;
  
  report += 'خلاصه پرداخت‌ها:\n';
  report += `- مجموع اصل پول پرداخت شده: ${formatToman(summary.totalPrincipalPaid)}\n`;
  report += `- مجموع سود پرداخت شده: ${formatToman(summary.totalInterestPaid)}\n`;
  report += `- مجموع کل پرداخت‌ها: ${formatToman(summary.totalPayments)}\n`;
  report += `- هزینه کل وام (سود): ${formatToman(summary.totalInterestPaid)}\n\n`;
  
  report += '='.repeat(80) + '\n';
  report += 'جدول تفصیلی برنامه بازپرداخت (روز به روز)\n';
  report += '='.repeat(80) + '\n\n';
  
  report += 'روز'.padEnd(8) + ' | ';
  report += 'اصل پول باقی‌مانده (قبل از پرداخت)'.padEnd(35) + ' | ';
  report += 'مبلغ پرداخت اصل پول'.padEnd(25) + ' | ';
  report += 'سود انباشته پرداخت شده'.padEnd(30) + ' | ';
  report += 'مبلغ کل پرداختی در این روز'.padEnd(35) + ' | ';
  report += 'توضیحات\n';
  report += '-'.repeat(180) + '\n';
  
  const paymentDays = schedule.filter(day => 
    day.principalPayment > 0 || day.interestPayment > 0
  );
  
  const daysToShow = paymentDays.length > 0 
    ? [...new Set([
        schedule[0],
        ...paymentDays,
        schedule[schedule.length - 1]
      ])].sort((a, b) => a.day - b.day)
    : schedule;
  
  daysToShow.forEach(day => {
    const dayNum = day.day.toString().padEnd(6);
    const principalBefore = formatToman(day.remainingPrincipalBefore).padEnd(33);
    const principalPayment = day.principalPayment > 0 
      ? formatToman(day.principalPayment).padEnd(23)
      : '-'.padEnd(23);
    const interestPayment = day.interestPayment > 0
      ? formatToman(day.interestPayment).padEnd(28)
      : '-'.padEnd(28);
    const totalPayment = day.totalPayment > 0
      ? formatToman(day.totalPayment).padEnd(33)
      : '-'.padEnd(33);
    const description = day.description;
    
    report += `${dayNum} | ${principalBefore} | ${principalPayment} | ${interestPayment} | ${totalPayment} | ${description}\n`;
  });
  
  report += '\n' + '='.repeat(80) + '\n';
  report += 'پایان گزارش\n';
  report += '='.repeat(80) + '\n';
  
  return report;
}

const formattedReport = generatePersianReport(
  finalSchedule, 
  summary, 
  LoanAmount, 
  MonthlyInterestRate, 
  dailyRate, 
  summary.finalDay, 
  PrincipalRepayments, 
  InterestPaymentDates
);

// ============================================================================
// SECTION 10: OUTPUT FORMATTING FOR N8N
// ============================================================================

/**
 * Format schedule for JSON output with Persian formatting
 */
const formattedSchedule = finalSchedule.map(day => ({
  روز: day.day,
  'اصل پول باقی‌مانده (قبل از پرداخت)': formatToman(day.remainingPrincipalBefore),
  'مبلغ پرداخت اصل پول': day.principalPayment > 0 ? formatToman(day.principalPayment) : '-',
  'سود انباشته پرداخت شده': day.interestPayment > 0 ? formatToman(day.interestPayment) : '-',
  'هزینه‌ها': day.costPayment > 0 ? formatToman(day.costPayment) : '-',
  'مبلغ کل پرداختی در این روز': day.totalPayment > 0 ? formatToman(day.totalPayment) : '-',
  'توضیحات': day.description,
  _raw: {
    day: day.day,
    remainingPrincipalBefore: day.remainingPrincipalBefore,
    principalPayment: day.principalPayment,
    interestPayment: day.interestPayment,
    costPayment: day.costPayment || 0,
    totalPayment: day.totalPayment,
    remainingPrincipalAfter: day.remainingPrincipalAfter
  }
}));

// Summary in Persian
const persianSummary = {
  'مبلغ کل وام': formatToman(LoanAmount),
  'نرخ سود ماهیانه': `${MonthlyInterestRate}%`,
  'نرخ سود روزانه': `${(dailyRate * 100).toFixed(4)}%`,
  'تعداد روزهای دوره': `${summary.finalDay} روز`,
  'مجموع اصل پول پرداخت شده': formatToman(summary.totalPrincipalPaid),
  'مجموع سود پرداخت شده': formatToman(summary.totalInterestPaid),
  'مجموع کل پرداخت‌ها': formatToman(summary.totalPayments),
  'هزینه کل وام (سود)': formatToman(summary.totalInterestPaid),
  ...(feeAmount > 0 || guaranteeAmount > 0 ? {
    'کارمزد از اصل وام': formatToman(feeAmount),
    'هزینه ضمانت از اصل وام': formatToman(guaranteeAmount),
    'مجموع کارمزدهای ابتدایی': formatToman(totalUpfrontFees),
  } : {}),
  ...(totalTaxes > 0 ? {
    'مجموع مالیات‌ها': formatToman(totalTaxes),
  } : {}),
  _raw: {
    loanAmount: LoanAmount,
    monthlyInterestRate: MonthlyInterestRate,
    dailyRate: dailyRate,
    finalDay: summary.finalDay,
    totalPrincipalPaid: summary.totalPrincipalPaid,
    totalInterestPaid: summary.totalInterestPaid,
    totalPayments: summary.totalPayments,
    feeAmount: feeAmount,
    guaranteeAmount: guaranteeAmount,
    totalUpfrontFees: totalUpfrontFees,
    taxes: taxesBreakdown,
    totalTaxes: totalTaxes,
    totalOneTimeCosts: totalOneTimeCosts
  }
};

// ============================================================================
// SECTION 11: FINAL OUTPUT
// ============================================================================

return {
  success: true,
  schedule: formattedSchedule,
  summary: persianSummary,
  formattedReport: formattedReport,
  rawData: {
    schedule: finalSchedule,
    summary: summary,
    calculationParams: {
      loanAmount: LoanAmount,
      monthlyInterestRate: MonthlyInterestRate,
      dailyRate: dailyRate,
      principalRepayments: PrincipalRepayments,
      interestPaymentDates: InterestPaymentDates,
      finalDay: summary.finalDay,
      costSchedule: costScheduleConfig
    }
  }
};
