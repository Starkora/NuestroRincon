-- Tabla para el Diario Compartido
CREATE TABLE IF NOT EXISTS diary_entries (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT NOT NULL DEFAULT '😊',
  is_shared BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_created_at ON diary_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_entries_is_shared ON diary_entries(is_shared);

-- Habilitar Row Level Security
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view their own diary entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can insert diary entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can update own diary entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can delete own diary entries" ON diary_entries;

-- Los usuarios pueden ver sus propias entradas
CREATE POLICY "Users can view their own diary entries"
  ON diary_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar entradas
CREATE POLICY "Users can insert diary entries"
  ON diary_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias entradas
CREATE POLICY "Users can update own diary entries"
  ON diary_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias entradas
CREATE POLICY "Users can delete own diary entries"
  ON diary_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_diary_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS diary_entries_updated_at ON diary_entries;
CREATE TRIGGER diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_diary_entries_updated_at();
