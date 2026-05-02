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
          <Navbar />
          <ProfileSetupBanner />
          <PushInit />
          <main className="min-h-screen bg-slate-900">
            {children}
          </main>
          <footer className="bg-slate-800 border-t border-slate-700 text-slate-400 text-sm">
            {/* تواصل معنا */}
            <div className="text-center py-5 border-b border-slate-700">
              <p className="text-slate-300 mb-3">
                عندك اقتراح؟ حصلت خطأ؟ أو ودك تتواصل معنا؟
              </p>
              <a
                href={`https://wa.me/966566111012?text=${encodeURIComponent('مرحباً، عندي استفسار عن دوري التوقعات')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                {/* WhatsApp SVG icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.112 1.524 5.84L.057 23.428a.75.75 0 0 0 .921.921l5.588-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.502-5.25-1.38l-.375-.216-3.878 1.018 1.018-3.878-.217-.375A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                تواصل معنا على الوتس
              </a>
            </div>
            {/* حقوق */}
            <div className="text-center py-4">
              <p>⚽ دوري التوقعات — مجاني بالكامل | لا مراهنات مالية</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
