const { z } = require('zod');
const pool = require('../config/db');

const dateSchema = z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Dates must use YYYY-MM-DD format'
).refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);

    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date');

const querySchema = z.object({
    start_date: dateSchema.optional(),
    end_date: dateSchema.optional()
}).refine((data) => {
    return !data.start_date ||
        !data.end_date ||
        data.start_date <= data.end_date;
}, {
    message: 'start_date must be on or before end_date'
});

const getReportsSummary = async (req, res, next) => {
    try {
        const parsed = querySchema.safeParse(req.query);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report date range.',
                errors: parsed.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        const { start_date, end_date } = parsed.data;

        const boundsResult = await pool.query(`
            SELECT
                COALESCE(
                    $1::date,
                    (
                        date_trunc(
                            'month',
                            NOW() AT TIME ZONE 'Africa/Nairobi'
                        ) - INTERVAL '5 months'
                    )::date
                ) AS start_date,
                COALESCE(
                    $2::date,
                    (
                        date_trunc(
                            'month',
                            NOW() AT TIME ZONE 'Africa/Nairobi'
                        ) + INTERVAL '1 month' - INTERVAL '1 day'
                    )::date
                ) AS end_date
        `, [start_date || null, end_date || null]);

        const startDate = boundsResult.rows[0].start_date;
        const endDate = boundsResult.rows[0].end_date;

        if (startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: 'start_date must be on or before end_date.'
            });
        }

        const totalsQuery = `
            SELECT
                COALESCE(
                    SUM(amount) FILTER (WHERE type = 'income'), 0
                )::text AS total_income,
                COALESCE(
                    SUM(amount) FILTER (WHERE type = 'expense'), 0
                )::text AS total_expenses,
                (
                    COALESCE(
                        SUM(amount) FILTER (WHERE type = 'income'), 0
                    ) -
                    COALESCE(
                        SUM(amount) FILTER (WHERE type = 'expense'), 0
                    )
                )::text AS balance,
                COUNT(*)::int AS transaction_count
            FROM transactions
            WHERE user_id = $1
                AND transaction_date >= $2::date
                AND transaction_date < ($3::date + INTERVAL '1 day')
        `;

        const monthlyTrendQuery = `
            WITH months AS (
                SELECT generate_series(
                    date_trunc('month', $2::date),
                    date_trunc('month', $3::date),
                    INTERVAL '1 month'
                ) AS month_start
            ),
            monthly_totals AS (
                SELECT
                    date_trunc(
                        'month',
                        transaction_date::timestamp
                    ) AS month_start,
                    COALESCE(
                        SUM(amount) FILTER (WHERE type = 'income'), 0
                    )::text AS income,
                    COALESCE(
                        SUM(amount) FILTER (WHERE type = 'expense'), 0
                    )::text AS expenses
                FROM transactions
                WHERE user_id = $1
                    AND transaction_date >= $2::date
                    AND transaction_date < ($3::date + INTERVAL '1 day')
                GROUP BY date_trunc(
                    'month',
                    transaction_date::timestamp
                )
            )
            SELECT
                TO_CHAR(months.month_start, 'YYYY-MM') AS month,
                TO_CHAR(months.month_start, 'Mon YYYY') AS month_label,
                COALESCE(monthly_totals.income, '0') AS income,
                COALESCE(monthly_totals.expenses, '0') AS expenses
            FROM months
            LEFT JOIN monthly_totals
                ON monthly_totals.month_start = months.month_start
            ORDER BY months.month_start
        `;

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
                AND t.transaction_date >= $2::date
                AND t.transaction_date < ($3::date + INTERVAL '1 day')
            GROUP BY c.id, c.name
            ORDER BY SUM(t.amount) DESC, category_name
        `;

        const [totalsResult, trendResult, breakdownResult] =
            await Promise.all([
                pool.query(totalsQuery, [
                    req.user.id, startDate, endDate
                ]),
                pool.query(monthlyTrendQuery, [
                    req.user.id, startDate, endDate
                ]),
                pool.query(expenseBreakdownQuery, [
                    req.user.id, startDate, endDate
                ])
            ]);

        const totals = totalsResult.rows[0];

        return res.status(200).json({
            success: true,
            data: {
                currency: 'KES',
                period: {
                    start_date: startDate,
                    end_date: endDate
                },
                overview: {
                    total_income: totals.total_income,
                    total_expenses: totals.total_expenses,
                    balance: totals.balance,
                    transaction_count: totals.transaction_count
                },
                monthly_trend: trendResult.rows,
                expense_breakdown: breakdownResult.rows
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getReportsSummary
};
