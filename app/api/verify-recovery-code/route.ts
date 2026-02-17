import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente con anon key
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Cliente admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, código y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar el código en la base de datos
    const { data: codeData, error: codeError } = await supabaseClient
      .from('password_recovery_codes')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('code', code)
      .eq('used', false)
      .single()

    if (codeError || !codeData) {
      
      return NextResponse.json(
        { error: 'Código inválido o ya utilizado' },
        { status: 400 }
      )
    }

    // Verificar que no haya expirado
    const expiresAt = new Date(codeData.expires_at)
    const now = new Date()

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'El código ha expirado. Solicita uno nuevo.' },
        { status: 400 }
      )
    }

    // Buscar el usuario por email usando SQL directo
    const { data: users, error: userError } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1)

    if (userError || !users || users.length === 0) {
      // Intentar con la API admin
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
      const user = authData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
      
      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }

      // Usar SQL directo para actualizar la contraseña
      const { error: sqlError } = await supabaseAdmin.rpc('update_user_password', {
        user_email: email.toLowerCase(),
        new_password: newPassword
      })

      if (sqlError) {
        
        // Si la función no existe, usar el método admin
        const { error: adminError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { password: newPassword }
        )
        
        if (adminError) {
          
          return NextResponse.json(
            { error: 'No se pudo actualizar la contraseña' },
            { status: 500 }
          )
        }
      }
    }

    // Marcar el código como usado
    await supabaseClient
      .from('password_recovery_codes')
      .update({ used: true })
      .eq('id', codeData.id)

    return NextResponse.json({ 
      success: true,
      message: 'Contraseña actualizada correctamente' 
    })

  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Error: ' + error.message },
      { status: 500 }
    )
  }
}
