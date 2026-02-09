# EmailJS Templates — Vanstra Capital

This file contains ready-to-paste HTML and plain-text templates for EmailJS. All templates use the platform theme (dark-blue header, gold accent #c89a3a). Replace image URLs and links as needed.

General variables used across templates:
- `to_email` — recipient email
- `subject` — subject line
- `reply_to` — support/reply email
- `user_name` — recipient full name (when available)

---

## 1) Contact Us (acknowledgement)
Variables: `contact_name`, `contact_email`, `contact_message`, `reply_to`, `to_email`, `subject`

HTML:
```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{{subject}}</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:36px 16px;">
      <table width="600" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 18px 50px rgba(2,6,23,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0b2a3f,#0d3a52);padding:28px;text-align:center;color:#fff;">
            <div style="width:64px;height:64px;border-radius:50%;background:#c89a3a;display:inline-flex;align-items:center;justify-content:center;font-weight:700;color:#0b2a3f;font-size:24px">V</div>
            <h1 style="margin:12px 0 0 0;font-size:20px;">Vanstra Capital</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;color:#374151;">
            <p style="margin:0 0 8px 0;font-size:14px;color:#6b7280;">Hi {{contact_name}},</p>
            <p style="font-size:15px;color:#111;line-height:1.5;">Thanks for contacting Vanstra Capital. We received your message and our support team will review it shortly.</p>

            <h3 style="margin:18px 0 6px 0;font-size:15px;color:#0b2a3f;">Your message</h3>
            <div style="background:#f9fafb;border:1px solid #eef2f6;padding:12px;border-radius:8px;color:#374151;white-space:pre-wrap;font-size:14px;">{{contact_message}}</div>

            <p style="margin:18px 0 0 0;font-size:13px;color:#6b7280;">We'll reply to <strong>{{contact_email}}</strong>. If you need immediate assistance, email <a href="mailto:{{reply_to}}" style="color:#c89a3a;text-decoration:none;">{{reply_to}}</a>.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:18px 28px;text-align:center;color:#94a3b8;font-size:12px;">
            © 2026 Vanstra Capital — Secure Banking
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

Plain-text:
```
{{subject}}

Hi {{contact_name}},

Thanks for contacting Vanstra Capital. We received your message and will respond as soon as possible.

Your message:

{{contact_message}}

We'll reply to: {{contact_email}}

If urgent, email: {{reply_to}}

— Vanstra Capital
```

---

## 2) Auto-Reply (generic immediate response)
Variables: `to_email`, `subject`, `auto_reply_message`, `reply_to`, `user_name`

HTML:
```html
<!doctype html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>{{subject}}</title></head>
<body style="margin:0;background:#f6f8fb;font-family:Inter,Arial,sans-serif;color:#1f2937;">
  <table width="100%"><tr><td align="center" style="padding:28px 12px;">
    <table width="600" style="background:#fff;border-radius:12px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#0b2a3f,#0d3a52);padding:20px;text-align:center;color:#fff;"><h2 style="margin:0">Vanstra Capital</h2></td></tr>
      <tr><td style="padding:22px 26px;color:#374151;">
        <p style="margin:0 0 8px 0;">Hi {{user_name}},</p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#111;">{{auto_reply_message}}</p>
        <p style="margin:12px 0 0 0;font-size:13px;color:#6b7280;">For further help, contact <a href="mailto:{{reply_to}}" style="color:#c89a3a">{{reply_to}}</a>.</p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:14px 22px;text-align:center;color:#94a3b8;font-size:12px;">© Vanstra Capital</td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

Plain-text:
```
{{subject}}

Hi {{user_name}},

{{auto_reply_message}}

For more help, contact: {{reply_to}}

— Vanstra Capital
```

---

## 3) Welcome (new account)
Variables: `user_name`, `to_email`, `subject`, `login_link`, `reply_to`

HTML:
```html
<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>{{subject}}</title></head>
<body style="margin:0;background:#f6f8fb;font-family:Inter,Arial,sans-serif;color:#1f2937;">
  <table width="100%"><tr><td align="center" style="padding:36px 12px;">
    <table width="600" style="background:#fff;border-radius:12px;">
      <tr><td style="background:linear-gradient(135deg,#0b2a3f,#0d3a52);padding:28px;text-align:center;color:#fff;"><h2 style="margin:0">Welcome to Vanstra Capital</h2></td></tr>
      <tr><td style="padding:24px 28px;color:#374151;">
        <p style="margin:0 0 12px 0;">Hi {{user_name}},</p>
        <p style="margin:0 0 18px 0;font-size:15px;color:#111;line-height:1.5;">Welcome — your Vanstra Capital account is ready. We’re excited to have you on board.</p>
        <div style="text-align:center;margin:18px 0;"><a href="{{login_link}}" style="background:#c89a3a;color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:600;">Get started</a></div>
        <p style="font-size:13px;color:#6b7280;margin-top:12px;">Need help? Reply to <a href="mailto:{{reply_to}}" style="color:#c89a3a">{{reply_to}}</a>.</p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:14px 22px;text-align:center;color:#94a3b8;font-size:12px;">© Vanstra Capital</td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

Plain-text:
```
{{subject}}

Hi {{user_name}},

Welcome to Vanstra Capital! Your account is ready.

Login here: {{login_link}}

Questions? {{reply_to}}

— Vanstra Capital
```

---

## 4) Password Reset (polished)
Variables: `user_name`, `reset_link`, `to_email`, `subject`, `reply_to`

HTML (recommended):
```html
<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>{{subject}}</title></head>
<body style="margin:0;background:linear-gradient(135deg,#041225,#0B2A3F);font-family:Inter,Arial,sans-serif;color:#1f2937;">
  <table width="100%"><tr><td align="center" style="padding:36px 12px;">
    <table width="600" style="background:#fff;border-radius:12px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#0b2a3f,#0d3a52);padding:28px;text-align:center;color:#fff;"><h2 style="margin:0">Vanstra Capital</h2></td></tr>
      <tr><td style="padding:28px;color:#374151;">
        <p style="margin:0 0 12px 0;">Hi {{user_name}},</p>
        <p style="margin:0 0 18px 0;font-size:15px;color:#111;">We received a request to reset your password. Use the button below to choose a new password. This link expires in 1 hour.</p>
        <div style="text-align:center;margin:22px 0;"><a href="{{reset_link}}" style="background:#c89a3a;color:#fff;padding:12px 36px;border-radius:8px;text-decoration:none;font-weight:700;">Reset password</a></div>
        <p style="font-size:13px;color:#6b7280;">Or copy/paste: <span style="color:#0b2a3f">{{reset_link}}</span></p>
        <p style="margin-top:18px;font-size:13px;color:#6b7280;">If you didn't request this, ignore this email or contact <a href="mailto:{{reply_to}}" style="color:#c89a3a">{{reply_to}}</a>.</p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:14px;text-align:center;color:#94a3b8;font-size:12px;">© Vanstra Capital</td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

Plain-text:
```
{{subject}}

Hi {{user_name}},

We received a request to reset your password. Visit the link below (expires in 1 hour):

{{reset_link}}

If you didn't request this, ignore this email or contact {{reply_to}}.

— Vanstra Capital
```

---

## 5) One-Time Password (OTP)
Variables: `user_name`, `otp_code`, `otp_expires_minutes`, `to_email`, `subject`, `reply_to`

HTML:
```html
<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>{{subject}}</title></head>
<body style="margin:0;background:#f6f8fb;font-family:Inter,Arial,sans-serif;color:#1f2937;">
  <table width="100%"><tr><td align="center" style="padding:28px 12px;">
    <table width="520" style="background:#fff;border-radius:12px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#0b2a3f,#0d3a52);padding:20px;text-align:center;color:#fff;"><h3 style="margin:0">Verification Code</h3></td></tr>
      <tr><td style="padding:22px;color:#374151;text-align:center;">
        <p style="margin:0 0 12px 0;">Hi {{user_name}},</p>
        <p style="margin:0 0 18px 0;font-size:18px;color:#111;">Use the following one-time code to complete your action. This code expires in {{otp_expires_minutes}} minutes.</p>
        <div style="font-size:28px;font-weight:700;color:#0b2a3f;background:#f8fafc;padding:14px;border-radius:10px;display:inline-block;margin:16px 0;letter-spacing:4px;">{{otp_code}}</div>
        <p style="font-size:13px;color:#6b7280;">If you didn't request this, contact <a href="mailto:{{reply_to}}" style="color:#c89a3a">{{reply_to}}</a>.</p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:12px;text-align:center;color:#94a3b8;font-size:12px;">© Vanstra Capital</td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

Plain-text:
```
{{subject}}

Hi {{user_name}},

Your verification code is: {{otp_code}}

This code expires in {{otp_expires_minutes}} minutes.

If you didn't request this, contact: {{reply_to}}

— Vanstra Capital
```

---

## 6) Order Confirmation
Variables: `user_name`, `order_id`, `order_items` (HTML-friendly), `order_total`, `shipping_address`, `to_email`, `subject`, `reply_to`

HTML:
```html
<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>{{subject}}</title></head>
<body style="margin:0;background:#f6f8fb;font-family:Inter,Arial,sans-serif;color:#1f2937;">
  <table width="100%"><tr><td align="center" style="padding:28px 12px;">
    <table width="700" style="background:#fff;border-radius:12px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#0b2a3f,#0d3a52);padding:20px;color:#fff;text-align:center;"><h2 style="margin:0">Order Confirmed</h2></td></tr>
      <tr><td style="padding:22px;color:#374151;">
        <p style="margin:0 0 12px 0;">Hi {{user_name}},</p>
        <p style="margin:0 0 12px 0;color:#111;">Thanks for your order. Your order <strong>#{{order_id}}</strong> has been received and is being processed.</p>

        <h4 style="margin:12px 0 8px 0;color:#0b2a3f;">Order details</h4>
        <div style="border:1px solid #eef2f6;padding:12px;border-radius:8px;background:#fbfdff;">
          {{order_items}}
        </div>

        <p style="margin:14px 0 0 0;font-size:15px;color:#111;">Order total: <strong>{{order_total}}</strong></p>
        <p style="margin:8px 0 0 0;font-size:13px;color:#6b7280;">Shipping address:<br>{{shipping_address}}</p>

        <p style="margin:18px 0 0 0;font-size:13px;color:#6b7280;">Questions? Reply to <a href="mailto:{{reply_to}}" style="color:#c89a3a">{{reply_to}}</a>.</p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:14px;text-align:center;color:#94a3b8;font-size:12px;">© Vanstra Capital</td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

Plain-text (simplified):
```
{{subject}}

Hi {{user_name}},

Thanks for your order. Order #{{order_id}} has been received.

Items:
{{order_items}}

Order total: {{order_total}}

Shipping address:
{{shipping_address}}

Questions? Reply: {{reply_to}}

— Vanstra Capital
```

> Note: For `order_items` supply HTML list markup in the template variables (e.g., <ul><li>Product x — €12.00</li></ul>) or pre-render server-side.

---

## 7) Feedback Request (post-action)
Variables: `user_name`, `feedback_link`, `to_email`, `subject`, `reply_to`, `order_id` (optional)

HTML:
```html
<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>{{subject}}</title></head>
<body style="margin:0;background:#f6f8fb;font-family:Inter,Arial,sans-serif;color:#1f2937;">
  <table width="100%"><tr><td align="center" style="padding:28px 12px;">
    <table width="600" style="background:#fff;border-radius:12px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#0b2a3f,#0d3a52);padding:20px;color:#fff;text-align:center;"><h3 style="margin:0">We value your feedback</h3></td></tr>
      <tr><td style="padding:22px;color:#374151;">
        <p style="margin:0 0 12px 0;">Hi {{user_name}},</p>
        <p style="margin:0 0 18px 0;color:#111;">We hope you had a great experience. Would you mind taking a minute to tell us how we did?</p>
        <div style="text-align:center;margin:18px 0;"><a href="{{feedback_link}}" style="background:#0b2a3f;color:#fff;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:600;">Leave feedback</a></div>
        <p style="font-size:13px;color:#6b7280;">Questions? Reply to <a href="mailto:{{reply_to}}" style="color:#c89a3a">{{reply_to}}</a>.</p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:12px;text-align:center;color:#94a3b8;font-size:12px;">© Vanstra Capital</td></tr>
    </table>
  </td></tr></table>
</body>
</html>
```

Plain-text:
```
{{subject}}

Hi {{user_name}},

We hope you enjoyed your experience. Please tell us how we did: {{feedback_link}}

Questions? Reply: {{reply_to}}

— Vanstra Capital
```

---

## Usage notes
- Paste the HTML into EmailJS template HTML. Paste the plain-text into the plain-text area.
- Use the variable names shown for each template when calling `emailjs.send()` from `sendEmail()`'s `extraVars` argument.
- Example send call for password reset (already wired in `bank-core-v2.js`):

```js
emailjs.send('service_vanstra', 'template_password_reset', {
  to_email: 'user@example.com',
  subject: 'Password Reset Request',
  user_name: 'Jane Doe',
  reset_link: 'https://example.com/reset?token=..',
  reply_to: 'noreply@vanstracapital.com'
});
```

---

If you want, I can also patch `bank-core-v2.js` to include helper functions that build `order_items` HTML or to add dedicated `sendOrderConfirmation()` and `sendFeedbackRequest()` wrappers. Which would you like next?