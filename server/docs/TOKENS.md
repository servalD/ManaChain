# Token Endpoints

> **Important:** In ManaChain, tokens are community tokens that represent symbolic support and engagement with a brand.  
> They are **not** designed or presented as financial instruments, securities, or speculative assets.  
> Any fields such as `current_price`, `total_value` or `purchase` refer to how contributions are accounted for within the platform and **do not** imply any promise of financial return.

## POST /api/tokens

Create a token for a brand (requires brand account and verified email).

**URL:** `{{base_url}}/tokens`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (JSON):**
```json
{
  "symbol": "TST",
  "total_supply": "1000000.00000000",
  "current_price": "0.50000000",
  "nft_token_id": "12345",
  "nft_name": "TechStart NFT",
  "nft_symbol": "TSTNFT"
}
```

**Response (201):**
```json
{
  "message": "Token created successfully",
  "token": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "brand_id": "660e8400-e29b-41d4-a716-446655440000",
    "symbol": "TST",
    "total_supply": "1000000.00000000",
    "current_price": "0.50000000"
  }
}
```

**Postman Script:**
```javascript
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("token_id", jsonData.token.id);
}
```

---

## GET /api/tokens/:id

Get token by ID.

**URL:** `{{base_url}}/tokens/{{token_id}}`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}  (optional)
```

**Response (200):**
```json
{
  "token": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "brand_id": "660e8400-e29b-41d4-a716-446655440000",
    "symbol": "TST",
    "total_supply": "1000000.00000000",
    "current_price": "0.50000000",
    "nft_token_id": "12345",
    "nft_name": "TechStart NFT",
    "nft_symbol": "TSTNFT"
  }
}
```

---

## GET /api/tokens/brand/:brandId

Get token by brand ID.

**URL:** `{{base_url}}/tokens/brand/{{brand_id}}`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}  (optional)
```

**Response (200):**
```json
{
  "token": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "brand_id": "660e8400-e29b-41d4-a716-446655440000",
    "symbol": "TST",
    "current_price": "0.50000000"
  }
}
```

---

## PUT /api/tokens/:id/price

Update token price (requires brand ownership).

**URL:** `{{base_url}}/tokens/{{token_id}}/price`

**Method:** `PUT`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (JSON):**
```json
{
  "current_price": "0.75000000"
}
```

**Response (200):**
```json
{
  "message": "Token price updated successfully",
  "token": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "current_price": "0.75000000"
  }
}
```

---

## GET /api/tokens/:id/holders

Get token holders list.

**URL:** `{{base_url}}/tokens/{{token_id}}/holders?page=1&limit=10`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}  (optional)
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "holders": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "balance": "5000.00000000"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

## GET /api/tokens/:id/balance

Get my balance for a specific token.

**URL:** `{{base_url}}/tokens/{{token_id}}/balance`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200):**
```json
{
  "balance": "5000.00000000",
  "token": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "symbol": "TST"
  }
}
```

---

## POST /api/tokens/:id/transfer

Transfer tokens to another user (requires verified email).

**URL:** `{{base_url}}/tokens/{{token_id}}/transfer`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (JSON):**
```json
{
  "to_user_id": "880e8400-e29b-41d4-a716-446655440000",
  "amount": "100.00000000"
}
```

**Response (200):**
```json
{
  "message": "Tokens transferred successfully",
  "transaction": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "amount": "100.00000000",
    "transaction_type": "transfer"
  }
}
```

---

## POST /api/tokens/:id/purchase

Purchase tokens (requires verified email).

**URL:** `{{base_url}}/tokens/{{token_id}}/purchase`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{token}}
```

**Body (JSON):**
```json
{
  "amount": "1000.00000000"
}
```

**Response (200):**
```json
{
  "message": "Tokens purchased successfully",
  "transaction": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "amount": "1000.00000000",
    "transaction_type": "purchase"
  },
  "new_balance": "6000.00000000"
}
```

---

## GET /api/tokens/:id/transactions

Get token transaction history.

**URL:** `{{base_url}}/tokens/{{token_id}}/transactions?page=1&limit=10&type=purchase`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}  (optional)
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `type` (optional): Filter by type (purchase, transfer, reward, initial_emission)

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "amount": "1000.00000000",
      "transaction_type": "purchase",
      "from_user_id": null,
      "to_user_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

## GET /api/tokens/my/transactions

Get my transaction history.

**URL:** `{{base_url}}/tokens/my/transactions?page=1&limit=10`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "token_id": "770e8400-e29b-41d4-a716-446655440000",
      "token_symbol": "TST",
      "amount": "1000.00000000",
      "transaction_type": "purchase",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

## GET /api/tokens/my/portfolio

Get my portfolio (all token holdings).

**URL:** `{{base_url}}/tokens/my/portfolio`

**Method:** `GET`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200):**
```json
{
  "portfolio": [
    {
      "token_id": "770e8400-e29b-41d4-a716-446655440000",
      "token_symbol": "TST",
      "brand_name": "TechStart Inc",
      "balance": "5000.00000000",
      "current_price": "0.50000000",
      "total_value": "2500.00000000"
    }
  ],
  "total_value": "2500.00000000"
}
```
