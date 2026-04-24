'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

export function usePushNotifications() {
  const { isSignedIn } = useUser();
  const askedRef = useRef(false);

  useEffect(() => {
    // فقط للمستخدمين المسجلين في متصفح يدعم Push
    if (!isSignedIn) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (askedRef.current) return;
    askedRef.current = true;

    // إذا سبق ورفض أو وافق، ما نسأل مجدداً
    if (Notification.permission === 'denied') return;

    const registerAndSubscribe = async () => {
      try {
        // تسجيل Service Worker
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;

        // إذا موجود اشتراك مسبق، نرفعه للسيرفر مباشرة
        let subscription = await reg.pushManager.getSubscription();

        if (!subscription) {
          // اطلب إذن المستخدم فقط إذا لم يكن هناك اشتراك
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // أرسل الاشتراك للـ API
        const key = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');
        if (!key || !auth) return;

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
            auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
          }),
        });
      } catch (err) {
        console.warn('Push registration error:', err);
      }
    };

    // تأخير بسيط حتى يستقر الـ layout
    const timer = setTimeout(registerAndSubscribe, 3000);
    return () => clearTimeout(timer);
  }, [isSignedIn]);
}
