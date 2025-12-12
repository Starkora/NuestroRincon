-- Tabla de Recordatorios
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_date DATE NOT NULL,
  reminder_time TIME,
  type TEXT NOT NULL CHECK (type IN ('anniversary', 'birthday', 'custom', 'monthly', 'yearly')),
  recurrence TEXT CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  is_active BOOLEAN DEFAULT TRUE,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(type);
CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(is_active);

-- RLS Policies
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can insert reminders" ON reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;

CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = user_id);

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

-- Índices
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_completed ON challenges(is_completed);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);

-- RLS Policies
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view challenges" ON challenges;
DROP POLICY IF EXISTS "Users can insert challenges" ON challenges;
DROP POLICY IF EXISTS "Users can update challenges" ON challenges;
DROP POLICY IF EXISTS "Users can delete challenges" ON challenges;

CREATE POLICY "Users can view challenges"
  ON challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert challenges"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update challenges"
  ON challenges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete challenges"
  ON challenges FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla de Eventos del Calendario
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_calendar_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_type ON calendar_events(event_type);

-- RLS Policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete calendar events" ON calendar_events;

CREATE POLICY "Users can view calendar events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update calendar events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete calendar events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla de Preguntas del Día
CREATE TABLE IF NOT EXISTS daily_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL UNIQUE,
  category TEXT CHECK (category IN ('love', 'dreams', 'past', 'future', 'fun', 'deep')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Respuestas a Preguntas
CREATE TABLE IF NOT EXISTS question_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES daily_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_answers_question ON question_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_user ON question_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_date ON question_answers(answered_at);

-- RLS Policies
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view answers" ON question_answers;
DROP POLICY IF EXISTS "Users can insert answers" ON question_answers;
DROP POLICY IF EXISTS "Users can update own answers" ON question_answers;

CREATE POLICY "Users can view answers"
  ON question_answers FOR SELECT
  USING (true);

CREATE POLICY "Users can insert answers"
  ON question_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON question_answers FOR UPDATE
  USING (auth.uid() = user_id);

-- Tabla de Mood Tracker
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('very_happy', 'happy', 'neutral', 'sad', 'very_sad')),
  mood_value INTEGER NOT NULL CHECK (mood_value BETWEEN 1 AND 5),
  notes TEXT,
  activities TEXT[], -- Array de actividades realizadas
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mood_user ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_date ON mood_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_mood_value ON mood_entries(mood_value);

-- RLS Policies
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view mood entries" ON mood_entries;
DROP POLICY IF EXISTS "Users can insert mood entries" ON mood_entries;
DROP POLICY IF EXISTS "Users can update own mood entries" ON mood_entries;

CREATE POLICY "Users can view mood entries"
  ON mood_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert mood entries"
  ON mood_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Tabla de Lista de Deseos
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('gift', 'experience', 'travel', 'restaurant', 'other')),
  priority INTEGER DEFAULT 0 CHECK (priority BETWEEN 0 AND 5),
  estimated_cost DECIMAL(10, 2),
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_by UUID REFERENCES auth.users(id),
  purchased_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  link TEXT,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_category ON wishlist(category);
CREATE INDEX IF NOT EXISTS idx_wishlist_purchased ON wishlist(is_purchased);
CREATE INDEX IF NOT EXISTS idx_wishlist_priority ON wishlist(priority);

-- RLS Policies
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can insert wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can update wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can delete wishlist" ON wishlist;

CREATE POLICY "Users can view wishlist"
  ON wishlist FOR SELECT
  USING (true);

CREATE POLICY "Users can insert wishlist"
  ON wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update wishlist"
  ON wishlist FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete wishlist"
  ON wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla de Playlists de Música
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_title TEXT NOT NULL,
  artist TEXT NOT NULL,
  spotify_url TEXT,
  youtube_url TEXT,
  is_current_song BOOLEAN DEFAULT FALSE,
  occasion TEXT,
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_current ON playlists(is_current_song);

-- RLS Policies
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view playlists" ON playlists;
DROP POLICY IF EXISTS "Users can insert playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update playlists" ON playlists;
DROP POLICY IF EXISTS "Users can delete playlists" ON playlists;

CREATE POLICY "Users can view playlists"
  ON playlists FOR SELECT
  USING (true);

CREATE POLICY "Users can insert playlists"
  ON playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update playlists"
  ON playlists FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete playlists"
  ON playlists FOR DELETE
  USING (auth.uid() = user_id);

-- Tabla de Recetas
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  ingredients TEXT[],
  instructions TEXT,
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  category TEXT CHECK (category IN ('breakfast', 'lunch', 'dinner', 'dessert', 'snack')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  image_url TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Restaurantes
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  cuisine_type TEXT,
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  visited BOOLEAN DEFAULT FALSE,
  visited_date DATE,
  want_to_visit BOOLEAN DEFAULT TRUE,
  google_maps_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies para recetas y restaurantes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recipes" ON recipes FOR SELECT USING (true);
CREATE POLICY "Users can insert recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update recipes" ON recipes FOR UPDATE USING (true);
CREATE POLICY "Users can delete recipes" ON recipes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Users can insert restaurants" ON restaurants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update restaurants" ON restaurants FOR UPDATE USING (true);
CREATE POLICY "Users can delete restaurants" ON restaurants FOR DELETE USING (auth.uid() = user_id);

-- Tabla de Tradiciones
CREATE TABLE IF NOT EXISTS traditions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  origin_story TEXT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly', 'special')),
  started_date DATE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE traditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view traditions" ON traditions FOR SELECT USING (true);
CREATE POLICY "Users can insert traditions" ON traditions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update traditions" ON traditions FOR UPDATE USING (true);
CREATE POLICY "Users can delete traditions" ON traditions FOR DELETE USING (auth.uid() = user_id);

-- Tabla de Gamificación (Puntos y Logros)
CREATE TABLE IF NOT EXISTS user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  badges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla de Logros
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points_awarded INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points" ON user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert points" ON user_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own points" ON user_points FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view achievements" ON achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert achievements" ON achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_favorite ON recipes(is_favorite);
CREATE INDEX IF NOT EXISTS idx_restaurants_user ON restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_visited ON restaurants(visited);
CREATE INDEX IF NOT EXISTS idx_traditions_user ON traditions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_user ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- Comentarios
COMMENT ON TABLE reminders IS 'Recordatorios y aniversarios personalizados';
COMMENT ON TABLE challenges IS 'Metas y desafíos de pareja';
COMMENT ON TABLE calendar_events IS 'Eventos del calendario compartido';
COMMENT ON TABLE daily_questions IS 'Banco de preguntas diarias';
COMMENT ON TABLE question_answers IS 'Respuestas a preguntas del día';
COMMENT ON TABLE mood_entries IS 'Registro de estado de ánimo diario';
COMMENT ON TABLE wishlist IS 'Lista de deseos y regalos';
COMMENT ON TABLE playlists IS 'Canciones y playlists especiales';
COMMENT ON TABLE recipes IS 'Recetas favoritas de la pareja';
COMMENT ON TABLE restaurants IS 'Restaurantes por visitar o visitados';
COMMENT ON TABLE traditions IS 'Tradiciones únicas de la pareja';
COMMENT ON TABLE user_points IS 'Sistema de puntos y niveles';
COMMENT ON TABLE achievements IS 'Logros desbloqueados';
