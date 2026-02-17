import { supabase } from './supabase'

export type NotificationType = 'timeline' | 'message' | 'album' | 'diary' | 'other'

interface SendNotificationParams {
  userId: string
  title: string
  message: string
  type: NotificationType
  link?: string
}

/**
 * Envía una notificación a un usuario específico
 */
export async function sendNotification({
  userId,
  title,
  message,
  type,
  link
}: SendNotificationParams) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        link: link || null,
        is_read: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    
    return { success: false, error }
  }
}

/**
 * Envía una notificación a la pareja (el otro usuario)
 * Requiere que ambos usuarios compartan el mismo couple_name
 */
export async function sendNotificationToPartner({
  currentUserId,
  title,
  message,
  type,
  link
}: Omit<SendNotificationParams, 'userId'> & { currentUserId: string }) {
  try {
    // Obtener información del usuario actual
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) return { success: false, error: 'Usuario no encontrado' }

    const coupleName = currentUser.user.user_metadata?.couple_name
    if (!coupleName) return { success: false, error: 'No hay nombre de pareja configurado' }

    // Buscar al otro usuario con el mismo couple_name
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('couple_name', coupleName)
      .neq('id', currentUserId)
      .limit(1)

    if (usersError || !users || users.length === 0) {
      
      return { success: false, error: 'Pareja no encontrada' }
    }

    const partnerId = users[0].id

    // Enviar notificación a la pareja
    return await sendNotification({
      userId: partnerId,
      title,
      message,
      type,
      link
    })
  } catch (error) {
    
    return { success: false, error }
  }
}
