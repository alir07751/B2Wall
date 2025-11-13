/**
 * N8N Webhook Function for B2Wall Financing Calculator
 * 
 * Updated with new calculation logic:
 * 1. Monthly interest rate is now dynamic (user input)
 * 2. VAT calculation considers tax exemption
 * 3. Plan 1 uses declining balance method
 * 4. VAT is calculated on fixed fees and collateral
 * 
 * Input (from webhook):
 * {
 *   "invoiceAmount": 500000000,     // مبلغ فاکتور (تومان)
 *   "isTaxExempt": "no",            // آیا معاف از مالیات است؟ (yes/no)
 *   "hasVAT": "yes",                // آیا شامل ارزش افزوده است؟ (yes/no)
 *   "duration": 12,                 // مدت زمان (ماه)
 *   "planCode": "PLAN1",            // پلن: PLAN1, PLAN2, PLAN3
 *   "monthlyRate": 4.5,             // درصد سود ماهیانه (داینامیک)
 *   "platformFeeRate": 2,           // کارمزد پلتفرم (0-5%)
 *   "collateralCoverRate": 3        // روکش ضمانت (0-5%)
 * }
 * 
 * Output:
 * {
 *   "success": true,
 *   "data": {
 *     "invoice": {...},
 *     "investor": {...},
 *     "recipient": {...},
 *     "platform": {...},
 *     "summary": {...}
 *   }
 * }
 */

// Get input data from webhook BODY
const input = $input.item.json.body || $input.item.json;

const invoiceAmount = Number(input.invoiceAmount) || 0;
const isTaxExempt = input.isTaxExempt || 'no';
const hasVAT = input.hasVAT || 'no';
const duration = Number(input.duration) || 0;
const planCode = input.planCode || input.plan || 'PLAN1';
const platformFeeRate = Number(input.platformFeeRate || input.platformFee) || 0;
const collateralCoverRate = Number(input.collateralCoverRate || input.collateralCover) || 0;
const monthlyRatePercent = Number(input.monthlyRate) || 0;

// Plan configurations (monthlyRate is now dynamic from input)
const PLANS = {
  'PLAN1': {
    name: 'پلن ۱: اصل + سود ماهیانه',
    paymentType: 'monthly_principal_interest'
  },
  'PLAN2': {
    name: 'پلن ۲: سود ماهیانه + اصل در انتها',
    paymentType: 'monthly_interest_only'
  },
  'PLAN3': {
    name: 'پلن ۳: اصل + سود در انتها',
    paymentType: 'lump_sum'
  }
};

// Validate inputs
if (!invoiceAmount || invoiceAmount <= 0) {
  return {
    success: false,
    error: 'Invoice amount must be positive',
    message: 'مبلغ فاکتور باید مثبت باشد'
  };
}

if (!duration || duration <= 0 || duration > 60) {
  return {
    success: false,
    error: 'Duration must be between 1-60 months',
    message: 'مدت زمان باید بین 1 تا 60 ماه باشد'
  };
}

if (!monthlyRatePercent || monthlyRatePercent <= 0 || monthlyRatePercent > 100) {
  return {
    success: false,
    error: 'Monthly rate must be between 0-100%',
    message: 'درصد سود ماهیانه باید بین 0 تا 100 باشد'
  };
}

if (!PLANS[planCode]) {
  return {
    success: false,
    error: 'Invalid plan code. Must be one of: PLAN1, PLAN2, PLAN3',
    message: 'پلن نامعتبر. پلن‌های معتبر: PLAN1, PLAN2, PLAN3'
  };
}

const plan = PLANS[planCode];
const monthlyRate = monthlyRatePercent / 100;

// --- STEP 1: Calculate VAT on Invoice ---
// این بخش مبلغ اصلی (invoiceBase) و مبلغی که سرمایه‌گذار پرداخت می‌کند (invoiceWithVAT) را تعیین می‌کند.
let invoiceWithVAT, invoiceBase, vatAmount;

if (isTaxExempt === 'yes') {
  invoiceWithVAT = invoiceAmount;
  invoiceBase = invoiceAmount;
  vatAmount = 0;
} else {
  // اگر مبلغ ورودی شامل VAT باشد
  if (hasVAT === 'yes') {
    invoiceWithVAT = invoiceAmount;
    invoiceBase = invoiceAmount / 1.1;
    vatAmount = invoiceWithVAT - invoiceBase;
  } 
  // اگر مبلغ ورودی شامل VAT نباشد، VAT محاسبه و اضافه می‌شود
  else {
    invoiceBase = invoiceAmount;
    vatAmount = invoiceAmount * 0.1;
    invoiceWithVAT = invoiceBase + vatAmount;
  }
}

// === STEP 2: Calculate total costs and fees (Base Amounts) ===
const platformFeeRate_decimal = platformFeeRate / 100;
const collateralRate_decimal = collateralCoverRate / 100;
const vatRate = 0.1; // نرخ ثابت مالیات بر ارزش افزوده
const principalLoan = invoiceWithVAT; // سرمایه‌ی نقدی که توسط سرمایه‌گذار تأمین می‌شود

// Base Fixed Fees (هزینه‌های ثابت)
const platformFeeAmount = principalLoan * platformFeeRate_decimal;
const collateralAmount = principalLoan * collateralRate_decimal;

// VAT on Fixed Fees and Collateral (10% of the base amounts)
const vatOnPlatformFee = platformFeeAmount * vatRate;
const vatOnCollateral = collateralAmount * vatRate;

// کل هزینه‌های ثابت (کارمزد و ضمانت) برای بازپرداخت (شامل VAT)
const totalFixedCostsToRepay = platformFeeAmount + collateralAmount + vatOnPlatformFee + vatOnCollateral;

// سهم ماهانه درآمد پلتفرم (قسط ثابت)
const platformMonthlyRevenue = totalFixedCostsToRepay / duration;

// Total additional costs (برای پلن‌های ۲ و ۳)
// برای پلن ۱ از سود کاهشی استفاده خواهد شد و این متغیر فقط برای پلن ۲ و ۳ کاربرد دارد
const baseInterestSimple = principalLoan * monthlyRate * duration;
const vatOnInterestSimple = baseInterestSimple * vatRate; // VAT سود ساده
const totalAdditionalCosts = baseInterestSimple + vatOnInterestSimple + totalFixedCostsToRepay; // جمع کل هزینه‌ها برای پلن‌های ۲ و ۳

// === STEP 3: Calculate installments based on plan type ===
let monthlyInstallment, recipientTotalPayment, investorMonthlyReturn, platformTotalRevenue;

if (plan.paymentType === 'monthly_principal_interest') {
  // ----------------------------------------------------------------
  // ✅ پلن ۱: اصل + سود ماهیانه (روش اقساط کاهشی - منطبق با اکسل)
  // ----------------------------------------------------------------
  
  const n = duration;
  const i = monthlyRate;
  
  // 1. محاسبه کل سود پروژه (روش کاهشی) - مطابق با اکسل
  // فرمول: P * i * (n+1)/2
  const totalProjectInterest = principalLoan * i * ((n + 1) / 2);
  const vatOnProjectInterest = totalProjectInterest * vatRate;
  
  // 2. محاسبه کل مبلغ قابل بازپرداخت (Total Repayment)
  // اصل + کل سود کاهشی + VAT بر سود + کل هزینه‌های ثابت (با VAT)
  recipientTotalPayment = principalLoan + totalProjectInterest + vatOnProjectInterest + totalFixedCostsToRepay;
  
  // 3. محاسبه میانگین قسط ماهانه سرمایه‌پذیر (برای نمایش در خروجی)
  monthlyInstallment = recipientTotalPayment / duration;
  
  // 4. مجموع درآمد پلتفرم (هزینه‌های ثابت + VAT آن‌ها)
  platformTotalRevenue = totalFixedCostsToRepay;
  
  // 5. تفکیک سهم سرمایه‌گذار
  // دریافتی ماهانه سرمایه‌گذار: میانگین قسط کل - سهم ماهانه درآمد پلتفرم
  // توجه: این فقط میانگین است. قسط واقعی سرمایه‌گذار هر ماه تغییر می‌کند.
  investorMonthlyReturn = monthlyInstallment - platformMonthlyRevenue; 
  
} else if (plan.paymentType === 'monthly_interest_only') {
  // ----------------------------------------------------------------
  // ✅ پلن ۲: سود ماهیانه + اصل در انتها (سود ساده)
  // ----------------------------------------------------------------
  
  // سود + VAT سود ماهانه (سهم سرمایه‌گذار)
  const monthlyInterestPayment = (baseInterestSimple / duration) * (1 + vatRate); 
  
  // مجموع قسط ماهانه سرمایه‌پذیر (سود + VAT سود + هزینه‌های ثابت ماهانه)
  monthlyInstallment = monthlyInterestPayment + platformMonthlyRevenue;
  
  // دریافتی ماهانه سرمایه‌گذار (فقط سود + VAT سود)
  investorMonthlyReturn = monthlyInterestPayment; 
  
  // مجموع پرداختی سرمایه‌پذیر ثابت است
  recipientTotalPayment = totalAdditionalCosts + invoiceWithVAT;
  
  // مجموع درآمد پلتفرم
  platformTotalRevenue = totalFixedCostsToRepay;
  
} else if (plan.paymentType === 'lump_sum') {
  // ----------------------------------------------------------------
  // ✅ پلن ۳: اصل + سود در انتها
  // ----------------------------------------------------------------
  
  monthlyInstallment = 0; // قسط ماهانه (پرداختی در ماه اول تا n-1)
  
  // مجموع پرداختی سرمایه‌پذیر ثابت است
  recipientTotalPayment = totalAdditionalCosts + invoiceWithVAT;
  
  // مجموع درآمد پلتفرم
  platformTotalRevenue = totalFixedCostsToRepay;
  
  // دریافتی ماهانه سرمایه‌گذار (صفر در ماه‌های میانی و کل مبلغ در انتها)
  investorMonthlyReturn = 0; 
}

// === STEP 4: RECIPIENT (سرمایه‌پذیر) CALCULATIONS ===
const recipientCash = invoiceWithVAT;
const recipientFinancingCost = recipientTotalPayment - invoiceWithVAT;

// === STEP 5: INVESTOR (سرمایه‌گذار) CALCULATIONS ===
const investorInvestment = invoiceWithVAT;
// مجموع دریافتی سرمایه‌گذار: کل پرداختی منهای کل درآمد پلتفرم
const investorTotalReturn = recipientTotalPayment - platformTotalRevenue;
const investorProfit = investorTotalReturn - investorInvestment;

// === OUTPUT ===
return {
  success: true,
  data: {
    invoice: {
      withVAT: Math.round(invoiceWithVAT),
      base: Math.round(invoiceBase),
      vat: Math.round(vatAmount)
    },
    investor: {
      initial: Math.round(investorInvestment),
      // بازگشت ماهانه سرمایه‌گذار (میانگین در پلن ۱)
      monthlyReturn: Math.round(investorMonthlyReturn), 
      totalReturn: Math.round(investorTotalReturn),
      profit: Math.round(investorProfit)
    },
    recipient: {
      cash: Math.round(recipientCash),
      // قسط ماهانه (میانگین در پلن ۱)
      monthlyInstallment: Math.round(monthlyInstallment), 
      totalPayment: Math.round(recipientTotalPayment),
      financingCost: Math.round(recipientFinancingCost)
    },
    platform: {
      platformFee: Math.round(platformFeeAmount),
      collateral: Math.round(collateralAmount),
      totalBase: Math.round(platformFeeAmount + collateralAmount),
      // این خروجی جدید، مجموع درآمد پلتفرم (با VAT) را نشان می‌دهد
      totalRevenue: Math.round(platformTotalRevenue),
      // سهم ماهانه درآمد پلتفرم (برای تفکیک در هر ماه)
      monthlyRevenue: Math.round(platformMonthlyRevenue) 
    },
    summary: {
      planName: plan.name,
      duration: duration,
      monthlyRate: monthlyRatePercent,
      paymentType: plan.paymentType
    }
  }
};
