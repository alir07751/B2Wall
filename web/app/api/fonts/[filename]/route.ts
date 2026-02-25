import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FONT_NAMES = ['Vazirmatn-Regular.woff2', 'Vazirmatn-Medium.woff2', 'Vazirmatn-SemiBold.woff2', 'Vazirmatn-Bold.woff2'];

function getFontsDir(): string | null {
  const webDir = process.cwd();
  const fontsRoot = path.join(webDir, '..', 'fonts');
  const webfonts = path.join(fontsRoot, 'webfonts');
  if (fs.existsSync(webfonts)) return webfonts;
  if (fs.existsSync(fontsRoot)) return fontsRoot;
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
