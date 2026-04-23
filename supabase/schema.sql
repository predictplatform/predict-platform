-- ============================================
-- منصة التوقعات — Supabase Schema
-- انسخ هذا الكود في Supabase SQL Editor
-- ============================================
-- ملاحظة: profiles.id و predictions.user_id من نوع text
-- لأن Clerk يعطي IDs بصيغة "user_xxx" وليس UUID

-- جدول المستخدمين
CREATE TABLE profiles (
  id text PRIMARY KEY,           -- Clerk user ID (مثال: user_3Clte6IEo8cubTAgAQWAX4p3HW4)
  username text UNIQUE NOT NULL,
  avatar_url text,
  total_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- جدول التوقعات
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

-- ملاحظة: نستخدم Clerk للمصادقة + Supabase Secret Key (service role) في API Routes
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- السماح للكل بقراءة profiles (للليدربورد)
CREATE POLICY 'public read profiles' ON profiles
  FOR SELECT USING (true);

-- منع الكتابة المباشرة من الـ anon key
CREATE POLICY 'no direct insert profiles' ON profiles
  FOR INSERT WITH CHECK (false);

CREATE POLICY 'no direct update profiles' ON profiles
  FOR UPDATE USING (false);

-- السماح للكل بقراءة predictions المنتهية
CREATE POLICY 'public read finished predictions' ON predictions
  FOR SELECT USING (points_earned IS NOT NULL);

-- منع الكتابة المباشرة من الـ anon key
CREATE POLICY 'no direct write predictions' ON predictions
  FOR INSERT WITH CHECK (false);

-- دالة لتحديث مجموع النقاط تلقائياً
CREATE OR REPLACE FUNCTION update_total_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.points_earned IS NOT NULL AND OLD.points_earned IS NULL THEN
    UPDATE profiles
    SET total_points = total_points + NEW.points_earned
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_points_earned
  AFTER UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_total_points();

-- Index للأداء
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_match_id ON predictions(match_id);
CREATE INDEX idx_profiles_total_points ON profiles(total_points DESC);
