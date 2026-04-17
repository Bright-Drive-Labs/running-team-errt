# 🔍 Garmin Workout Validation Debug Guide

Este documento ayuda a diagnosticar problemas de validación de workouts sin cambiar la lógica de generación.

---

## ✅ Flujo Correcto

```
Atleta crea workout en Portal
         ↓
Frontend envía POST /api/intervals/sync-workout
         ↓
Servidor VALIDA markdown_payload (garminValidator.ts)
         ↓
Si ✅ VÁLIDO → Envía a Intervals.icu
Si ❌ INVÁLIDO → Retorna errores detallados
         ↓
Intervals.icu responde con ID o error
         ↓
Log detallado en consola
```

---

## 🚨 Errores Críticos (Bloquean envío)

### Error 1: Uso de Metros (400m)
**Problema:**
```
❌ CRÍTICO: Detectado "m" (metros). Usa SIEMPRE "km" (kilómetros).
```

**Causa:** Escribiste `400m` en lugar de `0.4km`

**Solución:**
```
❌ INCORRECTO:
- Run 400m 4:45 pace intensity=interval

✅ CORRECTO:
- Run 0.4km 4:45 pace intensity=interval
```

**Por qué:** Intervals.icu interpreta `m` como minutos, destruyendo la estructura.

---

### Error 2: Falta Warmup
**Problema:**
```
Falta sección "Warmup". Requerida al inicio del entrenamiento.
```

**Solución:**
```markdown
Warmup
- Warmup 15m 8:01-6:37 pace intensity=warmup

...resto del entrenamiento...
```

---

### Error 3: Falta Cooldown
**Problema:**
```
Falta sección "Cooldown". Requerida al final del entrenamiento.
```

**Solución:**
```markdown
...resto del entrenamiento...

Cooldown
- Cooldown 5m 6:37-8:01 pace intensity=cooldown
```

---

### Error 4: Intensidad Inválida
**Problema:**
```
Intensidad inválida: "intensity=zona1". Usa: warmup, interval, recovery, cooldown
```

**Valores permitidos:**
- `intensity=warmup` - Calentamiento
- `intensity=interval` - Esfuerzo/Series
- `intensity=recovery` - Descanso activo
- `intensity=cooldown` - Enfriamiento

---

## ⚠️ Advertencias (No bloquean, pero revisar)

### Advertencia 1: Mezcla de idiomas
**Problema:**
```
Posible mezcla de idiomas. Usa solo inglés para directivas.
```

**Solución:** Usa siempre:
- `Warmup` no `Calentamiento`
- `Run` no `Carrera`
- `Recover` no `Descanso`
- `Cooldown` no `Enfriamiento`

Las **notas del coach pueden estar en español**, solo las directivas técnicas deben ser en inglés.

---

### Advertencia 2: Pace sin formato MM:SS
**Problema:**
```
Pace sin formato MM:SS detectado. Ejemplo correcto: "4:45 pace"
```

**Formato esperado:**
```
✅ CORRECTO:
- Run 0.4km 4:45 pace intensity=interval
- Run 0.8km 5:30-4:50 pace intensity=interval

❌ INCORRECTO:
- Run 0.4km 285sec pace
- Run 0.4km fast intensity=interval
```

---

### Advertencia 3: Sin multiplicadores
**Problema:**
```
No se detectaron multiplicadores (Nx, 1x). Se recomienda agrupar las series.
```

**Solución:**
```
✅ CORRECTO (con multiplicadores):
10x
- Run 0.4km 4:45 pace intensity=interval
- Recover 80s intensity=recovery

❌ INCORRECTO (sin multiplicadores):
- Run 0.4km 4:45 pace intensity=interval
- Recover 80s intensity=recovery
- Run 0.4km 4:45 pace intensity=interval
- Recover 80s intensity=recovery
... (repetido 10 veces)
```

**Por qué:** Los multiplicadores hacen más clara la estructura y evitan confusiones.

---

## 📋 Estructura de Validación

```javascript
ValidationResult {
  valid: boolean,              // true = puedes enviar a Intervals
  errors: [                    // Bloquean envío (crítico + major)
    {
      line: 5,
      message: "...",
      severity: "critical"     // O "major"
    }
  ],
  warnings: [                  // Info útil (no bloquean)
    {
      line: 10,
      message: "..."
    }
  ],
  summary: "✅ Workout válido" // Resumen rápido
}
```

---

## 🔧 Cómo Leer Logs en Consola

### Cuando validación FALLA:
```
[GARMIN VALIDATION] Workout abc123def FAILED:

============================================================
VALIDACIÓN: GARMIN WORKOUT RULES
============================================================

❌ 1 error(es) crítico(s), 0 advertencia(s)

❌ ERRORES (1):
  [Línea 5] CRITICAL: ❌ CRÍTICO: Detectado "m" (metros)...

============================================================
```

### Cuando validación PASA:
```
[GARMIN VALIDATION] ✅ Workout abc123def válido
[WORKOUT PAYLOAD] Enviando a Intervals.icu:
  Nombre: VELOCIDAD: 8x400m Explosivos
  Atleta Intervals ID: 12345
  Markdown payload: Warmup
- Warmup 15m 8:01-6:37 pace intensity=warmup...
```

### Cuando Intervals RECHAZA:
```
[INTERVALS ERROR] Status 400: {"error":"Invalid workout format","details":"..."}
```

---

## 📝 Checklist Pre-Envío

Antes de que un workout llegue a Intervals, verifica:

- [ ] **Sin metros:** `0.4km` no `400m`
- [ ] **Tiene Warmup:** Al inicio
- [ ] **Tiene Cooldown:** Al final
- [ ] **Intensidades válidas:** `warmup`, `interval`, `recovery`, `cooldown`
- [ ] **Inglés en directivas:** `Run`, `Recover`, no `Carrera`, `Descanso`
- [ ] **Pace en MM:SS:** `4:45` no `285seg`
- [ ] **Multiplicadores:** `10x`, `1x`, etc. para agrupar series

---

## 🎯 Ejemplo Completo Válido

```markdown
Warmup
- Warmup 15m 8:01-6:37 pace intensity=warmup

10x
- Run 0.4km 4:45 pace intensity=interval
- Recover 80s intensity=recovery

Cooldown
- Cooldown 5m 6:37-8:01 pace intensity=cooldown
```

**Este entrenamiento pasará validación y será aceptado por Intervals.icu** ✅

---

## 💡 Notas Importantes

1. **NO cambiamos la lógica** de cómo se generan los workouts, solo validamos
2. **Errores claros** = menos horas debuggeando
3. **Logs detallados** = sabemos exactamente qué se envió
4. **Validación temprana** = detectamos problemas ANTES de que Intervals falle
5. **Comunicación con Intervals** = vemos exactamente qué respondió

---

## 🚀 Próximos Pasos

Si un workout falla validación:

1. Lee el error de validación (línea exacta, problema específico)
2. Corrige el markdown_payload en la DB (tabla `workout_assignments`)
3. Reintenta enviar desde el Portal
4. Verifica los logs para confirmar que pasó validación
5. Confirma que Intervals.icu lo aceptó (busca `[INTERVALS SUCCESS]`)

---

**Creado:** 2026-04-17  
**Referencia:** GARMIN_WORKOUT_RULES.md
