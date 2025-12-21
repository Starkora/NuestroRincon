'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import { Bell } from 'lucide-react'
import FloatingChat from '@/components/FloatingChat'

interface Reminder {
  id: string
  title: string
  description: string | null
  reminder_date: string
  reminder_time: string | null
  type: 'anniversary' | 'birthday' | 'custom' | 'monthly' | 'yearly'
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  is_active: boolean
  created_at: string
}

export default function RecordatoriosPage() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentPersonName, setCurrentPersonName] = useState('')
  
  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [type, setType] = useState<'anniversary' | 'birthday' | 'custom' | 'monthly' | 'yearly'>('custom')
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none')

  useEffect(() => {
    if (user) {
      fetchReminders()
      const currentPerson = localStorage.getItem('current_person')
      const personName = currentPerson === 'person1' 
        ? user.user_metadata?.person1_name 
        : user.user_metadata?.person2_name
      setCurrentPersonName(personName || 'Usuario')
    }
  }, [user])

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user?.id)
        .order('reminder_date', { ascending: true })

      if (error) throw error
      setReminders(data || [])
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos obligatorios
    if (!title.trim()) {
      toast.error('Por favor ingresa un título para el recordatorio', {
        duration: 3000,
        position: 'top-center',
      })
      return
    }
    
    if (!reminderDate) {
      toast.error('Por favor selecciona una fecha', {
        duration: 3000,
        position: 'top-center',
      })
      return
    }
    
    try {
      const reminderData = {
        user_id: user?.id,
        title,
        description: description || null,
        reminder_date: reminderDate,
        reminder_time: reminderTime || null,
        type,
        recurrence,
        is_active: true
      }

      if (editingId) {
        const { error } = await supabase
          .from('reminders')
          .update(reminderData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('reminders')
          .insert([reminderData])

        if (error) throw error
      }

      // Reset form
      setTitle('')
      setDescription('')
      setReminderDate('')
      setReminderTime('')
      setType('custom')
      setRecurrence('none')
      setShowForm(false)
      setEditingId(null)
      
      fetchReminders()
      toast.success(editingId ? 'Recordatorio actualizado exitosamente' : 'Recordatorio creado exitosamente', {
        duration: 3000,
        position: 'top-center',
        icon: <Bell className="w-5 h-5" />,
      })
    } catch (error) {
      console.error('Error saving reminder:', error)
      toast.error('Error al guardar el recordatorio', {
        duration: 3000,
        position: 'top-center',
      })
    }
  }

  const handleEdit = (reminder: Reminder) => {
    setEditingId(reminder.id)
    setTitle(reminder.title)
    setDescription(reminder.description || '')
    // Asegurarse de que la fecha se muestre correctamente sin conversión de zona horaria
    setReminderDate(reminder.reminder_date)
    setReminderTime(reminder.reminder_time || '')
    setType(reminder.type)
    setRecurrence(reminder.recurrence)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este recordatorio?')) {
      try {
        const { error } = await supabase
          .from('reminders')
          .delete()
          .eq('id', id)

        if (error) throw error
        fetchReminders()
        toast.success('Recordatorio eliminado', {
          duration: 2000,
          position: 'top-center',
        })
      } catch (error) {
        console.error('Error deleting reminder:', error)
        toast.error('Error al eliminar el recordatorio', {
          duration: 3000,
          position: 'top-center',
        })
      }
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchReminders()
    } catch (error) {
      console.error('Error toggling reminder:', error)
    }
  }

  const getDaysUntil = (date: string) => {
    // Crear fechas locales sin conversión de zona horaria
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [year, month, day] = date.split('-')
    const reminderDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    reminderDate.setHours(0, 0, 0, 0)
    
    const diffTime = reminderDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Pasado'
    if (diffDays === 0) return '¡Hoy!'
    if (diffDays === 1) return 'Mañana'
    return `En ${diffDays} días`
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anniversary':
        return (
          <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        )
      case 'birthday':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
          </svg>
        )
      case 'monthly':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'yearly':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        )
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'anniversary':
        return 'Aniversario'
      case 'birthday':
        return 'Cumpleaños'
      case 'monthly':
        return 'Mensual'
      case 'yearly':
        return 'Anual'
      default:
        return 'Personalizado'
    }
  }

  const getRecurrenceLabel = (recurrence: string) => {
    switch (recurrence) {
      case 'daily':
        return 'Diario'
      case 'weekly':
        return 'Semanal'
      case 'monthly':
        return 'Mensual'
      case 'yearly':
        return 'Anual'
      default:
        return 'Sin repetir'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-purple-600">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <Toaster
        toastOptions={{
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-purple-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-purple-600 hover:text-purple-800 cursor-pointer flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </Link>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h1 className="text-2xl font-bold text-purple-900">Recordatorios</h1>
            </div>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              if (showForm) {
                setEditingId(null)
                setTitle('')
                setDescription('')
                setReminderDate('')
                setReminderTime('')
                setType('custom')
                setRecurrence('none')
              }
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition cursor-pointer flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showForm ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              )}
            </svg>
            {showForm ? 'Cancelar' : 'Nuevo Recordatorio'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-purple-900 mb-4">
              {editingId ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
            </h2>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="Ej: Aniversario de 6 meses"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="Detalles adicionales..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora (opcional)
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  >
                    <option value="custom">Personalizado</option>
                    <option value="anniversary">Aniversario</option>
                    <option value="birthday">Cumpleaños</option>
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repetir
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  >
                    <option value="none">No repetir</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensualmente</option>
                    <option value="yearly">Anualmente</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition cursor-pointer"
              >
                {editingId ? 'Guardar Cambios' : 'Crear Recordatorio'}
              </button>
            </form>
          </div>
        )}

        {/* Reminders List */}
        <div className="space-y-4">
          {reminders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No tienes recordatorios
              </h3>
              <p className="text-gray-600">
                Crea tu primer recordatorio para nunca olvidar fechas importantes
              </p>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`bg-white rounded-xl shadow-md p-6 transition hover:shadow-lg ${
                  !reminder.is_active ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-shrink-0">{getTypeIcon(reminder.type)}</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {reminder.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            {getTypeLabel(reminder.type)}
                          </span>
                          {reminder.recurrence !== 'none' && (
                            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                              {getRecurrenceLabel(reminder.recurrence)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {reminder.description && (
                      <p className="text-gray-600 text-sm mb-3 ml-12">
                        {reminder.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 ml-12 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {(() => {
                            // Crear fecha local sin conversión de zona horaria
                            const [year, month, day] = reminder.reminder_date.split('-')
                            const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                            return localDate.toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          })()}
                        </span>
                      </div>
                      {reminder.reminder_time && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{reminder.reminder_time}</span>
                        </div>
                      )}
                      <div className="font-semibold text-purple-600">
                        {getDaysUntil(reminder.reminder_date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(reminder.id, reminder.is_active)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition cursor-pointer ${
                        reminder.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {reminder.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      onClick={() => handleEdit(reminder)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Chat flotante */}
      <FloatingChat currentUserName={currentPersonName} />
    </div>
  )
}
