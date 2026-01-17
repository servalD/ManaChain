# Mana Chain - Backend API

RESTful API for the Mana Chain platform, built with Express.js, TypeScript and Supabase.

## 🚀 Installation

```bash
cd server
pnpm install
```

## ⚙️ Configuration

1. Create a `.env` file at the root of the `server` folder:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# JWT Configuration
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d

# Email Service Configuration (SMTP)
SMTP_HOST=your_smtp_host_here
SMTP_PORT=587
SMTP_USER=your_smtp_username_here
SMTP_PASS=your_smtp_password_here
FROM_EMAIL=noreply@mana-chain.com
FRONTEND_URL=http://localhost:3000

# Note: If SMTP is not configured, the service will run in simulation mode (logs only)

# Server Configuration
PORT=3001
```

2. Execute the SQL script in Supabase:

The `SQL/init.sql` file contains the complete database schema. Execute it in Supabase's SQL editor.

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Register (regular user)
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/change-password` - Change password (authenticated)

### Users

- `GET /api/users/me` - Current user profile
- `PUT /api/users/me` - Update profile
- `GET /api/users/me/interests` - User interests
- `PUT /api/users/me/interests` - Update interests
- `GET /api/interests` - List all interests

### Brands

- `POST /api/brands` - Create a brand (authenticated, verified)
- `GET /api/brands` - List brands (with filters)
- `GET /api/brands/me` - My brand (authenticated, brand)
- `GET /api/brands/:id` - Brand details
- `GET /api/brands/user/:userId` - User's brand
- `PUT /api/brands/:id` - Update brand (authenticated, brand, owner)
- `DELETE /api/brands/:id` - Delete brand (authenticated, brand, owner)
- `GET /api/brands/:id/stats` - Brand statistics

### Tokens

- `POST /api/tokens` - Create a token (authenticated, brand, verified)
- `GET /api/tokens/:id` - Token details
- `GET /api/tokens/brand/:brandId` - Brand's token
- `PUT /api/tokens/:id/price` - Update price (authenticated, brand, owner)
- `GET /api/tokens/:id/holders` - List holders
- `GET /api/tokens/:id/balance` - My balance for this token (authenticated)
- `POST /api/tokens/:id/transfer` - Transfer tokens (authenticated, verified)
- `POST /api/tokens/:id/purchase` - Purchase tokens (authenticated, verified)
- `GET /api/tokens/:id/transactions` - Transaction history
- `GET /api/tokens/my/transactions` - My transactions (authenticated)
- `GET /api/tokens/my/portfolio` - My portfolio (authenticated)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 🔧 Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🛡️ Middleware

### Authentication Middleware

- `requireAuth` - Requires valid JWT token
- `optionalAuth` - Authenticates if token present
- `requireVerified` - Requires verified email
- `requireBrand` - Requires brand account
- `requireUser` - Requires regular user account

## 📝 Service Layer

Services handle business logic and database operations:

- **AuthService**: Registration, login, email verification
- **UserService**: User management, interests
- **BrandService**: Brand CRUD operations
- **TokenService**: Token operations, transfers, purchases
- **EmailService**: Email notifications
- **JwtService**: JWT generation and verification

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_SERVICE_KEY` | Supabase service key | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `SMTP_HOST` | SMTP server host | Optional (simulation mode if not set) |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | Optional (simulation mode if not set) |
| `SMTP_PASS` | SMTP password | Optional (simulation mode if not set) |
| `FROM_EMAIL` | Sender email address | `noreply@mana-chain.com` |
| `FRONTEND_URL` | Frontend URL for links | `http://localhost:3000` |
| `PORT` | Server port | `3001` |

## 🐛 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE" // Optional
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 📊 Database Schema

The database uses PostgreSQL via Supabase. See `SQL/init.sql` for the complete schema.

Main tables:
- `user` - Users (regular and brands)
- `brand` - Brand information
- `interest` - Available interests
- `user_interest` - User-interest relationships
- `brand_token` - Tokens issued by brands
- `token_holder` - Token ownership
- `token_transaction` - Transaction history

## 📄 License
See LICENSE file for details.