'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import FloatingChat from '@/components/FloatingChat'

interface MoodEntry {
  id: string
  user_id: string
  entry_date: string
  mood: 'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad'
  mood_value: number
  activities: string[]
  notes: string | null
  created_at: string
}

export default function MoodTrackerPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'stats'>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null)
  const [currentPersonName, setCurrentPersonName] = useState('')
  
  // Form states
  const [mood, setMood] = useState<'very_happy' | 'happy' | 'neutral' | 'sad' | 'very_sad'>('happy')
  const [moodValue, setMoodValue] = useState(3)
  const [activities, setActivities] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const availableActivities = [
    'exercise', 'work', 'social', 'family', 'hobby', 
    'relaxation', 'date', 'travel', 'study', 'other'
  ]

  useEffect(() => {
    if (user) {
      fetchEntries()
      checkTodayEntry()
      const currentPerson = localStorage.getItem('current_person')
      const personName = currentPerson === 'person1' 
        ? user.user_metadata?.person1_name 
        : user.user_metadata?.person2_name
      setCurrentPersonName(personName || 'Usuario')
    }
  }, [user])

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('entry_date', { ascending: false })
        .limit(30)

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      
    } finally {
      setLoading(false)
    }
  }

  const checkTodayEntry = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user?.id)
        .eq('entry_date', today)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setTodayEntry(data || null)
      
      if (data) {
        setMood(data.mood)
        setMoodValue(data.mood_value)
        setActivities(data.activities || [])
        setNotes(data.notes || '')
      }
    } catch (error) {
      
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      if (todayEntry) {
        const { error } = await supabase
          .from('mood_entries')
          .update({
            mood,
            mood_value: moodValue,
            activities,
            notes: notes || null,
          })
          .eq('id', todayEntry.id)

        if (error) throw error
        alert('Estado de ánimo actualizado')
      } else {
        const { error } = await supabase
          .from('mood_entries')
          .insert([
            {
              user_id: user?.id,
              entry_date: today,
              mood,
              mood_value: moodValue,
              activities,
              notes: notes || null,
            }
          ])

        if (error) throw error
        alert('Estado de ánimo guardado')
      }

      setShowForm(false)
      fetchEntries()
      checkTodayEntry()
    } catch (error: any) {
      
      if (error.code === '23505') {
        alert('Ya registraste tu ánimo hoy. Puedes editarlo.')
      } else {
        alert('Error al guardar el estado de ánimo')
      }
    }
  }

  const toggleActivity = (activity: string) => {
    if (activities.includes(activity)) {
      setActivities(activities.filter(a => a !== activity))
    } else {
      setActivities([...activities, activity])
    }
  }

  const getMoodIcon = (moodValue: string) => {
    switch (moodValue) {
      case 'very_happy':
        return (
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
          </svg>
        )
      case 'happy':
        return (
          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
          </svg>
        )
      case 'neutral':
        return (
          <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-5 5a1 1 0 011-1h2a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'sad':
        return (
          <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 5 5 0 017.072 0 1 1 0 001.415-1.415 7 7 0 00-9.9 0 1 1 0 000 1.415z" clipRule="evenodd" />
          </svg>
        )
      case 'very_sad':
        return (
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 5 5 0 017.072 0 1 1 0 001.415-1.415 7 7 0 00-9.9 0 1 1 0 000 1.415z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  const getMoodLabel = (moodValue: string) => {
    switch (moodValue) {
      case 'very_happy': return 'Muy Feliz'
      case 'happy': return 'Feliz'
      case 'neutral': return 'Normal'
      case 'sad': return 'Triste'
      case 'very_sad': return 'Muy Triste'
      default: return moodValue
    }
  }

  const getMoodColor = (moodValue: string) => {
    switch (moodValue) {
      case 'very_happy': return 'bg-green-100 text-green-800'
      case 'happy': return 'bg-blue-100 text-blue-800'
      case 'neutral': return 'bg-yellow-100 text-yellow-800'
      case 'sad': return 'bg-orange-100 text-orange-800'
      case 'very_sad': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (activity: string) => {
    const iconClass = "w-5 h-5"
    switch (activity) {
      case 'exercise':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'work':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'social':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      case 'family':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      case 'hobby':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        )
      case 'relaxation':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )
      case 'date':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )
      case 'travel':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'study':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )
    }
  }

  const getActivityLabel = (activity: string) => {
    const labels: Record<string, string> = {
      exercise: 'Ejercicio',
      work: 'Trabajo',
      social: 'Social',
      family: 'Familia',
      hobby: 'Pasatiempo',
      relaxation: 'Relajación',
      date: 'Cita',
      travel: 'Viaje',
      study: 'Estudio',
      other: 'Otro'
    }
    return labels[activity] || activity
  }

  const calculateStats = () => {
    if (entries.length === 0) return null

    const moodCounts: Record<string, number> = {
      very_happy: 0,
      happy: 0,
      neutral: 0,
      sad: 0,
      very_sad: 0
    }

    let totalMoodValue = 0
    entries.forEach(entry => {
      moodCounts[entry.mood]++
      totalMoodValue += entry.mood_value
    })

    const avgMoodValue = (totalMoodValue / entries.length).toFixed(1)
    const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0] as any

    return {
      totalEntries: entries.length,
      avgMoodValue,
      mostCommonMood,
      moodCounts
    }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-purple-600">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
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
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
              </svg>
              <h1 className="text-2xl font-bold text-purple-900">Mood Tracker</h1>
            </div>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              if (!showForm && todayEntry) {
                setMood(todayEntry.mood)
                setMoodValue(todayEntry.mood_value)
                setActivities(todayEntry.activities || [])
                setNotes(todayEntry.notes || '')
              }
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition cursor-pointer flex items-center gap-2 ${
              todayEntry
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showForm ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : todayEntry ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              )}
            </svg>
            {showForm ? 'Cancelar' : todayEntry ? 'Editar Hoy' : '¿Cómo te sientes hoy?'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            Calendario
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              viewMode === 'stats'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            Estadísticas
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-purple-900 mb-4">
              {todayEntry ? 'Actualizar mi ánimo de hoy' : '¿Cómo te sientes hoy?'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mood Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Estado de ánimo *
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {(['very_happy', 'happy', 'neutral', 'sad', 'very_sad'] as const).map((moodOption) => (
                    <button
                      key={moodOption}
                      type="button"
                      onClick={() => setMood(moodOption)}
                      className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col items-center gap-2 ${
                        mood === moodOption
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {getMoodIcon(moodOption)}
                      <span className="text-xs font-medium text-gray-700">
                        {getMoodLabel(moodOption)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intensidad del estado: {moodValue}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={moodValue}
                  onChange={(e) => setMoodValue(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Muy bajo</span>
                  <span>Muy alto</span>
                </div>
              </div>

              {/* Activities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Actividades del día
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableActivities.map((activity) => (
                    <button
                      key={activity}
                      type="button"
                      onClick={() => toggleActivity(activity)}
                      className={`px-3 py-2 rounded-lg border transition cursor-pointer flex items-center gap-2 text-sm ${
                        activities.includes(activity)
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      {getActivityIcon(activity)}
                      <span>{getActivityLabel(activity)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="¿Qué pasó hoy? ¿Cómo te sentiste?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition cursor-pointer"
              >
                {todayEntry ? 'Actualizar' : 'Guardar'}
              </button>
            </form>
          </div>
        )}

        {/* Stats View */}
        {viewMode === 'stats' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Entradas</h3>
                <p className="text-4xl font-bold text-purple-600">{stats.totalEntries}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Intensidad Promedio</h3>
                <p className="text-4xl font-bold text-purple-600">{stats.avgMoodValue}/5</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Ánimo Más Común</h3>
                <div className="flex items-center gap-2 mt-2">
                  {getMoodIcon(stats.mostCommonMood)}
                  <span className="text-xl font-bold text-gray-800">
                    {getMoodLabel(stats.mostCommonMood)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución de Estados</h3>
              <div className="space-y-3">
                {Object.entries(stats.moodCounts).map(([moodKey, count]) => (
                  <div key={moodKey}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getMoodIcon(moodKey)}
                        <span className="text-sm font-medium text-gray-700">
                          {getMoodLabel(moodKey)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {count} ({Math.round((count / stats.totalEntries) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getMoodColor(moodKey).split(' ')[0].replace('100', '500')}`}
                        style={{ width: `${(count / stats.totalEntries) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Aún no has registrado tu ánimo
                </h3>
                <p className="text-gray-600">
                  Comienza a rastrear cómo te sientes cada día
                </p>
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getMoodIcon(entry.mood)}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {getMoodLabel(entry.mood)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(entry.entry_date).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="ml-11 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Intensidad:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`w-6 h-2 rounded-full ${
                                  level <= entry.mood_value
                                    ? 'bg-purple-600'
                                    : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span>{entry.mood_value}/5</span>
                        </div>

                        {entry.activities && entry.activities.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-600">Actividades:</span>
                            {entry.activities.map((activity) => (
                              <span
                                key={activity}
                                className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                              >
                                {getActivityIcon(activity)}
                                {getActivityLabel(activity)}
                              </span>
                            ))}
                          </div>
                        )}

                        {entry.notes && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Últimos 30 días</h3>
            <div className="grid grid-cols-7 gap-2">
              {entries.slice(0, 28).map((entry) => (
                <div
                  key={entry.id}
                  className={`aspect-square rounded-lg p-2 flex flex-col items-center justify-center ${getMoodColor(entry.mood)} cursor-pointer hover:scale-105 transition`}
                  title={`${new Date(entry.entry_date).toLocaleDateString('es-ES')} - ${getMoodLabel(entry.mood)}`}
                >
                  <div className="scale-75">
                    {getMoodIcon(entry.mood)}
                  </div>
                  <span className="text-xs font-medium mt-1">
                    {new Date(entry.entry_date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Chat flotante */}
      <FloatingChat currentUserName={currentPersonName} />
    </div>
  )
}
