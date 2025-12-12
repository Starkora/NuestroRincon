-- Eliminar todas las políticas existentes de profiles
DROP POLICY IF EXISTS "Users can view profiles with same couple_name" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Deshabilitar temporalmente el trigger para evitar errores
DROP TRIGGER IF EXISTS on_auth_user_created_or_updated ON auth.users;

-- Recrear la función del trigger sin SECURITY DEFINER (usará permisos del sistema)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Deshabilitar RLS temporalmente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Habilitar RLS nuevamente
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT
CREATE POLICY "Users can view profiles with same couple_name"
  ON profiles FOR SELECT
  USING (
    couple_name = (
      SELECT raw_user_meta_data->>'couple_name'
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- Política para permitir UPDATE
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Política para permitir INSERT (amplia para permitir al trigger)
CREATE POLICY "Allow insert for authenticated and service"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Recrear el trigger
CREATE TRIGGER on_auth_user_created_or_updated
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile();

-- Comentario
COMMENT ON TABLE profiles IS 'Perfiles de usuario sincronizados con auth.users metadata';
