/**
 * N8N Webhook Function for B2Wall Financing Calculator
 * 
 * Based on the flowchart with these key principles:
 * 1. All interest rates are MONTHLY percentages
 * 2. VAT (ارزش افزوده) is always 10%
 * 3. Platform fee: 0-5% of invoice WITH VAT
 * 4. Collateral cover: 0-5% of invoice WITH VAT
 * 5. Three payment plans:
 *    - PLAN1: Principal + Interest paid monthly (4.5% monthly)
 *    - PLAN2: Interest paid monthly, Principal at end (5.5% monthly)
 *    - PLAN3: Principal + Interest paid at end (7% monthly)
 * 
 * Input (from webhook):
 * {
 *   "invoiceAmount": 500,        // مبلغ فاکتور (میلیون تومان)
 *   "hasVAT": "yes",             // آیا شامل ارزش افزوده است؟ (yes/no)
 *   "duration": 12,              // مدت زمان (ماه)
 *   "plan": "PLAN1",             // پلن: PLAN1, PLAN2, PLAN3
 *   "platformFee": 2,            // کارمزد پلتفرم (0-5%)
 *   "collateralCover": 3         // روکش ضمانت (0-5%)
 * }
 * 
 * Output:
 * {
 *   "success": true,
 *   "invoice": {...},
 *   "recipient": {...},
 *   "investor": {...},
 *   "costs": {...}
 * }
 */

// Plan configuration - Monthly interest rates and payment structures
const PLANS = {
  'PLAN1': {
    name: 'پلن ۱: اصل + سود ماهیانه',
    monthlyRate: 4.5,
    description: 'اصل و سود به صورت ماهیانه پرداخت می‌شود',
    paymentType: 'monthly_principal_interest' // اقساط ماهیانه شامل اصل و سود
  },
  'PLAN2': {
    name: 'پلن ۲: سود ماهیانه + اصل در انتها',
    monthlyRate: 5.5,
    description: 'سود به صورت ماهیانه و اصل در انتها پرداخت می‌شود',
    paymentType: 'monthly_interest_only' // سود ماهیانه + اصل در انتها
  },
  'PLAN3': {
    name: 'پلن ۳: اصل + سود در انتها',
    monthlyRate: 7.0,
    description: 'اصل و سود در انتهای قرارداد پرداخت می‌شود',
    paymentType: 'lump_sum' // پرداخت یکجا در انتها
  }
};

const VAT_RATE = 10; // ارزش افزوده 10%

// Helper function to format numbers
function formatNumber(num) {
  return Math.round(num * 100) / 100;
}

/**
 * Main calculation function based on B2Wall flowchart
 */
function calculateFinancing(invoiceAmount, hasVAT, duration, planCode, platformFeeRate, collateralCoverRate) {
  
  // Get plan details
  const plan = PLANS[planCode];
  if (!plan) {
    throw new Error('Invalid plan code: ' + planCode);
  }
  
  const monthlyRate = plan.monthlyRate / 100; // Convert to decimal
  
  // === STEP 1: Calculate invoice breakdown ===
  let invoiceWithVAT, invoiceBase, vatAmount;
  
  if (hasVAT === 'yes') {
    // فاکتور شامل ارزش افزوده است
    invoiceWithVAT = invoiceAmount;
    invoiceBase = invoiceAmount / 1.1; // مبلغ اصلی = مبلغ کل / 1.1
    vatAmount = invoiceWithVAT - invoiceBase;
  } else {
    // فاکتور بدون ارزش افزوده
    invoiceBase = invoiceAmount;
    vatAmount = invoiceAmount * 0.1;
    invoiceWithVAT = invoiceBase + vatAmount;
  }
  
  // === STEP 2: Calculate fees (based on invoice WITH VAT) ===
  const platformFeeAmount = invoiceWithVAT * (platformFeeRate / 100);
  const collateralAmount = invoiceWithVAT * (collateralCoverRate / 100);
  const totalDeductions = platformFeeAmount + collateralAmount + vatAmount;
  
  // === STEP 3: Calculate based on plan type ===
  let monthlyInstallment, recipientTotalPayment, investorMonthlyReturn, finalPayment;
  
  if (plan.paymentType === 'monthly_principal_interest') {
    // پلن ۱: اصل + سود ماهیانه (PMT formula)
    // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
    monthlyInstallment = (invoiceWithVAT * monthlyRate * Math.pow(1 + monthlyRate, duration)) / 
                         (Math.pow(1 + monthlyRate, duration) - 1);
    recipientTotalPayment = monthlyInstallment * duration;
    investorMonthlyReturn = monthlyInstallment;
    finalPayment = 0;
    
  } else if (plan.paymentType === 'monthly_interest_only') {
    // پلن ۲: سود ماهیانه + اصل در انتها
    const monthlyInterest = invoiceWithVAT * monthlyRate;
    monthlyInstallment = monthlyInterest;
    recipientTotalPayment = (monthlyInterest * duration) + invoiceWithVAT;
    investorMonthlyReturn = monthlyInterest;
    finalPayment = invoiceWithVAT; // پرداخت نهایی = اصل پول
    
  } else if (plan.paymentType === 'lump_sum') {
    // پلن ۳: اصل + سود در انتها
    monthlyInstallment = 0; // هیچ پرداخت ماهیانه‌ای نیست
    const totalInterest = invoiceWithVAT * monthlyRate * duration;
    recipientTotalPayment = invoiceWithVAT + totalInterest;
    investorMonthlyReturn = 0;
    finalPayment = recipientTotalPayment; // پرداخت نهایی = اصل + سود
  }
  
  // === STEP 4: RECIPIENT (سرمایه‌پذیر) CALCULATIONS ===
  const recipientCash = invoiceWithVAT - totalDeductions;
  const recipientFinancingCost = recipientTotalPayment - invoiceWithVAT;
  
  // === STEP 5: INVESTOR (سرمایه‌گذار) CALCULATIONS ===
  const investorInvestment = invoiceWithVAT;
  const investorTotalReturn = recipientTotalPayment;
  const investorProfit = investorTotalReturn - investorInvestment;
  
  // === STEP 6: Build result object ===
  return {
    // Invoice breakdown
    invoice: {
      with_vat: formatNumber(invoiceWithVAT),
      base_amount: formatNumber(invoiceBase),
      vat_amount: formatNumber(vatAmount),
      has_vat: hasVAT === 'yes'
    },
    
    // Recipient (سرمایه‌پذیر) - who receives financing
    recipient: {
      cash_received: formatNumber(recipientCash),
      monthly_installment: formatNumber(monthlyInstallment),
      final_payment: formatNumber(finalPayment),
      total_payment: formatNumber(recipientTotalPayment),
      financing_cost: formatNumber(recipientFinancingCost)
    },
    
    // Investor (سرمایه‌گذار) - who provides capital
    investor: {
      initial_investment: formatNumber(investorInvestment),
      monthly_return: formatNumber(investorMonthlyReturn),
      final_return: formatNumber(finalPayment),
      total_return: formatNumber(investorTotalReturn),
      profit: formatNumber(investorProfit)
    },
    
    // Costs breakdown
    costs: {
      platform_fee: formatNumber(platformFeeAmount),
      collateral_cover: formatNumber(collateralAmount),
      vat: formatNumber(vatAmount),
      total_deductions: formatNumber(totalDeductions)
    },
    
    // Summary
    summary: {
      plan_code: planCode,
      plan_name: plan.name,
      plan_description: plan.description,
      payment_type: plan.paymentType,
      duration_months: duration,
      monthly_rate_percent: plan.monthlyRate,
      financed_amount: formatNumber(invoiceWithVAT)
    }
  };
}

/**
 * N8N Webhook Handler
 * Use this code in a "Function" node in N8N
 * 
 * Workflow setup:
 * 1. Webhook node (POST) -> receives data
 * 2. Function node -> this code
 * 3. Respond to Webhook node -> returns JSON result
 */

// Get input from webhook
const inputData = $input.all();
const { invoiceAmount, hasVAT, duration, plan, platformFee, collateralCover } = inputData[0].json;

// Validate required inputs
if (!invoiceAmount || !hasVAT || !duration || !plan) {
  return {
    success: false,
    error: 'Missing required parameters: invoiceAmount, hasVAT, duration, plan',
    message: 'لطفاً فیلدهای الزامی را پر کنید: مبلغ فاکتور، وضعیت ارزش افزوده، مدت زمان، پلن'
  };
}

// Convert to appropriate types
const invoiceAmountNum = Number(invoiceAmount);
const durationNum = Number(duration);
const platformFeeNum = platformFee ? Number(platformFee) : 2; // Default 2%
const collateralCoverNum = collateralCover ? Number(collateralCover) : 3; // Default 3%

// Validate numeric values
if (isNaN(invoiceAmountNum) || isNaN(durationNum)) {
  return {
    success: false,
    error: 'Invalid numeric values',
    message: 'مقادیر عددی نامعتبر است'
  };
}

// Validate ranges
if (invoiceAmountNum <= 0) {
  return {
    success: false,
    error: 'Invoice amount must be positive',
    message: 'مبلغ فاکتور باید مثبت باشد'
  };
}

if (durationNum <= 0 || durationNum > 60) {
  return {
    success: false,
    error: 'Duration must be between 1-60 months',
    message: 'مدت زمان باید بین 1 تا 60 ماه باشد'
  };
}

if (platformFeeNum < 0 || platformFeeNum > 5) {
  return {
    success: false,
    error: 'Platform fee must be between 0-5%',
    message: 'کارمزد پلتفرم باید بین 0 تا 5 درصد باشد'
  };
}

if (collateralCoverNum < 0 || collateralCoverNum > 5) {
  return {
    success: false,
    error: 'Collateral cover must be between 0-5%',
    message: 'روکش ضمانت باید بین 0 تا 5 درصد باشد'
  };
}

// Validate hasVAT
if (hasVAT !== 'yes' && hasVAT !== 'no') {
  return {
    success: false,
    error: 'hasVAT must be "yes" or "no"',
    message: 'وضعیت ارزش افزوده باید "yes" یا "no" باشد'
  };
}

// Validate plan
if (!PLANS[plan]) {
  return {
    success: false,
    error: 'Invalid plan code. Must be one of: PLAN1, PLAN2, PLAN3',
    message: 'پلن نامعتبر. پلن‌لای معتبر: PLAN1, PLAN2, PLAN3'
  };
}

// Calculate financing details
try {
  const result = calculateFinancing(
    invoiceAmountNum,
    hasVAT,
    durationNum,
    plan,
    platformFeeNum,
    collateralCoverNum
  );
  
  // Return successful result
  return {
    success: true,
    message: 'محاسبات با موفقیت انجام شد',
    ...result
  };
} catch (error) {
  return {
    success: false,
    error: error.message,
    message: 'خطا در محاسبات: ' + error.message
  };
}
