import React from 'react';
import { formatToman } from '../utils/currencyFormatter';

/**
 * Results display component
 * Shows summary statistics and detailed repayment schedule table
 */
function ResultsDisplay({ result, onReset }) {
  if (!result || !result.success) {
    return null;
  }
  
  const { schedule, summary } = result;
  const summaryRaw = summary._raw || {};
  
  // Filter schedule to show only days with payments (plus first and last day)
  const paymentDays = schedule.filter(day => {
    const raw = day._raw || {};
    return raw.principalPayment > 0 || raw.interestPayment > 0;
  });
  
  const firstDay = schedule[0];
  const lastDay = schedule[schedule.length - 1];
  
  const daysToShow = [
    firstDay,
    ...paymentDays,
    lastDay
  ].filter((day, index, self) => 
    index === self.findIndex(d => d.روز === day.روز)
  ).sort((a, b) => a.روز - b.روز);
  
  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="card p-6 bg-gradient-to-l from-blue-50 to-indigo-50 border-2 border-blue-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <span className="ml-3">📊</span>
          خلاصه اطلاعات بازپرداخت
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="text-sm text-slate-600 mb-1">کل سود قابل پرداخت</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatToman(summaryRaw.totalInterestPaid || 0)}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="text-sm text-slate-600 mb-1">کل مبلغ بازپرداخت</div>
            <div className="text-2xl font-bold text-indigo-600">
              {formatToman(summaryRaw.totalPayments || 0)}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="text-sm text-slate-600 mb-1">مدت زمان بازپرداخت</div>
            <div className="text-2xl font-bold text-purple-600">
              {summaryRaw.finalDay || 0} روز
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="text-sm text-slate-600 mb-1">اصل پول پرداخت شده</div>
            <div className="text-2xl font-bold text-green-600">
              {formatToman(summaryRaw.totalPrincipalPaid || 0)}
            </div>
          </div>
        </div>
        
        {/* Additional Summary Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-slate-600">مبلغ کل وام:</span>
            <span className="font-semibold text-slate-900">
              {summary['مبلغ کل وام'] ? formatToman(summary['مبلغ کل وام']) : '-'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-slate-600">نرخ سود ماهیانه:</span>
            <span className="font-semibold text-slate-900">
              {summary['نرخ سود ماهیانه'] || '-'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Detailed Table Section */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <span className="ml-3">📋</span>
          جدول تفصیلی برنامه بازپرداخت
        </h2>
        
        {/* Responsive Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 border-b-2 border-slate-200">
                  روز
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 border-b-2 border-slate-200">
                  اصل پول باقی‌مانده (قبل از پرداخت)
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 border-b-2 border-slate-200">
                  مبلغ پرداخت اصل پول
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 border-b-2 border-slate-200">
                  سود انباشته پرداخت شده
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 border-b-2 border-slate-200">
                  مبلغ کل پرداختی در این روز
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 border-b-2 border-slate-200">
                  توضیحات
                </th>
              </tr>
            </thead>
            <tbody>
              {daysToShow.map((day, index) => {
                const raw = day._raw || {};
                const isPaymentDay = raw.principalPayment > 0 || raw.interestPayment > 0;
                const rowClass = isPaymentDay 
                  ? 'bg-blue-50 hover:bg-blue-100' 
                  : index % 2 === 0 
                    ? 'bg-white' 
                    : 'bg-slate-50';
                
                return (
                  <tr key={day.روز} className={`${rowClass} transition-colors`}>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 border-b border-slate-200">
                      {day.روز}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-200" dir="ltr">
                      {formatToman(raw.remainingPrincipalBefore || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-200" dir="ltr">
                      {raw.principalPayment > 0 ? (
                        <span className="font-semibold text-green-600">
                          {formatToman(raw.principalPayment)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-200" dir="ltr">
                      {raw.interestPayment > 0 ? (
                        <span className="font-semibold text-orange-600">
                          {formatToman(raw.interestPayment)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 border-b border-slate-200" dir="ltr">
                      {raw.totalPayment > 0 ? (
                        <span className="text-blue-600">
                          {formatToman(raw.totalPayment)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-200">
                      {day.توضیحات}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {daysToShow.length < schedule.length && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <strong>نکته:</strong> این جدول فقط روزهای دارای پرداخت را نمایش می‌دهد. 
            در مجموع {schedule.length} روز در برنامه بازپرداخت وجود دارد.
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onReset}
          className="btn btn-secondary"
        >
          محاسبه جدید
        </button>
        <button
          onClick={() => window.print()}
          className="btn btn-primary"
        >
          چاپ گزارش
        </button>
      </div>
    </div>
  );
}

export default ResultsDisplay;

