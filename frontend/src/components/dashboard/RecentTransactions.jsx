
import { formatCurrency } from '../../utils/formatCurrency';
import { Pencil, Trash2 } from 'lucide-react';

function RecentTransactions({
  transactions,
  onEdit,
  onDelete
}) {
  const showActions = Boolean(onEdit || onDelete);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="font-semibold text-slate-900">
          Recent Transactions
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Your latest financial activity
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <th className="pb-3 font-medium">Description</th>
              <th className="pb-3 font-medium">Category</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 text-right font-medium">Amount</th>

              {showActions && (
                <th className="pb-3 text-right font-medium">Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-slate-50 last:border-0"
              >
                <td className="py-4 font-medium text-slate-800">
                  {transaction.description || 'No description'}
                </td>

                <td className="py-4 text-slate-500">
                  {transaction.category_name || 'Uncategorized'}
                </td>

                <td className="py-4 whitespace-nowrap text-slate-500">
                  {new Date(transaction.transaction_date).toLocaleDateString('en-KE')}
                </td>

                <td className={`py-4 whitespace-nowrap text-right font-semibold ${
                  transaction.type === 'income'
                    ? 'text-emerald-600'
                    : 'text-orange-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </td>

                {showActions && (
                  <td className="py-4">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(transaction)}
                          title="Edit transaction"
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={17} />
                        </button>
                      )}

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(transaction)}
                          title="Delete transaction"
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {transactions.length === 0 && (
              <tr>
                <td
                  colSpan={showActions ? 5 : 4}
                  className="py-8 text-center text-slate-500"
                >
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentTransactions;
