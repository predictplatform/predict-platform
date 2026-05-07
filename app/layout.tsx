import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import './globals.css';
import Navbar from '@/components/Navbar';
import { PushInit } from '@/components/PushInit';
import { ProfileSetupBanner } from '@/components/ProfileSetupBanner';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ClerkProviderWithLocale } from '@/components/ClerkProviderWithLocale';
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
    <html lang="ar" dir="rtl">
      <body>
        {/* LanguageProvider خارج ClerkProviderWithLocale حتى يمكنه قراءة اللغة عبر useLang() */}
        <LanguageProvider>
          <ClerkProviderWithLocale>
            <Navbar />
            <ProfileSetupBanner />
            <PushInit />
            <main className="min-h-screen bg-slate-900">
              {children}
            </main>
            <Analytics />
            <FooterClient />
            {/* OTP auto-fill patch — يضيف autocomplete="one-time-code" على حقول Clerk */}
            <Script id="clerk-otp-autocomplete" strategy="afterInteractive">{`
              (function () {
                function patch(root) {
                  root.querySelectorAll(
                    '.cl-otpCodeFieldInput, [data-otp-input-v2], input[inputmode="numeric"][maxlength="1"]'
                  ).forEach(function (el) {
                    if (el.getAttribute('autocomplete') !== 'one-time-code') {
                      el.setAttribute('autocomplete', 'one-time-code');
                    }
                  });
                }
                var obs = new MutationObserver(function (mutations) {
                  for (var i = 0; i < mutations.length; i++) {
                    var added = mutations[i].addedNodes;
                    for (var j = 0; j < added.length; j++) {
                      if (added[j].nodeType === 1) patch(added[j]);
                    }
                  }
                });
                obs.observe(document.body, { childList: true, subtree: true });
                patch(document);
              })();
            `}</Script>
          </ClerkProviderWithLocale>
        </LanguageProvider>
      </body>
    </html>
  );
}
