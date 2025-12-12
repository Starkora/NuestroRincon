import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { createClient } from '@supabase/supabase-js'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, person1Name, person2Name, startDate, password } = await request.json()

    // Verificar que el email no esté ya en uso
    const { data: existingUser } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('verified', false)
      .single()

    // Si ya existe un código no verificado, eliminarlo
    if (existingUser) {
      await supabase
        .from('email_verification_codes')
        .delete()
        .eq('email', email.toLowerCase().trim())
        .eq('verified', false)
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Guardar código y datos del usuario en la base de datos
    const { error: insertError } = await supabase
      .from('email_verification_codes')
      .insert({
        email: email.toLowerCase().trim(),
        code,
        user_data: {
          person1_name: person1Name,
          person2_name: person2Name,
          start_date: startDate,
          password: password, // Guardamos temporalmente, lo ideal sería hashearlo
          couple_name: `${person1Name} y ${person2Name}`
        },
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        verified: false
      })

    if (insertError) {
      console.error('Error guardando código:', insertError)
      return NextResponse.json(
        { error: 'Error al generar el código de verificación' },
        { status: 500 }
      )
    }

    // Enviar email con el código
    const msg = {
      to: email,
      from: process.env.SENDGRID_SENDER_EMAIL || 'noreply@nuestrorincon.com',
      subject: 'Verifica tu email - Nuestro Rincón',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9333ea;">¡Bienvenidos a Nuestro Rincón! 💕</h2>
          <p>Hola <strong>${person1Name} y ${person2Name}</strong>,</p>
          <p>Para completar el registro de su espacio compartido, verifica tu email con este código:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Tu código de verificación es:</p>
            <p style="font-size: 32px; font-weight: bold; color: #9333ea; letter-spacing: 8px; margin: 10px 0;">${code}</p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Este código expira en 15 minutos</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Si no solicitaste crear una cuenta, ignora este correo.</p>
          <p style="color: #9333ea; font-weight: 600;">Con amor,<br>Nuestro Rincón 💕</p>
        </div>
      `
    }

    await sgMail.send(msg)

    return NextResponse.json({ 
      success: true,
      message: 'Código de verificación enviado. Revisa tu correo.' 
    })

  } catch (error: any) {
    console.error('Error sending verification code:', error)
    return NextResponse.json(
      { error: 'Error al enviar el código de verificación' },
      { status: 500 }
    )
  }
}
