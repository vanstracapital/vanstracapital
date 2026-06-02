# Technical API Reference - Vanstra Bank v2.1

## Table of Contents
1. [VanstraBank Updates](#vanstrabank-updates)
2. [VanstraRealtimeSync API](#vanstrarealtimesync-api)
3. [Dashboard Functions](#dashboard-functions)
4. [Admin Panel Functions](#admin-panel-functions)
5. [Data Structures](#data-structures)

---

## VanstraBank Updates

### New Function: updateUser()

**Description:** Updates a user object in the banking system and syncs to localStorage.

**Signature:**
```typescript
function updateUser(user: UserObject): { success: boolean, user?: UserObject, error?: string }
```

**Parameters:**
```javascript
{
    id: string,                    // Required: User ID
    fullName?: string,
    email?: string,
    balance?: number,
    accountStatus?: string,        // 'active', 'frozen', 'blocked', 'suspended'
    isOnline?: boolean,
    lastLogin?: string,
    transactions?: Transaction[],
    // ... other user properties
}
```

**Returns:**
```javascript
{
    success: true,
    user: { /* updated user object */ }
}

// or error
{
    success: false,
    error: "User not found"
}
```

**Example Usage:**
```javascript
const user = VanstraBank.getCurrentUser();
user.balance = 5000;

const result = VanstraBank.updateUser(user);
if (result.success) {
    console.log('User updated:', result.user);
}
```

**Emitted Events:**
- `user_updated` - Fired when user is successfully updated

**Error Handling:**
```javascript
try {
    VanstraBank.updateUser(user);
} catch (error) {
    console.error('Update failed:', error);
}
```

---

## VanstraRealtimeSync API

**File:** `realtime-sync.js`

### Core Methods

#### subscribe(channel, callback)

**Description:** Subscribe to real-time events on a channel.

**Signature:**
```typescript
function subscribe(channel: string, callback: Function): Function
```

**Parameters:**
- `channel` (string): Channel name to subscribe to
- `callback` (function): Function called when event is emitted

**Returns:** Unsubscribe function

**Example:**
```javascript
const unsubscribe = VanstraRealtimeSync.subscribe('users:updated', (data) => {
    console.log('Users updated:', data.users);
});

// Later, unsubscribe if needed
unsubscribe();
```

---

#### emit(channel, data)

**Description:** Emit an event to all subscribers on a channel.

**Signature:**
```typescript
function emit(channel: string, data: any): void
```

**Example:**
```javascript
VanstraRealtimeSync.emit('users:updated', {
    users: [{ id: '1', name: 'John', balance: 5000 }]
});
```

---

#### watchBalance(userId, callback)

**Description:** Watch for balance changes on a specific user.

**Signature:**
```typescript
function watchBalance(userId: string, callback: Function): Function
```

**Callback Data:**
```javascript
{
    userId: string,
    newBalance: number,
    oldBalance: number,
    user: UserObject
}
```

**Example:**
```javascript
VanstraRealtimeSync.watchBalance('USR-123456', (data) => {
    console.log(`Balance changed from €${data.oldBalance} to €${data.newBalance}`);
});
```

---

#### watchAllUsers(callback)

**Description:** Watch for any updates to all users.

**Signature:**
```typescript
function watchAllUsers(callback: Function): Function
```

**Callback Data:**
```javascript
{
    users: UserObject[]
}
```

**Example:**
```javascript
VanstraRealtimeSync.watchAllUsers((data) => {
    console.log('Total users:', data.users.length);
    data.users.forEach(user => {
        console.log(`${user.fullName}: €${user.balance}`);
    });
});
```

---

#### watchAccountStatus(userId, callback)

**Description:** Watch for account status changes on a specific user.

**Signature:**
```typescript
function watchAccountStatus(userId: string, callback: Function): Function
```

**Callback Data:**
```javascript
{
    userId: string,
    newStatus: 'active' | 'frozen' | 'blocked' | 'suspended',
    oldStatus: string,
    user: UserObject
}
```

**Example:**
```javascript
VanstraRealtimeSync.watchAccountStatus('USR-123456', (data) => {
    if (data.newStatus === 'frozen') {
        alert(`Account ${data.userId} has been frozen!`);
    }
});
```

---

#### notifyBalanceChange(userId, newBalance, oldBalance)

**Description:** Notify all subscribers of a balance change.

**Signature:**
```typescript
function notifyBalanceChange(userId: string, newBalance: number, oldBalance: number): void
```

**Auto-emits to:**
- `user:{userId}:balance`
- `users:updated`

**Example:**
```javascript
const oldBalance = 1000;
const newBalance = 1500;
VanstraRealtimeSync.notifyBalanceChange('USR-123456', newBalance, oldBalance);
```

---

#### notifyStatusChange(userId, newStatus, oldStatus)

**Description:** Notify all subscribers of an account status change.

**Example:**
```javascript
VanstraRealtimeSync.notifyStatusChange('USR-123456', 'frozen', 'active');
```

---

#### startPolling(interval)

**Description:** Start polling for changes at specified interval.

**Signature:**
```typescript
function startPolling(interval: number = 1000): void
```

**Parameters:**
- `interval` (number): Milliseconds between polls (default: 1000)

**Example:**
```javascript
// Poll every 2 seconds
VanstraRealtimeSync.startPolling(2000);
```

---

#### stopPolling()

**Description:** Stop the polling process.

**Signature:**
```typescript
function stopPolling(): void
```

**Example:**
```javascript
VanstraRealtimeSync.stopPolling();
```

---

#### syncAllUsers()

**Description:** Manually trigger a sync of all users from localStorage.

**Signature:**
```typescript
function syncAllUsers(): UserObject[]
```

**Returns:** Array of all users

**Example:**
```javascript
const users = VanstraRealtimeSync.syncAllUsers();
console.log('Synced users:', users);
```

---

#### getSyncStatus()

**Description:** Get current sync status.

**Signature:**
```typescript
function getSyncStatus(): { lastSyncTime: number, isPolling: boolean, subscribers: number, events: number }
```

**Returns:**
```javascript
{
    lastSyncTime: 1707900123456,  // Timestamp
    isPolling: true,
    subscribers: 5,               // Number of active subscribers
    events: 42                     // Number of events queued
}
```

**Example:**
```javascript
const status = VanstraRealtimeSync.getSyncStatus();
console.log(`Last sync: ${new Date(status.lastSyncTime).toLocaleTimeString()}`);
console.log(`Active subscribers: ${status.subscribers}`);
```

---

## Dashboard Functions

### New: startRealtimeSyncDashboard()

**Location:** dashboard-v2.html

**Description:** Starts real-time balance polling for the dashboard.

**Signature:**
```typescript
function startRealtimeSyncDashboard(): void
```

**What it does:**
- Polls every 2 seconds
- Detects balance changes
- Updates DOM elements automatically
- Triggers on page load

**DOM Elements Updated:**
- `#balanceAmount` - Main balance display
- `#availableBalance` - Available balance field
- `#billAvailableBalance` - Bill payment balance

**Example Integration:**
```javascript
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    startRealtimeSyncDashboard();  // Starts polling
});
```

---

### Updated: handleBalanceAdjustment(pin)

**Description:** Handles balance adjustment after PIN verification.

**Changes:**
1. Properly updates VanstraBank user object
2. Syncs to localStorage with correct structure
3. Updates DOM elements explicitly
4. Returns proper transaction record

**Flow:**
```javascript
handleBalanceAdjustment(pin) {
    // 1. Calculate new balance
    // 2. Create transaction record
    // 3. Update currentUser.balance
    // 4. VanstraBank.updateUser(currentUser)
    // 5. Update localStorage['vanstraUsers']
    // 6. Update DOM elements
    // 7. Return success result
}
```

---

## Admin Panel Functions

### admin-v3.html

#### showSection(sectionName)

**Description:** Navigate between admin sections.

**Parameters:**
- `sectionName` (string): `'dashboard'`, `'users'`, or `'transactions'`

**Example:**
```javascript
showSection('users');  // Shows user management
showSection('dashboard');  // Shows dashboard
```

---

#### updateAdminDashboard()

**Description:** Manually refresh all dashboard data.

**Signature:**
```typescript
function updateAdminDashboard(): void
```

**Updates:**
- User count
- Online user count
- Total balance
- Transaction count
- User tables

**Example:**
```javascript
// Called every 2 seconds automatically
setInterval(updateAdminDashboard, 2000);

// Or manually:
document.querySelector('button').onclick = updateAdminDashboard;
```

---

#### openUserModal(id, name, email, balance)

**Description:** Open user management modal.

**Parameters:**
```javascript
openUserModal(
    'USR-123456',      // User ID
    'John Smith',      // Full name
    'john@vanstra.com', // Email
    '5000.50'          // Balance
);
```

---

#### updateUserStatus(userId, action)

**Description:** Change user account status.

**Parameters:**
- `userId` (string): User ID
- `action` (string): 
  - `'unfreeze'` → active
  - `'freeze'` → frozen
  - `'block'` → blocked
  - `'suspend'` → suspended

**Example:**
```javascript
updateUserStatus('USR-123456', 'freeze');
```

---

#### adjustBalance(userId, action)

**Description:** Adjust user balance.

**Parameters:**
- `userId` (string): User ID
- `action` (string): `'add'`, `'deduct'`, or `'set'`

**Input Elements:**
- `#balanceAmount` - Amount to add/deduct (for 'add' and 'deduct')
- `#balanceSet` - Exact balance (for 'set')

**Example:**
```javascript
// Add €100
document.getElementById('balanceAmount').value = '100';
adjustBalance('USR-123456', 'add');

// Set to €5000 exactly
document.getElementById('balanceSet').value = '5000';
adjustBalance('USR-123456', 'set');
```

---

#### searchUsers()

**Description:** Filter user table by search term.

**Input Element:**
- `#userSearch` - Search input

**Filters by:**
- User name (fullName)
- Email

**Example:**
```javascript
// User types in search box
// Automatically filters table
// Handler called via onkeyup="searchUsers()"
```

---

## Data Structures

### UserObject

```typescript
interface UserObject {
    id: string;                        // Unique user ID
    fullName: string;
    email: string;
    dateOfBirth: string;              // YYYY-MM-DD
    phone: string;
    accountNumber: string;            // e.g., DE74 1234 5678 9012 3456 78
    accountType: string;              // 'Checking', 'Savings'
    balance: number;                  // In EUR
    currency: string;                 // 'EUR'
    passwordHash: string;             // Hashed
    pinHash: string;                  // Hashed  
    accountStatus?: 'active' | 'frozen' | 'blocked' | 'suspended'; // Default: 'active'
    isOnline?: boolean;
    lastLogin?: string;               // ISO 8601 timestamp
    avatar?: string;                  // Base64 or URL
    transactions?: Transaction[];
    medal?: 'bronze' | 'silver' | 'gold';
    createdAt: string;               // ISO 8601 timestamp
}
```

---

### TransactionObject

```typescript
interface TransactionObject {
    id: string;                       // Unique transaction ID
    type: string;                     // 'Transfer', 'Balance Top-up', etc.
    description: string;
    amount: number;
    fromBalance: number;              // Balance before transaction
    toBalance: number;                // Balance after transaction
    status: 'pending' | 'completed' | 'failed';
    timestamp: string;                // ISO 8601
    reference: string;                // Transaction reference code
    recipientName: string;            // Who received it
    internal: boolean;                // Whether to show receipt
}
```

---

### SyncEventObject

```typescript
interface SyncEventObject {
    channel: string;
    data: any;
    timestamp: string;               // ISO 8601
}
```

---

### BalanceChangeEvent

```typescript
interface BalanceChangeEvent {
    userId: string;
    newBalance: number;
    oldBalance: number;
    user: UserObject;
}
```

---

### StatusChangeEvent

```typescript
interface StatusChangeEvent {
    userId: string;
    newStatus: string;
    oldStatus: string;
    user: UserObject;
}
```

---

## Constants

### Admin Credentials
```javascript
const ADMIN_PASSWORD = 'admin123';
```

### Polling Intervals
```javascript
// Dashboard
const DASHBOARD_POLL_INTERVAL = 2000;  // 2 seconds

// Admin
const ADMIN_POLL_INTERVAL = 2000;      // 2 seconds
```

### PIN Settings
```javascript
const PIN_LENGTH = 4;
const TRIPLE_CLICK_WINDOW = 500;       // 500ms for triple-tap
```

---

## Error Handling

### Common Errors

**"User not found"**
```javascript
VanstraBank.updateUser({ id: 'invalid' });
// Error: User not found
```

**"Sync failed"**
```javascript
// Check localStorage is enabled
if (typeof(Storage) === "undefined") {
    console.error('localStorage not available');
}
```

**"Balance is null"**
```javascript
// Ensure user object has balance property
const user = VanstraBank.getCurrentUser();
if (!user || user.balance === undefined) {
    console.error('Invalid user object');
}
```

---

## Best Practices

### 1. Always Check Success Response
```javascript
const result = VanstraBank.updateUser(user);
if (!result.success) {
    console.error('Update failed:', result.error);
    return;
}
```

### 2. Unsubscribe When Done
```javascript
const unsubscribe = VanstraRealtimeSync.watchBalance(userId, callback);
// Later...
unsubscribe();
```

### 3. Handle localStorage Access
```javascript
try {
    const users = JSON.parse(localStorage.getItem('vanstraUsers') || '{}');
} catch (e) {
    console.error('localStorage read failed', e);
}
```

### 4. Validate Input Data
```javascript
if (!user || !user.id || user.balance < 0) {
    console.error('Invalid user object');
    return;
}
```

### 5. Implement Error Boundaries
```javascript
try {
    VanstraRealtimeSync.startPolling(2000);
} catch (error) {
    console.error('Polling start failed:', error);
    // Fallback: Manual refresh button
}
```

---

## Browser Console Testing

### Check System Status
```javascript
console.log('VanstraBank:', VanstraBank);
console.log('VanstraRealtimeSync:', VanstraRealtimeSync);
console.log('Current user:', VanstraBank.getCurrentUser());
console.log('All users:', VanstraBank.getAllUsers());
```

### Test Real-Time Sync
```javascript
// Simulate balance change
const user = VanstraBank.getCurrentUser();
user.balance = 9999;
console.log('Result:', VanstraBank.updateUser(user));

// Check event was emitted
console.log('Sync status:', VanstraRealtimeSync.getSyncStatus());
```

### Monitor Polling
```javascript
VanstraRealtimeSync.watchAllUsers((data) => {
    console.log('Users updated:', new Date().toLocaleTimeString(), data.users.length);
});

VanstraRealtimeSync.startPolling(1000);
// Watch console for updates every 1 second
```

---

## Debugging Tips

### Enable Detailed Logging
```javascript
// Add to top of script
const DEBUG = true;

function log(msg) {
    if (DEBUG) console.log('[VANSTRA]', msg);
}
```

### Test All Balance Adjustments
```javascript
const user = VanstraBank.getCurrentUser();

// Test Add
const result1 = VanstraBank.updateUser({ ...user, balance: user.balance + 100 });
console.log('Add 100 EUR:', result1);

// Test Set
const result2 = VanstraBank.updateUser({ ...user, balance: 5000 });
console.log('Set to 5000 EUR:', result2);

// Test Deduct
const result3 = VanstraBank.updateUser({ ...user, balance: user.balance - 50 });
console.log('Deduct 50 EUR:', result3);
```

---

**API Version:** 2.1  
**Last Updated:** February 14, 2026  
**Status:** ✅ Production Ready
