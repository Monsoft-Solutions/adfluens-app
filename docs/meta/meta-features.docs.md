# Meta Integration - Features Overview

This document describes the Meta (Facebook/Instagram) integration features available in the platform.

## Overview

The Meta integration enables businesses to:

- Connect Facebook Pages and Instagram Business accounts
- Receive and respond to Messenger and Instagram DMs
- Capture leads from Facebook Lead Ads
- Use AI-powered auto-responses for conversations

---

## Features

### 1. OAuth Connection

Connect your Meta account via OAuth 2.0 flow:

- Secure token exchange with long-lived tokens (~60 days)
- Automatic token refresh before expiration
- Multi-page selection during setup
- Instagram Business account detection

**Location**: Settings → Meta → Connect

### 2. Page Management

Manage connected Facebook Pages:

- View all connected pages with status
- Enable/disable Messenger auto-replies per page
- Enable/disable Instagram DM auto-replies per page
- View page details (category, followers, profile picture)

**Toggles**:
| Toggle | Description |
|--------|-------------|
| Messenger | Enable AI auto-replies for Facebook Messenger |
| Instagram | Enable AI auto-replies for Instagram DMs |

### 3. Lead Management

Capture and manage leads from Facebook Lead Ads:

- Real-time lead capture via webhooks
- Historical lead sync from Meta
- Lead details: name, email, phone, form data
- Lead status tracking: New → Contacted → Qualified → Converted/Lost
- Campaign and ad attribution

**Sync**: Click "Sync Leads" to pull historical leads from all lead forms.

### 4. Conversation Management

View and respond to Messenger and Instagram conversations:

- Real-time message delivery via webhooks
- Historical conversation sync
- View last 10 messages per conversation
- Send replies (within 7-day window using HUMAN_AGENT tag)
- Platform indicator (Messenger vs Instagram)
- AI-enabled badge per conversation

**Messaging Window**: Meta allows replies within 7 days of the user's last message (using HUMAN_AGENT tag).

### 5. AI Auto-Responses

Automated AI-powered responses for incoming messages:

- Configurable per page
- Personality settings (tone, response length, emoji usage)
- Custom instructions support
- Business hours awareness
- Handoff keywords for human escalation
- Organization context integration

**AI Configuration** (per page):
| Setting | Options |
|---------|---------|
| Tone | Professional, Friendly, Casual, Formal |
| Response Length | Concise, Detailed, Auto |
| Use Emojis | Yes/No |
| Temperature | 0.0 - 1.0 (creativity level) |

### 6. Handoff System

Automatic escalation to human agents:

- Configurable handoff keywords
- Email notifications on handoff
- "Needs Attention" flag on conversations
- Handoff reason tracking

### 7. Notifications

In-app notifications for:

- New leads received
- Handoff requests
- Unread notification count
- Mark as read functionality

---

## Database Schema

### Tables

| Table                      | Purpose                           |
| -------------------------- | --------------------------------- |
| `meta_connection`          | OAuth connection per organization |
| `meta_page`                | Connected Facebook Pages          |
| `meta_lead`                | Captured leads from Lead Ads      |
| `meta_conversation`        | Messenger/Instagram conversations |
| `meta_conversation_config` | AI configuration per page         |
| `meta_notification`        | In-app notifications              |

### Key Relationships

```
Organization
    └── MetaConnection (1:1)
            └── MetaPage (1:many)
                    ├── MetaLead (1:many)
                    ├── MetaConversation (1:many)
                    └── MetaConversationConfig (1:1)
```

---

## API Endpoints

### tRPC Router: `meta.*`

**Connection**:

- `getConnection` - Get connection status and pages
- `getOAuthUrl` - Generate OAuth URL
- `listAvailablePages` - List pages after OAuth
- `selectPages` - Complete connection with selected pages
- `disconnect` - Remove Meta connection
- `updatePage` - Update page settings (toggles)

**Sync**:

- `syncLeads` - Sync historical leads from Meta
- `syncConversations` - Sync historical conversations

**Leads**:

- `listLeads` - List leads with filters
- `getLead` - Get single lead details
- `updateLeadStatus` - Update lead status/notes

**Conversations**:

- `listConversations` - List conversations with filters
- `getConversation` - Get conversation with messages
- `sendMessage` - Send reply to conversation
- `toggleConversationAi` - Toggle AI for conversation

**AI Config**:

- `getConversationConfig` - Get AI settings for page
- `updateConversationConfig` - Update AI settings
- `testAiResponse` - Test AI response generation

**Notifications**:

- `listNotifications` - Get notifications
- `getUnreadCount` - Get unread count
- `markNotificationRead` - Mark as read
- `markAllRead` - Mark all as read

---

## Webhooks

Real-time events received at `/api/webhooks/meta`:

| Event                 | Source    | Handler                                   |
| --------------------- | --------- | ----------------------------------------- |
| `messages`            | Messenger | Creates/updates conversation, triggers AI |
| `messaging_postbacks` | Messenger | Handles button clicks                     |
| `leadgen`             | Lead Ads  | Creates lead, sends notification          |
| `messages`            | Instagram | Creates/updates conversation, triggers AI |

---

## Frontend Components

Located in `apps/web/src/features/meta/`:

| Component                                | Purpose                          |
| ---------------------------------------- | -------------------------------- |
| `meta.view.tsx`                          | Main view with tabs              |
| `meta-not-connected.component.tsx`       | Connection prompt                |
| `meta-page-selector.component.tsx`       | Page selection modal             |
| `meta-pages-list.component.tsx`          | Connected pages with toggles     |
| `meta-leads-list.component.tsx`          | Leads list view                  |
| `meta-conversations-list.component.tsx`  | Conversations list               |
| `meta-conversation-detail.component.tsx` | Conversation modal with messages |

---

## Limitations

1. **Message Storage**: Only last 10 messages cached per conversation (optimized for AI context)
2. **Messaging Window**: 7-day limit to reply (Meta platform policy)
3. **Token Expiration**: Long-lived tokens expire after ~60 days (auto-refresh implemented)
4. **Webhook Delivery**: Meta may retry failed webhook deliveries
5. **AI Responses**: Requires AI configuration to be enabled per page
