# Instrucciones para Configurar el Sistema de Notificaciones

## Paso 1: Ejecutar Scripts SQL en Supabase

1. Abre tu proyecto en [Supabase](https://supabase.com)
2. Ve a **SQL Editor** en el menú lateral
3. Ejecuta los siguientes scripts **en orden**:

### Script 1: Tabla de Perfiles
Copia y pega el contenido de `sql/profiles_table.sql` y ejecuta.

Este script crea:
- Tabla `profiles` para almacenar información de parejas
- Índice para búsquedas rápidas por `couple_name`
- RLS policies para seguridad
- Trigger automático para sincronizar con `auth.users`

### Script 2: Tabla de Notificaciones
Copia y pega el contenido de `sql/notifications_table.sql` y ejecuta.

Este script crea:
- Tabla `notifications` con campos: id, user_id, title, message, type, is_read, link, created_at
- Índices para mejor rendimiento
- RLS policies (solo ves tus notificaciones)
- Función de limpieza de notificaciones antiguas (opcional)

## Paso 2: Verificar las Tablas

En el **Table Editor** de Supabase, deberías ver:
- `profiles` (con columnas: id, couple_name, person1_name, person2_name, start_date, created_at, updated_at)
- `notifications` (con columnas: id, user_id, title, message, type, is_read, link, created_at)

## Paso 3: Verificar RLS

En cada tabla, ve a **Policies** y verifica que existan:

### Profiles:
- "Users can view profiles with same couple_name"
- "Users can update own profile"
- "Users can insert own profile"

### Notifications:
- "Users can view own notifications"
- "Users can insert notifications"
- "Users can update own notifications"
- "Users can delete own notifications"

## Paso 4: Probar el Sistema

Una vez ejecutados los scripts:

1. El componente `NotificationCenter` ya está integrado en el dashboard (header)
2. Puedes usar la función `sendNotification()` para enviar notificaciones manualmente
3. Usa `sendNotificationToPartner()` para enviar a tu pareja automáticamente

### Ejemplo de uso:

```typescript
import { sendNotificationToPartner } from '@/lib/notifications'

// Enviar notificación cuando se agrega algo a timeline
await sendNotificationToPartner({
  currentUserId: user.id,
  title: 'Nuevo momento',
  message: 'Tu pareja agregó un nuevo momento especial',
  type: 'timeline',
  link: '/dashboard/timeline'
})
```

## Paso 5: Integrar Notificaciones en Features Existentes

Ahora puedes agregar notificaciones automáticas en:

### Timeline (app/dashboard/timeline/page.tsx)
Cuando se agrega un nuevo momento:
```typescript
await sendNotificationToPartner({
  currentUserId: user.id,
  title: 'Nuevo momento en Timeline',
  message: `${personName} agregó: "${title}"`,
  type: 'timeline',
  link: '/dashboard/timeline'
})
```

### Messages (components/FloatingChat.tsx)
Cuando se envía un mensaje:
```typescript
await sendNotificationToPartner({
  currentUserId: user.id,
  title: 'Nuevo mensaje',
  message: `${senderName}: ${content.substring(0, 50)}...`,
  type: 'message',
  link: '/dashboard' // El chat está en el dashboard
})
```

### Diary (app/dashboard/diary/page.tsx)
Cuando se crea una entrada compartida:
```typescript
if (isShared) {
  await sendNotificationToPartner({
    currentUserId: user.id,
    title: 'Nueva entrada en el Diario',
    message: `${personName} compartió: "${title}"`,
    type: 'diary',
    link: '/dashboard/diary'
  })
}
```

### Bucket List (app/dashboard/bucket-list/page.tsx)
Cuando se agrega o completa un ítem:
```typescript
await sendNotificationToPartner({
  currentUserId: user.id,
  title: 'Bucket List actualizada',
  message: `${personName} ${completed ? 'completó' : 'agregó'}: "${title}"`,
  type: 'other',
  link: '/dashboard/bucket-list'
})
```

### Albums (app/dashboard/albums/page.tsx)
Cuando se sube una foto:
```typescript
await sendNotificationToPartner({
  currentUserId: user.id,
  title: 'Nueva foto en Álbum',
  message: `${personName} subió una nueva foto`,
  type: 'album',
  link: '/dashboard/albums'
})
```

## Notas Importantes

- Las notificaciones se actualizan en **tiempo real** gracias a Supabase Realtime
- Las notificaciones antiguas (>30 días) se pueden limpiar ejecutando: `SELECT cleanup_old_notifications();`
- El badge rojo muestra el número de notificaciones sin leer
- Hacer clic en una notificación la marca como leída y navega al link
- El ícono de campana cambia de color cuando hay notificaciones sin leer

## Troubleshooting

### Error: column "user_metadata" does not exist
Si recibes este error al ejecutar `profiles_table.sql`, verifica que el script use `raw_user_meta_data` en lugar de `user_metadata`. Este error ya está corregido en la versión actual del script.

### Notificaciones no aparecen
Si las notificaciones no aparecen:
1. Verifica que las tablas existan en Supabase
2. Verifica que las RLS policies estén habilitadas
3. Revisa la consola del navegador para errores
4. Verifica que el user_id en las notificaciones coincida con el usuario actual
5. Asegúrate de ejecutar primero `profiles_table.sql` y luego `notifications_table.sql`
