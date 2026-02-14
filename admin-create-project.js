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
  FILE_MAX_BYTES: 2 * 1024 * 1024, // 2MB
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
  PROGRESS_CREATE: 'در حال ایجاد پروژه...',
  PROGRESS_UPLOAD: 'در حال آپلود تصویر...',
  PROGRESS_ATTACH: 'در حال ثبت تصویر...',
  CREATE_OK_UPLOAD_FAIL: 'پروژه ایجاد شد اما آپلود تصویر انجام نشد. لطفاً دوباره تلاش کنید.',
  UPLOAD_OK_ATTACH_FAIL: 'آپلود انجام شد اما ثبت تصویر روی پروژه انجام نشد. لطفاً دوباره تلاش کنید.',
};

// Persian digits for display
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function normalizeStatus(raw) {
  const s = (raw || '').toString().toUpperCase();
  if (s === 'ACTIVE') return 'FUNDING';
  if (['FUNDING', 'REVIEW', 'COMPLETED'].indexOf(s) !== -1) return s;
  return 'FUNDING';
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

// ——— Utilities ———

function toLatinDigits(str) {
  if (str == null) return '';
  const map = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  return String(str).replace(/[۰-۹٠-٩]/g, (c) => map[c] || c);
}

function parseNumericInput(str) {
  if (str == null || String(str).trim() === '') return NaN;
  const s = toLatinDigits(String(str).trim()).replace(/,/g, '');
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

// ——— Data collection ———

function collectFormData() {
  const owner = {
    phone: toLatinDigits(form.querySelector('#owner-phone')?.value || '').trim(),
    full_name: (form.querySelector('#owner-full-name')?.value || '').trim(),
  };

  const fundedRaw = form.querySelector('#project-funded-amount-toman')?.value;
  const funded = parseNumericInput(fundedRaw);
  const fundedNum = !isNaN(funded) ? funded : 0;

  const durRaw = parseNumericInput(form.querySelector('#project-duration-months')?.value);
  const reqRaw = parseNumericInput(form.querySelector('#project-required-amount-toman')?.value);
  const project = {
    title: (form.querySelector('#project-title')?.value || '').trim(),
    status: (form.querySelector('#project-status')?.value || 'REVIEW').trim(),
    monthly_profit_percent: parseNumericInput(form.querySelector('#project-monthly-profit-percent')?.value),
    duration_months: Number.isInteger(durRaw) ? durRaw : (isNaN(durRaw) ? NaN : Math.floor(durRaw)),
    profit_payout_interval_days: parseNumericInput(form.querySelector('#project-profit-payout-interval-days')?.value),
    principal_payout_interval_days: parseNumericInput(form.querySelector('#project-principal-payout-interval-days')?.value),
    guarantee_type: (form.querySelector('#project-guarantee-type')?.value || '').trim(),
    funded_amount_toman: fundedNum,
    required_amount_toman: Number.isInteger(reqRaw) ? reqRaw : (isNaN(reqRaw) ? NaN : Math.floor(reqRaw)),
    visibility: (form.querySelector('#project-visibility')?.value || 'PRIVATE').trim(),
  };

  const fileInput = form.querySelector('#project-image');
  const file = fileInput?.files?.[0] || null;

  return { owner, project, file };
}

// ——— Validation (client-side) ———

function validateForm(model) {
  const errors = [];
  const { owner, project, file } = model;

  if (CONFIG.APP_MODE === 'WITH_OWNER') {
    if (!owner.phone) errors.push({ field: 'owner_phone', message: 'شماره موبایل الزامی است.' });
    if (!owner.full_name) errors.push({ field: 'owner_full_name', message: 'نام و نام خانوادگی الزامی است.' });
  }

  const titleLen = (project.title || '').length;
  if (!project.title) errors.push({ field: 'project_title', message: 'عنوان الزامی است.' });
  else if (titleLen < 3 || titleLen > 120) errors.push({ field: 'project_title', message: 'عنوان باید بین ۳ تا ۱۲۰ کاراکتر باشد.' });
  if (!project.status) errors.push({ field: 'project_status', message: 'وضعیت الزامی است.' });
  const mp = project.monthly_profit_percent;
  if (mp == null || isNaN(mp) || mp < 1 || mp > 100) {
    errors.push({ field: 'project_monthly_profit_percent', message: 'سود ماهانه باید بین ۱ تا ۱۰۰ درصد باشد.' });
  }
  const dm = project.duration_months;
  if (dm == null || isNaN(dm) || dm < 1 || dm > 120 || !Number.isInteger(dm)) {
    errors.push({ field: 'project_duration_months', message: 'مدت باید عدد صحیح و بین ۱ تا ۱۲۰ ماه باشد.' });
  }
  const pp = project.profit_payout_interval_days;
  if (pp == null || isNaN(pp) || pp < 1) {
    errors.push({ field: 'project_profit_payout_interval_days', message: 'فاصله پرداخت سود الزامی است.' });
  }
  const pr = project.principal_payout_interval_days;
  if (pr == null || isNaN(pr) || pr < 1) {
    errors.push({ field: 'project_principal_payout_interval_days', message: 'فاصله پرداخت اصل سرمایه الزامی است.' });
  }
  if (!project.guarantee_type) errors.push({ field: 'project_guarantee_type', message: 'نوع ضمانت الزامی است.' });
  const req = project.required_amount_toman;
  if (req == null || isNaN(req) || req < 1 || !Number.isInteger(req)) {
    errors.push({ field: 'project_required_amount_toman', message: 'مبلغ مورد نیاز باید عدد صحیح و بیشتر از صفر باشد.' });
  }
  if (!project.visibility) errors.push({ field: 'project_visibility', message: 'نمایش الزامی است.' });

  if (file) {
    if (!file.type.startsWith('image/')) {
      errors.push({ field: 'project_image', message: 'فایل باید تصویر باشد.' });
    }
    if (file.size > CONFIG.FILE_MAX_BYTES) {
      errors.push({ field: 'project_image', message: `حداکثر حجم فایل ${CONFIG.FILE_MAX_BYTES / 1024 / 1024} مگابایت است.` });
    }
  }

  return errors;
}

// ——— FormData builder ———

/** FormData for create endpoint (owner + project only; file sent separately via upload). */
function buildCreateFormData(owner, project) {
  const fd = new FormData();
  fd.append('owner', JSON.stringify(owner));
  fd.append('project', JSON.stringify(project));
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

/** Upload cover image. Returns { success: true, url } or { success: false, message }. */
async function requestUploadCover({ opportunityId, file }) {
  const fd = new FormData();
  fd.append('entity_id', opportunityId);
  fd.append('context', 'projects');
  fd.append('entity_type', 'opportunity');
  fd.append('file_type', 'cover');
  fd.append('visibility', 'PUBLIC');
  fd.append('file', file);
  try {
    const { ok, status, json } = await fetchWithTimeout(CONFIG.UPLOAD_URL, {
      method: 'POST',
      body: fd,
    });
    if (ok && json?.url) return { success: true, url: json.url };
    const msg = json?.message || json?.error || (typeof json?.error === 'object' && json.error?.message) || MSG.SYSTEM_ERROR;
    return { success: false, message: typeof msg === 'string' ? msg : MSG.SYSTEM_ERROR };
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, message: MSG.REQUEST_TIMEOUT };
    return { success: false, message: err.message || MSG.REQUEST_FAILED };
  }
}

/** Attach cover URL to opportunity. Returns { success: true, opportunity } or { success: false, message }. */
async function requestAttachCover({ opportunityId, imageUrl }) {
  try {
    const oid = Number(opportunityId) || opportunityId;
    const { ok, json } = await fetchWithTimeout(CONFIG.ATTACH_COVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunity_id: oid, image_url: imageUrl }),
    });
    if (ok && json?.opportunity) return { success: true, opportunity: json.opportunity };
    const msg = json?.message || json?.error || (typeof json?.error === 'object' && json.error?.message) || MSG.SYSTEM_ERROR;
    return { success: false, message: typeof msg === 'string' ? msg : MSG.SYSTEM_ERROR };
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, message: MSG.REQUEST_TIMEOUT };
    return { success: false, message: err.message || MSG.REQUEST_FAILED };
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
  setText(successBannerEl, `پروژه با موفقیت ایجاد شد. شناسه: ${escapeHtml(resp.id)}`);

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
    if (!file || !file.type.startsWith('image/')) {
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

async function handleSubmit(e) {
  e.preventDefault();

  const model = collectFormData();
  const clientErrors = validateForm(model);

  if (clientErrors.length > 0) {
    renderClientErrors(clientErrors);
    return;
  }

  clearErrors();
  successBannerEl.hidden = true;
  setLoadingState(true, MSG.PROGRESS_CREATE);

  try {
    const formData = buildCreateFormData(model.owner, model.project);
    const result = await callCreateProject(formData);

    if (result.kind === 'validation') {
      setLoadingState(false, '');
      showFieldErrors(result.errors);
      showGlobalError({ type: 'validation', message: MSG.VALIDATION_FIX });
      return;
    }

    if (result.kind === 'system') {
      setLoadingState(false, '');
      showGlobalError({
        type: 'system',
        message: result.message || MSG.SYSTEM_ERROR,
        requestId: result.requestId || null,
        clearFields: true,
      });
      return;
    }

    const created = result.data;
    const opportunityId = created?.id;
    if (!opportunityId) {
      setLoadingState(false, '');
      showGlobalError({ type: 'system', message: MSG.INVALID_RESPONSE, clearFields: true });
      return;
    }

    if (!model.file) {
      setLoadingState(false, '');
      renderSuccess({ ...model.project, ...created });
      clearForm(true);
      return;
    }

    setLoadingState(true, MSG.PROGRESS_UPLOAD);
    const uploadResult = await requestUploadCover({ opportunityId, file: model.file });

    if (!uploadResult.success) {
      setLoadingState(false, '');
      const msgWithId = `${MSG.CREATE_OK_UPLOAD_FAIL} (شناسه پروژه: ${opportunityId})`;
      showGlobalError({ type: 'system', message: msgWithId, clearFields: true });
      return;
    }

    setLoadingState(true, MSG.PROGRESS_ATTACH);
    const attachResult = await requestAttachCover({ opportunityId, imageUrl: uploadResult.url });

    setLoadingState(false, '');

    if (!attachResult.success) {
      const attachFailMsg = `${MSG.UPLOAD_OK_ATTACH_FAIL} (شناسه پروژه: ${opportunityId})`;
      showGlobalError({ type: 'system', message: attachFailMsg, clearFields: true });
      return;
    }

    const finalOpportunity = normalizeResponse(attachResult.opportunity || created);
    renderSuccess({ ...model.project, ...finalOpportunity });
    clearForm(true);
  } catch (err) {
    setLoadingState(false, '');
    showGlobalError({
      type: 'system',
      message: err.message || MSG.REQUEST_FAILED,
      clearFields: true,
    });
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
