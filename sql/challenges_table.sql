-- Tabla de Metas y Desafíos
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT CHECK (challenge_type IN ('monthly', 'custom', 'milestone')),
  start_date DATE NOT NULL,
  end_date DATE,
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_completed ON challenges(is_completed);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);

-- Habilitar Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view challenges" ON challenges;
DROP POLICY IF EXISTS "Users can insert challenges" ON challenges;
DROP POLICY IF EXISTS "Users can update challenges" ON challenges;
DROP POLICY IF EXISTS "Users can delete challenges" ON challenges;

-- Los usuarios pueden ver sus propios desafíos
CREATE POLICY "Users can view challenges"
  ON challenges FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar desafíos
CREATE POLICY "Users can insert challenges"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios desafíos
CREATE POLICY "Users can update challenges"
  ON challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios desafíos
CREATE POLICY "Users can delete challenges"
  ON challenges FOR DELETE
  USING (auth.uid() = user_id);
