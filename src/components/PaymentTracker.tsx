import React, { useState } from 'react';
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

  const addPayment = () => {
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
  };

  const paymentStats = {
    totalPaid: actualPayments.reduce((sum, payment) => sum + payment.amount, 0),
    totalOverpayments: actualPayments
      .filter(p => p.isOverpayment)
      .reduce((sum, payment) => sum + payment.amount, 0),
    totalRegularPayments: actualPayments
      .filter(p => !p.isOverpayment)
      .reduce((sum, payment) => sum + payment.amount, 0),
    paymentsMade: actualPayments.length
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
        <h2 className="font-bold mb-2 text-xl">Payment Schedule</h2>
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
              <th className="py-2 px-4 text-left">Month</th>
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-right">Rate</th>
              <th className="py-2 px-4 text-right">Regular Payment</th>
              <th className="py-2 px-4 text-right">Overpayment</th>
              <th className="py-2 px-4 text-right">Interest</th>
              <th className="py-2 px-4 text-right">Principal</th>
              <th className="py-2 px-4 text-right">Cash Flow</th>
              <th className="py-2 px-4 text-right">Remaining Balance</th>
              <th className="py-2 px-4 text-right">Payment Status</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            {schedule.map(row => {
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
                  <td className="py-2 px-4">{row.month}</td>
                  <td className="py-2 px-4">{row.date}</td>
                  <td className="py-2 px-4 text-right">{row.rate}%</td>
                  <td className="py-2 px-4 text-right">£{parseFloat(row.regularPayment).toFixed(2)}</td>
                  <td className="py-2 px-4 text-right">£{parseFloat(row.overpayment).toFixed(2)}</td>
                  <td className="py-2 px-4 text-right">£{parseFloat(row.interest).toFixed(2)}</td>
                  <td className="py-2 px-4 text-right">£{parseFloat(row.principal).toFixed(2)}</td>
                  <td className={`py-2 px-4 text-right ${parseFloat(row.cashFlow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    £{parseFloat(row.cashFlow).toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-right">£{parseFloat(row.balance).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="py-2 px-4 text-right">
                    {relevantPayment && (
                      <div className="text-sm">
                        <div className={relevantPayment.isOverpayment ? 'text-green-600 font-semibold' : ''}>
                          £{relevantPayment.amount.toFixed(2)}
                        </div>
                        {relevantPayment.note && (
                          <div className="text-gray-500 text-xs">{relevantPayment.note}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right">
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