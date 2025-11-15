import React, { useState, useEffect } from 'react';
import { formatInputValue, parseNumber, formatToman } from '../utils/currencyFormatter';

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
  
  const [errors, setErrors] = useState({});
  const [totalPrincipalEntered, setTotalPrincipalEntered] = useState(0);
  
  // Calculate total principal entered
  useEffect(() => {
    const total = principalRepayments.reduce((sum, pr) => {
      return sum + parseNumber(pr.amount);
    }, 0);
    setTotalPrincipalEntered(total);
  }, [principalRepayments]);
  
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
      if (!pr.days || parseInt(pr.days) <= 0) {
        newErrors[`principalDays_${index}`] = 'روز باید مثبت باشد';
      }
      if (!pr.amount || parseNumber(pr.amount) <= 0) {
        newErrors[`principalAmount_${index}`] = 'مبلغ باید مثبت باشد';
      }
    });
    
    // Validate interest payment dates
    interestPaymentDates.forEach((date, index) => {
      if (!date || parseInt(date) <= 0) {
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
    const value = e.target.value;
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
      updated[index][field] = value.replace(/[^\d]/g, '');
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
    updated[index] = value.replace(/[^\d]/g, '');
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
          days: parseInt(pr.days),
          amount: parseNumber(pr.amount)
        })),
      InterestPaymentDates: interestPaymentDates
        .filter(date => date)
        .map(date => parseInt(date))
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
          مبلغ وام (تومان)
          <span className="text-red-500 mr-1">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={loanAmount}
            onChange={handleLoanAmountChange}
            placeholder="مثال: 330,000,000"
            className={`input-clean w-full ${errors.loanAmount ? 'border-red-500' : ''}`}
            dir="ltr"
          />
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-semibold">
            تومان
          </span>
        </div>
        {errors.loanAmount && (
          <p className="text-red-500 text-sm mt-1">{errors.loanAmount}</p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          💡 نکته: مبلغ کل وام را وارد کنید
        </p>
      </div>
      
      {/* Monthly Interest Rate Input */}
      <div className="card p-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          نرخ سود ماهیانه (%)
          <span className="text-red-500 mr-1">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={monthlyInterestRate}
            onChange={handleMonthlyRateChange}
            placeholder="مثال: 4.5"
            className={`input-clean w-full ${errors.monthlyInterestRate ? 'border-red-500' : ''}`}
            dir="ltr"
          />
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 font-semibold">
            %
          </span>
        </div>
        {errors.monthlyInterestRate && (
          <p className="text-red-500 text-sm mt-1">{errors.monthlyInterestRate}</p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          💡 نکته: نرخ سود به صورت درصد ماهیانه (مثال: 4.5 برای 4.5%)
        </p>
      </div>
      
      {/* Principal Repayments Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-semibold text-slate-700">
            پرداخت‌های اصل پول
            <span className="text-red-500 mr-1">*</span>
          </label>
          <button
            type="button"
            onClick={addPrincipalRepayment}
            className="btn btn-secondary text-sm py-2 px-4"
          >
            + اضافه کردن
          </button>
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
                />
                {errors[`principalDays_${index}`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`principalDays_${index}`]}</p>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-600 mb-1">مبلغ (تومان)</label>
                <input
                  type="text"
                  value={pr.amount}
                  onChange={(e) => handlePrincipalRepaymentChange(index, 'amount', e.target.value)}
                  placeholder="مثال: 30,000,000"
                  className={`input-clean ${errors[`principalAmount_${index}`] ? 'border-red-500' : ''}`}
                  dir="ltr"
                />
                {errors[`principalAmount_${index}`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`principalAmount_${index}`]}</p>
                )}
              </div>
              {principalRepayments.length > 1 && (
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
            <span className={`text-lg font-bold ${isPrincipalMatch ? 'text-green-600' : 'text-red-600'}`}>
              {formatToman(totalPrincipalEntered)}
            </span>
          </div>
          {loanAmountNum > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-slate-600">مبلغ وام:</span>
              <span className="text-sm font-semibold text-slate-700">
                {formatToman(loanAmountNum)}
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
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-semibold text-slate-700">
            تاریخ‌های پرداخت سود
            <span className="text-red-500 mr-1">*</span>
          </label>
          <button
            type="button"
            onClick={addInterestPaymentDate}
            className="btn btn-secondary text-sm py-2 px-4"
          >
            + اضافه کردن
          </button>
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
                />
                {errors[`interestDate_${index}`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`interestDate_${index}`]}</p>
                )}
              </div>
              {interestPaymentDates.length > 1 && (
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

