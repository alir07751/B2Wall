/**
 * N8N Flexible Loan Repayment Calculator for Persian-Speaking Clients
 * 
 * This calculator implements a day-by-day loan repayment schedule with:
 * - Simple interest (non-compounding) calculated daily
 * - Flexible principal repayment schedule (specific days and amounts)
 * - Interest payment dates (specific days when accrued interest is paid)
 * - Complete Persian/Farsi output formatting
 * 
 * Input Structure (from n8n workflow):
 * {
 *   "LoanAmount": 330000000,                    // Total principal (Toman)
 *   "MonthlyInterestRate": 4.5,                 // Monthly interest rate (%)
 *   "PrincipalRepayments": [                    // Array of principal payments
 *     {"days": 60, "amount": 30000000},
 *     {"days": 120, "amount": 50000000},
 *     ...
 *   ],
 *   "InterestPaymentDates": [180, 240]          // Days when interest is paid
 * }
 * 
 * Output:
 * {
 *   "success": true,
 *   "schedule": [...],                          // Day-by-day repayment schedule
 *   "summary": {...},                           // Summary statistics in Persian
 *   "formattedReport": "..."                    // Formatted Persian report
 * }
 */

// ============================================================================
// SECTION 1: INPUT DATA HANDLING
// ============================================================================

// Get input data from n8n workflow (supports both direct input and webhook body)
const input = $input?.item?.json?.body || $input?.item?.json || $input?.json || {};

// Extract and validate input parameters
const LoanAmount = Number(input.LoanAmount) || 0;
const MonthlyInterestRate = Number(input.MonthlyInterestRate) || 0;
const PrincipalRepayments = Array.isArray(input.PrincipalRepayments) 
  ? input.PrincipalRepayments.map(pr => ({
      days: Number(pr.days) || 0,
      amount: Number(pr.amount) || 0
    }))
  : [];
const InterestPaymentDates = Array.isArray(input.InterestPaymentDates)
  ? input.InterestPaymentDates.map(d => Number(d) || 0).filter(d => d > 0)
  : [];

// Optional: Upfront fees, guarantees, and taxes
const FeeRate = Number(input.FeeRate ?? input.feeRate) || 0;              // % of LoanAmount
const GuaranteeRate = Number(input.GuaranteeRate ?? input.guaranteeRate) || 0; // % of LoanAmount
// Taxes can arrive as Taxes or TaxRows; items: { base: 'interest'|'fees'|'guarantee', rate: number% }
const Taxes = Array.isArray(input.Taxes || input.TaxRows)
  ? (input.Taxes || input.TaxRows).map(t => ({
      base: (t.base || t.taxBase || '').toString(),
      rate: Number(t.rate ?? t.taxRate) || 0
    })).filter(t => t.base && t.rate > 0)
  : [];
// Optional cost schedule: [{ day, percent }]
const CostSchedule = Array.isArray(input.CostSchedule || input.costSchedule)
  ? (input.CostSchedule || input.costSchedule).map(cs => ({
      day: Number(cs.day ?? cs.days) || 0,
      percent: Number(cs.percent ?? cs.share ?? cs.rate) || 0
    })).filter(cs => cs.day > 0 && cs.percent >= 0)
  : [];

// Input validation
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
// SECTION 2: CORE CALCULATION LOGIC
// ============================================================================

/**
 * Calculate daily interest rate
 * Formula: r_daily = MonthlyInterestRate / 30
 * Assumes 30 days per month for financial calculations
 */
const dailyRate = MonthlyInterestRate / 100 / 30; // Convert percentage to decimal

/**
 * Sort principal repayments by day to ensure chronological processing
 */
PrincipalRepayments.sort((a, b) => a.days - b.days);

/**
 * Sort interest payment dates chronologically
 */
InterestPaymentDates.sort((a, b) => a - b);

/**
 * Determine the final day of the loan period
 * This is the maximum of:
 * - Last principal repayment day
 * - Last interest payment day
 */
const finalDay = Math.max(
  PrincipalRepayments.length > 0 ? Math.max(...PrincipalRepayments.map(pr => pr.days)) : 0,
  InterestPaymentDates.length > 0 ? Math.max(...InterestPaymentDates) : 0
);

if (finalDay <= 0) {
  return {
    success: false,
    error: 'Invalid payment schedule',
    message: 'برنامه پرداخت نامعتبر است'
  };
}

/**
 * Core day-by-day calculation function
 * This function iterates through each day and calculates:
 * - Daily interest based on remaining principal
 * - Principal repayments when scheduled
 * - Interest payments when scheduled
 * - Total accrued interest (reset after payment)
 */
function calculateRepaymentSchedule() {
  // Initialize tracking variables
  let remainingPrincipal = LoanAmount;
  let totalAccruedInterest = 0;
  let principalRepaymentIndex = 0;
  let interestPaymentIndex = 0;
  
  // Schedule array to store day-by-day details
  const schedule = [];
  
  // Track total payments for summary
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let totalPayments = 0;
  
  // Iterate day-by-day from Day 1 to final day
  for (let day = 1; day <= finalDay; day++) {
    // Initialize day record
    const dayRecord = {
      day: day,
      remainingPrincipalBefore: remainingPrincipal,
      principalPayment: 0,
      interestPayment: 0,
      totalPayment: 0,
      description: '',
      remainingPrincipalAfter: remainingPrincipal
    };
    
    // Calculate daily interest based on remaining principal at start of day
    const dailyInterest = remainingPrincipal * dailyRate;
    totalAccruedInterest += dailyInterest;
    
    // Check if this day has a principal repayment
    if (principalRepaymentIndex < PrincipalRepayments.length && 
        PrincipalRepayments[principalRepaymentIndex].days === day) {
      const principalAmount = PrincipalRepayments[principalRepaymentIndex].amount;
      
      // Validate principal payment doesn't exceed remaining principal
      if (principalAmount > remainingPrincipal) {
        return {
          success: false,
          error: `Principal payment on day ${day} exceeds remaining principal`,
          message: `پرداخت اصل پول در روز ${day} بیشتر از مانده بدهی است`
        };
      }
      
      dayRecord.principalPayment = principalAmount;
      remainingPrincipal -= principalAmount;
      totalPrincipalPaid += principalAmount;
      dayRecord.remainingPrincipalAfter = remainingPrincipal;
      
      // Update description
      if (dayRecord.description) {
        dayRecord.description += ' + ';
      }
      dayRecord.description += 'پرداخت بخشی از اصل وام';
      principalRepaymentIndex++;
    }
    
    // Check if this day has an interest payment
    if (interestPaymentIndex < InterestPaymentDates.length && 
        InterestPaymentDates[interestPaymentIndex] === day) {
      // Record the accrued interest as payment amount
      dayRecord.interestPayment = totalAccruedInterest;
      totalInterestPaid += totalAccruedInterest;
      
      // CRITICAL: Reset accrued interest to zero after payment
      // This ensures simple interest (no compounding)
      totalAccruedInterest = 0;
      
      // Update description
      if (dayRecord.description) {
        dayRecord.description += ' + ';
      }
      dayRecord.description += 'پرداخت سود انباشته';
      interestPaymentIndex++;
    }
    
    // Calculate total payment for this day
    dayRecord.totalPayment = dayRecord.principalPayment + dayRecord.interestPayment;
    totalPayments += dayRecord.totalPayment;
    
    // If no payment occurred, add description
    if (!dayRecord.description) {
      dayRecord.description = 'هیچ پرداختی انجام نشد';
    }
    
    // Add to schedule
    schedule.push(dayRecord);
  }
  
  // Final validation: ensure all principal is repaid
  if (remainingPrincipal > 0.01) { // Allow small rounding errors
    return {
      success: false,
      error: 'Remaining principal not fully repaid',
      message: `مانده بدهی پرداخت نشده: ${remainingPrincipal.toLocaleString('fa-IR')} تومان`,
      warning: true,
      remainingPrincipal: remainingPrincipal
    };
  }
  
  return {
    success: true,
    schedule: schedule,
    summary: {
      totalPrincipalPaid: totalPrincipalPaid,
      totalInterestPaid: totalInterestPaid,
      totalPayments: totalPayments,
      finalDay: finalDay,
      remainingPrincipal: remainingPrincipal
    }
  };
}

// Execute calculation
const calculationResult = calculateRepaymentSchedule();

if (!calculationResult.success) {
  return calculationResult;
}

const { schedule, summary } = calculationResult;

// ============================================================================
// SECTION 3: PERSIAN/FARSI FORMATTING UTILITIES
// ============================================================================

/**
 * Format number as Toman with Persian digit separators
 * Example: 330000000 -> "330,000,000 تومان"
 */
function formatToman(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 تومان';
  }
  // Round to nearest integer for display
  const rounded = Math.round(amount);
  // Format with thousand separators
  const formatted = rounded.toLocaleString('en-US');
  return `${formatted} تومان`;
}

/**
 * Convert Arabic/Western digits to Persian digits (optional enhancement)
 * This function can be used if Persian digits are preferred
 */
function toPersianDigits(str) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

// ============================================================================
// SECTION 4: GENERATE PERSIAN REPORT TABLE
// ============================================================================

/**
 * Generate comprehensive repayment schedule table in Persian
 */
function generatePersianReport() {
  let report = '';
  
  // Report Header
  report += '='.repeat(80) + '\n';
  report += 'جدول برنامه بازپرداخت وام\n';
  report += '='.repeat(80) + '\n\n';
  
  // Summary Section
  report += 'خلاصه اطلاعات وام:\n';
  report += `- مبلغ کل وام: ${formatToman(LoanAmount)}\n`;
  report += `- نرخ سود ماهیانه: ${MonthlyInterestRate}%\n`;
  report += `- نرخ سود روزانه: ${(dailyRate * 100).toFixed(4)}%\n`;
  report += `- تعداد روزهای دوره: ${finalDay} روز\n`;
  report += `- تعداد پرداخت‌های اصل پول: ${PrincipalRepayments.length}\n`;
  report += `- تعداد پرداخت‌های سود: ${InterestPaymentDates.length}\n\n`;
  
  report += 'خلاصه پرداخت‌ها:\n';
  report += `- مجموع اصل پول پرداخت شده: ${formatToman(summary.totalPrincipalPaid)}\n`;
  report += `- مجموع سود پرداخت شده: ${formatToman(summary.totalInterestPaid)}\n`;
  report += `- مجموع کل پرداخت‌ها: ${formatToman(summary.totalPayments)}\n`;
  report += `- هزینه کل وام (سود): ${formatToman(summary.totalInterestPaid)}\n\n`;
  
  report += '='.repeat(80) + '\n';
  report += 'جدول تفصیلی برنامه بازپرداخت (روز به روز)\n';
  report += '='.repeat(80) + '\n\n';
  
  // Table Header
  report += 'روز'.padEnd(8) + ' | ';
  report += 'اصل پول باقی‌مانده (قبل از پرداخت)'.padEnd(35) + ' | ';
  report += 'مبلغ پرداخت اصل پول'.padEnd(25) + ' | ';
  report += 'سود انباشته پرداخت شده'.padEnd(30) + ' | ';
  report += 'مبلغ کل پرداختی در این روز'.padEnd(35) + ' | ';
  report += 'توضیحات\n';
  report += '-'.repeat(180) + '\n';
  
  // Table Rows - Only show days with payments or significant events
  const paymentDays = schedule.filter(day => 
    day.principalPayment > 0 || day.interestPayment > 0
  );
  
  // If there are many days, show payment days + first and last day
  const daysToShow = paymentDays.length > 0 
    ? [...new Set([
        schedule[0], // First day
        ...paymentDays,
        schedule[schedule.length - 1] // Last day
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

// Generate the formatted report
const formattedReport = generatePersianReport();

// ============================================================================
// SECTION 5: OUTPUT FORMATTING FOR N8N
// ============================================================================

// Compute optional financials (fees, guarantees, taxes) based on provided inputs
const feeAmount = LoanAmount * (FeeRate / 100);
const guaranteeAmount = LoanAmount * (GuaranteeRate / 100);
const totalUpfrontFees = feeAmount + guaranteeAmount;
const taxesBreakdown = Taxes.map(t => {
  let baseAmount = 0;
  if (t.base === 'interest') baseAmount = summary.totalInterestPaid;
  else if (t.base === 'fees') baseAmount = feeAmount;
  else if (t.base === 'guarantee') baseAmount = guaranteeAmount;
  const amount = baseAmount * (t.rate / 100);
  return { base: t.base, rate: t.rate, baseAmount, amount };
});
const totalTaxes = taxesBreakdown.reduce((s, x) => s + x.amount, 0);
const totalOneTimeCosts = totalUpfrontFees + totalTaxes;

// Apply cost schedule into day-by-day schedule (optional)
if (totalOneTimeCosts > 0) {
  let normalized = CostSchedule.slice();
  if (normalized.length === 0) {
    const defaultDay = (InterestPaymentDates[0] || PrincipalRepayments[0]?.days || 1);
    normalized = [{ day: defaultDay, percent: 100 }];
  }
  const sum = normalized.reduce((s, x) => s + (x.percent || 0), 0) || 0;
  const scale = sum > 0 ? (100 / sum) : 1;
  normalized.forEach(cs => cs.percent = (cs.percent || 0) * scale);
  normalized.forEach(cs => {
    const amount = totalOneTimeCosts * (cs.percent / 100);
    const idx = schedule.findIndex(d => d.day === cs.day);
    if (idx >= 0) {
      schedule[idx].costPayment = (schedule[idx].costPayment || 0) + amount;
      schedule[idx].totalPayment += amount;
      schedule[idx].description = (schedule[idx].description ? (schedule[idx].description + ' + ') : '') + 'پرداخت هزینه‌ها';
    } else {
      schedule.push({
        day: cs.day,
        remainingPrincipalBefore: 0,
        principalPayment: 0,
        interestPayment: 0,
        costPayment: amount,
        totalPayment: amount,
        description: 'پرداخت هزینه‌ها',
        remainingPrincipalAfter: 0
      });
    }
  });
  schedule.sort((a, b) => a.day - b.day);
}

/**
 * Format schedule for JSON output with Persian formatting
 */
const formattedSchedule = schedule.map(day => ({
  روز: day.day,
  'اصل پول باقی‌مانده (قبل از پرداخت)': formatToman(day.remainingPrincipalBefore),
  'مبلغ پرداخت اصل پول': day.principalPayment > 0 ? formatToman(day.principalPayment) : '-',
  'سود انباشته پرداخت شده': day.interestPayment > 0 ? formatToman(day.interestPayment) : '-',
  'هزینه‌ها': day.costPayment > 0 ? formatToman(day.costPayment) : '-',
  'مبلغ کل پرداختی در این روز': day.totalPayment > 0 ? formatToman(day.totalPayment) : '-',
  'توضیحات': day.description,
  // Raw numeric values for calculations
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
  'تعداد روزهای دوره': `${finalDay} روز`,
  'مجموع اصل پول پرداخت شده': formatToman(summary.totalPrincipalPaid),
  'مجموع سود پرداخت شده': formatToman(summary.totalInterestPaid),
  'مجموع کل پرداخت‌ها': formatToman(summary.totalPayments),
  'هزینه کل وام (سود)': formatToman(summary.totalInterestPaid),
  // Upfront fees and taxes (if provided)
  ...(FeeRate > 0 || GuaranteeRate > 0 ? {
    'کارمزد از اصل وام': formatToman(feeAmount),
    'هزینه ضمانت از اصل وام': formatToman(guaranteeAmount),
    'مجموع کارمزدهای ابتدایی': formatToman(totalUpfrontFees),
  } : {}),
  ...(Taxes.length > 0 ? {
    'مجموع مالیات‌ها': formatToman(totalTaxes),
  } : {}),
  // Raw numeric values
  _raw: {
    loanAmount: LoanAmount,
    monthlyInterestRate: MonthlyInterestRate,
    dailyRate: dailyRate,
    finalDay: finalDay,
    totalPrincipalPaid: summary.totalPrincipalPaid,
    totalInterestPaid: summary.totalInterestPaid,
    totalPayments: summary.totalPayments,
    // Optionals
    feeRate: FeeRate,
    guaranteeRate: GuaranteeRate,
    feeAmount: feeAmount,
    guaranteeAmount: guaranteeAmount,
    totalUpfrontFees: totalUpfrontFees,
    taxes: taxesBreakdown,
    totalTaxes: totalTaxes,
    totalOneTimeCosts: totalOneTimeCosts
  }
};

// ============================================================================
// SECTION 6: FINAL OUTPUT
// ============================================================================

return {
  success: true,
  schedule: formattedSchedule,
  summary: persianSummary,
  formattedReport: formattedReport,
  // Include raw data for programmatic access
  rawData: {
    schedule: schedule,
    summary: summary,
    calculationParams: {
      loanAmount: LoanAmount,
      monthlyInterestRate: MonthlyInterestRate,
      dailyRate: dailyRate,
      principalRepayments: PrincipalRepayments,
      interestPaymentDates: InterestPaymentDates,
      finalDay: finalDay,
      costSchedule: CostSchedule
    }
  }
};
