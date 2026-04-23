import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'منصة التوقعات | Football Predictions',
  description: 'توقع نتائج مباريات كرة القدم وتنافس مع الأصدقاء',
  icons: { icon: '/favicon.ico' },
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
          // إخفاء حقل رقم الجوال من جميع النماذج
          phoneNumberField: { display: 'none' },
          phoneInputBox: { display: 'none' },
        },
      }}
    >
      <html lang="ar" dir="rtl">
        <body>
          <Navbar />
          <main className="min-h-screen bg-slate-900">
            {children}
          </main>
          <footer className="bg-slate-800 border-t border-slate-700 text-center py-4 text-slate-400 text-sm">
            <p>⚽ منصة التوقعات — مجاني بالكامل | لا مراهنات مالية</p>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
