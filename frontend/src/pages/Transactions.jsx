
import { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw,
  ReceiptText,
  Plus,
  X,
  Filter,
} from 'lucide-react';

import api from '../api/axios';
import RecentTransactions from '../components/dashboard/RecentTransactions';

function getLocalDate() {
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 10);
}

function getDateValue(value) {
  if (!value) return getLocalDate();

  return String(value).slice(0, 10);
}

const initialFormData = () => ({
  type: 'expense',
  amount: '',
  category_id: '',
  description: '',
  transaction_date: getLocalDate(),
});

const initialFilterData = () => ({
  type: '',
  category_id: '',
  start_date: '',
  end_date: '',
});

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterError, setFilterError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(initialFormData);
  const [filterForm, setFilterForm] = useState(initialFilterData);
  const [appliedFilters, setAppliedFilters] = useState({});

  // Fetch transactions with optional filters.
  const fetchTransactions = useCallback(async (activeFilters = {}) => {
    try {
      setLoading(true);
      setError('');

      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(
          ([, value]) => value !== ''
        )
      );

      const response = await api.get('/transactions', {
        params,
      });

      setTransactions(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load transactions. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories.
  const fetchCategories = useCallback(async () => {
    try {
      setCategoryLoading(true);
      setCategoryError('');

      const response = await api.get('/categories');

      setCategories(response.data.data || []);
    } catch (err) {
      setCategoryError(
        err.response?.data?.message ||
        'Unable to load categories.'
      );
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  // Categories available for the add/edit form.
  const availableCategories = categories.filter(
    (category) => category.type === formData.type
  );

  // Handle add/edit form changes.
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'type' ? { category_id: '' } : {}),
    }));

    setError('');
    setSuccess('');
  };

  // Handle filter changes.
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilterForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'type' ? { category_id: '' } : {}),
    }));

    setFilterError('');
  };

  // Apply selected filters.
  const handleApplyFilters = async () => {
    if (
      filterForm.start_date &&
      filterForm.end_date &&
      filterForm.start_date > filterForm.end_date
    ) {
      setFilterError(
        'Start date cannot be later than end date.'
      );
      return;
    }

    const selectedFilters = { ...filterForm };

    setAppliedFilters(selectedFilters);
    setFilterError('');

    await fetchTransactions(selectedFilters);
  };

  // Clear all filters.
  const handleClearFilters = async () => {
    const clearedFilters = initialFilterData();

    setFilterForm(clearedFilters);
    setAppliedFilters({});
    setFilterError('');

    await fetchTransactions({});
  };

  // Open the add transaction form.
  const openAddForm = () => {
    setEditingId(null);
    setFormData(initialFormData());
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  // Load a transaction into the edit form.
  const handleEdit = (transaction) => {
    setEditingId(transaction.id);

    setFormData({
      type: transaction.type,
      amount: String(transaction.amount),
      category_id: transaction.category_id
        ? String(transaction.category_id)
        : '',
      description: transaction.description || '',
      transaction_date: getDateValue(transaction.transaction_date),
    });

    setShowForm(true);
    setError('');
    setSuccess('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Close and reset the form.
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData());
    setError('');
  };

  // Create or update a transaction.
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const amount = Number(formData.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }

    if (amount > 9999999999.99) {
      setError('The amount exceeds the permitted limit.');
      return;
    }

    const payload = {
      type: formData.type,
      amount,
      category_id: formData.category_id
        ? Number(formData.category_id)
        : null,
      description: formData.description.trim() || null,
      transaction_date: formData.transaction_date,
    };

    try {
      setSubmitting(true);

      if (editingId !== null) {
        await api.put(`/transactions/${editingId}`, payload);
        setSuccess('Transaction updated successfully.');
      } else {
        await api.post('/transactions', payload);
        setSuccess('Transaction added successfully.');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData());

      await fetchTransactions(appliedFilters);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        `Unable to ${editingId !== null ? 'update' : 'create'} transaction. Please try again.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a transaction.
  const handleDelete = async (transaction) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${transaction.description || 'this transaction'}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      setDeletingId(transaction.id);

      await api.delete(`/transactions/${transaction.id}`);

      setSuccess('Transaction deleted successfully.');

      if (editingId === transaction.id) {
        closeForm();
      }

      await fetchTransactions(appliedFilters);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete transaction. Please try again.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Transactions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage all your income and expenses.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => fetchTransactions(appliedFilters)}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={showForm ? closeForm : openAddForm}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? 'Close Form' : 'Add Transaction'}
          </button>
        </div>
      </section>

      {/* Feedback messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Transaction filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
            <Filter size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Filter Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Narrow transactions by type, category, or date.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Type filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Transaction Type
            </label>

            <select
              name="type"
              value={filterForm.type}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-emerald-500"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Category
            </label>

            <select
              name="category_id"
              value={filterForm.category_id}
              onChange={handleFilterChange}
              disabled={categoryLoading}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-emerald-500 disabled:opacity-50"
            >
              <option value="">All Categories</option>

              {categories
                .filter((category) =>
                  !filterForm.type || category.type === filterForm.type
                )
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Start date filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Start Date
            </label>

            <input
              type="date"
              name="start_date"
              value={filterForm.start_date}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500"
            />
          </div>

          {/* End date filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              End Date
            </label>

            <input
              type="date"
              name="end_date"
              value={filterForm.end_date}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500"
            />
          </div>

        </div>

        {filterError && (
          <p className="mt-3 text-sm text-red-600">
            {filterError}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleApplyFilters}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Apply Filters
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>

      </section>

      {/* Add / Edit form */}
      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId !== null ? 'Edit Transaction' : 'Add New Transaction'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {editingId !== null
                ? 'Update the details of this transaction.'
                : 'Enter the details of your income or expense.'}
            </p>
          </div>

          {categoryError && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {categoryError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Transaction type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Transaction Type
                </label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Amount (KSh)
                </label>

                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0.01"
                  max="9999999999.99"
                  step="0.01"
                  required
                  placeholder="Enter amount"
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>

                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  disabled={categoryLoading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
                >
                  <option value="">Uncategorized</option>

                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Transaction Date
                </label>

                <input
                  type="date"
                  name="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description (Optional)
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                maxLength={500}
                rows={3}
                placeholder="Enter a description..."
                className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || categoryLoading}
                className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Update Transaction'
                    : 'Save Transaction'}
              </button>
            </div>

          </form>
        </section>
      )}

      {/* Transaction count */}
      {!loading && !error && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
            <ReceiptText size={22} />
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Transactions found
            </p>

            <p className="text-xl font-bold text-slate-900">
              {transactions.length}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            Loading your transactions...
          </p>
        </div>
      )}

      {/* Transaction table */}
      {!loading && !error && (
        <RecentTransactions
          transactions={transactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {deletingId !== null && (
        <p className="text-sm text-slate-500">
          Deleting transaction...
        </p>
      )}

    </div>
  );
}

export default Transactions;
