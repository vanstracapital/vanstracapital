// Vanstra Bank v2.0 - Core Banking System with Dual Authentication
// Separate Login Password and Transaction PIN

const VanstraBank = (function() {
    'use strict';

    // Event system for real-time updates
    const eventListeners = {};
    
    function on(event, callback) {
        if (!eventListeners[event]) eventListeners[event] = [];
        eventListeners[event].push(callback);
    }
    
    function emit(event, data) {
        if (eventListeners[event]) {
            eventListeners[event].forEach(cb => cb(data));
        }
        // Also store in admin events
        const adminEvents = JSON.parse(localStorage.getItem('adminEvents') || '[]');
        adminEvents.unshift({ event, data, timestamp: new Date().toISOString() });
        localStorage.setItem('adminEvents', JSON.stringify(adminEvents.slice(0, 100)));
    }

    // Simple hash function (in production, use bcrypt or similar)
    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    // Generate unique IDs
    function generateAccountNumber() {
        return 'DE' + Math.floor(1000000000 + Math.random() * 9000000000);
    }

    function generateUserId() {
        return 'USR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    }

    function generateTransactionId() {
        return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    }

    // Initialize system
    function init() {
        if (!localStorage.getItem('vanstraUsers')) {
            localStorage.setItem('vanstraUsers', JSON.stringify({}));
        }
        if (!localStorage.getItem('vanstraSessions')) {
            localStorage.setItem('vanstraSessions', JSON.stringify({}));
        }
        if (!localStorage.getItem('adminEvents')) {
            localStorage.setItem('adminEvents', JSON.stringify([]));
        }
        if (!localStorage.getItem('chatMessages')) {
            localStorage.setItem('chatMessages', JSON.stringify([]));
        }
    }

    init();

    // ==================== USER MANAGEMENT ====================

    function createAccount(userData) {
        const users = JSON.parse(localStorage.getItem('vanstraUsers'));
        
        // Validate email uniqueness
        const existingUser = Object.values(users).find(u => u.email === userData.email);
        if (existingUser) {
            return { success: false, error: 'Email already registered' };
        }

        // Validate password requirements
        if (userData.password.length < 8) {
            return { success: false, error: 'Password must be at least 8 characters' };
        }

        // Validate PIN requirements
        if (!/^\d{4}$/.test(userData.pin)) {
            return { success: false, error: 'PIN must be exactly 4 digits' };
        }

        // Ensure password !== PIN
        if (userData.password === userData.pin) {
            return { success: false, error: 'Login password cannot be the same as transaction PIN' };
        }

        // Create user record
        const userId = generateUserId();
        const accountNumber = generateAccountNumber();
        
        const newUser = {
            id: userId,
            fullName: userData.fullName,
            email: userData.email,
            dateOfBirth: userData.dateOfBirth,
            phone: userData.phone,
            accountNumber: accountNumber,
            accountType: 'Premium Checking',
            balance: 5000.00, // Starting balance
            currency: 'EUR',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isOnline: false,
            avatar: null,
            // SECURITY: Store hashed credentials only
            passwordHash: hashString(userData.password),
            pinHash: hashString(userData.pin),
            transactions: [],
            failedPinAttempts: 0,
            lockedUntil: null
        };

        users[userId] = newUser;
        localStorage.setItem('vanstraUsers', JSON.stringify(users));

        // Emit to admin
        emit('user_created', { userId, user: sanitizeForAdmin(newUser) });

        // Send welcome email (stored in local sentEmails for demo)
        sendEmail(newUser.email, 'Welcome to Vanstra Capital', `Hi ${newUser.fullName},\n\nWelcome to Vanstra Capital. Your account has been created successfully.`);

        // Background: attempt to store user in Supabase if available
        try {
            if (window.SupabaseDB && window.SupabaseDB.initialized) {
                (async () => {
                    try {
                        // createUser expects the full user object
                        await window.SupabaseDB.createUser(newUser);
                    } catch (e) {
                        console.warn('Supabase createUser failed', e);
                    }
                })();
            }
        } catch (e) {
            console.warn('Supabase unavailable', e);
        }

        // Auto-login
        const session = createSession(userId);

        return { 
            success: true, 
            user: sanitizeForClient(newUser),
            sessionToken: session.token
        };
    }

    function login(email, password) {
        const users = JSON.parse(localStorage.getItem('vanstraUsers'));
        const user = Object.values(users).find(u => u.email === email);

        if (!user) {
            return { success: false, error: 'Invalid email or password' };
        }

        if (user.status === 'locked') {
            return { success: false, error: 'Account locked. Contact support.' };
        }

        // Verify password hash
        if (user.passwordHash !== hashString(password)) {
            emit('login_failed', { email, reason: 'invalid_password' });
            return { success: false, error: 'Invalid email or password' };
        }

        // Update user status
        user.lastLogin = new Date().toISOString();
        user.isOnline = true;
        user.failedPinAttempts = 0;
        users[user.id] = user;
        localStorage.setItem('vanstraUsers', JSON.stringify(users));

        // Create session
        const session = createSession(user.id);

        // Emit to admin
        emit('user_login', { userId: user.id, user: sanitizeForAdmin(user) });

        // Send login notification email
        sendEmail(user.email, 'Sign-in notification', `Hi ${user.fullName},\n\nWe noticed a sign-in to your Vanstra account. If this wasn't you, contact support immediately.`);

        // Background: ensure user exists/updated in Supabase
        try {
            if (window.SupabaseDB && window.SupabaseDB.initialized) {
                (async () => {
                    try {
                        await window.SupabaseDB.updateUser(user.id, {
                            id: user.id,
                            fullName: user.fullName,
                            email: user.email,
                            phone: user.phone,
                            accountNumber: user.accountNumber,
                            accountType: user.accountType,
                            balance: user.balance,
                            currency: user.currency,
                            isOnline: true,
                            lastLogin: user.lastLogin
                        });
                    } catch (e) {
                        try { await window.SupabaseDB.createUser(user); } catch (err) { console.warn('Supabase upsert failed', err); }
                    }
                })();
            }
        } catch (e) {
            console.warn('Supabase unavailable', e);
        }

        return { 
            success: true, 
            user: sanitizeForClient(user),
            sessionToken: session.token
        };
    }

    function logout(sessionToken) {
        const sessions = JSON.parse(localStorage.getItem('vanstraSessions'));
        const session = sessions[sessionToken];
        
        if (session) {
            const users = JSON.parse(localStorage.getItem('vanstraUsers'));
            const user = users[session.userId];
            if (user) {
                user.isOnline = false;
                users[session.userId] = user;
                localStorage.setItem('vanstraUsers', JSON.stringify(users));
                
                emit('user_logout', { userId: session.userId });
            }
            delete sessions[sessionToken];
            localStorage.setItem('vanstraSessions', JSON.stringify(sessions));
        }
        
        return { success: true };
    }

    function createSession(userId) {
        const sessions = JSON.parse(localStorage.getItem('vanstraSessions'));
        const token = 'SES-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
        
        sessions[token] = {
            userId: userId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
        
        localStorage.setItem('vanstraSessions', JSON.stringify(sessions));
        localStorage.setItem('currentSession', token);
        
        return { token };
    }

    function getCurrentUser() {
        const sessionToken = localStorage.getItem('currentSession');
        if (!sessionToken) return null;

        const sessions = JSON.parse(localStorage.getItem('vanstraSessions'));
        const session = sessions[sessionToken];
        
        if (!session || new Date(session.expiresAt) < new Date()) {
            localStorage.removeItem('currentSession');
            return null;
        }

        const users = JSON.parse(localStorage.getItem('vanstraUsers'));
        return users[session.userId] || null;
    }

    function isAuthenticated() {
        return getCurrentUser() !== null;
    }

    // ==================== TRANSACTION PIN AUTHORIZATION ====================

    function verifyPin(userId, pin) {
        const users = JSON.parse(localStorage.getItem('vanstraUsers'));
        const user = users[userId];

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
            return { success: false, error: `Account locked. Try again in ${minutesLeft} minutes.` };
        }

        // Verify PIN hash
        if (user.pinHash !== hashString(pin)) {
            user.failedPinAttempts = (user.failedPinAttempts || 0) + 1;
            
            // Lock after 3 failed attempts
            if (user.failedPinAttempts >= 3) {
                user.lockedUntil = new Date(Date.now() + 30 * 60000).toISOString(); // 30 min lock
                user.failedPinAttempts = 0;
            }
            
            users[userId] = user;
            localStorage.setItem('vanstraUsers', JSON.stringify(users));
            
            emit('pin_failed', { userId, attempts: user.failedPinAttempts });
            
            return { 
                success: false, 
                error: user.lockedUntil 
                    ? 'Too many failed attempts. Account locked for 30 minutes.' 
                    : 'Incorrect PIN. Please try again.' 
            };
        }

        // Reset failed attempts on success
        user.failedPinAttempts = 0;
        users[userId] = user;
        localStorage.setItem('vanstraUsers', JSON.stringify(users));

        return { success: true };
    }

    // ==================== TRANSACTIONS ====================

    function transfer(userId, pin, transferData) {
        // CRITICAL: Verify PIN first
        const pinCheck = verifyPin(userId, pin);
        if (!pinCheck.success) {
            return pinCheck;
        }

        const users = JSON.parse(localStorage.getItem('vanstraUsers'));
        const user = users[userId];

        if (transferData.amount > user.balance) {
            return { success: false, error: 'Insufficient funds' };
        }

        // Process transfer
        user.balance -= transferData.amount;
        
        const transaction = {
            id: generateTransactionId(),
            type: 'transfer',
            subtype: transferData.transferType,
            description: transferData.transferType === 'internal' 
                ? 'Internal Transfer' 
                : 'External Transfer',
            amount: -transferData.amount,
            currency: 'EUR',
            recipientName: transferData.recipientName,
            recipientAccount: transferData.recipientAccount,
            recipientBank: transferData.recipientBank,
            note: transferData.note || '',
            status: 'completed',
            timestamp: new Date().toISOString(),
            reference: 'REF-' + Math.random().toString(36).substr(2, 8).toUpperCase()
        };

        user.transactions.unshift(transaction);
        users[userId] = user;
        localStorage.setItem('vanstraUsers', JSON.stringify(users));

        emit('transaction', { userId, transaction, newBalance: user.balance });

        // persist to Supabase in background if available
        try {
            if (window.SupabaseDB && window.SupabaseDB.initialized) {
                (async () => {
                    try { await window.SupabaseDB.createTransaction(userId, transaction); } catch (e) { console.warn('Supabase createTransaction failed', e); }
                })();
            }
        } catch (e) { console.warn('Supabase unavailable', e); }

        return { success: true, transaction, newBalance: user.balance };
    }

    function payBill(userId, pin, paymentData) {
        // CRITICAL: Verify PIN first
        const pinCheck = verifyPin(userId, pin);
        if (!pinCheck.success) {
            return pinCheck;
        }

        const users = JSON.parse(localStorage.getItem('vanstraUsers'));
        const user = users[userId];

        if (paymentData.amount > user.balance) {
            return { success: false, error: 'Insufficient funds' };
        }

        user.balance -= paymentData.amount;

        const transaction = {
            id: generateTransactionId(),
            type: 'payment',
            subtype: 'bill',
            description: paymentData.billerName,
            amount: -paymentData.amount,
            currency: 'EUR',
            recipientName: paymentData.billerName,
            category: paymentData.category,
            referenceNumber: paymentData.referenceNumber,
            status: 'completed',
            timestamp: new Date().toISOString(),
            reference: 'REF-' + Math.random().toString(36).substr(2, 8).toUpperCase()
        };

        user.transactions.unshift(transaction);
        users[userId] = user;
        localStorage.setItem('vanstraUsers', JSON.stringify(users));

        emit('transaction', { userId, transaction, newBalance: user.balance });

        try {
            if (window.SupabaseDB && window.SupabaseDB.initialized) {
                (async () => {
                    try { await window.SupabaseDB.createTransaction(userId, transaction); } catch (e) { console.warn('Supabase createTransaction failed', e); }
                })();
            }
        } catch (e) { console.warn('Supabase unavailable', e); }

        return { success: true, transaction, newBalance: user.balance };
    }

    function submitDeposit(userId, pin, depositData) {
        // CRITICAL: Verify PIN first
        const pinCheck = verifyPin(userId, pin);
        if (!pinCheck.success) {
            return pinCheck;
        }

        const users = JSON.parse(localStorage.getItem('vanstraUsers'));
        const user = users[userId];

        const transaction = {
            id: generateTransactionId(),
            type: 'deposit',
            subtype: 'check',
            description: 'Mobile Check Deposit',
            amount: depositData.amount,
            currency: 'EUR',
            status: 'pending',
            timestamp: new Date().toISOString(),
            reference: 'REF-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            estimatedClearance: new Date(Date.now() + 2 * 86400000).toISOString()
        };

        user.transactions.unshift(transaction);
        users[userId] = user;
        localStorage.setItem('vanstraUsers', JSON.stringify(users));

        emit('deposit_submitted', { userId, transaction });

        try {
            if (window.SupabaseDB && window.SupabaseDB.initialized) {
                (async () => {
                    try { await window.SupabaseDB.createTransaction(userId, transaction); } catch (e) { console.warn('Supabase createTransaction failed', e); }
                })();
            }
        } catch (e) { console.warn('Supabase unavailable', e); }

        return { success: true, transaction };
    }

    // ==================== CHAT SYSTEM ====================

    function sendEmail(to, subject, body, extraVars = {}) {
        try {
            const email = {
                id: 'MAIL-' + Date.now() + '-' + Math.random().toString(36).substr(2,6).toUpperCase(),
                to,
                subject,
                body,
                timestamp: new Date().toISOString()
            };

            // Store locally
            const sent = JSON.parse(localStorage.getItem('sentEmails') || '[]');
            sent.unshift(email);
            localStorage.setItem('sentEmails', JSON.stringify(sent));
            emit('email_sent', email);

            // Send real email via EmailJS
            if (window.emailjs) {
                const templateVars = {
                    to_email: to,
                    subject: subject,
                    message: body,
                    reply_to: 'noreply@vanstracapital.com',
                    ...extraVars
                };
                emailjs.send('service_vanstra', 'template_password_reset', templateVars).catch(err => {
                    console.warn('Email failed:', err);
                });
            }

            // attempt to persist to Supabase as well
            try {
                if (window.SupabaseDB && window.SupabaseDB.initialized) {
                    (async () => {
                        try { await window.SupabaseDB.storeEmail(email); } catch (e) { console.warn('Supabase storeEmail failed', e); }
                    })();
                }
            } catch (e) {
                console.warn('Supabase unavailable', e);
            }

            return { success: true, email };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    function sendChatMessage(userId, message) {
        const chatMsg = {
            id: 'MSG-' + Date.now(),
            userId: userId,
            message: message,
            from: 'user',
            timestamp: new Date().toISOString(),
            read: false
        };
        const messages = JSON.parse(localStorage.getItem('chatMessages'));

        // Check if this is the user's first message in chat
        const hadPreviousUserMessage = messages.some(m => m.userId === userId && m.from === 'user');

        messages.push(chatMsg);

        // If this is the first user message, add an automated admin prompt requesting their email
        if (!hadPreviousUserMessage) {
            const adminPrompt = {
                id: 'MSG-' + (Date.now() + 1),
                userId: userId,
                message: "Hi there — to help you faster, please confirm the email address associated with your account.",
                from: 'admin',
                timestamp: new Date().toISOString(),
                read: false,
                system: true
            };
            messages.push(adminPrompt);
            emit('chat_message', adminPrompt);
        }

        localStorage.setItem('chatMessages', JSON.stringify(messages));

        emit('chat_message', chatMsg);

        return { success: true, message: chatMsg };
    }

    function getChatMessages(userId) {
        const messages = JSON.parse(localStorage.getItem('chatMessages'));
        return messages.filter(m => m.userId === userId);
    }

    // ==================== ADMIN FUNCTIONS ====================

    function getAllUsers() {
        const usersData = localStorage.getItem('vanstraUsers');
        if (!usersData) return [];
        const users = JSON.parse(usersData);
        if (!users || Object.keys(users).length === 0) return [];

        // Background: if Supabase is enabled, try to sync users from Supabase
        try {
            if (window.SupabaseDB && window.SupabaseDB.initialized) {
                (async () => {
                    try {
                        const supaUsers = await window.SupabaseDB.getAllUsers();
                        // supaUsers is expected to be an array; convert to object keyed by id
                        if (Array.isArray(supaUsers) && supaUsers.length > 0) {
                            const usersObj = {};
                            supaUsers.forEach(u => { usersObj[u.id] = Object.assign({}, users[u.id] || {}, u); });
                            // Merge with local users to preserve local-only fields
                            const merged = Object.assign({}, users, usersObj);
                            localStorage.setItem('vanstraUsers', JSON.stringify(merged));
                        }
                    } catch (e) {
                        console.warn('Failed to sync users from Supabase', e);
                    }
                })();
            }
        } catch (e) { console.warn('Supabase unavailable', e); }

        return Object.values(users).map(sanitizeForAdmin);
    }

    function getAdminEvents() {
        return JSON.parse(localStorage.getItem('adminEvents') || '[]');
    }

    function adminReply(userId, message) {
        const chatMsg = {
            id: 'MSG-' + Date.now(),
            userId: userId,
            message: message,
            from: 'admin',
            timestamp: new Date().toISOString(),
            read: false
        };

        const messages = JSON.parse(localStorage.getItem('chatMessages'));
        messages.push(chatMsg);
        localStorage.setItem('chatMessages', JSON.stringify(messages));

        emit('admin_reply', chatMsg);

        return { success: true, message: chatMsg };
    }

    // ==================== UTILITIES ====================

    function sanitizeForClient(user) {
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            accountNumber: user.accountNumber,
            accountType: user.accountType,
            balance: user.balance,
            currency: user.currency,
            avatar: user.avatar,
            createdAt: user.createdAt,
            transactions: user.transactions || []
        };
    }

    function sanitizeForAdmin(user) {
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            accountNumber: user.accountNumber,
            balance: user.balance,
            status: user.status,
            accountStatus: user.accountStatus || 'active',
            isOnline: user.isOnline,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            failedPinAttempts: user.failedPinAttempts
        };
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 86400000) return 'Today';
        if (diff < 172800000) return 'Yesterday';
        return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
    }

    function formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('de-DE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // ==================== PROFILE MANAGEMENT ====================

    function updateProfile(profileData) {
        try {
            const sessionToken = localStorage.getItem('currentSession');
            if (!sessionToken) {
                return { success: false, error: 'Not authenticated' };
            }

            const sessions = JSON.parse(localStorage.getItem('vanstraSessions'));
            const session = sessions[sessionToken];
            if (!session) {
                return { success: false, error: 'Session not found' };
            }

            const users = JSON.parse(localStorage.getItem('vanstraUsers'));
            const user = users[session.userId];
            if (!user) {
                return { success: false, error: 'User not found' };
            }

            // Update profile fields
            if (profileData.fullName) user.fullName = profileData.fullName;
            if (profileData.email) user.email = profileData.email;
            if (profileData.phone) user.phone = profileData.phone;

            users[session.userId] = user;
            localStorage.setItem('vanstraUsers', JSON.stringify(users));

            // Emit event
            emit('profile_updated', { userId: session.userId, user: sanitizeForClient(user) });

            return { success: true, user: sanitizeForClient(user) };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    function updateAvatar(dataUrl) {
        try {
            const sessionToken = localStorage.getItem('currentSession');
            if (!sessionToken) {
                return { success: false, error: 'Not authenticated' };
            }

            const sessions = JSON.parse(localStorage.getItem('vanstraSessions'));
            const session = sessions[sessionToken];
            if (!session) {
                return { success: false, error: 'Session not found' };
            }

            const users = JSON.parse(localStorage.getItem('vanstraUsers'));
            const user = users[session.userId];
            if (!user) {
                return { success: false, error: 'User not found' };
            }

            // Update avatar
            user.avatar = dataUrl;
            users[session.userId] = user;
            localStorage.setItem('vanstraUsers', JSON.stringify(users));

            // Emit event
            emit('avatar_updated', { userId: session.userId, avatar: dataUrl });

            return { success: true, user: sanitizeForClient(user) };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    function updateSecuritySettings(securityData) {
        try {
            const sessionToken = localStorage.getItem('currentSession');
            if (!sessionToken) {
                return { success: false, error: 'Not authenticated' };
            }

            const sessions = JSON.parse(localStorage.getItem('vanstraSessions'));
            const session = sessions[sessionToken];
            if (!session) {
                return { success: false, error: 'Session not found' };
            }

            const users = JSON.parse(localStorage.getItem('vanstraUsers'));
            const user = users[session.userId];
            if (!user) {
                return { success: false, error: 'User not found' };
            }

            // Verify current password before allowing changes
            if (user.passwordHash !== hashString(securityData.currentPassword)) {
                return { success: false, error: 'Current password is incorrect' };
            }

            // Update password and PIN if provided
            if (securityData.newPassword) {
                user.passwordHash = hashString(securityData.newPassword);
            }
            if (securityData.pin) {
                user.pinHash = hashString(securityData.pin);
            }

            users[session.userId] = user;
            localStorage.setItem('vanstraUsers', JSON.stringify(users));

            // Emit event
            emit('security_updated', { userId: session.userId });

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // ==================== PASSWORD RECOVERY ====================

    function requestPasswordReset(email) {
        try {
            const users = JSON.parse(localStorage.getItem('vanstraUsers'));
            const user = Object.values(users).find(u => u.email === email);
            
            if (!user) {
                // For security, don't reveal if email exists
                return { success: true, message: 'If an account with this email exists, a reset link has been sent.' };
            }

            // Generate reset token
            const resetToken = Math.random().toString(36).substr(2) + Date.now().toString(36);
            const resetExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour expiry
            
            // Store reset token
            let resetRequests = JSON.parse(localStorage.getItem('passwordResetRequests') || '{}');
            resetRequests[resetToken] = {
                userId: user.id,
                email: email,
                expiresAt: resetExpiry,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('passwordResetRequests', JSON.stringify(resetRequests));

            // Simulate sending email with reset link
            const resetLink = `${window.location.origin}/reset-password.html?token=${resetToken}`;
            sendEmail(email, 'Password Reset Request', 
                `Click the link below to reset your password. This link expires in 1 hour.\n\n${resetLink}\n\nIf you didn't request this, please ignore this email.`
            );

            // Log the event
            emit('password_reset_requested', { email, timestamp: new Date().toISOString() });

            return { success: true, message: 'If an account with this email exists, a reset link has been sent.' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    function resetPasswordWithToken(token, newPassword) {
        try {
            let resetRequests = JSON.parse(localStorage.getItem('passwordResetRequests') || '{}');
            const resetRequest = resetRequests[token];

            if (!resetRequest) {
                return { success: false, error: 'Invalid or expired reset token' };
            }

            // Check if token has expired
            if (new Date() > new Date(resetRequest.expiresAt)) {
                delete resetRequests[token];
                localStorage.setItem('passwordResetRequests', JSON.stringify(resetRequests));
                return { success: false, error: 'Reset token has expired. Please request a new one.' };
            }

            // Validate new password
            if (newPassword.length < 8) {
                return { success: false, error: 'Password must be at least 8 characters' };
            }

            // Update user password
            const users = JSON.parse(localStorage.getItem('vanstraUsers'));
            const user = users[resetRequest.userId];
            
            if (!user) {
                return { success: false, error: 'User not found' };
            }

            user.passwordHash = hashString(newPassword);
            users[resetRequest.userId] = user;
            localStorage.setItem('vanstraUsers', JSON.stringify(users));

            // Remove used token
            delete resetRequests[token];
            localStorage.setItem('passwordResetRequests', JSON.stringify(resetRequests));

            // Log the event
            emit('password_reset_completed', { userId: resetRequest.userId, email: resetRequest.email, timestamp: new Date().toISOString() });

            return { success: true, message: 'Password has been reset successfully. Please log in with your new password.' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    function validateResetToken(token) {
        try {
            let resetRequests = JSON.parse(localStorage.getItem('passwordResetRequests') || '{}');
            const resetRequest = resetRequests[token];

            if (!resetRequest) {
                return { valid: false, error: 'Invalid reset token' };
            }

            // Check if token has expired
            if (new Date() > new Date(resetRequest.expiresAt)) {
                delete resetRequests[token];
                localStorage.setItem('passwordResetRequests', JSON.stringify(resetRequests));
                return { valid: false, error: 'Reset token has expired' };
            }

            return { valid: true, email: resetRequest.email };
        } catch (e) {
            return { valid: false, error: e.message };
        }
    }

    // ==================== PUBLIC API ====================

    return {
        // Auth
        createAccount,
        login,
        logout,
        getCurrentUser,
        isAuthenticated,
        
        // Profile
        updateProfile,
        updateAvatar,
        updateSecuritySettings,
        
        // Password Recovery
        requestPasswordReset,
        resetPasswordWithToken,
        validateResetToken,
        
        // PIN
        verifyPin,
        
        // Transactions
        transfer,
        payBill,
        submitDeposit,
        
        // Chat
        sendChatMessage,
        getChatMessages,
        adminReply,
        // Email (simulated)
        sendEmail,
        
        // Admin
        getAllUsers,
        getAdminEvents,
        
        // Events
        on,
        emit,
        
        // Utils
        formatCurrency,
        formatDate,
        formatDateTime,
        hashString
    };
})();

// Make available globally
window.VanstraBank = VanstraBank;
