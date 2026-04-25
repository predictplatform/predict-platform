'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ProfileStats } from '@/app/api/profile/stats/route';

type ProfileData = { username: string; favorite_team: string | null; profile_complete: boolean };

export default function ProfilePage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    Promise.all([
      fetch('/api/profile/stats').then(r => r.json()),
      fetch('/api/profile/me').then(r => r.json()),
    ]).then(([s, p]) => {
      setStats(s);
      setProfile(p);
      // إعادة التوجيه للبروفايل العام بعد تحميل الاسم
      if (p?.username) router.replace(`/u/${encodeURIComponent(p.username)}`);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isSignedIn, router]);

  if (!isSignedIn) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">🔐</p>
        <h1 className="text-2xl font-black text-white mb-3">سجل دخولك لعرض ملفك الشخصي</h1>
        <Link href="/" className="btn-primary px-8 py-3 text-base">تسجيل الدخول</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* بطاقة المستخدم */}
      <div className="card flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <UserButton />
          <div>
            <p className="text-white font-black text-xl">{profile?.username ?? user?.username ?? user?.firstName ?? 'مستخدم'}</p>
            {profile?.favorite_team && (
              <p className="text-slate-400 text-sm">❤️ {profile.favorite_team}</p>
            )}
            <p className="text-slate-500 text-xs mt-0.5">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
        </div>
        <Link href="/setup?edit=1" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0">
          تعديل الملف
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="card animate-pulse h-40 bg-slate-700/50" />
          <div className="card animate-pulse h-48 bg-slate-700/50" />
        </div>
      ) : !stats ? (
        <div className="card text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">⚠️</p>
          <p>تعذر تحميل الإحصائيات</p>
        </div>
      ) : (
        <>
          {/* الإحصائيات العامة */}
          <section className="mb-6">
            <h2 className="text-lg font-black text-white mb-3">الإحصائيات العامة</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="إجمالي التوقعات" value={stats.total} icon="🎯" color="text-white" />
              <StatCard label="نسبة الدقة" value={`${stats.accuracy}%`} icon="📊"
                color={stats.accuracy >= 60 ? 'text-green-400' : stats.accuracy >= 40 ? 'text-amber-400' : 'text-red-400'} />
              <StatCard label="توقعات صحيحة" value={stats.correct} icon="✅" color="text-green-400" />
              <StatCard label="توقعات خاطئة" value={stats.wrong} icon="❌" color="text-red-400" />
            </div>
            {stats.pending > 0 && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                {stats.pending} توقع في انتظار نتيجة المباراة
              </p>
            )}
          </section>

          {/* الإحصائيات حسب الدوري */}
          {stats.byLeague.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-white mb-3">الإحصائيات حسب الدوري</h2>
              <div className="space-y-3">
                {stats.byLeague.map(league => (
                  <div key={league.leagueId} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-white text-sm">
                        {league.leagueFlag} {league.leagueName}
                      </span>
                      <span className={`text-sm font-black ${
                        league.accuracy >= 60 ? 'text-green-400' :
                        league.accuracy >= 40 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {league.accuracy}%
                      </span>
                    </div>
                    {/* شريط الدقة */}
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          league.accuracy >= 60 ? 'bg-green-500' :
                          league.accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${league.accuracy}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="text-slate-400">إجمالي</p>
                        <p className="font-black text-white text-base">{league.total}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">صحيح</p>
                        <p className="font-black text-green-400 text-base">{league.correct}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">خطأ</p>
                        <p className="font-black text-red-400 text-base">{league.wrong}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {stats.total === 0 && (
            <div className="card text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">🎯</p>
              <p className="font-semibold">لم تسجل أي توقعات بعد</p>
              <Link href="/predict" className="mt-4 btn-primary text-sm px-6 py-2 inline-block">
                ابدأ التوقع الآن
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div className="card text-center py-4">
      <p className="text-2xl mb-1">{icon}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-slate-400 text-xs mt-1">{label}</p>
    </div>
  );
}
