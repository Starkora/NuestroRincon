'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import FloatingChat from '@/components/FloatingChat'
import NotificationCenter from '@/components/NotificationCenter'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [daysTogether, setDaysTogether] = useState(0)
  const [currentPersonName, setCurrentPersonName] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Verificar si seleccionó persona
    const currentPerson = localStorage.getItem('current_person')
    if (!currentPerson) {
      router.push('/auth/select-person')
      return
    }

    // Obtener nombre de la persona actual
    const personName = currentPerson === 'person1' 
      ? user.user_metadata?.person1_name 
      : user.user_metadata?.person2_name
    setCurrentPersonName(personName || 'Usuario')

    setUser(user)
    
    // Calcular días juntos
    const startDate = user.user_metadata?.start_date
    if (startDate) {
      const start = new Date(startDate)
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysTogether(diffDays)
    }
    
    setLoading(false)
  }

  const handleLogout = async () => {
    localStorage.removeItem('current_person')
    await supabase.auth.signOut()
    router.push('/')
  }

  const changePerson = () => {
    localStorage.removeItem('current_person')
    router.push('/auth/select-person')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-2xl text-purple-900">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <h1 className="text-2xl font-bold text-purple-900">Nuestro Rincón</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && <NotificationCenter currentUserId={user.id} />}
            <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-purple-900">{currentPersonName}</span>
              <button
                onClick={changePerson}
                className="text-purple-600 hover:text-purple-800 cursor-pointer"
                title="Cambiar de persona"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-3xl font-bold text-purple-900">
              {user?.user_metadata?.couple_name || 'Bienvenidos'}
            </h2>
            <svg className="w-8 h-8 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl p-6">
              <p className="text-lg text-purple-900 mb-2">
                {user?.user_metadata?.person1_name || 'Persona 1'} & {user?.user_metadata?.person2_name || 'Persona 2'}
              </p>
              <p className="text-4xl font-bold text-purple-600">{daysTogether} días juntos</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-6">
              <p className="text-lg text-purple-900 mb-2">Desde</p>
              <p className="text-2xl font-bold text-purple-600">
                {user?.user_metadata?.start_date ? new Date(user.user_metadata.start_date).toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                }) : 'No especificado'}
              </p>
            </div>
          </div>
          
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              <p className="text-sm text-purple-800">
                <strong>Espacio compartido:</strong> Todo lo que escriban aquí será visible para ambos. 
                Esta es su cuenta compartida para guardar recuerdos, planes y momentos especiales juntos.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon="bell"
            title="Recordatorios"
            description="Aniversarios y fechas especiales"
            href="/dashboard/recordatorios"
          />
          <FeatureCard
            icon="lightning"
            title="Metas y Desafíos"
            description="Retos compartidos con recompensas"
            href="/dashboard/desafios"
          />
          <FeatureCard
            icon="calendarShared"
            title="Calendario Compartido"
            description="Planifica citas y eventos juntos"
            href="/dashboard/calendario"
          />
          <FeatureCard
            icon="question"
            title="Pregunta del Día"
            description="Conocérse mejor cada día"
            href="/dashboard/pregunta-del-dia"
          />
          <FeatureCard
            icon="wishlist"
            title="Lista de Deseos"
            description="Sueños y deseos compartidos"
            href="/dashboard/lista-deseos"
          />
          <FeatureCard
            icon="mood"
            title="Mood Tracker"
            description="Rastrea tu estado de ánimo diario"
            href="/dashboard/mood-tracker"
          />
          <FeatureCard
            icon="music"
            title="Música y Playlists"
            description="Canciones especiales compartidas"
            href="/dashboard/musica"
          />
          <FeatureCard
            icon="calendar"
            title="Timeline"
            description="Momentos especiales de su relación"
            href="/dashboard/timeline"
          />
          <FeatureCard
            icon="checklist"
            title="Bucket List"
            description="Cosas que quieren hacer juntos"
            href="/dashboard/bucket-list"
          />
          <FeatureCard
            icon="photo"
            title="Álbum"
            description="Galería privada de fotos"
            href="/dashboard/album"
          />
          <FeatureCard
            icon="message"
            title="Mensajes"
            description="Notas de amor secretas"
            href="/dashboard/messages"
          />
          <FeatureCard
            icon="game"
            title="Juegos"
            description="Actividades para parejas"
            href="/dashboard/games"
          />
          <FeatureCard
            icon="diary"
            title="Diario"
            description="Experiencias compartidas"
            href="/dashboard/diary"
          />
        </div>
      </main>
      
      {/* Chat flotante */}
      <FloatingChat currentUserName={currentPersonName} />
    </div>
  )
}

function FeatureCard({ icon, title, description, comingSoon, href }: { 
  icon: string
  title: string
  description: string
  comingSoon?: boolean
  href?: string
}) {
  const renderIcon = () => {
    const iconClass = "w-12 h-12"
    switch(icon) {
      case 'bell':
        return (
          <svg className={`${iconClass} text-red-600`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        )
      case 'lightning':
        return (
          <svg className={`${iconClass} text-yellow-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'calendarShared':
        return (
          <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'question':
        return (
          <svg className={`${iconClass} text-indigo-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'wishlist':
        return (
          <svg className={`${iconClass} text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        )
      case 'mood':
        return (
          <svg className={`${iconClass} text-blue-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
          </svg>
        )
      case 'music':
        return (
          <svg className={`${iconClass} text-pink-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        )
      case 'calendar':
        return (
          <svg className={`${iconClass} text-purple-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        )
      case 'checklist':
        return (
          <svg className={`${iconClass} text-green-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
          </svg>
        )
      case 'photo':
        return (
          <svg className={`${iconClass} text-blue-600`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        )
      case 'message':
        return (
          <svg className={`${iconClass} text-pink-600`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        )
      case 'game':
        return (
          <svg className={`${iconClass} text-indigo-600`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        )
      case 'diary':
        return (
          <svg className={`${iconClass} text-purple-600`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        )
      default:
        return <div className="text-4xl">{icon}</div>
    }
  }

  const content = (
    <>
      {comingSoon && (
        <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
          Próximamente
        </div>
      )}
      <div className="mb-4">{renderIcon()}</div>
      <h3 className="text-xl font-bold text-purple-900 mb-2">{title}</h3>
      <p className="text-purple-700">{description}</p>
    </>
  )

  if (href && !comingSoon) {
    return (
      <Link href={href} className="block bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer relative">
        {content}
      </Link>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer relative">
      {content}
    </div>
  )
}
