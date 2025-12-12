'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface WishlistItem {
  id: string
  title: string
  category: 'gift' | 'experience' | 'trip' | 'item' | 'other'
  priority: 'low' | 'medium' | 'high'
  estimated_cost: number | null
  is_purchased: boolean
  purchased_by: string | null
  occasion: string | null
  notes: string | null
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
  
  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<'gift' | 'experience' | 'trip' | 'item' | 'other'>('gift')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [occasion, setOccasion] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (user) {
      findPartner()
      fetchItems()
    }
  }, [user, filter])

  const findPartner = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id')
        .neq('user_id', user?.id)
        .limit(1)

      if (error) throw error
      if (profiles && profiles.length > 0) {
        setPartnerUserId(profiles[0].user_id)
      }
    } catch (error) {
      console.error('Error finding partner:', error)
    }
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
      if (editingId) {
        const { error } = await supabase
          .from('wishlist')
          .update({
            title,
            category,
            priority,
            estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
            occasion: occasion || null,
            notes: notes || null,
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert([
            {
              user_id: user?.id,
              title,
              category,
              priority,
              estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
              occasion: occasion || null,
              notes: notes || null,
              is_purchased: false,
              votes: 0,
            }
          ])

        if (error) throw error
      }

      resetForm()
      fetchItems()
    } catch (error) {
      console.error('Error al guardar deseo:', error)
      alert('Error al guardar el deseo')
    }
  }

  const resetForm = () => {
    setTitle('')
    setCategory('gift')
    setPriority('medium')
    setEstimatedCost('')
    setOccasion('')
    setNotes('')
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (item: WishlistItem) => {
    setEditingId(item.id)
    setTitle(item.title)
    setCategory(item.category)
    setPriority(item.priority)
    setEstimatedCost(item.estimated_cost?.toString() || '')
    setOccasion(item.occasion || '')
    setNotes(item.notes || '')
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
      case 'trip':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'item':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
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
      case 'trip': return 'Viaje'
      case 'item': return 'Artículo'
      default: return 'Otro'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta'
      case 'medium': return 'Media'
      case 'low': return 'Baja'
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
                    <option value="trip">Viaje</option>
                    <option value="item">Artículo</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
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
                    Ocasión
                  </label>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="Cumpleaños, Aniversario..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles adicionales..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition cursor-pointer"
              >
                {editingId ? 'Guardar Cambios' : 'Agregar a la Lista'}
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
                className={`bg-white rounded-xl shadow-md p-6 transition hover:shadow-lg ${
                  item.is_purchased ? 'opacity-75' : ''
                }`}
              >
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
                          {item.occasion && (
                            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                              {item.occasion}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-gray-600 text-sm mb-3 ml-9">
                        {item.notes}
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
            ))
          )}
        </div>
      </div>
    </div>
  )
}
