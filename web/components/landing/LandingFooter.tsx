'use client';

import { MapPin, Mail, Phone, Send, Linkedin, Instagram, Twitter } from 'lucide-react';
import { fa } from '@/strings/fa';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const BALE_LOGO_SRC = '/bale-logo.svg';

const SOCIAL_LINKS = [
  { href: 'https://wa.me/989215065925', label: fa.socialWhatsApp, customIcon: 'whatsapp' as const },
  { href: 'https://t.me/b2wall', label: fa.socialTelegram, icon: Send },
  { href: 'https://www.linkedin.com/company/b2wall', label: fa.socialLinkedIn, icon: Linkedin },
  { href: 'https://ble.ir/b2wall', label: fa.socialBale, customIcon: 'bale' as const },
  { href: 'https://instagram.com/b2wall', label: fa.socialInstagram, icon: Instagram },
  { href: 'https://x.com/b2wall', label: fa.socialTwitter, icon: Twitter },
];

/** لوکیشن دقیق: V9R3+MFR Sar-e Do Rah, Yazd (Plus Code) */
const MAP_EMBED_URL = 'https://www.google.com/maps?q=V9R3%2BMFR+Sar-e+Do+Rah,+Yazd,+Yazd+Province,+Iran&z=16&output=embed';

export function LandingFooter() {
  return (
    <footer className="bg-primary text-white mt-auto">
      {/* سوشال + نماد اعتماد — هم‌سو با تم رنگی لندینگ */}
      <div className="border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-white/80 mb-4">ما را در شبکه‌های اجتماعی دنبال کنید</p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {SOCIAL_LINKS.map(({ href, label, icon: Icon, customIcon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-12 h-12 rounded-2xl border border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 transition-all"
                aria-label={label}
                title={label}
              >
                {customIcon === 'whatsapp' && <WhatsAppIcon className="h-7 w-7" />}
                {customIcon === 'bale' && (
                  <img src={BALE_LOGO_SRC} alt="" className="h-7 w-7 object-contain" width={28} height={28} />
                )}
                {!customIcon && Icon && <Icon className="h-7 w-7" />}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* آدرس، تماس، پری‌ویو لوکیشن */}
      <div id="contact" className="border-b border-white/20 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-white/20 bg-white/5">
              <div className="w-full aspect-[1.618] max-h-[280px]">
                <iframe
                  title={fa.footerLocation}
                  src={MAP_EMBED_URL}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-4 rounded-2xl border border-white/20 bg-white/5 p-4">
              <a
                href={fa.footerMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 hover:text-white transition-colors text-sm text-white/90"
              >
                <MapPin className="h-5 w-5 text-white/80 shrink-0 mt-0.5" />
                <span>
                  <span className="font-medium text-white/90">{fa.footerAddress}: </span>
                  {fa.footerAddressFull}
                </span>
              </a>
              <a
                href={`tel:+98${fa.footerPhoneTel.replace(/^0/, '')}`}
                className="flex items-center gap-3 hover:text-white transition-colors text-sm text-white/90"
              >
                <Phone className="h-5 w-5 text-white/80 shrink-0" />
                <span>
                  <span className="font-medium text-white/90">{fa.footerPhone}: </span>
                  <span className="font-tabular">{fa.footerPhoneValue}</span>
                </span>
              </a>
              <a
                href={`mailto:${fa.footerEmailValue}`}
                className="flex items-center gap-3 hover:text-white transition-colors text-sm text-white/90"
              >
                <Mail className="h-5 w-5 text-white/80 shrink-0" />
                <span>
                  <span className="font-medium text-white/90">{fa.footerEmail}: </span>
                  <span dir="ltr">{fa.footerEmailValue}</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* برند + حقوق */}
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-lg font-bold text-white">{fa.brand}</h2>
          <p className="text-xs text-white/70">{fa.footerRights}</p>
        </div>
      </div>
    </footer>
  );
}
