# 🧠 Memoria Temporal - Telegram Commander (Phase 2 & 3)
**Actualizado: 12 de Abril, 2026**

Este documento sirve como puente de contexto para que cualquier instancia de IA (Gemini/Claude) entienda el estado actual del "Super Agente de Entrenamiento".

---

## 🛠️ Estado Técnico Actual
1. **Brain Switch (IA):**
   - Se eliminó la dependencia de `Google Gemini API` (por inestabilidad/vencimiento de tokens).
   - Se integró **Groq (Llama 3.3 70B Versatile)**. Es ultra rápido (<1s) y procesa el lenguaje natural del Coach para extraer JSONs con la intención de entrenamiento y audiencia.

2. **Memoria de Conversación (Short-term):**
   - El bot ahora tiene una `sessionState` (Map). 
   - **Lógica:** Si el Coach envía un entrenamiento pero olvida decir para quién es, el Bot guarda los datos técnicos en RAM y espera el nombre del Atleta. Al recibirlo, concatena ambos mensajes para no perder la serie.

3. **Arquitectura Multi-Tenant (Supabase):**
   - Se crearon las tablas `teams` y `athletes`.
   - **Seed Hack:** El Tenant principal (Escuadrón Rumbero) tiene el ID `11111111-1111-1111-1111-111111111111`.
   - Los atletas ahora tienen campos para `intervals_athlete_id` e `intervals_api_key` protegidos por RLS.

4. **Integración con Intervals.icu (Push de Datos):**
   - Módulo: `src/agents/intervals-api.ts`.
   - **Sincronización REAL:** Al presionar el botón "SÍ, PUSH", el bot busca al atleta en Supabase, extrae sus llaves, y envía un POST a la API de Intervals agendando el entrenamiento para el día de mañana.

---

## 🛡️ Notas de Seguridad
- Se ha incluido `setup_database.sql` en el `.gitignore`. **NUNCA** subir este archivo con semillas de IDs reales a GitHub.
- Las llaves de Groq y Supabase se manejan estrictamente por el `.env`.

---

## 🚀 Próximos Pasos (Hoja de Ruta)
- **Speech-to-Text:** Integrar Whisper o similar para que "Oye, ponle a Daniel una serie de 400m" funcione por audio.
- **Validación de Grupos:** Implementar la lógica para que `target_audience: GROUP: Avanzados` funcione enviando el push a 30 atletas al mismo tiempo.
- **Refactorización de UI:** Crear un dashboard web para que el Coach vea los "Push realizados" visualmente.

---
*Antigravity IA Assistant: Entregando el mando a la siguiente instancia.*
