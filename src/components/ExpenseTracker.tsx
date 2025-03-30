import React, { useState } from 'react';
import { ExpenseModal } from './ExpenseModal';

interface Expense {
  date: string;
  amount: number;
  category: string;
  description: string;
}

export const ExpenseTracker: React.FC = () => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState<Expense>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: 'Maintenance',
    description: ''
  });

  const addExpense = () => {
    setExpenses([...expenses, newExpense]);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      category: 'Maintenance',
      description: ''
    });
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getExpensesByCategory = () => {
    return expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  return (
    <div className="w-[1200px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Expense Tracker</h1>

      <div className="mb-8 bg-yellow-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-xl">Expense Summary</h2>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 flex items-center"
          >
            <span className="mr-2">+</span> Add Expense
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Total Expenses</h3>
            <p className="text-3xl font-bold text-red-600">£{getTotalExpenses().toFixed(2)}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Expenses by Category</h3>
            <div className="space-y-2">
              {Object.entries(getExpensesByCategory()).map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-600">{category}</span>
                  <span className="font-semibold">£{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="font-bold text-xl p-4 border-b">Expense History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-sm">
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Category</th>
                <th className="py-2 px-4 text-left">Description</th>
                <th className="py-2 px-4 text-right">Amount</th>
                <th className="py-2 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No expenses recorded yet
                  </td>
                </tr>
              ) : (
                expenses.map((expense, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-4">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="py-2 px-4">{expense.category}</td>
                    <td className="py-2 px-4">{expense.description}</td>
                    <td className="py-2 px-4 text-right font-semibold">£{expense.amount.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => removeExpense(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        newExpense={newExpense}
        setNewExpense={setNewExpense}
        onSubmit={addExpense}
      />
    </div>
  );
}; 