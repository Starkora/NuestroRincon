'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SelectPersonPage() {
  const [person1Name, setPerson1Name] = useState('')
  const [person2Name, setPerson2Name] = useState('')
  const [loading, setLoading] = useState(true)
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

    // Si ya seleccionó persona, ir al dashboard
    const currentPerson = localStorage.getItem('current_person')
    if (currentPerson) {
      router.push('/dashboard')
      return
    }

    setPerson1Name(user.user_metadata?.person1_name || 'Persona 1')
    setPerson2Name(user.user_metadata?.person2_name || 'Persona 2')
    setLoading(false)
  }

  const selectPerson = (person: 'person1' | 'person2') => {
    localStorage.setItem('current_person', person)
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-purple-600 text-lg">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💑</div>
          <h1 className="text-3xl font-bold text-purple-900 mb-2">¿Quién eres?</h1>
          <p className="text-purple-700">Selecciona tu nombre para continuar</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => selectPerson('person1')}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-xl transition shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center gap-3"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {person1Name}
          </button>

          <button
            onClick={() => selectPerson('person2')}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white py-4 rounded-xl font-bold text-xl transition shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center gap-3"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {person2Name}
          </button>
        </div>
      </div>
    </div>
  )
}
