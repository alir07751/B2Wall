#!/bin/bash
# Bash script to deploy React app build files
# This script copies build files to the correct location

echo "🚀 Deploying Loan Calculator..."

# Check if build folder exists
if [ ! -d "loan-calculator-frontend/build" ]; then
    echo "❌ Build folder not found! Please run 'npm run build' first."
    exit 1
fi

# Create loan-calculator directory if it doesn't exist
mkdir -p loan-calculator

# Copy build files
echo "📦 Copying build files..."
cp -r loan-calculator-frontend/build/* loan-calculator/

echo "✅ Deployment complete!"
echo "📄 Access the app at: https://b2wall.darkube.app/loan-calculator.html"

