# Instagram Messaging API Requirements

## Prerequisites

1. **Instagram Business or Creator Account** - Personal accounts are not supported
2. **Facebook Page linked to Instagram** - The Instagram account must be connected to a Facebook Page
3. **Meta App with Instagram Messaging product** - Not the same as basic Instagram API

## Setup Steps

### 1. Enable Instagram Messaging Product

1. Go to [Meta Developer Console](https://developers.facebook.com/apps)
2. Select your app
3. Click **Add Products** in the left sidebar
4. Find **Instagram Messaging** and click **Set Up**

### 2. Configure Webhooks

Subscribe to these webhook fields:

- `messages` - Receive incoming DMs
- `messaging_postbacks` - Button clicks in messages

Use the same webhook URL as your Facebook Messenger webhooks.

### 3. Request Permission

**Development Mode**: Add test users in App Roles > Roles > Add Instagram Testers

**Live Mode**: Submit for App Review with:

- `instagram_basic`
- `instagram_manage_messages`

## Common Errors

| Error                                                            | Cause                                   | Solution                                                  |
| ---------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| `Application does not have the capability to make this API call` | Instagram Messaging product not enabled | Add Instagram Messaging product in Meta Developer Console |
| `Invalid OAuth access token`                                     | Token lacks required scopes             | Re-authenticate with `instagram_manage_messages` scope    |
| `User not authorized`                                            | Instagram account not a tester          | Add account as Instagram Tester in App Roles              |

## API Endpoint

Instagram conversations use the Instagram account ID, not the Page ID:

```
GET /{instagram-account-id}/conversations?platform=instagram
```

## References

- [Instagram Messaging API Docs](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api)
- [App Review for Instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login)
