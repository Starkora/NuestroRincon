-- Tabla de perfiles (si no existe)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_name TEXT,
  person1_name TEXT,
  person2_name TEXT,
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por couple_name
CREATE INDEX IF NOT EXISTS idx_profiles_couple_name ON profiles(couple_name);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view profiles with same couple_name" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Permitir al service role insertar perfiles (para el trigger)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Usuarios pueden ver perfiles con el mismo couple_name
CREATE POLICY "Users can view profiles with same couple_name"
  ON profiles FOR SELECT
  USING (
    couple_name = (
      SELECT raw_user_meta_data->>'couple_name'
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para sincronizar perfiles con user_metadata
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, couple_name, person1_name, person2_name, start_date)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'couple_name',
    NEW.raw_user_meta_data->>'person1_name',
    NEW.raw_user_meta_data->>'person2_name',
    (NEW.raw_user_meta_data->>'start_date')::DATE
  )
  ON CONFLICT (id) DO UPDATE SET
    couple_name = EXCLUDED.couple_name,
    person1_name = EXCLUDED.person1_name,
    person2_name = EXCLUDED.person2_name,
    start_date = EXCLUDED.start_date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar automáticamente
CREATE TRIGGER on_auth_user_created_or_updated
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile();

COMMENT ON TABLE profiles IS 'Perfiles de usuario sincronizados con auth.users metadata';
