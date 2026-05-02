import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ترتيب الدوريات',
  description: 'ترتيب الفرق في دوري روشن السعودي والدوريات الأوروبية — الإنجليزي والإسباني والإيطالي والألماني',
  alternates: { canonical: '/standings' },
  openGraph: {
    title:       'ترتيب الدوريات — دوري التوقعات',
    description: 'ترتيب الفرق في دوري روشن والدوريات الأوروبية',
    url:         'https://dawri-tawaquat.com/standings',
  },
};

export default function StandingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
