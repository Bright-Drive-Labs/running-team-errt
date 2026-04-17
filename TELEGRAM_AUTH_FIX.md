# 🔧 Telegram Bot Authorization Fix

## Problem Identified

The Telegram bot was rejecting authorization even though the user's `telegram_user_id` (7481658837) was in the database with `is_admin=true`.

**Root Cause:** Multiple coaches in the database shared the same `telegram_user_id`:
- Daniel Perez (dpinfosys@gmail.com) ✓
- Daniela Herrera (danielahea@gmail.com) ✓
- Daniel Colmenares (dcolmenares723@gmail.com) ✓

The query used `.single()` which throws an error when multiple rows match:
```typescript
.eq('telegram_user_id', telegramUserId)
.eq('is_admin', true)
.single()  // ❌ ERROR when multiple rows found!
```

## Solution Applied

### Changes Made:

**1. src/handlers/telegramBot.ts (Middleware)**
- ✅ Removed `.single()` from the query
- ✅ Changed to fetch all matching coaches
- ✅ Use the first matching coach (handles multiple users per telegram_id)
- ✅ Added detailed logging to show:
  - How many coaches matched the telegram_user_id
  - Which coach was selected
  - Database errors (if any)

**2. src/handlers/fastifyTelegramEndpoints.ts (Diagnostic Endpoint)**
- ✅ Added `/api/telegram/debug-auth?telegram_id=XXXXX` endpoint
- ✅ Shows all matches, not just exact count
- ✅ Indicates when multiple coaches share the same telegram_id
- ✅ Helps diagnose authorization issues

### Enhanced Logging

When a message is sent to the bot, you'll see console logs like:
```
[TELEGRAM AUTH] Attempting to authorize user ID: 7481658837
[TELEGRAM AUTH] Query result: {
  found: true,
  matches: 3,
  coaches: [
    { id: 'e9718fd8...', name: 'Daniel Perez', email: '...' },
    { id: '6150790a...', name: 'Daniela Herrera', email: '...' },
    { id: '3cb3018f...', name: 'Daniel Colmenares', email: '...' }
  ],
  error: null
}
[TELEGRAM AUTH] ✅ Authorized: Daniel Perez (e9718fd8-3277-44be-bd13-20b8b9ca39ec)
```

## How to Test

### 1. Kill all running servers
```bash
# In a PowerShell terminal:
Get-Process node | Stop-Process -Force
```

### 2. Restart the server
```bash
npm run server
```

You should see:
```
✓ Loaded .env
Middleware registered: JWT, CORS
🤖 Telegram Bot initialized
Server listening at http://0.0.0.0:3000
✅ Telegram Webhook configured: https://...
```

### 3. Send a message to the Telegram bot
Message any command like `/start` to the bot

### 4. Check the console logs
Look for `[TELEGRAM AUTH]` messages showing:
- ✅ If authorization succeeded
- ❌ If it failed (with detailed error)
- The number of coaches that matched
- Which coach was selected

### 5. Test the diagnostic endpoint (optional)
```bash
curl "http://localhost:3000/api/telegram/debug-auth?telegram_id=7481658837"
```

This will show:
- All rows matching the telegram_user_id
- All rows matching with is_admin=true
- Sample of all coaches in the system

## Result

**Before:** Bot rejected all messages because `.single()` threw an error
**After:** Bot accepts the message and processes it, using Daniel Perez (the first match)

If you want a different coach to be selected, you have two options:
1. Delete the other coaches from the database
2. Filter by another field (like tenant_id or email) to make the query unique
