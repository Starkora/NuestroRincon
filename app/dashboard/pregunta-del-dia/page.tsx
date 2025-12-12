'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import toast, { Toaster } from 'react-hot-toast'
import FloatingChat from '@/components/FloatingChat'

interface DailyQuestion {
  id: string
  question: string
  category: 'love' | 'dreams' | 'past' | 'future' | 'fun' | 'deep'
}

interface QuestionAnswer {
  id: string
  question_id: string
  user_id: string
  answer: string
  answered_at: string
  question?: DailyQuestion
}

export default function PreguntaDelDiaPage() {
  const { user } = useAuth()
  const [todayQuestion, setTodayQuestion] = useState<DailyQuestion | null>(null)
  const [myAnswer, setMyAnswer] = useState<QuestionAnswer | null>(null)
  const [partnerAnswer, setPartnerAnswer] = useState<QuestionAnswer | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<QuestionAnswer[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [partnerUserId, setPartnerUserId] = useState<string | null>(null)
  const [currentPersonName, setCurrentPersonName] = useState('')
  
  // New question form states
  const [newQuestion, setNewQuestion] = useState('')
  const [newCategory, setNewCategory] = useState<'love' | 'dreams' | 'past' | 'future' | 'fun' | 'deep'>('love')

  useEffect(() => {
    if (user) {
      initializePage()
    }
  }, [user])

  useEffect(() => {
    if (partnerUserId && todayQuestion) {
      loadPartnerAnswer(todayQuestion.id)
    }
  }, [partnerUserId, todayQuestion])

  const initializePage = async () => {
    // Obtener nombre de la persona actual
    const currentPerson = localStorage.getItem('current_person')
    const personName = currentPerson === 'person1' 
      ? user?.user_metadata?.person1_name 
      : user?.user_metadata?.person2_name
    setCurrentPersonName(personName || 'Usuario')
    
    await findPartner()
    await loadTodayQuestion()
    await loadHistory()
  }

  const findPartner = async () => {
    try {
      // Obtener couple_name del usuario actual
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const coupleName = currentUser?.user_metadata?.couple_name
      
      if (!coupleName) {
        console.log('No couple_name found')
        return
      }

      // Buscar el perfil de la pareja con el mismo couple_name
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('couple_name', coupleName)
        .neq('id', user?.id)
        .limit(1)

      if (error) {
        console.warn('Error finding partner:', error.message)
        return
      }
      
      if (profiles && profiles.length > 0) {
        setPartnerUserId(profiles[0].id)
      }
    } catch (error) {
      console.error('Error finding partner:', error)
    }
  }

  const loadTodayQuestion = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get or create today's question
      let { data: existingAnswer, error: answerError } = await supabase
        .from('question_answers')
        .select('*, question:daily_questions(*)')
        .eq('user_id', user?.id)
        .gte('answered_at', today)
        .lt('answered_at', `${today}T23:59:59`)
        .single()

      if (existingAnswer) {
        setTodayQuestion(existingAnswer.question as DailyQuestion)
        setMyAnswer(existingAnswer)
        setAnswerText(existingAnswer.answer)
        await loadPartnerAnswer(existingAnswer.question_id)
      } else {
        // Get all answered question IDs by this user
        const { data: answeredQuestions, error: answeredError } = await supabase
          .from('question_answers')
          .select('question_id')
          .eq('user_id', user?.id)

        if (answeredError) throw answeredError

        const answeredIds = answeredQuestions?.map(q => q.question_id) || []

        // Get random question that hasn't been answered before
        let { data: questions, error: questionsError } = await supabase
          .from('daily_questions')
          .select('*')

        if (questionsError) throw questionsError
        
        // Filter out already answered questions
        const unansweredQuestions = questions?.filter(q => !answeredIds.includes(q.id)) || []
        
        if (unansweredQuestions.length > 0) {
          // Pick random unanswered question
          const randomQuestion = unansweredQuestions[Math.floor(Math.random() * unansweredQuestions.length)]
          setTodayQuestion(randomQuestion)
        } else if (questions && questions.length > 0) {
          // If all questions have been answered, pick any random question
          const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
          setTodayQuestion(randomQuestion)
        }
      }
    } catch (error) {
      console.error('Error loading question:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPartnerAnswer = async (questionId: string) => {
    if (!partnerUserId) return

    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('question_answers')
        .select('*')
        .eq('question_id', questionId)
        .eq('user_id', partnerUserId)
        .gte('answered_at', today)
        .lt('answered_at', `${today}T23:59:59`)
        .single()

      if (!error && data) {
        setPartnerAnswer(data)
      }
    } catch (error) {
      console.error('Error loading partner answer:', error)
    }
  }

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('question_answers')
        .select('*, question:daily_questions(*)')
        .eq('user_id', user?.id)
        .order('answered_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!todayQuestion || !answerText.trim()) return

    try {
      if (myAnswer) {
        // Update existing answer
        const { error } = await supabase
          .from('question_answers')
          .update({ answer: answerText })
          .eq('id', myAnswer.id)

        if (error) throw error
      } else {
        // Create new answer
        const { data, error } = await supabase
          .from('question_answers')
          .insert([
            {
              question_id: todayQuestion.id,
              user_id: user?.id,
              answer: answerText,
            }
          ])
          .select()
          .single()

        if (error) throw error
        setMyAnswer(data)
      }

      await loadPartnerAnswer(todayQuestion.id)
      await loadHistory()
      toast.success('¡Respuesta guardada!', {
        duration: 2000,
        position: 'top-center',
        icon: '💭',
      })
    } catch (error) {
      console.error('Error saving answer:', error)
      toast.error('Error al guardar la respuesta', {
        duration: 3000,
        position: 'top-center',
      })
    }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newQuestion.trim()) return

    try {
      const { error } = await supabase
        .from('daily_questions')
        .insert([
          {
            question: newQuestion,
            category: newCategory,
          }
        ])

      if (error) throw error

      setNewQuestion('')
      setNewCategory('love')
      setShowAddQuestion(false)
      toast.success('¡Pregunta agregada exitosamente!', {
        duration: 2000,
        position: 'top-center',
        icon: '🎉',
      })
    } catch (error) {
      console.error('Error adding question:', error)
      toast.error('Error al agregar la pregunta', {
        duration: 3000,
        position: 'top-center',
      })
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'love': return 'bg-pink-100 text-pink-700'
      case 'dreams': return 'bg-purple-100 text-purple-700'
      case 'past': return 'bg-blue-100 text-blue-700'
      case 'future': return 'bg-green-100 text-green-700'
      case 'fun': return 'bg-yellow-100 text-yellow-700'
      case 'deep': return 'bg-indigo-100 text-indigo-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'love': return 'Amor'
      case 'dreams': return 'Sueños'
      case 'past': return 'Pasado'
      case 'future': return 'Futuro'
      case 'fun': return 'Diversión'
      case 'deep': return 'Profundo'
      default: return 'Otro'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'love':
        return (
          <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        )
      case 'dreams':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      case 'past':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'future':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )
      case 'fun':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-2xl font-bold text-purple-900">Pregunta del Día</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowAddQuestion(!showAddQuestion)
                setShowHistory(false)
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition cursor-pointer flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Pregunta
            </button>
            <button
              onClick={() => {
                setShowHistory(!showHistory)
                setShowAddQuestion(false)
              }}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition cursor-pointer flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showHistory ? 'Pregunta de Hoy' : 'Ver Historial'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {showAddQuestion ? (
          <>
            {/* Add Question Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-purple-900 mb-6">Agregar Nueva Pregunta</h2>
              
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pregunta *
                  </label>
                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Escribe tu pregunta aquí..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { value: 'love' as const, label: 'Amor', color: 'pink' },
                      { value: 'dreams' as const, label: 'Sueños', color: 'purple' },
                      { value: 'past' as const, label: 'Pasado', color: 'blue' },
                      { value: 'future' as const, label: 'Futuro', color: 'green' },
                      { value: 'fun' as const, label: 'Diversión', color: 'yellow' },
                      { value: 'deep' as const, label: 'Profundo', color: 'indigo' },
                    ].map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setNewCategory(cat.value)}
                        className={`p-3 rounded-lg border-2 transition cursor-pointer ${
                          newCategory === cat.value
                            ? `border-${cat.color}-600 bg-${cat.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(cat.value)}
                          <span className="font-medium text-gray-900">{cat.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-purple-800">
                      Las preguntas agregadas estarán disponibles para ambos y podrán aparecer como pregunta del día en el futuro.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition cursor-pointer"
                >
                  Guardar Pregunta
                </button>
              </form>
            </div>
          </>
        ) : !showHistory ? (
          <>
            {/* Today's Question */}
            {todayQuestion && (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  {getCategoryIcon(todayQuestion.category)}
                  <div>
                    <span className={`text-xs px-3 py-1 rounded-full ${getCategoryColor(todayQuestion.category)}`}>
                      {getCategoryLabel(todayQuestion.category)}
                    </span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-purple-900 mb-6">
                  {todayQuestion.question}
                </h2>

                {/* My Answer */}
                <form onSubmit={handleSubmit} className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tu Respuesta
                  </label>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 resize-none"
                    required
                  />
                  <button
                    type="submit"
                    className="mt-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition cursor-pointer"
                  >
                    {myAnswer ? 'Actualizar Respuesta' : 'Guardar Respuesta'}
                  </button>
                </form>

                {/* Divider */}
                {myAnswer && (
                  <div className="border-t border-gray-200 my-6"></div>
                )}

                {/* Partner Answer */}
                {myAnswer && (
                  <div>
                    <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      Respuesta de tu pareja
                    </h3>
                    {partnerAnswer ? (
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                        <p className="text-gray-800">{partnerAnswer.answer}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Respondido: {new Date(partnerAnswer.answered_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-600">Tu pareja aún no ha respondido esta pregunta</p>
                      </div>
                    )}
                  </div>
                )}

                {!myAnswer && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-purple-800">
                        Responde la pregunta para ver la respuesta de tu pareja y comparar sus pensamientos.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* History */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-purple-900 mb-6">Historial de Preguntas</h2>
              
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      No hay preguntas respondidas
                    </h3>
                    <p className="text-gray-600">
                      Responde tu primera pregunta del día para empezar a construir tu historial
                    </p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start gap-3 mb-3">
                        {item.question && getCategoryIcon(item.question.category)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {item.question && (
                              <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(item.question.category)}`}>
                                {getCategoryLabel(item.question.category)}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(item.answered_at).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {item.question?.question}
                          </h3>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-sm text-gray-800">{item.answer}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Chat flotante */}
      <FloatingChat currentUserName={currentPersonName} />
    </div>
  )
}
