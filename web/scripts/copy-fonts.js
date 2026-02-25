const fs = require('fs');
const path = require('path');

// منبع فونت‌ها: B2Wall-1/fonts (پوشه webfonts یا خود fonts)
const fontsRoot = path.join(__dirname, '../../fonts');
const srcDir = fs.existsSync(path.join(fontsRoot, 'webfonts'))
  ? path.join(fontsRoot, 'webfonts')
  : fontsRoot;
const destDir = path.join(__dirname, '../public/fonts');
const files = ['Vazirmatn-Regular.woff2', 'Vazirmatn-Medium.woff2', 'Vazirmatn-SemiBold.woff2', 'Vazirmatn-Bold.woff2'];

if (!fs.existsSync(srcDir)) {
  console.warn('B2Wall-1/fonts (یا fonts/webfonts) یافت نشد؛ فایل‌های woff2 را در web/public/fonts/ کپی کنید.');
  process.exit(0);
}

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
files.forEach((f) => {
  const src = path.join(srcDir, f);
  const dest = path.join(destDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('Copied', f);
  }
});
