'use client'

import { useState } from 'react'

export default function Home() {
  // Calcula días juntos (puedes personalizar la fecha)
  const startDate = new Date('2024-01-01')
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      {/* Header */}
      <header className="p-6">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-900">💕 Nuestro Rincón</h1>
          <a 
            href="/auth/login"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition cursor-pointer"
          >
            Iniciar Sesión
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-purple-900 mb-4">
            Su Espacio Privado Compartido
          </h2>
          <p className="text-xl text-purple-700 mb-8">
            Una sola cuenta para ambos - compartan momentos, creen recuerdos y celebren su amor juntos
          </p>
          <div className="inline-block bg-white rounded-full px-8 py-4 shadow-lg">
            <p className="text-3xl font-bold text-purple-600">
              {diffDays} días juntos 💖
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon="📅"
            title="Timeline de Relación"
            description="Documenta todos los momentos especiales en una línea de tiempo interactiva"
          />
          <FeatureCard
            icon="✅"
            title="Bucket List"
            description="Lista de cosas que quieren hacer juntos y marquen las que completen"
          />
          <FeatureCard
            icon="📸"
            title="Álbum Privado"
            description="Galería de fotos segura solo para ustedes dos"
          />
          <FeatureCard
            icon="💌"
            title="Mensajes de Amor"
            description="Envíen notas secretas y palabras de aprecio"
          />
          <FeatureCard
            icon="🎮"
            title="Juegos para Parejas"
            description="Actividades divertidas para conocerse mejor"
          />
          <FeatureCard
            icon="📝"
            title="Diario Compartido"
            description="Escriban sus experiencias y reflexiones juntos"
          />
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-2xl p-12 shadow-xl">
          <h3 className="text-3xl font-bold text-purple-900 mb-4">
            ¿Listos para empezar?
          </h3>
          <p className="text-purple-700 mb-2">
            Creen su espacio compartido en menos de 2 minutos
          </p>
          <p className="text-sm text-purple-600 mb-6">
            Una sola cuenta - ambos acceden con el mismo email y contraseña
          </p>
          <a 
            href="/auth/register"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition transform hover:scale-105 shadow-lg cursor-pointer"
          >
            Crear Espacio Compartido 💕
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 text-center text-purple-700">
        <p>Hecho con 💜 para parejas especiales</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-purple-900 mb-2">{title}</h3>
      <p className="text-purple-700">{description}</p>
    </div>
  )
}
