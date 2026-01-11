# Meta Integration - Configuration Guide

This guide explains how to configure the Meta (Facebook/Instagram) integration.

---

## Prerequisites

Before starting, ensure you have:

- A Facebook Developer account
- A Meta App created in the [Meta Developer Console](https://developers.facebook.com/apps/)
- A Facebook Page (for Messenger)
- An Instagram Business account linked to your Facebook Page (for Instagram DMs)
- Lead Ads set up on your Facebook Page (for leads)

---

## 1. Environment Variables

Add these variables to your `.env` file:

```bash
# Meta/Facebook OAuth
FACEBOOK_CLIENT_ID=your_app_id
FACEBOOK_CLIENT_SECRET=your_app_secret

# Webhook verification (choose any random string)
META_WEBHOOK_VERIFY_TOKEN=your_random_secret_token
```

### Where to Find These Values

| Variable                    | Location                                                          |
| --------------------------- | ----------------------------------------------------------------- |
| `FACEBOOK_CLIENT_ID`        | Meta Developer Console → Your App → Settings → Basic → App ID     |
| `FACEBOOK_CLIENT_SECRET`    | Meta Developer Console → Your App → Settings → Basic → App Secret |
| `META_WEBHOOK_VERIFY_TOKEN` | Create your own random string (e.g., `my_webhook_token_abc123`)   |

---

## 2. Meta App Configuration

### 2.1 Basic Settings

1. Go to [Meta Developer Console](https://developers.facebook.com/apps/)
2. Select your app (or create one)
3. Go to **Settings → Basic**
4. Configure:
   - **App Domains**: Add your domain (e.g., `yourdomain.com`)
   - **Privacy Policy URL**: Required for production
   - **Terms of Service URL**: Recommended

### 2.2 Add Products

In your Meta App, add these products:

1. **Facebook Login** (for OAuth)
2. **Messenger** (for Messenger messaging)
3. **Instagram** (for Instagram DMs)
4. **Webhooks** (for real-time events)

---

## 3. OAuth Configuration

### 3.1 Facebook Login Settings

Go to **Facebook Login → Settings**:

| Setting                   | Value                                                |
| ------------------------- | ---------------------------------------------------- |
| Client OAuth Login        | Yes                                                  |
| Web OAuth Login           | Yes                                                  |
| Valid OAuth Redirect URIs | `https://your-api-domain.com/api/auth/meta/callback` |

### 3.2 Required Permissions

Request these permissions in **App Review → Permissions and Features**:

| Permission                  | Purpose                         | Review Required |
| --------------------------- | ------------------------------- | --------------- |
| `pages_show_list`           | List user's pages               | No              |
| `pages_read_engagement`     | Read page info                  | No              |
| `pages_manage_metadata`     | Subscribe to webhooks           | Yes             |
| `pages_messaging`           | Send/receive Messenger messages | Yes             |
| `instagram_basic`           | Access Instagram account        | Yes             |
| `instagram_manage_messages` | Send/receive Instagram DMs      | Yes             |
| `leads_retrieval`           | Access lead form data           | Yes             |
| `ads_read`                  | Read ad campaign info for leads | Yes             |

**Note**: Permissions marked "Yes" require App Review for production use.

---

## 4. Webhook Configuration

### 4.1 Set Up Webhook Endpoint

1. Go to **Webhooks** in your Meta App
2. Click **Edit Callback URL**
3. Enter:
   - **Callback URL**: `https://your-api-domain.com/api/webhooks/meta`
   - **Verify Token**: Same value as `META_WEBHOOK_VERIFY_TOKEN` in your `.env`
4. Click **Verify and Save**

### 4.2 Subscribe to Page Events

Find "Page" in the webhooks list and subscribe to:

| Field                 | Description                 |
| --------------------- | --------------------------- |
| `messages`            | Incoming Messenger messages |
| `messaging_postbacks` | Button/quick reply clicks   |
| `leadgen`             | New lead form submissions   |

### 4.3 Subscribe to Instagram Events

Find "Instagram" in the webhooks list and subscribe to:

| Field      | Description            |
| ---------- | ---------------------- |
| `messages` | Incoming Instagram DMs |

### 4.4 Link Your Facebook Page

1. Go to **Messenger → Settings** in your Meta App
2. Under "Webhooks", click **Add or Remove Pages**
3. Select your Facebook Page
4. Grant the requested permissions

---

## 5. Messenger Platform Settings

Go to **Messenger → Settings**:

### 5.1 Webhook Subscriptions

Ensure your page is subscribed to:

- ✅ messages
- ✅ messaging_postbacks

### 5.2 Built-in NLP (Optional)

Enable if you want Meta's built-in NLP for message analysis.

---

## 6. Instagram Configuration

### 6.1 Link Instagram to Facebook Page

1. Go to your Facebook Page settings
2. Navigate to **Instagram** section
3. Connect your Instagram Business/Creator account

### 6.2 Instagram Messaging Settings

In Meta Developer Console → **Instagram → Settings**:

- Ensure messaging is enabled
- Webhook subscriptions active

---

## 7. Lead Ads Configuration

### 7.1 Create a Lead Form

1. Go to Facebook Ads Manager
2. Create a campaign with "Lead Generation" objective
3. Create a lead form with your desired fields

### 7.2 Test Lead Delivery

1. Go to **Publishing Tools** on your Facebook Page
2. Find **Forms Library**
3. Select your form → **Test** → **Create Test Lead**

---

## 8. Verification Checklist

### Environment Variables

- [ ] `FACEBOOK_CLIENT_ID` set
- [ ] `FACEBOOK_CLIENT_SECRET` set
- [ ] `META_WEBHOOK_VERIFY_TOKEN` set

### Meta App Settings

- [ ] App domains configured
- [ ] Privacy policy URL set
- [ ] OAuth redirect URI configured

### Permissions

- [ ] `pages_show_list` granted
- [ ] `pages_read_engagement` granted
- [ ] `pages_manage_metadata` approved
- [ ] `pages_messaging` approved
- [ ] `instagram_basic` approved
- [ ] `instagram_manage_messages` approved
- [ ] `leads_retrieval` approved

### Webhooks

- [ ] Callback URL verified
- [ ] Page `messages` subscribed
- [ ] Page `messaging_postbacks` subscribed
- [ ] Page `leadgen` subscribed
- [ ] Instagram `messages` subscribed
- [ ] Facebook Page linked

### Testing

- [ ] OAuth flow works (can connect in app)
- [ ] Test lead received in app
- [ ] Test Messenger message received
- [ ] Test Instagram DM received
- [ ] Can reply to conversations

---

## 9. Troubleshooting

### OAuth Fails

**Error**: "Invalid redirect URI"

- Ensure `Valid OAuth Redirect URIs` in Facebook Login settings matches exactly: `https://your-domain.com/api/auth/meta/callback`

**Error**: "App not set up"

- Complete App Review for required permissions
- Ensure app is in "Live" mode (not Development)

### Webhooks Not Received

1. Check webhook verification succeeded (look for `[meta-webhook] Verification successful` in logs)
2. Verify the page is subscribed to webhook fields
3. Check your server is publicly accessible (not localhost)
4. Review Meta's webhook delivery logs in Developer Console

### Messages Can't Be Sent

**Error**: "Message sent outside allowed window"

- The 7-day messaging window has expired
- User must message you first to reopen the window

**Error**: "User cannot receive messages"

- User may have blocked your page
- User's privacy settings may prevent messages

### Leads Not Appearing

1. Verify `leadgen` webhook is subscribed
2. Check page is linked to the Meta App
3. Ensure `leads_retrieval` permission is approved
4. Try "Sync Leads" button to pull historical leads

---

## 10. Production Checklist

Before going live:

- [ ] Submit app for App Review with all required permissions
- [ ] Set app to "Live" mode
- [ ] Configure production webhook URL (HTTPS required)
- [ ] Set up error monitoring for webhook handler
- [ ] Test all features end-to-end
- [ ] Configure AI auto-response settings per page
- [ ] Set up notification email for handoffs

---

## API Reference

### Webhook Endpoint

```
GET  /api/webhooks/meta  - Verification challenge
POST /api/webhooks/meta  - Event delivery
```

### OAuth Callback

```
GET /api/auth/meta/callback?code=xxx&state=xxx
```

### Required Headers (Webhooks)

| Header                | Description                     |
| --------------------- | ------------------------------- |
| `X-Hub-Signature-256` | HMAC signature for verification |

---

## Support Links

- [Meta Developer Documentation](https://developers.facebook.com/docs/)
- [Messenger Platform](https://developers.facebook.com/docs/messenger-platform/)
- [Instagram Messaging API](https://developers.facebook.com/docs/instagram-api/guides/messaging)
- [Lead Ads API](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/)
- [Webhooks Reference](https://developers.facebook.com/docs/graph-api/webhooks/)
- [Message Tags](https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags)
