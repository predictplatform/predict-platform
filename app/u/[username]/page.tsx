'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { PublicProfile } from '@/app/api/profile/[username]/route';
import { ShareProfileButtons } from '@/components/ShareProfileButtons';

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { user } = useUser();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/${encodeURIComponent(username)}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setProfile(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  // نقارن Clerk user.id مع profile.user_id مباشرةً — بدون fetch إضافي وبدون flash
  const isOwnProfile = !!user && !!profile && user.id === profile.user_id;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        <div className="card animate-pulse h-24 bg-slate-700/50" />
        <div className="card animate-pulse h-40 bg-slate-700/50" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-2xl font-black text-white mb-3">المستخدم غير موجود</h1>
        <p className="text-slate-400 mb-6">لا يوجد مستخدم باسم &quot;{username}&quot;</p>
        <Link href="/leaderboard" className="btn-primary px-6 py-2">الليدربورد</Link>
      </div>
    );
  }

  const { stats } = profile;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* بطاقة المستخدم */}
      <div className="card flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
            {profile.username[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-black text-xl">{profile.username}</p>
            {profile.favorite_team && (
              <p className="text-slate-400 text-sm">❤️ {profile.favorite_team}</p>
            )}
            <p className="text-amber-400 text-sm font-bold mt-0.5">
              {profile.total_points} نقطة
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {isOwnProfile && (
            <Link href="/setup?edit=1" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              تعديل الملف
            </Link>
          )}
          {stats.total > 0 && (
            <ShareProfileButtons
              stats={{
                total:    stats.total,
                correct:  stats.correct,
                wrong:    stats.wrong,
                accuracy: stats.accuracy,
              }}
            />
          )}
        </div>
      </div>

      {/* شارة التأهل */}
      {stats.total >= 10 ? (
        <div className="card mb-4 flex items-center gap-3 border border-green-700/40 bg-green-900/10 py-3">
          <span className="text-xl">✅</span>
          <span className="text-sm font-bold text-green-400">مؤهل في الليدربورد</span>
        </div>
      ) : stats.total > 0 ? (
        <div className="card mb-4 border border-amber-700/40 bg-amber-900/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <span className="text-sm font-bold text-amber-400">
                في طور التأهل — باقي {10 - stats.total} توقعات للدخول للليدربورد
              </span>
            </div>
            <span className="text-xs text-slate-500">{stats.total}/10</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(stats.total / 10) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* الإحصائيات العامة */}
      <section className="mb-6">
        <h2 className="text-lg font-black text-white mb-3">الإحصائيات</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="إجمالي التوقعات" value={stats.total} icon="🎯" color="text-white" />
          <StatCard label="نسبة الدقة" value={`${stats.accuracy}%`} icon="📊"
            color={stats.accuracy >= 60 ? 'text-green-400' : stats.accuracy >= 40 ? 'text-amber-400' : 'text-red-400'} />
          <StatCard label="توقعات صحيحة" value={stats.correct} icon="✅" color="text-green-400" />
          <StatCard label="توقعات خاطئة" value={stats.wrong} icon="❌" color="text-red-400" />
        </div>
      </section>

      {/* الإحصائيات حسب الدوري */}
      {stats.byLeague.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-white mb-3">حسب الدوري</h2>
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
          <p>لم يسجل {profile.username} أي توقعات بعد</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string; value: string | number; icon: string; color: string;
}) {
  return (
    <div className="card text-center py-4">
      <p className="text-2xl mb-1">{icon}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-slate-400 text-xs mt-1">{label}</p>
    </div>
  );
}
