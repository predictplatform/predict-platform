'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useLang } from '@/contexts/LanguageContext';

const arabicLocalization = {
  signIn: {
    start: {
      title:      'دوري التوقعات',
      subtitle:   'أهلاً بعودتك!',
      actionText: 'ما عندك حساب؟',
      actionLink: 'سجّل الآن',
    },
  },
  signUp: {
    start: {
      title:      'إنشاء حساب',
      subtitle:   'أهلاً! أدخل رقم جوالك للبدء',
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
        title:                     'أرقام الجوال',
        primaryButton:             'أضف رقم جوال',
        detailsAction__primary:    'الرئيسي',
        detailsAction__nonPrimary: 'اجعله رئيسياً',
        detailsAction__unverified: 'تحقق',
        destructiveAction:         'حذف',
      },
    },
    profilePage:   { title: 'الملف الشخصي' },
    phoneNumberPage: {
      title:       'أرقام الجوال',
      verifyTitle: 'تحقق من رقم الجوال',
      infoText:    'سيُرسل رمز تحقق على هذا الرقم',
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
};

export function ClerkProviderWithLocale({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();

  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: '#2563eb' },
        elements: { badge: { display: 'none' } },
      }}
      // عند EN — لا نمرر localization فتستخدم Clerk الإنجليزية الافتراضية
      localization={lang === 'ar' ? arabicLocalization : undefined}
    >
      {children}
    </ClerkProvider>
  );
}
