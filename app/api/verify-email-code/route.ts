import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Cliente con service role para crear usuarios
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
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email y código son requeridos' },
        { status: 400 }
      )
    }

    // Buscar el código en la base de datos
    const { data: codeData, error: codeError } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('code', code)
      .eq('verified', false)
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

    // Crear el usuario en Supabase Auth usando admin client
    const userData = codeData.user_data as any

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: userData.password,
      email_confirm: true, // Confirmar email automáticamente ya que fue verificado con código
      user_metadata: {
        person1_name: userData.person1_name,
        person2_name: userData.person2_name,
        start_date: userData.start_date,
        couple_name: userData.couple_name,
      }
    })

    if (authError) {
      
      return NextResponse.json(
        { error: 'Error al crear la cuenta: ' + authError.message },
        { status: 500 }
      )
    }

    // Marcar el código como verificado
    await supabase
      .from('email_verification_codes')
      .update({ verified: true })
      .eq('id', codeData.id)

    return NextResponse.json({ 
      success: true,
      message: 'Email verificado y cuenta creada correctamente',
      user: authData.user
    })

  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Error al verificar el código: ' + error.message },
      { status: 500 }
    )
  }
}
