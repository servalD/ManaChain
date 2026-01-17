# Authentication Endpoints

## POST /api/auth/register

Register a new user account.

**URL:** `{{base_url}}/auth/register`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePassword123!",
  "age_range": "25-34",
  "interests": ["tech", "fashion", "sport"]
}
```

**Note:** `age_range` is required. Valid values: `18-24`, `25-34`, `35-44`, `45-54`, `55-64`, `65+`

**Response (201):**
```json
{
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "age_range": "25-34",
    "verified": false,
    "is_brand": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## POST /api/auth/login

Login with email and password.

**URL:** `{{base_url}}/auth/login`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "age_range": "25-34",
    "verified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Postman Script (to save token):**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
    pm.environment.set("user_id", jsonData.user.id);
}
```

---

## POST /api/auth/verify-email

Verify email address with token.

**URL:** `{{base_url}}/auth/verify-email`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "token": "verification_token_from_email"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "age_range": "25-34",
    "verified": true
  }
}
```

---

## POST /api/auth/resend-verification

Resend verification email.

**URL:** `{{base_url}}/auth/resend-verification`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email sent"
}
```

---

## POST /api/auth/change-password

Change user password (requires authentication).

**URL:** `{{base_url}}/auth/change-password`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (JSON):**
```json
{
  "old_password": "OldPassword123!",
  "new_password": "NewSecurePassword456!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Old password is incorrect"
}
```
