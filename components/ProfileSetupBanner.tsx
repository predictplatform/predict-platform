'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/hooks/useT';

export function ProfileSetupBanner() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const [incomplete, setIncomplete] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!isSignedIn) { setIncomplete(false); return; }
    fetch('/api/profile/me')
      .then(r => r.json())
      .then(data => setIncomplete(!data?.profile_complete))
      .catch(() => {});
  }, [isSignedIn, pathname]);

  if (!incomplete || pathname === '/setup') return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-300">
          <span className="text-base">⚠️</span>
          <span>{t.banner.incomplete}</span>
        </div>
        <Link
          href="/setup"
          className="flex-shrink-0 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-3 py-1.5 rounded-lg transition-colors"
        >
          {t.banner.completeNow}
        </Link>
      </div>
    </div>
  );
}
