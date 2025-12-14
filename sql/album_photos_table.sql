-- Tabla de Álbum de Fotos
CREATE TABLE IF NOT EXISTS album_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  photo_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  photo_date DATE,
  upload_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Si la tabla ya existe, agregar la columna photo_date
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'album_photos' AND column_name = 'photo_date'
  ) THEN
    ALTER TABLE album_photos ADD COLUMN photo_date DATE;
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_album_photos_user_id ON album_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_upload_date ON album_photos(upload_date);
CREATE INDEX IF NOT EXISTS idx_album_photos_photo_date ON album_photos(photo_date);

-- RLS Policies
ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own photos" ON album_photos;
DROP POLICY IF EXISTS "Users can insert photos" ON album_photos;
DROP POLICY IF EXISTS "Users can update own photos" ON album_photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON album_photos;

CREATE POLICY "Users can view own photos"
  ON album_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert photos"
  ON album_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos"
  ON album_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos"
  ON album_photos FOR DELETE
  USING (auth.uid() = user_id);
