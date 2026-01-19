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
- [BRAND_APPLICATIONS.md](./BRAND_APPLICATIONS.md) - Brand application system (public submission + admin review)
- [TOKENS.md](./TOKENS.md) - Token operations endpoints

## Brand Applications

The brand application system allows brands to apply to join the platform. The workflow is:

1. **Public Submission**: Brands submit applications via `POST /brand-applications` (no auth required)
2. **Admin Review**: Admins review applications via the admin dashboard
3. **Approval/Rejection**: 
   - **Approve**: Creates user account + brand profile, sends credentials
   - **Reject**: Sends rejection email with reason

See [BRAND_APPLICATIONS.md](./BRAND_APPLICATIONS.md) for detailed documentation.

### Key Endpoints

- `POST /brand-applications` - Submit application (public)
- `GET /brand-applications` - List all applications (admin)
- `GET /brand-applications/:id` - Get application details (admin)
- `PUT /brand-applications/:id/approve` - Approve application (admin)
- `PUT /brand-applications/:id/reject` - Reject application (admin)

## Quick Start

1. Start the server: `cd server && pnpm dev`
2. Import the examples into Postman
3. Set up environment variables
4. Start with `/auth/register` to create a user
5. Use `/auth/login` to get a token
6. Set the `token` variable in Postman
7. Test other endpoints

### Testing Brand Applications

1. Submit an application: `POST /brand-applications` (no auth)
2. Login as admin to review
3. Approve or reject the application
