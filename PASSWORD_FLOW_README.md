# Implementación del Flujo de Cambio de Contraseña Obligatorio

Este documento describe la implementación completa del flujo para forzar el cambio de contraseña en el primer login de los miembros invitados.

## Archivos Creados/Modificados

### 1. API Routes
- `src/app/api/users/change-password/route.ts` - Endpoint para cambiar contraseña
- `src/app/api/user/me/route.ts` - Endpoint para obtener información del usuario actual

### 2. Páginas
- `src/app/first-login/page.tsx` - Página para el primer login y cambio de contraseña obligatorio

### 3. Componentes
- `src/components/password-change-guard.tsx` - Guardia que redirige a usuarios que necesitan cambiar contraseña

### 4. Layout Principal
- `src/app/layout.tsx` - Actualizado para incluir el PasswordChangeGuard

### 5. Actions Modificadas
- `src/app/settings/actions.ts` - Modificado para marcar usuarios con `must_change_password: true` y limpiar la bandera al cambiar contraseña

### 6. Migración de Base de Datos
- `src/migrations/001_members_and_password_change.sql` - SQL completo para todas las migraciones

## Instrucciones de Implementación

### Paso 1: Ejecutar Migración de Base de Datos
1. Abre el SQL Editor en tu dashboard de Supabase
2. Ejecuta el contenido completo del archivo `src/migrations/001_members_and_password_change.sql`
3. Verifica que todas las tablas y políticas RLS se hayan creado correctamente

### Paso 2: Verificar Variables de Entorno
Asegúrate de que tienes estas variables en tu `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio (si es necesaria)
```

### Paso 3: Probar el Flujo
1. Reinicia tu servidor de desarrollo: `npm run dev`
2. Como administrador, invita un nuevo miembro desde Ajustes > Miembros
3. El nuevo miembro será creado con `must_change_password: true`
4. Usa las credenciales del nuevo miembro para iniciar sesión
5. Deberías ser redirigido automáticamente a `/first-login`
6. Cambia la contraseña y verifica que el sistema te desconecte
7. Inicia sesión nuevamente con la nueva contraseña

## Flujo Completo

### Para Administradores (Creación de Miembros)
1. Admin navega a Ajustes > Miembros
2. Hace clic en "Invitar Miembro"
3. Llena el formulario con datos del nuevo miembro y contraseña temporal
4. El sistema crea:
   - Usuario en Auth con contraseña temporal
   - Perfil en `profiles` con `must_change_password: true`
   - Registro en `members` con `must_change_password: true`

### Para Nuevos Miembros (Primer Login)
1. Miembro recibe credenciales temporales del admin
2. Intenta hacer login en la aplicación
3. Al acceder a cualquier página protegida, el `PasswordChangeGuard` detecta `must_change_password: true`
4. Es redirigido automáticamente a `/first-login`
5. Debe cambiar su contraseña obligatoriamente
6. Al cambiar la contraseña:
   - Se actualiza la contraseña en Auth
   - Se limpia `must_change_password: false` en el perfil
   - Se desconecta automáticamente
   - Es redirigido al login principal
7. Puede iniciar sesión normalmente con su nueva contraseña

## Características de Seguridad

### Protecciones Implementadas
- **Autenticación obligatoria**: `/first-login` requiere usuario autenticado
- **Verificación de necesidad**: Solo usuarios con `must_change_password: true` pueden usar la página
- **Logout forzado**: Después del cambio, se fuerza logout para usar nuevas credenciales
- **RLS (Row Level Security)**: Políticas de base de datos para acceso seguro
- **Validación de contraseñas**: Mínimo 8 caracteres, confirmación requerida

### Redirecciones Inteligentes
- Usuarios no autenticados → `/` (página principal/login)
- Usuarios que no necesitan cambiar contraseña → `/dashboard`
- Usuarios con `must_change_password: true` → `/first-login`

## Solución de Problemas

### Error: "Column 'roles' doesn't exist"
- Ejecuta la migración SQL completa
- Verifica que las columnas `roles` y `must_change_password` existan en ambas tablas

### Error: "Infinite recursion in RLS policy"
- Las funciones `is_in_clinic()` y `is_clinic_admin()` resuelven este problema
- Asegúrate de que están creadas con `SECURITY DEFINER`

### Página en blanco o loops de redirección
- Verifica que `/api/user/me` responda correctamente
- Revisa la consola del navegador para errores de JavaScript
- Asegúrate de que el `PasswordChangeGuard` no esté interfiriendo con rutas públicas

## Estructura de Base de Datos Actualizada

### Tabla `profiles`
```sql
- id (uuid, PK)
- clinic_id (uuid, FK)
- first_name (text)
- last_name (text)
- roles (text[])
- job_title (text)
- must_change_password (boolean) -- NUEVO
```

### Tabla `members`
```sql
- id (uuid, PK)
- clinic_id (uuid, FK)
- user_id (uuid, FK)
- job_title (text)
- roles (text[]) -- NUEVO
- is_active (boolean)
- must_change_password (boolean) -- NUEVO
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Tabla `clinics`
```sql
- schedule (jsonb) -- NUEVO
- google_calendar_reminder_minutes (integer) -- NUEVO
```

Este flujo asegura que todos los miembros invitados cambien su contraseña temporal antes de poder usar la aplicación, mejorando significativamente la seguridad del sistema.
