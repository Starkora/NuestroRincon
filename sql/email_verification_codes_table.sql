-- Tabla para almacenar códigos de verificación de email
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  user_data JSONB NOT NULL, -- Guardar person1_name, person2_name, start_date, password
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
  verified BOOLEAN DEFAULT FALSE
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON email_verification_codes(expires_at);

-- RLS Policies (sin autenticación porque el usuario aún no está registrado)
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Eliminar policies si existen
DROP POLICY IF EXISTS "Anyone can insert verification codes" ON email_verification_codes;
DROP POLICY IF EXISTS "Anyone can read verification codes" ON email_verification_codes;
DROP POLICY IF EXISTS "Anyone can update verification codes" ON email_verification_codes;

-- Permitir insertar códigos sin autenticación
CREATE POLICY "Anyone can insert verification codes"
  ON email_verification_codes FOR INSERT
  WITH CHECK (true);

-- Permitir leer códigos sin autenticación (para verificar)
CREATE POLICY "Anyone can read verification codes"
  ON email_verification_codes FOR SELECT
  USING (true);

-- Permitir actualizar códigos sin autenticación (para marcar como verificado)
CREATE POLICY "Anyone can update verification codes"
  ON email_verification_codes FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Función para limpiar códigos expirados automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_codes
  WHERE expires_at < NOW() OR verified = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE email_verification_codes IS 'Almacena códigos de verificación para registro de nuevos usuarios';
COMMENT ON COLUMN email_verification_codes.code IS 'Código de 6 dígitos enviado por email';
COMMENT ON COLUMN email_verification_codes.user_data IS 'Datos del usuario (person1_name, person2_name, etc) guardados temporalmente';
COMMENT ON COLUMN email_verification_codes.expires_at IS 'Fecha de expiración del código (15 minutos)';
