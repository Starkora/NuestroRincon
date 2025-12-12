'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FloatingChat from '@/components/FloatingChat'

const truths = [
  "¿Cuál es tu mayor inseguridad en nuestra relación?",
  "¿Qué es algo que nunca me has dicho pero quieres decirme?",
  "¿Cuál fue tu primera impresión de mí?",
  "¿Hay algo de tu pasado que aún te afecta?",
  "¿Qué es lo más atractivo que ves en mí?",
  "¿Cuál es tu fantasía romántica?",
  "¿Qué es algo que te gustaría mejorar de ti mismo/a?",
  "¿Cuál es el mejor regalo que me has dado (y por qué)?",
  "¿Qué es algo que te pone celoso/a?",
  "¿Cuál es tu mayor arrepentimiento?",
  "¿Qué te enamoró de mí?",
  "¿Hay algo que quieras cambiar de nuestra relación?",
  "¿Cuál es tu mayor miedo sobre el futuro?",
  "¿Qué es lo más romántico que alguien ha hecho por ti?",
  "¿Qué secreto guardas que nadie más sabe?"
]

const dares = [
  "Dale un masaje de 5 minutos a tu pareja",
  "Canta una canción romántica para tu pareja",
  "Envía un mensaje de amor a tu pareja ahora mismo",
  "Haz un cumplido sincero sobre 3 cosas que amas de tu pareja",
  "Baila una canción lenta juntos ahora",
  "Comparte tu foto más vergonzosa con tu pareja",
  "Cuenta un chiste (por malo que sea)",
  "Haz una promesa romántica para la próxima semana",
  "Escribe un poema corto para tu pareja (4 líneas mínimo)",
  "Planea una cita sorpresa para la próxima semana",
  "Dale 10 besos en lugares diferentes (rostro, manos, etc.)",
  "Cocina o prepara algo especial para tu pareja",
  "Recrea su primera cita juntos esta semana",
  "Comparte 5 razones por las que amas a tu pareja",
  "Haz una promesa de algo que harás para mejorar la relación"
]

export default function TruthDareGame() {
  const [loading, setLoading] = useState(true)
  const [currentPersonName, setCurrentPersonName] = useState('')
  const [gameMode, setGameMode] = useState<'select' | 'truth' | 'dare'>('select')
  const [currentChallenge, setCurrentChallenge] = useState('')
  const [truthCount, setTruthCount] = useState(0)
  const [dareCount, setDareCount] = useState(0)
  const [customTruths, setCustomTruths] = useState<string[]>([])
  const [customDares, setCustomDares] = useState<string[]>([])
  const [allTruths, setAllTruths] = useState<string[]>(truths)
  const [allDares, setAllDares] = useState<string[]>(dares)
  const [showCustomPanel, setShowCustomPanel] = useState(false)
  const [customMode, setCustomMode] = useState<'truth' | 'dare'>('truth')
  const [newCustomText, setNewCustomText] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadCustomContent()
  }, [])

  useEffect(() => {
    setAllTruths([...truths, ...customTruths])
  }, [customTruths])

  useEffect(() => {
    setAllDares([...dares, ...customDares])
  }, [customDares])

  const loadCustomContent = () => {
    const savedTruths = localStorage.getItem('custom_truths')
    const savedDares = localStorage.getItem('custom_dares')
    if (savedTruths) setCustomTruths(JSON.parse(savedTruths))
    if (savedDares) setCustomDares(JSON.parse(savedDares))
  }

  const saveCustomTruths = (items: string[]) => {
    localStorage.setItem('custom_truths', JSON.stringify(items))
    setCustomTruths(items)
  }

  const saveCustomDares = (items: string[]) => {
    localStorage.setItem('custom_dares', JSON.stringify(items))
    setCustomDares(items)
  }

  const addCustomItem = () => {
    if (!newCustomText.trim() || newCustomText.trim().length < 10) return
    
    if (customMode === 'truth') {
      const updated = [...customTruths, newCustomText.trim()]
      saveCustomTruths(updated)
    } else {
      const updated = [...customDares, newCustomText.trim()]
      saveCustomDares(updated)
    }
    setNewCustomText('')
  }

  const deleteCustomTruth = (index: number) => {
    const updated = customTruths.filter((_, i) => i !== index)
    saveCustomTruths(updated)
  }

  const deleteCustomDare = (index: number) => {
    const updated = customDares.filter((_, i) => i !== index)
    saveCustomDares(updated)
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    const currentPerson = localStorage.getItem('current_person')
    const personName = currentPerson === 'person1' 
      ? user.user_metadata?.person1_name 
      : user.user_metadata?.person2_name
    setCurrentPersonName(personName || 'Usuario')
    setLoading(false)
  }

  const selectTruth = () => {
    const randomTruth = allTruths[Math.floor(Math.random() * allTruths.length)]
    setCurrentChallenge(randomTruth)
    setGameMode('truth')
    setTruthCount(truthCount + 1)
  }

  const selectDare = () => {
    const randomDare = allDares[Math.floor(Math.random() * allDares.length)]
    setCurrentChallenge(randomDare)
    setGameMode('dare')
    setDareCount(dareCount + 1)
  }

  const resetGame = () => {
    setGameMode('select')
    setCurrentChallenge('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/games"
            className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-4 cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Juegos
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-purple-900">Verdad o Reto</h1>
          </div>
          <p className="text-purple-700">El clásico juego con un toque romántico para parejas</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl p-4 text-white shadow-lg">
            <div className="text-3xl font-bold">{truthCount}</div>
            <div className="text-sm">Verdades</div>
          </div>
          <div className="bg-gradient-to-r from-pink-400 to-rose-500 rounded-2xl p-4 text-white shadow-lg">
            <div className="text-3xl font-bold">{dareCount}</div>
            <div className="text-sm">Retos</div>
          </div>
        </div>

        {/* Game Area */}
        {gameMode === 'select' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
              <h2 className="text-3xl font-bold text-purple-900 mb-6">
                ¿Qué eliges?
              </h2>
              <p className="text-purple-600 mb-8">
                Selecciona una opción para comenzar
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={selectTruth}
                  className="group bg-gradient-to-br from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
                >
                  <div className="text-6xl mb-4 flex items-center justify-center">
                    <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Verdad</h3>
                  <p className="text-sm text-blue-100">
                    Responde con honestidad
                  </p>
                </button>

                <button
                  onClick={selectDare}
                  className="group bg-gradient-to-br from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
                >
                  <div className="text-6xl mb-4 flex items-center justify-center">
                    <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Reto</h3>
                  <p className="text-sm text-pink-100">
                    Atrévete a hacer algo
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {gameMode === 'truth' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-2xl p-8 border-4 border-indigo-300">
              <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-full px-6 py-2 text-sm font-semibold mb-4">
                  VERDAD
                </div>
              </div>
              
              <div className="min-h-[200px] flex items-center justify-center mb-6">
                <h2 className="text-3xl font-bold text-indigo-900 text-center leading-relaxed">
                  {currentChallenge}
                </h2>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={resetGame}
                  className="flex-1 bg-white hover:bg-gray-50 text-indigo-600 py-4 rounded-xl font-semibold transition cursor-pointer shadow-lg border-2 border-indigo-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Elegir de nuevo
                </button>
                <button
                  onClick={selectTruth}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  Siguiente Verdad
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {gameMode === 'dare' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl shadow-2xl p-8 border-4 border-rose-300">
              <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-full px-6 py-2 text-sm font-semibold mb-4">
                  RETO
                </div>
              </div>
              
              <div className="min-h-[200px] flex items-center justify-center mb-6">
                <h2 className="text-3xl font-bold text-rose-900 text-center leading-relaxed">
                  {currentChallenge}
                </h2>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={resetGame}
                  className="flex-1 bg-white hover:bg-gray-50 text-rose-600 py-4 rounded-xl font-semibold transition cursor-pointer shadow-lg border-2 border-rose-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Elegir de nuevo
                </button>
                <button
                  onClick={selectDare}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white py-4 rounded-xl font-semibold transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  Siguiente Reto
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-white/80 backdrop-blur rounded-2xl p-6 border-2 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="text-3xl">💝</div>
            <div>
              <h3 className="font-bold text-purple-900 mb-2">Reglas del juego:</h3>
              <ul className="space-y-2 text-purple-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Tomen turnos eligiendo verdad o reto</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Sean honestos con las verdades - este juego es para conectar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Completen los retos con amor y diversión</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Respeten los límites del otro siempre</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Custom Content Button */}
        <button
          onClick={() => setShowCustomPanel(!showCustomPanel)}
          className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showCustomPanel ? 'Ocultar Contenido Personalizado' : 'Agregar Verdades y Retos Personalizados'}
        </button>

        {/* Custom Content Panel */}
        {showCustomPanel && (
          <div className="mt-6 bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
            {/* Mode Selector */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setCustomMode('truth')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  customMode === 'truth'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                Verdades ({customTruths.length})
              </button>
              <button
                onClick={() => setCustomMode('dare')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  customMode === 'dare'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                Retos ({customDares.length})
              </button>
            </div>

            {/* Add Form */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-purple-700 mb-3">
                {customMode === 'truth' ? 'Nueva Verdad' : 'Nuevo Reto'}
              </h3>
              <textarea
                value={newCustomText}
                onChange={(e) => setNewCustomText(e.target.value)}
                placeholder={customMode === 'truth' ? 'Escribe una pregunta de verdad...' : 'Escribe un reto...'}
                className="w-full p-4 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none resize-none"
                rows={3}
                maxLength={200}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">{newCustomText.length}/200 caracteres</span>
                <button
                  onClick={addCustomItem}
                  disabled={newCustomText.trim().length < 10}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar {customMode === 'truth' ? 'Verdad' : 'Reto'}
                </button>
              </div>
            </div>

            {/* Custom Items List */}
            {customMode === 'truth' && customTruths.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-purple-700 mb-3">
                  Mis Verdades ({customTruths.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {customTruths.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <span className="flex-1 text-gray-700">{item}</span>
                      <button
                        onClick={() => deleteCustomTruth(index)}
                        className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {customMode === 'dare' && customDares.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-purple-700 mb-3">
                  Mis Retos ({customDares.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {customDares.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                    >
                      <span className="flex-1 text-gray-700">{item}</span>
                      <button
                        onClick={() => deleteCustomDare(index)}
                        className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {((customMode === 'truth' && customTruths.length === 0) || (customMode === 'dare' && customDares.length === 0)) && (
              <p className="text-center text-gray-500 py-4">
                No has agregado {customMode === 'truth' ? 'verdades' : 'retos'} personalizados aún.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Chat flotante */}
      <FloatingChat currentUserName={currentPersonName} />
    </div>
  )
}
