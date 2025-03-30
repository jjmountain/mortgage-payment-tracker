import React, { useState, useMemo } from 'react';
import { PaymentModal } from './PaymentModal';

interface ActualPayment {
  date: string;
  amount: number;
  isOverpayment: boolean;
  note?: string;
}

interface MonthlyPayment {
  month: number;
  date: string;
  payment: string;
  principal: string;
  interest: string;
  totalInterest: string;
  balance: string;
  regularPayment: string;
  overpayment: string;
  rate: string;
  cashFlow: string;
  actualPayment?: ActualPayment;
  paymentStatus?: 'onTrack' | 'behind' | 'ahead';
}

interface PaymentTrackerProps {
  schedule: MonthlyPayment[];
  calculatePaymentStatus: (scheduleDate: string, scheduledAmount: number) => 'onTrack' | 'behind' | 'ahead';
}

export const PaymentTracker: React.FC<PaymentTrackerProps> = ({ schedule, calculatePaymentStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actualPayments, setActualPayments] = useState<ActualPayment[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [newPayment, setNewPayment] = useState<{
    date: string;
    amount: number;
    isOverpayment: boolean;
    note: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    isOverpayment: false,
    note: ''
  });

  // Group schedule by year
  const scheduleByYear = useMemo(() => {
    const grouped = new Map<number, MonthlyPayment[]>();
    schedule.forEach(payment => {
      const year = new Date(payment.date).getFullYear();
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)?.push(payment);
    });
    return grouped;
  }, [schedule]);

  // Get unique years from schedule
  const years = useMemo(() => {
    return Array.from(scheduleByYear.keys()).sort();
  }, [scheduleByYear]);

  // Set initial selected year if not in range
  React.useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const addPayment = () => {
    // Check if this is an overpayment
    if (newPayment.isOverpayment) {
      // Get the current year's payments
      const paymentYear = new Date(newPayment.date).getFullYear();
      const yearSchedule = scheduleByYear.get(paymentYear);
      
      if (yearSchedule) {
        // Get the starting balance for the year
        const startingBalance = parseFloat(yearSchedule[0].balance);
        
        // Calculate total overpayments for this year including the new payment
        const yearOverpayments = actualPayments
          .filter(p => p.isOverpayment && new Date(p.date).getFullYear() === paymentYear)
          .reduce((sum, p) => sum + p.amount, 0) + newPayment.amount;
        
        // Check if total overpayments would exceed 20% of starting balance
        const maxOverpayment = startingBalance * 0.2;
        if (yearOverpayments > maxOverpayment) {
          alert(`Cannot add this overpayment. The maximum allowed overpayment for ${paymentYear} is £${maxOverpayment.toFixed(2)} (20% of £${startingBalance.toFixed(2)}). You have already used £${(yearOverpayments - newPayment.amount).toFixed(2)}.`);
          return;
        }
      }
    }

    setActualPayments([...actualPayments, {
      date: newPayment.date,
      amount: newPayment.amount,
      isOverpayment: newPayment.isOverpayment,
      note: newPayment.note
    }]);
    
    setNewPayment({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      isOverpayment: false,
      note: ''
    });
    
    setIsModalOpen(false);
  };

  const paymentStats = {
    totalPaid: actualPayments.reduce((sum, payment) => sum + payment.amount, 0),
    totalOverpayments: actualPayments
      .filter(p => p.isOverpayment)
      .reduce((sum, payment) => sum + payment.amount, 0),
    totalRegularPayments: actualPayments
      .filter(p => !p.isOverpayment)
      .reduce((sum, payment) => sum + payment.amount, 0),
    paymentsMade: actualPayments.length,
    // Add remaining overpayment allowance for current year
    remainingOverpaymentAllowance: useMemo(() => {
      const currentYear = selectedYear;
      const yearSchedule = scheduleByYear.get(currentYear);
      if (!yearSchedule) return 0;

      const startingBalance = parseFloat(yearSchedule[0].balance);
      const maxOverpayment = startingBalance * 0.2;
      const usedOverpayment = actualPayments
        .filter(p => p.isOverpayment && new Date(p.date).getFullYear() === currentYear)
        .reduce((sum, p) => sum + p.amount, 0);

      return Math.max(0, maxOverpayment - usedOverpayment);
    }, [selectedYear, scheduleByYear, actualPayments])
  };

  return (
    <div className="w-[1200px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Payment Tracker</h1>
      
      <div className="mb-8 bg-yellow-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-xl">Payment Progress</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center"
          >
            <span className="mr-2">+</span> Add Payment
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow space-y-2">
            <h3 className="font-semibold mb-2">Payment Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-lg font-bold">£{paymentStats.totalPaid.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-gray-600">Overpayments</p>
                <p className="text-lg font-bold text-green-600">£{paymentStats.totalOverpayments.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-sm text-gray-600">Regular Payments</p>
                <p className="text-lg font-bold">£{paymentStats.totalRegularPayments.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Payments Made</p>
                <p className="text-lg font-bold">{paymentStats.paymentsMade}</p>
              </div>
              <div className="col-span-2 bg-yellow-50 p-3 rounded">
                <p className="text-sm text-gray-600">Remaining {selectedYear} Overpayment Allowance</p>
                <p className="text-lg font-bold text-yellow-700">£{paymentStats.remainingOverpaymentAllowance.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Maximum 20% of outstanding balance per year</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Recent Payments</h3>
            <div className="max-h-[200px] overflow-y-auto">
              {actualPayments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No payments recorded yet</p>
              ) : (
                actualPayments.slice().reverse().map((payment, index) => (
                  <div key={index} className="text-sm border-b py-2 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{new Date(payment.date).toLocaleDateString()}</span>
                      <span className={`font-semibold ${payment.isOverpayment ? 'text-green-600' : ''}`}>
                        £{payment.amount.toFixed(2)}
                      </span>
                    </div>
                    {payment.note && (
                      <div className="text-gray-500 text-xs mt-1">{payment.note}</div>
                    )}
                    <div className="text-xs mt-1">
                      <span className={`px-2 py-1 rounded ${payment.isOverpayment ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {payment.isOverpayment ? 'Overpayment' : 'Regular Payment'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-xl">Payment Schedule</h2>
          <div className="flex flex-wrap gap-2">
            {years.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedYear === year
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-50 text-gray-600 uppercase text-sm">
              <th className="py-2 px-4 text-left">MONTH</th>
              <th className="py-2 px-4 text-left">DATE</th>
              <th className="py-2 px-4 text-right">RATE</th>
              <th className="py-2 px-4 text-right">REGULAR PAYMENT</th>
              <th className="py-2 px-4 text-right">OVERPAYMENT</th>
              <th className="py-2 px-4 text-right">INTEREST</th>
              <th className="py-2 px-4 text-right">PRINCIPAL</th>
              <th className="py-2 px-4 text-right">CASH FLOW</th>
              <th className="py-2 px-4 text-right">REMAINING BALANCE</th>
              <th className="py-2 px-4 text-center">PAYMENT STATUS</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            {(scheduleByYear.get(selectedYear) || []).map(row => {
              const status = calculatePaymentStatus(row.date, parseFloat(row.payment));
              const relevantPayment = actualPayments.find(p => 
                new Date(p.date).toDateString() === new Date(row.date).toDateString()
              );
              
              return (
                <tr key={row.month} className={`border-b hover:bg-gray-50 ${
                  status === 'ahead' ? 'bg-green-50' :
                  status === 'behind' ? 'bg-red-50' :
                  status === 'onTrack' ? 'bg-blue-50' : ''
                }`}>
                  <td className="py-2 px-4">{((row.month - 1) % 12) + 1}</td>
                  <td className="py-2 px-4">{new Date(row.date).toLocaleDateString('en-GB')}</td>
                  <td className="py-2 px-4 text-right">{row.rate}%</td>
                  <td className="py-2 px-4 text-right">£{parseFloat(row.regularPayment).toFixed(2)}</td>
                  <td className="py-2 px-4 text-right">£{parseFloat(row.overpayment).toFixed(2)}</td>
                  <td className="py-2 px-4 text-right">£{parseFloat(row.interest).toFixed(2)}</td>
                  <td className="py-2 px-4 text-right">£{parseFloat(row.principal).toFixed(2)}</td>
                  <td className={`py-2 px-4 text-right ${parseFloat(row.cashFlow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    £{parseFloat(row.cashFlow).toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-right">£{parseFloat(row.balance).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="py-2 px-4 text-center">
                    {relevantPayment && (
                      <div className="text-sm mb-2">
                        <div className={relevantPayment.isOverpayment ? 'text-green-600 font-semibold' : ''}>
                          £{relevantPayment.amount.toFixed(2)}
                        </div>
                        {relevantPayment.note && (
                          <div className="text-gray-500 text-xs">{relevantPayment.note}</div>
                        )}
                      </div>
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      status === 'ahead' ? 'bg-green-100 text-green-800' :
                      status === 'behind' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        newPayment={newPayment}
        setNewPayment={setNewPayment}
        onSubmit={addPayment}
      />
    </div>
  );
}; 