# کدهای مورد نیاز برای Function Node های n8n

## 1. کد Function Node برای ذخیره Share (بعد از Webhook Node)

این کد را در اولین Function Node بعد از Webhook Node قرار دهید:

```javascript
// دریافت داده از webhook
const inputData = $input.item.json;

// استخراج داده‌ها
const firstName = inputData.firstName || '';
const lastName = inputData.lastName || '';
const phone = inputData.phone || '';
const calculationResult = inputData.calculationResult || {};
const createdAt = inputData.createdAt || new Date().toISOString();

// ایجاد یک ID یکتا برای share
// ترکیب timestamp و random string برای اطمینان از یکتایی
const timestamp = Date.now();
const randomStr = Math.random().toString(36).substring(2, 15);
const shareId = `${timestamp}-${randomStr}`;

// ساخت URL share
// دقت کنید: باید domain خودتان را جایگزین کنید
const baseUrl = 'https://your-domain.com'; // تغییر دهید به domain واقعی
const shareUrl = `${baseUrl}/test-calculator.html?share=${shareId}`;

// داده‌های نهایی برای ذخیره
return {
  json: {
    shareId: shareId,
    shareUrl: shareUrl,
    firstName: firstName,
    lastName: lastName,
    phone: phone,
    calculationResult: JSON.stringify(calculationResult), // برای Google Sheets به string تبدیل می‌شود
    createdAt: createdAt,
    // این داده‌ها را به Google Sheets یا Database می‌فرستیم
    rawCalculationResult: calculationResult // برای استفاده در پاسخ
  }
};
```

---

## 2. کد Function Node برای دریافت Share (بعد از Webhook GET)

این کد را در Function Node بعد از Webhook GET قرار دهید:

```javascript
// دریافت shareId از URL parameter
const shareId = $('Webhook').item.json.params.shareId;

if (!shareId) {
  return {
    json: {
      error: 'shareId not provided',
      success: false
    }
  };
}

// shareId را به خروجی پاس می‌دهیم تا در Google Sheets یا Database Node استفاده شود
return {
  json: {
    shareId: shareId
  }
};
```

---

## 3. کد Function Node بعد از خواندن از Google Sheets/Database (برای فرمت کردن پاسخ)

بعد از اینکه داده را از Google Sheets یا Database خواندید، این کد را برای فرمت کردن پاسخ استفاده کنید:

```javascript
// دریافت داده از Google Sheets یا Database
const data = $input.item.json;

// اگر داده پیدا نشد
if (!data || !data.shareId) {
  return {
    json: {
      error: 'Share not found',
      success: false
    }
  };
}

// تبدیل calculationResult از string به object (اگر از Google Sheets خوانده شده)
let calculationResult = {};
try {
  if (typeof data.calculationResult === 'string') {
    calculationResult = JSON.parse(data.calculationResult);
  } else {
    calculationResult = data.calculationResult || {};
  }
} catch (e) {
  console.error('Error parsing calculationResult:', e);
  calculationResult = {};
}

// فرمت کردن پاسخ نهایی
return {
  json: {
    shareId: data.shareId,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    phone: data.phone || '',
    calculationResult: calculationResult,
    createdAt: data.createdAt || ''
  }
};
```

---

## 4. کد کامل برای Google Sheets Node (مثال)

اگر از Google Sheets استفاده می‌کنید:

### برای ذخیره (Append):
- **Operation:** Append
- **Spreadsheet:** انتخاب sheet شما
- **Sheet:** نام sheet (مثلاً "Shares")
- **Columns:** 
  - A: `shareId`
  - B: `firstName`
  - C: `lastName`
  - D: `phone`
  - E: `createdAt`
  - F: `shareUrl`
  - G: `calculationResult`

### Mapping فیلدها:
```javascript
// در Google Sheets Node
{
  "shareId": "={{ $json.shareId }}",
  "firstName": "={{ $json.firstName }}",
  "lastName": "={{ $json.lastName }}",
  "phone": "={{ $json.phone }}",
  "createdAt": "={{ $json.createdAt }}",
  "shareUrl": "={{ $json.shareUrl }}",
  "calculationResult": "={{ $json.calculationResult }}"
}
```

### برای خواندن (Read):
- **Operation:** Read
- **Spreadsheet:** انتخاب sheet شما
- **Sheet:** نام sheet
- **Range:** `A:G`
- **Options -> Filter:**
  - **Column:** `shareId`
  - **Condition:** `equal`
  - **Value:** `={{ $json.shareId }}`

---

## 5. مثال کامل Workflow Structure

### Workflow 1: Save Share
```
Webhook (POST /save-share)
  ↓
Function Node (کد شماره 1 - ایجاد shareId)
  ↓
Google Sheets / Database (ذخیره)
  ↓
Function Node (فرمت کردن پاسخ)
  ↓
Respond to Webhook (برگرداندن {shareId, shareUrl})
```

### Workflow 2: Get Share
```
Webhook (GET /get-share/:shareId)
  ↓
Function Node (کد شماره 2 - استخراج shareId)
  ↓
Google Sheets / Database (خواندن)
  ↓
Function Node (کد شماره 3 - فرمت کردن پاسخ)
  ↓
Respond to Webhook (برگرداندن {calculationResult, ...})
```

---

## نکات مهم:

1. **Domain را تغییر دهید:**
   - در کد شماره 1، `baseUrl` را به domain واقعی خود تغییر دهید

2. **Google Sheets:**
   - اگر از Google Sheets استفاده می‌کنید، باید Google Sheets API را در n8n تنظیم کنید
   - calculationResult را به صورت JSON string ذخیره کنید

3. **Database:**
   - اگر از PostgreSQL استفاده می‌کنید، calculationResult را به صورت JSONB ذخیره کنید

4. **امنیت:**
   - اگر می‌خواهید، Authentication به webhook اضافه کنید
   - از shareId های پیچیده‌تر استفاده کنید

---

## تست کردن:

### تست Save:
```bash
curl -X POST https://n8nb2wall.darkube.app/webhook/save-share \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "علی",
    "lastName": "احمدی",
    "phone": "09123456789",
    "calculationResult": {"summary": {"totalPrincipal": 330000000}},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }'
```

### تست Get:
```bash
curl https://n8nb2wall.darkube.app/webhook/get-share/YOUR-SHARE-ID
```




