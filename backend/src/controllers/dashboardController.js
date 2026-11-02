const pool = require('../config/db');

// GET DASHBOARD SUMMARY
const getDashboardSummary = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // 1. Overall and current-month financial totals
        const summaryQuery = `
            WITH date_bounds AS (
                SELECT
                    date_trunc(
                        'month',
                        NOW() AT TIME ZONE 'Africa/Nairobi'
                    )::date AS month_start,

                    (
                        date_trunc(
                            'month',
                            NOW() AT TIME ZONE 'Africa/Nairobi'
                        ) + INTERVAL '1 month'
                    )::date AS next_month_start
            )
            SELECT
                COALESCE(
                    SUM(t.amount) FILTER (
                        WHERE t.type = 'income'
                    ), 0
                )::text AS total_income,

                COALESCE(
                    SUM(t.amount) FILTER (
                        WHERE t.type = 'expense'
                    ), 0
                )::text AS total_expenses,

                COALESCE(
                    SUM(t.amount) FILTER (
                        WHERE t.type = 'income'
                    ), 0
                ) -
                COALESCE(
                    SUM(t.amount) FILTER (
                        WHERE t.type = 'expense'
                    ), 0
                ) AS balance,

                COALESCE(
                    SUM(t.amount) FILTER (
                        WHERE t.type = 'income'
                        AND t.transaction_date >= db.month_start
                        AND t.transaction_date < db.next_month_start
                    ), 0
                )::text AS monthly_income,

                COALESCE(
                    SUM(t.amount) FILTER (
                        WHERE t.type = 'expense'
                        AND t.transaction_date >= db.month_start
                        AND t.transaction_date < db.next_month_start
                    ), 0
                )::text AS monthly_expenses,

                (
                    COALESCE(
                        SUM(t.amount) FILTER (
                            WHERE t.type = 'income'
                            AND t.transaction_date >= db.month_start
                            AND t.transaction_date < db.next_month_start
                        ), 0
                    ) -
                    COALESCE(
                        SUM(t.amount) FILTER (
                            WHERE t.type = 'expense'
                            AND t.transaction_date >= db.month_start
                            AND t.transaction_date < db.next_month_start
                        ), 0
                    )
                )::text AS monthly_balance

            FROM transactions t
            CROSS JOIN date_bounds db
            WHERE t.user_id = $1
        `;

        // 2. Five most recent transactions
        const recentTransactionsQuery = `
            SELECT
                t.id,
                t.type,
                t.amount::text AS amount,
                t.description,
                t.transaction_date,
                t.category_id,
                c.name AS category_name
            FROM transactions t
            LEFT JOIN categories c
                ON c.id = t.category_id
                AND c.user_id = t.user_id
            WHERE t.user_id = $1
            ORDER BY t.transaction_date DESC, t.created_at DESC
            LIMIT 5
        `;

        // 3. Current-month expense breakdown by category
        const expenseBreakdownQuery = `
            SELECT
                COALESCE(c.name, 'Uncategorized') AS category_name,
                COALESCE(SUM(t.amount), 0)::text AS total_amount
            FROM transactions t
            LEFT JOIN categories c
                ON c.id = t.category_id
                AND c.user_id = t.user_id
            WHERE t.user_id = $1
                AND t.type = 'expense'
                AND t.transaction_date >= (
                    date_trunc(
                        'month',
                        NOW() AT TIME ZONE 'Africa/Nairobi'
                    )::date
                )
                AND t.transaction_date < (
                    (
                        date_trunc(
                            'month',
                            NOW() AT TIME ZONE 'Africa/Nairobi'
                        ) + INTERVAL '1 month'
                    )::date
                )
            GROUP BY c.id, c.name
            ORDER BY SUM(t.amount) DESC
        `;

        // Execute dashboard queries concurrently
        const [summary, recentTransactions, expenseBreakdown] =
            await Promise.all([
                pool.query(summaryQuery, [userId]),
                pool.query(recentTransactionsQuery, [userId]),
                pool.query(expenseBreakdownQuery, [userId])
            ]);

        const totals = summary.rows[0];

        return res.status(200).json({
            success: true,
            data: {
                currency: 'KES',
                overview: {
                    total_income: totals.total_income,
                    total_expenses: totals.total_expenses,
                    balance: totals.balance.toString()
                },
                monthly: {
                    income: totals.monthly_income,
                    expenses: totals.monthly_expenses,
                    balance: totals.monthly_balance
                },
                recent_transactions: recentTransactions.rows,
                monthly_expense_breakdown: expenseBreakdown.rows
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardSummary
};
