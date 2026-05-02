import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'مباريات اليوم',
  description: 'تابع مباريات اليوم في دوري روشن والدوريات الأوروبية — الإنجليزي والإسباني والإيطالي والألماني',
  alternates: { canonical: '/matches' },
  openGraph: {
    title:       'مباريات اليوم — دوري التوقعات',
    description: 'تابع مباريات اليوم في دوري روشن والدوريات الأوروبية',
    url:         'https://dawri-tawaquat.com/matches',
  },
};

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
