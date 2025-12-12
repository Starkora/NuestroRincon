'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FloatingChat from '@/components/FloatingChat'

interface DiaryEntry {
  id: number
  user_id: string
  author_name: string
  title: string
  content: string
  mood: string
  is_shared: boolean
  created_at: string
}

export default function DiaryPage() {
  const [loading, setLoading] = useState(true)
  const [currentPersonName, setCurrentPersonName] = useState('')
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: '😊',
    is_shared: true
  })
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'partner'>('all')
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
  const router = useRouter()

  const moods = [
    { emoji: '😊', label: 'Feliz' },
    { emoji: '❤️', label: 'Enamorado' },
    { emoji: '😢', label: 'Triste' },
    { emoji: '😌', label: 'Tranquilo' },
    { emoji: '😍', label: 'Emocionado' },
    { emoji: '🤔', label: 'Pensativo' },
    { emoji: '😴', label: 'Cansado' },
    { emoji: '🥰', label: 'Agradecido' }
  ]

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
    
    await fetchEntries()
    setLoading(false)
  }

  const fetchEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching entries:', error)
      return
    }

    setEntries(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newEntry.title.trim() || !newEntry.content.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('diary_entries')
      .insert([
        {
          user_id: user.id,
          author_name: currentPersonName,
          title: newEntry.title.trim(),
          content: newEntry.content.trim(),
          mood: newEntry.mood,
          is_shared: newEntry.is_shared
        }
      ])

    if (error) {
      console.error('Error creating entry:', error)
      alert('Error al crear la entrada. Por favor intenta de nuevo.')
      return
    }

    setNewEntry({
      title: '',
      content: '',
      mood: '😊',
      is_shared: true
    })
    setShowForm(false)
    await fetchEntries()
  }

  const deleteEntry = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta entrada?')) return

    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting entry:', error)
      return
    }

    await fetchEntries()
    setSelectedEntry(null)
  }

  const getFilteredEntries = () => {
    if (filterMode === 'all') return entries
    if (filterMode === 'mine') return entries.filter(e => e.author_name === currentPersonName)
    return entries.filter(e => e.author_name !== currentPersonName)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-6">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-white">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-purple-900">Diario Compartido</h1>
                <p className="text-purple-700">Sus pensamientos y momentos especiales</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Entrada
            </button>
          </div>
        </div>

        {/* New Entry Form */}
        {showForm && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">Nueva Entrada de Diario</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-purple-900 mb-2">Título</label>
                <input
                  type="text"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  placeholder="Título de tu entrada..."
                  className="w-full p-4 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-900 mb-2">¿Cómo te sientes?</label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.emoji}
                      type="button"
                      onClick={() => setNewEntry({ ...newEntry, mood: mood.emoji })}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        newEntry.mood === mood.emoji
                          ? 'border-purple-500 bg-purple-50 scale-110'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      title={mood.label}
                    >
                      <span className="text-3xl">{mood.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-900 mb-2">Escribe tus pensamientos</label>
                <textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  placeholder="¿Qué quieres compartir hoy?"
                  className="w-full p-4 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none resize-none"
                  rows={8}
                  maxLength={2000}
                  required
                />
                <div className="text-sm text-gray-500 mt-1">{newEntry.content.length}/2000 caracteres</div>
              </div>

              <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-xl">
                <input
                  type="checkbox"
                  id="is_shared"
                  checked={newEntry.is_shared}
                  onChange={(e) => setNewEntry({ ...newEntry, is_shared: e.target.checked })}
                  className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="is_shared" className="text-sm text-purple-900">
                  <span className="font-semibold">Compartir con mi pareja</span>
                  <span className="block text-xs text-purple-600">Si no lo marcas, solo tú podrás verlo</span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
                >
                  Guardar Entrada
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setNewEntry({ title: '', content: '', mood: '😊', is_shared: true })
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                filterMode === 'all'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas ({entries.length})
            </button>
            <button
              onClick={() => setFilterMode('mine')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                filterMode === 'mine'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Mis Entradas ({entries.filter(e => e.author_name === currentPersonName).length})
            </button>
            <button
              onClick={() => setFilterMode('partner')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                filterMode === 'partner'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              De Mi Pareja ({entries.filter(e => e.author_name !== currentPersonName).length})
            </button>
          </div>
        </div>

        {/* Entries Grid */}
        {getFilteredEntries().length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay entradas aún</h3>
            <p className="text-gray-600 mb-6">Comienza a escribir tus pensamientos y momentos especiales</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
            >
              Crear Primera Entrada
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredEntries().map((entry) => (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer p-6 border-2 border-transparent hover:border-purple-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl">{entry.mood}</span>
                  {!entry.is_shared && (
                    <div className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Privado
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2 line-clamp-1">{entry.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">{entry.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold text-purple-600">{entry.author_name}</span>
                  <span>{formatDate(entry.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Entry Detail Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50" onClick={() => setSelectedEntry(null)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-5xl">{selectedEntry.mood}</span>
                    <div>
                      <h2 className="text-3xl font-bold text-purple-900">{selectedEntry.title}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-purple-600">{selectedEntry.author_name}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{formatDate(selectedEntry.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!selectedEntry.is_shared && (
                  <div className="bg-gray-100 border border-gray-300 rounded-xl p-3 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Esta entrada es privada</span>
                  </div>
                )}

                <div className="prose prose-purple max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedEntry.content}</p>
                </div>

                {selectedEntry.author_name === currentPersonName && (
                  <div className="flex gap-4 pt-6 border-t">
                    <button
                      onClick={() => deleteEntry(selectedEntry.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                    <button
                      onClick={() => setSelectedEntry(null)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-all"
                    >
                      Cerrar
                    </button>
                  </div>
                )}
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
