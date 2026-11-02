
import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Tags,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

import api from '../api/axios';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/categories');

      setCategories(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load categories. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const incomeCategories = categories.filter(
    (category) => category.type === 'income'
  );

  const expenseCategories = categories.filter(
    (category) => category.type === 'expense'
  );

  const openAddForm = (type = 'expense') => {
    setEditingId(null);
    setFormData({ name: '', type });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const openEditForm = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      type: category.type,
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', type: 'expense' });
    setError('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();

    if (!name) {
      setError('Enter a category name.');
      return;
    }

    if (name.length > 100) {
      setError('Category names cannot exceed 100 characters.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (editingId !== null) {
        await api.put(`/categories/${editingId}`, { name });
        setSuccess('Category renamed successfully.');
      } else {
        await api.post('/categories', {
          name,
          type: formData.type,
        });
        setSuccess('Category created successfully.');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', type: 'expense' });

      await fetchCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        `Unable to ${editingId !== null ? 'update' : 'create'} category. Please try again.`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete the "${category.name}" category? Existing transactions will be preserved but will no longer be assigned to this category.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(category.id);
      setError('');
      setSuccess('');

      await api.delete(`/categories/${category.id}`);

      setSuccess(`Category "${category.name}" deleted successfully.`);

      if (editingId === category.id) {
        setShowForm(false);
        setEditingId(null);
      }

      await fetchCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete category. Please try again.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const renderCategoryList = (items, type) => (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg p-3 ${
              type === 'income'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-orange-50 text-orange-600'
            }`}
          >
            {type === 'income'
              ? <TrendingUp size={20} />
              : <TrendingDown size={20} />}
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              {type === 'income' ? 'Income Categories' : 'Expense Categories'}
            </h2>
            <p className="text-sm text-slate-500">
              {items.length} {items.length === 1 ? 'category' : 'categories'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openAddForm(type)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center">
          <Tags size={28} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            No {type} categories yet.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">
                  {category.name}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {type === 'income' ? 'Income' : 'Expense'}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditForm(category)}
                  aria-label={`Edit ${category.name}`}
                  title="Rename category"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                >
                  <Pencil size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(category)}
                  disabled={deletingId === category.id}
                  aria-label={`Delete ${category.name}`}
                  title="Delete category"
                  className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === category.id
                    ? <RefreshCw size={16} className="animate-spin" />
                    : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Categories
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize your income and expenses into categories.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCategories}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
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

      {/* Add / Edit form */}
      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingId !== null ? 'Rename Category' : 'Add Category'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {editingId !== null
                  ? 'Change the category name.'
                  : 'Create a category for your income or expenses.'}
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              aria-label="Close category form"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="category-name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Category Name
              </label>
              <input
                id="category-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength={100}
                required
                autoFocus
                placeholder="e.g. Transport, Salary, Rent"
                className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {editingId === null && (
              <div>
                <label
                  htmlFor="category-type"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Category Type
                </label>
                <select
                  id="category-type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-emerald-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Save Changes'
                    : 'Create Category'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Category summary */}
      {!loading && !error && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Categories</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {categories.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Income Categories</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {incomeCategories.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Expense Categories</p>
            <p className="mt-2 text-2xl font-bold text-orange-600">
              {expenseCategories.length}
            </p>
          </div>
        </section>
      )}

      {/* Loading state */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <RefreshCw size={24} className="mx-auto animate-spin text-emerald-600" />
          <p className="mt-3 text-sm text-slate-500">
            Loading categories...
          </p>
        </div>
      )}

      {/* Category lists */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {renderCategoryList(incomeCategories, 'income')}
          {renderCategoryList(expenseCategories, 'expense')}
        </div>
      )}

    </div>
  );
}

export default Categories;
