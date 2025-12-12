'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import FloatingChat from '@/components/FloatingChat'

interface WishlistItem {
  id: string
  title: string
  description: string | null
  category: 'gift' | 'experience' | 'travel' | 'restaurant' | 'other'
  priority: number
  estimated_cost: number | null
  is_purchased: boolean
  purchased_by: string | null
  purchased_at: string | null
  image_url: string | null
  link: string | null
  votes: number
  created_at: string
}

export default function ListaDeseosPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [partnerUserId, setPartnerUserId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all')
  const [currentPersonName, setCurrentPersonName] = useState('')
  
  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'gift' | 'experience' | 'travel' | 'restaurant' | 'other'>('gift')
  const [priority, setPriority] = useState<number>(3)
  const [estimatedCost, setEstimatedCost] = useState('')
  const [link, setLink] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (user) {
      findPartner()
      fetchItems()
      const currentPerson = localStorage.getItem('current_person')
      const personName = currentPerson === 'person1' 
        ? user.user_metadata?.person1_name 
        : user.user_metadata?.person2_name
      setCurrentPersonName(personName || 'Usuario')
    }
  }, [user, filter])

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
        console.warn('Error finding partner (optional):', error.message)
        return
      }
      
      if (profiles && profiles.length > 0) {
        setPartnerUserId(profiles[0].id)
      }
    } catch (error) {
      // Este error no es crítico, solo lo registramos
      console.warn('Could not find partner (this is optional):', error)
    }
  }

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary no está configurado. Agrega tus credenciales en .env.local')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error('Error al subir imagen a Cloudinary')
    }

    const data = await response.json()
    return data.secure_url
  }

  const fetchItems = async () => {
    try {
      let query = supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (filter === 'pending') {
        query = query.eq('is_purchased', false)
      } else if (filter === 'purchased') {
        query = query.eq('is_purchased', true)
      }

      const { data, error } = await query

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error al cargar deseos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setUploadingImage(true)
      let finalImageUrl = imageUrl
      
      // Si hay un archivo nuevo, subirlo a Cloudinary
      if (imageFile) {
        finalImageUrl = await uploadToCloudinary(imageFile)
      }

      if (editingId) {
        const { error } = await supabase
          .from('wishlist')
          .update({
            title,
            description: description || null,
            category,
            priority,
            estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
            link: link || null,
            image_url: finalImageUrl || null,
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert([{
            user_id: user?.id,
            title,
            description: description || null,
            category,
            priority,
            estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
            link: link || null,
            image_url: finalImageUrl || null,
            is_purchased: false,
            votes: 0,
          }])

        if (error) throw error
      }

      resetForm()
      fetchItems()
    } catch (error) {
      console.error('Error al guardar deseo:', error)
      alert(`Error al guardar el deseo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setCategory('gift')
    setPriority(3)
    setEstimatedCost('')
    setLink('')
    setImageFile(null)
    setImageUrl('')
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (item: WishlistItem) => {
    setEditingId(item.id)
    setTitle(item.title)
    setDescription(item.description || '')
    setCategory(item.category)
    setPriority(item.priority)
    setEstimatedCost(item.estimated_cost?.toString() || '')
    setLink(item.link || '')
    setImageUrl(item.image_url || '')
    setImageFile(null)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este deseo?')) return

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchItems()
    } catch (error) {
      console.error('Error al eliminar deseo:', error)
      alert('Error al eliminar el deseo')
    }
  }

  const togglePurchased = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .update({ 
          is_purchased: !currentStatus,
          purchased_by: !currentStatus ? user?.id : null
        })
        .eq('id', id)

      if (error) throw error
      fetchItems()
    } catch (error) {
      console.error('Error al actualizar estado:', error)
    }
  }

  const handleVote = async (id: string, currentVotes: number) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .update({ votes: currentVotes + 1 })
        .eq('id', id)

      if (error) throw error
      fetchItems()
    } catch (error) {
      console.error('Error al votar:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gift':
        return (
          <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        )
      case 'experience':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      case 'travel':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'restaurant':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        )
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'gift': return 'Regalo'
      case 'experience': return 'Experiencia'
      case 'travel': return 'Viaje'
      case 'restaurant': return 'Restaurante'
      default: return 'Otro'
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-100 text-red-700'
    if (priority === 3) return 'bg-yellow-100 text-yellow-700'
    if (priority >= 1) return 'bg-green-100 text-green-700'
    return 'bg-gray-100 text-gray-700'
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 5: return 'Muy Alta'
      case 4: return 'Alta'
      case 3: return 'Media'
      case 2: return 'Baja'
      case 1: return 'Muy Baja'
      default: return 'Normal'
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <h1 className="text-2xl font-bold text-purple-900">Lista de Deseos</h1>
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
            {showForm ? 'Cancelar' : 'Nuevo Deseo'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            Todos ({items.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              filter === 'pending'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('purchased')}
            className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
              filter === 'purchased'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            Comprados
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-purple-900 mb-4">
              {editingId ? 'Editar Deseo' : 'Nuevo Deseo'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Qué deseas? *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ej: Cena en un restaurante especial"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  >
                    <option value="gift">Regalo</option>
                    <option value="experience">Experiencia</option>
                    <option value="travel">Viaje</option>
                    <option value="restaurant">Restaurante</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  >
                    <option value={1}>Muy Baja</option>
                    <option value={2}>Baja</option>
                    <option value={3}>Media</option>
                    <option value={4}>Alta</option>
                    <option value={5}>Muy Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Estimado
                  </label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="100"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link (opcional)
                  </label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles adicionales..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen
                </label>
                <div className="space-y-3">
                  {(imageUrl || imageFile) && (
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImageUrl('')
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('La imagen no debe superar 5MB')
                          return
                        }
                        setImageFile(file)
                        setImageUrl('')
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  <p className="text-xs text-gray-500">Máximo 5MB. Formatos: JPG, PNG, GIF, WEBP</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploadingImage}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage ? 'Subiendo imagen...' : (editingId ? 'Guardar Cambios' : 'Agregar a la Lista')}
              </button>
            </form>
          </div>
        )}

        {/* Wishlist Items */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No hay deseos en tu lista
              </h3>
              <p className="text-gray-600">
                Agrega tus sueños y deseos compartidos para hacerlos realidad juntos
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden transition hover:shadow-lg ${
                  item.is_purchased ? 'opacity-75' : ''
                }`}
              >
                {item.image_url && (
                  <div className="w-full h-48 bg-gray-100">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-shrink-0">{getCategoryIcon(item.category)}</div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold ${item.is_purchased ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {getCategoryLabel(item.category)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                              {getPriorityLabel(item.priority)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-gray-600 text-sm mb-3 ml-9">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 ml-9 text-sm">
                        {item.estimated_cost && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>${item.estimated_cost.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>Ver enlace</span>
                          </a>
                        )}
                        
                        <button
                          onClick={() => handleVote(item.id, item.votes)}
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-800 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{item.votes}</span>
                        </button>

                        {item.is_purchased && item.purchased_by && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            ✓ {item.purchased_by === user?.id ? 'Comprado por ti' : 'Comprado por tu pareja'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => togglePurchased(item.id, item.is_purchased)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition cursor-pointer ${
                          item.is_purchased
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={item.is_purchased ? 'Marcar como pendiente' : 'Marcar como comprado'}
                      >
                        {item.is_purchased ? '✓' : '○'}
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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
