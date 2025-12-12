# Configuración de Email en Supabase

## Error "Error sending recovery email"

Este error ocurre porque Supabase necesita configuración adicional para enviar emails de recuperación.

## Solución 1: Usar SMTP Personalizado (Recomendado para Producción)

### Paso 1: Obtener credenciales SMTP

Puedes usar cualquiera de estos servicios:
- **Gmail** (gratis, 500 emails/día)
- **SendGrid** (gratis, 100 emails/día)
- **Mailgun** (gratis, 1000 emails/mes)
- **Amazon SES** (muy económico)

#### Ejemplo con Gmail:

1. Ve a tu cuenta de Google
2. Activa **verificación en 2 pasos**
3. Ve a **Contraseñas de aplicación**
4. Genera una contraseña para "Correo"
5. Guarda esa contraseña (la usarás abajo)

### Paso 2: Configurar en Supabase

1. Ve a tu proyecto en Supabase
2. Settings → Auth → SMTP Settings
3. Configura:

```
Enable Custom SMTP: ✅ ON

SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: tuemailaqui@gmail.com
SMTP Password: [contraseña de aplicación generada]
SMTP Sender Name: Nuestro Rincón
SMTP Sender Email: tuemailaqui@gmail.com
```

4. Click en **Save**

### Paso 3: Configurar URL de Redirección

1. En Supabase → Settings → Auth → URL Configuration
2. En **Site URL**: `http://localhost:3000` (desarrollo) o tu dominio en producción
3. En **Redirect URLs**, agrega:
   - `http://localhost:3000/auth/reset-password`
   - `http://localhost:3000/auth/callback`

## Solución 2: Usar Email Interno de Supabase (Solo para Desarrollo)

Supabase envía emails automáticamente en desarrollo, pero tiene límites:

1. Ve a Supabase → Authentication → Users
2. Busca el usuario con email: `estebankora1016@gmail.com`
3. Click en los 3 puntos → **Send Magic Link**
4. O usa **Send Password Recovery**

**IMPORTANTE:** Los emails en desarrollo van a la bandeja de entrada del proyecto en Supabase:
- Ve a **Logs** → **Auth Logs**
- Busca el link de recuperación en los logs

## Solución 3: Cambiar Contraseña Manualmente (Temporal)

Si solo necesitas resetear la contraseña temporalmente:

1. Ve a Supabase → Authentication → Users
2. Busca el usuario: `estebankora1016@gmail.com`
3. Click en el usuario
4. En el panel derecho, click **Reset Password**
5. Copia el link generado
6. Pégalo en el navegador para cambiar la contraseña

## Verificar Configuración

Una vez configurado SMTP, prueba enviando un email de recuperación:

1. Ve a `http://localhost:3000/auth/forgot-password`
2. Ingresa: `estebankora1016@gmail.com`
3. Click en "Enviar Link de Recuperación"
4. Revisa tu bandeja de entrada (y spam)

## Troubleshooting

### "Email rate limit exceeded"
- Espera 60 segundos entre intentos
- Supabase limita a 4 emails por hora por usuario en desarrollo

### "SMTP configuration error"
- Verifica que las credenciales SMTP sean correctas
- Gmail: Asegúrate de usar contraseña de aplicación, NO tu contraseña normal
- Verifica que el puerto sea 587 (no 465)

### Email no llega
1. Revisa carpeta de spam
2. Verifica que el email del remitente esté verificado
3. Revisa los logs en Supabase → Logs → Auth Logs

### "User not found"
- El email no existe en la base de datos
- Primero regístrate en `/auth/register`

## Email Templates (Opcional)

Puedes personalizar los emails en Supabase:

1. Settings → Auth → Email Templates
2. Edita **Reset Password**:

```html
<h2>Restablecer Contraseña - Nuestro Rincón</h2>
<p>Hola,</p>
<p>Recibimos una solicitud para restablecer tu contraseña.</p>
<p><a href="{{ .ConfirmationURL }}">Click aquí para crear una nueva contraseña</a></p>
<p>Si no solicitaste esto, ignora este correo.</p>
<p>Con amor,<br>El equipo de Nuestro Rincón 💕</p>
```

## Resumen de Pasos Rápidos

Para desarrollo local:
1. ✅ Configura Gmail con contraseña de aplicación
2. ✅ Agrega SMTP en Supabase Settings → Auth
3. ✅ Agrega URLs de redirección
4. ✅ Prueba el forgot-password

Para producción:
1. ✅ Usa servicio SMTP dedicado (SendGrid, Mailgun, etc.)
2. ✅ Verifica dominio de email
3. ✅ Configura SPF/DKIM para evitar spam
4. ✅ Actualiza Site URL y Redirect URLs con dominio real
