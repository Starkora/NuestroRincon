import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { createClient } from '@supabase/supabase-js'

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Verificar que el email tenga formato válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Guardar código en la base de datos
    const { error: insertError } = await supabase
      .from('password_recovery_codes')
      .insert({
        email: email.toLowerCase().trim(),
        code,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutos
        used: false
      })

    if (insertError) {
      
      return NextResponse.json(
        { error: 'Error al generar el código de recuperación' },
        { status: 500 }
      )
    }

    // Enviar email con el código usando SendGrid
    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER_EMAIL || 'noreply@nuestrorincon.com',
      subject: 'Código de Recuperación - Nuestro Rincón',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9333ea;">Recuperar Contraseña</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Tu código de verificación es:</p>
            <p style="font-size: 32px; font-weight: bold; color: #9333ea; letter-spacing: 8px; margin: 10px 0;">${code}</p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Este código expira en 15 minutos</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este código, ignora este correo.</p>
          <p style="color: #9333ea; font-weight: 600;">Con amor,<br>Nuestro Rincón 💕</p>
        </div>
      `
    }

    await sgMail.send(msg)

    return NextResponse.json({ 
      success: true,
      message: 'Código enviado correctamente. Revisa tu correo.' 
    })

  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Error al enviar el código de recuperación' },
      { status: 500 }
    )
  }
}
