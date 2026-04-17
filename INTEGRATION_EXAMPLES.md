# Integration Examples - Telegram Bot + Logging

Ejemplos prácticos de cómo integrar el sistema de Telegram Bot y Logging en tu aplicación.

## 1. Integración con Fastify Server

### Servidor Completo (server.ts)

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initTelegramBot, launchTelegramBot } from './handlers/telegramBot';
import registerTelegramEndpoints from './handlers/fastifyTelegramEndpoints';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        singleLine: false
      }
    }
  }
});

// Middleware
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
});

// Health check
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
}));

// Registrar endpoints de Telegram
await registerTelegramEndpoints(app);

// Iniciar Telegram Bot (opcional)
if (process.env.TELEGRAM_BOT_TOKEN) {
  try {
    const bot = initTelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    await launchTelegramBot(bot);
  } catch (err) {
    app.log.warn('Telegram Bot initialization failed (optional)', err);
  }
} else {
  app.log.warn('TELEGRAM_BOT_TOKEN not set - Bot disabled');
}

// Iniciar servidor
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start().catch(console.error);

export { app };
```

## 2. Usar Logging en Handlers Existentes

### En un endpoint existente

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { CoachRequest } from '../types/telegram';
import { logAction, logAthleteLogin } from '../utils/auditLog';

// Login endpoint
fastify.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = request.body as { email: string; password: string };

    // Tu lógica de autenticación aquí
    const athlete = await authenticate(email, password);
    
    if (!athlete) {
      // Log fallido attempt
      await logAthleteLogin({
        tenant_id: 'unknown',
        athlete_id: 'unknown',
        email,
        status: 'FAILED',
        error: 'Invalid credentials',
        ip_address: request.ip
      });

      return reply.status(401).send({
        error: 'Invalid credentials'
      });
    }

    // Log successful login
    await logAthleteLogin({
      tenant_id: athlete.tenant_id,
      athlete_id: athlete.id,
      email: athlete.email,
      status: 'SUCCESS',
      ip_address: request.ip
    });

    // Crear sesión y responder
    return reply.status(200).send({
      success: true,
      athlete: {
        id: athlete.id,
        name: athlete.name,
        email: athlete.email
      },
      token: generateToken(athlete)
    });

  } catch (err) {
    console.error('Login error:', err);
    return reply.status(500).send({
      error: 'Internal server error'
    });
  }
});
```

## 3. Logging en Data Sync (Garmin)

### Webhook para Garmin

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { logWebhookReceived, logAthleteDataSync } from '../utils/auditLog';
import { supabase } from '../lib/supabase';

fastify.post('/api/webhooks/garmin', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const payload = request.body as any;
    const athleteId = payload.athlete_id;
    const dataType = payload.data_type;

    // Log webhook reception
    await logWebhookReceived({
      tenant_id: payload.tenant_id,
      webhook_type: 'garmin_sync',
      athlete_id: athleteId,
      status: 'SUCCESS',
      payload_size: JSON.stringify(payload).length
    });

    // Procesar datos
    const records = payload.data || [];

    // Insertar datos en BD
    const { error: insertError, data: inserted } = await supabase
      .from('athlete_metrics')
      .insert(
        records.map((record: any) => ({
          athlete_id: athleteId,
          tenant_id: payload.tenant_id,
          data_type: dataType,
          value: record.value,
          timestamp: record.timestamp
        }))
      )
      .select();

    if (insertError) {
      // Log sync failure
      await logAthleteDataSync({
        tenant_id: payload.tenant_id,
        athlete_id: athleteId,
        data_type: dataType,
        record_count: records.length,
        status: 'FAILED',
        error: insertError.message
      });

      return reply.status(500).send({
        error: 'Failed to sync data'
      });
    }

    // Log successful sync
    await logAthleteDataSync({
      tenant_id: payload.tenant_id,
      athlete_id: athleteId,
      data_type: dataType,
      record_count: records.length,
      status: 'SUCCESS'
    });

    return reply.status(200).send({
      success: true,
      inserted_count: (inserted || []).length
    });

  } catch (err) {
    console.error('Garmin webhook error:', err);
    return reply.status(500).send({
      error: 'Internal server error'
    });
  }
});
```

## 4. En Código Frontend (React)

### Crear workout desde formulario

```typescript
import { logWorkoutPush } from '../utils/auditLog';

async function createWorkout(workoutData: WorkoutFormData) {
  try {
    // Obtener coach info desde contexto/store
    const coach = useCoachContext();
    const telegramUserId = await getTelegramUserIdFromBrowser();

    // Hacer request
    const response = await fetch('/api/telegram/workout', {
      method: 'POST',
      headers: {
        'X-Telegram-User-Id': telegramUserId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: workoutData.name,
        description: workoutData.description
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    // Si lo hicimos desde frontend, también podemos loguear
    // (aunque el backend ya lo hace)
    await logWorkoutPush({
      tenant_id: coach.tenant_id,
      actor_id: coach.id,
      actor_name: coach.name,
      workout_id: data.workout.id,
      workout_name: data.workout.name,
      status: 'SUCCESS'
    });

    return data.workout;

  } catch (err) {
    console.error('Failed to create workout:', err);
    throw err;
  }
}
```

## 5. Endpoint Personalizado con Logging

### Asignar entrenamiento a atletas

```typescript
import { requireTelegramAuth, CoachRequest } from '../middleware/validateTelegramUser';
import { logAction } from '../utils/auditLog';

fastify.post<{ Body: { workout_id: string; athlete_ids: string[] } }>(
  '/api/telegram/assign-workout',
  { preHandler: requireTelegramAuth() },
  async (request: CoachRequest, reply: FastifyReply) => {
    try {
      if (!request.coach || !request.tenant_id) {
        return reply.status(500).send({ error: 'Coach data not available' });
      }

      const { workout_id, athlete_ids } = request.body;

      if (!workout_id || !Array.isArray(athlete_ids) || athlete_ids.length === 0) {
        await logAction({
          tenant_id: request.tenant_id,
          action: 'COACH_COMMAND',
          entity_type: 'workout_assignment',
          actor_id: request.coach.id,
          actor_type: 'API',
          actor_name: request.coach.name,
          status: 'FAILED',
          error_message: 'Missing or invalid parameters'
        });

        return reply.status(400).send({
          error: 'Missing or invalid parameters'
        });
      }

      // Asignar entrenamiento a cada atleta
      const assignments = athlete_ids.map((athleteId) => ({
        athlete_id: athleteId,
        workout_id,
        tenant_id: request.tenant_id,
        assigned_by: request.coach!.id,
        assigned_at: new Date().toISOString()
      }));

      const { data: inserted, error } = await supabase
        .from('workout_assignments')
        .insert(assignments)
        .select();

      if (error) {
        await logAction({
          tenant_id: request.tenant_id,
          action: 'COACH_COMMAND',
          entity_type: 'workout_assignment',
          entity_id: workout_id,
          actor_id: request.coach.id,
          actor_type: 'API',
          actor_name: request.coach.name,
          status: 'FAILED',
          error_message: error.message
        });

        return reply.status(500).send({
          error: 'Failed to assign workout'
        });
      }

      // Log exitoso
      await logAction({
        tenant_id: request.tenant_id,
        action: 'COACH_COMMAND',
        entity_type: 'workout_assignment',
        entity_id: workout_id,
        actor_id: request.coach.id,
        actor_type: 'API',
        actor_name: request.coach.name,
        after_values: {
          assigned_to: athlete_ids,
          count: (inserted || []).length
        },
        status: 'SUCCESS'
      });

      return reply.status(200).send({
        success: true,
        assigned_count: (inserted || []).length
      });

    } catch (err) {
      console.error('Assign workout error:', err);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  }
);
```

## 6. Usar logAction con before/after Values

### Update de perfil de atleta

```typescript
import { logAction } from '../utils/auditLog';

fastify.patch<{ Body: Partial<Athlete> }>(
  '/api/athletes/:id',
  { preHandler: requireTelegramAuth() },
  async (request: CoachRequest, reply: FastifyReply) => {
    try {
      const athleteId = request.params.id as string;
      const updates = request.body;

      // Obtener valores actuales
      const { data: current } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', athleteId)
        .single();

      if (!current || current.tenant_id !== request.tenant_id) {
        return reply.status(404).send({ error: 'Athlete not found' });
      }

      // Actualizar
      const { data: updated, error } = await supabase
        .from('athletes')
        .update(updates)
        .eq('id', athleteId)
        .select()
        .single();

      if (error) {
        await logAction({
          tenant_id: request.tenant_id!,
          action: 'USER_UPDATED',
          entity_type: 'athlete',
          entity_id: athleteId,
          actor_id: request.coach!.id,
          actor_type: 'API',
          actor_name: request.coach!.name,
          before_values: {
            name: current.name,
            email: current.email
          },
          after_values: null,
          status: 'FAILED',
          error_message: error.message
        });

        return reply.status(500).send({ error: 'Update failed' });
      }

      // Log con before/after
      await logAction({
        tenant_id: request.tenant_id!,
        action: 'USER_UPDATED',
        entity_type: 'athlete',
        entity_id: athleteId,
        actor_id: request.coach!.id,
        actor_type: 'API',
        actor_name: request.coach!.name,
        before_values: {
          name: current.name,
          email: current.email,
          created_at: current.created_at
        },
        after_values: {
          name: updated?.name,
          email: updated?.email,
          updated_at: updated?.updated_at
        },
        status: 'SUCCESS'
      });

      return reply.status(200).send({
        success: true,
        athlete: updated
      });

    } catch (err) {
      console.error('Update athlete error:', err);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  }
);
```

## 7. Testing: Validar Logs

### SQL para inspeccionar logs

```sql
-- Ver logs de últimas 24 horas
SELECT 
  id,
  created_at,
  action,
  actor_name,
  status,
  tenant_id,
  entity_id
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Ver logs por coach
SELECT 
  action,
  status,
  COUNT(*) as count,
  MAX(created_at) as last_action
FROM audit_logs
WHERE actor_name = 'Coach Name'
GROUP BY action, status;

-- Ver logs fallidos
SELECT 
  action,
  actor_name,
  error_message,
  created_at
FROM audit_logs
WHERE status = 'FAILED'
ORDER BY created_at DESC;

-- Ver actividad por tenant
SELECT 
  tenant_id,
  action,
  COUNT(*) as count
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY tenant_id, action
ORDER BY count DESC;
```

## 8. Middleware Personalizado

### Middleware de rate limiting con logging

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { logAction } from '../utils/auditLog';
import { CoachRequest } from '../types/telegram';

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests
const TIME_WINDOW = 60 * 1000; // 1 minute

export async function rateLimitMiddleware(
  request: CoachRequest,
  reply: FastifyReply
) {
  const telegramUserId = request.headers['x-telegram-user-id'] as string;

  if (!telegramUserId) {
    return; // Permitir si no tiene header (será rechazado después)
  }

  const now = Date.now();
  const record = requestCounts.get(telegramUserId);

  if (!record || now > record.resetTime) {
    requestCounts.set(telegramUserId, {
      count: 1,
      resetTime: now + TIME_WINDOW
    });
  } else {
    record.count++;

    if (record.count > RATE_LIMIT) {
      // Log attempt
      if (request.coach) {
        await logAction({
          tenant_id: request.tenant_id || 'unknown',
          action: 'COACH_COMMAND',
          entity_type: 'rate_limit_exceeded',
          actor_id: request.coach.id,
          actor_type: 'API',
          actor_name: request.coach.name,
          status: 'DENIED',
          error_message: `Rate limit exceeded: ${record.count} requests`
        });
      }

      return reply.status(429).send({
        error: 'Rate limit exceeded',
        retry_after: Math.ceil((record.resetTime - now) / 1000)
      });
    }
  }
}
```

## 9. Monitoreo de Logs

### Dashboard Query (para monitoring)

```sql
-- Resumen diario
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
  COUNT(CASE WHEN status = 'DENIED' THEN 1 END) as denied,
  COUNT(DISTINCT actor_id) as unique_actors,
  COUNT(DISTINCT tenant_id) as unique_tenants
FROM audit_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Acciones más frecuentes
SELECT 
  action,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM audit_logs), 2) as percentage
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY count DESC;

-- Errores recientes
SELECT 
  created_at,
  action,
  actor_name,
  error_message,
  tenant_id
FROM audit_logs
WHERE status = 'FAILED'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## 10. Variables de Entorno Recomendadas

```bash
# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# CORS
CORS_ORIGIN=https://yourdomain.com

# Database (si es necesario)
DATABASE_URL=postgresql://user:password@host/database
```

---

## Resumen de Integración

1. **Middleware:** Valida Telegram ID en CADA request
2. **Logging:** Adjunta automáticamente logs a todas las acciones
3. **Multi-tenant:** Filtra por tenant_id en todas las queries
4. **Seguridad:** Valida permisos antes de procesar
5. **Error Handling:** Logging failures no rompen app

Todos estos ejemplos mantienen el patrón:
- Validar input
- Procesar acción
- Log before/after
- Responder con status HTTP apropiado
