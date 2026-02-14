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
  UPLOAD_OK_ATTACH_FAIL: 'پروژه ایجاد شد اما اتصال تصویر انجام نشد.',
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

/** Publish status: backend values. UI labels: منتشر شود (PUBLIC), منتشر نشود (PRIVATE). */
const PUBLISH_STATUS = {
  PUBLISH: 'PUBLIC',
  DRAFT: 'PRIVATE',
};
const PUBLISH_STATUS_VALUES = [PUBLISH_STATUS.PUBLISH, PUBLISH_STATUS.DRAFT];

/** Map backend visibility to select value. For edit mode when pre-filling form. */
function publishStatusFromBackend(backendValue) {
  return PUBLISH_STATUS_VALUES.includes(backendValue) ? backendValue : PUBLISH_STATUS.DRAFT;
}

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
  const rawGuarantee = (form.querySelector('#project-guarantee-type')?.value || '').replace(/\s+/g, ' ').trim();
  const guarantee_type = sanitizeText(convertDigitsToLatin(rawGuarantee));

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
  const visibility = (form.querySelector('#project-visibility')?.value || PUBLISH_STATUS.DRAFT).trim();

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
    status: ['REVIEW', 'ACTIVE', 'COMPLETED'].includes(project.status) ? project.status : 'REVIEW',
    monthly_profit_percent: safeNumber(project.monthly_profit_percent),
    duration_months: Math.floor(safeNumber(project.duration_months, 1)),
    profit_payout_interval_days: Math.floor(safeNumber(project.profit_payout_interval_days, 1)),
    principal_payout_interval_days: Math.floor(safeNumber(project.principal_payout_interval_days, 1)),
    guarantee_type: String(project.guarantee_type || '').trim(),
    funded_amount_toman: Math.floor(safeNumber(project.funded_amount_toman, 0)),
    required_amount_toman: Math.floor(safeNumber(project.required_amount_toman)),
    visibility: PUBLISH_STATUS_VALUES.includes(project.visibility) ? project.visibility : PUBLISH_STATUS.DRAFT,
  };
  return { owner: o, project: p };
}

// ——— Validation (client-side) ———

const ALLOWED_STATUS = ['REVIEW', 'ACTIVE', 'COMPLETED'];

/**
 * Validates form data. Returns { isValid, errors }.
 * Async when file is present (image dimension check).
 */
async function validateForm(model) {
  const errors = [];
  const { owner, project, file } = model;

  if (CONFIG.APP_MODE === 'WITH_OWNER') {
    if (!owner.phone) errors.push({ field: 'owner_phone', message: 'شماره موبایل الزامی است.' });
    if (!owner.full_name) errors.push({ field: 'owner_full_name', message: 'نام و نام خانوادگی الزامی است.' });
  }

  const title = project.title || '';
  if (!title) errors.push({ field: 'project_title', message: 'عنوان الزامی است.' });
  else {
    if (title.length < 3 || title.length > 120) errors.push({ field: 'project_title', message: 'عنوان باید بین ۳ تا ۱۲۰ کاراکتر باشد.' });
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

  if (!project.guarantee_type || project.guarantee_type.length > 120) {
    errors.push({ field: 'project_guarantee_type', message: 'نوع ضمانت الزامی است (حداکثر ۱۲۰ کاراکتر).' });
  }

  const funded = project.funded_amount_toman;
  const required = project.required_amount_toman;
  const reqVal = validateNumberRange(required, CONFIG.REQUIRED_AMOUNT_MIN, CONFIG.REQUIRED_AMOUNT_MAX, { integer: true });
  if (!reqVal.valid) errors.push({ field: 'project_required_amount_toman', message: 'مبلغ مورد نیاز باید عدد صحیح و حداقل ۱۰۰٬۰۰۰ تومان باشد.' });
  if (funded > required) errors.push({ field: 'project_required_amount_toman', message: 'مبلغ تأمین‌شده نمی‌تواند بیشتر از مبلغ مورد نیاز باشد.' });

  if (!project.visibility || !PUBLISH_STATUS_VALUES.includes(project.visibility)) {
    errors.push({ field: 'project_visibility', message: 'وضعیت انتشار الزامی است.' });
  }

  if (file) {
    const imgResult = await validateImageFile(file);
    if (!imgResult.valid) errors.push({ field: 'project_image', message: imgResult.message });
  }

  return { isValid: errors.length === 0, errors };
}

function scrollToFirstError(errors) {
  if (!errors || errors.length === 0) return;
  const first = errors[0];
  const inputId = FIELD_PATH_TO_ID[first.field] || FIELD_IDS[first.field];
  if (inputId) {
    const el = document.getElementById(inputId);
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

/** Upload cover image. Returns { success: true, url, ok } or { success: false, message }. */
async function requestUploadCover({ entityId, file }) {
  const fd = new FormData();
  fd.append('entity_id', String(entityId || ''));
  fd.append('context', 'projects');
  fd.append('entity_type', 'opportunity');
  fd.append('file_type', 'cover');
  fd.append('visibility', 'PUBLIC');
  fd.append('file', file);
  try {
    const { ok, json } = await fetchWithTimeout(CONFIG.UPLOAD_URL, {
      method: 'POST',
      body: fd,
    });
    if (ok && json?.url) return { success: true, ok: true, url: json.url, key: json?.key };
    const msg = json?.message || json?.error || (typeof json?.error === 'object' && json.error?.message) || MSG.SYSTEM_ERROR;
    return { success: false, ok: false, message: typeof msg === 'string' ? msg : MSG.SYSTEM_ERROR };
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, ok: false, message: MSG.REQUEST_TIMEOUT };
    return { success: false, ok: false, message: err.message || MSG.REQUEST_FAILED };
  }
}

/** Attach cover URL to project. Backend expects entity_id and image_url. */
async function requestAttachCover({ entityId, imageUrl }) {
  const payload = { entity_id: String(entityId || ''), image_url: String(imageUrl || '') };
  try {
    const { ok, json } = await fetchWithTimeout(CONFIG.ATTACH_COVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (ok) return { success: true, ok: true, json };
    const msg = json?.message || json?.error || (typeof json?.error === 'object' && json.error?.message) || MSG.SYSTEM_ERROR;
    return { success: false, ok: false, message: typeof msg === 'string' ? msg : MSG.SYSTEM_ERROR };
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
    globalErrorEl.innerHTML = '';
  }
}

function showFieldErrors(errors) {
  clearErrors();
  if (!errors || errors.length === 0) return;

  errors.forEach((item) => {
    const field = item.field;
    const message = item.message || '';
    const inputId = FIELD_PATH_TO_ID[field] || FIELD_IDS[field];
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
  const { type, message, requestId, clearFields } = opts || {};
  if (!globalErrorEl) return;
  if (!message) {
    globalErrorEl.hidden = true;
    globalErrorEl.innerHTML = '';
    return;
  }
  if (clearFields) clearFieldErrorsOnly();

  const msgSpan = document.createElement('span');
  msgSpan.className = 'alert-message';
  msgSpan.textContent = message;

  const container = document.createElement('div');
  container.className = 'alert-content';
  container.appendChild(msgSpan);

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
        setTimeout(() => {
          copyBtn.textContent = MSG.COPY;
          copyBtn.disabled = false;
        }, 2000);
      });
    });
    reqRow.appendChild(reqLabel);
    reqRow.appendChild(reqVal);
    reqRow.appendChild(copyBtn);
    container.appendChild(reqRow);
  }

  globalErrorEl.innerHTML = '';
  globalErrorEl.appendChild(container);
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
  if (form) {
    form.classList.toggle('is-loading', isOn);
    form.setAttribute('aria-busy', String(isOn));
  }
  if (submitBtn) {
    submitBtn.disabled = isOn;
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
  setOverlayLoading(false);
  setLoadingState(false, '');
}

/** Centralized error display: message, scroll to top, remove loading. Keeps form data. */
function showError(message, opts) {
  clearLoadingState();
  const { requestId } = opts || {};
  showGlobalError({
    type: 'system',
    message: message || MSG.SUBMIT_ERROR,
    requestId: requestId || null,
    clearFields: false,
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

function clearFieldErrorForInput(e) {
  const input = e.target;
  if (!input || !input.id) return;
  input.classList.remove('is-invalid', 'error');
  const errorEl = document.getElementById(input.id + '-error');
  if (errorEl) setText(errorEl, '');
}

function applyAppMode() {
  if (CONFIG.APP_MODE === 'SELF_SERVICE' && ownerSection) {
    ownerSection.hidden = true;
  } else if (ownerSection) {
    ownerSection.hidden = false;
  }
}

// ——— Submit handler ———

let isSubmitting = false;

async function handleSubmit(e) {
  e.preventDefault();
  if (isSubmitting) return;
  isSubmitting = true;

  setOverlayLoading(true, MSG.LOADING_OVERLAY);
  const model = collectFormData();
  const { isValid, errors } = await validateForm(model);

  if (!isValid) {
    clearLoadingState();
    renderClientErrors(errors);
    scrollToFirstError(errors);
    isSubmitting = false;
    return;
  }

  clearErrors();
  successBannerEl.hidden = true;

  try {
    // 1) Create API
    const formData = buildCreateFormData(model.owner, model.project);
    const createRes = await callCreateProject(formData);
    console.log('[CREATE]', createRes);

    if (createRes.kind === 'validation') {
      showError(MSG.VALIDATION_FIX);
      showFieldErrors(createRes.errors);
      scrollToFirstError(createRes.errors);
      return;
    }

    if (createRes.kind === 'system') {
      showError(createRes.message || MSG.SYSTEM_ERROR, { requestId: createRes.requestId });
      return;
    }

    const created = createRes.data;
    const projectId = created?.id ?? created?.opportunity_id ?? created?.project?.id ?? null;
    if (!projectId) {
      showError(MSG.INVALID_RESPONSE);
      return;
    }

    const file = model.file || form.querySelector('#project-image')?.files?.[0] || null;
    console.log('[FILE]', file ? { name: file.name, size: file.size } : null);

    // 2) Upload + 3) Attach cover — ALWAYS call attach after successful upload
    let finalOpportunity = created;
    if (file) {
      const uploadResult = await requestUploadCover({ entityId: projectId, file });
      console.log('[UPLOAD]', uploadResult);

      if (!uploadResult.success || !uploadResult.url) {
        showError(`${MSG.CREATE_OK_UPLOAD_FAIL} (شناسه پروژه: ${projectId})`);
        return;
      }

      const attachPayload = { entity_id: projectId, image_url: uploadResult.url };
      console.log('[ATTACH payload]', attachPayload);

      const attachResult = await requestAttachCover({ entityId: projectId, imageUrl: uploadResult.url });
      console.log('[ATTACH]', attachResult);

      if (!attachResult.success) {
        showError(`${MSG.UPLOAD_OK_ATTACH_FAIL} (شناسه پروژه: ${projectId})`);
        return;
      }

      finalOpportunity = normalizeResponse(attachResult.json?.opportunity ?? attachResult.json ?? created);
    }

    // All steps succeeded
    clearLoadingState();
    renderSuccess({ ...model.project, ...finalOpportunity });
    clearForm(true);
    if (imageInput) imageInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error(err);
    showError(err.message || MSG.SUBMIT_ERROR);
  } finally {
    clearLoadingState();
    isSubmitting = false;
  }
}

// ——— Init ———

function init() {
  applyAppMode();
  setupImagePreview();
  setupClearErrorsOnInput();

  if (form) {
    form.addEventListener('submit', handleSubmit);
    form.addEventListener('reset', () => clearForm(false));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
