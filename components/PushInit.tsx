'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';

// Component خفي — فقط لتفعيل الـ Hook
export function PushInit() {
  usePushNotifications();
  return null;
}
