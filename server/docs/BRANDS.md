# Brand Endpoints

## POST /api/brands

Create a new brand (requires authentication and verified email).

**URL:** `{{base_url}}/brands`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (JSON):**
```json
{
  "name": "TechStart Inc",
  "industry_type": "technology",
  "description": "A cutting-edge technology startup",
  "logo_url": "https://example.com/logo.png",
  "website_url": "https://techstart.com",
  "business_registration_number": "123456789",
  "country": "France",
  "headquarters_street": "123 Innovation Street",
  "headquarters_city": "Paris",
  "headquarters_zip_code": "75001",
  "headquarters_address_complement": "Building A, Floor 5",
  "interests": ["tech", "finance"]
}
```

**Response (201):**
```json
{
  "message": "Brand created successfully",
  "brand": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "TechStart Inc",
    "industry_type": "technology",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "verified": false
  }
}
```

**Postman Script:**
```javascript
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("brand_id", jsonData.brand.id);
}
```

---

## GET /api/brands

Get all brands with pagination and filters.

**URL:** `{{base_url}}/brands?page=1&limit=10&industry_type=technology&interest_id=tech&verified=true`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}  (optional)
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `industry_type` (optional): Filter by industry type
- `interest_id` (optional): Filter by interest
- `verified` (optional): Filter by verification status (true/false)
- `country` (optional): Filter by country

**Response (200):**
```json
{
  "brands": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "TechStart Inc",
      "industry_type": "technology",
      "description": "A cutting-edge technology startup",
      "logo_url": "https://example.com/logo.png",
      "verified": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## GET /api/brands/me

Get current user's brand.

**URL:** `{{base_url}}/brands/me`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200):**
```json
{
  "brand": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "TechStart Inc",
    "industry_type": "technology",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "verified": false
  }
}
```

---

## GET /api/brands/:id

Get brand by ID.

**URL:** `{{base_url}}/brands/{{brand_id}}`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}  (optional)
```

**Response (200):**
```json
{
  "brand": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "TechStart Inc",
    "industry_type": "technology",
    "description": "A cutting-edge technology startup",
    "logo_url": "https://example.com/logo.png",
    "website_url": "https://techstart.com",
    "verified": true,
    "interests": [
      {
        "id": "tech",
        "label": "Technology",
        "icon": "💻"
      }
    ]
  }
}
```

---

## GET /api/brands/user/:userId

Get brand by user ID.

**URL:** `{{base_url}}/brands/user/{{user_id}}`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}  (optional)
```

**Response (200):**
```json
{
  "brand": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "TechStart Inc",
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## PUT /api/brands/:id

Update brand (requires brand ownership).

**URL:** `{{base_url}}/brands/{{brand_id}}`

**Method:** `PUT`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (JSON):**
```json
{
  "name": "TechStart Corp",
  "description": "Updated description",
  "logo_url": "https://example.com/new-logo.png",
  "interests": ["tech", "finance", "education"]
}
```

**Response (200):**
```json
{
  "message": "Brand updated successfully",
  "brand": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "TechStart Corp",
    "description": "Updated description"
  }
}
```

---

## DELETE /api/brands/:id

Delete brand (requires brand ownership).

**URL:** `{{base_url}}/brands/{{brand_id}}`

**Method:** `DELETE`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200):**
```json
{
  "message": "Brand deleted successfully"
}
```

---

## GET /api/brands/:id/stats

Get brand statistics.

**URL:** `{{base_url}}/brands/{{brand_id}}/stats`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}  (optional)
```

**Response (200):**
```json
{
  "stats": {
    "total_holders": 150,
    "total_tokens_issued": "1000000.00000000",
    "total_transactions": 342,
    "total_raised": "50000.00000000"
  }
}
```
