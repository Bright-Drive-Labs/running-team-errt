# Audit Logs - Quick Reference Guide

## For Backend Developers (Agent 4)

### Insert an Audit Log

```javascript
// Using Supabase client
const { data, error } = await supabase.rpc('log_action', {
  p_tenant_id: teamId,           // UUID of the team
  p_action: 'WORKOUT_PUSHED',    // What happened
  p_entity_type: 'workout',      // What object changed
  p_entity_id: workoutId,        // Which object
  p_actor_id: 'telegram:123456', // Who did it
  p_actor_type: 'TELEGRAM_BOT',  // How did they do it
  p_actor_name: 'Bot Handler',   // Readable name
  p_before_values: null,         // Optional: state before
  p_after_values: {              // Optional: state after
    name: '5x1km',
    status: 'published',
    distance_km: 5,
    repetitions: 5
  },
  p_status: 'SUCCESS',           // Outcome
  p_error_message: null          // Only if FAILED
});

if (error) {
  console.error('Failed to log action:', error.message);
} else {
  console.log('Action logged with ID:', data);
}
```

### Common Action Types

```javascript
// Authentication
log_action(..., 'ATHLETE_LOGIN', 'athlete', athleteId, ..., 'SUCCESS')
log_action(..., 'ATHLETE_LOGIN', 'athlete', athleteId, ..., 'FAILED', 'Invalid password')

// Workouts
log_action(..., 'WORKOUT_CREATED', 'workout', workoutId, ...)
log_action(..., 'WORKOUT_PUSHED', 'workout', workoutId, ...)
log_action(..., 'WORKOUT_DELETED', 'workout', workoutId, ...)

// API Keys
log_action(..., 'API_KEY_CREATED', 'api_key', keyId, ...)
log_action(..., 'API_KEY_REVOKED', 'api_key', keyId, ...)

// Team/Admin
log_action(..., 'ATHLETE_INVITED', 'athlete', athleteId, ...)
log_action(..., 'ATHLETE_REMOVED', 'athlete', athleteId, ...)
log_action(..., 'TEAM_SETTINGS_UPDATED', 'team', teamId, ...)

// Integrations
log_action(..., 'GARMIN_SYNC', 'integration', athleteId, ...)
log_action(..., 'INTERVALS_SYNC', 'integration', athleteId, ...)
```

### Actor Types

```javascript
'TELEGRAM_BOT'  // From Telegram bot integration
'FRONTEND'      // From web frontend
'MOBILE_APP'    // From mobile app
'API'           // From external API call
'SYSTEM'        // Automated process
'ADMIN'         // Manual admin action
'WEBHOOK'       // From webhook trigger
```

### Status Values

```javascript
'SUCCESS'   // Action completed successfully
'FAILED'    // Action failed (include error_message)
'DENIED'    // Action was denied/rejected
'ROLLED_BACK' // Action was undone
```

---

## For Frontend Developers (Agent 5)

### Query Audit Logs (Coach Dashboard)

```javascript
// Get recent actions for current team
const { data: logs } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('tenant_id', currentTeamId)
  .order('created_at', { ascending: false })
  .limit(50);

// RLS automatically filters to user's team!
```

### Filter by Status (Error Tracking)

```javascript
// Find all failed actions
const { data: failures } = await supabase
  .from('audit_logs')
  .select('action, error_message, created_at')
  .eq('tenant_id', currentTeamId)
  .eq('status', 'FAILED')
  .order('created_at', { ascending: false })
  .limit(100);
```

### Track Specific Actions

```javascript
// All workout pushes this week
const { data: workoutLogs } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('tenant_id', currentTeamId)
  .eq('action', 'WORKOUT_PUSHED')
  .gte('created_at', oneWeekAgo)
  .order('created_at', { ascending: false });
```

### Track Changes to Specific Resource

```javascript
// All changes to a specific athlete
const { data: athleteHistory } = await supabase
  .from('audit_logs')
  .select('action, actor_name, before_values, after_values, created_at')
  .eq('tenant_id', currentTeamId)
  .eq('entity_type', 'athlete')
  .eq('entity_id', athleteId)
  .order('created_at', { ascending: false });
```

### Track Specific User Actions

```javascript
// All actions by a specific actor
const { data: userActions } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('tenant_id', currentTeamId)
  .eq('actor_id', 'telegram:123456')
  .order('created_at', { ascending: false });
```

### Display Audit Trail Component

```javascript
// React example
function AuditTrailComponent({ teamId }) {
  const [logs, setLogs] = React.useState([]);

  React.useEffect(() => {
    supabase
      .from('audit_logs')
      .select('*')
      .eq('tenant_id', teamId)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => setLogs(data));
  }, [teamId]);

  return (
    <div className="audit-trail">
      {logs.map(log => (
        <div key={log.id} className="log-entry">
          <span className="timestamp">{log.created_at}</span>
          <span className="actor">{log.actor_name}</span>
          <span className="action">{log.action}</span>
          <span className={`status ${log.status.toLowerCase()}`}>
            {log.status}
          </span>
          {log.error_message && (
            <span className="error">{log.error_message}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Column Reference

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique log identifier |
| `action` | VARCHAR(50) | What happened (WORKOUT_PUSHED, etc) |
| `entity_type` | VARCHAR(50) | Type of object affected |
| `entity_id` | UUID | ID of affected object |
| `actor_id` | VARCHAR(100) | Who performed action (telegram:123, user:456) |
| `actor_type` | VARCHAR(50) | Category (TELEGRAM_BOT, FRONTEND, API, etc) |
| `actor_name` | VARCHAR(150) | Human readable (Daniel Pérez, Mobile App) |
| `created_at` | TIMESTAMP | When action occurred (UTC) |
| `before_values` | JSONB | State before action (optional) |
| `after_values` | JSONB | State after action (optional) |
| `status` | VARCHAR(20) | SUCCESS, FAILED, DENIED |
| `error_message` | TEXT | Error details if status=FAILED |
| `tenant_id` | UUID | Which team (for RLS isolation) |

---

## RLS Security (How It Works)

```sql
-- User can ONLY see logs from their own team
-- This is enforced automatically by RLS

-- Coach from ERRT team:
SELECT * FROM audit_logs;
-- Result: Only logs where tenant_id = ERRT_team_id

-- Coach from runners58 team:
SELECT * FROM audit_logs;
-- Result: Only logs where tenant_id = runners58_team_id

-- No manual filtering needed - it's automatic!
```

---

## Performance Tips

### Good Queries (Use Indexes)
```javascript
// These queries are fast (use indexes)
const { data } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('tenant_id', teamId)                              // ✓ Index: idx_audit_tenant
  .order('created_at', { ascending: false });           // ✓ Index: idx_audit_timestamp

const { data } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('tenant_id', teamId)                              // ✓ Combined index
  .eq('action', 'WORKOUT_PUSHED')                       // ✓
  .gte('created_at', oneWeekAgo)
  .limit(50);
```

### Avoid These (Slow Queries)
```javascript
// These don't use indexes efficiently - avoid!

// Missing tenant_id filter (RLS will handle, but less efficient)
const { data } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('actor_id', 'telegram:123456');     // ✗ No tenant filter

// Complex JSONB queries (slow without expression indexes)
const { data } = await supabase
  .from('audit_logs')
  .select('*')
  .containedBy('after_values', { status: 'published' }); // ✗ Slow
```

---

## Common Use Cases

### 1. Coach Dashboard - Recent Team Activity
```javascript
await supabase
  .from('audit_logs')
  .select('action, actor_name, created_at, status')
  .eq('tenant_id', teamId)
  .order('created_at', { ascending: false })
  .limit(10);
```

### 2. Security Audit - Login Failures
```javascript
await supabase
  .from('audit_logs')
  .select('actor_id, actor_name, created_at, error_message')
  .eq('tenant_id', teamId)
  .eq('action', 'ATHLETE_LOGIN')
  .eq('status', 'FAILED')
  .gte('created_at', thirtyDaysAgo);
```

### 3. Data Governance - All Changes to an Athlete
```javascript
await supabase
  .from('audit_logs')
  .select('action, actor_name, before_values, after_values, created_at')
  .eq('tenant_id', teamId)
  .eq('entity_id', athleteId)
  .order('created_at', { ascending: false });
```

### 4. Integration Monitoring - Sync Logs
```javascript
await supabase
  .from('audit_logs')
  .select('action, status, error_message, created_at')
  .eq('tenant_id', teamId)
  .in('action', ['GARMIN_SYNC', 'INTERVALS_SYNC'])
  .gte('created_at', oneDayAgo)
  .order('created_at', { ascending: false });
```

### 5. API Audit - External Access
```javascript
await supabase
  .from('audit_logs')
  .select('*')
  .eq('tenant_id', teamId)
  .eq('actor_type', 'API')
  .gte('created_at', thirtyDaysAgo);
```

---

## Troubleshooting

### "0 rows returned" when querying
**Cause**: User is not associated with that tenant
**Fix**: Verify athlete's `tenant_id` matches

### "Permission denied" when querying
**Cause**: RLS policy preventing access
**Fix**: Ensure you're authenticated and have athlete record

### "Invalid tenant_id" error on insert
**Cause**: team_id doesn't exist in teams table
**Fix**: Create team first with log_action()

### Slow query performance
**Cause**: Missing tenant_id filter
**Fix**: Always filter by tenant_id first

---

## API Reference

### log_action() Function Signature

```sql
SELECT log_action(
  p_tenant_id UUID,              -- Team UUID (required)
  p_action VARCHAR,              -- Action name (required)
  p_entity_type VARCHAR,         -- Entity type (required)
  p_entity_id UUID DEFAULT NULL,             -- Which entity (optional)
  p_actor_id VARCHAR DEFAULT 'SYSTEM',       -- Who did it (optional)
  p_actor_type VARCHAR DEFAULT 'SYSTEM',     -- How (optional)
  p_actor_name VARCHAR DEFAULT 'System',     -- Name (optional)
  p_before_values JSONB DEFAULT NULL,        -- Before state (optional)
  p_after_values JSONB DEFAULT NULL,         -- After state (optional)
  p_status VARCHAR DEFAULT 'SUCCESS',        -- Outcome (optional)
  p_error_message TEXT DEFAULT NULL          -- Error (optional)
) RETURNS UUID;
```

**Returns**: UUID of the created audit log entry

**Raises**: EXCEPTION if tenant_id invalid or required params missing

---

## Related Files

- `supabase_audit_logs_setup.sql` - Complete schema
- `AUDIT_LOGS_DEPLOYMENT.md` - Deployment guide
- `scripts/deploy_audit_logs.js` - Deployment helper
