import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { calculateRepaymentSchedule } from './utils/api';

/**
 * Main App Component
 * Manages state and coordinates between input form and results display
 */
function App() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleCalculate = async (inputData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const calculationResult = await calculateRepaymentSchedule(inputData);
      setResult(calculationResult);
    } catch (err) {
      setError(err.message || 'خطا در محاسبه. لطفاً دوباره تلاش کنید.');
      console.error('Calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                محاسبه‌گر بازپرداخت وام
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                برنامه‌ریزی دقیق برای بازپرداخت وام با جدول تفصیلی روز به روز
              </p>
            </div>
            <div className="hidden md:block">
              <div className="badge badge-blue">
                <span>B2Wall</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {!result ? (
          <>
            {/* Instructions Card */}
            <div className="card p-6 mb-6 bg-gradient-to-l from-indigo-50 to-blue-50 border-2 border-indigo-200">
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center">
                <span className="ml-2">ℹ️</span>
                راهنمای استفاده
              </h2>
              <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                <li>مبلغ کل وام و نرخ سود ماهیانه را وارد کنید</li>
                <li>پرداخت‌های اصل پول را با تعیین روز و مبلغ اضافه کنید</li>
                <li>تاریخ‌های پرداخت سود را مشخص کنید (در این روزها تمام سود انباشته پرداخت می‌شود)</li>
                <li>اطمینان حاصل کنید که مجموع پرداخت‌های اصل پول برابر با مبلغ وام باشد</li>
                <li>روی دکمه "محاسبه جدول بازپرداخت" کلیک کنید</li>
              </ul>
            </div>
            
            {/* Input Form */}
            <InputForm onSubmit={handleCalculate} isLoading={isLoading} />
            
            {/* Error Display */}
            {error && (
              <div className="mt-6 card p-6 bg-red-50 border-2 border-red-200">
                <div className="flex items-center">
                  <span className="text-2xl ml-3">⚠️</span>
                  <div>
                    <h3 className="font-bold text-red-900">خطا در محاسبه</h3>
                    <p className="text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <ResultsDisplay result={result} onReset={handleReset} />
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-600">
          <p>© {new Date().getFullYear()} B2Wall - محاسبه‌گر هوشمند بازپرداخت وام</p>
          <p className="mt-2 text-xs">
            تمام محاسبات بر اساس سود ساده (غیر مرکب) انجام می‌شود
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

