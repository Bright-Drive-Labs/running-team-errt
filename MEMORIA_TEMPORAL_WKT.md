# 🧠 Memoria Temporal - Telegram Commander (Phase 2 & 3)
**Última Actualización: 13 de Abril, 2026**

Este documento sirve como puente de contexto para que cualquier instancia de IA (Gemini/Claude) entienda el estado actual del "Super Agente de Entrenamiento".

---

## 🛠️ Estado Técnico Actual
1. **Brain Switch (IA):**
   - **Few-Shot Prompting Rigid:** Se refactorizó el prompt del sistema para usar una estructura de "Pocos Ejemplos" (Few-Shot). Esto garantiza que la IA respete **estricta y obligatoriamente** los dobles saltos de línea entre bloques de entrenamiento exigidos por Garmin/Intervals.icu.
   - **Extracción de Notas:** Se separaron técnicamente el `workout_markdown` (instrucciones mecánicas) de las `coach_notes` (motivación y técnica). Ambas se sincronizan ahora juntas pero sin mezclarse.

2. **Frontend - Portal del Atleta (Vite + React):**
   - **Renderizado de Notas:** Se actualizó `AthletePortal.jsx` para mostrar un bloque de "Notas del Coach" con estilo propio (rojo racing, cursiva).
   - **Sincronización Manual:** Se corrigió el botón "Sincronizar Garmin" para que envíe el paquete completo (Nombre, Markdown y las Notas) evitando errores de "Name is required".

3. **Arquitectura Multi-Tenant (Supabase):**
   - Las llaves de Intervals.icu se buscan dinámicamente según el `target_audience`.
   - Soporte para atletas individuales (`Daniel Perez`) con mapping automático de IDs.

4. **Integración con Intervals.icu (Push de Datos):**
   - **Fix de Fecha (Java Parser):** Se ajustó el formato de `start_date_local` agregando un timestamp simulado (`T08:00:00`) para evitar el error `422` del servidor Java de Intervals.icu.

---

## 🛡️ Notas de Seguridad
- Se ha incluido `setup_database.sql` en el `.gitignore`. **NUNCA** subir este archivo con semillas de IDs reales a GitHub.
- Todas las credenciales críticas viven en el `.env`.

---

## 🚀 Próximos Pasos (Hoja de Ruta)
- **Speech-to-Text (PROX):** Integración de OpenAI Whisper para que el Coach envíe entrenamientos por nota de voz.
- **Push por Grupos:** Lógica para que `GROUP: Avanzados` envíe el push a múltiples atletas en una sola ráfaga.
- **Dashboard de Historial:** Dashboard visual para que el Coach rastree qué entrenamientos han sido "empujados" al reloj de cada atleta.

---
*Antigravity IA Assistant: Entregando el mando a la siguiente instancia.*
