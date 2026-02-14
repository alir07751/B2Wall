/**
 * Create Project — Vanilla JS
 * Role-agnostic: قابل استفاده برای مدیریت یا سرویس خودخدمت.
 * در حالت SELF_SERVICE بخش مالک مخفی و از نشست گرفته می‌شود.
 */

// ——— Config ———
const CONFIG = {
  APP_MODE: 'WITH_OWNER', // or 'SELF_SERVICE'
  N8N_BASE: 'https://n8nb2wall.darkube.app',
  get WEBHOOK_URL() { return `${this.N8N_BASE}/webhook/create`; },
  FILE_MAX_BYTES: 2 * 1024 * 1024, // 2MB
  CLEAR_OWNER_ON_SUCCESS: false,
  IMAGE_BASE: 'https://b2wall.storage.c2.liara.space/',
};

// Persian digits for display
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

// ——— DOM refs ———
const form = document.getElementById('create-project-form');
const submitBtn = document.getElementById('submit-btn');
const topErrorsEl = document.getElementById('top-errors');
const successBannerEl = document.getElementById('success-banner');
const summaryCardWrap = document.getElementById('summary-card');
const ownerSection = document.getElementById('owner-section');
const imageInput = document.getElementById('project-image');
const imagePreviewWrap = document.getElementById('image-preview-wrap');
const imagePreview = document.getElementById('image-preview');

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

/** Convert Persian/Arabic digits to Latin for parsing. */
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

/** Parse numeric input (Persian/English digits) to number. */
function parseNumericInput(str) {
  if (str == null || String(str).trim() === '') return NaN;
  const s = toLatinDigits(String(str).trim()).replace(/,/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}

/** Escape text for safe display (XSS prevention). */
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

/** Format number with Persian digits for display. */
function toPersianDigits(n) {
  if (n == null || n === '') return '—';
  return String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[+d]);
}

/** Format toman for display. */
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

  const project = {
    title: (form.querySelector('#project-title')?.value || '').trim(),
    status: (form.querySelector('#project-status')?.value || 'REVIEW').trim(),
    monthly_profit_percent: parseNumericInput(form.querySelector('#project-monthly-profit-percent')?.value),
    duration_months: parseNumericInput(form.querySelector('#project-duration-months')?.value),
    profit_payout_interval_days: parseNumericInput(form.querySelector('#project-profit-payout-interval-days')?.value),
    principal_payout_interval_days: parseNumericInput(form.querySelector('#project-principal-payout-interval-days')?.value),
    guarantee_type: (form.querySelector('#project-guarantee-type')?.value || '').trim(),
    funded_amount_toman: fundedNum,
    required_amount_toman: parseNumericInput(form.querySelector('#project-required-amount-toman')?.value),
    visibility: (form.querySelector('#project-visibility')?.value || 'PRIVATE').trim(),
  };

  const fileInput = form.querySelector('#project-image');
  const file = fileInput?.files?.[0] || null;

  return { owner, project, file };
}

// ——— Validation ———

function validateForm(model) {
  const errors = [];
  const { owner, project, file } = model;

  if (CONFIG.APP_MODE === 'WITH_OWNER') {
    if (!owner.phone) errors.push({ field: 'owner_phone', message: 'شماره موبایل الزامی است.' });
    if (!owner.full_name) errors.push({ field: 'owner_full_name', message: 'نام و نام خانوادگی الزامی است.' });
  }

  if (!project.title) errors.push({ field: 'project_title', message: 'عنوان الزامی است.' });
  if (!project.status) errors.push({ field: 'project_status', message: 'وضعیت الزامی است.' });
  const mp = project.monthly_profit_percent;
  if (mp == null || isNaN(mp) || mp < 0 || mp > 1000) {
    errors.push({ field: 'project_monthly_profit_percent', message: 'سود ماهانه باید بین ۰ تا ۱۰۰۰ باشد.' });
  }
  const dm = project.duration_months;
  if (dm == null || isNaN(dm) || dm < 1 || dm > 120) {
    errors.push({ field: 'project_duration_months', message: 'مدت باید بین ۱ تا ۱۲۰ ماه باشد.' });
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
  if (req == null || isNaN(req) || req < 0) {
    errors.push({ field: 'project_required_amount_toman', message: 'مبلغ مورد نیاز الزامی است.' });
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

function buildFormData(owner, project, file) {
  const fd = new FormData();
  fd.append('owner', JSON.stringify(owner));
  fd.append('project', JSON.stringify(project));
  if (file) fd.append('file', file);
  return fd;
}

// ——— API ———

function normalizeResponse(resp) {
  if (!resp) return { id: null, image_url: '' };
  const id = resp.id ?? resp.project_id ?? null;
  const imageUrl = resp.image_url ?? resp.imageUrl ?? '';
  return { ...resp, id, image_url: imageUrl };
}

async function submitCreateProject(formData) {
  const res = await fetch(CONFIG.WEBHOOK_URL, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let msg = `خطای HTTP ${res.status}`;
    try {
      const body = await res.text();
      const parsed = JSON.parse(body);
      msg = parsed.message || parsed.error || body || msg;
    } catch {
      msg = (await res.text()) || msg;
    }
    throw new Error(msg);
  }

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('پاسخ سرور نامعتبر است.');
  }

  return normalizeResponse(json);
}

// ——— UI ———

function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach((el) => { setText(el, ''); });
  document.querySelectorAll('.error').forEach((el) => el.classList.remove('error'));
}

function renderErrors(errors) {
  clearFieldErrors();

  if (!errors || errors.length === 0) {
    topErrorsEl.hidden = true;
    setText(topErrorsEl, '');
    return;
  }

  const messages = [];
  errors.forEach(({ field, message }) => {
    const inputId = FIELD_IDS[field];
    if (inputId) {
      const input = document.getElementById(inputId);
      const errorEl = document.getElementById(inputId + '-error');
      if (input) input.classList.add('error');
      if (errorEl) setText(errorEl, message);
    }
    messages.push(message);
  });

  setText(topErrorsEl, messages.join(' '));
  topErrorsEl.hidden = false;
}

const STATUS_LABELS = { REVIEW: 'در حال کارشناسی', ACTIVE: 'فعال', COMPLETED: 'تکمیل‌شده' };

function renderSuccess(resp) {
  successBannerEl.hidden = false;
  setText(successBannerEl, `پروژه با موفقیت ایجاد شد. شناسه: ${escapeHtml(resp.id)}`);
  topErrorsEl.hidden = true;

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

  const statusVal = resp.status ? (STATUS_LABELS[resp.status] || resp.status) : '—';
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

  clearFieldErrors();
  topErrorsEl.hidden = true;
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

function applyAppMode() {
  if (CONFIG.APP_MODE === 'SELF_SERVICE' && ownerSection) {
    ownerSection.hidden = true;
  } else if (ownerSection) {
    ownerSection.hidden = false;
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  const model = collectFormData();
  const errors = validateForm(model);

  if (errors.length > 0) {
    renderErrors(errors);
    return;
  }

  renderErrors([]);
  submitBtn.disabled = true;
  successBannerEl.hidden = true;

  try {
    const formData = buildFormData(model.owner, model.project, model.file);
    const resp = await submitCreateProject(formData);
    renderSuccess({ ...model.project, ...resp });
    clearForm(true);
  } catch (err) {
    renderErrors([{ field: null, message: err.message || 'ارسال درخواست ناموفق بود.' }]);
  } finally {
    submitBtn.disabled = false;
  }
}

function init() {
  applyAppMode();
  setupImagePreview();

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
