-- ═══════════════════════════════════════════════════════════════════
-- migration_add_seasons.sql — نظام المواسم الكامل
-- شغّل هذا السكريبت في Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. جدول المواسم ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seasons (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text        NOT NULL,           -- الاسم بالعربي
  name_en                 text        NOT NULL,           -- الاسم بالإنجليزي
  start_date              date        NOT NULL,
  end_date                date,                           -- null = موسم جارٍ
  is_active               boolean     NOT NULL DEFAULT false,
  winner_user_id          text,                           -- لقطة عند انتهاء الموسم
  winner_username         text,
  winner_adjusted_points  numeric(10,2),
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ضمان موسم واحد نشط فقط في أي وقت
CREATE UNIQUE INDEX IF NOT EXISTS seasons_one_active
  ON seasons (is_active) WHERE (is_active = true);

-- ── 2. إدراج الموسم الحالي ────────────────────────────────────────────
INSERT INTO seasons (name, name_en, start_date, is_active)
VALUES ('موسم 2025/26', 'Season 2025/26', '2025-08-01', true)
ON CONFLICT DO NOTHING;

-- ── 3. إضافة season_id إلى جدول predictions ──────────────────────────
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES seasons(id) ON DELETE SET NULL;

-- ── 4. ربط التوقعات الموجودة بالموسم الحالي ──────────────────────────
UPDATE predictions
SET season_id = (SELECT id FROM seasons WHERE is_active = true LIMIT 1)
WHERE season_id IS NULL;

-- ── 5. دالة trigger — تعيين season_id تلقائياً عند إنشاء توقع جديد ──
CREATE OR REPLACE FUNCTION assign_active_season()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.season_id IS NULL THEN
    SELECT id INTO NEW.season_id
    FROM seasons
    WHERE is_active = true
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS predictions_assign_season ON predictions;
CREATE TRIGGER predictions_assign_season
  BEFORE INSERT ON predictions
  FOR EACH ROW EXECUTE FUNCTION assign_active_season();

-- ── 6. Indexes لتسريع الاستعلامات ────────────────────────────────────
CREATE INDEX IF NOT EXISTS predictions_season_id_idx ON predictions (season_id);
CREATE INDEX IF NOT EXISTS seasons_is_active_idx     ON seasons (is_active);
CREATE INDEX IF NOT EXISTS seasons_start_date_idx    ON seasons (start_date DESC);
