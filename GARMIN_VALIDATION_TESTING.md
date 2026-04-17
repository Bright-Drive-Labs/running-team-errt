# 🧪 Testing Garmin Workout Validation

Este documento explica cómo probar que el sistema de validación está funcionando correctamente.

---

## 🚀 Quick Start

### 1. Asegúrate que el servidor está corriendo
```bash
npm run server
```

Deberías ver:
```
✓ Loaded .env
✓ Middleware registered: JWT, CORS
✓ Server initialized successfully
✓ Server listening at http://0.0.0.0:3000
```

---

## 📋 Test Cases

### Test 1: Workout VÁLIDO ✅

**Preparación:**
1. Crea un atleta VIP en la base de datos con `is_vip = true`
2. Configura su `intervals_athlete_id` y API key en el Vault
3. Crea un workout en `workout_assignments` con este markdown:

```markdown
Warmup
- Warmup 15m 8:01-6:37 pace intensity=warmup

10x
- Run 0.4km 4:45 pace intensity=interval
- Recover 80s intensity=recovery

Cooldown
- Cooldown 5m 6:37-8:01 pace intensity=cooldown
```

**Ejecutar:**
```bash
curl -X POST http://localhost:3000/api/intervals/sync-workout \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"workout_id": "<WORKOUT_ID>"}'
```

**Resultado esperado:**
```
✅ HTTP 200
{
  "success": true,
  "intervals_event_id": "12345",
  "message": "Workout successfully synced to Intervals.icu"
}
```

**En consola:**
```
[GARMIN VALIDATION] ✅ Workout abc123def válido
[WORKOUT PAYLOAD] Enviando a Intervals.icu:
  Nombre: VELOCIDAD: 8x400m Explosivos
  Atleta Intervals ID: 12345
  Markdown payload: Warmup...
[INTERVALS SUCCESS] Workout synced. ID: 12345
```

---

### Test 2: Workout INVÁLIDO (metros en lugar de km) ❌

**Preparación:**
Crea un workout con este markdown:

```markdown
Warmup
- Warmup 15m 8:01-6:37 pace intensity=warmup

10x
- Run 400m 4:45 pace intensity=interval
- Recover 80s intensity=recovery

Cooldown
- Cooldown 5m 6:37-8:01 pace intensity=cooldown
```

**Ejecutar:** (mismo curl que arriba)

**Resultado esperado:**
```
❌ HTTP 400
{
  "error": "Workout format invalid",
  "details": "El markdown_payload no cumple con Garmin Workout Rules",
  "validation_errors": [
    {
      "line": 6,
      "message": "❌ CRÍTICO: Detectado \"m\" (metros). Usa SIEMPRE \"km\" (kilómetros)...",
      "severity": "critical"
    }
  ],
  "summary": "❌ 1 error(es) crítico(s), 0 advertencia(s)"
}
```

**En consola:**
```
[GARMIN VALIDATION] Workout abc123def FAILED:

============================================================
VALIDACIÓN: GARMIN WORKOUT RULES
============================================================

❌ 1 error(es) crítico(s), 0 advertencia(s)

❌ ERRORES (1):
  [Línea 6] CRITICAL: ❌ CRÍTICO: Detectado "m" (metros)...

============================================================
```

---

### Test 3: Workout sin Warmup ❌

**Preparación:**
```markdown
10x
- Run 0.4km 4:45 pace intensity=interval
- Recover 80s intensity=recovery

Cooldown
- Cooldown 5m 6:37-8:01 pace intensity=cooldown
```

**Resultado esperado:**
```
❌ HTTP 400
{
  "validation_errors": [
    {
      "line": 1,
      "message": "Falta sección \"Warmup\". Requerida al inicio...",
      "severity": "critical"
    }
  ],
  "summary": "❌ 1 error(es) crítico(s), 0 advertencia(s)"
}
```

---

### Test 4: Intensidad Inválida ❌

**Preparación:**
```markdown
Warmup
- Warmup 15m 8:01-6:37 pace intensity=warmup

10x
- Run 0.4km 4:45 pace intensity=zone5

Cooldown
- Cooldown 5m 6:37-8:01 pace intensity=cooldown
```

**Resultado esperado:**
```
❌ HTTP 400
{
  "validation_errors": [
    {
      "line": 6,
      "message": "Intensidad inválida: \"intensity=zone5\". Usa: warmup, interval, recovery, cooldown",
      "severity": "major"
    }
  ],
  "summary": "❌ 1 error(es) crítico(s), 0 advertencia(s)"
}
```

---

### Test 5: Advertencias (Sin bloquear) ⚠️

**Preparación:**
```markdown
Warmup
- Warmup 15m 8:01-6:37 pace intensity=warmup

10x
- Run 0.4km 4:45 pace intensity=interval
- Recover 80s intensity=recovery

Cooldown
- Cooldown 5m 6:37-8:01 pace intensity=cooldown
```

(Válido, pero sin multiplicadores en parte)

**Resultado esperado:**
```
✅ HTTP 200
{
  "success": true,
  "message": "Workout successfully synced..."
}
```

(Las advertencias NO bloquean, solo informan)

---

## 🔧 Testing desde el Frontend

Si estás usando el AthletePortal:

1. Abre http://localhost:5173/portal
2. Inicia sesión
3. Navega a la sección de workouts pendientes
4. Haz click en "Sincronizar a Intervals" en un workout

**Verás la respuesta:**
- ✅ Si es válido: "Workout successfully synced"
- ❌ Si es inválido: Mensaje de error con línea y descripción del problema

---

## 📊 Monitoring en Consola

### Abrir DevTools del servidor
```bash
# Terminal donde corre "npm run server"
# Busca logs con estos patrones:
```

- `[GARMIN VALIDATION]` - Inicio de validación
- `✅ Workout válido` - Pasó validación
- `FAILED:` - Falló validación (ver detalles)
- `[WORKOUT PAYLOAD]` - Qué se está enviando a Intervals
- `[INTERVALS SUCCESS]` - Intervals lo aceptó
- `[INTERVALS ERROR]` - Intervals rechazó

---

## 🐛 Debugging Workflow

### Si un workout falla:

1. **Mira el error en el navegador/response**
   ```json
   {
     "validation_errors": [
       {"line": X, "message": "...", "severity": "..."}
     ]
   }
   ```

2. **Verifica la línea exacta en el markdown_payload**
   - Query: `SELECT markdown_payload FROM workout_assignments WHERE id = '...'`
   - Cuenta la línea del error

3. **Compara con GARMIN_WORKOUT_RULES.md**
   - ¿Tiene Warmup y Cooldown?
   - ¿Usa km no m?
   - ¿Usa intensidades válidas?

4. **Corrige en la base de datos**
   - Update: `UPDATE workout_assignments SET markdown_payload = '...' WHERE id = '...'`
   - Reintenta

5. **Verifica logs del servidor**
   - Busca `[GARMIN VALIDATION]`
   - Confirma que pasó validación esta vez

---

## ✅ Full Test Checklist

- [ ] Test 1: Workout válido pasa validación y se envía a Intervals
- [ ] Test 2: Workout con metros es rechazado (error línea correcta)
- [ ] Test 3: Workout sin Warmup es rechazado
- [ ] Test 4: Intensidad inválida es rechazada
- [ ] Test 5: Advertencias no bloquean envío
- [ ] Logs en consola muestran claramente qué pasó
- [ ] Errores incluyen número de línea exacto
- [ ] Respuesta HTTP correcta (200, 400, 500)

---

## 🎯 Resultado Final

Cuando todo funciona correctamente:

✅ **Validación clara** - Sabes exactamente qué está mal
✅ **Logs detallados** - Ves qué se envía a Intervals
✅ **Errores específicos** - Número de línea y descripción clara
✅ **Sin cambios de lógica** - Solo validación y comunicación mejorada
✅ **Debugging rápido** - Menos horas investigando errores

---

**Creado:** 2026-04-17  
**Versión:** 1.0  
**Estado:** Ready for testing
