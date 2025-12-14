'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import FloatingChat from '@/components/FloatingChat'

interface Photo {
  id: string
  title: string
  description: string
  photo_url: string
  cloudinary_public_id: string
  upload_date: string
  created_at: string
}

export default function AlbumPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [coupleName, setCoupleName] = useState('')
  const [currentPersonName, setCurrentPersonName] = useState('')
  const router = useRouter()

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  // Edit form states
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editPreviewUrl, setEditPreviewUrl] = useState<string>('')

  useEffect(() => {
    checkUser()
    fetchPhotos()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setCoupleName(user.user_metadata?.couple_name || 'Nuestro Álbum')
    
    const currentPerson = localStorage.getItem('current_person')
    const personName = currentPerson === 'person1' 
      ? user.user_metadata?.person1_name 
      : user.user_metadata?.person2_name
    setCurrentPersonName(personName || 'Usuario')
  }

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('album_photos')
        .select('*')
        .order('upload_date', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (error) {
      console.error('Error al cargar fotos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const uploadToCloudinary = async (file: File): Promise<{ url: string; publicId: string }> => {
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
    return {
      url: data.secure_url,
      publicId: data.public_id,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert('Por favor selecciona una foto')
      return
    }

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Subir a Cloudinary
      const { url, publicId } = await uploadToCloudinary(file)

      // Guardar en Supabase
      const { error } = await supabase
        .from('album_photos')
        .insert([
          {
            user_id: user.id,
            title,
            description,
            photo_url: url,
            cloudinary_public_id: publicId,
          }
        ])

      if (error) throw error

      // Limpiar formulario
      setTitle('')
      setDescription('')
      setFile(null)
      setPreviewUrl('')
      setShowUploadForm(false)
      fetchPhotos()
    } catch (error: any) {
      console.error('Error al subir foto:', error)
      alert('Error al subir la foto: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photo: Photo) => {
    if (!confirm('¿Estás seguro de eliminar esta foto?')) return

    try {
      const { error } = await supabase
        .from('album_photos')
        .delete()
        .eq('id', photo.id)

      if (error) throw error
      fetchPhotos()
      setSelectedPhoto(null)
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar la foto')
    }
  }

  const handleEdit = (photo: Photo) => {
    setEditTitle(photo.title || '')
    setEditDescription(photo.description || '')
    setEditFile(null)
    setEditPreviewUrl('')
    setIsEditing(true)
  }

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setEditFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUpdate = async () => {
    if (!selectedPhoto) return

    setUploading(true)

    try {
      let photoUrl = selectedPhoto.photo_url
      let publicId = selectedPhoto.cloudinary_public_id

      // Si hay una nueva foto, subirla a Cloudinary
      if (editFile) {
        const { url, publicId: newPublicId } = await uploadToCloudinary(editFile)
        photoUrl = url
        publicId = newPublicId
      }

      const { error } = await supabase
        .from('album_photos')
        .update({
          title: editTitle,
          description: editDescription,
          photo_url: photoUrl,
          cloudinary_public_id: publicId,
        })
        .eq('id', selectedPhoto.id)

      if (error) throw error

      // Actualizar la foto seleccionada
      setSelectedPhoto({
        ...selectedPhoto,
        title: editTitle,
        description: editDescription,
        photo_url: photoUrl,
        cloudinary_public_id: publicId,
      })
      
      setIsEditing(false)
      setEditFile(null)
      setEditPreviewUrl('')
      fetchPhotos()
      alert('Foto actualizada correctamente')
    } catch (error) {
      console.error('Error al actualizar:', error)
      alert('Error al actualizar la foto')
    } finally {
      setUploading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditFile(null)
    setEditPreviewUrl('')
    if (selectedPhoto) {
      setEditTitle(selectedPhoto.title || '')
      setEditDescription(selectedPhoto.description || '')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-purple-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-purple-600 hover:text-purple-800 cursor-pointer flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </Link>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h1 className="text-2xl font-bold text-purple-900">Álbum</h1>
            </div>
          </div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition cursor-pointer flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showUploadForm ? 'Cancelar' : 'Subir Foto'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-purple-900 mb-2">{coupleName}</h2>
          <p className="text-purple-700">Sus momentos favoritos en imágenes</p>
          <p className="text-sm text-purple-600 mt-2">{photos.length} fotos guardadas</p>
        </div>

        {/* Formulario de subida */}
        {showUploadForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-purple-900 mb-4">Subir Nueva Foto</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Seleccionar foto *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 cursor-pointer"
                />
                {previewUrl && (
                  <div className="mt-4 relative w-full h-64 rounded-lg overflow-hidden">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="Ej: Nuestro viaje a la playa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="Cuenta sobre este momento..."
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {uploading ? 'Subiendo...' : 'Guardar Foto'}
              </button>
            </form>
          </div>
        )}

        {/* Galería de fotos */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-purple-600 text-lg">Cargando fotos...</div>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="w-20 h-20 mx-auto text-purple-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-2xl font-bold text-purple-900 mb-2">
              Aún no hay fotos
            </h3>
            <p className="text-purple-700 mb-6">
              Comienza a guardar sus momentos especiales
            </p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition cursor-pointer"
            >
              Subir Primera Foto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition"
              >
                <Image
                  src={photo.photo_url}
                  alt={photo.title || 'Foto'}
                  fill
                  className="object-cover group-hover:scale-110 transition duration-300"
                />
                {photo.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-white font-semibold text-sm">{photo.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de foto seleccionada */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-purple-900 rounded-full p-2 cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative w-full h-96">
              <Image
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.title || 'Foto'}
                fill
                className="object-contain"
              />
            </div>

            <div className="p-6">
              {!isEditing ? (
                <>
                  {selectedPhoto.title && (
                    <h3 className="text-2xl font-bold text-purple-900 mb-2">
                      {selectedPhoto.title}
                    </h3>
                  )}
                  {selectedPhoto.description && (
                    <p className="text-purple-700 mb-4">{selectedPhoto.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-purple-600">
                      {new Date(selectedPhoto.upload_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(selectedPhoto)}
                        className="text-purple-600 hover:text-purple-800 px-4 py-2 cursor-pointer flex items-center gap-2 border border-purple-300 rounded-lg hover:bg-purple-50 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(selectedPhoto)}
                        className="text-red-500 hover:text-red-700 px-4 py-2 cursor-pointer flex items-center gap-2 border border-red-300 rounded-lg hover:bg-red-50 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-purple-900 mb-4">Editar Foto</h3>
                  
                  {/* Selector de nueva foto */}
                  <div>
                    <label className="block text-sm font-medium text-purple-900 mb-2">
                      Cambiar foto (opcional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileChange}
                      className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 cursor-pointer"
                    />
                    {editPreviewUrl && (
                      <div className="mt-4 relative w-full h-48 rounded-lg overflow-hidden">
                        <Image
                          src={editPreviewUrl}
                          alt="Nueva foto"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Nueva foto
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-900 mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={100}
                      className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      placeholder="Título de la foto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-900 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      placeholder="Descripción de la foto"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      disabled={uploading}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={uploading}
                      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Chat flotante */}
      <FloatingChat currentUserName={currentPersonName} />
    </div>
  )
}
