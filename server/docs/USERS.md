# User Endpoints

## GET /api/users/me

Get current authenticated user profile.

**URL:** `{{base_url}}/users/me`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "avatar_url": null,
    "age_range": "25-34",
    "verified": true,
    "is_brand": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Note:** `age_range` is always present. Valid values: `18-24`, `25-34`, `35-44`, `45-54`, `55-64`, `65+`

---

## PUT /api/users/me

Update current user profile.

**URL:** `{{base_url}}/users/me`

**Method:** `PUT`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (JSON):**
```json
{
  "username": "newusername",
  "first_name": "John",
  "last_name": "Smith",
  "avatar_url": "https://example.com/avatar.jpg",
  "age_range": "35-44"
}
```

**Response (200):**
```json
{
  "message": "Profile updated",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "newusername",
    "first_name": "John",
    "last_name": "Smith",
    "avatar_url": "https://example.com/avatar.jpg",
    "age_range": "35-44"
  }
}
```

---

## GET /api/users/me/interests

Get current user's interests.

**URL:** `{{base_url}}/users/me/interests`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200):**
```json
{
  "interests": [
    {
      "id": "tech",
      "label": "Technology",
      "icon": "💻"
    },
    {
      "id": "fashion",
      "label": "Fashion",
      "icon": "👗"
    },
    {
      "id": "sport",
      "label": "Sports",
      "icon": "⚽"
    }
  ]
}
```

---

## PUT /api/users/me/interests

Update user interests (minimum 3 required).

**URL:** `{{base_url}}/users/me/interests`

**Method:** `PUT`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (JSON):**
```json
{
  "interests": ["tech", "fashion", "sport", "music"]
}
```

**Response (200):**
```json
{
  "message": "Interests updated"
}
```

**Error Response (400):**
```json
{
  "error": "At least 3 interests are required"
}
```

---

## GET /api/interests

Get all available interests (public endpoint).

**URL:** `{{base_url}}/interests`

**Method:** `GET`

**Response (200):**
```json
{
  "interests": [
    {
      "id": "fashion",
      "label": "Fashion",
      "icon": "👗"
    },
    {
      "id": "tech",
      "label": "Technology",
      "icon": "💻"
    },
    {
      "id": "sport",
      "label": "Sports",
      "icon": "⚽"
    }
  ]
}
```

---

## GET /api/users/from-token/:token

Get user information from JWT token.

**URL:** `{{base_url}}/users/from-token/{{token}}`

**Method:** `GET`

**Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "age_range": "25-34",
    "verified": true
  }
}
```

**Error Response (401):**
```json
{
  "error": "Token expired"
}
```
