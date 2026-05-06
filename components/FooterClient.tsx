'use client';

import { useT } from '@/hooks/useT';

export default function FooterClient() {
  const t = useT();

  return (
    <footer className="bg-slate-800 border-t border-slate-700 text-slate-400 text-sm">
      {/* Contact */}
      <div className="text-center py-5 border-b border-slate-700">
        <p className="text-slate-300 mb-3">
          {t.footer.contactQuestion}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/966566111012?text=${encodeURIComponent('مرحباً، عندي استفسار عن دوري التوقعات')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.112 1.524 5.84L.057 23.428a.75.75 0 0 0 .921.921l5.588-1.466A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.502-5.25-1.38l-.375-.216-3.878 1.018 1.018-3.878-.217-.375A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            {t.footer.contactUs}
          </a>

          {/* X / Twitter */}
          <a
            href="https://x.com/dawritawaquat"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.footer.twitterAlt}
            className="inline-flex items-center justify-center w-10 h-10 bg-slate-700 hover:bg-black text-white rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.254 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>

          {/* TikTok */}
          <a
            href="https://tiktok.com/@dawritawaquat"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.footer.tiktokAlt}
            className="inline-flex items-center justify-center w-10 h-10 bg-slate-700 hover:bg-[#010101] text-white rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
            </svg>
          </a>
        </div>
      </div>
      {/* Copyright */}
      <div className="text-center py-4">
        <p>{t.footer.copyright}</p>
      </div>
    </footer>
  );
}
