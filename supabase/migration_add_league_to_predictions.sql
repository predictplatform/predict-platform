-- إضافة league_id لجدول predictions لتجنب استدعاء Football API في إحصائيات البروفايل
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS league_id integer;
