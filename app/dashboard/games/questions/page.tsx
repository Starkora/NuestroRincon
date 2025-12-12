'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FloatingChat from '@/components/FloatingChat'

const questions = [
  "¿Cuál es tu recuerdo favorito de nosotros juntos?",
  "¿Qué fue lo primero que notaste de mí?",
  "¿Cuál es tu mayor sueño en la vida?",
  "¿Qué te hace sentir más amado/a?",
  "¿Cuál es tu mayor miedo en una relación?",
  "¿Qué canción te recuerda a nosotros?",
  "¿Dónde te ves en 5 años?",
  "¿Cuál es tu lenguaje de amor principal?",
  "¿Qué es lo que más admiras de mí?",
  "¿Cuál es tu idea de una cita perfecta?",
  "¿Qué tradición te gustaría crear juntos?",
  "¿Cuál es tu mayor logro personal?",
  "¿Qué te hace feliz cuando estás triste?",
  "¿Cuál es tu libro o película favorita y por qué?",
  "¿Qué es algo que quieres aprender juntos?",
  "¿Cuál es tu lugar favorito en el mundo?",
  "¿Qué es lo más importante para ti en una pareja?",
  "¿Cuál es tu comida favorita para compartir?",
  "¿Qué te gustaría hacer más seguido juntos?",
  "¿Cuál es tu mayor fortaleza como pareja?",
  "¿Qué es algo pequeño que hago que te hace sonreír?"
]

export default function QuestionsGame() {
  const [loading, setLoading] = useState(true)
  const [currentPersonName, setCurrentPersonName] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [usedQuestions, setUsedQuestions] = useState<number[]>([])
  const [showAnswer, setShowAnswer] = useState(false)
  const [customQuestions, setCustomQuestions] = useState<string[]>([])
  const [allQuestions, setAllQuestions] = useState<string[]>(questions)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadCustomQuestions()
  }, [])

  useEffect(() => {
    setAllQuestions([...questions, ...customQuestions])
  }, [customQuestions])

  const loadCustomQuestions = () => {
    const saved = localStorage.getItem('custom_questions')
    if (saved) {
      const parsed = JSON.parse(saved)
      setCustomQuestions(parsed)
    }
  }

  const saveCustomQuestions = (questions: string[]) => {
    localStorage.setItem('custom_questions', JSON.stringify(questions))
    setCustomQuestions(questions)
  }

  const addCustomQuestion = () => {
    if (!newQuestion.trim()) return
    
    const updated = [...customQuestions, newQuestion.trim()]
    saveCustomQuestions(updated)
    setNewQuestion('')
    setShowAddForm(false)
  }

  const deleteCustomQuestion = (index: number) => {
    const updated = customQuestions.filter((_, i) => i !== index)
    saveCustomQuestions(updated)
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
    
    // Seleccionar pregunta aleatoria inicial
    getRandomQuestion()
  }

  const resetGame = () => {
    setUsedQuestions([])
    setCurrentQuestion(0)
    setShowAnswer(false)
    getRandomQuestion()
  }

  const getRandomQuestion = () => {
    const availableQuestions = allQuestions
      .map((_, index) => index)
      .filter(index => !usedQuestions.includes(index))
    
    if (availableQuestions.length === 0) {
      // Reiniciar si se usaron todas las preguntas
      setUsedQuestions([])
      setCurrentQuestion(Math.floor(Math.random() * allQuestions.length))
    } else {
      const randomIndex = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
      setCurrentQuestion(randomIndex)
      setUsedQuestions([...usedQuestions, randomIndex])
    }
    setShowAnswer(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-100 to-purple-100 p-6">
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
            <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-500 rounded-xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-purple-900">21 Preguntas</h1>
          </div>
          <p className="text-purple-700">Conócense mejor respondiendo preguntas profundas y divertidas</p>
        </div>

        {/* Progress */}
        <div className="mb-6 bg-white/60 backdrop-blur rounded-full p-2">
          <div className="flex items-center justify-between text-sm text-purple-700 px-4">
            <span>Preguntas respondidas: {usedQuestions.length}</span>
            <span>{usedQuestions.length}/{allQuestions.length}</span>
          </div>
          <div className="mt-2 bg-purple-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(usedQuestions.length / allQuestions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 transform transition-all duration-500 hover:scale-105">
          <div className="text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-full px-6 py-2 text-sm font-semibold mb-4">
              Pregunta #{usedQuestions.length + 1}
            </div>
          </div>
          
          <div className="min-h-[200px] flex items-center justify-center">
            <h2 className="text-3xl font-bold text-purple-900 text-center leading-relaxed">
              {questions[currentQuestion]}
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 rounded-xl font-semibold transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              {showAnswer ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                  Ocultar Consejo
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  Ver Consejo
                </>
              )}
            </button>
            <button
              onClick={getRandomQuestion}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-4 rounded-xl font-semibold transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              Siguiente Pregunta
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tip Card */}
        {showAnswer && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💭</div>
              <div>
                <h3 className="font-bold text-purple-900 mb-2">Consejo para esta pregunta:</h3>
                <p className="text-purple-700 text-sm leading-relaxed">
                  Tómense el tiempo para escucharse realmente. No hay prisa. Compartan no solo la respuesta, 
                  sino también los sentimientos detrás de ella. Esta es una oportunidad para conectar más 
                  profundamente y entender mejor la perspectiva del otro.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-white/80 backdrop-blur rounded-2xl p-6 border-2 border-pink-200">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🎯</div>
            <div>
              <h3 className="font-bold text-purple-900 mb-2">Cómo jugar:</h3>
              <ul className="space-y-2 text-purple-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Tomen turnos respondiendo cada pregunta</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Sean honestos y abiertos - esto fortalece su conexión</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>No juzguen las respuestas del otro, solo escuchen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Hagan preguntas de seguimiento si quieren profundizar más</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={resetGame}
          className="w-full mt-6 bg-white/80 backdrop-blur text-purple-700 py-3 rounded-xl font-semibold hover:bg-white transition-all shadow-lg"
        >
          Reiniciar Juego
        </button>

        {/* Custom Questions Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showAddForm ? 'Ocultar Preguntas Personalizadas' : 'Agregar Preguntas Personalizadas'}
        </button>

        {/* Custom Questions Panel */}
        {showAddForm && (
          <div className="mt-6 bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6">
            {/* Add Question Form */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-purple-700 mb-3">Nueva Pregunta</h3>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Escribe tu pregunta aquí..."
                className="w-full p-4 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none resize-none"
                rows={3}
                maxLength={200}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">{newQuestion.length}/200 caracteres</span>
                <button
                  onClick={addCustomQuestion}
                  disabled={newQuestion.trim().length < 10}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar Pregunta
                </button>
              </div>
            </div>

            {/* Custom Questions List */}
            {customQuestions.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-purple-700 mb-3">
                  Mis Preguntas ({customQuestions.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {customQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <span className="flex-1 text-gray-700">{question}</span>
                      <button
                        onClick={() => deleteCustomQuestion(index)}
                        className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
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
            )}

            {customQuestions.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No has agregado preguntas personalizadas aún.
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
