'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';

const navLinks = [
  { href: '/', label: 'الرئيسية' },
  { href: '/matches', label: 'المباريات' },
  { href: '/standings', label: 'الترتيب' },
  { href: '/predict', label: 'توقعاتي' },
  { href: '/leaderboard', label: 'الليدربورد' },
  { href: '/stats', label: 'الإحصائيات' },
  { href: '/profile', label: 'ملفي' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white font-black text-xl">
          <span className="text-2xl">⚽</span>
          <span>دوري التوقعات</span>
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

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-slate-300 hover:text-white text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                  تسجيل الدخول
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-colors">
                  إنشاء حساب
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
