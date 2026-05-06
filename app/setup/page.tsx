'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { FAVORITE_TEAMS } from '@/lib/teams';
import { useT } from '@/hooks/useT';
import { useLang } from '@/contexts/LanguageContext';

function SetupContent() {
  const t = useT();
  const { lang } = useLang();
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get('edit') === '1';

  const [username, setUsername] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  // اقتراح اسم مستخدم من بيانات Clerk أو القيمة الحالية
  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/profile/me')
      .then(r => r.json())
      .then(data => {
        if (data?.profile_complete && !isEditing) {
          router.replace('/');
        } else {
          // تعبئة الحقول بالقيم الحالية إن وجدت
          setUsername(
            data?.username
            ?? user?.username
            ?? user?.firstName
            ?? user?.emailAddresses?.[0]?.emailAddress?.split('@')[0]
            ?? ''
          );
          setFavoriteTeam(data?.favorite_team ?? '');
          setChecking(false);
        }
      })
      .catch(() => {
        setUsername(
          user?.username ?? user?.firstName
          ?? user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? ''
        );
        setChecking(false);
      });
  }, [isSignedIn, isEditing, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), favorite_team: favoriteTeam || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.replace('/');
    } catch {
      setError(lang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'An error occurred, please try again');
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn || checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-5xl mb-3">⚽</p>
        <h1 className="text-2xl font-black text-white mb-2">{t.setup.title}</h1>
        <p className="text-slate-400 text-sm">{t.setup.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">
            {t.setup.usernameLabel} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={t.setup.usernamePlaceholder}
            maxLength={20}
            required
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          <p className="text-xs text-slate-500 mt-1">
            {t.setup.usernameHint}
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">
            {t.setup.teamLabel} <span className="text-slate-500 font-normal">{t.setup.teamOptional}</span>
          </label>
          <select
            value={favoriteTeam}
            onChange={e => setFavoriteTeam(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            <option value="">{t.setup.teamPlaceholder}</option>
            {FAVORITE_TEAMS.map(group => (
              <optgroup key={group.group} label={group.group}>
                {group.teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || username.trim().length < 3}
          className="w-full btn-primary py-3 font-bold text-base disabled:opacity-50"
        >
          {loading ? t.setup.savingBtn : isEditing ? t.setup.saveEditBtn : t.setup.startBtn}
        </button>
      </form>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
