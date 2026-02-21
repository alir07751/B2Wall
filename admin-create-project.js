/**
 * Create Project — Vanilla JS
 * Role-agnostic: قابل استفاده برای مدیریت یا سرویس خودخدمت.
 * در حالت SELF_SERVICE بخش مالک مخفی و از نشست گرفته می‌شود.
 */

// ——— Config ———
const CONFIG = {
  APP_MODE: 'WITH_OWNER', // or 'SELF_SERVICE'
  N8N_BASE: 'https://n8nb2wall.darkube.app',
  get CREATE_URL() { return `${this.N8N_BASE}/webhook/create`; },
  get OPPORTUNITIES_URL() { return `${this.N8N_BASE}/webhook/allopportunities`; },
  get UPDATE_URL() { return `${this.N8N_BASE}/webhook/update`; },
  get UPLOAD_URL() { return `${this.N8N_BASE}/webhook/upload`; },
  get ATTACH_COVER_URL() { return `${this.N8N_BASE}/webhook/attach-cover`; },
  FILE_MAX_BYTES: 3 * 1024 * 1024, // 3MB
  IMAGE_MIN_WIDTH: 400,
  IMAGE_MIN_HEIGHT: 300,
  IMAGE_MAX_DIMENSION: 6000,
  IMAGE_ALLOWED_MIMES: ['image/jpeg', 'image/png', 'image/webp'],
  IMAGE_ALLOWED_EXT: ['.jpg', '.jpeg', '.png', '.webp'],
  REQUIRED_AMOUNT_MIN: 100000,
  REQUIRED_AMOUNT_MAX: 1e15,
  CLEAR_OWNER_ON_SUCCESS: false,
  IMAGE_BASE: 'https://b2wall.storage.c2.liara.space/',
  REQUEST_TIMEOUT_MS: 20000,
  SHOWCASE_URL: 'https://b2wall.darkube.app/',
};

// ——— UI strings (Persian) ———
const MSG = {
  VALIDATION_FIX: 'لطفاً فیلدهای ضروری را تکمیل کنید.',
  SYSTEM_ERROR: 'مشکلی در سرور رخ داد. لطفاً دوباره تلاش کنید.',
  REQUEST_FAILED: 'ارسال درخواست ناموفق بود.',
  REQUEST_TIMEOUT: 'زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید.',
  INVALID_RESPONSE: 'پاسخ سرور نامعتبر است.',
  TRACKING_CODE: 'کد پیگیری',
  COPY: 'کپی',
  COPIED: 'کپی شد',
  PROGRESS_VALIDATE: 'در حال بررسی...',
  PROGRESS_CREATE: 'در حال ایجاد پروژه...',
  PROGRESS_UPLOAD: 'در حال آپلود تصویر...',
  PROGRESS_ATTACH: 'در حال ثبت تصویر...',
  CREATE_OK_UPLOAD_FAIL: 'پروژه ایجاد شد اما آپلود تصویر انجام نشد.',
  UPLOAD_OK_ATTACH_FAIL: 'پروژه ایجاد شد اما ثبت تصویر انجام نشد.',
  STEP_CREATE: 'ایجاد پروژه',
  STEP_UPLOAD: 'آپلود تصویر',
  STEP_ATTACH: 'ثبت تصویر',
  RETRY_ATTACH: 'تلاش مجدد ثبت تصویر',
  IMAGE_INVALID_FORMAT: 'فرمت تصویر نامعتبر است. فقط JPG، PNG و WebP مجاز است.',
  IMAGE_TOO_LARGE: 'حجم فایل بیش از حد مجاز است. حداکثر ۳ مگابایت.',
  IMAGE_TOO_SMALL: 'ابعاد تصویر کمتر از حد مجاز است. حداقل ۴۰۰×۳۰۰ پیکسل.',
  IMAGE_DANGEROUS_EXT: 'نام فایل نامعتبر است.',
  LOADING_OVERLAY: 'در حال ثبت اطلاعات، لطفاً صبر کنید...',
  SUBMITTING_BTN: 'در حال ثبت...',
  SUCCESS_MESSAGE: 'پروژه با موفقیت ثبت شد.',
  SUBMIT_ERROR: 'خطا در ثبت پروژه. لطفاً بررسی و دوباره تلاش کنید.',
  BTN_SUBMIT: 'ایجاد پروژه',
  BTN_UPDATE: 'ثبت ویرایش',
  EDIT_TITLE: 'ویرایش پروژه',
  LOADING_EDIT: 'در حال بارگذاری پروژه...',
  EDIT_LOAD_FAIL: 'بارگذاری پروژه برای ویرایش ناموفق بود.',
  PUBLISH_REQUIRES_VALID: 'برای انتشار پروژه ابتدا تمام فیلدهای الزامی را تکمیل کنید.',
};

// Persian digits for display
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function normalizeStatus(raw) {
  const s = (raw || '').toString().toUpperCase();
  if (s === 'ACTIVE') return 'FUNDING';
  if (['FUNDING', 'REVIEW', 'COMPLETED'].indexOf(s) !== -1) return s;
  return 'FUNDING';
}

/** Publish status: UI values. Backend mapping: PUBLISHED→PUBLIC, UNPUBLISHED→PRIVATE. */
const PUBLISH_STATUS = {
  PUBLISHED: 'PUBLISHED',
  UNPUBLISHED: 'UNPUBLISHED',
};
const PUBLISH_STATUS_VALUES = [PUBLISH_STATUS.PUBLISHED, PUBLISH_STATUS.UNPUBLISHED];

/** Map UI value to backend visibility. */
function publishStatusToBackend(uiValue) {
  return uiValue === PUBLISH_STATUS.PUBLISHED ? 'PUBLIC' : 'PRIVATE';
}

/** Map backend visibility to UI select value. */
function publishStatusFromBackend(backendValue) {
  if (backendValue === 'PUBLIC') return PUBLISH_STATUS.PUBLISHED;
  return PUBLISH_STATUS.UNPUBLISHED;
}

// ——— State machine ———
const STATE = {
  IDLE: 'IDLE',
  VALIDATING: 'VALIDATING',
  CREATING: 'CREATING',
  UPLOADING: 'UPLOADING',
  ATTACHING: 'ATTACHING',
  DONE: 'DONE',
  ERROR: 'ERROR',
};

let submitState = STATE.IDLE;
let lastSuccessfulProjectId = null;
let lastUploadResult = null;
let lastErrorStep = null;
let editMode = false;
let editProjectId = null;

// Server field path → input element ID
const FIELD_PATH_TO_ID = {
  'owner.phone': 'owner-phone',
  'owner.full_name': 'owner-full-name',
  'project.title': 'project-title',
  'project.status': 'project-status',
  'project.monthly_profit_percent': 'project-monthly-profit-percent',
  'project.duration_months': 'project-duration-months',
  'project.profit_payout_interval_days': 'project-profit-payout-interval-days',
  'project.principal_payout_interval_days': 'project-principal-payout-interval-days',
  'project.guarantee_type': 'project-guarantee-type',
  'project.required_amount_toman': 'project-required-amount-toman',
  'project.visibility': 'project-visibility',
  'project.image': 'project-image',
};

// ——— DOM refs ———
const form = document.getElementById('create-project-form');
const submitBtn = document.getElementById('submit-btn');
const progressTextEl = document.getElementById('progress-text');
const globalErrorEl = document.getElementById('global-error');
const successBannerEl = document.getElementById('success-banner');
const successPanelEl = document.getElementById('success-panel');
const summaryCardWrap = document.getElementById('summary-card');
const ownerSection = document.getElementById('owner-section');
const imageInput = document.getElementById('project-image');
const imagePreviewWrap = document.getElementById('image-preview-wrap');
const imagePreview = document.getElementById('image-preview');
const loadingOverlayEl = document.getElementById('loading-overlay');
const errorRetryActionsEl = document.getElementById('error-retry-actions');
const errorTechnicalDetailsEl = document.getElementById('error-technical-details');
const errorTechnicalPreEl = document.getElementById('error-technical-pre');

// Client-side validation field mapping (legacy)
const FIELD_IDS = {
  owner_phone: 'owner-phone',
  owner_full_name: 'owner-full-name',
  project_title: 'project-title',
  project_status: 'project-status',
  project_monthly_profit_percent: 'project-monthly-profit-percent',
  project_duration_months: 'project-duration-months',
  project_profit_payout_interval_days: 'project-profit-payout-interval-days',
  project_principal_payout_interval_days: 'project-principal-payout-interval-days',
  project_guarantee_type: 'project-guarantee-type',
  project_required_amount_toman: 'project-required-amount-toman',
  project_visibility: 'project-visibility',
  project_image: 'project-image',
};

// ——— Edit mode ———
function getEditParams() {
  const params = new URLSearchParams(document.location.search || '');
  const mode = (params.get('mode') || '').toLowerCase();
  const id = (params.get('id') || '').trim();
  return { mode, id };
}

/** Fetch all opportunities and return the project with given id, or null. */
async function fetchProjectForEdit(id) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(CONFIG.OPPORTUNITIES_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      return null;
    }
    const list = Array.isArray(data) ? data : (data?.opportunities ?? data?.data ?? []);
    if (!Array.isArray(list)) return null;
    const found = list.find((p) => (p.id ?? p.opportunity_id ?? p.project_id) == id);
    return found || null;
  } catch (_) {
    clearTimeout(timeoutId);
    return null;
  }
}

function prefillForm(project) {
  if (!project || !form) return;
  const p = project.project || project;
  const o = project.owner || {};
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val != null && val !== '') el.value = String(val);
  };
  // Owner fields: support multiple name variations
  const ownerPhone = o.phone ?? o.owner_phone ?? o.ownerPhone ?? o.mobile ?? null;
  const ownerName = o.full_name ?? o.owner_full_name ?? o.ownerFullName ?? o.ownerName ?? o.name ?? null;
  setVal('owner-phone', ownerPhone);
  setVal('owner-full-name', ownerName);
  // Project fields: support both snake_case and camelCase
  setVal('project-title', p.title);
  setVal('project-status', normalizeStatusForPayload(p.status));
  const monthly = p.monthly_profit_percent ?? p.monthlyProfitPercent ?? null;
  setVal('project-monthly-profit-percent', monthly);
  const duration = p.duration_months ?? p.durationMonths ?? null;
  setVal('project-duration-months', duration);
  const profitInterval = p.profit_payout_interval_days ?? p.profitPayoutIntervalDays ?? null;
  setVal('project-profit-payout-interval-days', profitInterval);
  const principalInterval = p.principal_payout_interval_days ?? p.principalPayoutIntervalDays ?? null;
  setVal('project-principal-payout-interval-days', principalInterval);
  const required = p.required_amount_toman ?? p.requiredAmountToman ?? null;
  setVal('project-required-amount-toman', required);
  const funded = p.funded_amount_toman ?? p.fundedAmountToman ?? null;
  setVal('project-funded-amount-toman', funded != null ? funded : 0);
  const vis = (p.visibility ?? '').toString().toUpperCase();
  setVal('project-visibility', vis === 'PUBLIC' ? PUBLISH_STATUS.PUBLISHED : PUBLISH_STATUS.UNPUBLISHED);
  // Guarantee type: support both formats
  const guarantee = (p.guarantee_type ?? p.guaranteeType ?? '').trim();
  if (guarantee) {
    const parts = guarantee.split(/[،,]/).map((s) => s.trim()).filter(Boolean);
    const container = document.getElementById('guarantee-checkboxes');
    if (container) {
      container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        cb.checked = parts.includes(cb.value);
      });
    }
    const chipsEl = document.getElementById('guarantee-chips');
    if (chipsEl) {
      chipsEl.hidden = parts.length === 0;
      chipsEl.innerHTML = parts.map((v) => `<span class="chip">${escapeHtml(v)}</span>`).join('');
    }
  }
  // Image: show existing if available, make upload optional in edit mode
  const imgUrl = project.image_url ?? p.image_url ?? project.imageUrl ?? p.imageUrl ?? null;
  if (imgUrl && imagePreview && imagePreviewWrap) {
    imagePreview.src = toPublicImageUrl(imgUrl);
    imagePreviewWrap.hidden = false;
  }
  // Amount formatting: support both snake_case and camelCase
  const reqAmount = p.required_amount_toman ?? p.requiredAmountToman ?? null;
  const reqRead = document.getElementById('required-amount-readable');
  const reqFormatted = document.getElementById('required-amount-formatted');
  const reqWords = document.getElementById('required-amount-words');
  if (reqRead && reqFormatted && reqWords && reqAmount != null) {
    reqRead.hidden = false;
    setText(reqFormatted, toPersianDigits(formatAmountWithSeparators(String(reqAmount))) + ' تومان');
    setText(reqWords, numberToPersianWords(Number(reqAmount)));
  }
  const fundedAmount = p.funded_amount_toman ?? p.fundedAmountToman ?? null;
  const fundedRead = document.getElementById('funded-amount-readable');
  const fundedFormatted = document.getElementById('funded-amount-formatted');
  const fundedWords = document.getElementById('funded-amount-words');
  if (fundedRead && fundedFormatted && fundedWords && fundedAmount != null) {
    fundedRead.hidden = false;
    setText(fundedFormatted, toPersianDigits(formatAmountWithSeparators(String(fundedAmount))) + ' تومان');
    setText(fundedWords, numberToPersianWords(Number(fundedAmount)));
  }
  setupAmountFormatting();
}

// ——— Validation helpers ———

const DIGIT_MAP = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/** Convert Persian/Arabic digits to Latin only. Keeps punctuation. For text fields. */
function convertDigitsToLatin(value) {
  if (value == null) return '';
  return String(value).trim().replace(/[۰-۹٠-٩]/g, (c) => DIGIT_MAP[c] || c);
}

/** Convert Persian/Arabic digits to English, remove thousands separators, trim. "۱۲۳,۴۵۶" → "123456". For numeric inputs. */
function normalizeDigits(value) {
  if (value == null) return '';
  const s = convertDigitsToLatin(value);
  return s.replace(/[,،٬]/g, '');
}

const toLatinDigits = convertDigitsToLatin;

function sanitizeText(str) {
  if (str == null) return '';
  let s = String(str)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>{}]/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

function validateNumberRange(val, min, max, options) {
  const { integer = false, decimals = null } = options || {};
  if (val == null || val === '' || (typeof val === 'number' && isNaN(val))) return { valid: false };
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  if (isNaN(n)) return { valid: false };
  if (n < min || n > max) return { valid: false };
  if (integer && !Number.isInteger(n)) return { valid: false };
  if (decimals != null) {
    const str = String(n);
    const dot = str.indexOf('.');
    if (dot !== -1 && str.length - dot - 1 > decimals) return { valid: false };
  }
  return { valid: true, value: integer ? Math.floor(n) : n };
}

const DANGEROUS_TITLE = /[<>{}]|<script|script>|javascript:/i;
const ONLY_NUMBERS = /^\d+$/;
/** Iranian mobile: 09xxxxxxxxx (11 digits, starts with 09) */
const IRANIAN_MOBILE = /^09\d{9}$/;

/** Title prefix: acceptable prefixes. Default for auto-apply. */
const TITLE_PREFIXES = ['تأمین مالی برای', 'تامین مالی برای', 'تأمین مالی جهت', 'تامین مالی جهت'];
const TITLE_DEFAULT_PREFIX = 'تأمین مالی جهت ';

/** Guarantee type options (controlled vocabulary). */
const GUARANTEE_OPTIONS = ['وثیقه ملکی', 'ضامن معتبر', 'دستگاه', 'خودرو', 'طلا', 'سفته'];

function titleHasPrefix(title) {
  const t = String(title || '').trim();
  if (!t) return false;
  return TITLE_PREFIXES.some((p) => t.startsWith(p));
}

function applyTitlePrefix(title) {
  const t = String(title || '').replace(/\s+/g, ' ').trim();
  if (!t) return TITLE_DEFAULT_PREFIX.trim();
  if (titleHasPrefix(t)) return t;
  return (TITLE_DEFAULT_PREFIX + t).replace(/\s+/g, ' ').trim();
}

/** Validates image file: mime, extension, size, dimensions. Returns { valid, message } or { valid: true }. */
function validateImageFile(file) {
  if (!file || !(file instanceof File)) return { valid: false, message: MSG.IMAGE_INVALID_FORMAT };

  const name = (file.name || '').toLowerCase();
  const dangerousExt = /\.(exe|bat|cmd|sh|php|js|svg)$/;
  if (dangerousExt.test(name)) return { valid: false, message: MSG.IMAGE_DANGEROUS_EXT };
  if (/\.(jpg|jpeg|png|webp)\.(exe|bat|cmd|sh|php|js)$/i.test(name)) return { valid: false, message: MSG.IMAGE_DANGEROUS_EXT };

  const ext = name.lastIndexOf('.') >= 0 ? name.slice(name.lastIndexOf('.')) : '';
  if (!CONFIG.IMAGE_ALLOWED_EXT.includes(ext)) return { valid: false, message: MSG.IMAGE_INVALID_FORMAT };
  if (!CONFIG.IMAGE_ALLOWED_MIMES.includes(file.type)) return { valid: false, message: MSG.IMAGE_INVALID_FORMAT };

  if (file.size > CONFIG.FILE_MAX_BYTES) return { valid: false, message: MSG.IMAGE_TOO_LARGE };

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (w < CONFIG.IMAGE_MIN_WIDTH || h < CONFIG.IMAGE_MIN_HEIGHT) {
        resolve({ valid: false, message: MSG.IMAGE_TOO_SMALL });
        return;
      }
      if (w > CONFIG.IMAGE_MAX_DIMENSION || h > CONFIG.IMAGE_MAX_DIMENSION) {
        resolve({ valid: false, message: `ابعاد تصویر بیش از ${CONFIG.IMAGE_MAX_DIMENSION} پیکسل مجاز نیست.` });
        return;
      }
      resolve({ valid: true });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, message: MSG.IMAGE_INVALID_FORMAT });
    };
    img.src = url;
  });
}

// ——— Utilities ———

function parseNumericInput(str) {
  if (str == null || String(str).trim() === '') return NaN;
  const s = normalizeDigits(String(str).trim());
  if (/[eE]/.test(s)) return NaN;
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}

/** Normalize and format monthly profit percent: 1–100, exactly 2 decimals. Supports Persian digits. */
function formatProfitPercentInput(inputEl) {
  if (!inputEl) return;

  const raw = normalizeDigits(inputEl.value);
  if (!raw) return;

  const n = parseFloat(raw);
  if (isNaN(n)) return;

  const clamped = Math.min(Math.max(n, 1), 100);
  inputEl.value = clamped.toFixed(2);
}

function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function setText(el, text) {
  if (!el) return;
  el.textContent = text != null ? String(text) : '';
}

function toPersianDigits(n) {
  if (n == null || n === '') return '—';
  return String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[+d]);
}

/** Convert number to Persian words (for amounts). Supports up to billions. */
function numberToPersianWords(n) {
  if (n == null || isNaN(n) || n < 0) return '';
  const num = Math.floor(Number(n));
  if (num === 0) return '';
  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const tens = ['', 'ده', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];

  function upTo999(x) {
    if (x === 0) return '';
    let s = '';
    if (x >= 100) { s += hundreds[Math.floor(x / 100)] + ' و '; x %= 100; }
    if (x >= 20) { s += tens[Math.floor(x / 10)] + (x % 10 ? ' و ' + ones[x % 10] : ''); return s.trim(); }
    if (x >= 10) return (s + teens[x - 10]).trim();
    return (s + ones[x]).trim();
  }

  if (num >= 1e9) {
    const b = Math.floor(num / 1e9);
    const r = num % 1e9;
    return (upTo999(b) + ' میلیارد' + (r > 0 ? ' و ' + numberToPersianWords(r) : '') + ' تومان').trim();
  }
  if (num >= 1e6) {
    const m = Math.floor(num / 1e6);
    const r = num % 1e6;
    return (upTo999(m) + ' میلیون' + (r > 0 ? ' و ' + numberToPersianWords(r) : '') + ' تومان').trim();
  }
  if (num >= 1000) {
    const t = Math.floor(num / 1000);
    const r = num % 1000;
    return (upTo999(t) + ' هزار' + (r > 0 ? ' و ' + upTo999(r) : '') + ' تومان').trim();
  }
  return upTo999(num) + ' تومان';
}

function formatAmountWithSeparators(val) {
  const s = normalizeDigits(String(val || '').trim());
  if (!s || /[^\d]/.test(s)) return val;
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '،');
}

function formatToman(num) {
  if (num == null || isNaN(num)) return '—';
  const n = Number(num);
  if (n >= 1e9) return toPersianDigits((n / 1e9).toFixed(1).replace('.', '٫')) + ' میلیارد تومان';
  if (n >= 1e6) return toPersianDigits(Math.round(n / 1e6)) + ' میلیون تومان';
  return toPersianDigits(Math.round(n)) + ' تومان';
}

function toPublicImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const u = String(url).trim();
  if (/^data:image\//i.test(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('/')) return CONFIG.IMAGE_BASE.replace(/\/$/, '') + u;
  return CONFIG.IMAGE_BASE.replace(/\/$/, '') + '/' + u.replace(/^\//, '');
}

// ——— Data collection & normalization ———

function collectFormData() {
  const rawTitle = (form.querySelector('#project-title')?.value || '').replace(/\s+/g, ' ').trim();
  const title = sanitizeText(convertDigitsToLatin(rawTitle));
  const guaranteeSelected = Array.from(form.querySelectorAll('#guarantee-checkboxes input[type="checkbox"]:checked'))
    .map((cb) => cb.value)
    .filter(Boolean);
  const guarantee_type = guaranteeSelected.join('، ');

  const owner = {
    phone: convertDigitsToLatin((form.querySelector('#owner-phone')?.value || '').replace(/\s+/g, ' ').trim()),
    full_name: sanitizeText((form.querySelector('#owner-full-name')?.value || '').replace(/\s+/g, ' ').trim()),
  };

  const fundedRaw = parseNumericInput(form.querySelector('#project-funded-amount-toman')?.value);
  const fundedNum = !isNaN(fundedRaw) && fundedRaw >= 0 ? Math.floor(fundedRaw) : 0;

  const mpRaw = parseNumericInput(form.querySelector('#project-monthly-profit-percent')?.value);
  const monthly_profit_percent = !isNaN(mpRaw) ? Number(Number(mpRaw).toFixed(2)) : NaN;

  const durRaw = parseNumericInput(form.querySelector('#project-duration-months')?.value);
  const duration_months = !isNaN(durRaw) ? Math.floor(durRaw) : NaN;

  const ppRaw = parseNumericInput(form.querySelector('#project-profit-payout-interval-days')?.value);
  const profit_payout_interval_days = !isNaN(ppRaw) ? Math.floor(ppRaw) : NaN;

  const prRaw = parseNumericInput(form.querySelector('#project-principal-payout-interval-days')?.value);
  const principal_payout_interval_days = !isNaN(prRaw) ? Math.floor(prRaw) : NaN;

  const reqRaw = parseNumericInput(form.querySelector('#project-required-amount-toman')?.value);
  const required_amount_toman = !isNaN(reqRaw) ? Math.floor(reqRaw) : NaN;

  const statusRaw = (form.querySelector('#project-status')?.value || 'REVIEW').trim().toUpperCase();
  const visibility = (form.querySelector('#project-visibility')?.value || PUBLISH_STATUS.UNPUBLISHED).trim();

  const project = {
    title,
    status: statusRaw,
    monthly_profit_percent,
    duration_months,
    profit_payout_interval_days,
    principal_payout_interval_days,
    guarantee_type,
    funded_amount_toman: fundedNum,
    required_amount_toman,
    visibility,
  };

  const fileInput = form.querySelector('#project-image');
  const file = fileInput?.files?.[0] || null;

  return { owner, project, file };
}

/** Ensure numeric value is sent; never send NaN. */
function safeNumber(val, fallback) {
  const n = Number(val);
  return isNaN(n) ? (fallback !== undefined ? fallback : 0) : n;
}

/** Normalize payload for backend: trim strings, convert numbers, remove empty optional, no NaN. */
function normalizePayload(owner, project) {
  const o = {
    phone: String(owner.phone || '').trim(),
    full_name: String(owner.full_name || '').trim(),
  };
  const p = {
    title: String(project.title || '').trim(),
    status: normalizeStatusForPayload(project.status),
    monthly_profit_percent: safeNumber(project.monthly_profit_percent),
    duration_months: Math.floor(safeNumber(project.duration_months, 1)),
    profit_payout_interval_days: Math.floor(safeNumber(project.profit_payout_interval_days, 1)),
    principal_payout_interval_days: Math.floor(safeNumber(project.principal_payout_interval_days, 1)),
    guarantee_type: String(project.guarantee_type || '').trim(),
    funded_amount_toman: Math.floor(safeNumber(project.funded_amount_toman, 0)),
    required_amount_toman: Math.floor(safeNumber(project.required_amount_toman)),
    visibility: publishStatusToBackend(PUBLISH_STATUS_VALUES.includes(project.visibility) ? project.visibility : PUBLISH_STATUS.UNPUBLISHED),
  };
  return { owner: o, project: p };
}

// ——— Validation (client-side) ———

const ALLOWED_STATUS = ['REVIEW', 'FUNDING', 'COMPLETED'];

/** Normalize status for backend: only REVIEW, FUNDING, COMPLETED. Map legacy ACTIVE→FUNDING. */
function normalizeStatusForPayload(status) {
  const s = (status || '').toString().toUpperCase();
  if (s === 'ACTIVE') return 'FUNDING';
  return ALLOWED_STATUS.includes(s) ? s : 'REVIEW';
}

/**
 * Validates form data. Returns { isValid, errors }.
 * Async when file is present (image dimension check).
 */
async function validateForm(model) {
  const errors = [];
  const { owner, project, file } = model;

  if (CONFIG.APP_MODE === 'WITH_OWNER') {
    const phoneNorm = String(owner.phone || '').replace(/\s/g, '');
    if (!phoneNorm) errors.push({ field: 'owner_phone', message: 'شماره موبایل الزامی است.' });
    else if (!IRANIAN_MOBILE.test(phoneNorm)) errors.push({ field: 'owner_phone', message: 'شماره موبایل معتبر نیست. مثال: ۰۹۱۲۰۰۰۰۰۰۰' });
    const fullName = String(owner.full_name || '').trim();
    if (!fullName) errors.push({ field: 'owner_full_name', message: 'نام و نام خانوادگی الزامی است.' });
    else if (fullName.length < 3 || fullName.length > 80) errors.push({ field: 'owner_full_name', message: 'نام باید بین ۳ تا ۸۰ کاراکتر باشد.' });
  }

  const title = project.title || '';
  if (!title) errors.push({ field: 'project_title', message: 'عنوان الزامی است.' });
  else {
    if (title.length < 3 || title.length > 80) errors.push({ field: 'project_title', message: 'عنوان باید بین ۳ تا ۸۰ کاراکتر باشد.' });
    else if (ONLY_NUMBERS.test(title)) errors.push({ field: 'project_title', message: 'عنوان نمی‌تواند فقط عدد باشد.' });
    else if (DANGEROUS_TITLE.test(title)) errors.push({ field: 'project_title', message: 'عنوان شامل کاراکترهای نامعتبر است.' });
  }

  if (!ALLOWED_STATUS.includes(project.status)) {
    errors.push({ field: 'project_status', message: 'وضعیت نامعتبر است.' });
  }

  const mp = validateNumberRange(project.monthly_profit_percent, 1, 100, { decimals: 2 });
  if (!mp.valid) errors.push({ field: 'project_monthly_profit_percent', message: 'سود ماهانه باید بین ۱ تا ۱۰۰ درصد باشد (حداکثر ۲ رقم اعشار).' });

  const dm = validateNumberRange(project.duration_months, 1, 120, { integer: true });
  if (!dm.valid) errors.push({ field: 'project_duration_months', message: 'مدت باید عدد صحیح بین ۱ تا ۱۲۰ ماه باشد.' });

  const pp = validateNumberRange(project.profit_payout_interval_days, 1, 3650, { integer: true });
  if (!pp.valid) errors.push({ field: 'project_profit_payout_interval_days', message: 'فاصله پرداخت سود الزامی است (عدد صحیح).' });

  const pr = validateNumberRange(project.principal_payout_interval_days, 1, 36500, { integer: true });
  if (!pr.valid) errors.push({ field: 'project_principal_payout_interval_days', message: 'فاصله پرداخت اصل سرمایه الزامی است (عدد صحیح).' });

  const strictGuarantee = (project.visibility === PUBLISH_STATUS.PUBLISHED || project.status === 'FUNDING');
  const hasGuarantee = project.guarantee_type && project.guarantee_type.trim().length > 0;
  if (strictGuarantee && !hasGuarantee) {
    errors.push({ field: 'project_guarantee_type', message: 'حداقل یک نوع ضمانت باید انتخاب شود.' });
  }

  const funded = project.funded_amount_toman;
  const required = project.required_amount_toman;
  const reqVal = validateNumberRange(required, CONFIG.REQUIRED_AMOUNT_MIN, CONFIG.REQUIRED_AMOUNT_MAX, { integer: true });
  if (!reqVal.valid) errors.push({ field: 'project_required_amount_toman', message: 'مبلغ مورد نیاز باید عدد صحیح و حداقل ۱۰۰٬۰۰۰ تومان باشد.' });
  if (!isNaN(required) && required > 0 && !isNaN(funded) && funded > required) {
    errors.push({ field: 'project_required_amount_toman', message: 'مبلغ تأمین‌شده نمی‌تواند بیشتر از مبلغ مورد نیاز باشد.' });
  }

  if (!project.visibility || !PUBLISH_STATUS_VALUES.includes(project.visibility)) {
    errors.push({ field: 'project_visibility', message: 'وضعیت انتشار الزامی است.' });
  }

  if (!file) {
    if (!editMode) {
      errors.push({ field: 'project_image', message: 'تصویر پروژه الزامی است.' });
    }
  } else {
    const imgResult = await validateImageFile(file);
    if (!imgResult.valid) errors.push({ field: 'project_image', message: imgResult.message });
  }

  return { isValid: errors.length === 0, errors };
}

function scrollToFirstError(errors) {
  if (!errors || errors.length === 0) return;
  const first = errors[0];
  const scrollId = first.field === 'project_guarantee_type' ? 'guarantee-checkboxes' : (FIELD_PATH_TO_ID[first.field] || FIELD_IDS[first.field]);
  if (scrollId) {
    const el = document.getElementById(scrollId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/** بررسی می‌کند آیا فرم با وضعیت «انتشار» معتبر است؛ گزینه انتشار را طبق آن فعال/غیرفعال می‌کند. */
async function updatePublishAvailability() {
  const visibilitySelect = document.getElementById('project-visibility');
  const publishedOption = visibilitySelect?.querySelector('option[value="PUBLISHED"]');
  const errorEl = document.getElementById('project-visibility-error');
  if (!visibilitySelect || !publishedOption) return;

  const model = collectFormData();
  model.project.visibility = PUBLISH_STATUS.PUBLISHED;
  const { isValid } = await validateForm(model);

  publishedOption.disabled = !isValid;
  if (publishedOption.disabled) {
    publishedOption.title = MSG.PUBLISH_REQUIRES_VALID;
  } else {
    publishedOption.removeAttribute('title');
  }

  if (!isValid && visibilitySelect.value === PUBLISH_STATUS.PUBLISHED) {
    visibilitySelect.value = PUBLISH_STATUS.UNPUBLISHED;
    if (errorEl) {
      errorEl.textContent = MSG.PUBLISH_REQUIRES_VALID;
      visibilitySelect.classList.add('is-invalid', 'error');
    }
  } else if (errorEl && errorEl.textContent === MSG.PUBLISH_REQUIRES_VALID) {
    errorEl.textContent = '';
    visibilitySelect.classList.remove('is-invalid', 'error');
  }
}

let _publishAvailabilityDebounce = null;
function debouncedUpdatePublishAvailability() {
  if (_publishAvailabilityDebounce) clearTimeout(_publishAvailabilityDebounce);
  _publishAvailabilityDebounce = setTimeout(() => {
    _publishAvailabilityDebounce = null;
    updatePublishAvailability();
  }, 400);
}

// ——— FormData builder ———

/** FormData for create endpoint (owner + project only; file sent separately via upload). */
function buildCreateFormData(owner, project) {
  const { owner: o, project: p } = normalizePayload(owner, project);
  const fd = new FormData();
  fd.append('owner', JSON.stringify(o));
  fd.append('project', JSON.stringify(p));
  return fd;
}

// ——— Centralized request wrapper ———

/**
 * Calls the create webhook. Returns normalized result:
 * - { kind: "success", data }
 * - { kind: "validation", errors }
 * - { kind: "system", message, requestId?, raw? }
 */
async function callCreateProject(formData) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(CONFIG.CREATE_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let bodyText;
    try {
      bodyText = await res.text();
    } catch {
      return { kind: 'system', message: MSG.INVALID_RESPONSE, raw: null };
    }

    let json = null;
    try {
      json = bodyText ? JSON.parse(bodyText) : null;
    } catch (parseErr) {
      const msg = 'پاسخ سرور به صورت JSON معتبر نبود. در بخش «جزئیات فنی» می‌توانید پاسخ خام را ببینید.';
      return {
        kind: 'system',
        message: msg,
        requestId: null,
        raw: bodyText != null ? String(bodyText).slice(0, 2000) : '',
      };
    }

    // HTTP 400 + errors[] → validation
    if (res.status === 400 && json && Array.isArray(json.errors)) {
      return { kind: 'validation', errors: json.errors };
    }

    // ok:false + error object → system
    if (json && json.ok === false && json.error && typeof json.error === 'object') {
      const err = json.error;
      return {
        kind: 'system',
        message: err.message || MSG.SYSTEM_ERROR,
        requestId: err.request_id || null,
        raw: bodyText,
      };
    }

    // Success (2xx)
    if (res.ok) {
      const data = normalizeCreateResponse(json?.opportunity, json);
      return { kind: 'success', data };
    }

    // Other HTTP errors
    const msg = json?.message || json?.error || (typeof json?.error === 'string' ? json.error : null) || `HTTP ${res.status}`;
    const reqId = json?.error?.request_id || json?.request_id || null;
    return {
      kind: 'system',
      message: typeof msg === 'string' ? msg : MSG.SYSTEM_ERROR,
      requestId: reqId,
      raw: bodyText,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { kind: 'system', message: MSG.REQUEST_TIMEOUT };
    }
    return {
      kind: 'system',
      message: err.message || MSG.REQUEST_FAILED,
      requestId: null,
      raw: null,
    };
  }
}

function normalizeCreateResponse(opportunity, fullJson) {
  const raw = opportunity || fullJson || {};
  const id = raw.id ?? raw.opportunity_id ?? fullJson?.opportunity_id ?? fullJson?.id ?? null;
  const imageUrl = raw.image_url ?? raw.imageUrl ?? '';
  return { ...raw, id, image_url: imageUrl };
}

/** Call update webhook. Returns same shape as callCreateProject for consistency. */
async function callUpdateProject(projectId, payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
  try {
    const body = { id: projectId, opportunity_id: projectId, ...payload };
    const res = await fetch(CONFIG.UPDATE_URL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const bodyText = await res.text();
    let json = null;
    try {
      json = bodyText ? JSON.parse(bodyText) : null;
    } catch (_) {
      return { kind: 'system', message: MSG.INVALID_RESPONSE, raw: null };
    }
    if (res.ok) {
      const data = normalizeCreateResponse(json?.opportunity ?? json, json);
      return { kind: 'success', data: { ...data, id: projectId } };
    }
    if (res.status === 400 && json && Array.isArray(json.errors)) {
      return { kind: 'validation', errors: json.errors };
    }
    const msg = json?.message || json?.error?.message || (typeof json?.error === 'string' ? json.error : null) || `HTTP ${res.status}`;
    return { kind: 'system', message: typeof msg === 'string' ? msg : MSG.SYSTEM_ERROR, requestId: json?.error?.request_id, raw: bodyText };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') return { kind: 'system', message: MSG.REQUEST_TIMEOUT };
    return { kind: 'system', message: err.message || MSG.REQUEST_FAILED };
  }
}

/** Generic fetch with timeout. Returns { ok, status, json, text } or throws. */
async function fetchWithTimeout(url, opts) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timeoutId);
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch { /* ignore */ }
    return { ok: res.ok, status: res.status, json, text };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/** Upload cover image. Returns { success, url, key, status, raw } or { success: false, message }. URL is trimmed. */
async function requestUploadCover({ entityId, file, visibility }) {
  const vis = visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
  const fd = new FormData();
  fd.append('entity_id', String(entityId || ''));
  fd.append('context', 'projects');
  fd.append('entity_type', 'opportunity');
  fd.append('file_type', 'cover');
  fd.append('visibility', vis);
  fd.append('file', file);
  try {
    const { ok, status, json, text } = await fetchWithTimeout(CONFIG.UPLOAD_URL, {
      method: 'POST',
      body: fd,
    });
    // Upload API may return array: [{ ok, key, url }] or object: { ok, key, url }
    const data = Array.isArray(json) ? json[0] : json;
    const rawUrl = data?.url ?? data?.data?.url ?? data?.data?.image_url ?? json?.url ?? json?.data?.url ?? '';
    const cleanUrl = String(rawUrl || '').trim();
    if (ok && cleanUrl) return { success: true, ok: true, url: cleanUrl, key: data?.key ?? data?.data?.key, status, raw: text };
    if (ok && !cleanUrl) return { success: false, ok: true, message: 'پاسخ آپلود بدون آدرس تصویر است.', status, raw: text };
    const invalidJsonMsg = json === null && text ? 'پاسخ سرور به صورت JSON معتبر نبود. در بخش «جزئیات فنی» پاسخ خام را ببینید.' : null;
    const msg = invalidJsonMsg || data?.message || data?.error || (typeof data?.error === 'object' && data.error?.message) || MSG.SYSTEM_ERROR;
    return { success: false, ok: false, message: typeof msg === 'string' ? msg : MSG.SYSTEM_ERROR, status, raw: text };
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, ok: false, message: MSG.REQUEST_TIMEOUT };
    return { success: false, ok: false, message: err.message || MSG.REQUEST_FAILED };
  }
}

/** Attach cover URL to project. Sends entity_id, image_url + synonyms for backend compatibility. */
async function requestAttachCover({ entityId, imageUrl }) {
  const eid = String(entityId || '');
  const url = String(imageUrl || '').trim();
  const payload = {
    entity_id: eid,
    image_url: url,
    opportunity_id: eid,
    project_id: eid,
    id: eid,
    imageUrl: url,
    url,
  };
  try {
    const { ok, status, json, text } = await fetchWithTimeout(CONFIG.ATTACH_COVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (ok) {
      if (json && json.ok === false) {
        const msg = json?.message || json?.error || (typeof json?.error === 'object' && json.error?.message) || MSG.SYSTEM_ERROR;
        return { success: false, ok: false, message: typeof msg === 'string' ? msg : MSG.SYSTEM_ERROR, status, raw: text };
      }
      return { success: true, ok: true, json, status, raw: text };
    }
    const invalidJsonMsg = json === null && text ? 'پاسخ سرور به صورت JSON معتبر نبود. در بخش «جزئیات فنی» پاسخ خام را ببینید.' : null;
    const msg = invalidJsonMsg || json?.message || json?.error || (typeof json?.error === 'object' && json.error?.message) || MSG.SYSTEM_ERROR;
    return { success: false, ok: false, message: typeof msg === 'string' ? msg : MSG.SYSTEM_ERROR, status, raw: text };
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, ok: false, message: MSG.REQUEST_TIMEOUT };
    return { success: false, ok: false, message: err.message || MSG.REQUEST_FAILED };
  }
}

function normalizeResponse(resp) {
  if (!resp) return { id: null, image_url: '' };
  const id = resp.id ?? resp.project_id ?? null;
  const imageUrl = resp.image_url ?? resp.imageUrl ?? '';
  return { ...resp, id, image_url: imageUrl };
}

// ——— Error / loading helpers ———

function clearErrors() {
  document.querySelectorAll('.field-error').forEach((el) => { setText(el, ''); });
  document.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  document.querySelectorAll('.error').forEach((el) => el.classList.remove('error'));
  if (globalErrorEl) {
    globalErrorEl.hidden = true;
    const content = globalErrorEl.querySelector('.alert-content');
    if (content) content.innerHTML = '';
    if (errorRetryActionsEl) { errorRetryActionsEl.hidden = true; errorRetryActionsEl.innerHTML = ''; }
    if (errorTechnicalDetailsEl) errorTechnicalDetailsEl.hidden = true;
  }
}

function showFieldErrors(errors) {
  clearErrors();
  if (!errors || errors.length === 0) return;

  errors.forEach((item) => {
    const field = item.field;
    const message = item.message || '';
    const inputId = FIELD_PATH_TO_ID[field] || FIELD_IDS[field];
    if (field === 'project_guarantee_type') {
      const container = document.getElementById('guarantee-checkboxes');
      const errorEl = document.getElementById('project-guarantee-type-error');
      if (container) container.classList.add('is-invalid', 'error');
      if (errorEl) setText(errorEl, message);
      return;
    }
    if (inputId) {
      const input = document.getElementById(inputId);
      const errorEl = document.getElementById(inputId + '-error');
      if (input) {
        input.classList.add('is-invalid', 'error');
      }
      if (errorEl) setText(errorEl, message);
    }
  });
}

function clearFieldErrorsOnly() {
  document.querySelectorAll('.field-error').forEach((el) => { setText(el, ''); });
  document.querySelectorAll('.is-invalid, .error').forEach((el) => el.classList.remove('is-invalid', 'error'));
}

function showGlobalError(opts) {
  const { type, message, requestId, clearFields, stepName, projectId, technicalDetails, retryAttachCallback } = opts || {};
  if (!globalErrorEl) return;
  if (!message) {
    globalErrorEl.hidden = true;
    const content = globalErrorEl.querySelector('.alert-content');
    if (content) content.innerHTML = '';
    if (errorRetryActionsEl) { errorRetryActionsEl.hidden = true; errorRetryActionsEl.innerHTML = ''; }
    if (errorTechnicalDetailsEl) errorTechnicalDetailsEl.hidden = true;
    return;
  }
  if (clearFields) clearFieldErrorsOnly();

  const content = globalErrorEl.querySelector('.alert-content');
  if (content) {
    content.innerHTML = '';
    const parts = [];
    if (stepName) parts.push(`[${stepName}]`);
    parts.push(message);
    const msgSpan = document.createElement('span');
    msgSpan.className = 'alert-message';
    msgSpan.textContent = parts.join(' ');
    content.appendChild(msgSpan);

    if (projectId) {
      const idRow = document.createElement('div');
      idRow.className = 'alert-request-id';
      idRow.innerHTML = `<span>شناسه پروژه: </span><code>${escapeHtml(projectId)}</code>`;
      content.appendChild(idRow);
    }

    if (requestId) {
      const reqRow = document.createElement('div');
      reqRow.className = 'alert-request-id';
      const reqLabel = document.createElement('span');
      reqLabel.textContent = `${MSG.TRACKING_CODE}: `;
      const reqVal = document.createElement('code');
      reqVal.textContent = requestId;
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn-copy';
      copyBtn.textContent = MSG.COPY;
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(requestId).then(() => {
          copyBtn.textContent = MSG.COPIED;
          copyBtn.disabled = true;
          setTimeout(() => { copyBtn.textContent = MSG.COPY; copyBtn.disabled = false; }, 2000);
        });
      });
      reqRow.appendChild(reqLabel);
      reqRow.appendChild(reqVal);
      reqRow.appendChild(copyBtn);
      content.appendChild(reqRow);
    }
  }

  if (errorRetryActionsEl) {
    errorRetryActionsEl.innerHTML = '';
    errorRetryActionsEl.hidden = !retryAttachCallback;
    if (retryAttachCallback) {
      const retryBtn = document.createElement('button');
      retryBtn.type = 'button';
      retryBtn.className = 'btn-retry';
      retryBtn.textContent = MSG.RETRY_ATTACH;
      retryBtn.addEventListener('click', retryAttachCallback);
      errorRetryActionsEl.appendChild(retryBtn);
    }
  }

  if (errorTechnicalDetailsEl && errorTechnicalPreEl) {
    errorTechnicalDetailsEl.hidden = !technicalDetails;
    if (technicalDetails) {
      errorTechnicalPreEl.textContent = typeof technicalDetails === 'string' ? technicalDetails : JSON.stringify(technicalDetails, null, 2);
    }
  }

  globalErrorEl.hidden = false;
}

function setLoadingState(isLoading, progressText) {
  if (submitBtn) submitBtn.disabled = !!isLoading;
  if (progressTextEl) {
    setText(progressTextEl, progressText || '');
    progressTextEl.hidden = !progressText;
  }
}

/** Full loading overlay: block interaction, show Persian text. */
function setOverlayLoading(show, text) {
  const isOn = !!show;
  setFormEnabled(!isOn);
  if (form) {
    form.classList.toggle('is-loading', isOn);
    form.setAttribute('aria-busy', String(isOn));
  }
  if (submitBtn) {
    submitBtn.setAttribute('aria-busy', String(isOn));
    setText(submitBtn, isOn ? MSG.SUBMITTING_BTN : MSG.BTN_SUBMIT);
  }
  if (loadingOverlayEl) {
    const txt = loadingOverlayEl.querySelector('.loading-overlay-text');
    if (txt) setText(txt, text || MSG.LOADING_OVERLAY);
    loadingOverlayEl.hidden = !isOn;
    loadingOverlayEl.setAttribute('aria-busy', String(isOn));
  }
}

function clearLoadingState() {
  setOverlayLoading(false, '');
  setLoadingState(false, '');
  setFormEnabled(true);
}

/** Enable/disable form inputs and buttons. Preserves permanently disabled fields (e.g. funded amount). */
function setFormEnabled(enabled) {
  form?.querySelectorAll('input, select, button').forEach((el) => {
    if (el.id === 'project-funded-amount-toman') return;
    el.disabled = !enabled;
  });
}

/** Centralized error display. Keeps form data. Supports stepName, projectId, technicalDetails, retryAttachCallback. */
function showError(message, opts) {
  clearLoadingState();
  submitState = STATE.ERROR;
  setFormEnabled(true);
  const { requestId, stepName, projectId, technicalDetails, retryAttachCallback } = opts || {};
  showGlobalError({
    type: 'system',
    message: message || MSG.SUBMIT_ERROR,
    requestId: requestId || null,
    clearFields: false,
    stepName,
    projectId,
    technicalDetails,
    retryAttachCallback,
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Success banner. Green message. Auto-hide after 5 seconds. */
function showSuccess(message) {
  clearErrors();
  successBannerEl.hidden = false;
  setText(successBannerEl, message || MSG.SUCCESS_MESSAGE);
  setTimeout(() => {
    successBannerEl.hidden = true;
  }, 5000);
}

// ——— UI ———

function renderClientErrors(errors) {
  showFieldErrors(errors);
  if (errors && errors.length > 0) {
    showGlobalError({ type: 'validation', message: MSG.VALIDATION_FIX });
  }
}

const STATUS_LABELS = { FUNDING: 'در حال جذب سرمایه', REVIEW: 'در حال کارشناسی', COMPLETED: 'تکمیل‌شده' };
const VISIBILITY_LABELS = { PUBLIC: 'انتشار', PRIVATE: 'عدم انتشار', PUBLISHED: 'انتشار', UNPUBLISHED: 'عدم انتشار' };

function renderSuccess(resp) {
  clearErrors();
  successBannerEl.hidden = true;
  summaryCardWrap.hidden = true;
  if (form) form.hidden = true;
  const backDashboard = document.getElementById('btn-back-dashboard');
  if (backDashboard) backDashboard.hidden = !editMode;
  if (successPanelEl) {
    const titleEl = successPanelEl.querySelector('.success-panel-title');
    const textEl = successPanelEl.querySelector('.success-panel-text');
    if (editMode) {
      if (titleEl) titleEl.textContent = '✅ پروژه با موفقیت ویرایش شد';
      if (textEl) textEl.textContent = 'تغییرات شما ذخیره شد.';
    } else {
      if (titleEl) titleEl.textContent = '✅ پروژه شما در ویترین ایجاد شد';
      if (textEl) textEl.textContent = 'می‌توانید برای مشاهده به لینک زیر بروید:';
    }
    successPanelEl.hidden = false;
    successPanelEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function clearForm(keepOwner) {
  const savedPhone = keepOwner && !CONFIG.CLEAR_OWNER_ON_SUCCESS ? form.querySelector('#owner-phone')?.value : null;
  const savedName = keepOwner && !CONFIG.CLEAR_OWNER_ON_SUCCESS ? form.querySelector('#owner-full-name')?.value : null;

  if (form) {
    form.hidden = false;
    if (keepOwner) {
      form.reset();
      const fundedEl = form.querySelector('#project-funded-amount-toman');
      if (fundedEl) fundedEl.value = '۰';
      if (savedPhone != null) form.querySelector('#owner-phone').value = savedPhone;
      if (savedName != null) form.querySelector('#owner-full-name').value = savedName;
    }
  }

  clearErrors();
  successBannerEl.hidden = true;
  successPanelEl.hidden = true;
  summaryCardWrap.hidden = true;
  summaryCardWrap.innerHTML = '';

  if (imagePreviewWrap) {
    imagePreviewWrap.hidden = true;
    if (imagePreview) imagePreview.src = '';
  }
}

function resetToCreateNew() {
  submitState = STATE.IDLE;
  if (form) {
    form.reset();
    form.hidden = false;
    const fundedEl = form.querySelector('#project-funded-amount-toman');
    if (fundedEl) fundedEl.value = '۰';
  }
  clearErrors();
  successBannerEl.hidden = true;
  successPanelEl.hidden = true;
  summaryCardWrap.hidden = true;
  summaryCardWrap.innerHTML = '';
  if (imagePreviewWrap) {
    imagePreviewWrap.hidden = true;
    if (imagePreview) imagePreview.src = '';
  }
  if (imageInput) imageInput.value = '';
  setFormEnabled(true);
  setupGuaranteeCheckboxes();
  const reqRead = document.getElementById('required-amount-readable');
  if (reqRead) reqRead.hidden = true;
}

function setupImagePreview() {
  if (!imageInput || !imagePreviewWrap || !imagePreview) return;

  imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file || !CONFIG.IMAGE_ALLOWED_MIMES.includes(file.type)) {
      imagePreviewWrap.hidden = true;
      imagePreview.src = '';
      return;
    }
    const url = URL.createObjectURL(file);
    imagePreview.src = url;
    imagePreviewWrap.hidden = false;
    imagePreview.onload = () => URL.revokeObjectURL(url);
  });
}

function setupClearErrorsOnInput() {
  const inputs = form.querySelectorAll('input, select');
  inputs.forEach((input) => {
    input.addEventListener('input', clearFieldErrorForInput);
    input.addEventListener('change', clearFieldErrorForInput);
  });
}

function setupGuaranteeCheckboxes() {
  const container = document.getElementById('guarantee-checkboxes');
  const chipsEl = document.getElementById('guarantee-chips');
  // #region agent log
  _dbg({location:'admin-create-project.js:setupGuaranteeCheckboxes',message:'guarantee setup',data:{containerFound:!!container,chipsFound:!!chipsEl,existingCount:container?container.querySelectorAll('input[type="checkbox"][name="guarantee_type"]').length:-1},hypothesisId:'H2'});
  // #endregion
  if (!container) return;

  const existingCheckboxes = container.querySelectorAll('input[type="checkbox"][name="guarantee_type"]');
  if (existingCheckboxes.length === 0) {
    container.innerHTML = '';
    GUARANTEE_OPTIONS.forEach((opt) => {
      const id = 'guarantee-' + opt.replace(/\s+/g, '-');
      const label = document.createElement('label');
      label.htmlFor = id;
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = opt;
      cb.id = id;
      cb.name = 'guarantee_type';
      label.appendChild(cb);
      label.appendChild(document.createTextNode(opt));
      container.appendChild(label);
    });
  }

  function updateChips() {
    const checked = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map((c) => c.value);
    if (!chipsEl) return;
    if (checked.length === 0) {
      chipsEl.hidden = true;
      chipsEl.innerHTML = '';
      return;
    }
    chipsEl.hidden = false;
    chipsEl.innerHTML = checked.map((v) => `<span class="chip">${escapeHtml(v)}</span>`).join('');
  }

  container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.removeEventListener('change', cb._guaranteeChange);
    cb._guaranteeChange = () => {
      updateChips();
      clearFieldErrorForInput({ target: cb });
    };
    cb.addEventListener('change', cb._guaranteeChange);
  });
  updateChips();
  // #region agent log
  _dbg({location:'admin-create-project.js:setupGuaranteeCheckboxes:end',message:'guarantee checkboxes attached',data:{totalCheckboxes:container.querySelectorAll('input[type="checkbox"]').length},hypothesisId:'H2'});
  // #endregion
}

function prefillDefaultTitlePrefix() {
  if (editMode) return;
  const titleInput = document.getElementById('project-title');
  if (!titleInput) return;
  if (titleInput.value && titleInput.value.trim().length > 0) return;

  titleInput.value = TITLE_DEFAULT_PREFIX;
  const pos = titleInput.value.length;
  titleInput.setSelectionRange(pos, pos);
}

/** در حالت ایجاد، پیش‌عنوان را غیرقابل حذف می‌کند؛ کاربر فقط بعد از آن تایپ می‌کند. */
function setupLockedTitlePrefix() {
  if (editMode) return;
  const titleInput = document.getElementById('project-title');
  if (!titleInput) return;
  const prefix = TITLE_DEFAULT_PREFIX;
  const prefixLen = prefix.length;

  titleInput.addEventListener('input', function () {
    const val = titleInput.value;
    if (val.startsWith(prefix)) return;
    titleInput.value = prefix + val;
    const len = titleInput.value.length;
    titleInput.setSelectionRange(len, len);
  });

  titleInput.addEventListener('keydown', function (e) {
    const start = titleInput.selectionStart;
    const end = titleInput.selectionEnd;
    if (e.key === 'Backspace' && end <= prefixLen) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Delete' && start < prefixLen) {
      e.preventDefault();
      return;
    }
  });

  function clampSelection() {
    const start = titleInput.selectionStart;
    const end = titleInput.selectionEnd;
    if (start < prefixLen || end < prefixLen) {
      const newStart = Math.max(prefixLen, start);
      const newEnd = Math.max(prefixLen, end);
      titleInput.setSelectionRange(newStart, newEnd);
    }
  }
  titleInput.addEventListener('click', () => setTimeout(clampSelection, 0));
  titleInput.addEventListener('keyup', () => setTimeout(clampSelection, 0));

  titleInput.addEventListener('paste', function (e) {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData || {}).getData('text') || '';
    const trimmed = String(pasted).replace(/\s+/g, ' ').trim();
    let newVal = titleInput.value;
    const start = titleInput.selectionStart;
    const end = titleInput.selectionEnd;
    const before = newVal.slice(0, Math.max(prefixLen, start));
    const after = newVal.slice(end);
    newVal = before + trimmed + after;
    if (!newVal.startsWith(prefix)) {
      newVal = prefix + newVal;
    }
    titleInput.value = newVal;
    const pos = newVal.length;
    titleInput.setSelectionRange(pos, pos);
    setTimeout(clampSelection, 0);
  });
}

function setupAmountFormatting() {
  const requiredInput = document.getElementById('project-required-amount-toman');
  const fundedInput = document.getElementById('project-funded-amount-toman');
  const requiredReadable = document.getElementById('required-amount-readable');
  const requiredFormatted = document.getElementById('required-amount-formatted');
  const requiredWordsEl = document.getElementById('required-amount-words');
  const fundedReadable = document.getElementById('funded-amount-readable');
  const fundedFormatted = document.getElementById('funded-amount-formatted');
  const fundedWordsEl = document.getElementById('funded-amount-words');
  // #region agent log
  var _reqVal = requiredInput ? requiredInput.value : '';
  _dbg({location:'admin-create-project.js:setupAmountFormatting',message:'amount formatting',data:{requiredInputFound:!!requiredInput,requiredReadableFound:!!requiredReadable,requiredWordsElFound:!!requiredWordsEl,requiredValue:_reqVal,requiredValueLen:_reqVal.length},hypothesisId:'H3'});
  // #endregion

  function updateReadable(container, formattedEl, wordsEl, val) {
    if (!container || !wordsEl) return;
    const n = parseNumericInput(val);
    if (isNaN(n) || n < 0) {
      container.hidden = true;
      if (formattedEl) setText(formattedEl, '');
      setText(wordsEl, '');
      return;
    }
    container.hidden = false;
    const raw = normalizeDigits(String(val || ''));
    if (formattedEl) setText(formattedEl, raw ? toPersianDigits(formatAmountWithSeparators(raw)) + ' تومان' : (n === 0 ? '۰ تومان' : ''));
    const words = n === 0 ? 'صفر تومان' : numberToPersianWords(n);
    setText(wordsEl, words || '');
  }

  function digitsOnly(val) {
    return normalizeDigits(String(val || '')).replace(/\D/g, '');
  }

  function setupAmountInput(input, container, formattedEl, wordsEl) {
    if (!input) return;
    const sync = () => {
      const raw = digitsOnly(input.value);
      input.value = raw;
      updateReadable(container, formattedEl, wordsEl, raw);
    };
    input.addEventListener('input', sync);
    input.addEventListener('blur', sync);
  }

  if (requiredInput) {
    setupAmountInput(requiredInput, requiredReadable, requiredFormatted, requiredWordsEl);
    updateReadable(requiredReadable, requiredFormatted, requiredWordsEl, requiredInput.value || '');
    // #region agent log
    _dbg({location:'admin-create-project.js:setupAmountFormatting:afterRequired',message:'after required updateReadable',data:{requiredReadableHidden:requiredReadable?requiredReadable.hidden:null},hypothesisId:'H3'});
    // #endregion
  }
  if (fundedInput && fundedReadable) {
    updateReadable(fundedReadable, fundedFormatted, fundedWordsEl, fundedInput.value || '0');
  }
}

function clearFieldErrorForInput(e) {
  const input = e.target;
  if (!input || !input.id) return;
  input.classList.remove('is-invalid', 'error');
  const errorEl = document.getElementById(input.id + '-error');
  if (errorEl) setText(errorEl, '');
  if (input.closest('#guarantee-checkboxes')) {
    const container = document.getElementById('guarantee-checkboxes');
    const err = document.getElementById('project-guarantee-type-error');
    if (container) container.classList.remove('is-invalid', 'error');
    if (err) setText(err, '');
  }
}

function applyAppMode() {
  if (CONFIG.APP_MODE === 'SELF_SERVICE' && ownerSection) {
    ownerSection.hidden = true;
  } else if (ownerSection) {
    ownerSection.hidden = false;
  }
}

// ——— Submit handler ———

async function handleSubmit(e) {
  e.preventDefault();
  console.log('[handleSubmit] entered', { submitState, editMode });

  if (!form) {
    console.error('[handleSubmit] form element is null');
    showGlobalError({ type: 'system', message: 'فرم یافت نشد. لطفاً صفحه را مجدداً بارگذاری کنید.' });
    return;
  }
  if (submitState !== STATE.IDLE && submitState !== STATE.ERROR) {
    console.warn('[handleSubmit] blocked by submitState', submitState);
    return;
  }

  const createUrl = CONFIG.CREATE_URL;
  const uploadUrl = CONFIG.UPLOAD_URL;
  const attachUrl = CONFIG.ATTACH_COVER_URL;
  if (!createUrl || !uploadUrl || !attachUrl) {
    console.warn('[handleSubmit] CONFIG URLs missing or invalid', { createUrl: !!createUrl, uploadUrl: !!uploadUrl, attachUrl: !!attachUrl });
  }

  submitState = STATE.VALIDATING;
  setOverlayLoading(true, MSG.PROGRESS_VALIDATE);
  const model = collectFormData();
  const { isValid, errors } = await validateForm(model);

  if (!isValid) {
    submitState = STATE.ERROR;
    clearLoadingState();
    renderClientErrors(errors);
    scrollToFirstError(errors);
    return;
  }

  clearErrors();
  successBannerEl.hidden = true;
  lastSuccessfulProjectId = null;
  lastUploadResult = null;
  lastErrorStep = null;

  try {
    if (editMode && editProjectId) {
      // Edit: update then optionally upload new image
      submitState = STATE.CREATING;
      setOverlayLoading(true, 'در حال ذخیره تغییرات...');
      const { owner, project } = normalizePayload(model.owner, model.project);
      const updateRes = await callUpdateProject(editProjectId, { owner, project });
      if (updateRes.kind === 'validation') {
        lastErrorStep = MSG.STEP_CREATE;
        showError(MSG.VALIDATION_FIX, { stepName: 'بروزرسانی', technicalDetails: { url: CONFIG.UPDATE_URL, errors: updateRes.errors } });
        showFieldErrors(updateRes.errors);
        scrollToFirstError(updateRes.errors);
        return;
      }
      if (updateRes.kind === 'system') {
        lastErrorStep = MSG.STEP_CREATE;
        showError(updateRes.message || MSG.SYSTEM_ERROR, { stepName: 'بروزرسانی', requestId: updateRes.requestId, technicalDetails: { url: CONFIG.UPDATE_URL, raw: updateRes.raw } });
        return;
      }
      lastSuccessfulProjectId = editProjectId;
      const file = model.file || form.querySelector('#project-image')?.files?.[0] || null;
      if (file) {
        submitState = STATE.UPLOADING;
        setOverlayLoading(true, MSG.PROGRESS_UPLOAD);
        const visibility = publishStatusToBackend(model.project.visibility);
        const uploadResult = await requestUploadCover({ entityId: editProjectId, file, visibility });
        if (!uploadResult.success || !uploadResult.url) {
          lastErrorStep = MSG.STEP_UPLOAD;
          showError(MSG.CREATE_OK_UPLOAD_FAIL, { stepName: MSG.STEP_UPLOAD, projectId: editProjectId });
          return;
        }
        submitState = STATE.ATTACHING;
        setOverlayLoading(true, MSG.PROGRESS_ATTACH);
        const attachResult = await requestAttachCover({ entityId: editProjectId, imageUrl: uploadResult.url });
        if (!attachResult.success) {
          lastErrorStep = MSG.STEP_ATTACH;
          showError(MSG.UPLOAD_OK_ATTACH_FAIL, { stepName: MSG.STEP_ATTACH, projectId: editProjectId });
          return;
        }
      }
      submitState = STATE.DONE;
      lastErrorStep = null;
      clearLoadingState();
      renderSuccess({ ...model.project, id: editProjectId });
      // Auto-redirect to dashboard after 3 seconds in edit mode
      if (editMode) {
        setTimeout(() => {
          window.location.href = 'admin-dashboard.html';
        }, 3000);
      }
      submitState = STATE.IDLE;
      return;
    }

    // 1) Create
    console.log('[handleSubmit] before CREATE', CONFIG.CREATE_URL);
    submitState = STATE.CREATING;
    setOverlayLoading(true, MSG.PROGRESS_CREATE);
    const formData = buildCreateFormData(model.owner, model.project);
    const createRes = await callCreateProject(formData);
    console.log('[CREATE]', { projectId: createRes.data?.id, result: createRes });

    if (createRes.kind === 'validation') {
      lastErrorStep = MSG.STEP_CREATE;
      showError(MSG.VALIDATION_FIX, { stepName: MSG.STEP_CREATE, technicalDetails: { url: CONFIG.CREATE_URL, errors: createRes.errors } });
      showFieldErrors(createRes.errors);
      scrollToFirstError(createRes.errors);
      return;
    }

    if (createRes.kind === 'system') {
      lastErrorStep = MSG.STEP_CREATE;
      showError(createRes.message || MSG.SYSTEM_ERROR, {
        stepName: MSG.STEP_CREATE,
        requestId: createRes.requestId,
        technicalDetails: { url: CONFIG.CREATE_URL, raw: createRes.raw },
      });
      return;
    }

    const created = createRes.data;
    const projectId = created?.id ?? created?.opportunity_id ?? created?.project?.id ?? null;
    if (!projectId) {
      lastErrorStep = MSG.STEP_CREATE;
      showError(MSG.INVALID_RESPONSE, { stepName: MSG.STEP_CREATE, technicalDetails: { response: createRes } });
      return;
    }

    lastSuccessfulProjectId = projectId;
    const file = model.file || form.querySelector('#project-image')?.files?.[0] || null;
    console.log('[FILE]', file ? { name: file.name, size: file.size } : null);

    if (!file) {
      lastErrorStep = MSG.STEP_UPLOAD;
      showError('تصویر پروژه الزامی است.', { stepName: MSG.STEP_UPLOAD, projectId });
      return;
    }

    // 2) Upload
    console.log('[handleSubmit] before UPLOAD', CONFIG.UPLOAD_URL);
    submitState = STATE.UPLOADING;
    setOverlayLoading(true, MSG.PROGRESS_UPLOAD);
    const visibility = publishStatusToBackend(model.project.visibility);
    const uploadResult = await requestUploadCover({ entityId: projectId, file, visibility });
    console.log('[UPLOAD]', { projectId, success: uploadResult.success, url: uploadResult.url, result: uploadResult });

    if (!uploadResult.success || !uploadResult.url) {
      lastErrorStep = MSG.STEP_UPLOAD;
      showError(MSG.CREATE_OK_UPLOAD_FAIL, {
        stepName: MSG.STEP_UPLOAD,
        projectId,
        technicalDetails: { url: CONFIG.UPLOAD_URL, status: uploadResult.status, raw: (uploadResult.raw || '').slice(0, 500) },
      });
      return;
    }

    lastUploadResult = { url: uploadResult.url, key: uploadResult.key };

    // 3) Attach — ALWAYS call after successful upload
    console.log('[handleSubmit] before ATTACH', CONFIG.ATTACH_COVER_URL);
    submitState = STATE.ATTACHING;
    setOverlayLoading(true, MSG.PROGRESS_ATTACH);
    const attachPayload = { entity_id: projectId, image_url: uploadResult.url };
    console.log('[ATTACH payload]', attachPayload);

    const attachResult = await requestAttachCover({ entityId: projectId, imageUrl: uploadResult.url });
    console.log('[ATTACH]', { projectId, success: attachResult.success, result: attachResult });

    if (!attachResult.success) {
      lastErrorStep = MSG.STEP_ATTACH;
      const retryAttach = () => doRetryAttach(projectId, uploadResult.url);
      showError(MSG.UPLOAD_OK_ATTACH_FAIL, {
        stepName: MSG.STEP_ATTACH,
        projectId,
        technicalDetails: { url: CONFIG.ATTACH_COVER_URL, status: attachResult.status, raw: (attachResult.raw || '').slice(0, 500) },
        retryAttachCallback: retryAttach,
      });
      return;
    }

    // All steps succeeded
    submitState = STATE.DONE;
    lastErrorStep = null;
    clearLoadingState();
    const finalOpportunity = normalizeResponse(attachResult.json?.opportunity ?? attachResult.json ?? created);
    renderSuccess({ ...model.project, ...finalOpportunity });
    submitState = STATE.IDLE;
  } catch (err) {
    console.error('[SUBMIT]', err);
    lastErrorStep = submitState;
    showError(err.message || MSG.SUBMIT_ERROR, {
      stepName: lastErrorStep,
      projectId: lastSuccessfulProjectId,
      technicalDetails: { error: err.message, stack: err.stack },
    });
  }
}

/** Retry only attach-cover. No re-upload. Uses stored projectId and cleanUrl. */
async function doRetryAttach(projectId, cleanUrl) {
  if (submitState !== STATE.ERROR) return;
  if (!projectId || !cleanUrl) return;

  const model = collectFormData();
  submitState = STATE.ATTACHING;
  setOverlayLoading(true, MSG.PROGRESS_ATTACH);
  if (globalErrorEl) globalErrorEl.hidden = true;

  try {
    const attachResult = await requestAttachCover({ entityId: projectId, imageUrl: cleanUrl });
    console.log('[ATTACH retry]', { projectId, success: attachResult.success, result: attachResult });

    if (!attachResult.success) {
      lastErrorStep = MSG.STEP_ATTACH;
      const retryAttach = () => doRetryAttach(projectId, cleanUrl);
      showError(MSG.UPLOAD_OK_ATTACH_FAIL, {
        stepName: MSG.STEP_ATTACH,
        projectId,
        technicalDetails: { url: CONFIG.ATTACH_COVER_URL, status: attachResult.status, raw: (attachResult.raw || '').slice(0, 500) },
        retryAttachCallback: retryAttach,
      });
      return;
    }

    submitState = STATE.DONE;
    clearLoadingState();
    const created = { id: projectId, image_url: cleanUrl };
    const finalOpportunity = normalizeResponse(attachResult.json?.opportunity ?? attachResult.json ?? created);
    renderSuccess({ ...model.project, ...finalOpportunity });
    submitState = STATE.IDLE;
  } catch (err) {
    console.error('[ATTACH retry]', err);
    lastErrorStep = MSG.STEP_ATTACH;
    const retryAttach = () => doRetryAttach(projectId, cleanUrl);
    showError(err.message || MSG.SUBMIT_ERROR, {
      stepName: MSG.STEP_ATTACH,
      projectId,
      technicalDetails: { error: err.message },
      retryAttachCallback: retryAttach,
    });
  }
}

// ——— Init ———

// #region agent log
function _dbg(payload) {
  try {
    window.__debugLog = window.__debugLog || [];
    window.__debugLog.push(payload);
    fetch('http://127.0.0.1:7242/ingest/ce3493c5-1f95-4a86-a76a-4ad725b2e630',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,timestamp:Date.now()})}).catch(function(){});
  } catch (e) {}
}
// #endregion

function init() {
  // #region agent log
  try {
    var _form = document.getElementById('create-project-form');
    var _guar = document.getElementById('guarantee-checkboxes');
    _dbg({location:'admin-create-project.js:init',message:'init started',data:{readyState:document.readyState,formFound:!!_form,guaranteeContainerFound:!!_guar,guaranteeChildCount:_guar?_guar.children.length:-1},hypothesisId:'H1'});
  } catch (e) {
    _dbg({location:'admin-create-project.js:init',message:'init log error',data:{error:String(e.message)},hypothesisId:'H4'});
  }
  // #endregion
  setupGuaranteeCheckboxes();
  const { mode, id } = getEditParams();
  if (mode === 'edit' && id) {
    editMode = true;
    editProjectId = id;
    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) pageTitleEl.textContent = MSG.EDIT_TITLE;
    const backLink = document.getElementById('back-to-dashboard');
    if (backLink) backLink.hidden = false;
    if (submitBtn) submitBtn.textContent = MSG.BTN_UPDATE;
    const imageInputReq = document.getElementById('project-image');
    if (imageInputReq) imageInputReq.removeAttribute('required');
    const fundedInput = document.getElementById('project-funded-amount-toman');
    if (fundedInput) {
      fundedInput.disabled = false;
      fundedInput.removeAttribute('title');
    }
    setOverlayLoading(true, MSG.LOADING_EDIT);
    fetchProjectForEdit(id).then((project) => {
      setOverlayLoading(false, '');
      if (project) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          prefillForm(project);
          updatePublishAvailability();
        }, 100);
      } else {
        showGlobalError({ type: 'system', message: MSG.EDIT_LOAD_FAIL });
      }
    }).catch(() => {
      setOverlayLoading(false, '');
      showGlobalError({ type: 'system', message: MSG.EDIT_LOAD_FAIL });
    });
  }

  applyAppMode();
  setupImagePreview();
  setupClearErrorsOnInput();
  setupAmountFormatting();
  if (!editMode) {
    prefillDefaultTitlePrefix();
    setupLockedTitlePrefix();
  }

  const profitInput = document.getElementById('project-monthly-profit-percent');
  if (profitInput) {
    profitInput.addEventListener('blur', () => {
      formatProfitPercentInput(profitInput);
    });

    profitInput.addEventListener('input', (e) => {
      let val = normalizeDigits(e.target.value);
      val = val.replace(/[^0-9.]/g, '');
      const parts = val.split('.');
      if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
      }
      e.target.value = val;
    });
  }

  const btnCreateNew = document.getElementById('btn-create-new');
  if (btnCreateNew) btnCreateNew.addEventListener('click', resetToCreateNew);

  // #region agent log
  _dbg({location:'admin-create-project.js:init:formCheck',message:'form ref at init end',data:{formRefExists:!!form},hypothesisId:'H5'});
  // #endregion
  if (!form) {
    console.error('[init] form #create-project-form not found');
    showGlobalError({ type: 'system', message: 'فرم یافت نشد. لطفاً صفحه را مجدداً بارگذاری کنید.' });
  } else {
    form.addEventListener('submit', handleSubmit);
    form.addEventListener('input', debouncedUpdatePublishAvailability);
    form.addEventListener('change', debouncedUpdatePublishAvailability);
    const visibilitySelect = document.getElementById('project-visibility');
    if (visibilitySelect) {
      visibilitySelect.addEventListener('change', () => {
        if (visibilitySelect.value === PUBLISH_STATUS.PUBLISHED) updatePublishAvailability();
      });
    }
    form.addEventListener('reset', () => {
      clearForm(false);
      setTimeout(() => {
        const reqRead = document.getElementById('required-amount-readable');
        if (reqRead) reqRead.hidden = true;
        document.getElementById('guarantee-checkboxes')?.classList.remove('is-invalid', 'error');
        setText(document.getElementById('project-guarantee-type-error'), '');
        const chips = document.getElementById('guarantee-chips');
        if (chips) { chips.hidden = true; chips.innerHTML = ''; }
        updatePublishAvailability();
      }, 0);
    });
  }
  const createUrl = CONFIG.CREATE_URL;
  const uploadUrl = CONFIG.UPLOAD_URL;
  const attachUrl = CONFIG.ATTACH_COVER_URL;
  if (!createUrl || !uploadUrl || !attachUrl) {
    console.warn('[init] CONFIG CREATE_URL, UPLOAD_URL, or ATTACH_COVER_URL is empty or invalid', { createUrl: createUrl || '(empty)', uploadUrl: uploadUrl || '(empty)', attachUrl: attachUrl || '(empty)' });
  }

  updatePublishAvailability();
}

function initWrapper() {
  try {
    init();
  } catch (err) {
    // #region agent log
    _dbg({location:'admin-create-project.js:initWrapper',message:'init threw',data:{error:String(err&&err.message),stack:(err&&err.stack)?String(err.stack).slice(0,500):''},hypothesisId:'H4'});
    // #endregion
    throw err;
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWrapper);
} else {
  initWrapper();
}
