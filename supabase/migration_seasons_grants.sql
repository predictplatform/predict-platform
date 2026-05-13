-- ═══════════════════════════════════════════════════════════════════
-- migration_seasons_grants.sql — إصلاح صلاحيات جدول seasons
--
-- المشاكل التي يُصلحها هذا الملف:
--   1. جدول seasons بدون RLS (Supabase الجديد يطلبه صريحاً)
--   2. لا GRANT للـ anon/authenticated/service_role → خطأ 42501
--   3. دالة assign_active_season بلا SECURITY DEFINER
--      (تنفّذ في سياق المستخدم الطالب فتفشل إذا كان anon)
--
-- شغّل هذا في Supabase SQL Editor بعد migration_add_seasons.sql
-- ═══════════════════════════════════════════════════════════════════


-- ── 1. تفعيل RLS على جدول seasons ───────────────────────────────────
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;


-- ── 2. سياسات RLS ───────────────────────────────────────────────────

-- أي أحد يقدر يقرأ المواسم (للـ /api/seasons العام)
DROP POLICY IF EXISTS "public read seasons"        ON public.seasons;
CREATE POLICY          "public read seasons"        ON public.seasons
  FOR SELECT USING (true);

-- لا كتابة مباشرة من anon/authenticated — فقط عبر service_role في API routes
DROP POLICY IF EXISTS "no direct insert seasons"   ON public.seasons;
CREATE POLICY          "no direct insert seasons"   ON public.seasons
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "no direct update seasons"   ON public.seasons;
CREATE POLICY          "no direct update seasons"   ON public.seasons
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS "no direct delete seasons"   ON public.seasons;
CREATE POLICY          "no direct delete seasons"   ON public.seasons
  FOR DELETE USING (false);


-- ── 3. GRANT صريح لكل الـ roles ─────────────────────────────────────
-- anon  : قراءة فقط (للـ SELECT في /api/seasons)
-- authenticated : قراءة فقط
-- service_role  : كامل الصلاحيات (لـ /api/admin/end-season وغيره)
GRANT SELECT ON public.seasons TO anon;
GRANT SELECT ON public.seasons TO authenticated;
GRANT ALL    ON public.seasons TO service_role;


-- ── 4. إعادة إنشاء دالة assign_active_season بـ SECURITY DEFINER ────
-- السبب: الـ trigger يُشغَّل أثناء INSERT في predictions
--        وإذا كانت الجلسة في سياق anon فالدالة لن تقدر تقرأ من seasons
--        SECURITY DEFINER تجعلها تنفّذ بصلاحيات صاحب الدالة (postgres)
CREATE OR REPLACE FUNCTION public.assign_active_season()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.season_id IS NULL THEN
    SELECT id INTO NEW.season_id
    FROM public.seasons
    WHERE is_active = true
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح حق تشغيل الدالة للـ roles
GRANT EXECUTE ON FUNCTION public.assign_active_season() TO service_role;

-- إعادة ربط الـ trigger (DROP + CREATE لضمان التحديث)
DROP TRIGGER IF EXISTS predictions_assign_season ON public.predictions;
CREATE TRIGGER predictions_assign_season
  BEFORE INSERT ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.assign_active_season();


-- ── 5. تحقق ختامي — يطبع الحالة الحالية ────────────────────────────
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'seasons';
