# دانلود فونت Vazirmatn برای استفاده محلی (یک‌بار اجرا کنید)
$base = "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@33.003/fonts/webfonts"
$dest = Join-Path $PSScriptRoot "webfonts"
$files = @("Vazirmatn-Regular.woff2", "Vazirmatn-Medium.woff2", "Vazirmatn-SemiBold.woff2", "Vazirmatn-Bold.woff2")

if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }
foreach ($f in $files) {
    $url = "$base/$f"
    $out = Join-Path $dest $f
    Write-Host "Downloading $f ..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
        Write-Host "  OK"
    } catch {
        Write-Warning "  Failed: $_"
    }
}
Write-Host "Done. Check fonts/webfonts/"
