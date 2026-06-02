# Vanstra Capital API Reference

Complete API endpoint reference for the Express backend.

## Base URL
```
http://localhost:5000/api
```

## Headers

All authenticated requests require:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 🔐 Authentication Endpoints

### POST /auth/signup
Create new user account

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+49123456789"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com",
    "accountNumber": "DE74 1234 5678 9012 3456 78",
    "accountBalance": 5000,
    "role": "user"
  }
}
```

---

### POST /auth/login
Login with email and password

**Request:**
```json
{
  "email": "john@vanstra.bank",
  "password": "Test1234!"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Smith",
    "email": "john@vanstra.bank",
    "accountNumber": "DE74 1234 5678 9012 3456 78",
    "accountBalance": 5000,
    "role": "user",
    "accountStatus": "active"
  }
}
```

**Errors:**
- `400` - Missing email/password
- `401` - Invalid credentials
- `403` - Account is frozen or blocked

---

### GET /auth/me
Get current authenticated user

**Headers Required:** ✅ Authorization

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Smith",
    "email": "john@vanstra.bank",
    "accountNumber": "DE74 1234 5678 9012 3456 78",
    "accountBalance": 5000,
    "role": "user",
    "accountStatus": "active",
    "isOnline": true,
    "lastLogin": "2026-02-11T10:30:00Z"
  }
}
```

---

### POST /auth/logout
Logout current user

**Headers Required:** ✅ Authorization

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👤 User Profile Endpoints

### GET /users/profile
Get current user profile

**Headers Required:** ✅ Authorization

**Response (200):**
```json
{
  "success": true,
    "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Smith",
    "email": "john@vanstra.bank",
    "phone": "+49111222333",
    "accountNumber": "DE74 1234 5678 9012 3456 78",
    "accountBalance": 5000,
    "accountStatus": "active",
    "isOnline": true,
    "lastLogin": "2026-02-11T10:30:00Z",
    "createdAt": "2026-02-01T08:00:00Z",
    "transactions": [...],
    "tier": "gold",
    "avatar": "https://..."
  }
}
```

---

### PUT /users/profile
Update current user profile

**Headers Required:** ✅ Authorization

**Request:**
```json
{
  "fullName": "John Smith Updated",
  "phone": "+49111222333",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Smith Updated",
    "email": "john@vanstra.bank",
    "phone": "+49111222333",
    "accountNumber": "DE74 1234 5678 9012 3456 78",
    "accountBalance": 5000,
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

---

## 💳 Transaction Endpoints

### GET /users/transactions
Get all transactions for current user

**Headers Required:** ✅ Authorization

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "transactions": [
    {
      "id": "TXN-1707643800000",
      "type": "transfer",
      "amount": 150.00,
      "description": "Payment to Maria Garcia",
      "timestamp": "2026-02-11T10:30:00Z",
      "status": "completed",
      "recipientId": "507f1f77bcf86cd799439012"
    },
    {
      "id": "TXN-1707557400000",
      "type": "deposit",
      "amount": 500.00,
      "description": "Salary deposit",
      "timestamp": "2026-02-10T08:00:00Z",
      "status": "completed"
    }
  ]
}
```

---

### POST /users/transaction
Create a new transaction

**Headers Required:** ✅ Authorization

**Request:**
```json
{
  "type": "transfer",
  "amount": 100.00,
  "description": "Payment to friend",
  "recipientId": "507f1f77bcf86cd799439012"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Transaction recorded",
  "transaction": {
    "id": "TXN-1707643800000",
    "type": "transfer",
    "amount": 100.00,
    "description": "Payment to friend",
    "timestamp": "2026-02-11T10:30:00Z",
    "status": "completed"
  },
  "newBalance": 4900.00
}
```

**Errors:**
- `400` - Invalid transaction data, insufficient balance
- `500` - Server error

---

## 🔧 Admin Endpoints

**All admin routes require:**
- ✅ Authorization header with JWT
- ✅ User role = "admin"

---

### GET /admin/users
Get all users

**Headers Required:** ✅ Admin Authorization

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "fullName": "John Smith",
      "email": "john@vanstra.bank",
        "accountNumber": "DE74 1234 5678 9012 3456 78",
      "accountBalance": 5000,
      "accountStatus": "active",
      "isOnline": false,
      "lastLogin": "2026-02-11T10:30:00Z",
      "createdAt": "2026-02-01T08:00:00Z",
      "transactions": [...],
      "tier": "gold"
    },
    ...
  ]
}
```

---

### GET /admin/users/:id
Get single user by ID

**Headers Required:** ✅ Admin Authorization

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Smith",
    "email": "john@vanstra.bank",
    "phone": "+49111222333",
    "accountNumber": "DE74 1234 5678 9012 3456 78",
    "accountBalance": 5000,
    "accountStatus": "active",
    "isOnline": false,
    "lastLogin": "2026-02-11T10:30:00Z",
    "createdAt": "2026-02-01T08:00:00Z",
    "transactions": [...],
    "tier": "gold"
  }
}
```

---

### PUT /admin/users/:id/balance
Update user account balance

**Headers Required:** ✅ Admin Authorization

**Request:**
```json
{
  "balance": 10000.00
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Balance updated to €10,000.00",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Smith",
    "accountBalance": 10000.00
  }
}
```

**Errors:**
- `400` - Invalid balance (negative or missing)
- `404` - User not found

---

### PUT /admin/users/:id/status
Update user account status

**Headers Required:** ✅ Admin Authorization

**Request:**
```json
{
  "status": "frozen"
}
```

**Valid Status Values:**
- `"active"` - Normal operation
- `"frozen"` - Cannot perform transactions
- `"blocked"` - Cannot login

**Response (200):**
```json
{
  "success": true,
  "message": "Account status updated to frozen",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Smith",
    "accountStatus": "frozen"
  }
}
```

**Errors:**
- `400` - Invalid status
- `404` - User not found

---

### GET /admin/stats
Get dashboard statistics

**Headers Required:** ✅ Admin Authorization

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 5,
    "onlineUsers": 2,
    "totalBalance": 38500.00,
    "totalAdmins": 1,
    "blockedAccounts": 0,
    "frozenAccounts": 0,
    "todayTransactions": 12
  }
}
```

---

### DELETE /admin/users/:id
Delete a user permanently

**Headers Required:** ✅ Admin Authorization

**Response (200):**
```json
{
  "success": true,
  "message": "User John Smith has been deleted"
}
```

**Errors:**
- `404` - User not found

---

## ❌ Error Responses

### 400 - Bad Request
```json
{
  "message": "Please provide all required fields"
}
```

### 401 - Unauthorized
```json
{
  "message": "Access token required"
}
```

### 403 - Forbidden
```json
{
  "message": "Access denied. Admin privileges required."
}
```

### 404 - Not Found
```json
{
  "message": "User not found"
}
```

### 500 - Server Error
```json
{
  "message": "error description"
}
```

---

## 🧪 Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@vanstra.bank","password":"Test1234!"}'
```

### Get current user
```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Admin: Get all users
```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."
curl http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

### Admin: Update balance
```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."
curl -X PUT http://localhost:5000/api/admin/users/507f1f77bcf86cd799439011/balance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"balance": 15000}'
```

---

## 📊 Rate Limiting

On production, add rate limiting:
- 5 failed login attempts → 15 min lockout
- Admin endpoints: 100 req/min per IP
- User endpoints: 1000 req/min per IP

---

**API Version:** 1.0  
**Last Updated:** February 11, 2026  
**Base URL:** http://localhost:5000/api
