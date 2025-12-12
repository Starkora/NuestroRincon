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

const questions: Question[] = [
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
  const [person1Answers, setPerson1Answers] = useState<number[]>([])
  const [person2Answers, setPerson2Answers] = useState<number[]>([])
  const [currentPerson, setCurrentPerson] = useState<1 | 2>(1)
  const [showResults, setShowResults] = useState(false)
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

  const handleAnswer = (answerIndex: number) => {
    if (currentPerson === 1) {
      const newAnswers = [...person1Answers, answerIndex]
      setPerson1Answers(newAnswers)
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        setCurrentPerson(2)
        setCurrentQuestion(0)
      }
    } else {
      const newAnswers = [...person2Answers, answerIndex]
      setPerson2Answers(newAnswers)
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
      } else {
        setShowResults(true)
      }
    }
  }

  const calculateCompatibility = () => {
    let matches = 0
    let partialMatches = 0
    
    for (let i = 0; i < questions.length; i++) {
      if (person1Answers[i] === person2Answers[i]) {
        matches++
      } else if (Math.abs(person1Answers[i] - person2Answers[i]) === 1) {
        partialMatches++
      }
    }
    
    const exactScore = (matches / questions.length) * 100
    const partialScore = (partialMatches / questions.length) * 30
    const totalScore = Math.min(exactScore + partialScore, 100)
    
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
      const matches = categoryQuestions.filter((q, i) => {
        const questionIndex = questions.indexOf(q)
        return person1Answers[questionIndex] === person2Answers[questionIndex]
      }).length
      
      const score = (matches / categoryQuestions.length) * 100
      return { category, score: Math.round(score), matches, total: categoryQuestions.length }
    })
  }

  const resetTest = () => {
    setPerson1Answers([])
    setPerson2Answers([])
    setCurrentPerson(1)
    setCurrentQuestion(0)
    setShowResults(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Cargando...</div>
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

          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className="w-full bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-900 p-4 rounded-xl font-semibold transition border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg cursor-pointer text-left"
              >
                <span className="mr-3">{String.fromCharCode(65 + index)}.</span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border-2 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="text-sm text-purple-700">
              <p className="font-semibold mb-2">¿Cómo funciona?</p>
              <p>Cada persona debe responder las 15 preguntas de forma independiente. Al final, compararemos sus respuestas para calcular su nivel de compatibilidad en diferentes áreas de la relación.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat flotante */}
      <FloatingChat currentUserName={currentPersonName} />
    </div>
  )
}
