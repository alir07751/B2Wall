# راهنمای Setup سیستم N8n برای B2Wall CRM

## مرحله ۱: راه‌اندازی N8n

### نصب N8n
```bash
# روش ۱: با Docker (توصیه می‌شود)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# روش ۲: با npm
npm install n8n -g
n8n start
```

دسترسی به N8n: http://localhost:5678

---

## مرحله ۲: ایجاد Google Sheet

۱. به Google Sheets بروید و یک sheet جدید بنام **B2Wall CRM** بسازید
۲. در ردیف اول (header) این ستون‌ها را اضافه کنید:

```
A: id (auto)
B: submitted_at
C: status
D: owner_name
E: owner_phone
F: project_title
G: capital_required
H: tenor_months
I: expected_profit_pct
J: payout_schedule
K: principal_return
L: guarantees
M: referral_source
N: notes (admin notes)
O: approved_at
P: approved_by
```

۳. Sheet ID را از URL کپی کنید:
```
https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_SHEET_ID]/edit
```

---

## مرحله ۳: اتصال N8n به Google Sheets

### ۱. افزودن Credentials در N8n:
- به **Settings → Credentials** بروید
- **New Credential** → **Google Sheets OAuth2 API**
- دکمه **Connect my account** را بزنید
- با Google account خود login کنید
- Credential را Save کنید

---

## مرحله ۴: ایجاد Workflow

### ۱. Import کردن Template:
- در N8n به **Workflows** بروید
- **Import from File** را بزنید
- فایل `n8n-workflow-template.json` را انتخاب کنید

### ۲. پیکربندی Nodes:

#### Node 1: Webhook
- **Path**: `b2wall-form-submission`
- **Method**: POST
- **Response Mode**: Using 'Respond to Webhook' Node
- Webhook URL را کپی کنید (مثلاً: `https://your-n8n.com/webhook/b2wall-form-submission`)

#### Node 2: Set - Format Data
این node رو اضافه کنید بین Webhook و Google Sheets:
```
Values to Set:
- id: {{ $now.toUnixInteger() }}{{ Math.random().toString().slice(2,6) }}
- submitted_at: {{ $json.submitted_at }}
- status: {{ $json.status || 'pending' }}
- owner_name: {{ $json.owner.name }}
- owner_phone: {{ $json.owner.phone }}
- project_title: {{ $json.title }}
- capital_required: {{ $json.capital_required }}
- tenor_months: {{ $json.tenor_months }}
- expected_profit_pct: {{ $json.expected_profit_pct }}
- payout_schedule: {{ $json.payout_schedule }}
- principal_return: {{ $json.principal_return }}
- guarantees: {{ $json.guarantees.join(', ') }}
- referral_source: {{ $json.referral_source }}
- notes: ""
- approved_at: ""
- approved_by: ""
```

#### Node 3: Google Sheets
- **Operation**: Append
- **Document**: انتخاب کنید "B2Wall CRM"
- **Sheet**: Sheet1 (یا نام sheet شما)
- **Data Mode**: Auto-Map Input Data

#### Node 4: Respond to Webhook
- **Response Body**:
```json
{
  "success": true,
  "message": "درخواست شما با موفقیت ثبت شد",
  "id": "{{ $json.id }}"
}
```

---

## مرحله ۵: فعال‌سازی Workflow

۱. Workflow را **Save** کنید
۲. دکمه **Active** را ON کنید
۳. Webhook URL را کپی کنید

---

## مرحله ۶: به‌روزرسانی form.html

۱. فایل `form.html` را باز کنید
۲. خط زیر را پیدا کنید:
```javascript
const N8N_WEBHOOK_URL = 'YOUR_N8N_WEBHOOK_URL_HERE';
```

۳. URL webhook خود را جایگزین کنید:
```javascript
const N8N_WEBHOOK_URL = 'https://your-n8n.com/webhook/b2wall-form-submission';
```

۴. فایل را Save و به Git push کنید

---

## مرحله ۷: تست سیستم

۱. به `https://b2wall.darkube.app/form.html` بروید
۲. فرم را پر کنید و ارسال کنید
۳. بررسی کنید که:
   - پیام موفقیت نمایش داده شود
   - داده در Google Sheet ثبت شده باشد
   - status آن "pending" باشد

---

## مرحله ۸: Deploy N8n (Production)

برای استفاده در production، N8n را باید روی سرور deploy کنید:

### گزینه ۱: N8n Cloud (ساده‌ترین)
- به https://n8n.io بروید
- اکانت بسازید
- Workflow را import کنید

### گزینه ۲: Self-hosted با Docker
```bash
docker-compose up -d
```

با docker-compose.yml:
```yaml
version: '3'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your-secure-password
      - N8N_HOST=your-domain.com
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://your-domain.com/
    volumes:
      - ~/.n8n:/home/node/.n8n
```

---

## مرحله بعدی: ساخت CRM Panel

بعد از این که N8n راه‌اندازی شد، مرحله بعدی ساخت `crm-panel.html` است که:
- داده‌ها را از Google Sheets بخواند
- به صورت کارت نمایش دهد
- امکان تغییر status (pending → approved/rejected) را بدهد
- فقط پروژه‌های approved در ویترین نمایش داده شوند

---

## نکات مهم

✅ Webhook URL را در محیط امن نگه دارید
✅ CORS را در N8n تنظیم کنید اگر لازم است
✅ از HTTPS برای production استفاده کنید
✅ Backup از Google Sheet بگیرید
✅ Access control برای N8n فعال کنید

---

سوالات؟ به مرحله بعد برویم! 🚀
