# Language and Currency Selection Setup Guide

## Overview
Users can now select their preferred language and account currency during registration. These preferences are persistent and automatically applied throughout the banking system.

## Features Implemented

### 1. Registration Form Enhancement
**File**: `signup.html`
- **Step 4 Added**: "Your Preferences" 
- **Language Selection**: 13 supported languages with native names displayed
- **Currency Selection**: 14 major currencies (USD, EUR, GBP, NGN, CAD, AUD, AED, CHF, JPY, CNY, INR, BRL, SGD, ZAR)
- **Validation**: Both fields are required before account creation

### 2. Backend Storage
**File**: `backend/routes/auth.js`
- User preferences stored in `backend/data/users.json`
- Returned in API responses for signin endpoints:
  - POST `/api/auth/signup` - Returns user with language/currency
  - POST `/api/auth/verify-otp` - Returns user with language/currency
  - GET `/api/auth/me` - Returns user with language/currency

### 3. Currency Formatting
**File**: `bank-api-client.js`
- Enhanced `formatCurrency()` method:
  - Uses user's selected currency automatically
  - Respects user's language locale for number formatting
  - Fallback to USD if currency not specified
  - Examples:
    - USD locale: `$1,234.56`
    - EUR locale: `1.234,56 €`
    - GBP locale: `£1,234.56`

### 4. Dashboard Updates
**File**: `dashboard.html`
- Extracts language/currency from logged-in user
- Stores in localStorage for consistency
- All balance displays use user's currency
- Transaction amounts formatted with user's currency
- Works with all transaction types (transfers, bills, deposits, payments)

### 5. Admin Panel
**File**: `admin.html`
- New "Currency" column shows user's selected currency
- New "Language" column shows user's language (in native name format)
- Balance column shows format: `CURRENCY AMOUNT` (e.g., "EUR 5,000.00")
- Table updated for 8 columns (was 6)

## How to Test

### Test 1: Create Account with Preferences
1. Navigate to `signup.html`
2. Fill Steps 1-3 (personal info, security, PIN)
3. In Step 4, select:
   - Language: "Español"
   - Currency: "GBP"
4. Click "Create My Account"
5. Should redirect to dashboard

### Test 2: Verify Backend Storage
```bash
# Check backend/data/users.json
cat backend/data/users.json
# Look for: "language": "es", "currency": "GBP"
```

### Test 3: Check Admin Panel
1. Login as admin (email: `admin@vanstra.bank`, password: `admin123`)
2. Complete OTP verification
3. View the newly created user in the admin table
4. Verify:
   - Currency column shows "GBP"
   - Language column shows "Español"
   - Balance shows "GBP XXXXX.XX" format

### Test 4: Verify Currency in Dashboard
1. Login with the new account
2. Check available balance - should show in GBP currency format
3. Perform a transaction (deposit, transfer, etc.)
4. Verify all amounts show in GBP format with proper locale

### Test 5: Multiple Languages/Currencies
Create accounts with different combinations:
- Chinese (中文) + Japanese Yen (JPY)
- Arabic (العربية) + UAE Dirham (AED)
- Hindi (हिन्दी) + Indian Rupee (INR)

Each should format numbers and currencies appropriately.

## API Response Example

### Signup Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "John Doe",
    "email": "john@example.com",
    "accountNumber": "DE000000000001",
    "accountBalance": 5000,
    "role": "user",
    "language": "es",
    "currency": "GBP",
    "pinHash": "abcd1234"
  }
}
```

### Login Response (after OTP verification)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "John Doe",
    "email": "john@example.com",
    "accountNumber": "DE000000000001",
    "accountBalance": 5000,
    "role": "user",
    "accountStatus": "active",
    "language": "es",
    "currency": "GBP"
  }
}
```

## localStorage Keys
After successful registration or login:
- `userCurrency`: User's selected currency (e.g., "GBP")
- `userLanguage`: User's selected language code (e.g., "es")
- `authToken`: JWT authentication token
- `currentSession`: User session ID

## Supported Language-Locale Mappings
```
en → en-US
de → de-DE
fr → fr-FR
es → es-ES
pt → pt-PT
zh → zh-CN
ja → ja-JP
ko → ko-KR
ar → ar-SA
hi → hi-IN
ru → ru-RU
id → id-ID
nl → nl-NL
```

## Supported Currencies
- **Americas**: USD (US Dollar), CAD (Canadian Dollar), BRL (Brazilian Real)
- **Europe**: EUR (Euro), GBP (British Pound), CHF (Swiss Franc)
- **Asia-Pacific**: AUD (Australian Dollar), JPY (Japanese Yen), CNY (Chinese Yuan), SGD (Singapore Dollar), INR (Indian Rupee), KRW (Korean Won)
- **Africa**: ZAR (South African Rand), NGN (Nigerian Naira)
- **Middle East**: AED (UAE Dirham)

## Future Enhancements
1. **Language-based UI**: Implement full UI translation based on selected language
2. **Dynamic Currency Conversion**: Convert between currencies with real exchange rates
3. **Statement Export**: Generate statements with selected language and currency
4. **Multi-currency Accounts**: Allow users to hold multiple currency balances
5. **Spending Analytics**: Analyze spending by currency and language region

## Troubleshooting

### Issue: Currency not showing correctly
- **Check**: localStorage has `userCurrency` key set
- **Check**: bankAPI.formatCurrency() is being called
- **Check**: Browser console for Intl formatting errors

### Issue: Language not persisting
- **Check**: backend/data/users.json has language field populated
- **Check**: User object returned from login includes language
- **Check**: localStorage `userLanguage` is set after login

### Issue: Admin panel not showing preferences
- **Check**: Backend auth.js returns language/currency in user response
- **Check**: Admin table colspan updated to 8
- **Check**: Language name mapping includes the selected language code

## Files Modified
1. `signup.html` - Added Step 4 form with language/currency select
2. `backend/routes/auth.js` - Updated to store and return language/currency
3. `bank-api-client.js` - Enhanced formatCurrency with locale support
4. `dashboard.html` - Extract and use user preferences
5. `admin.html` - Display language and currency columns

## Database Schema Update
User object now includes:
```javascript
{
  // ... existing fields
  language: "en",     // Language code
  currency: "EUR"     // ISO 4217 Currency code
}
```

Default values if not specified:
- language: "en" (English)
- currency: "EUR" (Euro)
