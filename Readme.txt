# Backend Ledger - Transaction Management System

## Project Overview
A robust backend system for managing financial transactions, accounts, and ledger entries with double-entry bookkeeping principles.

---

## Development Phases

### Phase 1: Project Setup & Configuration
**Commit Message:** "feat: initial project setup with dependencies"

Files:
- package.json - Dependencies (express, mongoose, dotenv, jsonwebtoken, bcryptjs, nodemailer, cookie-parser)
- .gitignore - Ignore node_modules, .env
- .env - Environment variables (MongoDB URI, JWT Secret, Email config)
- src/server.js - Server initialization
- src/app.js - Express app configuration with middlewares

---

### Phase 2: Database Connection
**Commit Message:** "feat: add MongoDB connection configuration"

Files:
- src/config/db.js - MongoDB connection logic with error handling

---

### Phase 3: User Authentication - Models
**Commit Message:** "feat: implement user model with password hashing"

Files:
- src/models/user.model.js - User schema with email validation, password hashing (bcrypt)

Features:
- Email validation with regex
- Password hashing pre-save hook
- Password comparison method
- Timestamps

---

### Phase 4: User Authentication - Controllers & Routes
**Commit Message:** "feat: add user registration and login endpoints"

Files:
- src/controllers/auth.controller.js - Registration and login logic
- src/routes/auth.routes.js - Auth routes
- Mount routes in src/app.js

Features:
- User registration with duplicate email check
- User login with password verification
- JWT token generation
- Cookie-based authentication

---

### Phase 5: Email Service Integration
**Commit Message:** "feat: integrate email service for registration notifications"

Files:
- src/services/email.service.js - Nodemailer with Gmail OAuth2

Features:
- Welcome email on user registration
- Gmail OAuth2 integration
- Error handling

---

### Phase 6: Authentication Middleware
**Commit Message:** "feat: add JWT authentication middleware"

Files:
- src/middlewares/auth.middleware.js

Features:
- Token verification from cookies/headers
- User validation from database
- Error handling (expired, invalid, missing tokens)

---

### Phase 7: Account Management - Models
**Commit Message:** "feat: implement account model with status management"

Files:
- src/models/account.model.js

Features:
- User reference (one-to-many relationship)
- Account status (ACTIVE, FROZEN, CLOSED)
- Currency support
- Account types (SAVINGS, CURRENT, SALARY)
- Balance tracking
- Compound indexes for performance

---

### Phase 8: Account Management - Controllers & Routes
**Commit Message:** "feat: add account creation endpoint with auth"

Files:
- src/controllers/account.controller.js - Account creation logic
- src/routes/account.routes.js - Account routes with auth middleware
- Mount routes in src/app.js

Features:
- Protected account creation (requires authentication)
- Default values for currency and account type
- User association through JWT

---

### Phase 9: Transaction Model
**Commit Message:** "feat: implement transaction model with idempotency"

Files:
- src/models/transaction.model.js

Features:
- Double-entry transaction support (fromAccount, toAccount)
- Transaction status (PENDING, COMPLETED, FAILED, REVERSED)
- Idempotency key for duplicate prevention
- Amount validation
- Compound indexes

---

### Phase 10: Ledger Model (Immutable)
**Commit Message:** "feat: add immutable ledger model for audit trail"

Files:
- src/models/ledger.model.js

Features:
- Immutable ledger entries (CREDIT/DEBIT)
- Prevention hooks for update/delete operations
- Account and transaction references
- Audit trail support

---

### Phase 11: Transaction Controller & Routes
**Commit Message:** "feat: implement transaction creation with ledger entries"

Files:
- src/controllers/transaction.controller.js - Transaction logic
- src/routes/transaction.routes.js - Transaction routes

Features:
- Create transactions between accounts
- Automatic ledger entry generation (double-entry)
- Balance validation
- Transaction status management

---

## Tech Stack

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose

**Authentication:**
- JWT (JSON Web Tokens)
- bcryptjs (Password hashing)

**Email:**
- Nodemailer with Gmail OAuth2

**Other:**
- dotenv (Environment variables)
- cookie-parser (Cookie handling)

---

## Project Structure

```
Backend Ledger/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── account.controller.js
│   │   └── transaction.controller.js
│   ├── middlewares/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── account.model.js
│   │   ├── transaction.model.js
│   │   └── ledger.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── account.routes.js
│   │   └── transaction.routes.js
│   ├── services/
│   │   └── email.service.js
│   ├── app.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── Readme.txt
```

---

## API Endpoints

### Auth Routes (`/api/auth`)
- POST `/register` - User registration
- POST `/login` - User login

### Account Routes (`/api/accounts`) - Protected
- POST `/` - Create account (requires auth)

### Transaction Routes (`/api/transactions`) - Protected
- POST `/` - Create transaction (requires auth)

---

## Environment Variables

```
MONGO_URI=mongodb://localhost:27017/backend-ledger
JWT_SECRET=your_jwt_secret
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REFRESH_TOKEN=your_google_oauth_refresh_token
EMAIL_USER=your_email@gmail.com
```

---

## Key Features

1. **Secure Authentication** - JWT with httpOnly cookies
2. **Email Notifications** - Welcome emails on registration
3. **Account Management** - Multiple account types per user
4. **Double-Entry Bookkeeping** - Automatic ledger entries
5. **Idempotency** - Prevent duplicate transactions
6. **Immutable Ledger** - Audit trail protection
7. **Performance** - Database indexes for fast queries

---

## How to Run

1. Install dependencies:
   ```
   npm install
   ```

2. Set up .env file with required variables

3. Start MongoDB locally or use MongoDB Atlas

4. Run development server:
   ```
   npm run dev
   ```

5. Server runs on `http://localhost:3000`

---

## Future Enhancements

- Transaction history API
- Account balance retrieval
- Transaction reversal logic
- Admin dashboard
- Rate limiting
- API documentation (Swagger)
- Unit tests
- CI/CD pipeline

---

## Developed by:
Siddesh Rizwani
