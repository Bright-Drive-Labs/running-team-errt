# 📜 Biblia de la Verdad: Estándar de Seguridad Bright Drive Solutions (AGENCIA)

Este documento certifica los pilares de seguridad y arquitectura que rigen todos los proyectos de la agencia (ERRT, Tecnimedical, y futuros desarrollos). Es la base inamovible para garantizar la integridad de los datos de nuestros clientes.

## 1. 🛡️ Pilar de Seguridad: "El Almacén Invisible"
*   **Regla de Oro**: Ninguna API Key de Intervals.icu se almacena en las tablas de la base de datos abierta (`athletes`).
*   **Implementación**: Se utiliza el sistema **Supabase Vault**. Las llaves están encriptadas y solo son accesibles mediante la función RPC `get_intervals_key`.
*   **Archivo Guardián**: `src/lib/intervals-api.ts`. Este archivo gestiona la recuperación temporal en memoria; nunca guardes el resultado del RPC en una variable persistente o archivo.

## 2. 🌍 Pilar de Multitenancy: "Aislamiento Total"
*   **Regla de Oro**: Ningún dato se consulta sin filtrar estrictamente por `tenant_id`.
*   **Implementación**: El middleware `validateTelegramUser.ts` y las políticas RLS en Supabase garantizan que un coach solo vea a sus atletas y un atleta solo vea sus entrenamientos.
*   **Zona Intocable**: El campo `tenant_id` en todas las tablas es el ancla de seguridad del proyecto.

## 3. ⚡ Pilar del Flujo de Trabajo: "El Protocolo VIP"
El flujo de entrenamiento ha sido normalizado para maximizar el valor de la suscripción VIP:
1.  **Ingesta (Bot)**: El bot recibe texto, lo procesa con Groq y genera un JSON con dos descripciones (`friendly` y `technical`). Se guarda en `workout_assignments` con estado `PENDING`.
2.  **Visualización (Portal)**: El portal muestra únicamente la `friendly_description`. Los códigos técnicos (`intensity=warmup`, etc.) están **OCULTOS** para evitar copias no autorizadas.
3.  **Sincronización (Solo VIP)**: La conexión con Garmin ocurre **únicamente** cuando el atleta le da clic al botón. El backend toma el `workout_id` de la base de datos para recuperar la instrucción técnica y mandarla a Intervals.icu.

## 4. 🗃️ Estructura de Base de Datos (NORMALIZADA)
*   **Tabla `tenants`**: Registro de equipos (ERRT es el principal).
*   **Tabla `athletes`**: Perfiles de corredores; `is_admin` define quién es Coach.
*   **Tabla `workout_assignments`**: El historial de entrenamientos pendientes y completados.

---

### ⚠️ AVISO PARA DESARROLLADORES E IAs:
**No modificar, refactorizar ni "optimizar" la lógica en los siguientes archivos:**
*   `src/lib/intervals-api.ts` (Seguridad de Vault)
*   `src/lib/intervals-calendar.ts` (Lógica de Sync)
*   `src/handlers/telegramBot.ts` (Cerebro del Bot)
*   `src/middleware/validateTelegramUser.ts` (Autenticación Coach)
*   `src/lib/supabase.ts` (Configuración de Cliente Central)
