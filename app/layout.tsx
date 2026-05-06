import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { PushInit } from '@/components/PushInit';
import { ProfileSetupBanner } from '@/components/ProfileSetupBanner';
import { LanguageProvider } from '@/contexts/LanguageContext';
import FooterClient from '@/components/FooterClient';

const SITE_URL = 'https://dawri-tawaquat.com';

export const metadata: Metadata = {
  title: {
    default:  'دوري التوقعات — توقع المباريات وتنافس مع الجميع',
    template: '%s — دوري التوقعات',
  },
  description:
    'توقع نتائج مباريات كرة القدم بدقة، جمّع النقاط، وتنافس مع أصدقاءك في دوري روشن والدوريات الأوروبية',
  keywords: [
    'توقعات كرة القدم',
    'دوري روشن',
    'مباريات اليوم',
    'توقع المباريات',
    'الدوري الإنجليزي',
    'الدوري الإسباني',
    'الدوري الإيطالي',
    'الدوري الألماني',
  ],
  authors:  [{ name: 'دوري التوقعات' }],
  creator:  'دوري التوقعات',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type:        'website',
    locale:      'ar_SA',
    url:         SITE_URL,
    siteName:    'دوري التوقعات',
    title:       'دوري التوقعات — توقع المباريات وتنافس مع الجميع',
    description: 'توقع نتائج مباريات كرة القدم بدقة، جمّع النقاط، وتنافس مع أصدقاءك في دوري روشن والدوريات الأوروبية',
    images: [{ url: '/icon-192.png', width: 192, height: 192, alt: 'دوري التوقعات' }],
  },
  twitter: {
    card:        'summary',
    title:       'دوري التوقعات — توقع المباريات وتنافس مع الجميع',
    description: 'توقع نتائج مباريات كرة القدم بدقة، جمّع النقاط، وتنافس مع أصدقاءك',
    images:      ['/icon-192.png'],
  },
  icons: {
    icon:  '/icon-192.png',
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
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
        userProfile: {
          navbar: {
            title:       'إدارة حسابك',
            description: 'إدارة حسابك',
            account:     'الملف الشخصي',
            security:    'الأمان',
          },
          formButtonPrimary__add:    'إضافة',
          formButtonPrimary__save:   'حفظ',
          formButtonPrimary__finish: 'إنهاء',
          formButtonReset:           'إلغاء',
          start: {
            headerTitle__account:  'إدارة حسابك',
            headerTitle__security: 'الأمان',
            profileSection: {
              title:         'تفاصيل الملف',
              primaryButton: 'تعديل الملف',
            },
            phoneNumbersSection: {
              title:         'أرقام الجوال',
              primaryButton: 'أضف رقم جوال',
              detailsAction__primary:    'الرئيسي',
              detailsAction__nonPrimary: 'اجعله رئيسياً',
              detailsAction__unverified: 'تحقق',
              destructiveAction:         'حذف',
            },
          },
          profilePage: {
            title: 'الملف الشخصي',
          },
          phoneNumberPage: {
            title:        'أرقام الجوال',
            verifyTitle:  'تحقق من رقم الجوال',
            infoText:     'سيُرسل رمز تحقق على هذا الرقم',
          },
        },
        userButton: {
          action__manageAccount: 'إدارة الحساب',
          action__signOut:       'تسجيل الخروج',
          action__signOutAll:    'تسجيل الخروج من كل الأجهزة',
        },
        formFieldLabel__phoneNumber:            'رقم الجوال',
        formFieldInputPlaceholder__phoneNumber: 'أدخل رقم جوالك',
        formButtonPrimary: 'متابعة',
      }}
    >
      <html lang="ar" dir="rtl">
        <body>
          <LanguageProvider>
            <Navbar />
            <ProfileSetupBanner />
            <PushInit />
            <main className="min-h-screen bg-slate-900">
              {children}
            </main>
            <Analytics />
            <FooterClient />
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
