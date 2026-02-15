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
const TITLE_DEFAULT_PREFIX = 'تأمین مالی برای ';

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
    else {
      const strictTitle = (project.visibility === PUBLISH_STATUS.PUBLISHED || project.status === 'FUNDING');
      if (strictTitle && !titleHasPrefix(title)) {
        errors.push({ field: 'project_title', message: 'برای انتشار، عنوان باید با «تأمین مالی برای» یا «تأمین مالی جهت» آغاز شود.' });
      }
    }
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
    errors.push({ field: 'project_image', message: 'تصویر پروژه الزامی است.' });
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
    } catch {
      return {
        kind: 'system',
        message: MSG.INVALID_RESPONSE,
        requestId: null,
        raw: bodyText,
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
    const msg = data?.message || data?.error || (typeof data?.error === 'object' && data.error?.message) || MSG.SYSTEM_ERROR;
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
    if (ok) return { success: true, ok: true, json, status, raw: text };
    const msg = json?.message || json?.error || (typeof json?.error === 'object' && json.error?.message) || MSG.SYSTEM_ERROR;
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
const VISIBILITY_LABELS = { PUBLIC: 'منتشر شده', PRIVATE: 'منتشر نشده', PUBLISHED: 'منتشر شده', UNPUBLISHED: 'منتشر نشده' };

function renderSuccess(resp) {
  clearErrors();
  successBannerEl.hidden = false;
  const idPart = resp?.id ? ` شناسه: ${escapeHtml(resp.id)}` : '';
  setText(successBannerEl, MSG.SUCCESS_MESSAGE + idPart);
  setTimeout(() => { successBannerEl.hidden = true; }, 5000);

  const imgUrl = resp.image_url ? toPublicImageUrl(resp.image_url) : '';

  const card = document.createElement('div');
  card.className = 'summary-card';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'summary-card-img-wrap';
  if (imgUrl) {
    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = '';
    img.onerror = () => { imgWrap.textContent = 'بدون تصویر'; };
    imgWrap.appendChild(img);
  } else {
    imgWrap.textContent = 'بدون تصویر';
  }
  card.appendChild(imgWrap);

  const statusVal = resp.status ? (STATUS_LABELS[normalizeStatus(resp.status)] || resp.status) : '—';
  const visibilityVal = resp.visibility ? (VISIBILITY_LABELS[resp.visibility] || resp.visibility) : '—';
  const durationVal = (resp.duration_months ?? resp.durationMonths) != null
    ? toPersianDigits(resp.duration_months ?? resp.durationMonths) + ' ماه'
    : '—';
  const profitVal = (resp.monthly_profit_percent ?? resp.monthlyProfitPercent) != null
    ? toPersianDigits(resp.monthly_profit_percent ?? resp.monthlyProfitPercent) + '٪'
    : '—';

  const body = document.createElement('div');
  body.className = 'summary-card-body';
  body.innerHTML = `
    <h3 class="summary-card-title">${escapeHtml(resp.title || '—')}</h3>
    <div class="summary-card-meta">
      <span class="key">شناسه</span><span class="val">${escapeHtml(resp.id)}</span>
      <span class="key">وضعیت</span><span class="val">${escapeHtml(statusVal)}</span>
      <span class="key">وضعیت انتشار</span><span class="val">${escapeHtml(visibilityVal)}</span>
      <span class="key">نوع ضمانت</span><span class="val">${escapeHtml(resp.guarantee_type || '—')}</span>
      <span class="key">سود ماهانه</span><span class="val">${escapeHtml(profitVal)}</span>
      <span class="key">مدت</span><span class="val">${escapeHtml(durationVal)}</span>
      <span class="key">مبلغ مورد نیاز</span><span class="val">${escapeHtml(formatToman(resp.required_amount_toman ?? resp.requiredAmountToman))}</span>
    </div>
  `;
  card.appendChild(body);

  summaryCardWrap.innerHTML = '';
  summaryCardWrap.appendChild(card);
  summaryCardWrap.hidden = false;

  summaryCardWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearForm(keepOwner) {
  const savedPhone = keepOwner && !CONFIG.CLEAR_OWNER_ON_SUCCESS ? form.querySelector('#owner-phone')?.value : null;
  const savedName = keepOwner && !CONFIG.CLEAR_OWNER_ON_SUCCESS ? form.querySelector('#owner-full-name')?.value : null;

  if (keepOwner) {
    form.reset();
    const fundedEl = form.querySelector('#project-funded-amount-toman');
    if (fundedEl) fundedEl.value = '۰';
    if (savedPhone != null) form.querySelector('#owner-phone').value = savedPhone;
    if (savedName != null) form.querySelector('#owner-full-name').value = savedName;
  }

  clearErrors();
  successBannerEl.hidden = true;
  summaryCardWrap.hidden = true;
  summaryCardWrap.innerHTML = '';

  if (imagePreviewWrap) {
    imagePreviewWrap.hidden = true;
    if (imagePreview) imagePreview.src = '';
  }
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
  if (!container) return;

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

  function updateChips() {
    const checked = Array.from(container.querySelectorAll('input:checked')).map((c) => c.value);
    if (!chipsEl) return;
    if (checked.length === 0) {
      chipsEl.hidden = true;
      chipsEl.innerHTML = '';
      return;
    }
    chipsEl.hidden = false;
    chipsEl.innerHTML = checked.map((v) => `<span class="chip">${escapeHtml(v)}</span>`).join('');
  }

  container.querySelectorAll('input').forEach((cb) => {
    cb.addEventListener('change', () => {
      updateChips();
      clearFieldErrorForInput({ target: cb });
    });
  });
  updateChips();
}

function setupTitleHelper() {
  const titleInput = document.getElementById('project-title');
  const feedbackEl = document.getElementById('title-feedback');
  const applyBtn = document.getElementById('title-apply-btn');
  const applyTooltipBtn = document.getElementById('title-apply-tooltip-btn');
  const infoIcon = document.getElementById('title-info-icon');
  const tooltip = document.getElementById('title-tooltip');

  function updateTitleFeedback() {
    if (!feedbackEl || !titleInput) return;
    const val = titleInput.value.trim();
    if (!val) {
      feedbackEl.textContent = '';
      feedbackEl.className = 'title-feedback-inline';
      return;
    }
    if (titleHasPrefix(val)) {
      feedbackEl.textContent = '✓ عنوان مطابق الگو است.';
      feedbackEl.className = 'title-feedback-inline is-ok';
    } else {
      feedbackEl.textContent = '⚠ عنوان باید با «تأمین مالی برای» یا «تأمین مالی جهت» آغاز شود.';
      feedbackEl.className = 'title-feedback-inline is-warning';
    }
  }

  function applyTitle() {
    if (titleInput) {
      titleInput.value = applyTitlePrefix(titleInput.value);
      updateTitleFeedback();
      titleInput.focus();
    }
  }

  if (titleInput) {
    titleInput.addEventListener('input', updateTitleFeedback);
    titleInput.addEventListener('blur', updateTitleFeedback);
  }
  if (applyBtn) applyBtn.addEventListener('click', applyTitle);
  if (applyTooltipBtn) applyTooltipBtn.addEventListener('click', applyTitle);

  if (infoIcon && tooltip) {
    const showTooltip = () => { tooltip.hidden = false; };
    const hideTooltip = () => { tooltip.hidden = true; };
    infoIcon.addEventListener('mouseenter', showTooltip);
    infoIcon.addEventListener('mouseleave', hideTooltip);
    infoIcon.addEventListener('focus', showTooltip);
    infoIcon.addEventListener('blur', hideTooltip);
    infoIcon.addEventListener('click', (e) => {
      e.preventDefault();
      tooltip.hidden = !tooltip.hidden;
    });
    tooltip.addEventListener('mouseenter', showTooltip);
    tooltip.addEventListener('mouseleave', hideTooltip);
  }

  updateTitleFeedback();
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

  function updateReadable(container, formattedEl, wordsEl, val) {
    if (!container || !formattedEl || !wordsEl) return;
    const n = parseNumericInput(val);
    if (isNaN(n) || n <= 0) {
      container.hidden = true;
      setText(formattedEl, '');
      setText(wordsEl, '');
      return;
    }
    container.hidden = false;
    const raw = normalizeDigits(String(val || ''));
    setText(formattedEl, raw ? toPersianDigits(formatAmountWithSeparators(raw)) + ' تومان' : '');
    setText(wordsEl, numberToPersianWords(n));
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
  }
  if (fundedInput && fundedReadable) {
    updateReadable(fundedReadable, fundedFormatted, fundedWordsEl, '0');
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
  if (submitState !== STATE.IDLE && submitState !== STATE.ERROR) return;

  submitState = STATE.VALIDATING;
  setOverlayLoading(true, MSG.PROGRESS_VALIDATE);
  const titleEl = form.querySelector('#project-title');
  if (titleEl && !titleHasPrefix(titleEl.value)) {
    titleEl.value = applyTitlePrefix(titleEl.value);
  }
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
    // 1) Create
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
    clearForm(true);
    if (imageInput) imageInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    clearForm(true);
    if (imageInput) imageInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

function init() {
  applyAppMode();
  setupImagePreview();
  setupClearErrorsOnInput();
  setupTitleHelper();
  setupAmountFormatting();

  setupGuaranteeCheckboxes();

  if (form) {
    form.addEventListener('submit', handleSubmit);
    form.addEventListener('reset', () => {
      clearForm(false);
      setTimeout(() => {
        const fb = document.getElementById('title-feedback');
        if (fb) { fb.className = 'title-feedback-inline'; setText(fb, ''); }
        const reqRead = document.getElementById('required-amount-readable');
        if (reqRead) reqRead.hidden = true;
        document.getElementById('guarantee-checkboxes')?.classList.remove('is-invalid', 'error');
        setText(document.getElementById('project-guarantee-type-error'), '');
        const chips = document.getElementById('guarantee-chips');
        if (chips) { chips.hidden = true; chips.innerHTML = ''; }
      }, 0);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
