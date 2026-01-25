# Safari Management System - Backend

Backend API for Safari Management System built with Node.js, Express, PostgreSQL, and Sequelize.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Project Structure

```
BackEnd/
├── src/
│   ├── config/          # Database and other configurations
│   ├── models/          # Sequelize models
│   ├── controllers/     # Route controllers
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware (auth, error handling)
│   ├── utils/           # Utility functions
│   └── server.js        # Application entry point
├── .env                 # Environment variables
├── .env.example         # Environment variables template
├── .gitignore
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure Database**:

   - Create a PostgreSQL database named `safari_management`
   - Update the `.env` file with your database credentials:
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=safari_management
     DB_USER=your_postgres_user
     DB_PASSWORD=your_postgres_password
     ```

3. **Configure Environment Variables**:
   - Copy `.env.example` to `.env`
   - Update the values as needed:
     - `JWT_SECRET`: Change to a secure random string
     - `DB_*`: Your PostgreSQL credentials
     - `PORT`: Server port (default: 5000)

### Running the Application

**Development mode** (with auto-reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

The API will be available at `http://localhost:5000`

## API Endpoints

Base URL: `http://localhost:5000`

### Health Check

- `GET /` - API status and version

### Authentication (to be implemented)

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Additional endpoints will be added based on requirements

## Environment Variables

| Variable     | Description                          | Default               |
| ------------ | ------------------------------------ | --------------------- |
| PORT         | Server port                          | 5000                  |
| NODE_ENV     | Environment (development/production) | development           |
| DB_HOST      | PostgreSQL host                      | localhost             |
| DB_PORT      | PostgreSQL port                      | 5432                  |
| DB_NAME      | Database name                        | safari_management     |
| DB_USER      | Database user                        | postgres              |
| DB_PASSWORD  | Database password                    | -                     |
| JWT_SECRET   | Secret key for JWT                   | -                     |
| JWT_EXPIRE   | JWT expiration time                  | 7d                    |
| FRONTEND_URL | Frontend URL for CORS                | http://localhost:5173 |

## Development

- Models are defined in `src/models/`
- Controllers handle business logic in `src/controllers/`
- Routes define API endpoints in `src/routes/`
- Middleware for authentication and error handling in `src/middleware/`

## Database

The application uses Sequelize ORM with PostgreSQL. Database connection is configured in `src/config/database.js`.

## License

ISC
