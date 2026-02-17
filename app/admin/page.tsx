'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PendingUser {
  id: string
  email: string
  couple_name: string
  person1_name: string
  person2_name: string
  start_date: string
  created_at: string
  is_approved: boolean
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [approvedUsers, setApprovedUsers] = useState<PendingUser[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending')
  const router = useRouter()

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Verificar si el usuario es administrador
    const adminEmail = user.email
    const isUserAdmin = adminEmail === 'admin@nuestrorincon.com' || user.user_metadata?.is_admin === true

    if (!isUserAdmin) {
      alert('No tienes permisos de administrador')
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)
    await fetchUsers()
    setLoading(false)
  }

  const fetchUsers = async () => {
    // Obtener usuarios pendientes
    const { data: pending, error: pendingError } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false })

    if (pendingError) {
      
    } else {
      setPendingUsers(pending || [])
    }

    // Obtener usuarios aprobados
    const { data: approved, error: approvedError } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (approvedError) {
      
    } else {
      setApprovedUsers(approved || [])
    }
  }

  const approveUser = async (userId: string, email: string) => {
    if (!confirm('¿Aprobar este registro?')) return

    // Actualizar estado en la base de datos
    const { error: updateError } = await supabase
      .from('pending_registrations')
      .update({ is_approved: true, approved_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      
      alert('Error al aprobar el usuario')
      return
    }

    // Enviar email de aprobación (opcional)
    alert(`Usuario ${email} aprobado exitosamente`)
    await fetchUsers()
  }

  const rejectUser = async (userId: string, email: string) => {
    if (!confirm('¿Rechazar este registro? Esta acción no se puede deshacer.')) return

    const { error } = await supabase
      .from('pending_registrations')
      .delete()
      .eq('id', userId)

    if (error) {
      
      alert('Error al rechazar el usuario')
      return
    }

    alert(`Usuario ${email} rechazado`)
    await fetchUsers()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600">Gestión de registros de usuarios</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{pendingUsers.length}</div>
                <div className="text-sm text-gray-600">Registros Pendientes</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{approvedUsers.length}</div>
                <div className="text-sm text-gray-600">Usuarios Aprobados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pendientes ({pendingUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'approved'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Aprobados ({approvedUsers.length})
            </button>
          </div>
        </div>

        {/* User List */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingUsers.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay registros pendientes</h3>
                <p className="text-gray-600">Todos los registros han sido procesados</p>
              </div>
            ) : (
              pendingUsers.map((user) => (
                <div key={user.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-gray-900">{user.couple_name}</h3>
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-semibold">
                          PENDIENTE
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Email</div>
                          <div className="font-semibold text-gray-900">{user.email}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Personas</div>
                          <div className="font-semibold text-gray-900">
                            {user.person1_name} & {user.person2_name}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Fecha de inicio</div>
                          <div className="font-semibold text-gray-900">
                            {new Date(user.start_date).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Fecha de registro</div>
                          <div className="font-semibold text-gray-900">{formatDate(user.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4 pt-4 border-t">
                    <button
                      onClick={() => approveUser(user.id, user.email)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Aprobar
                    </button>
                    <button
                      onClick={() => rejectUser(user.id, user.email)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Rechazar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'approved' && (
          <div className="space-y-4">
            {approvedUsers.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                <div className="text-6xl mb-4"></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay usuarios aprobados</h3>
                <p className="text-gray-600">Aún no se han aprobado registros</p>
              </div>
            ) : (
              approvedUsers.map((user) => (
                <div key={user.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">{user.couple_name}</h3>
                    <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                      APROBADO
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Email</div>
                      <div className="font-semibold text-gray-900">{user.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Personas</div>
                      <div className="font-semibold text-gray-900">
                        {user.person1_name} & {user.person2_name}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Fecha de inicio</div>
                      <div className="font-semibold text-gray-900">
                        {new Date(user.start_date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Registrado</div>
                      <div className="font-semibold text-gray-900">{formatDate(user.created_at)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
