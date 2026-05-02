import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'توقع المباريات',
  description: 'توقع نتائج مباريات اليوم في دوري روشن والدوريات الأوروبية — جمّع النقاط وتنافس مع الجميع',
  alternates: { canonical: '/predict' },
  openGraph: {
    title:       'توقع المباريات — دوري التوقعات',
    description: 'توقع نتائج المباريات وتنافس مع الجميع',
    url:         'https://dawri-tawaquat.com/predict',
  },
};

export default function PredictLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
