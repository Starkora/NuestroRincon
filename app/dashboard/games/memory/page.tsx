'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gift, Trophy, Star, Sparkles, PartyPopper } from 'lucide-react'
import FloatingChat from '@/components/FloatingChat'

interface MemoryCard {
  id: number
  content: string
  category: 'moment' | 'date' | 'place' | 'gift' | 'word' | 'song'
  isFlipped: boolean
  isMatched: boolean
}

const memoryPairs = [
  { content: 'Primera Cita', category: 'date' as const },
  { content: 'Primer Beso', category: 'moment' as const },
  { content: 'Nuestro Lugar Favorito', category: 'place' as const },
  { content: 'Aniversario', category: 'date' as const },
  { content: 'Primer "Te Amo"', category: 'word' as const },
  { content: 'Viaje Juntos', category: 'moment' as const },
  { content: 'Nuestra Canción', category: 'song' as const },
  { content: 'Regalo Especial', category: 'gift' as const },
  { content: 'Día del Noviazgo', category: 'date' as const },
  { content: 'Momento Divertido', category: 'moment' as const },
  { content: 'Restaurante Favorito', category: 'place' as const },
  { content: 'Promesa Importante', category: 'word' as const }
]

export default function MemoryGame() {
  const [loading, setLoading] = useState(true)
  const [currentPersonName, setCurrentPersonName] = useState('')
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [endTime, setEndTime] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (flippedCards.length === 2) {
      checkMatch()
    }
  }, [flippedCards])

  useEffect(() => {
    if (matches === memoryPairs.length && gameStarted) {
      setGameWon(true)
      setEndTime(Date.now())
    }
  }, [matches, gameStarted])

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

  const initializeGame = () => {
    // Crear pares duplicados con IDs únicos antes de mezclar
    const duplicatedPairs = memoryPairs.flatMap((pair, pairIndex) => [
      {
        id: pairIndex * 2,
        content: pair.content,
        category: pair.category,
        isFlipped: false,
        isMatched: false
      },
      {
        id: pairIndex * 2 + 1,
        content: pair.content,
        category: pair.category,
        isFlipped: false,
        isMatched: false
      }
    ])
    
    // Mezclar las cartas
    const shuffled = duplicatedPairs.sort(() => Math.random() - 0.5)

    setCards(shuffled)
    setFlippedCards([])
    setMoves(0)
    setMatches(0)
    setGameStarted(true)
    setGameWon(false)
    setStartTime(Date.now())
    setEndTime(0)
  }

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2) return
    if (flippedCards.includes(cardId)) return
    
    const cardIndex = cards.findIndex(c => c.id === cardId)
    if (cardIndex === -1 || cards[cardIndex].isMatched) return

    const newCards = [...cards]
    newCards[cardIndex].isFlipped = true
    setCards(newCards)
    setFlippedCards([...flippedCards, cardId])
  }

  const checkMatch = () => {
    const [firstId, secondId] = flippedCards
    const firstCard = cards.find(c => c.id === firstId)
    const secondCard = cards.find(c => c.id === secondId)

    if (!firstCard || !secondCard) return

    setTimeout(() => {
      const newCards = [...cards]
      const firstIndex = newCards.findIndex(c => c.id === firstId)
      const secondIndex = newCards.findIndex(c => c.id === secondId)
      
      if (firstCard.content === secondCard.content) {
        // Es una coincidencia
        newCards[firstIndex].isMatched = true
        newCards[secondIndex].isMatched = true
        setMatches(matches + 1)
      } else {
        // No coincide, voltear de nuevo
        newCards[firstIndex].isFlipped = false
        newCards[secondIndex].isFlipped = false
      }

      setCards(newCards)
      setFlippedCards([])
      setMoves(moves + 1)
    }, 1000)
  }

  const getCategoryIcon = (category: string) => {
    const iconClass = "w-8 h-8"
    switch(category) {
      case 'moment':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      case 'date':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        )
      case 'place':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        )
      case 'gift':
        return <Gift className={iconClass} />
      case 'word':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        )
      case 'song':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        )
      default:
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getElapsedTime = () => {
    if (!startTime) return '0:00'
    const elapsed = Math.floor(((endTime || Date.now()) - startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getScoreMessage = () => {
    if (moves <= memoryPairs.length + 5) return '¡Increíble! Memoria perfecta'
    if (moves <= memoryPairs.length * 2) return '¡Excelente! Gran memoria'
    if (moves <= memoryPairs.length * 3) return '¡Bien hecho! Buena memoria'
    return '¡Completado! Sigan practicando'
  }

  const getScoreIcon = () => {
    if (moves <= memoryPairs.length + 5) return <Trophy className="w-20 h-20 text-yellow-500" />
    if (moves <= memoryPairs.length * 2) return <Star className="w-20 h-20 text-yellow-400" />
    if (moves <= memoryPairs.length * 3) return <Sparkles className="w-20 h-20 text-purple-500" />
    return <PartyPopper className="w-20 h-20 text-pink-500" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/games"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-4 cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Juegos
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-indigo-900">Memoria de Pareja</h1>
          </div>
          <p className="text-indigo-700">Encuentra los pares de momentos especiales de su relación</p>
        </div>

        {/* Intro Screen */}
        {!gameStarted && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4 text-indigo-600">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-indigo-900 mb-4">¿Listos para recordar?</h2>
              <p className="text-gray-700 mb-6">
                Encuentren todos los pares de momentos especiales en el menor número de movimientos posible.
                ¡Pongan a prueba su memoria juntos!
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-indigo-900 mb-3">Cómo jugar:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>Haz clic en una carta para voltearla y ver el momento</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>Encuentra su pareja haciendo clic en otra carta</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>Si coinciden, permanecerán volteadas. Si no, se voltearán de nuevo</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>¡Encuentra todos los pares en el menor número de intentos!</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2 text-purple-600">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="text-sm text-gray-600">Momentos</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2 text-blue-600">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-gray-600">Fechas</div>
              </div>
              <div className="bg-pink-50 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2 text-pink-600">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-gray-600">Lugares</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2 text-red-600">
                  <Gift className="w-8 h-8" />
                </div>
                <div className="text-sm text-gray-600">Regalos</div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2 text-indigo-600">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-gray-600">Palabras</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2 text-green-600">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </div>
                <div className="text-sm text-gray-600">Canciones</div>
              </div>
            </div>

            <button
              onClick={initializeGame}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold text-lg transition shadow-lg hover:shadow-xl"
            >
              Comenzar Juego
            </button>
          </div>
        )}

        {/* Game Screen */}
        {gameStarted && !gameWon && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl shadow-xl p-4 text-center">
                <div className="text-3xl font-bold text-indigo-600">{moves}</div>
                <div className="text-sm text-gray-600">Movimientos</div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{matches}/{memoryPairs.length}</div>
                <div className="text-sm text-gray-600">Pares</div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{getElapsedTime()}</div>
                <div className="text-sm text-gray-600">Tiempo</div>
              </div>
            </div>

            {/* Game Board */}
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`aspect-square rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    card.isFlipped || card.isMatched
                      ? card.isMatched
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                        : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                      : 'bg-gradient-to-br from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600'
                  } shadow-lg flex items-center justify-center p-2`}
                >
                {(card.isFlipped || card.isMatched) ? (
                    <div className="text-center text-white">
                      <div className="flex justify-center mb-1">{getCategoryIcon(card.category)}</div>
                      <div className="text-xs font-semibold leading-tight">{card.content}</div>
                    </div>
                  ) : (
                    <div className="flex justify-center text-white">
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reset Button */}
            <button
              onClick={initializeGame}
              className="w-full bg-white hover:bg-gray-50 text-indigo-600 py-3 rounded-xl font-semibold transition shadow-lg border-2 border-indigo-200"
            >
              Reiniciar Juego
            </button>
          </div>
        )}

        {/* Win Screen */}
        {gameWon && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                {getScoreIcon()}
              </div>
              <h2 className="text-3xl font-bold text-indigo-900 mb-4">¡Felicitaciones!</h2>
              <p className="text-xl text-gray-700 mb-6">{getScoreMessage()}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">{moves}</div>
                <div className="text-sm text-gray-600">Movimientos</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{memoryPairs.length}</div>
                <div className="text-sm text-gray-600">Pares Encontrados</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">{getElapsedTime()}</div>
                <div className="text-sm text-gray-600">Tiempo Total</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-indigo-900 mb-3 text-center">Momentos Recordados:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {memoryPairs.map((pair, index) => {
                  const getColorClass = (cat: string) => {
                    switch(cat) {
                      case 'moment': return 'text-purple-600'
                      case 'date': return 'text-blue-600'
                      case 'place': return 'text-pink-600'
                      case 'word': return 'text-indigo-600'
                      case 'song': return 'text-green-600'
                      default: return 'text-gray-600'
                    }
                  }
                  return (
                    <div key={index} className="bg-white rounded-lg p-3 text-center">
                      <div className={`flex justify-center mb-1 ${getColorClass(pair.category)}`}>
                        {getCategoryIcon(pair.category)}
                      </div>
                      <div className="text-xs text-gray-700 font-semibold">{pair.content}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={initializeGame}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold transition shadow-lg"
              >
                Jugar de Nuevo
              </button>
              <Link
                href="/dashboard/games"
                className="flex-1 bg-white hover:bg-gray-50 text-indigo-600 py-4 rounded-xl font-semibold transition shadow-lg text-center border-2 border-indigo-200"
              >
                Volver a Juegos
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Chat flotante */}
      <FloatingChat currentUserName={currentPersonName} />
    </div>
  )
}
