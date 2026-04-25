-- إضافة حقول الملف الشخصي
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS favorite_team text,
  ADD COLUMN IF NOT EXISTS profile_complete boolean DEFAULT false;

-- المستخدمون الحاليون — نعتبرهم لم يكملوا ملفهم
UPDATE profiles SET profile_complete = false WHERE profile_complete IS NULL;
