-- Tabla para Eventos del Calendario
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  end_time TIME,
  location TEXT,
  event_type TEXT CHECK (event_type IN ('date', 'meeting', 'special', 'anniversary', 'other')),
  color TEXT DEFAULT '#EC4899',
  is_all_day BOOLEAN DEFAULT FALSE,
  reminder_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_calendar_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_type ON calendar_events(event_type);

-- Habilitar Row Level Security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete calendar events" ON calendar_events;

-- Los usuarios pueden ver sus propios eventos
CREATE POLICY "Users can view calendar events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden insertar eventos
CREATE POLICY "Users can insert calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios eventos
CREATE POLICY "Users can update calendar events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios eventos
CREATE POLICY "Users can delete calendar events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = user_id);
