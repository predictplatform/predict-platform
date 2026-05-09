import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'أرشيف المواسم | دوري التوقعات',
  description: 'جميع مواسم دوري التوقعات مع الفائزين والترتيب التاريخي',
};

export default function SeasonsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
