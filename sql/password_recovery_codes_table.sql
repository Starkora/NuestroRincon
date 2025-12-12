-- Tabla para almacenar códigos de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_recovery_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
  used BOOLEAN DEFAULT FALSE
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_recovery_codes_email ON password_recovery_codes(email);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_expires ON password_recovery_codes(expires_at);

-- RLS Policies (sin autenticación porque el usuario no ha hecho login)
ALTER TABLE password_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Eliminar policy si existe y recrearla
DROP POLICY IF EXISTS "Anyone can insert recovery codes" ON password_recovery_codes;
DROP POLICY IF EXISTS "Anyone can read recovery codes" ON password_recovery_codes;
DROP POLICY IF EXISTS "Anyone can update recovery codes" ON password_recovery_codes;

-- Permitir insertar códigos sin autenticación (para el proceso de recuperación)
CREATE POLICY "Anyone can insert recovery codes"
  ON password_recovery_codes FOR INSERT
  WITH CHECK (true);

-- Permitir leer códigos sin autenticación (para verificar)
CREATE POLICY "Anyone can read recovery codes"
  ON password_recovery_codes FOR SELECT
  USING (true);

-- Permitir actualizar códigos sin autenticación (para marcar como usado)
CREATE POLICY "Anyone can update recovery codes"
  ON password_recovery_codes FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Función para limpiar códigos expirados automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_recovery_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM password_recovery_codes
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar contraseña del usuario (requiere extension pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_user_password(user_email TEXT, new_password TEXT)
RETURNS json AS $$
DECLARE
  user_id UUID;
  hashed_pwd TEXT;
BEGIN
  -- Buscar el ID del usuario por email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no encontrado');
  END IF;

  -- Encriptar la nueva contraseña usando crypt con bcrypt (algoritmo 2a que usa Supabase)
  hashed_pwd := crypt(new_password, gen_salt('bf', 10));

  -- Actualizar la contraseña en auth.users
  UPDATE auth.users
  SET 
    encrypted_password = hashed_pwd,
    updated_at = NOW(),
    -- Asegurar que el email esté confirmado
    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = user_id;

  RETURN json_build_object('success', true, 'message', 'Contraseña actualizada');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios
COMMENT ON TABLE password_recovery_codes IS 'Almacena códigos de verificación para recuperación de contraseña';
COMMENT ON COLUMN password_recovery_codes.code IS 'Código de 6 dígitos enviado por email';
COMMENT ON COLUMN password_recovery_codes.expires_at IS 'Fecha de expiración del código (15 minutos)';
