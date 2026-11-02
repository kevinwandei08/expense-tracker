import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CalendarDays,
  ChartNoAxesCombined,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import api from '../api/axios';
import StatCard from '../components/dashboard/StatCard';
import { formatCurrency } from '../utils/formatCurrency';

function getDefaultDateRange() {
  const today = new Date();

  const start = new Date(
    today.getFullYear(),
    today.getMonth() - 5,
    1
  );

  const end = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  );

  const toLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  return {
    start_date: toLocalDate(start),
    end_date: toLocalDate(end),
  };
}

function Reports() {
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [appliedRange, setAppliedRange] = useState(getDefaultDateRange);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async (range) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/reports/summary', {
        params: {
          start_date: range.start_date,
          end_date: range.end_date,
        },
      });

      setReport(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load reports. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(appliedRange);
  }, [fetchReports, appliedRange]);

  const handleDateChange = (event) => {
    const { name, value } = event.target;

    setDateRange((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();

    if (!dateRange.start_date || !dateRange.end_date) {
      setError('Please select both a start date and an end date.');
      return;
    }

    if (dateRange.start_date > dateRange.end_date) {
      setError('The start date must be on or before the end date.');
      return;
    }

    setAppliedRange({ ...dateRange });
  };

  const handleResetFilters = () => {
    const defaults = getDefaultDateRange();
    setDateRange(defaults);
    setAppliedRange(defaults);
  };

  const monthlyData = (report?.monthly_trend || []).map((item) => ({
    ...item,
    income: Number(item.income || 0),
    expenses: Number(item.expenses || 0),
  }));

  const expenseData = (report?.expense_breakdown || []).map((item) => ({
    name: item.category_name,
    amount: Number(item.total_amount || 0),
  }));

  const overview = report?.overview;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review your income, spending and financial trends.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchReports(appliedRange)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <form
        onSubmit={handleApplyFilters}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={19} className="text-slate-500" />
          <h2 className="font-semibold text-slate-900">Report period</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="start_date"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Start date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              value={dateRange.start_date}
              onChange={handleDateChange}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label
              htmlFor="end_date"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              End date
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              value={dateRange.end_date}
              onChange={handleDateChange}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Apply filters
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset period
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => fetchReports(appliedRange)}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading && !report ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <RefreshCw size={28} className="mx-auto animate-spin text-emerald-600" />
          <p className="mt-3 text-sm text-slate-500">
            Loading your financial reports...
          </p>
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Income"
              amount={formatCurrency(overview.total_income)}
              icon={TrendingUp}
              color="bg-emerald-100 text-emerald-700"
              description="Income in the selected period"
            />

            <StatCard
              title="Total Expenses"
              amount={formatCurrency(overview.total_expenses)}
              icon={TrendingDown}
              color="bg-rose-100 text-rose-700"
              description="Spending in the selected period"
            />

            <StatCard
              title="Net Balance"
              amount={formatCurrency(overview.balance)}
              icon={Wallet}
              color="bg-blue-100 text-blue-700"
              description="Income minus expenses"
            />

            <StatCard
              title="Transactions"
              amount={Number(overview.transaction_count).toLocaleString('en-KE')}
              icon={ChartNoAxesCombined}
              color="bg-violet-100 text-violet-700"
              description="Number of financial records"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Monthly Income vs Expenses
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Monthly totals within the selected date range.
              </p>

              {monthlyData.length > 0 ? (
                <div className="mt-5 h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 10, right: 8, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month_label"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) =>
                          new Intl.NumberFormat('en-KE', {
                            notation: 'compact',
                            maximumFractionDigits: 1,
                          }).format(value)
                        }
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          formatCurrency(value),
                          name,
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="income"
                        name="Income"
                        fill="#059669"
                        radius={[5, 5, 0, 0]}
                      />
                      <Bar
                        dataKey="expenses"
                        name="Expenses"
                        fill="#e11d48"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-slate-500">
                  No monthly data is available for this period.
                </p>
              )}
            </section>

            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Expense Breakdown
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                How your expenses are distributed by category.
              </p>

              {expenseData.length > 0 ? (
                <>
                  <div className="mt-5 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius="78%"
                          innerRadius="42%"
                          paddingAngle={2}
                        >
                          {expenseData.map((item, index) => (
                            <Cell key={item.name} fill={['#059669', '#2563eb', '#d97706', '#7c3aed', '#e11d48', '#0891b2'][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-2 space-y-2">
                    {expenseData.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-4 border-t border-slate-100 pt-2 text-sm"
                      >
                        <span className="truncate text-slate-600">
                          {item.name}
                        </span>
                        <span className="shrink-0 font-semibold text-slate-900">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="py-16 text-center text-sm text-slate-500">
                  No expenses found for this period.
                </p>
              )}
            </section>
          </div>

          <p className="text-xs text-slate-500">
            Showing {report.period.start_date.slice(0, 10)} through{' '}
            {report.period.end_date.slice(0, 10)}. All amounts are in Kenyan shillings (KES).
          </p>
        </>
      ) : !error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No report data is available.
        </div>
      ) : null}
    </div>
  );
}


export default Reports;
