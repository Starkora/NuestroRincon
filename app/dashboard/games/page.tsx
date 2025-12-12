'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FloatingChat from '@/components/FloatingChat'

export default function GamesPage() {
  const [loading, setLoading] = useState(true)
  const [coupleName, setCoupleName] = useState('')
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
    setCoupleName(user.user_metadata?.couple_name || 'Juegos para Parejas')
    
    const currentPerson = localStorage.getItem('current_person')
    const personName = currentPerson === 'person1' 
      ? user.user_metadata?.person1_name 
      : user.user_metadata?.person2_name
    setCurrentPersonName(personName || 'Usuario')
    setLoading(false)
  }

  const games = [
    {
      id: 'questions',
      title: '21 Preguntas',
      description: 'Conócense mejor con preguntas profundas y divertidas',
      icon: 'question',
      color: 'from-pink-400 to-rose-500',
      href: '/dashboard/games/questions'
    },
    {
      id: 'truth-dare',
      title: 'Verdad o Reto',
      description: 'El clásico juego para parejas con un toque romántico',
      icon: 'mask',
      color: 'from-purple-400 to-pink-500',
      href: '/dashboard/games/truth-dare'
    },
    {
      id: 'love-calculator',
      title: 'Calculadora del Amor',
      description: '¿Cuánto se conocen realmente? Descúbrelo con este test',
      icon: 'heart',
      color: 'from-red-400 to-pink-500',
      href: '/dashboard/games/love-quiz'
    },
    {
      id: 'date-ideas',
      title: 'Generador de Citas',
      description: 'Ideas aleatorias para su próxima cita romántica',
      icon: 'dice',
      color: 'from-indigo-400 to-purple-500',
      href: '/dashboard/games/date-ideas'
    },
    {
      id: 'compatibility',
      title: 'Test de Compatibilidad',
      description: 'Descubran qué tan compatibles son en diferentes áreas',
      icon: 'hearts',
      color: 'from-pink-500 to-purple-500',
      href: '/dashboard/games/compatibility'
    },
    {
      id: 'memory',
      title: 'Memoria de Pareja',
      description: '¿Recuerdas esos momentos especiales? Pon a prueba tu memoria',
      icon: 'brain',
      color: 'from-blue-400 to-indigo-500',
      href: '/dashboard/games/memory'
    }
  ]

  const renderIcon = (iconName: string) => {
    const iconClass = "w-8 h-8"
    switch(iconName) {
      case 'question':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        )
      case 'mask':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        )
      case 'heart':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        )
      case 'dice':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        )
      case 'hearts':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        )
      case 'brain':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        )
      default:
        return <span className="text-3xl">{iconName}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-4 cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-purple-900">{coupleName}</h1>
          </div>
          <p className="text-purple-700">Diviértanse juntos con estos juegos diseñados para parejas</p>
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
            >
              <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${game.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {renderIcon(game.icon)}
              </div>
              <h3 className="text-xl font-bold text-purple-900 mb-2">{game.title}</h3>
              <p className="text-purple-600 text-sm">{game.description}</p>
              <div className="mt-4 flex items-center text-purple-500 group-hover:text-purple-700 transition">
                <span className="text-sm font-semibold">Jugar ahora</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-white/80 backdrop-blur rounded-2xl p-6 border-2 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="font-bold text-purple-900 mb-2">Consejos para disfrutar al máximo:</h3>
              <ul className="space-y-2 text-purple-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Creen un ambiente cómodo y relajado para jugar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Sean honestos y diviértanse - no hay respuestas incorrectas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Respeten los límites del otro y comuníquense abiertamente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Usen estos juegos como oportunidad para conectar más profundamente</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Chat flotante */}
      <FloatingChat currentUserName={currentPersonName} />
    </div>
  )
}
