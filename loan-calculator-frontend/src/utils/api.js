/**
 * API integration layer for n8n backend
 * Handles communication with the n8n workflow endpoint
 */

/**
 * Calculate repayment schedule by calling n8n workflow
 * @param {Object} inputData - Input data for calculation
 * @param {number} inputData.LoanAmount - Total loan amount
 * @param {number} inputData.MonthlyInterestRate - Monthly interest rate (%)
 * @param {Array} inputData.PrincipalRepayments - Array of {days, amount}
 * @param {Array} inputData.InterestPaymentDates - Array of day numbers
 * @returns {Promise<Object>} Calculation result
 */
export async function calculateRepaymentSchedule(inputData) {
  // n8n webhook URL for loan calculator
  const N8N_WEBHOOK_URL = process.env.REACT_APP_N8N_WEBHOOK_URL || 
    'https://n8nb2wall.darkube.app/webhook/internal-calculator';
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || data.error || 'خطا در محاسبه');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    
    // For development: fallback to local calculation
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using local calculation fallback');
      return calculateLocally(inputData);
    }
    
    throw error;
  }
}

/**
 * Local calculation fallback (for development/testing)
 * This mirrors the n8n backend logic
 */
function calculateLocally(inputData) {
  const { LoanAmount, MonthlyInterestRate, PrincipalRepayments, InterestPaymentDates } = inputData;
  
  const dailyRate = MonthlyInterestRate / 100 / 30;
  const sortedPrincipalRepayments = [...PrincipalRepayments].sort((a, b) => a.days - b.days);
  const sortedInterestDates = [...InterestPaymentDates].sort((a, b) => a - b);
  
  const finalDay = Math.max(
    sortedPrincipalRepayments.length > 0 
      ? Math.max(...sortedPrincipalRepayments.map(pr => pr.days)) 
      : 0,
    sortedInterestDates.length > 0 
      ? Math.max(...sortedInterestDates) 
      : 0
  );
  
  let remainingPrincipal = LoanAmount;
  let totalAccruedInterest = 0;
  let principalRepaymentIndex = 0;
  let interestPaymentIndex = 0;
  const schedule = [];
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let totalPayments = 0;
  
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
    
    const dailyInterest = remainingPrincipal * dailyRate;
    totalAccruedInterest += dailyInterest;
    
    if (principalRepaymentIndex < sortedPrincipalRepayments.length && 
        sortedPrincipalRepayments[principalRepaymentIndex].days === day) {
      const principalAmount = sortedPrincipalRepayments[principalRepaymentIndex].amount;
      dayRecord.principalPayment = principalAmount;
      remainingPrincipal -= principalAmount;
      totalPrincipalPaid += principalAmount;
      dayRecord.remainingPrincipalAfter = remainingPrincipal;
      dayRecord.description = 'پرداخت بخشی از اصل وام';
      principalRepaymentIndex++;
    }
    
    if (interestPaymentIndex < sortedInterestDates.length && 
        sortedInterestDates[interestPaymentIndex] === day) {
      dayRecord.interestPayment = totalAccruedInterest;
      totalInterestPaid += totalAccruedInterest;
      totalAccruedInterest = 0;
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
  
  return {
    success: true,
    schedule: schedule.map(day => ({
      روز: day.day,
      'اصل پول باقی‌مانده (قبل از پرداخت)': day.remainingPrincipalBefore,
      'مبلغ پرداخت اصل پول': day.principalPayment,
      'سود انباشته پرداخت شده': day.interestPayment,
      'مبلغ کل پرداختی در این روز': day.totalPayment,
      'توضیحات': day.description,
      _raw: day
    })),
    summary: {
      'مبلغ کل وام': LoanAmount,
      'نرخ سود ماهیانه': `${MonthlyInterestRate}%`,
      'نرخ سود روزانه': `${(dailyRate * 100).toFixed(4)}%`,
      'تعداد روزهای دوره': finalDay,
      'مجموع اصل پول پرداخت شده': totalPrincipalPaid,
      'مجموع سود پرداخت شده': totalInterestPaid,
      'مجموع کل پرداخت‌ها': totalPayments,
      'هزینه کل وام (سود)': totalInterestPaid,
      _raw: {
        totalPrincipalPaid,
        totalInterestPaid,
        totalPayments,
        finalDay
      }
    }
  };
}

