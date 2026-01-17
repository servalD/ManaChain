# Mana Chain API - Postman Examples

This directory contains Postman collection examples for testing all API endpoints.

## Base URL

```
http://localhost:3001/api
```

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Environment Variables for Postman

Create a Postman environment with these variables:

- `base_url`: `http://localhost:3001/api`
- `token`: (will be set after login)
- `user_id`: (will be set after login)
- `brand_id`: (will be set after creating a brand)
- `token_id`: (will be set after creating a token)

## Files

- [AUTH.md](./AUTH.md) - Authentication endpoints (register, login, verify email, etc.)
- [USERS.md](./USERS.md) - User management endpoints
- [BRANDS.md](./BRANDS.md) - Brand management endpoints
- [TOKENS.md](./TOKENS.md) - Token operations endpoints

## Quick Start

1. Start the server: `cd server && pnpm dev`
2. Import the examples into Postman
3. Set up environment variables
4. Start with `/auth/register` to create a user
5. Use `/auth/login` to get a token
6. Set the `token` variable in Postman
7. Test other endpoints
