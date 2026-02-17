'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import FloatingChat from '@/components/FloatingChat'

interface Song {
  id: string
  user_id: string
  song_title: string
  artist: string
  spotify_url: string | null
  youtube_url: string | null
  is_current_song: boolean
  occasion: string | null
  notes: string | null
  added_at: string
}

export default function MusicPlaylistsPage() {
  const { user } = useAuth()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [currentPersonName, setCurrentPersonName] = useState('')
  
  // Form states
  const [songTitle, setSongTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [occasion, setOccasion] = useState('')
  const [isCurrentSong, setIsCurrentSong] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (user) {
      fetchSongs()
      const currentPerson = localStorage.getItem('current_person')
      const personName = currentPerson === 'person1' 
        ? user.user_metadata?.person1_name 
        : user.user_metadata?.person2_name
      setCurrentPersonName(personName || 'Usuario')
    }
  }, [user])

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .order('added_at', { ascending: false })

      if (error) throw error
      setSongs(data || [])
      
      // Find current song
      const current = data?.find(song => song.is_current_song)
      setCurrentSong(current || null)
    } catch (error) {
      
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!songTitle.trim() || !artist.trim()) {
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
            song_title: songTitle,
            artist,
            spotify_url: spotifyUrl || null,
            youtube_url: youtubeUrl || null,
            is_current_song: isCurrentSong,
            occasion: occasion || null,
            notes: notes || null,
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('playlists')
          .insert([{
            user_id: user?.id,
            song_title: songTitle,
            artist,
            spotify_url: spotifyUrl || null,
            youtube_url: youtubeUrl || null,
            is_current_song: isCurrentSong,
            occasion: occasion || null,
            notes: notes || null,
          }])

        if (error) throw error
      }

      resetForm()
      fetchSongs()
    } catch (error) {
      
      alert(`Error al guardar la canción: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  const resetForm = () => {
    setSongTitle('')
    setArtist('')
    setSpotifyUrl('')
    setYoutubeUrl('')
    setOccasion('')
    setIsCurrentSong(false)
    setNotes('')
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (song: Song) => {
    setEditingId(song.id)
    setSongTitle(song.song_title)
    setArtist(song.artist)
    setSpotifyUrl(song.spotify_url || '')
    setYoutubeUrl(song.youtube_url || '')
    setOccasion(song.occasion || '')
    setIsCurrentSong(song.is_current_song)
    setNotes(song.notes || '')
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
            <h2 className="text-2xl font-bold mb-1">{currentSong.song_title}</h2>
            <p className="text-lg opacity-90 mb-4">{currentSong.artist}</p>
            {currentSong.notes && (
              <p className="text-sm opacity-80 italic mb-4">"{currentSong.notes}"</p>
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

            </div>
          </div>
        )}

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
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
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
                  Ocasión especial
                </label>
                <input
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="Primera cita, Aniversario, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nota o recuerdo especial
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{song.song_title}</h3>
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
                        {song.occasion && (
                          <p className="text-sm text-purple-600 mb-2">📍 {song.occasion}</p>
                        )}
                        {song.notes && (
                          <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg mt-2 italic">
                            "{song.notes}"
                          </p>
                        )}
                      </div>
                    </div>

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
      
      {/* Chat flotante */}
      <FloatingChat currentUserName={currentPersonName} />
    </div>
  )
}
