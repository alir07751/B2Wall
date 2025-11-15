import React, { useState, useEffect } from 'react';
import { formatInputValue, parseNumber, formatToman, convertPersianToEnglish, formatNumberPersian } from '../utils/currencyFormatter';

/**
 * Dynamic input form component for loan calculator
 * Handles all user inputs with validation and visual feedback
 */
function InputForm({ onSubmit, isLoading }) {
  const [loanAmount, setLoanAmount] = useState('');
  const [monthlyInterestRate, setMonthlyInterestRate] = useState('');
  const [principalRepayments, setPrincipalRepayments] = useState([
    { days: '', amount: '' }
  ]);
  const [interestPaymentDates, setInterestPaymentDates] = useState(['']);
  const [autoMode, setAutoMode] = useState(false);
  const [numberOfPayments, setNumberOfPayments] = useState('');
  const [paymentInterval, setPaymentInterval] = useState('30'); // days
  const [autoInterestMode, setAutoInterestMode] = useState(false);
  const [numberOfInterestPayments, setNumberOfInterestPayments] = useState('');
  const [interestPaymentInterval, setInterestPaymentInterval] = useState('30'); // days
  
  const [errors, setErrors] = useState({});
  const [totalPrincipalEntered, setTotalPrincipalEntered] = useState(0);
  const [estimatedInterest, setEstimatedInterest] = useState(0);
  
  // Calculate total principal entered
  useEffect(() => {
    const total = principalRepayments.reduce((sum, pr) => {
      return sum + parseNumber(pr.amount);
    }, 0);
    setTotalPrincipalEntered(total);
  }, [principalRepayments]);
  
  // Calculate estimated interest preview
  useEffect(() => {
    const loanAmountNum = parseNumber(loanAmount);
    const rateNum = parseFloat(monthlyInterestRate);
    
    if (loanAmountNum > 0 && rateNum > 0) {
      const dailyRate = rateNum / 100 / 30;
      const finalDay = interestPaymentDates.length > 0 
        ? Math.max(...interestPaymentDates.filter(d => d).map(d => parseInt(d) || 0))
        : 180; // default 6 months
      
      if (finalDay > 0) {
        // Simple estimation: average principal over time
        let remainingPrincipal = loanAmountNum;
        let totalAccrued = 0;
        
        // Account for principal repayments
        const sortedRepayments = [...principalRepayments]
          .filter(pr => pr.days && pr.amount)
          .sort((a, b) => parseInt(a.days) - parseInt(b.days));
        
        for (let day = 1; day <= finalDay; day++) {
          const dailyInterest = remainingPrincipal * dailyRate;
          totalAccrued += dailyInterest;
          
          // Check if principal payment on this day
          const repayment = sortedRepayments.find(pr => parseInt(pr.days) === day);
          if (repayment) {
            remainingPrincipal -= parseNumber(repayment.amount);
          }
        }
        
        setEstimatedInterest(totalAccrued);
      }
    } else {
      setEstimatedInterest(0);
    }
  }, [loanAmount, monthlyInterestRate, principalRepayments, interestPaymentDates]);
  
  // Auto-generate principal repayments
  useEffect(() => {
    if (autoMode && loanAmount && numberOfPayments) {
      const loanAmountNum = parseNumber(loanAmount);
      const numPayments = parseInt(convertPersianToEnglish(numberOfPayments)) || 0;
      const interval = parseInt(convertPersianToEnglish(paymentInterval)) || 30;
      
      if (loanAmountNum > 0 && numPayments > 0 && interval > 0) {
        const amountPerPayment = Math.floor(loanAmountNum / numPayments);
        const remainder = loanAmountNum - (amountPerPayment * numPayments);
        
        const newRepayments = [];
        for (let i = 0; i < numPayments; i++) {
          const days = (i + 1) * interval;
          const amount = i === numPayments - 1 
            ? amountPerPayment + remainder // Last payment gets remainder
            : amountPerPayment;
          
          newRepayments.push({
            days: days.toString(),
            amount: formatInputValue(amount.toString())
          });
        }
        
        setPrincipalRepayments(newRepayments);
      }
    }
  }, [autoMode, loanAmount, numberOfPayments, paymentInterval]);
  
  // Auto-generate interest payment dates
  useEffect(() => {
    if (autoInterestMode && numberOfInterestPayments) {
      const numPayments = parseInt(convertPersianToEnglish(numberOfInterestPayments)) || 0;
      const interval = parseInt(convertPersianToEnglish(interestPaymentInterval)) || 30;
      
      if (numPayments > 0 && interval > 0) {
        const newDates = [];
        for (let i = 0; i < numPayments; i++) {
          const days = (i + 1) * interval;
          newDates.push(days.toString());
        }
        
        setInterestPaymentDates(newDates);
      }
    }
  }, [autoInterestMode, numberOfInterestPayments, interestPaymentInterval]);
  
  // Validation
  const validateForm = () => {
    const newErrors = {};
    
    const loanAmountNum = parseNumber(loanAmount);
    if (!loanAmount || loanAmountNum <= 0) {
      newErrors.loanAmount = 'مبلغ وام باید مثبت باشد';
    }
    
    const rateNum = parseFloat(monthlyInterestRate);
    if (!monthlyInterestRate || rateNum <= 0 || rateNum > 100) {
      newErrors.monthlyInterestRate = 'نرخ سود باید بین 0 تا 100 درصد باشد';
    }
    
    // Validate principal repayments
    principalRepayments.forEach((pr, index) => {
      if (!pr.days || parseInt(convertPersianToEnglish(pr.days)) <= 0) {
        newErrors[`principalDays_${index}`] = 'روز باید مثبت باشد';
      }
      if (!pr.amount || parseNumber(pr.amount) <= 0) {
        newErrors[`principalAmount_${index}`] = 'مبلغ باید مثبت باشد';
      }
    });
    
    // Validate interest payment dates
    interestPaymentDates.forEach((date, index) => {
      if (!date || parseInt(convertPersianToEnglish(date)) <= 0) {
        newErrors[`interestDate_${index}`] = 'روز باید مثبت باشد';
      }
    });
    
    // Check if total principal equals loan amount
    if (loanAmountNum > 0 && Math.abs(totalPrincipalEntered - loanAmountNum) > 1) {
      newErrors.totalPrincipal = `مجموع پرداخت‌های اصل پول (${formatToman(totalPrincipalEntered)}) باید برابر با مبلغ وام (${formatToman(loanAmountNum)}) باشد`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleLoanAmountChange = (e) => {
    const formatted = formatInputValue(e.target.value);
    setLoanAmount(formatted);
    if (errors.loanAmount) {
      setErrors({ ...errors, loanAmount: null });
    }
  };
  
  const handleMonthlyRateChange = (e) => {
    let value = e.target.value;
    // Convert Persian digits to English
    value = convertPersianToEnglish(value);
    // Allow decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMonthlyInterestRate(value);
      if (errors.monthlyInterestRate) {
        setErrors({ ...errors, monthlyInterestRate: null });
      }
    }
  };
  
  const handlePrincipalRepaymentChange = (index, field, value) => {
    const updated = [...principalRepayments];
    if (field === 'amount') {
      updated[index][field] = formatInputValue(value);
    } else {
      // Convert Persian digits and keep only numbers
      const englishValue = convertPersianToEnglish(value);
      updated[index][field] = englishValue.replace(/[^\d]/g, '');
    }
    setPrincipalRepayments(updated);
    
    // Clear related errors
    const errorKey = `principal${field === 'days' ? 'Days' : 'Amount'}_${index}`;
    if (errors[errorKey]) {
      setErrors({ ...errors, [errorKey]: null });
    }
  };
  
  const handleInterestDateChange = (index, value) => {
    const updated = [...interestPaymentDates];
    // Convert Persian digits and keep only numbers
    const englishValue = convertPersianToEnglish(value);
    updated[index] = englishValue.replace(/[^\d]/g, '');
    setInterestPaymentDates(updated);
    
    if (errors[`interestDate_${index}`]) {
      setErrors({ ...errors, [`interestDate_${index}`]: null });
    }
  };
  
  const addPrincipalRepayment = () => {
    setPrincipalRepayments([...principalRepayments, { days: '', amount: '' }]);
  };
  
  const removePrincipalRepayment = (index) => {
    if (principalRepayments.length > 1) {
      setPrincipalRepayments(principalRepayments.filter((_, i) => i !== index));
    }
  };
  
  const addInterestPaymentDate = () => {
    setInterestPaymentDates([...interestPaymentDates, '']);
  };
  
  const removeInterestPaymentDate = (index) => {
    if (interestPaymentDates.length > 1) {
      setInterestPaymentDates(interestPaymentDates.filter((_, i) => i !== index));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const inputData = {
      LoanAmount: parseNumber(loanAmount),
      MonthlyInterestRate: parseFloat(monthlyInterestRate),
      PrincipalRepayments: principalRepayments
        .filter(pr => pr.days && pr.amount)
        .map(pr => ({
          days: parseInt(convertPersianToEnglish(pr.days)),
          amount: parseNumber(pr.amount)
        })),
      InterestPaymentDates: interestPaymentDates
        .filter(date => date)
        .map(date => parseInt(convertPersianToEnglish(date)))
    };
    
    onSubmit(inputData);
  };
  
  const loanAmountNum = parseNumber(loanAmount);
  const isPrincipalMatch = loanAmountNum > 0 && 
    Math.abs(totalPrincipalEntered - loanAmountNum) <= 1;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Loan Amount Input */}
      <div className="card p-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          مبلغ وام
          <span className="text-red-500 mr-1">*</span>
        </label>
        <input
          type="text"
          value={loanAmount}
          onChange={handleLoanAmountChange}
          placeholder="مبلغ وام را وارد کنید"
          className={`input-clean w-full ${errors.loanAmount ? 'border-red-500' : ''}`}
          dir="ltr"
          style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}
        />
        {loanAmount && (
          <div className="mt-2 text-sm font-semibold text-blue-600" dir="rtl" style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}>
            {formatNumberPersian(parseNumber(loanAmount))} تومان
          </div>
        )}
        {errors.loanAmount && (
          <p className="text-red-500 text-sm mt-1">{errors.loanAmount}</p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          💡 نکته: مبلغ کل وام را وارد کنید (می‌توانید اعداد فارسی یا انگلیسی تایپ کنید)
        </p>
      </div>
      
      {/* Monthly Interest Rate Input */}
      <div className="card p-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          نرخ سود ماهیانه
          <span className="text-red-500 mr-1">*</span>
        </label>
        <input
          type="text"
          value={monthlyInterestRate}
          onChange={handleMonthlyRateChange}
          placeholder="نرخ سود را وارد کنید"
          className={`input-clean w-full ${errors.monthlyInterestRate ? 'border-red-500' : ''}`}
          dir="ltr"
          style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}
        />
        {errors.monthlyInterestRate && (
          <p className="text-red-500 text-sm mt-1">{errors.monthlyInterestRate}</p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          💡 نکته: نرخ سود به صورت درصد ماهیانه (مثال: 4.5 برای 4.5%)
        </p>
      </div>
      
      {/* Estimated Interest Preview */}
      {estimatedInterest > 0 && (
        <div className="card p-4 bg-amber-50 border border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-900">
              💰 پیش‌نمایش سود تقریبی:
            </span>
            <span className="text-lg font-bold text-amber-700" dir="ltr" style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}>
              {formatNumberPersian(Math.round(estimatedInterest))} تومان
            </span>
          </div>
          <p className="text-xs text-amber-700 mt-1">
            این مبلغ تقریبی است و پس از محاسبه دقیق ممکن است تغییر کند
          </p>
        </div>
      )}
      
      {/* Principal Repayments Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-semibold text-slate-700">
            پرداخت‌های اصل پول
            <span className="text-red-500 mr-1">*</span>
          </label>
          {!autoMode && (
            <button
              type="button"
              onClick={addPrincipalRepayment}
              className="btn btn-secondary text-sm py-2 px-4"
            >
              + اضافه کردن
            </button>
          )}
        </div>
        
        {/* Auto Mode Toggle for Principal */}
        <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoMode}
              onChange={(e) => setAutoMode(e.target.checked)}
              className="ml-3 w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-semibold text-slate-900">تقسیم خودکار اصل پول</span>
          </label>
          <p className="text-xs text-slate-600 mt-1 mr-7">
            با فعال کردن این گزینه، سیستم به صورت خودکار اصل پول را تقسیم می‌کند
          </p>
          
          {autoMode && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">تعداد پرداخت‌ها</label>
                <input
                  type="text"
                  value={numberOfPayments}
                  onChange={(e) => setNumberOfPayments(convertPersianToEnglish(e.target.value).replace(/[^\d]/g, ''))}
                  placeholder="مثال: 4"
                  className="input-clean"
                  dir="ltr"
                  style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">فاصله بین پرداخت‌ها (روز)</label>
                <input
                  type="text"
                  value={paymentInterval}
                  onChange={(e) => setPaymentInterval(convertPersianToEnglish(e.target.value).replace(/[^\d]/g, ''))}
                  placeholder="مثال: 30"
                  className="input-clean"
                  dir="ltr"
                  style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {principalRepayments.map((pr, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-xs text-slate-600 mb-1">روز</label>
                <input
                  type="text"
                  value={pr.days}
                  onChange={(e) => handlePrincipalRepaymentChange(index, 'days', e.target.value)}
                  placeholder="مثال: 60"
                  className={`input-clean ${errors[`principalDays_${index}`] ? 'border-red-500' : ''}`}
                  dir="ltr"
                  style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}
                  disabled={autoMode}
                />
                {errors[`principalDays_${index}`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`principalDays_${index}`]}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-600 mb-1">مبلغ</label>
                <input
                  type="text"
                  value={pr.amount}
                  onChange={(e) => handlePrincipalRepaymentChange(index, 'amount', e.target.value)}
                  placeholder="مبلغ را وارد کنید"
                  className={`input-clean ${errors[`principalAmount_${index}`] ? 'border-red-500' : ''}`}
                  dir="ltr"
                  style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}
                  disabled={autoMode}
                />
                {pr.amount && (
                  <div className="mt-1 text-xs font-semibold text-blue-600" dir="rtl" style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}>
                    {formatNumberPersian(parseNumber(pr.amount))} تومان
                  </div>
                )}
                {errors[`principalAmount_${index}`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`principalAmount_${index}`]}</p>
                )}
              </div>
              {!autoMode && principalRepayments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePrincipalRepayment(index)}
                  className="mt-6 text-red-500 hover:text-red-700 font-bold text-xl"
                  title="حذف"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Total Principal Validation */}
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              مجموع پرداخت‌های اصل پول:
            </span>
            <span className={`text-lg font-bold ${isPrincipalMatch ? 'text-green-600' : 'text-red-600'}`} dir="ltr" style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}>
              {formatNumberPersian(totalPrincipalEntered)} تومان
            </span>
          </div>
          {loanAmountNum > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-slate-600">مبلغ وام:</span>
              <span className="text-sm font-semibold text-slate-700" dir="ltr" style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}>
                {formatNumberPersian(loanAmountNum)} تومان
              </span>
            </div>
          )}
          {errors.totalPrincipal && (
            <p className="text-red-500 text-sm mt-2">{errors.totalPrincipal}</p>
          )}
          {isPrincipalMatch && loanAmountNum > 0 && (
            <p className="text-green-600 text-sm mt-2">✓ مجموع پرداخت‌ها با مبلغ وام مطابقت دارد</p>
          )}
        </div>
      </div>
      
      {/* Interest Payment Dates Section */}
      <div className="card p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-slate-700">
              تاریخ‌های پرداخت سود
              <span className="text-red-500 mr-1">*</span>
            </label>
            {!autoInterestMode && (
              <button
                type="button"
                onClick={addInterestPaymentDate}
                className="btn btn-secondary text-sm py-2 px-4"
              >
                + اضافه کردن
              </button>
            )}
          </div>
          
          {/* Auto Interest Mode Toggle */}
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoInterestMode}
                onChange={(e) => setAutoInterestMode(e.target.checked)}
                className="ml-3 w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm font-semibold text-slate-900">تقسیم خودکار تاریخ‌های پرداخت سود</span>
            </label>
            <p className="text-xs text-slate-600 mt-1 mr-7">
              با فعال کردن این گزینه، سیستم به صورت خودکار تاریخ‌های پرداخت سود را تقسیم می‌کند
            </p>
          </div>
          
          {autoInterestMode && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">تعداد پرداخت‌ها</label>
                <input
                  type="text"
                  value={numberOfInterestPayments}
                  onChange={(e) => setNumberOfInterestPayments(convertPersianToEnglish(e.target.value).replace(/[^\d]/g, ''))}
                  placeholder="مثال: 2"
                  className="input-clean"
                  dir="ltr"
                  style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">فاصله بین پرداخت‌ها (روز)</label>
                <input
                  type="text"
                  value={interestPaymentInterval}
                  onChange={(e) => setInterestPaymentInterval(convertPersianToEnglish(e.target.value).replace(/[^\d]/g, ''))}
                  placeholder="مثال: 90"
                  className="input-clean"
                  dir="ltr"
                  style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {interestPaymentDates.map((date, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-xs text-slate-600 mb-1">روز</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => handleInterestDateChange(index, e.target.value)}
                  placeholder="مثال: 180"
                  className={`input-clean ${errors[`interestDate_${index}`] ? 'border-red-500' : ''}`}
                  dir="ltr"
                  style={{ fontFamily: 'Vazirmatn', fontFeatureSettings: '"tnum"' }}
                  disabled={autoInterestMode}
                />
                {errors[`interestDate_${index}`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`interestDate_${index}`]}</p>
                )}
              </div>
              {!autoInterestMode && interestPaymentDates.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInterestPaymentDate(index)}
                  className="mt-6 text-red-500 hover:text-red-700 font-bold text-xl"
                  title="حذف"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        
        <p className="text-xs text-slate-500 mt-4">
          💡 نکته: در این روزها، تمام سود انباشته شده تا آن روز پرداخت می‌شود
        </p>
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isLoading}
          className={`btn btn-primary text-lg py-4 px-8 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              در حال محاسبه...
            </>
          ) : (
            <>
              <span className="mr-2">📊</span>
              محاسبه جدول بازپرداخت
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default InputForm;
