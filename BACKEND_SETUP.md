# Backend Setup - Telegram Bot & Logging Integration

## Visión General

Este documento describe cómo integrar el Telegram Bot y el sistema de auditoría en tu servidor Fastify.

## Estructura de Archivos Creados

```
src/
├── lib/
│   └── supabase.ts                 # Cliente Supabase configurado
├── middleware/
│   └── validateTelegramUser.ts     # Middleware de validación Telegram
├── utils/
│   └── auditLog.ts                 # Sistema de logging de auditoría
└── handlers/
    ├── telegramBot.ts              # Telegram Bot con comandos
    └── fastifyTelegramEndpoints.ts # Endpoints REST para Telegram
```

## Instalación de Dependencias

Primero, instala las dependencias necesarias:

```bash
npm install fastify telegraf @supabase/supabase-js
npm install --save-dev @types/fastify @types/node typescript
```

## Configuración de Variables de Entorno

Crea un archivo `.env.local` o actualiza tu `.env`:

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# O alternativamente (para servidor backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Base de datos (si usas RPC directamente)
DATABASE_URL=postgresql://user:password@host/database
```

## Ejemplo: Servidor Fastify Completo

Crea un archivo `src/server.ts` para tu servidor backend:

```typescript
import Fastify from 'fastify';
import { initTelegramBot, launchTelegramBot } from './handlers/telegramBot';
import registerTelegramEndpoints from './handlers/fastifyTelegramEndpoints';

const app = Fastify({
  logger: true,
  bodyLimit: 1048576
});

// Registrar endpoints REST de Telegram
await registerTelegramEndpoints(app);

// Inicializar y lanzar el Telegram Bot
if (process.env.TELEGRAM_BOT_TOKEN) {
  const bot = initTelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  await launchTelegramBot(bot);
} else {
  app.log.warn('TELEGRAM_BOT_TOKEN no configurado. Bot desactivado.');
}

// Health check
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Iniciar servidor
const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Servidor iniciado en puerto 3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
```

## Script para Package.json

Agrega estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "server": "tsx src/server.ts",
    "server:dev": "tsx --watch src/server.ts",
    "bot": "tsx src/handlers/telegramBot.ts"
  }
}
```

## Componentes Detallados

### 1. Middleware de Validación Telegram

**Archivo:** `src/middleware/validateTelegramUser.ts`

**Funcionalidad:**
- Valida que la request tenga header `X-Telegram-User-Id`
- Verifica que el user sea un coach (is_admin=true) en la BD
- Adjunta datos del coach a la request
- Implementa multi-tenant isolation

**Uso en Fastify:**
```typescript
fastify.post('/api/test', 
  { preHandler: requireTelegramAuth() },
  async (request, reply) => {
    const coach = (request as any).coach;
    const tenantId = (request as any).tenant_id;
    // Tu lógica aquí
  }
);
```

### 2. Sistema de Auditoría

**Archivo:** `src/utils/auditLog.ts`

**Funcionalidad:**
- `logAction()` - Función genérica para cualquier acción
- Helpers especializados:
  - `logWorkoutPush()` - Entrenamientos creados
  - `logApiKeyAccessed()` - Acceso a claves API
  - `logAthleteLogin()` - Login de atletas
  - `logCoachCommand()` - Comandos de coach
  - `logAthleteSubscription()` - Suscripciones
  - `logAthleteDataSync()` - Sincronización de datos
  - `logWebhookReceived()` - Webhooks recibidos

**Propiedades de logs:**
- `tenant_id` - Para aislamiento multi-tenant
- `action` - Tipo de acción realizada
- `actor_id` y `actor_type` - Quién hizo la acción
- `before_values` y `after_values` - Para auditoría completa
- `status` - SUCCESS, FAILED, o DENIED
- `error_message` - Si aplicable

**Características:**
- No lanza excepciones (logging failures no rompen app)
- Usa RPC `log_action()` de Supabase
- Logging asincrónico (no bloquea responses)

**Uso:**
```typescript
await logWorkoutPush({
  tenant_id: 'tenant-001',
  actor_id: 'coach-123',
  actor_name: 'John Coach',
  workout_id: 'workout-456',
  workout_name: '5x1km @ 3:45/km',
  status: 'SUCCESS'
});
```

### 3. Telegram Bot

**Archivo:** `src/handlers/telegramBot.ts`

**Comandos implementados:**
- `/start` - Bienvenida
- `/help` - Guía de comandos
- `/workout <descripción>` - Crear entrenamiento
- `/list` - Listar entrenamientos recientes
- `/stats` - Estadísticas del equipo
- `/athletes` - Listar atletas del equipo

**Características:**
- Validación de coach en cada comando
- Logging automático de todas las acciones
- Manejo de errores graceful
- Respuestas en español con emojis

**Inicialización:**
```typescript
import { initTelegramBot, launchTelegramBot } from './handlers/telegramBot';

const bot = initTelegramBot(process.env.TELEGRAM_BOT_TOKEN!);
await launchTelegramBot(bot);
```

### 4. Endpoints REST

**Archivo:** `src/handlers/fastifyTelegramEndpoints.ts`

**Endpoints disponibles:**

| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/telegram/test` | Validar autorización |
| POST | `/api/telegram/workout` | Crear entrenamiento |
| GET | `/api/telegram/workouts` | Listar entrenamientos |
| GET | `/api/telegram/stats` | Obtener estadísticas |
| GET | `/api/telegram/athletes` | Listar atletas |

Todos los endpoints requieren header `X-Telegram-User-Id`.

## Flujo de Validación

```
Request con X-Telegram-User-Id
           ↓
Middleware validateTelegramUser
           ↓
Query BD: SELECT * FROM athletes WHERE telegram_user_id = ? AND is_admin = true
           ↓
¿Encontró coach?
  ├─ SÍ → Adjunta coach a request, continúa
  └─ NO → Responde 403, log DENIED
           ↓
Handler procesa request
           ↓
logAction() registra auditoría
           ↓
Response al cliente
```

## Flujo de Logging

```
Acción en handler
           ↓
logAction() o helper específico
           ↓
Valida parámetros requeridos
           ↓
Llama RPC log_action()
           ↓
¿RPC exitoso?
  ├─ SÍ → Log registrado en audit_logs
  └─ NO → Log en console, pero NO lanza error
           ↓
Continúa ejecución sin bloquear
```

## Multi-tenant Isolation

Cada operación incluye `tenant_id`:

```typescript
// En middleware
ctx.tenant_id = coach.tenant_id; // Extraído de la BD

// En handlers
const { data } = await supabase
  .from('workouts')
  .select('*')
  .eq('tenant_id', request.tenant_id); // Filtra por tenant
```

## Seguridad

### Authentication
- Telegram ID validado contra BD
- Solo coaches (is_admin=true) pueden acceder
- Validación en CADA request

### Authorization
- Coach solo ve datos de su tenant
- Queries filtran por tenant_id
- Multi-tenant isolation garantizada

### Auditing
- Toda acción registrada en audit_logs
- Incluye before_values y after_values
- Timestamps para trazabilidad

### Error Handling
- Logging failures no rompen app (try-catch sin throw)
- Errores BD devuelven 500 con detalles
- Headers malformados retornan 401/400

## Testing

Ver [TELEGRAM_TESTING.md](./TELEGRAM_TESTING.md) para tests completos.

### Quick Test
```bash
# Iniciar servidor
npm run server

# En otra terminal, validar middleware
curl -X POST http://localhost:3000/api/telegram/test \
  -H "X-Telegram-User-Id: 123456789"
```

## Troubleshooting

### El bot no responde
1. Verificar `TELEGRAM_BOT_TOKEN` en `.env`
2. Verificar que el coach existe con `telegram_user_id` correcto
3. Ver logs en console

### Los logs no se guardan
1. Verificar que RPC `log_action()` existe (AGENTE 2)
2. Verificar permisos en tabla `audit_logs`
3. Ver errores en console (no rompen app)

### Multi-tenant aislamiento no funciona
1. Verificar que cada athlete tiene `tenant_id` correcto
2. Verificar que queries filtran por `tenant_id`
3. Revisar valores en `ctx.tenant_id` vs BD

### TypeScript errors
```bash
# Verificar compilation
npm run build

# Ver tipos de Fastify
npm install --save-dev @types/fastify
```

## Próximos Pasos (Otros Agentes)

- **AGENTE 2:** Crear RPC `log_action()` en PostgreSQL
- **AGENTE 3:** Crear endpoints específicos para atletas
- **AGENTE 5:** Integrar con endpoints existentes
- **AGENTE 6:** Crear frontend para Telegram linking

## Referencias

- [Fastify Documentation](https://www.fastify.io/)
- [Telegraf Documentation](https://telegraf.js.org/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
