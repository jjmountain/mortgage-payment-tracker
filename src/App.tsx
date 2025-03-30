import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

// Define interfaces for TypeScript
interface InterestRatePeriod {
  rate: number;
  years: number;
  months: number;
}

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

interface YearlySummary {
  year: number;
  totalPrincipal: string;
  totalInterest: string;
  totalPayment: string;
  endBalance: string;
  averageRate: string;
  totalCashFlow: string;
}

interface RateMonthData {
  rate: number;
  months: number;
}

interface YearlyData {
  [key: number]: {
    year: number;
    totalPrincipal: number;
    totalInterest: number;
    totalPayment: number;
    endBalance: number;
    averageRate: number;
    rateTotal: number;
    months: number;
    totalCashFlow: number;
  };
}

// Add Modal Component
const PaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  newPayment: {
    date: string;
    amount: number;
    isOverpayment: boolean;
    note: string;
  };
  setNewPayment: React.Dispatch<React.SetStateAction<{
    date: string;
    amount: number;
    isOverpayment: boolean;
    note: string;
  }>>;
  onSubmit: () => void;
}> = ({ isOpen, onClose, newPayment, setNewPayment, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add New Payment</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input
              type="date"
              value={newPayment.date}
              onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Amount (£)</label>
            <input
              type="number"
              step="0.01"
              value={newPayment.amount}
              onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={newPayment.isOverpayment}
              onChange={(e) => setNewPayment({...newPayment, isOverpayment: e.target.checked})}
              className="mr-2"
            />
            <label>Is Overpayment?</label>
          </div>
          <div>
            <label className="block text-sm mb-1">Note</label>
            <input
              type="text"
              value={newPayment.note}
              onChange={(e) => setNewPayment({...newPayment, note: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="Optional note about this payment"
            />
          </div>
          
          <div className="flex space-x-2 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSubmit();
                onClose();
              }}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Add Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MortgageCalculator: React.FC = () => {
  // State for input values
  const [loanAmount, setLoanAmount] = useState<number>(80000);
  const [loanTermYears, setLoanTermYears] = useState<number>(15);
  const [monthlyOverpayment, setMonthlyOverpayment] = useState<number>(362);
  const [regularPayment, setRegularPayment] = useState<number>(627.23);
  const [firstPayment, setFirstPayment] = useState<number>(657.23);  // Includes £30 fee
  const [startDate, setStartDate] = useState<Date>(new Date(2025, 4, 1)); // May 1, 2025
  const [rentalIncome, setRentalIncome] = useState<number>(1100);
  const [serviceCharge, setServiceCharge] = useState<number>(1350);
  
  // State for interest rate periods
  const [interestRates, setInterestRates] = useState<InterestRatePeriod[]>([
    { rate: 4.97, years: 2, months: 0 },
    { rate: 5.00, years: 13, months: 0 }
  ]);
  
  // State for display options
  const [viewMode, setViewMode] = useState<'summary' | 'monthly' | 'charts'>('summary');
  const [displayYears, setDisplayYears] = useState<number>(1);
  const [chartType, setChartType] = useState<'balance' | 'payments' | 'cashflow'>('balance');
  
  // State for payment tracking
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
  
  // Calculate monthly service charge
  const monthlyServiceCharge: number = serviceCharge / 12;
  
  // Calculate monthly cash flow
  const monthlyCashFlow: number = rentalIncome - regularPayment - monthlyServiceCharge;
  
  // Calculate recommended overpayment (default to current overpayment if cash flow is negative)
  const recommendedOverpayment: number = Math.max(0, monthlyCashFlow);
  
  // Calculate annual cash flow
  const annualCashFlow: number = monthlyCashFlow * 12;
  
  // Handle interest rate updates
  const updateInterestRate = (index: number, field: keyof InterestRatePeriod, value: string): void => {
    const updatedRates = [...interestRates];
    updatedRates[index][field] = parseFloat(value);
    setInterestRates(updatedRates);
  };
  
  const addInterestRatePeriod = (): void => {
    setInterestRates([...interestRates, { rate: 5.00, years: 5, months: 0 }]);
  };
  
  const removeInterestRatePeriod = (index: number): void => {
    if (interestRates.length > 1) {
      const updatedRates = [...interestRates];
      updatedRates.splice(index, 1);
      setInterestRates(updatedRates);
    }
  };
  
  // Calculate amortization schedule with variable rates
  const calculateSchedule = (): MonthlyPayment[] => {
    let balance: number = loanAmount;
    let schedule: MonthlyPayment[] = [];
    let month: number = 1;
    let totalInterest: number = 0;
    let totalPrincipal: number = 0;
    let currentDate: Date = new Date(startDate);
    
    // Calculate how many months each rate applies for
    let rateMonths: RateMonthData[] = [];
    for (const period of interestRates) {
      const monthsInPeriod: number = (period.years * 12) + period.months;
      rateMonths.push({
        rate: period.rate / 100 / 12, // Convert annual rate to monthly
        months: monthsInPeriod
      });
    }
    
    // Get monthly rate for a specific month in the schedule
    const getMonthlyRateForMonth = (targetMonth: number): number => {
      let monthCounter: number = 0;
      for (const period of rateMonths) {
        monthCounter += period.months;
        if (targetMonth <= monthCounter) {
          return period.rate;
        }
      }
      // If we've gone beyond defined periods, use the last rate
      return rateMonths[rateMonths.length - 1].rate;
    };
    
    while (balance > 0 && month <= loanTermYears * 12) {
      // Get the appropriate interest rate for this month
      const monthlyRate: number = getMonthlyRateForMonth(month);
      
      // Calculate payments for this month
      const interestPayment: number = balance * monthlyRate;
      
      // For first month, use firstPayment
      const paymentThisMonth: number = month === 1 ? firstPayment : regularPayment;
      
      // Calculate principal portion of regular payment
      const regularPrincipalPayment: number = paymentThisMonth - interestPayment;
      
      // Calculate principal including overpayment
      let principalPayment: number = regularPrincipalPayment;
      let totalPayment: number = paymentThisMonth;
      
      // Add overpayment if balance is sufficient
      if (balance >= regularPrincipalPayment + monthlyOverpayment) {
        principalPayment += monthlyOverpayment;
        totalPayment += monthlyOverpayment;
      } else if (balance > regularPrincipalPayment) {
        // Final payment
        principalPayment = balance;
        totalPayment = balance + interestPayment;
      }
      
      // Calculate cash flow for this month
      const cashFlowThisMonth: number = rentalIncome - totalPayment - monthlyServiceCharge;
      
      // Update balance and totals
      balance -= principalPayment;
      totalInterest += interestPayment;
      totalPrincipal += principalPayment;
      
      // Ensure we don't get negative balance
      if (balance < 0) balance = 0;
      
      // Format date for display
      const paymentDate: Date = new Date(currentDate);
      
      // Get annual rate for display
      const displayRate: number = getMonthlyRateForMonth(month) * 12 * 100;
      
      // Add to schedule
      schedule.push({
        month,
        date: paymentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        payment: totalPayment.toFixed(2),
        principal: principalPayment.toFixed(2),
        interest: interestPayment.toFixed(2),
        totalInterest: totalInterest.toFixed(2),
        balance: balance.toFixed(2),
        regularPayment: paymentThisMonth.toFixed(2),
        overpayment: (totalPayment - paymentThisMonth).toFixed(2),
        rate: displayRate.toFixed(2),
        cashFlow: cashFlowThisMonth.toFixed(2)
      });
      
      // Break if paid off
      if (balance === 0) break;
      
      // Move to next month
      month++;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return schedule;
  };
  
  const schedule: MonthlyPayment[] = calculateSchedule();
  const payoffMonths: number = schedule.length;
  const payoffYears: string = (payoffMonths / 12).toFixed(1);
  
  // Calculate total payments and savings
  const regularTotalPayments: number = (firstPayment + regularPayment * (loanTermYears * 12 - 1));
  const regularTotalInterest: number = regularTotalPayments - loanAmount;
  
  const actualTotalPayments: number = schedule.reduce((total, row) => total + parseFloat(row.payment), 0);
  const interestSaved: number = regularTotalInterest - (actualTotalPayments - loanAmount);
  
  // Calculate total rental income, mortgage payments, and service charges over the life of the mortgage
  const totalRentalIncome: number = rentalIncome * payoffMonths;
  const totalMortgagePayments: number = actualTotalPayments;
  const totalServiceCharges: number = monthlyServiceCharge * payoffMonths;
  const totalNetIncome: number = totalRentalIncome - totalMortgagePayments - totalServiceCharges;
  
  // Prepare data for charts
  const balanceChartData = schedule.filter((_, index) => index % 3 === 0).map(month => ({
    month: month.month,
    balance: parseFloat(month.balance),
    date: month.date
  }));
  
  const paymentsChartData = schedule.filter((_, index) => index % 3 === 0).map(month => ({
    month: month.month,
    principal: parseFloat(month.principal),
    interest: parseFloat(month.interest),
    date: month.date
  }));
  
  const cashFlowChartData = schedule.filter((_, index) => index % 3 === 0).map(month => ({
    month: month.month,
    cashFlow: parseFloat(month.cashFlow),
    date: month.date
  }));
  
  // Generate yearly summary
  const yearlySummary: YearlySummary[] = [];
  let yearlyData: YearlyData = {};
  
  schedule.forEach((month, index) => {
    const year = Math.floor((index) / 12) + 1;
    
    if (!yearlyData[year]) {
      yearlyData[year] = {
        year,
        totalPrincipal: 0,
        totalInterest: 0,
        totalPayment: 0,
        endBalance: 0,
        averageRate: 0,
        rateTotal: 0,
        months: 0,
        totalCashFlow: 0
      };
    }
    
    yearlyData[year].totalPrincipal += parseFloat(month.principal);
    yearlyData[year].totalInterest += parseFloat(month.interest);
    yearlyData[year].totalPayment += parseFloat(month.payment);
    yearlyData[year].endBalance = parseFloat(month.balance);
    yearlyData[year].rateTotal += parseFloat(month.rate);
    yearlyData[year].totalCashFlow += parseFloat(month.cashFlow);
    yearlyData[year].months++;
  });
  
  // Convert to array
  Object.keys(yearlyData).forEach(year => {
    const yearNum = parseInt(year);
    yearlySummary.push({
      year: yearNum,
      totalPrincipal: yearlyData[yearNum].totalPrincipal.toFixed(2),
      totalInterest: yearlyData[yearNum].totalInterest.toFixed(2), 
      totalPayment: yearlyData[yearNum].totalPayment.toFixed(2),
      endBalance: yearlyData[yearNum].endBalance.toFixed(2),
      averageRate: (yearlyData[yearNum].rateTotal / yearlyData[yearNum].months).toFixed(2),
      totalCashFlow: yearlyData[yearNum].totalCashFlow.toFixed(2)
    });
  });
  
  // Calculate total interest and principal for pie chart
  const totalInterestPaid = schedule.reduce((sum, month) => sum + parseFloat(month.interest), 0);
  const pieChartData = [
    { name: 'Principal', value: loanAmount },
    { name: 'Interest', value: totalInterestPaid }
  ];
  const COLORS = ['#0088FE', '#FF8042'];
  
  // Function to add a new payment
  const addPayment = () => {
    setActualPayments([...actualPayments, {
      date: newPayment.date,
      amount: newPayment.amount,
      isOverpayment: newPayment.isOverpayment,
      note: newPayment.note
    }]);
    
    // Reset form
    setNewPayment({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      isOverpayment: false,
      note: ''
    });
  };

  // Function to calculate payment status
  const calculatePaymentStatus = (scheduleDate: string, scheduledAmount: number): 'onTrack' | 'behind' | 'ahead' => {
    const paymentDate = new Date(scheduleDate);
    const relevantPayments = actualPayments.filter(p => new Date(p.date) <= paymentDate);
    const totalPaid = relevantPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate expected amount up to this date
    const expectedAmount = schedule
      .filter(m => new Date(m.date) <= paymentDate)
      .reduce((sum, m) => sum + parseFloat(m.payment), 0);
    
    if (Math.abs(totalPaid - expectedAmount) < 1) return 'onTrack';
    return totalPaid > expectedAmount ? 'ahead' : 'behind';
  };

  // Add payment tracking stats
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

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-6 px-4 sm:px-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Interactive Mortgage & Rental Property Calculator</h1>
      
      {/* Payment Tracking Section */}
      <div className="mb-8 bg-yellow-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-xl">Payment Tracker</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center"
          >
            <span className="mr-2">+</span> Add Payment
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow space-y-2">
            <h3 className="font-semibold mb-2">Payment Progress</h3>
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

      {/* Add Payment Modal */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        newPayment={newPayment}
        setNewPayment={setNewPayment}
        onSubmit={addPayment}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2 text-xl">Loan & Property Details</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="block text-sm mb-1">Loan Amount (£)</label>
              <input 
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(parseFloat(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Term (years)</label>
              <input 
                type="number"
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(parseInt(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Regular Payment (£)</label>
              <input 
                type="number" 
                step="0.01"
                value={regularPayment}
                onChange={(e) => setRegularPayment(parseFloat(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">First Payment (£)</label>
              <input 
                type="number" 
                step="0.01"
                value={firstPayment}
                onChange={(e) => setFirstPayment(parseFloat(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Rental Income (£/month)</label>
              <input 
                type="number" 
                step="0.01"
                value={rentalIncome}
                onChange={(e) => setRentalIncome(parseFloat(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Service Charge (£/year)</label>
              <input 
                type="number" 
                step="0.01"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(parseFloat(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm mb-1">Monthly Overpayment (£)</label>
              <input 
                type="number" 
                step="0.01"
                value={monthlyOverpayment}
                onChange={(e) => setMonthlyOverpayment(parseFloat(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="col-span-2 mt-4">
              <h3 className="font-bold mb-2">Interest Rate Periods</h3>
              {interestRates.map((period, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center">
                  <div>
                    <label className="block text-sm mb-1">Rate (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={period.rate}
                      onChange={(e) => updateInterestRate(index, 'rate', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Years</label>
                    <input 
                      type="number"
                      value={period.years}
                      onChange={(e) => updateInterestRate(index, 'years', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Months</label>
                    <input 
                      type="number"
                      value={period.months}
                      onChange={(e) => updateInterestRate(index, 'months', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <button 
                    onClick={() => removeInterestRatePeriod(index)}
                    className="mt-5 p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button 
                onClick={addInterestRatePeriod}
                className="mt-2 p-2 bg-blue-100 rounded hover:bg-blue-200 w-full"
              >
                + Add Rate Period
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="font-bold mb-2 text-xl">Financial Summary</h2>
          
          <div className="bg-blue-100 p-3 rounded-lg mb-4">
            <h3 className="font-bold">Cash Flow Analysis</h3>
            <p className="mb-1"><strong>Monthly Rental Income:</strong> £{rentalIncome.toFixed(2)}</p>
            <p className="mb-1"><strong>Monthly Mortgage Payment:</strong> £{regularPayment.toFixed(2)}</p>
            <p className="mb-1"><strong>Monthly Service Charge:</strong> £{monthlyServiceCharge.toFixed(2)}</p>
            <p className="mb-1 text-lg font-semibold text-blue-800">
              <strong>Monthly Cash Flow:</strong> £{monthlyCashFlow.toFixed(2)}
              <span className={monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                {monthlyCashFlow >= 0 ? ' (Positive)' : ' (Negative)'}
              </span>
            </p>
            <p className="mb-1"><strong>Annual Cash Flow:</strong> £{annualCashFlow.toFixed(2)}</p>
            <p className="mb-1"><strong>Recommended Monthly Overpayment:</strong> £{recommendedOverpayment.toFixed(2)}</p>
            <p className="mb-1"><strong>Current Monthly Overpayment:</strong> £{monthlyOverpayment.toFixed(2)}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-bold">Mortgage Overview</h3>
            <p className="mb-1"><strong>Original Term:</strong> {loanTermYears} years ({loanTermYears * 12} months)</p>
            <p className="mb-1"><strong>New Payoff Time:</strong> {payoffYears} years ({payoffMonths} months)</p>
            <p className="mb-1"><strong>Time Saved:</strong> {(loanTermYears - payoffMonths/12).toFixed(1)} years</p>
            <p className="mb-1"><strong>Total Interest (Original):</strong> £{regularTotalInterest.toFixed(2)}</p>
            <p className="mb-1"><strong>Total Interest (With Overpayments):</strong> £{(actualTotalPayments - loanAmount).toFixed(2)}</p>
            <p className="mb-1"><strong>Interest Saved:</strong> £{interestSaved.toFixed(2)}</p>
            <p className="mb-1"><strong>Annual Overpayment Rate:</strong> {((monthlyOverpayment * 12 / loanAmount) * 100).toFixed(2)}% (Limit: 20%)</p>
          </div>
          
          <div className="bg-purple-100 p-3 rounded-lg mb-4">
            <h3 className="font-bold">Lifetime Investment Summary</h3>
            <p className="mb-1"><strong>Total Rental Income:</strong> £{totalRentalIncome.toFixed(2)}</p>
            <p className="mb-1"><strong>Total Mortgage Payments:</strong> £{totalMortgagePayments.toFixed(2)}</p>
            <p className="mb-1"><strong>Total Service Charges:</strong> £{totalServiceCharges.toFixed(2)}</p>
            <p className="mb-1 font-semibold text-purple-800">
              <strong>Total Net Income:</strong> £{totalNetIncome.toFixed(2)}
              <span className={totalNetIncome >= 0 ? ' text-green-600' : ' text-red-600'}>
                {totalNetIncome >= 0 ? ' (Profit)' : ' (Loss)'}
              </span>
            </p>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm mb-1">Display Options</label>
            <div className="flex space-x-2">
              <button 
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1 rounded ${viewMode === 'summary' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Yearly Summary
              </button>
              <button 
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1 rounded ${viewMode === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Monthly Details
              </button>
              <button 
                onClick={() => setViewMode('charts')}
                className={`px-3 py-1 rounded ${viewMode === 'charts' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Charts
              </button>
            </div>
          </div>
          
          {viewMode === 'monthly' && (
            <div className="mt-2">
              <label className="block text-sm mb-1">Show years:</label>
              <select 
                value={displayYears} 
                onChange={(e) => setDisplayYears(parseInt(e.target.value))}
                className="p-1 border rounded"
              >
                <option value={100}>All ({Math.ceil(payoffMonths/12)} years)</option>
                <option value={1}>First year</option>
                <option value={2}>First 2 years</option>
                <option value={3}>First 3 years</option>
                <option value={5}>First 5 years</option>
              </select>
            </div>
          )}
          
          {viewMode === 'charts' && (
            <div className="mt-2">
              <label className="block text-sm mb-1">Chart Type:</label>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setChartType('balance')}
                  className={`px-3 py-1 rounded ${chartType === 'balance' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
                >
                  Balance
                </button>
                <button 
                  onClick={() => setChartType('payments')}
                  className={`px-3 py-1 rounded ${chartType === 'payments' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
                >
                  Payments
                </button>
                <button 
                  onClick={() => setChartType('cashflow')}
                  className={`px-3 py-1 rounded ${chartType === 'cashflow' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
                >
                  Cash Flow
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {viewMode === 'charts' && (
        <div className="mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-bold mb-4 text-xl">
              {chartType === 'balance' && 'Mortgage Balance Over Time'}
              {chartType === 'payments' && 'Principal vs Interest Payments'}
              {chartType === 'cashflow' && 'Monthly Cash Flow'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                {chartType === 'balance' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={balanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }} />
                      <YAxis label={{ value: 'Balance (£)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => `£${value.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} />
                      <Legend />
                      <Line type="monotone" dataKey="balance" stroke="#8884d8" name="Remaining Balance" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                
                {chartType === 'payments' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={paymentsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }} />
                      <YAxis label={{ value: 'Amount (£)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => `£${value.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} />
                      <Legend />
                      <Bar dataKey="principal" fill="#82ca9d" name="Principal" stackId="a" />
                      <Bar dataKey="interest" fill="#8884d8" name="Interest" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                
                {chartType === 'cashflow' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={cashFlowChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }} />
                      <YAxis label={{ value: 'Cash Flow (£)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => `£${value.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} />
                      <Legend />
                      <Line type="monotone" dataKey="cashFlow" stroke="#82ca9d" name="Monthly Cash Flow" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              <div>
                <h3 className="font-bold mb-2">Total Loan Cost Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `£${value.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <p><span className="inline-block w-3 h-3 bg-blue-500 mr-1"></span> Principal: £{loanAmount.toLocaleString('en-GB')}</p>
                  <p><span className="inline-block w-3 h-3 bg-orange-500 mr-1"></span> Interest: £{totalInterestPaid.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {viewMode === 'summary' && (
        <div className="overflow-x-auto">
          <h2 className="font-bold mb-2 text-xl">Yearly Summary</h2>
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
                <th className="py-2 px-4 text-left">Year</th>
                <th className="py-2 px-4 text-right">Avg. Rate</th>
                <th className="py-2 px-4 text-right">Total Principal</th>
                <th className="py-2 px-4 text-right">Total Interest</th>
                <th className="py-2 px-4 text-right">Total Payment</th>
                <th className="py-2 px-4 text-right">Cash Flow</th>
                <th className="py-2 px-4 text-right">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {yearlySummary.map(year => (
                <tr key={year.year} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{year.year}</td>
                  <td className="py-2 px-4 text-right">{year.averageRate}%</td>
                  <td className="py-2 px-4 text-right">£{parseFloat(year.totalPrincipal).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="py-2 px-4 text-right">£{parseFloat(year.totalInterest).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="py-2 px-4 text-right">£{parseFloat(year.totalPayment).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className={`py-2 px-4 text-right ${parseFloat(year.totalCashFlow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    £{parseFloat(year.totalCashFlow).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="py-2 px-4 text-right">£{parseFloat(year.endBalance).toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {viewMode === 'monthly' && (
        <div className="overflow-x-auto">
          <h2 className="font-bold mb-2 text-xl">Monthly Amortization Schedule</h2>
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
              {schedule
                .filter(row => Math.ceil(row.month / 12) <= displayYears || displayYears === 100)
                .map(row => {
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
      )}
    </div>
  );
};

export default MortgageCalculator;