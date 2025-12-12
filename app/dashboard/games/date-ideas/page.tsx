'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FloatingChat from '@/components/FloatingChat'

interface DateIdea {
  category: string
  idea: string
  budget: string
  time: string
  icon: string
}

const dateIdeas: DateIdea[] = [
  // Románticas
  { category: 'Romántica', idea: 'Cena a la luz de las velas en casa', budget: 'Bajo', time: '2-3 horas', icon: '🕯️' },
  { category: 'Romántica', idea: 'Picnic al atardecer en un parque', budget: 'Bajo', time: '3-4 horas', icon: '🧺' },
  { category: 'Romántica', idea: 'Ver el amanecer o atardecer juntos', budget: 'Gratis', time: '1-2 horas', icon: '🌅' },
  { category: 'Romántica', idea: 'Baño relajante con sales y música', budget: 'Bajo', time: '1-2 horas', icon: '🛁' },
  { category: 'Romántica', idea: 'Noche de películas románticas con snacks', budget: 'Bajo', time: '3-4 horas', icon: '🎬' },
  
  // Aventura
  { category: 'Aventura', idea: 'Senderismo en una montaña cercana', budget: 'Gratis', time: '4-6 horas', icon: '⛰️' },
  { category: 'Aventura', idea: 'Explorar un pueblo o ciudad nueva', budget: 'Medio', time: 'Todo el día', icon: '🗺️' },
  { category: 'Aventura', idea: 'Hacer un tour en bicicleta', budget: 'Bajo', time: '2-4 horas', icon: '🚴' },
  { category: 'Aventura', idea: 'Visitar un mercado local que no conozcan', budget: 'Bajo', time: '2-3 horas', icon: '🏪' },
  { category: 'Aventura', idea: 'Escape room para parejas', budget: 'Medio', time: '1-2 horas', icon: '🔐' },
  
  // Creativas
  { category: 'Creativa', idea: 'Clase de cocina juntos en casa', budget: 'Bajo', time: '2-3 horas', icon: '👨‍🍳' },
  { category: 'Creativa', idea: 'Noche de arte: pintura o manualidades', budget: 'Bajo', time: '2-3 horas', icon: '🎨' },
  { category: 'Creativa', idea: 'Karaoke en casa o en un bar', budget: 'Bajo-Medio', time: '2-3 horas', icon: '🎤' },
  { category: 'Creativa', idea: 'Sesión de fotos DIY en lugares bonitos', budget: 'Gratis', time: '2-3 horas', icon: '📸' },
  { category: 'Creativa', idea: 'Crear un álbum de recuerdos juntos', budget: 'Bajo', time: '3-4 horas', icon: '📔' },
  
  // Relajantes
  { category: 'Relajante', idea: 'Masajes mutuos con aceites aromáticos', budget: 'Bajo', time: '1-2 horas', icon: '💆' },
  { category: 'Relajante', idea: 'Leer libros juntos en un café', budget: 'Bajo', time: '2-3 horas', icon: '📚' },
  { category: 'Relajante', idea: 'Yoga o meditación en pareja', budget: 'Gratis', time: '1-2 horas', icon: '🧘' },
  { category: 'Relajante', idea: 'Tarde de spa en casa con mascarillas', budget: 'Bajo', time: '2-3 horas', icon: '🧖' },
  { category: 'Relajante', idea: 'Observar las estrellas desde un lugar oscuro', budget: 'Gratis', time: '2-3 horas', icon: '⭐' },
  
  // Gastronómicas
  { category: 'Gastronómica', idea: 'Tour gastronómico por la ciudad', budget: 'Medio-Alto', time: '4-5 horas', icon: '🍽️' },
  { category: 'Gastronómica', idea: 'Cocinar una receta nueva de otro país', budget: 'Bajo-Medio', time: '2-3 horas', icon: '🌮' },
  { category: 'Gastronómica', idea: 'Cata de vinos o cervezas artesanales', budget: 'Medio', time: '2-3 horas', icon: '🍷' },
  { category: 'Gastronómica', idea: 'Preparar postres juntos desde cero', budget: 'Bajo', time: '2-3 horas', icon: '🍰' },
  { category: 'Gastronómica', idea: 'Brunch especial en un lugar nuevo', budget: 'Medio', time: '2-3 horas', icon: '🥞' },
  
  // Divertidas
  { category: 'Divertida', idea: 'Noche de juegos de mesa o videojuegos', budget: 'Bajo', time: '2-4 horas', icon: '🎮' },
  { category: 'Divertida', idea: 'Ir a una feria o parque de diversiones', budget: 'Medio', time: '4-6 horas', icon: '🎡' },
  { category: 'Divertida', idea: 'Mini golf o boliche', budget: 'Medio', time: '2-3 horas', icon: '⛳' },
  { category: 'Divertida', idea: 'Visitar un museo o galería de arte', budget: 'Bajo-Medio', time: '2-3 horas', icon: '🖼️' },
  { category: 'Divertida', idea: 'Ir a un concierto o evento en vivo', budget: 'Medio-Alto', time: '3-4 horas', icon: '🎵' },
]

export default function DateIdeasGame() {
  const [loading, setLoading] = useState(true)
  const [currentPersonName, setCurrentPersonName] = useState('')
  const [currentIdea, setCurrentIdea] = useState<DateIdea | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')
  const [savedIdeas, setSavedIdeas] = useState<DateIdea[]>([])
  const router = useRouter()

  const categories = ['Todas', 'Romántica', 'Aventura', 'Creativa', 'Relajante', 'Gastronómica', 'Divertida']

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

  const generateIdea = () => {
    const filteredIdeas = selectedCategory === 'Todas' 
      ? dateIdeas 
      : dateIdeas.filter(idea => idea.category === selectedCategory)
    
    const randomIdea = filteredIdeas[Math.floor(Math.random() * filteredIdeas.length)]
    setCurrentIdea(randomIdea)
  }

  const saveIdea = () => {
    if (currentIdea && !savedIdeas.find(idea => idea.idea === currentIdea.idea)) {
      setSavedIdeas([...savedIdeas, currentIdea])
    }
  }

  const removeSavedIdea = (ideaToRemove: DateIdea) => {
    setSavedIdeas(savedIdeas.filter(idea => idea.idea !== ideaToRemove.idea))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-6">
      <div className="max-w-5xl mx-auto">
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
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-purple-900">Generador de Citas</h1>
          </div>
          <p className="text-purple-700">Ideas aleatorias para tu próxima cita romántica</p>
        </div>

        {/* Category Filter */}
        <div className="mb-6 bg-white/80 backdrop-blur rounded-2xl p-4 shadow-lg">
          <h3 className="text-sm font-semibold text-purple-900 mb-3">Categoría:</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-semibold transition cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Generator Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
              {!currentIdea ? (
                <div className="text-center py-12">
                  <div className="text-8xl mb-6">🎲</div>
                  <h2 className="text-3xl font-bold text-purple-900 mb-4">
                    Genera una idea de cita
                  </h2>
                  <p className="text-purple-600 mb-8">
                    Haz clic en el botón para obtener una idea aleatoria
                  </p>
                  <button
                    onClick={generateIdea}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    Generar Idea
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full px-6 py-2 text-sm font-semibold mb-4">
                      {currentIdea.category}
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <div className="text-7xl mb-6">{currentIdea.icon}</div>
                    <h2 className="text-3xl font-bold text-purple-900 mb-6 leading-relaxed">
                      {currentIdea.idea}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                    <div className="text-center">
                      <div className="text-2xl mb-2">💰</div>
                      <div className="text-sm text-purple-600 font-semibold">Presupuesto</div>
                      <div className="text-purple-900 font-bold">{currentIdea.budget}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">⏱️</div>
                      <div className="text-sm text-purple-600 font-semibold">Duración</div>
                      <div className="text-purple-900 font-bold">{currentIdea.time}</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={saveIdea}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                      </svg>
                      Guardar Idea
                    </button>
                    <button
                      onClick={generateIdea}
                      className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Otra Idea
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Saved Ideas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sticky top-6">
              <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                <span>💾</span> Ideas Guardadas
              </h3>
              
              {savedIdeas.length === 0 ? (
                <div className="text-center py-8 text-purple-400">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-sm">Aún no has guardado ninguna idea</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {savedIdeas.map((idea, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 group hover:shadow-lg transition"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-2xl">{idea.icon}</span>
                        <button
                          onClick={() => removeSavedIdea(idea)}
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-purple-900 mb-2">{idea.idea}</p>
                      <div className="flex gap-2 text-xs text-purple-600">
                        <span className="bg-white px-2 py-1 rounded">{idea.category}</span>
                        <span className="bg-white px-2 py-1 rounded">{idea.budget}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-white/80 backdrop-blur rounded-2xl p-6 border-2 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="font-bold text-purple-900 mb-2">Consejos para citas exitosas:</h3>
              <ul className="space-y-2 text-purple-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Adapten la idea a sus gustos y presupuesto</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Lo importante es pasar tiempo de calidad juntos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Guarden las ideas que les gusten para planear futuras citas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-500 mt-1">•</span>
                  <span>Prueben cosas nuevas juntos para mantener la chispa viva</span>
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
