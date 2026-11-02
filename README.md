# Expense Tracker Web Application

A full-stack personal finance management application built with the PERN stack (PostgreSQL, Express.js, React.js and Node.js). It enables users to manage income and expenses, organize transactions into categories, monitor their financial position, and analyze spending through interactive reports.

**Live Application:** https://expense-tracker-1-fjt4.onrender.com

**Repository:** https://github.com/kevinwandei08/expense-tracker

---

## 1. Project Overview

The Expense Tracker is designed to help individuals record, organize and monitor their finances through a centralized web application.

Users can create accounts, securely log in, record income and expenses, manage transaction categories, view financial summaries, and analyze financial activity over selected periods.

The application uses Kenyan Shillings (KES/KSh) as its currency.

## 2. Features

### Authentication and User Management
- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Protected application routes.
- User-specific financial records.

### Transaction Management
- Record income and expenses.
- View transaction history.
- Edit existing transactions.
- Delete transactions.
- Filter transactions by available criteria.
- Associate transactions with categories.

### Category Management
- Create income and expense categories.
- View existing categories.
- Edit category names.
- Delete categories.
- Separate income and expense categories.

### Dashboard
- Total income.
- Total expenses.
- Current balance.
- Recent transactions.
- Financial summaries and charts.

### Financial Reports
- Filter reports by date range.
- View income, expenses and balance summaries.
- Analyze expenses by category.
- View interactive charts using Recharts.

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite |
| Styling | Tailwind CSS 4 |
| Routing | React Router |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js, Express.js 5 |
| Database | PostgreSQL |
| Authentication | JWT, bcryptjs |
| Validation | Zod |
| Security | Helmet, CORS, express-rate-limit |
| Deployment | Render |
| Database Hosting | Neon PostgreSQL |
| Version Control | Git and GitHub |

## 4. Application Architecture

The application follows a client-server architecture.

1. The React frontend provides the user interface.
2. Axios communicates with the Express REST API.
3. Express handles authentication, validation and business logic.
4. PostgreSQL stores users, categories and transactions.
5. JWT protects authenticated API operations.

### Architecture Overview

```text
                  USER
                   |
                   v
          REACT FRONTEND
           (Render Static)
                   |
                Axios
                   |
                   v
          EXPRESS REST API
             (Render)
                   |
          Authentication
          Validation
          Controllers
                   |
                   v
           POSTGRESQL
              (Neon)
```

## 5. Database Design

The application uses three primary relational database tables.

### Users
Stores registered application users.

| Column | Description |
|---|---|
| id | Primary key |
| full_name | User's full name |
| email | Unique email address |
| password_hash | Hashed password |
| created_at | Account creation timestamp |
| updated_at | Last update timestamp |

### Categories
Stores income and expense categories associated with individual users.

| Column | Description |
|---|---|
| id | Primary key |
| user_id | Associated user |
| name | Category name |
| type | Income or expense |
| created_at | Creation timestamp |

### Transactions
Stores financial transactions.

| Column | Description |
|---|---|
| id | Primary key |
| user_id | Associated user |
| category_id | Optional category reference |
| type | Income or expense |
| amount | Transaction amount |
| description | Transaction description |
| transaction_date | Transaction date |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

### Database Relationships

- One user can have multiple categories.
- One user can have multiple transactions.
- A category can be associated with multiple transactions.
- Deleting a user removes their associated categories and transactions.
- Deleting a category preserves its transactions while removing their category association.

Database constraints enforce valid transaction types, positive transaction amounts, unique category names per user and referential integrity.

Indexes support common transaction and category queries.

## 6. REST API Endpoints

All API endpoints are prefixed with `/api`.

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | API health check |
| GET | `/health/db` | Database connectivity check |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate a user |
| GET | `/auth/me` | Retrieve authenticated user |

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| POST | `/transactions` | Create transaction |
| GET | `/transactions` | Retrieve transactions |
| GET | `/transactions/:id` | Retrieve individual transaction |
| PUT | `/transactions/:id` | Update transaction |
| DELETE | `/transactions/:id` | Delete transaction |

### Categories

| Method | Endpoint | Description |
|---|---|---|
| POST | `/categories` | Create category |
| GET | `/categories` | Retrieve categories |
| GET | `/categories/:id` | Retrieve individual category |
| PUT | `/categories/:id` | Update category |
| DELETE | `/categories/:id` | Delete category |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/summary` | Retrieve dashboard financial summary |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/summary` | Retrieve financial report summary |

Authenticated endpoints require a valid JWT bearer token in the Authorization header.

## 7. Local Installation and Setup

### Prerequisites

Install the following:

- Node.js and npm
- PostgreSQL
- Git

### Clone the Repository

```bash
git clone https://github.com/kevinwandei08/expense-tracker.git

cd expense-tracker
```

### Database Setup

Create a PostgreSQL database named:

```text
expense_tracker
```

Create a database user with appropriate privileges, then execute the database schema:

```bash
psql -U expense_app -d expense_tracker -f backend/src/config/schema.sql
```

Replace the database username if you use a different PostgreSQL user.

### Backend Setup

Navigate to the backend:

```bash
cd backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Configure the `.env` file with your local database credentials and application settings.

Example configuration:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=expense_tracker
DB_USER=expense_app
DB_PASSWORD=your_database_password

JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=1d

CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:5000
```

### Frontend Setup

Open another terminal:

```bash
cd expense-tracker/frontend
npm install
```

Create a frontend environment file:

```bash
nano .env
```

Add:

```env
VITE_API_URL=http://localhost:5000/api
```

Save the file and start the frontend:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

## 8. Production Deployment

The application is deployed using Render and Neon PostgreSQL.

| Component | Hosting Platform |
|---|---|
| React frontend | Render Static Site |
| Express backend | Render Web Service |
| PostgreSQL database | Neon |

### Frontend Environment Variable

```env
VITE_API_URL=https://YOUR-BACKEND-URL/api
```

### Backend Environment Variables

```env
NODE_ENV=production
DATABASE_URL=YOUR_NEON_CONNECTION_STRING
JWT_SECRET=YOUR_PRODUCTION_SECRET
JWT_EXPIRES_IN=1d
CLIENT_URL=YOUR_FRONTEND_URL
```

Production credentials must be configured through the hosting provider's environment settings and must never be committed to GitHub.

## 9. Security Considerations

The application implements several security measures:

- Password hashing using bcryptjs.
- JWT-based authentication.
- Protected API routes.
- User-scoped database queries.
- Parameterized SQL queries.
- Request validation using Zod.
- HTTP security headers using Helmet.
- CORS configuration.
- API rate limiting.
- Request body size restrictions.
- Environment variables for sensitive configuration.

## 10. Testing and Verification

The application was manually tested during development and deployment.

Verification covered:

- User registration and login.
- Authentication and protected routes.
- Transaction creation, retrieval, updating and deletion.
- Transaction filtering.
- Category creation, retrieval, updating and deletion.
- Dashboard financial calculations.
- Reports and date filtering.
- Database connectivity.
- Production API connectivity.
- Frontend-to-backend communication.

## 11. Project Structure

```text
expense-tracker/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── schema.sql
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## 12. Future Improvements

Potential future enhancements include:

- Budget creation and monitoring.
- Recurring transactions.
- CSV and PDF report exports.
- Advanced financial analytics.
- Savings goals.
- Multi-currency support.
- Automated backend and frontend testing.

## 13. Author

**Kevin Wandei**

GitHub: [kevinwandei08](https://github.com/kevinwandei08)

---

*Expense Tracker Web Application — Full-stack personal finance management using the PERN stack.*