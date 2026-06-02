# Notification Module Integration Guide

## Overview
The notification module provides a consistent, platform-wide way to show notifications and direct users to support when they interact with features.

## Features
- Replaces browser `alert()` with custom notification UI
- Includes built-in contact support options (email and live chat)
- Works across all pages on the platform
- Responsive design for mobile and desktop
- Smooth animations and professional styling

## Installation

### Step 1: Include the Script
Add this line to the `<head>` section of your HTML file:

```html
<script src="notification-module.js"></script>
```

### Step 2: Replace Alert Calls
Replace all instances of `alert()` with `showNotification()`:

**Before:**
```javascript
alert('Transfer completed successfully!');
```

**After:**
```javascript
showNotification('Transfer Complete', 'Your transfer has been processed successfully. If you have any questions, please contact our support team.');
```

## Available Functions

### showNotification(title, message)
Display a notification with a custom title and message.

```javascript
showNotification('Payment Received', 'You have received a payment of €500.00. Check your recent transactions for details.');
```

### closeNotification()
Close the currently visible notification.

```javascript
closeNotification();
```

### showComingSoon(featureName)
Display a "Coming Soon" notification for features that are under development.

```javascript
showComingSoon('Mobile Check Deposit');
// Shows: "Mobile Check Deposit is currently under development..."
```

### openLiveChat(event)
Open live chat support (currently shows a placeholder message). Future integration point for chat services like Intercom or Drift.

```javascript
// Automatically called by notification module buttons
// Or manually:
openLiveChat();
```

## Integration Examples

### Example 1: Form Validation
```javascript
function submitForm() {
    const email = document.getElementById('email').value;
    
    if (!email) {
        showNotification('Invalid Input', 'Please enter a valid email address.');
        return;
    }
    
    // Process form...
    showNotification('Success', 'Your form has been submitted. A support agent will contact you shortly.');
}
```

### Example 2: Feature Lock
```javascript
function openAdvancedSettings() {
    if (!userHasPermission()) {
        showNotification('Access Denied', 'You do not have permission to access this feature. Contact support to request access.');
        return;
    }
    
    // Open settings...
}
```

### Example 3: Action Success
```javascript
function transferMoney() {
    try {
        // Perform transfer...
        const amount = 1000;
        showNotification(
            'Transfer Complete',
            `Successfully transferred €${amount.toFixed(2)}. If you don't see the funds in the destination account within 2 hours, please contact support.`
        );
    } catch (error) {
        showNotification('Transfer Failed', `The transfer could not be completed: ${error.message}. Our support team is here to help.`);
    }
}
```

## Pages Already Updated

The following pages have been updated with the notification module:
- ✅ admin-v3.html - Admin panel with user management notifications

## Pages Ready for Update

Add the notification module to these pages by including the script tag:
- dashboard-v2.html - User dashboard
- cards-v2.html - Card management
- profile-v2.html - User profile
- wealth-v2.html - Wealth management
- support.html - Support page
- contact.html - Contact page

## Adding to Dashboard-v2.html

Here's a quick example of what to update in dashboard-v2.html:

### 1. Add Script Include
```html
<head>
    <!-- Existing scripts -->
    <script src="notification-module.js"></script>
</head>
```

### 2. Example: Update Transfer Modal
```javascript
// Replace the existing transfer function
function executeTransfer() {
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const recipient = document.getElementById('transferRecipient').value;
    
    if (!amount || !recipient) {
        showNotification('Invalid Input', 'Please enter both a recipient and an amount.');
        return;
    }
    
    try {
        // Execute transfer
        VanstraBank.transfer({amount, recipient});
        
        closeModal('transferModal');
        showNotification(
            'Transfer Successful',
            `€${amount.toFixed(2)} has been transferred to ${recipient}. If you have any issues, please contact our support team.`
        );
    } catch (error) {
        showNotification('Transfer Failed', `Could not complete transfer: ${error.message}`);
    }
}
```

### 3. Example: Feature Coming Soon
```javascript
// For features that are in development
function openWealthAdvisor() {
    showComingSoon('Wealth Advisor');
    // Or custom message:
    // showNotification('Coming Soon', 'The Wealth Advisor feature will be available next quarter. Our support team can help you with investment questions in the meantime.');
}
```

## Customization

To customize the notification styling, edit the CSS in `notification-module.js` within the `injectNotificationStyles()` function.

### Custom Colors
Modify the CSS variables:
```css
:root {
    --notification-navy: #041225;
    --notification-slate: #0B2A3F;
    --notification-gold: #C89A3A;
}
```

### Custom Animations
Update the `@keyframes slideUp` animation or create new animations.

## Live Chat Integration

The notification module includes a placeholder for live chat. To integrate with a real service:

1. Choose a service (Intercom, Drift, Zendesk, etc.)
2. Follow their integration guide
3. Modify the `openLiveChat()` function in `notification-module.js`

Example with Intercom:
```javascript
window.openLiveChat = function(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Intercom messenger is typically loaded globally
    if (window.Intercom) {
        window.Intercom('show');
    }
    
    closeNotification();
};
```

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

**Notification not showing?**
- Make sure `notification-module.js` is loaded before any code that calls `showNotification()`
- Check browser console for errors

**Styles not applying?**
- Clear browser cache
- Check that CSS injection is not blocked by browser extensions

**Live chat not working?**
- Ensure live chat service is properly integrated
- Check browser console for integration errors

## Support
For issues or questions about the notification module, contact support@vanstra.bank or use the live chat feature within the notifications.
