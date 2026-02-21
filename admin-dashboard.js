/**
 * Admin Dashboard — Vanilla JS
 * Only: search by title, edit project. Publishing is edited in the edit form only.
 * GET /webhook/allopportunities. No PATCH from dashboard.
 */

(function () {
  'use strict';

  const CONFIG = {
    N8N_BASE: 'https://n8nb2wall.darkube.app',
    get OPPORTUNITIES_URL() { return `${this.N8N_BASE}/webhook/allopportunities`; },
    REQUEST_TIMEOUT_MS: 20000,
  };

  const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  // ——— Mapping utilities ———
  function mapStatusToFa(status) {
    const s = (status || '').toString().toUpperCase();
    if (s === 'REVIEW') return 'در حال کارشناسی';
    if (s === 'FUNDING') return 'در حال جذب سرمایه';
    if (s === 'COMPLETED') return 'تکمیل شده';
    return s || '—';
  }

  function mapVisibilityToFa(visibility) {
    const v = (visibility || '').toString().toUpperCase();
    if (v === 'PUBLIC') return 'انتشار';
    if (v === 'PRIVATE') return 'عدم انتشار';
    return v || '—';
  }

  /** Format amount: Persian digits + thousands separators + " تومان", or "—" if null/undefined/NaN */
  function formatToman(value) {
    if (value === null || value === undefined || value === '') return '—';
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('fa-IR') + ' تومان';
  }

  const apiClient = {
    headers: {},

    async get(url, params = {}) {
      const qs = new URLSearchParams(params).toString();
      const fullUrl = qs ? `${url}?${qs}` : url;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(fullUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', ...this.headers },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const text = await res.text();
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (_) {
          return { ok: res.ok, status: res.status, data: null, text };
        }
        return { ok: res.ok, status: res.status, data: json, text };
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    },
  };

  let allProjects = [];

  function setText(el, text) {
    if (!el) return;
    el.textContent = text != null ? String(text) : '';
  }

  function toPersianDigits(n) {
    if (n == null || n === '') return '—';
    return String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[+d]);
  }

  function normalizeProject(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = raw.id ?? raw.opportunity_id ?? raw.project_id ?? '';
    const title = raw.title ?? '';
    const status = normalizeStatus(raw.status);
    const visibility = normalizeVisibility(raw.visibility);
    const image_url = raw.image_url ?? raw.imageUrl ?? '';
    const required = raw.required_amount_toman ?? raw.requiredAmountToman ?? null;
    const funded = raw.funded_amount_toman ?? raw.fundedAmountToman ?? null;
    const monthly = raw.monthly_profit_percent ?? raw.monthlyProfitPercent;
    const duration = raw.duration_months ?? raw.durationMonths;
    return {
      id: String(id),
      title: String(title).trim(),
      status,
      visibility,
      image_url: String(image_url).trim(),
      required_amount_toman: required !== null && required !== undefined && required !== '' ? Number(required) : null,
      funded_amount_toman: funded !== null && funded !== undefined && funded !== '' ? Number(funded) : null,
      monthly_profit_percent: monthly != null ? Number(monthly) : null,
      duration_months: duration != null ? Number(duration) : null,
      created_at: raw.created_at ?? raw.createdAt ?? null,
    };
  }

  function normalizeStatus(val) {
    const s = (val ?? '').toString().toUpperCase();
    if (s === 'ACTIVE') return 'FUNDING';
    if (['REVIEW', 'FUNDING', 'COMPLETED'].includes(s)) return s;
    return 'REVIEW';
  }

  function normalizeVisibility(val) {
    const v = (val ?? '').toString().toUpperCase();
    if (v === 'PUBLIC' || v === 'PRIVATE') return v;
    if (v === 'PUBLISHED') return 'PUBLIC';
    return 'PRIVATE';
  }

  function toPublicImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const u = String(url).trim();
    if (/^data:image\//i.test(u) || /^https?:\/\//i.test(u)) return u;
    return 'https://b2wall.storage.c2.liara.space/' + u.replace(/^\//, '');
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function setLoading(show) {
    const overlay = getEl('loading-overlay');
    if (overlay) overlay.hidden = !show;
  }

  function showError(message) {
    const el = getEl('global-error');
    if (!el) return;
    const content = el.querySelector('.alert-content');
    if (content) {
      content.textContent = '';
      const span = document.createElement('span');
      span.textContent = message || 'خطا در بارگذاری پروژه‌ها.';
      content.appendChild(span);
    }
    el.hidden = false;
  }

  function hideError() {
    const el = getEl('global-error');
    if (el) el.hidden = true;
  }

  async function fetchProjects() {
    setLoading(true);
    hideError();
    try {
      const res = await apiClient.get(CONFIG.OPPORTUNITIES_URL);
      setLoading(false);
      if (!res.ok) {
        showError(res.data?.message || res.data?.error || `خطا: ${res.status}`);
        allProjects = [];
        renderProjects(allProjects);
        return;
      }
      const data = res.data;
      const list = Array.isArray(data) ? data : (data?.opportunities ?? data?.data ?? []);
      if (!Array.isArray(list)) {
        allProjects = [];
        renderProjects(allProjects);
        return;
      }
      allProjects = list.map(normalizeProject).filter(Boolean);
      renderProjects(allProjects);
    } catch (err) {
      setLoading(false);
      const msg = err.name === 'AbortError' ? 'زمان درخواست به پایان رسید.' : (err.message || 'خطا در ارتباط با سرور.');
      showError(msg);
      allProjects = [];
      renderProjects(allProjects);
    }
  }

  function applyFilters() {
    const searchVal = (getEl('search-input')?.value ?? '').trim().toLowerCase();
    const statusVal = (getEl('filter-status')?.value ?? '').trim();
    const visibilityVal = (getEl('filter-visibility')?.value ?? '').trim();

    return allProjects.filter((p) => {
      if (searchVal && !String(p.title).toLowerCase().includes(searchVal)) return false;
      if (statusVal && p.status !== statusVal) return false;
      if (visibilityVal && p.visibility !== visibilityVal) return false;
      return true;
    });
  }

  function buildCard(p) {
    const article = document.createElement('article');
    article.className = 'project-card';
    article.setAttribute('data-project-id', p.id);

    const header = document.createElement('div');
    header.className = 'card-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'card-header-title-wrap';

    const titleEl = document.createElement('h2');
    titleEl.className = 'card-title';
    titleEl.textContent = p.title || '—';
    titleWrap.appendChild(titleEl);

    const metaRow = document.createElement('div');
    metaRow.className = 'card-header-meta';

    const statusBadge = document.createElement('span');
    statusBadge.className = `badge-status ${p.status}`;
    statusBadge.textContent = mapStatusToFa(p.status);
    metaRow.appendChild(statusBadge);

    titleWrap.appendChild(metaRow);
    header.appendChild(titleWrap);
    article.appendChild(header);

    const imgWrap = document.createElement('div');
    imgWrap.className = 'card-img-wrap';
    if (p.image_url) {
      const img = document.createElement('img');
      img.src = toPublicImageUrl(p.image_url);
      img.alt = p.title || 'پروژه';
      img.loading = 'lazy';
      img.onerror = () => {
        img.remove();
        const ph = document.createElement('div');
        ph.className = 'card-img-placeholder';
        ph.setAttribute('aria-hidden', 'true');
        imgWrap.appendChild(ph);
      };
      imgWrap.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'card-img-placeholder';
      ph.setAttribute('aria-hidden', 'true');
      imgWrap.appendChild(ph);
    }
    const visibilityBadge = document.createElement('div');
    visibilityBadge.className = `card-visibility-badge card-visibility-badge-${p.visibility === 'PUBLIC' ? 'public' : 'private'}`;
    visibilityBadge.setAttribute('aria-hidden', 'true');
    imgWrap.appendChild(visibilityBadge);
    article.appendChild(imgWrap);

    const metaGrid = document.createElement('div');
    metaGrid.className = 'card-meta-grid';

    const addMetaItem = (label, value) => {
      const item = document.createElement('div');
      item.className = 'card-meta-item';
      const lab = document.createElement('span');
      lab.className = 'card-meta-label';
      lab.textContent = label;
      const val = document.createElement('span');
      val.className = 'card-meta-value';
      val.textContent = value;
      item.appendChild(lab);
      item.appendChild(val);
      metaGrid.appendChild(item);
    };

    addMetaItem('مورد نیاز', formatToman(p.required_amount_toman));
    addMetaItem('تأمین‌شده', formatToman(p.funded_amount_toman));
    if (p.duration_months != null && !isNaN(p.duration_months)) {
      addMetaItem('مدت', toPersianDigits(Math.round(p.duration_months)) + ' ماه');
    }
    if (p.monthly_profit_percent != null && !isNaN(p.monthly_profit_percent)) {
      addMetaItem('سود ماهانه', toPersianDigits(Number(p.monthly_profit_percent)) + '٪');
    }

    article.appendChild(metaGrid);

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    const editBtn = document.createElement('a');
    editBtn.href = `admin-create-project.html?mode=edit&id=${encodeURIComponent(p.id)}`;
    editBtn.className = 'btn btn-primary btn-sm';
    editBtn.textContent = 'ویرایش';
    footer.appendChild(editBtn);
    article.appendChild(footer);

    return article;
  }

  function renderProjects(projects) {
    const container = getEl('projects-container');
    const emptyEl = getEl('empty-state');
    if (!container) return;

    const filtered = projects.length ? applyFilters() : [];
    container.textContent = '';

    if (emptyEl) {
      emptyEl.hidden = filtered.length > 0;
    }

    filtered.forEach((p) => {
      container.appendChild(buildCard(p));
    });
  }

  function bindEvents() {
    const searchInput = getEl('search-input');
    const filterStatus = getEl('filter-status');
    const filterVisibility = getEl('filter-visibility');

    const onFilterChange = () => renderProjects(allProjects);

    if (searchInput) {
      searchInput.addEventListener('input', onFilterChange);
      searchInput.addEventListener('change', onFilterChange);
    }
    if (filterStatus) filterStatus.addEventListener('change', onFilterChange);
    if (filterVisibility) filterVisibility.addEventListener('change', onFilterChange);
  }

  function init() {
    bindEvents();
    fetchProjects();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
