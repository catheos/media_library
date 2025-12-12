# Backend

## Requirements
- Node.js (v16+ recommended)
- MariaDB Server (v10.5+)
- npm or yarn

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```bash
NODE_ENV=development
DB_HOST=localhost
DB_USER=your_user
DB_PASS=your_password
DB_NAME=media_library
```

### 3. Setup Database
```bash
# Create database
npm run setup

# Run migrations to create tables
npm run migrate

# (Optional) Run seed to create default data in tables
npm run seed
```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Database Management

### Migrations
Migrations define your database schema and are stored in `/backend/migrations/`.

**Available commands:**
```bash
# Run all pending migrations
npm run migrate
# or: npx knex migrate:latest

# Rollback last migration batch
npm run migrate:rollback
# or: npx knex migrate:rollback

# Check migration status
npx knex migrate:status

# Create new migration
npm run migrate:make <migration_name>
# or: npx knex migrate:make <migration_name>
```

**Migration order matters!** Knex runs migrations in timestamp order. Always create foreign key tables after their referenced tables.

### Seeds
Seeds populate tables with default/test data and are stored in `/backend/seeds/`.

**Available commands:**
```bash
# Run all seed files
npm run seed
# or: npx knex seed:run

# Create new seed
npm run seed:make <seed_name>
# or: npx knex seed:make <seed_name>
```

**Note:** Seeds can be run multiple times. Use appropriate insert strategies (e.g., `insert()` for fresh data, `onConflict().ignore()` to prevent duplicates).

## Package.json Scripts

Add these to your `package.json` for convenience:
```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "migrate": "knex migrate:latest",
    "migrate:make": "knex migrate:make",
    "migrate:rollback": "knex migrate:rollback",
    "migrate:status": "knex migrate:status",
    "seed": "knex seed:run",
    "seed:make": "knex seed:make"
  }
}
```

## Database Architecture

- **Driver:** mysql2
- **Query Builder:** Knex.js
- **Connection:** Pooled connections (min: 2, max: 10)
- **Migrations:** Version-controlled schema changes
- **Seeds:** Default and test data

## Troubleshooting

### "Cannot find module 'mysql2'"
```bash
npm install mysql2 --save
```

### Migration errors
Check that:
1. Database credentials in `.env` are correct
2. MariaDB server is running
3. Database exists (migrations will create tables, not the database itself)
4. Previous migrations ran successfully: `npx knex migrate:status`

### "Table already exists" error
If you need to start fresh:
```bash
# Rollback all migrations
npx knex migrate:rollback --all

# Re-run migrations
npm run migrate
```

## Environment-Specific Commands
```bash
# Development (default)
npm run migrate

# Staging
NODE_ENV=staging npm run migrate

# Production
NODE_ENV=production npm run migrate
```

## Project Structure
```
backend/
├── migrations/        # Database schema migrations
├── seeds/            # Default/test data seeds
├── routes/           # API routes
├── controllers/      # Business logic
├── db.js            # Knex connection instance
├── knexfile.js      # Knex configuration
├── server.js        # Application entry point
└── .env             # Environment variables (not committed)
```