# Security Fixes Completed ✅

## Database Layer (RLS - Row Level Security)

### ✅ RLS Policies Implemented on 4 Critical Tables

1. **athletes** - Users see/update only their own profile within tenant
   - Policy: `athletes_select_own_tenant` - SELECT access filtered by tenant
   - Policy: `athletes_update_own_record` - UPDATE only own record or if admin

2. **workout_assignments** - Coaches see/manage only athletes in their tenant
   - Policy: `workout_assignments_select_own_tenant`
   - Policy: `workout_assignments_update_own_tenant`

3. **events** - Events visible only within tenant
   - Policy: `events_select_own_tenant`
   - Policy: `events_insert_own_tenant`
   - Policy: `events_update_own_tenant`

4. **event_registrations** - Registrations visible only within tenant
   - Policy: `event_registrations_select_own_tenant`
   - Policy: `event_registrations_insert_own_tenant`
   - Policy: `event_registrations_update_own_tenant`

**Status**: ✅ All RLS policies executed and verified (rowsecurity = true on all tables)

---

## Frontend Layer (Tenant Filtering)

### ✅ AthletePortal.jsx - Coach View Fixed

**File**: `src/pages/AthletePortal.jsx`

**Before** (VULNERABLE):
```javascript
const fetchCoachData = async () => {
  const { data } = await supabase.from('athletes').select('*').order('first_name');
  if (data) setAllAthletes(data);
};
```
👉 **Problem**: Fetches ALL athletes from ALL tenants

**After** (SECURE):
```javascript
const fetchCoachData = async () => {
  if (!athlete?.tenant_id) return; // Security check
  const { data } = await supabase
    .from('athletes')
    .select('*')
    .eq('tenant_id', athlete.tenant_id) // ← TENANT FILTERING
    .order('first_name');
  if (data) setAllAthletes(data);
};
```
👉 **Fix**: Only fetches athletes within coach's tenant

**Status**: ✅ COMPLETED

---

## Backend Layer (5 Security Fixes)

### 1️⃣ JWT Secret Management ✅

**File**: `src/server.ts` (lines 35-42)

**Before** (VULNERABLE):
```javascript
await fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
});
```
👉 **Problem**: Default hardcoded secret used if env var missing

**After** (SECURE):
```javascript
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('CRITICAL: JWT_SECRET must be defined in environment variables.');
}

await fastify.register(fastifyJwt, {
  secret: jwtSecret
});
```
👉 **Fix**: Server refuses to start without proper JWT_SECRET

**Status**: ✅ COMPLETED

---

### 2️⃣ CORS Security ✅

**File**: `src/server.ts` (lines 44-53)

**Before** (VULNERABLE):
```javascript
await fastify.register(fastifyCors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
});
```
👉 **Problem**: Wildcard CORS allows requests from any origin

**After** (SECURE):
```javascript
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
if (corsOrigin === '*') {
  console.warn('⚠️  WARNING: CORS_ORIGIN is set to wildcard. Only safe in development.');
}

await fastify.register(fastifyCors, {
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
});
```
👉 **Fix**: Restricts CORS to configured origin only

**Status**: ✅ COMPLETED

---

### 3️⃣ Password Hashing with Bcrypt ✅

**File**: `src/server.ts` (lines 1 + 130-142)

**Before** (VULNERABLE):
```javascript
if (user.password_hash !== password) {
  // Failed login...
}
```
👉 **Problem**: Plaintext password comparison

**After** (SECURE):
```javascript
import bcrypt from 'bcrypt';

// ... in /auth/login endpoint:
const passwordMatch = await bcrypt.compare(password, user.password_hash);
if (!passwordMatch) {
  // Failed login...
}
```
👉 **Fix**: Uses bcrypt for secure password verification

**Status**: ✅ COMPLETED
**Action Required**: Install bcrypt: `npm install bcrypt`

---

### 4️⃣ Telegram HMAC Validation ✅

**File**: `src/middleware/validateTelegramUser.ts` (lines 27-71)

**Before** (VULNERABLE):
```javascript
// HMAC validation code was COMMENTED OUT
const signature = request.headers['x-telegram-signature'] as string;
// const hash = crypto.createHmac(...) // ← DISABLED
// if (hash !== signature) { ... } // ← DISABLED
```
👉 **Problem**: No signature validation, header can be spoofed

**After** (SECURE):
```javascript
// TELEGRAM BOT TOKEN required
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
if (!telegramBotToken) {
  throw new Error('CRITICAL: TELEGRAM_BOT_TOKEN not set');
}

// Require signature header
const signature = request.headers['x-telegram-signature'];
if (!signature) {
  return reply.status(401).send({
    error: 'Missing X-Telegram-Signature header'
  });
}

// Validate HMAC signature
const hash = crypto
  .createHmac('sha256', telegramBotToken)
  .update(JSON.stringify(body))
  .digest('hex');

if (hash !== signature) {
  return reply.status(401).send({
    error: 'Invalid Telegram signature'
  });
}
```
👉 **Fix**: Requires and validates HMAC signature for all Telegram requests

**Status**: ✅ COMPLETED
**Action Required**: Set `TELEGRAM_BOT_TOKEN` in .env

---

### 5️⃣ Rate Limiting on /auth/login ✅

**File**: `src/middleware/rateLimiter.ts` (NEW FILE)
**File**: `src/server.ts` (lines 11 + 96-110)

**New Middleware Created**:
```typescript
// src/middleware/rateLimiter.ts
export function isRateLimited(identifier: string, config?: RateLimitConfig): boolean
export function getRemaining(identifier: string, config?: RateLimitConfig): number
export function getResetTime(identifier: string): number

// Default: 5 attempts per 15 minutes per IP
```

**Before** (VULNERABLE):
```javascript
// No rate limiting - infinite brute force attempts possible
```

**After** (SECURE):
```javascript
import { isRateLimited, getRemaining, getResetTime } from './middleware/rateLimiter';

// In /auth/login endpoint:
if (isRateLimited(clientIp)) {
  const resetTime = getResetTime(clientIp);
  return reply.status(429).header('Retry-After', ...).send({
    error: 'Too many login attempts. Please try again later.',
    code: 'RATE_LIMITED',
    remainingAttempts: getRemaining(clientIp),
    resetTime: new Date(resetTime).toISOString()
  });
}
```
👉 **Fix**: Limits login attempts to 5 per 15 minutes per IP address

**Status**: ✅ COMPLETED

---

## Environment Variables Required

**File**: `.env.example` (CREATED)

All security fixes require these environment variables:

```bash
# CRITICAL - Never use defaults
JWT_SECRET=<generate-with-crypto.randomBytes(32).toString('hex')>
TELEGRAM_BOT_TOKEN=<your-bot-token-from-@BotFather>

# Set to your frontend domain (NOT wildcard in production)
CORS_ORIGIN=http://localhost:5173

# Supabase
SUPABASE_URL=<your-url>
SUPABASE_ANON_KEY=<your-key>
SUPABASE_SERVICE_ROLE_KEY=<your-key>
```

---

## NPM Dependencies to Install

```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

---

## Summary of Security Improvements

| Vulnerability | Severity | Status | Fix |
|---------------|----------|--------|-----|
| Frontend fetches all athletes (cross-tenant leak) | CRITICAL | ✅ | Tenant filtering in fetchCoachData() |
| RLS missing on critical tables | CRITICAL | ✅ | 4 tables with RLS policies enabled |
| Hardcoded JWT secret | CRITICAL | ✅ | Env var required, server refuses to start without it |
| Wildcard CORS | CRITICAL | ✅ | Restricted to CORS_ORIGIN env var |
| Plaintext password comparison | CRITICAL | ✅ | Bcrypt password verification |
| Telegram header spoofing (no HMAC) | CRITICAL | ✅ | HMAC signature validation enabled |
| No rate limiting (brute force) | HIGH | ✅ | 5 attempts per 15 minutes per IP |

---

## Next Steps

1. **Install dependencies**: `npm install bcrypt`
2. **Generate JWT Secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. **Copy .env.example to .env** and fill in:
   - JWT_SECRET
   - TELEGRAM_BOT_TOKEN
   - CORS_ORIGIN
   - SUPABASE credentials

4. **Test security fixes**:
   - Frontend: Verify coach only sees their tenant's athletes
   - Backend: Verify rate limiting on /auth/login (try 6+ attempts)
   - Telegram: Verify signature validation works

5. **Run functional audit** (3 agents to verify all functionality still works)

---

## Files Modified

✅ `src/pages/AthletePortal.jsx` - Tenant filtering in coach view
✅ `src/server.ts` - JWT secret, CORS, password hashing, rate limiting
✅ `src/middleware/validateTelegramUser.ts` - HMAC signature validation
✅ `src/middleware/rateLimiter.ts` - NEW: Rate limiting middleware
✅ `.env.example` - NEW: Environment variables template

---

## Database Changes

✅ `athletes` - RLS enabled with 2 policies
✅ `workout_assignments` - RLS enabled with 2 policies
✅ `events` - RLS enabled with 3 policies
✅ `event_registrations` - RLS enabled with 3 policies

Total: **10 new RLS policies** protecting critical data tables
