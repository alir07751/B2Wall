# راهنمای Commit و Push به Git

## فایل‌های مهم برای Commit

### ✅ باید Commit شوند:

#### 1. Backend (n8n Calculator)
```
n8n-financing-calculator.js
test-calculator-example.json
```

#### 2. Frontend (React App)
```
loan-calculator-frontend/
├── package.json
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── index.js
│   ├── index.css
│   ├── components/
│   │   ├── InputForm.js
│   │   └── ResultsDisplay.js
│   └── utils/
│       ├── api.js
│       └── currencyFormatter.js
├── README.md
├── QUICK-START.md
├── INTEGRATION-GUIDE.md
└── .gitignore
```

### ❌ نباید Commit شوند:

- `node_modules/` (وابستگی‌ها)
- `build/` (فایل‌های build شده)
- `.env` (متغیرهای محیطی حساس)
- `.env.local`, `.env.development.local`, etc.
- فایل‌های log
- فایل‌های IDE (`.vscode/`, `.idea/`)

## دستورات Git

### 1. بررسی وضعیت فایل‌ها:
```bash
git status
```

### 2. اضافه کردن فایل‌های جدید:
```bash
# اضافه کردن همه فایل‌های تغییر یافته
git add .

# یا به صورت انتخابی:
git add n8n-financing-calculator.js
git add loan-calculator-frontend/
```

### 3. Commit:
```bash
git commit -m "feat: اضافه کردن محاسبه‌گر بازپرداخت وام با frontend React"
```

### 4. Push:
```bash
git push origin main
# یا
git push origin master
```

## نکات مهم

1. **URL n8n**: در حال حاضر URL در کد (`api.js`) hardcode شده است. اگر می‌خواهید آن را از git حذف کنید و از `.env` استفاده کنید، باید:
   - فایل `.env` را ایجاد کنید (این فایل در `.gitignore` است)
   - URL را در `.env` قرار دهید
   - در کد از `process.env.REACT_APP_N8N_WEBHOOK_URL` استفاده کنید

2. **node_modules**: هرگز `node_modules` را commit نکنید. این پوشه با `npm install` ساخته می‌شود.

3. **build folder**: فایل‌های build شده را commit نکنید. این فایل‌ها با `npm run build` ساخته می‌شوند.

## ساختار پیشنهادی Commit

```bash
git add n8n-financing-calculator.js
git add test-calculator-example.json
git add loan-calculator-frontend/package.json
git add loan-calculator-frontend/public/
git add loan-calculator-frontend/src/
git add loan-calculator-frontend/*.md
git add loan-calculator-frontend/.gitignore

git commit -m "feat: اضافه کردن محاسبه‌گر بازپرداخت وام

- Backend: n8n JavaScript calculator با محاسبه روز به روز
- Frontend: React app با RTL و فارسی
- ویژگی‌ها: فرم پویا، اعتبارسنجی، جدول تفصیلی"

git push origin main
```

