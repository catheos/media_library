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

Edit `.env` with your credentials:
```dotenv
# Environment
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_NAME=media_library
DB_USER=root
DB_PASS=your_password

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=604800
```

**Generate a strong JWT_SECRET for production:**
```bash
# Linux/Mac
openssl rand -base64 32

# Node.js (any platform)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Setup Database
```bash
# First time setup (creates database, runs migrations, seeds data)
npm run setup

# Or reset everything and start fresh
npm run setup:reset
```

## Running the Application

### Development
```bash
npm run dev
```
Server runs on `http://localhost:3000` (or your configured PORT)

### Production
```bash
npm run build
npm start
```

## API Authentication

The API uses JWT (JSON Web Token) authentication. All endpoints except `/api/users/register` and `/api/users/login` require authentication.

### Authentication Flow

**1. Register a new user:**
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

**2. Login (for returning users):**
```http
POST /api/users/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

**3. Use the token in protected endpoints:**
```http
GET /api/media/types
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Password Requirements
- Minimum 6 characters
- No special character requirements (configurable in code)

### Token Configuration
- **Expiration:** `JWT_EXPIRES_IN` in seconds (default: 604800 = 7 days)
- **Secret:** `JWT_SECRET` - **must be set in production with a strong random string**

## API Endpoints

### Public Endpoints (No Authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login user |

### Protected Endpoints (Authentication Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | `/api/users` | Delete current user account |
| GET | `/api/media/types` | Get all media types |

**All protected endpoints require:**
- `Authorization: Bearer <token>` header
- Valid, non-expired JWT token

## Database Management

### Migrations
Migrations define your database schema and are version-controlled in `/backend/migrations/`.

**Common commands:**
```bash
# Run all pending migrations
npm run migrate

# Create a new migration
npm run migrate:make add_column_to_users

# Check migration status
npm run migrate:status

# Rollback last migration batch
npm run migrate:rollback
```

**Important notes:**
- Migrations run in **timestamp order** (based on filename)
- Always create tables with foreign keys **after** their referenced tables
- Use descriptive migration names: `create_users_table`, `add_email_to_users`

### Seeds
Seeds populate tables with default/test data, stored in `/backend/seeds/`.

**Common commands:**
```bash
# Run all seed files
npm run seed

# Create a new seed
npm run seed:make add_default_media_types
```

**Seed best practices:**
- Use `.onConflict().ignore()` to prevent duplicate insertions on re-runs
- Order seeds by table dependencies (lookup tables first)
- Keep seeds idempotent (safe to run multiple times)

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production build |
| `npm run setup` | First-time setup (create DB + migrate + seed) |
| `npm run setup:reset` | **Nuclear option** - drops DB and recreates everything |
| `npm run migrate` | Run pending migrations |
| `npm run migrate:make <name>` | Create new migration |
| `npm run migrate:rollback` | Undo last migration batch |
| `npm run migrate:status` | Show which migrations have run |
| `npm run seed` | Run seed files |
| `npm run seed:make <name>` | Create new seed |

## Database Architecture

### Technology Stack
- **Database:** MariaDB/MySQL
- **Driver:** mysql2
- **Query Builder:** Knex.js
- **ORM:** None (using Knex query builder)
- **Connection Pooling:** Min: 2, Max: 10
- **Authentication:** JWT + bcrypt password hashing

### Database Schema

**Core Tables:**
- `user` - User accounts with hashed passwords
- `media` - Media items (novels, TV series, anime, movies, comics, manga, video games)
- `character` - Character information with flexible JSON details field
- `tag` - Tags for categorization

**Lookup Tables (enum-like):**
- `media_types` - Types of media
- `media_status_types` - Production status (ongoing, completed, hiatus, upcoming)
- `character_roles` - Character roles (protagonist, antagonist, supporting, cameo, guest)
- `user_media_status_types` - User's consumption status (planning, watching, completed, dropped, on_hold)
- `tag_types` - Tag categories (genre, theme, demographic)

**Junction Tables (many-to-many relationships):**
- `media_character` - Links characters to media with their role
- `media_tag` - Links tags to media
- `user_media` - User's progress, ratings, and reviews for media

### Naming Conventions
- Tables: `snake_case` (e.g., `media_types`)
- Columns: `snake_case` (e.g., `user_id`)
- Primary keys: `id` (auto-increment)
- Foreign keys: `<table>_id` (e.g., `media_id`)
- Junction tables: `<table1>_<table2>` (e.g., `media_character`)

## Environment-Specific Deployment

The application supports multiple environments via `NODE_ENV`.

### Development (default)
```bash
NODE_ENV=development npm run migrate
npm run dev
```

### Staging
```bash
NODE_ENV=staging npm run migrate
NODE_ENV=staging npm start
```

### Production
```bash
NODE_ENV=production npm run migrate
NODE_ENV=production npm start
```

**Environment-specific configuration is in `knexfile.js`**

## Project Structure
```
backend/
├── src/
│   ├── index.ts              # Express app & server entry point
│   ├── db.ts                 # Knex connection instance
│   ├── routes/
│   │   ├── users.ts          # User auth & management routes
│   │   └── media.ts          # Media CRUD routes
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication middleware
│   └── utils/
│       └── auth.ts           # Auth helpers (hash, compare, generate token)
├── migrations/               # Database schema migrations (JS)
├── seeds/                    # Default/test data (JS)
├── dist/                     # Compiled JavaScript (gitignored)
├── knexfile.js              # Knex configuration (dev/staging/prod)
├── setup-db.ts              # Database creation script
├── tsconfig.json            # TypeScript configuration
├── nodemon.json             # Nodemon configuration
├── package.json             # Dependencies & scripts
├── .env                     # Environment variables (gitignored)
├── .env.example             # Environment template (committed)
└── README.md                # This file
```

## Security Best Practices

### Required for Production
- [ ] Use a **strong random JWT_SECRET** (32+ characters)
- [ ] Enable **HTTPS only** for API endpoints
- [ ] Set secure **CORS** policies
- [ ] Use environment variables for all secrets
- [ ] Never commit `.env` to version control
- [ ] Implement **rate limiting** on auth endpoints
- [ ] Add **input validation** and sanitization
- [ ] Use **prepared statements** (Knex does this by default)

### Recommended Enhancements
- Add refresh token mechanism
- Implement password reset flow
- Add email verification
- Set up logging and monitoring
- Implement role-based access control (RBAC)
- Add request validation middleware (e.g., express-validator)
- Set up automated backups

## Contributing

When adding new features:
1. Create a migration for schema changes: `npm run migrate:make <description>`
2. Update seeds if adding lookup table values
3. Add appropriate authentication to new routes
4. Update this README with new endpoints
5. Test in development before deploying

## License
MIT