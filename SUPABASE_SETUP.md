# 🔐 Configuración de Supabase

Para que la autenticación funcione, necesitas configurar Supabase:

## Paso 1: Crear cuenta en Supabase (Gratis)

1. Ve a https://supabase.com
2. Haz clic en "Start your project"
3. Inicia sesión con GitHub o crea una cuenta

## Paso 2: Crear nuevo proyecto

1. Haz clic en "New Project"
2. Elige un nombre para tu proyecto (ej: "nuestro-rincon")
3. Crea una contraseña de base de datos (guárdala en un lugar seguro)
4. Selecciona la región más cercana a ti
5. Haz clic en "Create new project"
6. Espera 1-2 minutos mientras se crea el proyecto

## Paso 3: Obtener credenciales

1. En el panel de Supabase, ve a **Settings** (⚙️) > **API**
2. Encontrarás:
   - **Project URL**: tu URL de proyecto
   - **anon/public key**: tu clave pública

## Paso 4: Configurar variables de entorno

1. Abre el archivo `.env.local` en tu proyecto
2. Reemplaza los valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica_aqui
```

## Paso 5: Configurar autenticación en Supabase

1. En Supabase, ve a **Authentication** > **Providers**
2. Habilita **Email** provider
3. En **Email Auth**, configura:
   - ✅ Enable Email provider
   - ✅ Enable Email confirmations (recomendado)
   - Site URL: `http://localhost:3000` (desarrollo)
   - Redirect URLs: `http://localhost:3000/**` (desarrollo)

## Paso 6: (Opcional) Configurar template de email

1. Ve a **Authentication** > **Email Templates**
2. Personaliza los emails de confirmación si lo deseas

## Paso 7: Para producción (Vercel)

Cuando despliegues a Vercel:

1. En Vercel, ve a tu proyecto > Settings > Environment Variables
2. Agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. En Supabase Authentication Settings, actualiza:
   - Site URL: `https://tu-dominio.vercel.app`
   - Redirect URLs: `https://tu-dominio.vercel.app/**`

## ✅ Verificar que funciona

1. Asegúrate de que el servidor de desarrollo esté corriendo:
   ```bash
   npm run dev
   ```

2. Ve a http://localhost:3000
3. Haz clic en "Crear Cuenta Gratis"
4. Completa el formulario de registro
5. Revisa tu email para confirmar la cuenta
6. Inicia sesión

## 🎉 ¡Listo!

Ya tienes autenticación funcionando completamente gratis con:
- ✅ Registro de usuarios
- ✅ Login/Logout
- ✅ Confirmación por email
- ✅ Dashboard protegido
- ✅ Datos de pareja guardados

## 📊 Límites del plan gratuito

- 50,000 usuarios activos por mes
- 500 MB de almacenamiento de base de datos
- 1 GB de transferencia de archivos
- 2 GB de ancho de banda

¡Más que suficiente para empezar! 💕
