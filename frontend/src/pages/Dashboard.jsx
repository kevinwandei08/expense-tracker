
import { useEffect, useState } from 'react';

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
} from 'lucide-react';

import api from '../api/axios';

import StatCard from '../components/dashboard/StatCard';
import ExpenseChart from '../components/dashboard/ExpenseChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import { formatCurrency } from '../utils/formatCurrency';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/dashboard/summary');

        setDashboardData(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Unable to load dashboard data. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm font-medium text-slate-500">
          Loading your financial overview...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-800">
          Dashboard unavailable
        </h2>

        <p className="mt-2 text-sm text-red-700">
          {error}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    overview,
    monthly,
    recent_transactions,
    monthly_expense_breakdown,
  } = dashboardData;

  const chartData = [
    {
      month: 'This Month',
      income: Number(monthly.income),
      expenses: Number(monthly.expenses),
    },
  ];

  const monthlyExpenses = Number(monthly.expenses);

  return (
    <div className="space-y-8">

      {/* Welcome section */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900">
          Financial Overview
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Here's a summary of your financial position.
        </p>
      </section>

      {/* Financial summary cards */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Balance"
          amount={formatCurrency(overview.balance)}
          icon={Wallet}
          color="bg-blue-50 text-blue-600"
          description="Your net financial position"
        />

        <StatCard
          title="Total Income"
          amount={formatCurrency(overview.total_income)}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
          description="All recorded income"
        />

        <StatCard
          title="Total Expenses"
          amount={formatCurrency(overview.total_expenses)}
          icon={TrendingDown}
          color="bg-orange-50 text-orange-600"
          description="All recorded expenses"
        />

        <StatCard
          title="Monthly Balance"
          amount={formatCurrency(monthly.balance)}
          icon={PiggyBank}
          color="bg-purple-50 text-purple-600"
          description="Current month's net balance"
        />

      </section>

      {/* Charts and expense breakdown */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        <ExpenseChart data={chartData} />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">
            Monthly Expense Breakdown
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Where your money goes
          </p>

          <div className="mt-6 space-y-6">

            {monthly_expense_breakdown.length === 0 ? (
              <p className="text-sm text-slate-500">
                No expenses recorded this month.
              </p>
            ) : (
              monthly_expense_breakdown.map((item) => {
                const percentage =
                  monthlyExpenses > 0
                    ? (Number(item.total_amount) / monthlyExpenses) * 100
                    : 0;

                return (
                  <div key={item.category_name}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {item.category_name}
                      </span>

                      <span className="font-semibold text-slate-900">
                        {formatCurrency(item.total_amount)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      {percentage.toFixed(1)}% of monthly expenses
                    </p>
                  </div>
                );
              })
            )}

          </div>
        </div>

      </section>

      {/* Recent transactions */}
      <section>
        <RecentTransactions transactions={recent_transactions} />
      </section>

    </div>
  );
}

export default Dashboard;
