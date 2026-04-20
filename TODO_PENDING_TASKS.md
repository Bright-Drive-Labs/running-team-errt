# 📋 Lista de Tareas Pendientes — Escuadrón Rumbero ERRT

## 1. Despliegue y Branding (Frontend)
- [ ] **Sincronizar Vercel**: Hacer un nuevo `deploy` para que los archivos `privacy.html`, `terms.html` y los cambios en el CSS esten activos online.
- [ ] **Corregir Pantalla Negra en Producción**: Verificar las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BACKEND_URL`) en el dashboard de Vercel.

## 2. Validación de Google (OAuth)
- [ ] **Completar Registro de Marca**: Pegar los enlaces legales en Google Cloud Console:
    - *Privacidad*: `https://www.escuadronrumbero.com/privacy.html`
    - *Términos*: `https://www.escuadronrumbero.com/terms.html`
- [ ] **Publicar App**: Cambiar el estado de la app de "Testing" a "In Production" en Google Cloud.
- [ ] **Verificar Dominio**: Asegurarse de que el dominio esté validado en Google Search Console para habilitar el logo.

## 3. Configuración de Supabase
- [ ] **URLs de Redirección**: Cambiar el `Site URL` a `https://www.escuadronrumbero.com` en **Authentication > URL Configuration**.
- [ ] **Redirect Whitelist**: Asegurar que `https://www.escuadronrumbero.com/**` esté en la lista permitida.

## 4. Backend y Seguridad (Railway/Local)
- [ ] **Instalar bcrypt**: Ejecutar `npm install bcrypt` en el servidor.
- [ ] **Secrets de Railway**: Configurar `TELEGRAM_BOT_TOKEN`, `JWT_SECRET` y las credenciales de Supabase en Railway.
- [ ] **Migración de API Keys**: Ejecutar el script `scripts/migrate-api-keys.ts` para mover las llaves existentes al Vault seguro.
- [ ] **Test de Bot**: Verificar que el bot responda correctamente con el nuevo middleware de validación.

## 5. Pruebas de Usuario (QA)
- [ ] **Test de "Usuario No Autorizado"**: Intentar entrar con un Gmail que NO esté en la DB y verificar que aparezca la pantalla de "Acceso Denegado".
- [ ] **Sincronización Garmin**: Probar el botón de sincronización desde el portal del atleta y verificar que el backend pushee correctamente a Intervals.icu.
