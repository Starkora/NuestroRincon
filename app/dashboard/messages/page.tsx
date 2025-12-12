'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FloatingChat from '@/components/FloatingChat'

interface Message {
  id: string
  message: string
  sender_name: string
  is_read: boolean
  created_at: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [currentUserName, setCurrentUserName] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const router = useRouter()

  // Form states
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkUser()
    fetchMessages()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    const currentPerson = localStorage.getItem('current_person')
    if (!currentPerson) {
      router.push('/auth/select-person')
      return
    }

    const person1 = user.user_metadata?.person1_name || 'Persona 1'
    const person2 = user.user_metadata?.person2_name || 'Persona 2'
    
    // Establecer quién es el usuario actual y quién es su pareja
    if (currentPerson === 'person1') {
      setCurrentUserName(person1)
      setPartnerName(person2)
    } else {
      setCurrentUserName(person2)
      setPartnerName(person1)
    }
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('love_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error al cargar mensajes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error } = await supabase
        .from('love_messages')
        .insert([
          {
            user_id: user.id,
            message,
            sender_name: currentUserName,
          }
        ])

      if (error) throw error

      setMessage('')
      setShowForm(false)
      fetchMessages()
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error)
      alert('Error al enviar el mensaje: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('love_messages')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
      fetchMessages()
    } catch (error) {
      console.error('Error al marcar como leído:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este mensaje?')) return

    try {
      const { error } = await supabase
        .from('love_messages')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchMessages()
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar el mensaje')
    }
  }

  const unreadCount = messages.filter(m => !m.is_read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-purple-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-purple-600 hover:text-purple-800 cursor-pointer flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </Link>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <h1 className="text-2xl font-bold text-purple-900">Mensajes de Amor</h1>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition cursor-pointer flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? 'Cancelar' : 'Nuevo Mensaje'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-purple-900 mb-2">
            {currentUserName} y {partnerName}
          </h2>
          <p className="text-purple-700">Mensajes especiales entre ustedes</p>
          {unreadCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-pink-100 text-pink-800 px-4 py-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {unreadCount} mensaje{unreadCount !== 1 ? 's' : ''} nuevo{unreadCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-purple-900 mb-4">
              Escribe un mensaje para {partnerName}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Tu mensaje *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  maxLength={1000}
                  rows={5}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="Escribe algo bonito..."
                />
                <p className="text-xs text-purple-600 mt-1">
                  {message.length}/1000 caracteres
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? 'Enviando...' : 'Enviar Mensaje 💌'}
              </button>
            </form>
          </div>
        )}

        {/* Lista de mensajes */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-purple-600 text-lg">Cargando mensajes...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="w-20 h-20 mx-auto text-purple-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <h3 className="text-2xl font-bold text-purple-900 mb-2">
              Aún no hay mensajes
            </h3>
            <p className="text-purple-700 mb-6">
              Comienza a dejar mensajes de amor para tu pareja
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition cursor-pointer"
            >
              Escribir Primer Mensaje
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition ${
                  !msg.is_read ? 'border-2 border-pink-300' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-purple-900">
                        De: {msg.sender_name}
                      </h3>
                      <p className="text-sm text-purple-600">
                        {new Date(msg.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!msg.is_read && (
                      <button
                        onClick={() => markAsRead(msg.id)}
                        className="text-pink-600 hover:text-pink-800 px-3 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 cursor-pointer text-sm flex items-center gap-1"
                        title="Marcar como leído"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Leído
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4">
                  <p className="text-purple-900 whitespace-pre-wrap">{msg.message}</p>
                </div>

                {!msg.is_read && (
                  <div className="mt-3 flex items-center gap-2 text-pink-600 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Mensaje nuevo
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Chat flotante */}
      <FloatingChat currentUserName={currentUserName} />
    </div>
  )
}
