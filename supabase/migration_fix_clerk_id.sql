-- ============================================
-- Migration: تصحيح نوع ID لدعم Clerk IDs
-- شغّل هذا إذا كانت الجداول موجودة مسبقاً
-- ============================================

-- 1. احذف الجداول القديمة (إذا لم يكن فيها بيانات مهمة)
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. أعد إنشاءها بالنوع الصحيح
CREATE TABLE profiles (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  avatar_url text,
  total_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id text NOT NULL,
  home_goals integer NOT NULL CHECK (home_goals BETWEEN 0 AND 15),
  away_goals integer NOT NULL CHECK (away_goals BETWEEN 0 AND 15),
  points_earned integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, match_id)
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY 'public read profiles' ON profiles FOR SELECT USING (true);
CREATE POLICY 'no direct insert profiles' ON profiles FOR INSERT WITH CHECK (false);
CREATE POLICY 'no direct update profiles' ON profiles FOR UPDATE USING (false);
CREATE POLICY 'public read finished predictions' ON predictions FOR SELECT USING (points_earned IS NOT NULL);
CREATE POLICY 'no direct write predictions' ON predictions FOR INSERT WITH CHECK (false);

CREATE OR REPLACE FUNCTION update_total_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.points_earned IS NOT NULL AND OLD.points_earned IS NULL THEN
    UPDATE profiles SET total_points = total_points + NEW.points_earned WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_points_earned
  AFTER UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_total_points();

CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_match_id ON predictions(match_id);
CREATE INDEX idx_profiles_total_points ON profiles(total_points DESC);
