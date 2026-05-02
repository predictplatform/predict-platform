import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'إحصائيات وهدافون',
  description: 'إحصائيات الدوريات وترتيب أفضل الهدافين في دوري روشن والدوريات الأوروبية لموسم 2025/26',
  alternates: { canonical: '/stats' },
  openGraph: {
    title:       'إحصائيات وهدافون — دوري التوقعات',
    description: 'أفضل الهدافين وإحصائيات الدوريات لموسم 2025/26',
    url:         'https://dawri-tawaquat.com/stats',
  },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
