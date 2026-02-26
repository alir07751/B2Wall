import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FONT_NAMES = ['Vazirmatn-Regular.woff2', 'Vazirmatn-Medium.woff2', 'Vazirmatn-SemiBold.woff2', 'Vazirmatn-Bold.woff2'];

/** مسیر پوشه فونت: public/fonts، بعد app/fonts (یا app/fonts/webfonts)، بعد ریپو fonts/ یا fonts/webfonts/ */
function getFontsDir(): string | null {
  const cwd = process.cwd();
  const publicFonts = path.join(cwd, 'public', 'fonts');
  if (fs.existsSync(publicFonts)) return publicFonts;
  const appFonts = path.join(cwd, 'fonts');
  const appWebfonts = path.join(appFonts, 'webfonts');
  if (fs.existsSync(appWebfonts)) return appWebfonts;
  if (fs.existsSync(appFonts)) return appFonts;
  const repoFonts = path.join(cwd, '..', 'fonts');
  const repoWebfonts = path.join(repoFonts, 'webfonts');
  if (fs.existsSync(repoWebfonts)) return repoWebfonts;
  if (fs.existsSync(repoFonts)) return repoFonts;
  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!FONT_NAMES.includes(filename)) {
    return new NextResponse(null, { status: 404 });
  }
  const dir = getFontsDir();
  if (!dir) {
    return new NextResponse(null, { status: 404 });
  }
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) {
    return new NextResponse(null, { status: 404 });
  }
  const buf = fs.readFileSync(filePath);
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'font/woff2',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
