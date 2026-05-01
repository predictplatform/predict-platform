import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Navbar from '@/components/Navbar';
import { PushInit } from '@/components/PushInit';
import { ProfileSetupBanner } from '@/components/ProfileSetupBanner';

export const metadata: Metadata = {
  title: 'دوري التوقعات | Football Predictions',
  description: 'توقع نتائج مباريات كرة القدم وتنافس مع الأصدقاء',
  icons: { icon: '/icon-192.png' },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: '#2563eb' },
        elements: {
          // إخفاء شارة "Development mode"
          badge: { display: 'none' },
        },
      }}
      localization={{
        signIn: {
          start: {
            title: 'دوري التوقعات',
            subtitle: 'أهلاً بعودتك!',
            actionText: 'ما عندك حساب؟',
            actionLink: 'سجّل الآن',
          },
        },
        signUp: {
          start: {
            title: 'إنشاء حساب',
            subtitle: 'أهلاً! أدخل رقم جوالك للبدء',
            actionText: 'عندك حساب؟',
            actionLink: 'سجّل دخولك',
          },
        },
        formFieldLabel__phoneNumber: 'رقم الجوال',
        formFieldInputPlaceholder__phoneNumber: 'أدخل رقم جوالك',
        formButtonPrimary: 'متابعة',
      }}
    >
      <html lang="ar" dir="rtl">
        <body>
          <Navbar />
          <ProfileSetupBanner />
          <PushInit />
          <main className="min-h-screen bg-slate-900">
            {children}
          </main>
          <footer className="bg-slate-800 border-t border-slate-700 text-center py-4 text-slate-400 text-sm">
            <p>⚽ دوري التوقعات — مجاني بالكامل | لا مراهنات مالية</p>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
