# راهنمای اتصال Frontend به n8n Backend

این راهنما نحوه اتصال برنامه React به workflow n8n را توضیح می‌دهد.

## مراحل اتصال

### 1. تنظیم n8n Workflow

در n8n workflow خود:

1. یک **Webhook Node** اضافه کنید
2. متد را روی **POST** تنظیم کنید
3. URL webhook را کپی کنید (مثال: `https://your-n8n.com/webhook/loan-calculator`)

### 2. اضافه کردن Code Node

بعد از Webhook Node، یک **Code Node** اضافه کنید و کد موجود در `n8n-financing-calculator.js` را در آن قرار دهید.

### 3. تنظیم Frontend

#### روش 1: استفاده از متغیر محیطی (توصیه می‌شود)

فایل `.env` را در ریشه پروژه React ایجاد کنید:

```env
REACT_APP_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/loan-calculator
```

سپس برنامه را دوباره اجرا کنید:

```bash
npm start
```

#### روش 2: تغییر مستقیم در کد

فایل `src/utils/api.js` را باز کنید و URL را تغییر دهید:

```javascript
const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/loan-calculator';
```

### 4. تست اتصال

1. برنامه React را اجرا کنید
2. فرم را پر کنید
3. روی "محاسبه جدول بازپرداخت" کلیک کنید
4. اگر اتصال برقرار باشد، نتایج از n8n دریافت می‌شود
5. در صورت خطا، برنامه از محاسبه محلی استفاده می‌کند (فقط در حالت توسعه)

## ساختار داده ورودی

برنامه React داده‌های زیر را به n8n ارسال می‌کند:

```json
{
  "LoanAmount": 330000000,
  "MonthlyInterestRate": 4.5,
  "PrincipalRepayments": [
    {"days": 60, "amount": 30000000},
    {"days": 120, "amount": 50000000}
  ],
  "InterestPaymentDates": [180, 240]
}
```

## ساختار داده خروجی

n8n باید داده‌های زیر را برگرداند:

```json
{
  "success": true,
  "schedule": [
    {
      "روز": 1,
      "اصل پول باقی‌مانده (قبل از پرداخت)": 330000000,
      "مبلغ پرداخت اصل پول": 0,
      "سود انباشته پرداخت شده": 0,
      "مبلغ کل پرداختی در این روز": 0,
      "توضیحات": "هیچ پرداختی انجام نشد",
      "_raw": {
        "day": 1,
        "remainingPrincipalBefore": 330000000,
        "principalPayment": 0,
        "interestPayment": 0,
        "totalPayment": 0,
        "remainingPrincipalAfter": 330000000
      }
    }
  ],
  "summary": {
    "مبلغ کل وام": 330000000,
    "نرخ سود ماهیانه": "4.5%",
    "مجموع اصل پول پرداخت شده": 330000000,
    "مجموع سود پرداخت شده": 15000000,
    "مجموع کل پرداخت‌ها": 345000000,
    "_raw": {
      "totalPrincipalPaid": 330000000,
      "totalInterestPaid": 15000000,
      "totalPayments": 345000000,
      "finalDay": 240
    }
  }
}
```

## عیب‌یابی

### مشکل: خطای CORS

اگر با خطای CORS مواجه شدید:

1. در n8n، در تنظیمات Webhook Node، گزینه "Response Mode" را روی "Response Node" تنظیم کنید
2. یا CORS را در n8n فعال کنید

### مشکل: داده‌ها دریافت نمی‌شوند

1. Console مرورگر را بررسی کنید (F12)
2. Network tab را بررسی کنید تا ببینید درخواست ارسال شده است یا نه
3. URL webhook را دوباره بررسی کنید

### مشکل: محاسبات نادرست

1. مطمئن شوید که کد `n8n-financing-calculator.js` به درستی در Code Node قرار گرفته است
2. لاگ‌های n8n را بررسی کنید
3. داده‌های ورودی را در n8n بررسی کنید

## نکات امنیتی

- هرگز URL webhook را در کد commit نکنید
- از متغیرهای محیطی استفاده کنید
- در production، HTTPS را فعال کنید
- در صورت نیاز، احراز هویت را به webhook اضافه کنید

