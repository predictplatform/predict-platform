import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الليدربورد',
  description: 'ترتيب أفضل المتوقعين في دوري التوقعات — من الأدق في توقع نتائج مباريات كرة القدم؟',
  alternates: { canonical: '/leaderboard' },
  openGraph: {
    title:       'الليدربورد — دوري التوقعات',
    description: 'ترتيب أفضل المتوقعين — من الأدق في توقع نتائج المباريات؟',
    url:         'https://dawri-tawaquat.com/leaderboard',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
