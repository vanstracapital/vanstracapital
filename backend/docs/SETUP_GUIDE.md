# 🚀 Vanstra Capital - Complete Setup Guide

Complete instructions for setting up and running the entire Vanstra Capital banking system with Node.js/Express backend and MongoDB.

## 📋 Prerequisites

- **Node.js** (v14+) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4+) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

> **Optional alternative:** the backend can operate entirely from a simple JSON file (`backend/data/users.json`).
> Create that file containing `[]` and the server will read/write user records there. This is handy for lightweight testing without running a database.
- **Visual Studio Code** or any code editor
- **Git** (optional)

## 🛠️ Installation Steps

### 1. Install MongoDB Locally (Optional - Skip if using Atlas)

**Windows:**
```bash
# Download and run MongoDB installer from https://www.mongodb.com/try/download/community
# Or use chocolatey:
choco install mongodb
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
curl -fsSL https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/
# Follow official guide
```

Verify MongoDB is running:
```bash
mongosh
> show dbs
> exit
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd vanstracapital/backend

# Install dependencies
npm install

# Create .env file (already provided, adjust if needed)
# Check that .env has correct MONGODB_URI
cat .env
```

**For MongoDB Atlas (Cloud):**
Update `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vanstracapital?retryWrites=true&w=majority
```

### 3. Seed Database with Test Users

```bash
# From backend directory
npm run seed
```

Expected output:
```
Connected to MongoDB
Cleared existing users
✓ Admin user created: admin@vanstra.bank
✓ Test user created: john@vanstra.bank
✓ Test user created: maria@vanstra.bank
✓ Test user created: ahmed@vanstra.bank
✓ Test user created: sara@vanstra.bank
✓ Test user created: carlos@vanstra.bank

✅ Database seeding completed!
```

### 4. Start Backend Server

```bash
# Development (with auto-reload):
npm run dev

# Or production:
npm start
```

Expected output:
```
Server running on port 5000
Environment: development
MongoDB: mongodb://localhost:27017/vanstracapital
```

### 5. Test Backend API

In a new terminal, test the login endpoint:

```bash
# Test login with seeded user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@vanstra.bank","password":"Test1234!"}'
```

Expected response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Smith",
    "email": "john@vanstra.bank",
    "accountBalance": 5000,
    "role": "user"
  }
}
```

### 6. Start Frontend (if using local web server)

```bash
# Option 1: Use Python's built-in server
python -m http.server 8000

# Option 2: Use Node's http-server
npm install -g http-server
http-server -p 8000

# Option 3: Use VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Frontend will run on `http://localhost:8000`

## 🔑 Login Credentials

### Admin Account
```
Email: admin@vanstra.bank
Password: admin123
```

### Test Users (All use same password)
```
Password: Test1234!

john@vanstra.bank
maria@vanstra.bank
ahmed@vanstra.bank
sara@vanstra.bank
carlos@vanstra.bank
```

## 📊 Database Structure

### Collections

**users**
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  accountNumber: String,
  accountBalance: Number,
  accountStatus: 'active'|'frozen'|'blocked',
  role: 'user'|'admin',
  isOnline: Boolean,
  lastLogin: Date,
  transactions: [...],
  tier: 'basic'|'silver'|'gold'|'platinum',
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Integration

### To use the NEW API-backed system:

1. **Include the new scripts in order:**
```html
<script src="bank-api-client.js"></script>
<script src="bank-core-api.js"></script>
```

2. **Use VanstraBank object** (same as before but API-backed):
```javascript
// Login
await VanstraBank.login('john@vanstra.bank', 'Test1234!');

// Get current user
const user = await VanstraBank.getCurrentUser();

// Get transactions
const transactions = await VanstraBank.getTransactions();

// Admin: Get all users
const users = await VanstraBank.getAllUsers();
```

### To keep using localStorage system:

Keep using the original scripts:
```html
<script src="bank-core-v2.js"></script>
<script src="supabase-client.js"></script>
```

## 🧪 Testing Admin Functions

```bash
# Get JWT token (from login response above)
export TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Get all users
curl http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

# Update user balance
curl -X PUT http://localhost:5000/api/admin/users/507f1f77bcf86cd799439011/balance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"balance": 10000}'

# Change user status to frozen
curl -X PUT http://localhost:5000/api/admin/users/507f1f77bcf86cd799439011/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "frozen"}'

# Get admin statistics
curl http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer $TOKEN"
```

## 📁 Project Structure

```
vanstracapital/
├── backend/                    # Express server
│   ├── models/
│   │   └── User.js            # MongoDB user schema
│   ├── middleware/
│   │   └── auth.js            # JWT & admin middleware
│   ├── routes/
│   │   ├── auth.js            # Login, signup, logout
│   │   ├── admin.js           # Admin user management
│   │   └── users.js           # User profile & transactions
│   ├── scripts/
│   │   └── seed.js            # Database seeding
│   ├── server.js              # Main server file
│   ├── package.json
│   ├── .env                   # Configuration
│   └── README.md
│
├── Frontend (HTML files)
├── bank-api-client.js         # API client (new)
├── bank-core-api.js           # Banking logic using API (new)
├── bank-core-v2.js            # Original localStorage version
├── dashboard-v2.html
├── admin-v2.html
├── profile-v2.html
├── login.html
├── signup.html
└── ... (other pages)
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```
error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
# On Windows (in MongoDB\Server\bin directory):
mongod

# On macOS:
brew services start mongodb-community

# On Linux:
sudo systemctl start mongod
```

### Port 5000 Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Kill process on port 5000 or change PORT in .env

```bash
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :5000
kill -9 <PID>
```

### JWT Token Expired
```
Invalid or expired token
```
**Solution:** Login again to get fresh token

### CORS Error in Frontend
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** CORS is already enabled in server.js. Ensure backend is running on port 5000.

### Database Seeding Issues
```bash
# Clear database and reseed:
npm run seed
```

## 🚀 Production Deployment

### Before deploying to production:

1. **Change JWT_SECRET in .env:**
```bash
JWT_SECRET=<generate-strong-random-string>
```

2. **Use MongoDB Atlas** instead of local MongoDB

3. **Enable HTTPS** on your domain

4. **Add rate limiting** to auth endpoints

5. **Set NODE_ENV=production:**
```env
NODE_ENV=production
```

6. **Use process manager** (PM2):
```bash
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

7. **Configure environment variables** properly in hosting platform

## 📚 Documentation

- [Backend README](./backend/README.md) - Detailed API documentation
- [API Integration Guide](./API_INTEGRATION.md) - Frontend integration details
- [User Model](./backend/models/User.js) - Database schema
- [Authentication Middleware](./backend/middleware/auth.js) - Security details

## 🤝 Support

For issues:
1. Check [Troubleshooting](#-troubleshooting) section
2. Verify MongoDB is running
3. Check backend is running on port 5000
4. View server logs for detailed error messages
5. Check browser console for frontend errors

## ✅ Verification Checklist

- [ ] MongoDB is running
- [ ] Backend started (`npm run dev`)
- [ ] Database seeded (`npm run seed`)
- [ ] Can login with test credentials
- [ ] Admin panel loads with users
- [ ] Transactions sync in real-time
- [ ] Frontend displays user data correctly

## 🎉 You're Ready!

Once setup is complete:
1. Frontend: `http://localhost:8000`
2. Backend API: `http://localhost:5000/api`
3. MongoDB: Running locally or on Atlas

**Test with:**
- Admin email: `admin@vanstra.bank`
- Test user: `john@vanstra.bank`
- Password: `admin123` (admin) or `Test1234!` (test users)

Happy banking! 🏦💳

---

**Last Updated:** February 11, 2026 | **Version:** 2.0 (API-backed)
