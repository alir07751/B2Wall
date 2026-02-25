# فونت Vazirmatn (محلی)

فونت‌های این پوشه به‌صورت **self-host** استفاده می‌شوند تا در صورت قطع یا فیلتر اینترنت خارجی، صفحه بدون مشکل فونت را لود کند.

## دانلود فایل‌های فونت

فایل‌های woff2 را از یکی از منابع زیر دانلود کنید و داخل پوشه `webfonts` قرار دهید:

**منبع رسمی (GitHub):**  
https://github.com/rastikerdar/vazirmatn/releases

در هر نسخه (مثلاً v33.003) فایل ZIP را دانلود کنید، از داخل آن پوشه `fonts/webfonts/` را باز کنید و این چهار فایل را کپی کنید:

- `Vazirmatn-Regular.woff2`
- `Vazirmatn-Medium.woff2`
- `Vazirmatn-SemiBold.woff2`
- `Vazirmatn-Bold.woff2`

**لینک مستقیم (jsDelivr):**

- https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@33.003/fonts/webfonts/Vazirmatn-Regular.woff2
- https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@33.003/fonts/webfonts/Vazirmatn-Medium.woff2
- https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@33.003/fonts/webfonts/Vazirmatn-SemiBold.woff2
- https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@33.003/fonts/webfonts/Vazirmatn-Bold.woff2

پس از قرار دادن فایل‌ها در `fonts/webfonts/`، برای استفاده در اپ وب، آن‌ها را در `web/public/fonts/` کپی کنید تا لندینگ از همین فونت‌های محلی استفاده کند.
