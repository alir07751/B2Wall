# PowerShell script to deploy React app build files
# This script copies build files to the correct location

Write-Host "🚀 Deploying Loan Calculator..." -ForegroundColor Green

# Check if build folder exists
if (-not (Test-Path "loan-calculator-frontend\build")) {
    Write-Host "❌ Build folder not found! Please run 'npm run build' first." -ForegroundColor Red
    exit 1
}

# Create loan-calculator directory if it doesn't exist
if (-not (Test-Path "loan-calculator")) {
    New-Item -ItemType Directory -Path "loan-calculator" | Out-Null
    Write-Host "✅ Created loan-calculator directory" -ForegroundColor Green
}

# Copy build files
Write-Host "📦 Copying build files..." -ForegroundColor Yellow
Copy-Item -Path "loan-calculator-frontend\build\*" -Destination "loan-calculator\" -Recurse -Force

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "📄 Access the app at: https://b2wall.darkube.app/loan-calculator.html" -ForegroundColor Cyan

