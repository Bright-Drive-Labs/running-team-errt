# Documento de Contexto y Memoria del Proyecto
**Escuadrón Rumbero - Official Web Experience (React Production)**

---

## 📌 Estado del Proyecto (Actualizado: Marzo 2026)
La aplicación web del Escuadrón Rumbero ha evolucionado de un prototipo visual a una plataforma funcional conectada al "Cerebro IA" (Bright Drive Agent).

### Tecnologías Clave
- **Frontend:** React + Vite + TailwindCSS.
- **Infraestructura Cloud:** Backend en **Railway**, Frontend en **Vercel**.
- **Dominio Principal:** `escuadronrumbero.com`.

- **Control de Versiones:** GitHub repo oficial `running-team-errt`.

---

## 🛠️ Características Implementadas
1. **Home Premium:** Diseño de alto impacto con Hero Section responsiva.
2. **Sistema de Galerías Inteligentes:** Integración en tiempo real con Google Drive (Carpeta oficial del Escuadrón: `1bVaOYZnxRoeF1SRfPgZ-tGU2mpM8R-9k`).
3. **Módulo de Inscripciones:** Formulario granular con validaciones, contacto de emergencia y selección de tallas/distancias.
4. **Sistema Anti-Spam:** Implementación de Double Opt-in (Verificación por correo vía Resend).
5. **Panel de Control (Admin):** Área protegida en `/admin/roster` para visualizar y exportar la lista de corredores verificados.
6. **Formulario de Contacto:** Conexión directa con el correo del equipo para soporte y ventas.

---

## 🏆 Hitos de Producción (Marzo 2026)
- **Despliegue Exitoso (V1.0):** Aplicación 100% funcional y disponible en `https://www.escuadronrumbero.com`.
- **Certificación SSL:** Configuración de HTTPS completa y automática vía Vercel.
- **Limpieza de Marca:** Botón de inscripción configurado como "PRÓXIMAMENTE" para el evento de Junio.

---

## 🏃‍♂️ Motor de Entrenamientos IA (Workout Builder V2)
- **Garmin & Intervals.icu Integration:** Se ha finalizado la investigación y validación del formato para exportar entrenamientos desde la IA hacia los relojes Garmin usando Markdown Estructurado estandarizado en inglés.
- **Contrato Operativo (SOP):** Consúltese el archivo [`GARMIN_WORKOUT_RULES.md`](./GARMIN_WORKOUT_RULES.md) recién creado en la raíz del proyecto. Ahí residen las reglas estrictas para la generación de strings de entrenamiento para evitar el bug del temporizador y errores de intervalos.

---

## 🔒 Arquitectura Backend & Multi-Tenant (Abril 2026)
- **Supabase Core Integration:** 
  - La base de datos opera bajo un ecosistema Multi-Tenant (Tabla `teams` y `athletes`).
  - **Identidad "Seed" Escuadrón Rumbero:** Se decidió forzar ("hardcodear") el UUID Principal Global a `11111111-1111-1111-1111-111111111111`. Esto es una maniobra de diseño arquitectónico (Seed Hack) para que los insert manuales del perfil de Administrador (`is_admin: true`) sean fáciles de vincular sin crear scripts complejos de extracción ID. Omitir modificar esto.
  - El Bot Telepático (Telegram) usa tu ID de Intervals asociado en `athletes` mediante la lectura desde el backend (Vía `intervals-api.ts`).
- **Seguridad (Cero Leaks):** Cualquier archivo de semilla local como `setup_database.sql` se mantiene bloqueado mediante `.gitignore` para prevenir que credenciales reales de `Intervals API Keys` viajen accidentalmente a GitHub.

---

*Nota de Antigravity: Este es el Front-line de la marca. Mantener la estética premium y la sencillez en el registro de usuarios.*
