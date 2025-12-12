'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FloatingChat from '@/components/FloatingChat'

interface Question {
  id: number
  category: string
  question: string
  options: string[]
}

const defaultQuestions: Question[] = [
  // Comunicación
  { id: 1, category: 'Comunicación', question: '¿Cómo prefieren resolver conflictos?', options: ['Hablar inmediatamente', 'Tomar un tiempo para pensar', 'Buscar compromiso', 'Evitar conflictos'] },
  { id: 2, category: 'Comunicación', question: '¿Con qué frecuencia les gusta hablar sobre sus sentimientos?', options: ['Diariamente', 'Varias veces a la semana', 'Cuando surge algo importante', 'Solo cuando es necesario'] },
  { id: 3, category: 'Comunicación', question: '¿Cómo expresan mejor su amor?', options: ['Palabras de afirmación', 'Tiempo de calidad', 'Regalos', 'Actos de servicio'] },
  
  // Estilo de vida
  { id: 4, category: 'Estilo de vida', question: 'En un día libre ideal, prefieren:', options: ['Aventura al aire libre', 'Quedarse en casa relajados', 'Salir con amigos', 'Hacer algo productivo'] },
  { id: 5, category: 'Estilo de vida', question: '¿Cómo manejan el dinero en pareja?', options: ['Cuenta compartida todo', 'Cuentas separadas', 'Compartida para gastos comunes', 'Uno administra todo'] },
  { id: 6, category: 'Estilo de vida', question: '¿Qué tan importante es tener tiempo a solas?', options: ['Muy importante, diariamente', 'Importante, algunas veces', 'Poco importante', 'Prefiero estar siempre juntos'] },
  
  // Valores
  { id: 7, category: 'Valores', question: '¿Qué es más importante en la vida?', options: ['Familia', 'Carrera profesional', 'Experiencias y viajes', 'Estabilidad financiera'] },
  { id: 8, category: 'Valores', question: '¿Cómo ven el tema de tener hijos?', options: ['Definitivamente sí', 'Tal vez en el futuro', 'Aún no lo decido', 'Definitivamente no'] },
  { id: 9, category: 'Valores', question: '¿Qué tan importante es la religión/espiritualidad?', options: ['Muy importante', 'Algo importante', 'Poco importante', 'Nada importante'] },
  
  // Tiempo juntos
  { id: 10, category: 'Tiempo juntos', question: '¿Cuánto tiempo de calidad necesitan juntos por semana?', options: ['Todo el tiempo posible', 'Varias veces a la semana', 'Fin de semana principalmente', 'Algunos días está bien'] },
  { id: 11, category: 'Tiempo juntos', question: 'Para una cita ideal, prefieren:', options: ['Algo romántico e íntimo', 'Aventura emocionante', 'Cultural o educativo', 'Casual y relajado'] },
  { id: 12, category: 'Tiempo juntos', question: '¿Qué tan importante es compartir hobbies?', options: ['Muy importante', 'Algunos en común', 'Cada uno lo suyo', 'No importa'] },
  
  // Futuro
  { id: 13, category: 'Futuro', question: '¿Dónde se ven viviendo en 5 años?', options: ['Ciudad grande', 'Pueblo pequeño', 'Campo/naturaleza', 'Otro país'] },
  { id: 14, category: 'Futuro', question: '¿Qué tan importante es la independencia personal?', options: ['Muy importante', 'Algo importante', 'Poco importante', 'Prefiero interdependencia'] },
  { id: 15, category: 'Futuro', question: '¿Cómo ven el balance vida-trabajo?', options: ['Trabajo es prioridad', 'Balance 50/50', 'Vida personal primero', 'Flexible según momento'] },
]

export default function CompatibilityTest() {
  const [loading, setLoading] = useState(true)
  const [currentPersonName, setCurrentPersonName] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [person1Answers, setPerson1Answers] = useState<number[][]>([])
  const [person2Answers, setPerson2Answers] = useState<number[][]>([])
  const [currentPerson, setCurrentPerson] = useState<1 | 2>(1)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showManage, setShowManage] = useState(false)
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions)
  const [newQuestion, setNewQuestion] = useState('')
  const [newCategory, setNewCategory] = useState('Comunicación')
  const [newOptions, setNewOptions] = useState(['', '', '', ''])
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
    const personName = currentPerson === 'person1' 
      ? user.user_metadata?.person1_name 
      : user.user_metadata?.person2_name
    setCurrentPersonName(personName || 'Usuario')
    setLoading(false)
  }

  const toggleAnswer = (answerIndex: number) => {
    setSelectedAnswers(prev => {
      if (prev.includes(answerIndex)) {
        return prev.filter(i => i !== answerIndex)
      } else {
        return [...prev, answerIndex]
      }
    })
  }

  const handleContinue = () => {
    if (selectedAnswers.length === 0) return

    if (currentPerson === 1) {
      const newAnswers = [...person1Answers, selectedAnswers]
      setPerson1Answers(newAnswers)
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswers([])
      } else {
        setCurrentPerson(2)
        setCurrentQuestion(0)
        setSelectedAnswers([])
      }
    } else {
      const newAnswers = [...person2Answers, selectedAnswers]
      setPerson2Answers(newAnswers)
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswers([])
      } else {
        setShowResults(true)
      }
    }
  }

  const calculateCompatibility = () => {
    let totalPoints = 0
    let matches = 0
    let partialMatches = 0
    
    for (let i = 0; i < questions.length; i++) {
      const answers1 = person1Answers[i] || []
      const answers2 = person2Answers[i] || []
      
      // Calcular coincidencias
      const commonAnswers = answers1.filter(a => answers2.includes(a))
      
      if (commonAnswers.length > 0) {
        // Calcular porcentaje de coincidencia para esta pregunta
        const allAnswers = [...new Set([...answers1, ...answers2])]
        const matchPercentage = (commonAnswers.length / allAnswers.length) * 100
        
        if (matchPercentage === 100) {
          matches++
          totalPoints += 100
        } else if (matchPercentage >= 50) {
          partialMatches++
          totalPoints += matchPercentage
        } else {
          totalPoints += matchPercentage * 0.5
        }
      }
    }
    
    const totalScore = totalPoints / questions.length
    
    return {
      total: Math.round(totalScore),
      exact: matches,
      partial: partialMatches,
      different: questions.length - matches - partialMatches
    }
  }

  const getCompatibilityMessage = (score: number) => {
    if (score >= 80) return { emoji: '💞', title: '¡Conexión Perfecta!', message: 'Tienen una compatibilidad excepcional. Sus valores y preferencias están muy alineados.' }
    if (score >= 65) return { emoji: '💖', title: '¡Muy Compatible!', message: 'Comparten muchas cosas en común. Las diferencias pueden complementarse bien.' }
    if (score >= 50) return { emoji: '💕', title: 'Buena Compatibilidad', message: 'Tienen una base sólida. Trabajen en entender y respetar sus diferencias.' }
    if (score >= 35) return { emoji: '💝', title: 'Compatibilidad Moderada', message: 'Hay áreas de desafío, pero con comunicación pueden funcionar bien.' }
    return { emoji: '💗', title: 'Diferentes Perspectivas', message: 'Tienen muchas diferencias. Requiere esfuerzo y comprensión mutua.' }
  }

  const getCategoryResults = () => {
    const categories = ['Comunicación', 'Estilo de vida', 'Valores', 'Tiempo juntos', 'Futuro']
    return categories.map(category => {
      const categoryQuestions = questions.filter(q => q.category === category)
      let categoryPoints = 0
      let perfectMatches = 0
      
      categoryQuestions.forEach(q => {
        const questionIndex = questions.indexOf(q)
        const answers1 = person1Answers[questionIndex] || []
        const answers2 = person2Answers[questionIndex] || []
        const commonAnswers = answers1.filter(a => answers2.includes(a))
        
        if (commonAnswers.length > 0) {
          const allAnswers = [...new Set([...answers1, ...answers2])]
          const matchPercentage = (commonAnswers.length / allAnswers.length) * 100
          categoryPoints += matchPercentage
          
          if (matchPercentage === 100) {
            perfectMatches++
          }
        }
      })
      
      const score = categoryPoints / categoryQuestions.length
      return { category, score: Math.round(score), matches: perfectMatches, total: categoryQuestions.length }
    })
  }

  const resetTest = () => {
    setPerson1Answers([])
    setPerson2Answers([])
    setCurrentPerson(1)
    setCurrentQuestion(0)
    setShowResults(false)
    setSelectedAnswers([])
  }

  const addCustomQuestion = () => {
    if (!newQuestion.trim() || newOptions.some(opt => !opt.trim())) {
      alert('Por favor completa la pregunta y todas las opciones')
      return
    }
    
    const newQ: Question = {
      id: questions.length + 1,
      category: newCategory,
      question: newQuestion.trim(),
      options: newOptions.map(opt => opt.trim())
    }
    
    setQuestions([...questions, newQ])
    setNewQuestion('')
    setNewCategory('Comunicación')
    setNewOptions(['', '', '', ''])
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

  const updateOption = (index: number, value: string) => {
    const newOpts = [...newOptions]
    newOpts[index] = value
    setNewOptions(newOpts)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Cargando...</div>
      </div>
    )
  }

  if (showManage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-rose-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => setShowManage(false)}
              className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-4 cursor-pointer"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-purple-900 mb-4">✏️ Gestionar Preguntas</h2>
              <p className="text-gray-700 mb-6">
                Personaliza las preguntas del test. Cada pregunta debe tener 4 opciones (mínimo 5 preguntas).
              </p>
            </div>
            
            {/* Add New Question */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
              <h3 className="font-bold text-purple-900 mb-4">Agregar Nueva Pregunta</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pregunta</label>
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="¿Cuál es...?"
                    className="w-full p-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-gray-900"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-gray-900"
                  >
                    <option value="Comunicación">Comunicación</option>
                    <option value="Estilo de vida">Estilo de vida</option>
                    <option value="Valores">Valores</option>
                    <option value="Tiempo juntos">Tiempo juntos</option>
                    <option value="Futuro">Futuro</option>
                    <option value="Personalidad">Personalidad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Opciones (4 requeridas)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {newOptions.map((opt, index) => (
                      <input
                        key={index}
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Opción ${index + 1}`}
                        className="p-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-gray-900"
                        maxLength={100}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={addCustomQuestion}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-semibold transition shadow-lg"
                >
                  ➕ Agregar Pregunta
                </button>
              </div>
            </div>

            {/* Current Questions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-purple-900">Preguntas Actuales ({questions.length})</h3>
                <button
                  onClick={resetToDefault}
                  className="text-sm text-purple-600 hover:text-purple-800 font-semibold"
                >
                  🔄 Restaurar Predeterminadas
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {questions.map((q) => (
                  <div key={q.id} className="bg-white border-2 border-gray-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {q.category}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium mb-2">{q.question}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, i) => (
                            <span key={i} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              {i + 1}. {opt}
                            </span>
                          ))}
                        </div>
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
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowManage(false)}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 rounded-xl font-semibold transition shadow-lg"
              >
                ✓ Guardar y Volver
              </button>
            </div>
          </div>
        </div>

        <FloatingChat currentUserName={currentPersonName} />
      </div>
    )
  }

  if (showResults) {
    const compatibility = calculateCompatibility()
    const message = getCompatibilityMessage(compatibility.total)
    const categoryResults = getCategoryResults()

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-rose-100 p-6">
        <div className="max-w-4xl mx-auto">
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
            <h1 className="text-4xl font-bold text-purple-900 mb-2">💞 Resultados del Test</h1>
          </div>

          {/* Score Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 text-center">
            <div className="text-8xl mb-4">{message.emoji}</div>
            <h2 className="text-4xl font-bold text-purple-900 mb-2">{message.title}</h2>
            <p className="text-purple-600 mb-6">{message.message}</p>
            
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle cx="96" cy="96" r="88" stroke="#e9d5ff" strokeWidth="12" fill="none" />
                <circle 
                  cx="96" 
                  cy="96" 
                  r="88" 
                  stroke="url(#gradient)" 
                  strokeWidth="12" 
                  fill="none"
                  strokeDasharray={`${(compatibility.total / 100) * 553} 553`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-purple-900">{compatibility.total}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                <div className="text-3xl font-bold text-green-600">{compatibility.exact}</div>
                <div className="text-sm text-green-700">Coincidencias</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600">{compatibility.partial}</div>
                <div className="text-sm text-yellow-700">Similares</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="text-3xl font-bold text-purple-600">{compatibility.different}</div>
                <div className="text-sm text-purple-700">Diferentes</div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            <h3 className="text-2xl font-bold text-purple-900 mb-6">Compatibilidad por Categoría</h3>
            <div className="space-y-4">
              {categoryResults.map((result) => (
                <div key={result.category}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-purple-900">{result.category}</span>
                    <span className="text-purple-600">{result.matches}/{result.total} coincidencias ({result.score}%)</span>
                  </div>
                  <div className="bg-purple-100 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${result.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={resetTest}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 rounded-xl font-bold shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Hacer el Test de Nuevo
            </button>
            <Link
              href="/dashboard/games"
              className="flex-1 bg-white hover:bg-gray-50 text-purple-600 py-4 rounded-xl font-bold shadow-lg transition cursor-pointer text-center border-2 border-purple-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
              Otros Juegos
            </Link>
          </div>
        </div>

        <FloatingChat currentUserName={currentPersonName} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-6">
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
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-purple-900">Test de Compatibilidad</h1>
            </div>
          <p className="text-purple-700">Descubran qué tan compatibles son en diferentes áreas</p>
        </div>

        {/* Progress */}
        <div className="mb-6 bg-white/80 backdrop-blur rounded-2xl p-4 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-purple-900">
              Persona {currentPerson}: Pregunta {currentQuestion + 1} de {questions.length}
            </span>
            <span className="text-sm text-purple-600">
              {currentPerson === 1 ? 'Primera' : 'Segunda'} ronda
            </span>
          </div>
          <div className="bg-purple-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                currentPerson === 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-pink-500 to-rose-600'
              }`}
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className={`inline-block ${
              currentPerson === 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-pink-500 to-rose-600'
            } text-white rounded-full px-6 py-2 text-sm font-semibold mb-4`}>
              {questions[currentQuestion].category}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-purple-900 text-center mb-8 leading-relaxed">
            {questions[currentQuestion].question}
          </h2>

          <div className="space-y-3 mb-6">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => toggleAnswer(index)}
                className={`w-full p-4 rounded-xl font-semibold transition border-2 cursor-pointer text-left flex items-center gap-3 ${
                  selectedAnswers.includes(index)
                    ? 'bg-gradient-to-r from-purple-200 to-pink-200 border-purple-500 shadow-lg'
                    : 'bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 hover:border-purple-400'
                } text-purple-900`}
              >
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  selectedAnswers.includes(index)
                    ? 'bg-purple-600 border-purple-600'
                    : 'bg-white border-purple-300'
                }`}>
                  {selectedAnswers.includes(index) && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="flex-1">
                  <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            disabled={selectedAnswers.length === 0}
            className={`w-full py-4 rounded-xl font-bold shadow-lg transition cursor-pointer flex items-center justify-center gap-2 ${
              selectedAnswers.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
            }`}
          >
            <span>Continuar</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Info */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border-2 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="text-sm text-purple-700">
              <p className="font-semibold mb-2">¿Cómo funciona?</p>
              <p>Cada persona debe responder las {questions.length} preguntas de forma independiente. <strong>Puedes seleccionar múltiples opciones</strong> en cada pregunta si más de una te representa. Al final, compararemos sus respuestas para calcular su nivel de compatibilidad en diferentes áreas de la relación.</p>
            </div>
          </div>
        </div>

        {/* Manage Questions Button */}
        <div className="text-center">
          <button
            onClick={() => setShowManage(true)}
            className="bg-white hover:bg-gray-50 text-purple-600 px-6 py-3 rounded-xl font-semibold border-2 border-purple-200 transition cursor-pointer inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Gestionar Preguntas
          </button>
        </div>
      </div>

      {/* Chat flotante */}
      <FloatingChat currentUserName={currentPersonName} />
    </div>
  )
}
