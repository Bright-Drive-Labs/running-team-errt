# ⚙️ Antigravity IA — Technical Onboarding & Configuration

Este documento centraliza toda la configuración técnica necesaria antes de operar el sistema con un atleta nuevo. Es mandatorio completar estos pasos en orden antes de enviar el primer entrenamiento.

---

## PASO 1 — Configurar el Perfil del Atleta en Intervals.icu

Antes de cualquier push, el entrenador debe completar estos pasos **manualmente** en la plataforma de Intervals.icu:

### 1.1 Perfil Completo
- Crear cuenta del atleta en [intervals.icu](https://intervals.icu)
- Llenar: nombre, peso, edad, género
- Foto de perfil (opcional pero recomendado)

### 1.2 Métricas de Referencia (CRÍTICO para gráficos)
Cargar en **Settings → Running Fitness** las marcas del atleta:
- Mejor tiempo 5K
- Mejor tiempo 10K
- Mejor tiempo Media Maratón (si aplica)
- Resultado del test de umbral (30 min full effort)

Sin esto, Intervals no puede calcular las zonas ni mostrar las barras de intensidad correctamente.

### 1.3 Metodología de Entrenamiento
En **Settings → Sport Settings → Running**:
- Establecer métrica principal: **Pace (Ritmo)** — NO Power ni HR
- Definir zonas de ritmo basadas en el threshold test

### 1.4 Obtener las Credenciales de API
En **Settings → API** (esquina inferior izquierda):
- Copiar el **Athlete ID** (formato: `i123456`)
- Generar y copiar el **API Key**

---

## PASO 2 — Configuración de Telegram por Tenant (Coach)

Cada tenant (equipo) tiene **un solo coach autorizado** que controla el bot. El bot rechaza comandos de cualquier usuario no registrado.

### 2.1 Crear el Bot de Telegram (una vez por tenant)
> En el modelo SaaS, cada tenant puede tener su propio bot o compartir uno con acceso filtrado por `tenant_id`. Para el piloto ERRT se usa un bot compartido.

1. El coach escribe a **@BotFather** en Telegram
2. Ejecuta `/newbot` y sigue las instrucciones
3. Copia el **Bot Token** generado (formato: `123456:ABC-DEF...`)
4. Agrega el token al `.env` del servidor: `TELEGRAM_BOT_TOKEN=...`

### 2.2 Obtener el Telegram User ID del Coach
El bot necesita el **ID numérico** del coach (no el username) para autenticarlo:
1. El coach escribe a **@userinfobot** en Telegram
2. El bot responde con su ID numérico (ej: `987654321`)
3. Ese ID se registra en Supabase como `telegram_user_id` del coach

### 2.3 Registrar al Coach en Supabase
En la tabla `athletes`, el coach tiene `is_admin = true` y su `telegram_user_id` registrado:

| Campo | Valor |
|---|---|
| `name` | Nombre del coach |
| `tenant_id` | UUID del equipo |
| `telegram_username` | Username sin @ (ej: `danyp`) |
| `telegram_user_id` | ID numérico de Telegram (ej: `987654321`) |
| `is_admin` | `true` |
| `intervals_athlete_id` | null (el coach no necesita push de entrenamientos) |

### 2.4 Lógica de Autorización Multi-Tenant (en código)
El bot valida en cada mensaje:
1. ¿El `ctx.from.id` existe en la tabla `athletes` con `is_admin = true`?
2. ¿A qué `tenant_id` pertenece? → Define qué atletas puede ver y pushear
3. Si no está autorizado → el bot ignora o responde "⛔ No autorizado"

> ⚠️ **PENDIENTE DE IMPLEMENTAR:** La validación de `telegram_user_id` aún no está activa en el código. El bot actualmente acepta mensajes de cualquier usuario. Prioridad alta antes de abrir a más tenants.

---

## PASO 3 — Registrar al Atleta en Supabase (Antigravity DB)

En la tabla `athletes` de Supabase, crear un registro con:

| Campo | Valor |
|---|---|
| `name` | Nombre completo (ej: `Daniel Perez`) |
| `tenant_id` | `11111111-1111-1111-1111-111111111111` (ERRT) |
| `intervals_athlete_id` | El ID copiado de Intervals (ej: `i552473`) |
| `intervals_api_key` | La API Key copiada de Intervals |
| `telegram_username` | Username de Telegram sin @ (opcional, para futura auth) |
| `is_admin` | `false` (solo el coach es `true`) |

---

## PASO 4 — Configurar ChatGPT para Planificación

Usar este prompt como **System Instructions** en ChatGPT para que genere entrenamientos en formato compatible con el bot de Telegram:

```
Eres el asistente de planificación de entrenamientos del Escuadrón Rumbero (ERRT).
Cuando el coach te dicte un entrenamiento, SIEMPRE responde en este formato exacto, sin variaciones:

---
📋 ENTRENAMIENTO: [Nombre corto descriptivo, ej: 10x400m Intervalos]
👤 PARA: [Nombre del atleta o grupo]
📅 FECHA: [Si se menciona, si no dejar vacío]

🔥 WARMUP:
[Descripción del calentamiento con duración. SIN ritmos.]

⚡ TRABAJO PRINCIPAL:
[Series, repeticiones y distancias. SIN ritmos.]

⏱️ RECUPERACIÓN:
[Tiempo y tipo de recuperación entre series]

🏁 COOLDOWN:
[Descripción del enfriamiento con duración. SIN ritmos.]

📝 NOTAS DEL COACH:
[Indicaciones técnicas, objetivos y recomendaciones]

💬 FRASE MOTIVACIONAL:
[Frase de cierre]
---

REGLAS CRÍTICAS:
- NUNCA incluyas ritmos (pace), velocidades ni zonas de frecuencia cardíaca en ninguna sección.
  Los ritmos son calculados automáticamente por el sistema Escuadron Rumbero IA usando
  el método Jack Daniels según el perfil de cada atleta. Tú no los conoces.
- Siempre incluye las 7 secciones aunque estén vacías
- Distancias en metros para las series (el bot las convierte a km)
- Recuperación siempre en segundos o minutos
- Mantén el encabezado "📋 ENTRENAMIENTO:" exactamente así para que el bot lo detecte
```

---

## PASO 5 — Verificación Final

Antes de declarar al atleta como "activo" en el sistema, ejecutar un push de prueba desde Telegram:

1. Dictar un entrenamiento simple al bot
2. Confirmar que el bot detecta correctamente al atleta en Supabase
3. Verificar que el evento aparece en el calendario de Intervals.icu del atleta
4. Abrir el workout en Intervals y confirmar que el gráfico de intensidad muestra las barras correctamente
5. Sincronizar con el Garmin del atleta y verificar que llega al reloj

---

## Referencia Rápida de Credenciales Activas (ERRT Piloto)

| Atleta | Athlete ID | Admin |
|---|---|---|
| Daniel Perez | `i552473` | ✅ |

> ⚠️ Las API Keys NO se documentan aquí — viven exclusivamente en Supabase bajo RLS.
