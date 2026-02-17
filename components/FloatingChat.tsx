'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  message: string
  sender_name: string
  is_read: boolean
  created_at: string
}

interface FloatingChatProps {
  currentUserName?: string
}

export default function FloatingChat({ currentUserName }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [partnerOnline, setPartnerOnline] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const router = useRouter()

  useEffect(() => {
    checkUnreadMessages()
    checkPartnerStatus()
    if (isOpen) {
      fetchMessages()
      markMessagesAsRead() // Marcar como leídos al abrir
    }
    
    // Actualizar cada 10 segundos
    const interval = setInterval(() => {
      checkUnreadMessages()
      checkPartnerStatus()
      updateOnlineStatus()
      if (isOpen) {
        fetchMessages()
      }
    }, 10000)

    // Marcar como en línea al cargar
    updateOnlineStatus()

    return () => clearInterval(interval)
  }, [isOpen])

  const markMessagesAsRead = async () => {
    try {
      // Marcar como leídos todos los mensajes que NO son del usuario actual
      const { error } = await supabase
        .from('love_messages')
        .update({ is_read: true })
        .eq('is_read', false)
        .neq('sender_name', currentUserName || '')

      if (error) throw error
      
      // Actualizar el contador de no leídos
      setUnreadCount(0)
    } catch (error) {
      
    }
  }

  const checkUnreadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('love_messages')
        .select('id, is_read, sender_name')
        .eq('is_read', false)

      if (error) throw error
      
      // Solo contar mensajes que NO enviaste tú
      const unread = data?.filter(msg => msg.sender_name !== currentUserName).length || 0
      setUnreadCount(unread)
    } catch (error) {
      
    }
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('love_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(20)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      
    }
  }

  const updateOnlineStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentPerson = localStorage.getItem('current_person')
      const field = currentPerson === 'person1' ? 'person1_last_seen' : 'person2_last_seen'

      // Actualizar timestamp en user_metadata
      await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          [field]: new Date().toISOString()
        }
      })
    } catch (error) {
      
    }
  }

  const checkPartnerStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentPerson = localStorage.getItem('current_person')
      const partnerField = currentPerson === 'person1' ? 'person2_last_seen' : 'person1_last_seen'
      
      const partnerLastSeen = user.user_metadata?.[partnerField]
      if (partnerLastSeen) {
        const lastSeen = new Date(partnerLastSeen)
        const now = new Date()
        const diffMinutes = (now.getTime() - lastSeen.getTime()) / 1000 / 60
        
        // Considerar en línea si estuvo activo hace menos de 2 minutos
        setPartnerOnline(diffMinutes < 2)
      }
    } catch (error) {
      
    }
  }

  const handleSendQuickMessage = async () => {
    if (!message.trim()) return
    
    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error } = await supabase
        .from('love_messages')
        .insert([
          {
            user_id: user.id,
            message: message.trim(),
            sender_name: currentUserName || 'Usuario',
          }
        ])

      if (error) throw error

      setMessage('')
      
      // Recargar mensajes inmediatamente
      await fetchMessages()
    } catch (error: any) {
      
      alert('Error al enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  const goToMessages = () => {
    router.push('/dashboard/messages')
  }

  return (
    <>
      {/* Botón flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="relative bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition cursor-pointer"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            
            {/* Badge de mensajes no leídos */}
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}

            {/* Indicador de pareja en línea */}
            {partnerOnline && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </button>
        )}

        {/* Panel de chat */}
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden flex flex-col" style={{ maxHeight: '600px' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-white font-bold">Chat</h3>
                  {partnerOnline && (
                    <p className="text-white text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      En línea
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-pink-200 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-pink-50 to-purple-50" style={{ minHeight: '300px', maxHeight: '400px' }}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-purple-400">
                  <p className="text-sm">No hay mensajes aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_name === currentUserName ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${
                        msg.sender_name === currentUserName
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-white text-gray-800 border border-purple-200'
                      } rounded-2xl px-4 py-2 shadow-sm`}>
                        <p className={`text-xs font-semibold mb-1 ${
                          msg.sender_name === currentUserName ? 'text-pink-100' : 'text-purple-600'
                        }`}>
                          {msg.sender_name}
                        </p>
                        <p className="text-sm break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_name === currentUserName ? 'text-pink-200' : 'text-gray-400'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Área de escritura */}
            <div className="p-4 bg-white border-t border-purple-100">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje de amor..."
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 resize-none"
              />
              <p className="text-xs text-purple-600 mt-1 mb-3">
                {message.length}/500 caracteres
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleSendQuickMessage}
                  disabled={sending || !message.trim()}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {sending ? 'Enviando...' : 'Enviar 💌'}
                </button>
                <button
                  onClick={goToMessages}
                  className="px-4 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition cursor-pointer"
                  title="Ver todos los mensajes"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
