'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FloatingChat from '@/components/FloatingChat'

const defaultQuestions = [
  {
    id: 1,
    question: "¿Cuál es el color favorito de tu pareja?",
    category: "Gustos Básicos"
  },
  {
    id: 2,
    question: "¿Cuál es la comida favorita de tu pareja?",
    category: "Gustos Básicos"
  },
  {
    id: 3,
    question: "¿Cuál es el mayor miedo de tu pareja?",
    category: "Emocional"
  },
  {
    id: 4,
    question: "¿Cuál es el mayor sueño de tu pareja?",
    category: "Emocional"
  },
  {
    id: 5,
    question: "¿Qué le gusta hacer a tu pareja en su tiempo libre?",
    category: "Gustos Básicos"
  },
  {
    id: 6,
    question: "¿Cuál es la película o serie favorita de tu pareja?",
    category: "Gustos Básicos"
  },
  {
    id: 7,
    question: "¿Cuál es el recuerdo más preciado de tu pareja?",
    category: "Emocional"
  },
  {
    id: 8,
    question: "¿Qué es lo que más le molesta a tu pareja?",
    category: "Emocional"
  },
  {
    id: 9,
    question: "¿Cuál es el lugar donde tu pareja se siente más feliz?",
    category: "Emocional"
  },
  {
    id: 10,
    question: "¿Cuál es la canción favorita de tu pareja?",
    category: "Gustos Básicos"
  }
]

export default function LoveQuizGame() {
  const [loading, setLoading] = useState(true)
  const [currentPersonName, setCurrentPersonName] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'results' | 'manage'>('intro')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [person1Answers, setPerson1Answers] = useState<string[]>([])
  const [person2Answers, setPerson2Answers] = useState<string[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [round, setRound] = useState<1 | 2>(1)
  const [questions, setQuestions] = useState(defaultQuestions)
  const [newQuestion, setNewQuestion] = useState('')
  const [newCategory, setNewCategory] = useState('Gustos Básicos')
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
    
    const currentPerson = localStorage.getItem('current_person')
    const person1Name = user.user_metadata?.person1_name || 'Persona 1'
    const person2Name = user.user_metadata?.person2_name || 'Persona 2'
    
    if (currentPerson === 'person1') {
      setCurrentPersonName(person1Name)
      setPartnerName(person2Name)
    } else {
      setCurrentPersonName(person2Name)
      setPartnerName(person1Name)
    }
    
    setLoading(false)
  }

  const startGame = () => {
    setGameState('playing')
    setCurrentQuestion(0)
    setPerson1Answers([])
    setPerson2Answers([])
    setCurrentAnswer('')
    setRound(1)
  }

  const submitAnswer = () => {
    if (!currentAnswer.trim()) return

    if (round === 1) {
      const newAnswers = [...person1Answers, currentAnswer.trim()]
      setPerson1Answers(newAnswers)
      
      if (newAnswers.length === questions.length) {
        // Termina ronda 1, espera a persona 2
        setCurrentAnswer('')
        setCurrentQuestion(0)
        setRound(2)
      } else {
        setCurrentAnswer('')
        setCurrentQuestion(currentQuestion + 1)
      }
    } else {
      const newAnswers = [...person2Answers, currentAnswer.trim()]
      setPerson2Answers(newAnswers)
      
      if (newAnswers.length === questions.length) {
        // Termina el juego
        setGameState('results')
      } else {
        setCurrentAnswer('')
        setCurrentQuestion(currentQuestion + 1)
      }
    }
  }

  const calculateMatches = () => {
    let matches = 0
    for (let i = 0; i < questions.length; i++) {
      if (person1Answers[i]?.toLowerCase().trim() === person2Answers[i]?.toLowerCase().trim()) {
        matches++
      }
    }
    return matches
  }

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return "¡Increíble! Se conocen perfectamente 💖"
    if (percentage >= 70) return "¡Excelente! Tienen una gran conexión 💕"
    if (percentage >= 50) return "¡Bien! Se conocen bastante bien 💗"
    if (percentage >= 30) return "¡Pueden mejorar! Hay mucho por descubrir 💓"
    return "¡Es hora de conocerse mejor! 💘"
  }

  const addCustomQuestion = () => {
    if (!newQuestion.trim()) return
    
    const newQ = {
      id: questions.length + 1,
      question: newQuestion.trim(),
      category: newCategory
    }
    
    setQuestions([...questions, newQ])
    setNewQuestion('')
    setNewCategory('Gustos Básicos')
  }

  const removeQuestion = (id: number) => {
    if (questions.length <= 5) {
      alert('Debe haber al menos 5 preguntas')
      return
    }
    setQuestions(questions.filter(q => q.id !== id))
  }

  const resetToDefault = () => {
    setQuestions(defaultQuestions)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-pink-100 to-rose-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/games"
            className="inline-flex items-center text-red-600 hover:text-red-800 mb-4 cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Juegos
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-pink-500 rounded-xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-red-900">Calculadora del Amor</h1>
          </div>
          <p className="text-red-700">¿Cuánto se conocen realmente? Descúbranlo juntos</p>
        </div>

        {/* Intro Screen */}
        {gameState === 'intro' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">💕</div>
              <h2 className="text-3xl font-bold text-red-900 mb-4">¿Listos para el desafío?</h2>
              <p className="text-gray-700 mb-6">
                En este juego, cada uno responderá {questions.length} preguntas sobre su pareja.
                Al final, compararemos sus respuestas para ver qué tan bien se conocen.
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-red-900 mb-3">Cómo jugar:</h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <span><strong>{currentPersonName}</strong> responde primero sobre <strong>{partnerName}</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <span>Luego <strong>{partnerName}</strong> responde las mismas preguntas sobre <strong>{currentPersonName}</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <span>Comparamos las respuestas y calculamos su nivel de conexión</span>
                </li>
              </ol>
            </div>

            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 rounded-xl font-semibold text-lg transition shadow-lg hover:shadow-xl"
              >
                Comenzar el Test
              </button>
              <button
                onClick={() => setGameState('manage')}
                className="bg-white hover:bg-gray-50 text-red-600 px-6 py-4 rounded-xl font-semibold border-2 border-red-200 transition cursor-pointer"
              >
                ✏️ Preguntas
              </button>
            </div>
          </div>
        )}

        {/* Playing Screen */}
        {gameState === 'playing' && (
          <div className="space-y-6">
            {/* Round Indicator */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Turno de:</div>
                  <div className="text-2xl font-bold text-red-900">
                    {round === 1 ? currentPersonName : partnerName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Ronda {round} de 2</div>
                  <div className="text-2xl font-bold text-red-900">
                    {currentQuestion + 1}/{questions.length}
                  </div>
                </div>
              </div>
              <div className="bg-red-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-red-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl shadow-2xl p-8 border-4 border-red-200">
              <div className="text-center mb-6">
                <div className="inline-block bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-full px-4 py-2 text-sm font-semibold mb-4">
                  {questions[currentQuestion].category}
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-red-900 text-center mb-8">
                {questions[currentQuestion].question}
              </h2>

              <div className="space-y-4">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  className="w-full p-4 rounded-xl border-2 border-red-200 focus:border-red-500 focus:outline-none resize-none text-gray-700"
                  rows={3}
                  maxLength={100}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{currentAnswer.length}/100 caracteres</span>
                  <button
                    onClick={submitAnswer}
                    disabled={!currentAnswer.trim()}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentQuestion === questions.length - 1 && round === 2 ? 'Ver Resultados' : 'Siguiente'}
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Info */}
            {round === 1 && (
              <div className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center text-gray-600">
                <p className="text-sm">
                  💡 <strong>{partnerName}</strong> no podrá ver tus respuestas hasta el final
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results Screen */}
        {gameState === 'results' && (
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
              <div className="text-6xl mb-4">
                {calculateMatches() >= questions.length * 0.7 ? '🎉' : calculateMatches() >= questions.length * 0.5 ? '😊' : '💪'}
              </div>
              <h2 className="text-3xl font-bold text-red-900 mb-4">Resultados</h2>
              
              <div className="mb-6">
                <div className="text-6xl font-bold text-red-600 mb-2">
                  {Math.round((calculateMatches() / questions.length) * 100)}%
                </div>
                <p className="text-xl text-gray-700 font-semibold">
                  {getScoreMessage((calculateMatches() / questions.length) * 100)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-green-600">{calculateMatches()}</div>
                  <div className="text-sm text-gray-600">Coincidencias</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-red-600">{questions.length - calculateMatches()}</div>
                  <div className="text-sm text-gray-600">Diferentes</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-blue-600">{questions.length}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h3 className="text-2xl font-bold text-red-900 mb-6">Respuestas Detalladas</h3>
              <div className="space-y-4">
                {questions.map((q, index) => {
                  const match = person1Answers[index]?.toLowerCase().trim() === person2Answers[index]?.toLowerCase().trim()
                  return (
                    <div key={q.id} className={`rounded-2xl p-4 border-2 ${match ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`text-2xl ${match ? '✅' : '❌'}`}>
                          {match ? '✅' : '❌'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-2">{q.question}</div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-blue-600">{currentPersonName}:</span>
                              <span className="text-gray-700">{person1Answers[index]}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-pink-600">{partnerName}:</span>
                              <span className="text-gray-700">{person2Answers[index]}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={startGame}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 rounded-xl font-semibold transition shadow-lg"
              >
                Jugar de Nuevo
              </button>
              <Link
                href="/dashboard/games"
                className="flex-1 bg-white hover:bg-gray-50 text-red-600 py-4 rounded-xl font-semibold transition shadow-lg text-center border-2 border-red-200"
              >
                Volver a Juegos
              </Link>
            </div>
          </div>
        )}

        {/* Manage Questions Screen */}
        {gameState === 'manage' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-red-900 mb-4">✏️ Gestionar Preguntas</h2>
              <p className="text-gray-700 mb-6">
                Personaliza las preguntas del juego. Puedes agregar nuevas preguntas o eliminar las existentes (mínimo 5).
              </p>
              
              {/* Add New Question */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-red-900 mb-4">Agregar Nueva Pregunta</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pregunta</label>
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="¿Cuál es...?"
                      className="w-full p-3 rounded-xl border-2 border-red-200 focus:border-red-500 focus:outline-none text-gray-900"
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-red-200 focus:border-red-500 focus:outline-none text-gray-900"
                    >
                      <option value="Gustos Básicos">Gustos Básicos</option>
                      <option value="Emocional">Emocional</option>
                      <option value="Personalidad">Personalidad</option>
                      <option value="Recuerdos">Recuerdos</option>
                      <option value="Sueños">Sueños</option>
                    </select>
                  </div>
                  <button
                    onClick={addCustomQuestion}
                    disabled={!newQuestion.trim()}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-3 rounded-xl font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➕ Agregar Pregunta
                  </button>
                </div>
              </div>

              {/* Current Questions */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-red-900">Preguntas Actuales ({questions.length})</h3>
                  <button
                    onClick={resetToDefault}
                    className="text-sm text-red-600 hover:text-red-800 font-semibold"
                  >
                    🔄 Restaurar Predeterminadas
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {questions.map((q) => (
                    <div key={q.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded-full">
                            {q.category}
                          </span>
                        </div>
                        <p className="text-gray-900">{q.question}</p>
                      </div>
                      <button
                        onClick={() => removeQuestion(q.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar pregunta"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setGameState('intro')}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 rounded-xl font-semibold transition shadow-lg"
                >
                  ✓ Guardar y Volver
                </button>
                <button
                  onClick={() => setGameState('intro')}
                  className="bg-white hover:bg-gray-50 text-red-600 px-6 py-4 rounded-xl font-semibold border-2 border-red-200 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat flotante */}
      <FloatingChat currentUserName={currentPersonName} />
    </div>
  )
}
