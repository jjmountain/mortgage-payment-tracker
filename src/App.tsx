import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MortgageCalculator } from './components/MortgageCalculator';
import { PaymentTracker } from './components/PaymentTracker';
import { ExpenseTracker } from './components/ExpenseTracker';

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
}

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Calculator
            </Link>
            <Link
              to="/payments"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/payments') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Payment Tracker
            </Link>
            <Link
              to="/expenses"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/expenses') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Expense Tracker
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [schedule, setSchedule] = useState<MonthlyPayment[]>([]);

  const calculatePaymentStatus = (scheduleDate: string, scheduledAmount: number): 'onTrack' | 'behind' | 'ahead' => {
    // This is a placeholder implementation. In a real app, you would compare
    // the scheduled amount with actual payments made on or before the schedule date
    return 'onTrack';
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="py-8">
          <Routes>
            <Route path="/" element={<MortgageCalculator onScheduleUpdate={setSchedule} />} />
            <Route path="/payments" element={<PaymentTracker schedule={schedule} calculatePaymentStatus={calculatePaymentStatus} />} />
            <Route path="/expenses" element={<ExpenseTracker />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;