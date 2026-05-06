'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { useLang } from '@/contexts/LanguageContext';
import { useT } from '@/hooks/useT';

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const { lang, setLang } = useLang();
  const t = useT();

  const navLinks = [
    { href: '/',            label: t.nav.home },
    { href: '/matches',     label: t.nav.matches },
    { href: '/standings',   label: t.nav.standings },
    { href: '/predict',     label: t.nav.predict },
    { href: '/leaderboard', label: t.nav.leaderboard },
    { href: '/stats',       label: t.nav.stats },
    { href: '/profile',     label: t.nav.profile },
  ];

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/logo.svg"
            alt="دوري التوقعات"
            width={132}
            height={30}
            priority
            className="h-[30px] w-auto"
          />
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                pathname === href
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons + Language Toggle */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="text-xs font-bold px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>

          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-slate-300 hover:text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                  {t.nav.signIn}
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-colors">
                  {t.nav.signUp}
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              pathname === href
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
