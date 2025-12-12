'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Song {
  id: string
  title: string
  artist: string
  album: string | null
  spotify_url: string | null
  youtube_url: string | null
  apple_music_url: string | null
  category: 'our_song' | 'date' | 'chill' | 'party' | 'romantic' | 'workout' | 'travel' | 'other'
  is_current_song: boolean
  memory_note: string | null
  added_by: string
  created_at: string
}

export default function MusicPlaylistsPage() {
  const { user } = useAuth()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | string>('all')
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  
  // Form states
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [album, setAlbum] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [appleMusicUrl, setAppleMusicUrl] = useState('')
  const [category, setCategory] = useState<'our_song' | 'date' | 'chill' | 'party' | 'romantic' | 'workout' | 'travel' | 'other'>('romantic')
  const [isCurrentSong, setIsCurrentSong] = useState(false)
  const [memoryNote, setMemoryNote] = useState('')

  useEffect(() => {
    if (user) {
      fetchSongs()
    }
  }, [user, filter])

  const fetchSongs = async () => {
    try {
      let query = supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('category', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setSongs(data || [])
      
      // Find current song
      const current = data?.find(song => song.is_current_song)
      setCurrentSong(current || null)
    } catch (error) {
      console.error('Error al cargar canciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !artist.trim()) {
      alert('El título y artista son obligatorios')
      return
    }

    try {
      // If marking as current song, unmark all others first
      if (isCurrentSong) {
        await supabase
          .from('playlists')
          .update({ is_current_song: false })
          .eq('is_current_song', true)
      }

      if (editingId) {
        const { error } = await supabase
          .from('playlists')
          .update({
            title,
            artist,
            album: album || null,
            spotify_url: spotifyUrl || null,
            youtube_url: youtubeUrl || null,
            apple_music_url: appleMusicUrl || null,
            category,
            is_current_song: isCurrentSong,
            memory_note: memoryNote || null,
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('playlists')
          .insert([
            {
              title,
              artist,
              album: album || null,
              spotify_url: spotifyUrl || null,
              youtube_url: youtubeUrl || null,
              apple_music_url: appleMusicUrl || null,
              category,
              is_current_song: isCurrentSong,
              memory_note: memoryNote || null,
              added_by: user?.id,
            }
          ])

        if (error) throw error
      }

      resetForm()
      fetchSongs()
    } catch (error) {
      console.error('Error al guardar canción:', error)
      alert('Error al guardar la canción')
    }
  }

  const resetForm = () => {
    setTitle('')
    setArtist('')
    setAlbum('')
    setSpotifyUrl('')
    setYoutubeUrl('')
    setAppleMusicUrl('')
    setCategory('romantic')
    setIsCurrentSong(false)
    setMemoryNote('')
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (song: Song) => {
    setEditingId(song.id)
    setTitle(song.title)
    setArtist(song.artist)
    setAlbum(song.album || '')
    setSpotifyUrl(song.spotify_url || '')
    setYoutubeUrl(song.youtube_url || '')
    setAppleMusicUrl(song.apple_music_url || '')
    setCategory(song.category)
    setIsCurrentSong(song.is_current_song)
    setMemoryNote(song.memory_note || '')
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta canción?')) return

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchSongs()
    } catch (error) {
      console.error('Error al eliminar canción:', error)
      alert('Error al eliminar la canción')
    }
  }

  const setAsCurrentSong = async (id: string) => {
    try {
      // Unmark all others
      await supabase
        .from('playlists')
        .update({ is_current_song: false })
        .eq('is_current_song', true)

      // Mark this one
      const { error } = await supabase
        .from('playlists')
        .update({ is_current_song: true })
        .eq('id', id)

      if (error) throw error
      fetchSongs()
    } catch (error) {
      console.error('Error al marcar canción actual:', error)
    }
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'our_song':
        return (
          <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        )
      case 'date':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
          </svg>
        )
      case 'chill':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      case 'party':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        )
      case 'romantic':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )
      case 'workout':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'travel':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        )
    }
  }

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      our_song: 'Nuestra Canción',
      date: 'Para Citas',
      chill: 'Relajante',
      party: 'Fiesta',
      romantic: 'Romántica',
      workout: 'Ejercicio',
      travel: 'Viaje',
      other: 'Otro'
    }
    return labels[cat] || cat
  }

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      our_song: 'bg-pink-100 text-pink-700',
      date: 'bg-red-100 text-red-700',
      chill: 'bg-blue-100 text-blue-700',
      party: 'bg-yellow-100 text-yellow-700',
      romantic: 'bg-purple-100 text-purple-700',
      workout: 'bg-orange-100 text-orange-700',
      travel: 'bg-green-100 text-green-700',
      other: 'bg-gray-100 text-gray-700'
    }
    return colors[cat] || 'bg-gray-100 text-gray-700'
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <h1 className="text-2xl font-bold text-purple-900">Música y Playlists</h1>
            </div>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              if (showForm) {
                resetForm()
              }
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition cursor-pointer flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showForm ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              )}
            </svg>
            {showForm ? 'Cancelar' : 'Agregar Canción'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Current Song Highlight */}
        {currentSong && !showForm && (
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium opacity-90">Canción del Momento</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">{currentSong.title}</h2>
            <p className="text-lg opacity-90 mb-4">{currentSong.artist}</p>
            {currentSong.memory_note && (
              <p className="text-sm opacity-80 italic mb-4">"{currentSong.memory_note}"</p>
            )}
            <div className="flex gap-2 flex-wrap">
              {currentSong.spotify_url && (
                <a
                  href={currentSong.spotify_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Spotify
                </a>
              )}
              {currentSong.youtube_url && (
                <a
                  href={currentSong.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </a>
              )}
              {currentSong.apple_music_url && (
                <a
                  href={currentSong.apple_music_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.5 10.5 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.258 1.466-2.755 2.787-.107.283-.17.576-.232.87-.024.125-.04.252-.06.378-.002.01-.007.02-.01.03v12.925c.028.15.043.303.063.454.107.846.29 1.67.656 2.456.401.857.95 1.6 1.737 2.152.583.41 1.232.68 1.926.864.517.138 1.042.196 1.57.24.206.018.412.024.618.04h12.038c.107-.01.214-.02.32-.027.77-.05 1.534-.15 2.262-.45 1.34-.553 2.28-1.517 2.758-2.9.11-.32.186-.647.241-.98.02-.118.035-.235.053-.353.001-.028.008-.055.013-.083V6.124zM12.223 3.22c-.53.06-1.045.12-1.56.18-.53.06-1.062.118-1.593.18-.338.037-.677.074-1.015.113a9.21 9.21 0 0 0-1.004.13c-.177.03-.354.055-.532.09a3.476 3.476 0 0 0-1.593.674c-.44.37-.728.84-.87 1.393-.102.395-.14.798-.17 1.203-.03.414-.05.83-.074 1.245 0 .07-.015.14-.023.21v7.874c.01.14.023.28.033.42.05.71.098 1.42.196 2.123.135.962.45 1.87 1.05 2.66.48.633 1.097 1.09 1.83 1.39.48.195.977.315 1.486.39.373.055.75.09 1.126.122.44.037.882.06 1.323.09.53.037 1.06.074 1.59.108.53.035 1.063.068 1.594.1.177.01.354.018.53.03h.03c.01-.206.023-.412.03-.618.018-.277.028-.555.043-.832.023-.424.05-.85.07-1.274.023-.424.04-.85.06-1.274.02-.424.046-.848.07-1.272.023-.424.042-.848.062-1.27.02-.355.035-.71.055-1.065l.006-.108v-.05c-.118-.01-.235-.022-.353-.033a7.758 7.758 0 0 1-1.12-.14 5.218 5.218 0 0 1-2.533-1.234 5.263 5.263 0 0 1-1.477-3.06 5.232 5.232 0 0 1 .39-2.67 5.227 5.227 0 0 1 2.297-2.48 5.23 5.23 0 0 1 1.876-.617c.345-.043.69-.058 1.036-.06.118 0 .235-.013.353-.02V3.22zm8.428 10.972c-.01.118-.023.235-.033.353-.05.59-.1 1.178-.196 1.76-.135.817-.39 1.605-.82 2.333-.535.906-1.255 1.6-2.196 2.04-.7.326-1.443.5-2.213.6-.373.05-.747.08-1.12.108-.118.01-.235.023-.353.033v.04c-.118.01-.236.022-.354.033-.177.015-.355.023-.532.04-.354.032-.71.06-1.064.09-.424.037-.848.074-1.272.107a61.086 61.086 0 0 1-1.803.13c-.424.02-.848.03-1.272.04-.177.006-.354.015-.532.023h-.03c-.01-.177-.023-.354-.033-.532-.02-.354-.035-.71-.055-1.064-.023-.424-.05-.848-.07-1.272-.023-.424-.043-.848-.063-1.272-.02-.355-.035-.71-.055-1.065v-.353-.176c.118-.01.236-.02.354-.03.177-.015.354-.023.53-.04.708-.06 1.416-.118 2.124-.196.69-.075 1.366-.196 2.02-.424 1.04-.363 1.916-.98 2.578-1.893.498-.686.82-1.456.982-2.293.118-.61.15-1.228.108-1.847-.05-.708-.224-1.393-.532-2.038-.118-.246-.254-.484-.39-.72-.01-.017-.023-.033-.033-.05.01-.01.02-.023.033-.033.118-.118.235-.235.353-.353.354-.354.71-.707 1.064-1.06.177-.178.353-.357.532-.535.118-.118.236-.236.354-.354.118-.117.235-.235.353-.353.354-.353.71-.706 1.065-1.06.176-.176.353-.353.53-.53.06-.06.118-.118.177-.175h.007c.01.177.023.355.033.532.02.354.035.71.055 1.065.023.424.05.848.07 1.272.023.424.043.848.063 1.272.02.354.035.707.055 1.06v.177.353c0 .118.01.236.02.354.02.354.036.707.056 1.06.023.425.05.85.07 1.274.023.424.042.848.062 1.27.02.355.035.71.055 1.065v.176l.002.177z"/>
                  </svg>
                  Apple Music
                </a>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            Todas
          </button>
          {['our_song', 'romantic', 'date', 'chill', 'party', 'workout', 'travel', 'other'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                filter === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-purple-50'
              }`}
            >
              {getCategoryIcon(cat)}
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-purple-900 mb-4">
              {editingId ? 'Editar Canción' : 'Agregar Nueva Canción'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título de la canción *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Shape of You"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artista *
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    required
                    placeholder="Ed Sheeran"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Álbum
                </label>
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  placeholder="÷ (Divide)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                >
                  <option value="romantic">Romántica</option>
                  <option value="our_song">Nuestra Canción</option>
                  <option value="date">Para Citas</option>
                  <option value="chill">Relajante</option>
                  <option value="party">Fiesta</option>
                  <option value="workout">Ejercicio</option>
                  <option value="travel">Viaje</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Spotify
                  </label>
                  <input
                    type="url"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="https://open.spotify.com/track/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de YouTube
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Apple Music
                  </label>
                  <input
                    type="url"
                    value={appleMusicUrl}
                    onChange={(e) => setAppleMusicUrl(e.target.value)}
                    placeholder="https://music.apple.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nota o recuerdo especial
                </label>
                <textarea
                  value={memoryNote}
                  onChange={(e) => setMemoryNote(e.target.value)}
                  placeholder="Esta canción sonaba cuando..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="currentSong"
                  checked={isCurrentSong}
                  onChange={(e) => setIsCurrentSong(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="currentSong" className="text-sm text-gray-700 cursor-pointer">
                  Marcar como "Canción del Momento" (se mostrará destacada)
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition cursor-pointer"
              >
                {editingId ? 'Guardar Cambios' : 'Agregar a Playlist'}
              </button>
            </form>
          </div>
        )}

        {/* Songs List */}
        <div className="space-y-4">
          {songs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No hay canciones en tu playlist
              </h3>
              <p className="text-gray-600">
                Comienzas a crear su biblioteca musical compartida
              </p>
            </div>
          ) : (
            songs.map((song) => (
              <div
                key={song.id}
                className={`bg-white rounded-xl shadow-md p-6 transition hover:shadow-lg ${
                  song.is_current_song ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-shrink-0 mt-1">
                        {getCategoryIcon(song.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{song.title}</h3>
                          {song.is_current_song && (
                            <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              Sonando ahora
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-1">{song.artist}</p>
                        {song.album && (
                          <p className="text-sm text-gray-500 mb-2">Álbum: {song.album}</p>
                        )}
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getCategoryColor(song.category)}`}>
                          {getCategoryIcon(song.category)}
                          {getCategoryLabel(song.category)}
                        </span>
                      </div>
                    </div>

                    {song.memory_note && (
                      <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg ml-8 mb-3 italic">
                        "{song.memory_note}"
                      </p>
                    )}

                    <div className="flex gap-2 flex-wrap ml-8">
                      {song.spotify_url && (
                        <a
                          href={song.spotify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                          Spotify
                        </a>
                      )}
                      {song.youtube_url && (
                        <a
                          href={song.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200 transition cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          YouTube
                        </a>
                      )}
                      {song.apple_music_url && (
                        <a
                          href={song.apple_music_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.5 10.5 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.258 1.466-2.755 2.787-.107.283-.17.576-.232.87-.024.125-.04.252-.06.378-.002.01-.007.02-.01.03v12.925c.028.15.043.303.063.454.107.846.29 1.67.656 2.456.401.857.95 1.6 1.737 2.152.583.41 1.232.68 1.926.864.517.138 1.042.196 1.57.24.206.018.412.024.618.04h12.038c.107-.01.214-.02.32-.027.77-.05 1.534-.15 2.262-.45 1.34-.553 2.28-1.517 2.758-2.9.11-.32.186-.647.241-.98.02-.118.035-.235.053-.353.001-.028.008-.055.013-.083V6.124z"/>
                          </svg>
                          Apple Music
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!song.is_current_song && (
                      <button
                        onClick={() => setAsCurrentSong(song.id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                        title="Marcar como canción del momento"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(song)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(song.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
