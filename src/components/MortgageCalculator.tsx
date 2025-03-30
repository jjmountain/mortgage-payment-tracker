import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface InterestRatePeriod {
  startDate: string;
  rate: number;
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
}

interface YearlySummary {
  year: number;
  totalPayment: number;
  totalInterest: number;
  totalPrincipal: number;
  totalOverpayment: number;
  cashFlow: number;
}

interface RateMonthData {
  month: string;
  rate: number;
}

interface YearlyData {
  year: number;
  payment: number;
  interest: number;
  principal: number;
  overpayment: number;
}

interface MortgageCalculatorProps {
  onScheduleUpdate: (schedule: MonthlyPayment[]) => void;
}

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({ onScheduleUpdate }) => {
  const [loanAmount, setLoanAmount] = useState<number>(200000);
  const [loanTerm, setLoanTerm] = useState<number>(25);
  const [monthlyOverpayment, setMonthlyOverpayment] = useState<number>(0);
  const [rentalIncome, setRentalIncome] = useState<number>(0);
  const [serviceCharge, setServiceCharge] = useState<number>(0);
  const [interestRates, setInterestRates] = useState<InterestRatePeriod[]>([
    { startDate: '2024-01-01', rate: 5.5 }
  ]);
  const [displayMode, setDisplayMode] = useState<'summary' | 'monthly' | 'charts'>('summary');
  const [schedule, setSchedule] = useState<MonthlyPayment[]>([]);
  const [yearlySummaries, setYearlySummaries] = useState<YearlySummary[]>([]);
  const [rateData, setRateData] = useState<RateMonthData[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);

  const updateInterestRate = (index: number, field: keyof InterestRatePeriod, value: number) => {
    const newRates = [...interestRates];
    newRates[index] = { ...newRates[index], [field]: value };
    setInterestRates(newRates);
  };

  const addInterestRatePeriod = () => {
    const lastPeriod = interestRates[interestRates.length - 1];
    const startDate = new Date(new Date(lastPeriod.startDate).setMonth(new Date(lastPeriod.startDate).getMonth() + 24)).toISOString().split('T')[0];
    setInterestRates([
      ...interestRates,
      { startDate, rate: 5.5 }
    ]);
  };

  const removeInterestRatePeriod = (index: number) => {
    setInterestRates(interestRates.filter((_, i) => i !== index));
  };

  const calculateAmortizationSchedule = () => {
    const schedule: MonthlyPayment[] = [];
    const yearlySummaries: YearlySummary[] = [];
    const rateData: RateMonthData[] = [];
    const yearlyData: YearlyData[] = [];

    let balance = loanAmount;
    let totalInterest = 0;
    let currentYear = new Date().getFullYear();
    let yearStartBalance = balance;
    let yearTotalPayment = 0;
    let yearTotalPrincipal = 0;
    let yearTotalInterest = 0;
    let yearTotalOverpayment = 0;
    let yearCashFlow = 0;

    for (let month = 1; month <= loanTerm * 12; month++) {
      // Find the applicable interest rate
      const ratePeriod = interestRates.find(
        period => new Date(period.startDate).getMonth() + 1 === month
      );
      const rate = ratePeriod ? ratePeriod.rate : interestRates[interestRates.length - 1].rate;

      // Calculate monthly payment
      const monthlyRate = rate / 12 / 100;
      const regularPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm * 12)) /
        (Math.pow(1 + monthlyRate, loanTerm * 12) - 1);
      const totalPayment = regularPayment + monthlyOverpayment;

      // Calculate interest and principal portions
      const interestPayment = balance * monthlyRate;
      const principalPayment = totalPayment - interestPayment;
      const overpayment = monthlyOverpayment;

      // Update balance and totals
      balance -= principalPayment;
      totalInterest += interestPayment;
      yearTotalPayment += totalPayment;
      yearTotalPrincipal += principalPayment;
      yearTotalInterest += interestPayment;
      yearTotalOverpayment += overpayment;
      yearCashFlow += rentalIncome - serviceCharge - totalPayment;

      // Add to rate data
      rateData.push({ month: month.toString(), rate });

      // Create monthly payment record
      schedule.push({
        month,
        date: new Date(currentYear, month - 1).toLocaleDateString(),
        payment: totalPayment.toFixed(2),
        principal: principalPayment.toFixed(2),
        interest: interestPayment.toFixed(2),
        totalInterest: totalInterest.toFixed(2),
        balance: balance.toFixed(2),
        regularPayment: regularPayment.toFixed(2),
        overpayment: overpayment.toFixed(2),
        rate: rate.toFixed(2),
        cashFlow: (rentalIncome - serviceCharge - totalPayment).toFixed(2)
      });

      // Yearly summary
      if (month % 12 === 0 || month === loanTerm * 12) {
        yearlySummaries.push({
          year: currentYear,
          totalPayment: yearTotalPayment,
          totalInterest: yearTotalInterest,
          totalPrincipal: yearTotalPrincipal,
          totalOverpayment: yearTotalOverpayment,
          cashFlow: yearCashFlow
        });

        yearlyData.push({
          year: currentYear,
          payment: yearTotalPayment,
          interest: yearTotalInterest,
          principal: yearTotalPrincipal,
          overpayment: yearTotalOverpayment,
        });

        // Reset yearly totals
        currentYear++;
        yearStartBalance = balance;
        yearTotalPayment = 0;
        yearTotalPrincipal = 0;
        yearTotalInterest = 0;
        yearTotalOverpayment = 0;
        yearCashFlow = 0;
      }
    }

    setSchedule(schedule);
    setYearlySummaries(yearlySummaries);
    setRateData(rateData);
    setYearlyData(yearlyData);

    onScheduleUpdate(schedule);
  };

  useEffect(() => {
    calculateAmortizationSchedule();
  }, [loanAmount, loanTerm, monthlyOverpayment, rentalIncome, serviceCharge, interestRates]);

  return (
    <div className="w-[1200px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Mortgage Calculator</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Loan Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Amount (£)
              </label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Term (years)
              </label>
              <input
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Overpayment (£)
              </label>
              <input
                type="number"
                value={monthlyOverpayment}
                onChange={(e) => setMonthlyOverpayment(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Rental Property Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Rental Income (£)
              </label>
              <input
                type="number"
                value={rentalIncome}
                onChange={(e) => setRentalIncome(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Service Charge (£)
              </label>
              <input
                type="number"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Interest Rates</h2>
        <div className="space-y-4">
          {interestRates.map((period, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={period.startDate}
                  onChange={(e) => updateInterestRate(index, 'startDate', new Date(e.target.value).getTime())}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={period.rate}
                  onChange={(e) => updateInterestRate(index, 'rate', parseFloat(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {index > 0 && (
                <button
                  onClick={() => removeInterestRatePeriod(index)}
                  className="mt-6 text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addInterestRatePeriod}
            className="mt-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            <span className="mr-2">+</span> Add Interest Rate Period
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Results</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setDisplayMode('summary')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                displayMode === 'summary' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setDisplayMode('monthly')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                displayMode === 'monthly' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Monthly Details
            </button>
            <button
              onClick={() => setDisplayMode('charts')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                displayMode === 'charts' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Charts
            </button>
          </div>
        </div>

        {displayMode === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Total Interest</h3>
              <p className="text-2xl font-bold text-gray-900">
                £{parseFloat(schedule[schedule.length - 1]?.totalInterest || '0').toLocaleString('en-GB', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Monthly Payment</h3>
              <p className="text-2xl font-bold text-gray-900">
                £{parseFloat(schedule[0]?.payment || '0').toLocaleString('en-GB', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Total Overpayment</h3>
              <p className="text-2xl font-bold text-gray-900">
                £{yearlySummaries.reduce((sum, year) => sum + year.totalOverpayment, 0).toLocaleString('en-GB', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Annual Cash Flow</h3>
              <p className="text-2xl font-bold text-gray-900">
                £{yearlySummaries[0]?.cashFlow.toLocaleString('en-GB', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          </div>
        )}

        {displayMode === 'monthly' && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-sm">
                  <th className="py-2 px-4 text-left">Month</th>
                  <th className="py-2 px-4 text-left">Date</th>
                  <th className="py-2 px-4 text-right">Rate</th>
                  <th className="py-2 px-4 text-right">Payment</th>
                  <th className="py-2 px-4 text-right">Principal</th>
                  <th className="py-2 px-4 text-right">Interest</th>
                  <th className="py-2 px-4 text-right">Overpayment</th>
                  <th className="py-2 px-4 text-right">Balance</th>
                  <th className="py-2 px-4 text-right">Cash Flow</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                {schedule.map((row) => (
                  <tr key={row.month} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-4">{row.month}</td>
                    <td className="py-2 px-4">{row.date}</td>
                    <td className="py-2 px-4 text-right">{row.rate}%</td>
                    <td className="py-2 px-4 text-right">£{parseFloat(row.payment).toFixed(2)}</td>
                    <td className="py-2 px-4 text-right">£{parseFloat(row.principal).toFixed(2)}</td>
                    <td className="py-2 px-4 text-right">£{parseFloat(row.interest).toFixed(2)}</td>
                    <td className="py-2 px-4 text-right">£{parseFloat(row.overpayment).toFixed(2)}</td>
                    <td className="py-2 px-4 text-right">£{parseFloat(row.balance).toLocaleString('en-GB', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}</td>
                    <td className={`py-2 px-4 text-right ${parseFloat(row.cashFlow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      £{parseFloat(row.cashFlow).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {displayMode === 'charts' && (
          <div className="space-y-8">
            <div className="h-80">
              <h3 className="text-lg font-semibold mb-4">Interest Rate Changes</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="#8884d8" name="Interest Rate (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-80">
              <h3 className="text-lg font-semibold mb-4">Yearly Breakdown</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="payment" fill="#8884d8" name="Total Payment" />
                  <Bar dataKey="interest" fill="#82ca9d" name="Interest" />
                  <Bar dataKey="principal" fill="#ffc658" name="Principal" />
                  <Bar dataKey="overpayment" fill="#ff7300" name="Overpayment" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-80">
              <h3 className="text-lg font-semibold mb-4">Cash Flow Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cashFlow" stroke="#ff7300" name="Cash Flow" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 