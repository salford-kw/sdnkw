/* ============================================================
   لوحة تحكم سدن الكويت للمفروشات
   ترفع الصور والبيانات مباشرة إلى مستودع GitHub
   وتحدّث sitemap.xml تلقائياً مع كل منتج
   ============================================================ */

const GATE_PASSWORD = 'hamad2012';        // بوابة أولية فقط (ليست حماية حقيقية)
const CFG_KEY = 'kw_admin_cfg';

const state = {
  products: [],
  home: {},
  sha: { products: null, home: null, sitemap: null },
  editingId: null
};

/* ------------------ الإعدادات ------------------ */
function cfg() {
  const saved = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
  return {
    owner : saved.owner  || SITE.githubOwner,
    repo  : saved.repo   || SITE.githubRepo,
    branch: saved.branch || SITE.githubBranch,
    token : saved.token  || ''
  };
}
function saveCfg(c) { localStorage.setItem(CFG_KEY, JSON.stringify(c)); }

/* ------------------ GitHub API ------------------ */
async function gh(path, options = {}) {
  const c = cfg();
  if (!c.token) throw new Error('لم تُدخل رمز GitHub بعد — افتح تبويب «الإعدادات».');
  const res = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}/${path}`, {
    ...options,
    headers: {
      'Authorization': 'Bearer ' + c.token,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (res.status === 401) throw new Error('رمز GitHub غير صالح أو منتهي الصلاحية.');
  if (res.status === 403) throw new Error('الرمز لا يملك صلاحية الكتابة على هذا المستودع.');
  if (res.status === 404 && options.method !== 'PUT') return null;
  if (!res.ok) throw new Error('GitHub ' + res.status + ': ' + (await res.text()).slice(0, 180));
  return res.json();
}

async function getFile(path) {
  const c = cfg();
  const data = await gh(`contents/${encodeURI(path)}?ref=${c.branch}`);
  if (!data) return { json: null, sha: null };
  const text = new TextDecoder().decode(
    Uint8Array.from(atob(data.content.replace(/\n/g, '')), ch => ch.charCodeAt(0))
  );
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { json, text, sha: data.sha };
}

async function putFile(path, base64, message, sha) {
  const c = cfg();
  const body = { message, content: base64, branch: c.branch };
  if (sha) body.sha = sha;
  const out = await gh(`contents/${encodeURI(path)}`, { method: 'PUT', body: JSON.stringify(body) });
  return out.content.sha;
}

const b64 = str => btoa(String.fromCharCode(...new TextEncoder().encode(str)));

/* ------------------ ضغط الصور قبل الرفع ------------------ */
function compressImage(file, maxW = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * scale);
        cv.height = Math.round(img.height * scale);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        const dataUrl = cv.toDataURL('image/jpeg', quality);
        resolve({ base64: dataUrl.split(',')[1], preview: dataUrl });
      };
      img.onerror = () => reject(new Error('تعذّر قراءة الصورة'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('تعذّر قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

function catSlug(name) {
  const s = SITE.sections.find(x => x.name === name);
  return s ? s.slug : 'product';
}

async function uploadImage(file, category) {
  if (!file.type.startsWith('image/')) throw new Error('الملف ليس صورة');
  const { base64, preview } = await compressImage(file);
  const prefix = catSlug(category);
  const path = `${SITE.imagesDir}/${prefix}-${Date.now()}.jpg`;
  await putFile(path, base64, `رفع صورة: ${path}`);
  return { path, preview };
}

/* ------------------ تحميل البيانات ------------------ */
async function loadAll() {
  const p = await getFile('data/products.json');
  const h = await getFile('data/home.json');
  const s = await getFile('sitemap.xml');
  state.products = p.json?.products || [];
  state.sha.products = p.sha;
  state.home = h.json?.slots || {};
  state.sha.home = h.sha;
  state.sha.sitemap = s.sha;
  renderProducts();
  renderHomeSlots();
  updateStats();
}

/* ------------------ توليد خريطة الموقع ------------------ */
function buildSitemap() {
  const base = SITE.baseUrl;
  const today = new Date().toISOString().slice(0, 10);
  const statics = [
    ['', '1.0', 'weekly'],
    ['products.html', '0.95', 'weekly'],
    ['faq.html', '0.7', 'monthly'],
    ['services/curtains.html', '0.9', 'monthly'],
    ['services/carpets.html', '0.9', 'monthly'],
    ['services/flooring.html', '0.9', 'monthly'],
    ['services/mattresses.html', '0.9', 'monthly'],
    ['areas/hawalli.html', '0.8', 'monthly'],
    ['areas/salmiya.html', '0.8', 'monthly'],
    ['areas/farwaniya.html', '0.8', 'monthly'],
    ['areas/jahra.html', '0.8', 'monthly'],
    ['areas/ahmadi.html', '0.8', 'monthly'],
    ['areas/kuwait-city.html', '0.8', 'monthly']
  ];
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  statics.forEach(([loc, pr, freq]) => {
    xml += `  <url>\n    <loc>${esc(base + loc)}</loc>\n    <lastmod>${today}</lastmod>\n` +
           `    <changefreq>${freq}</changefreq>\n    <priority>${pr}</priority>\n  </url>\n`;
  });

  state.products.forEach(p => {
    const url = base + 'product.html?p=' + encodeURIComponent(p.id);
    const img = /^https?:/i.test(p.image) ? p.image : base + p.image;
    xml += `  <url>\n    <loc>${esc(url)}</loc>\n    <lastmod>${esc(p.date || today)}</lastmod>\n` +
           `    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n` +
           `    <image:image>\n      <image:loc>${esc(img)}</image:loc>\n` +
           `      <image:title>${esc(p.name)}</image:title>\n` +
           `      <image:caption>${esc(p.alt || p.description || p.name)}</image:caption>\n` +
           `    </image:image>\n  </url>\n`;
  });

  return xml + '</urlset>\n';
}

/* ------------------ النشر ------------------ */
async function publish(msg = 'تحديث المحتوى من لوحة التحكم') {
  const today = new Date().toISOString().slice(0, 10);
  setBusy(true, 'جاري النشر على GitHub...');
  try {
    state.sha.products = await putFile('data/products.json',
      b64(JSON.stringify({ updated: today, products: state.products }, null, 2)),
      msg + ' — المنتجات', state.sha.products);

    state.sha.home = await putFile('data/home.json',
      b64(JSON.stringify({ updated: today, slots: state.home }, null, 2)),
      msg + ' — الصفحة الرئيسية', state.sha.home);

    state.sha.sitemap = await putFile('sitemap.xml',
      b64(buildSitemap()), 'تحديث خريطة الموقع تلقائياً', state.sha.sitemap);

    updateStats();
    toast('✅ تم النشر — الموقع يتحدّث خلال دقيقة تقريباً', 'success');
  } catch (e) {
    toast('❌ ' + e.message, 'error');
  } finally {
    setBusy(false);
  }
}

/* ------------------ واجهة المنتجات ------------------ */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const srcOf = s => (/^https?:/i.test(s) ? s : SITE.abs(s));

function renderProducts() {
  const grid = document.getElementById('adminGallery');
  const empty = document.getElementById('emptyState');
  if (!state.products.length) {
    grid.style.display = 'none'; empty.style.display = 'block'; return;
  }
  empty.style.display = 'none'; grid.style.display = 'grid';
  grid.innerHTML = state.products.map(p => `
    <div class="admin-gallery-item">
      <button class="delete-btn" onclick="deleteProduct('${p.id}')" title="حذف">×</button>
      <img src="${srcOf(p.image)}" alt="${esc(p.alt || p.name)}" loading="lazy">
      <div class="img-info">
        <div class="pname">${esc(p.name)}</div>
        <div class="pprice">${p.price ? esc(p.price) + ' ' + SITE.currencyAr : 'السعر حسب المقاس'}</div>
        <div class="pdesc">${esc((p.description || '').slice(0, 80))}</div>
        <button class="mini-btn" onclick="editProduct('${p.id}')">✏️ تعديل</button>
      </div>
    </div>`).join('');
}

function fillSectionSelect() {
  const sel = document.getElementById('pf-cat');
  sel.innerHTML = SITE.sections
    .map(s => `<option value="${s.name}">${s.icon} ${s.name}</option>`).join('');
}

function openProductForm(prod) {
  state.editingId = prod?.id || null;
  fillSectionSelect();
  document.getElementById('pf-title').textContent = prod ? 'تعديل منتج' : 'إضافة منتج جديد';
  document.getElementById('pf-name').value = prod?.name || '';
  document.getElementById('pf-price').value = prod?.price || '';
  document.getElementById('pf-desc').value = prod?.description || '';
  document.getElementById('pf-alt').value = prod?.alt || '';
  document.getElementById('pf-cat').value = prod?.category || SITE.sections[0].name;
  const prev = document.getElementById('pf-preview');
  prev.src = prod ? srcOf(prod.image) : '';
  prev.style.display = prod ? 'block' : 'none';
  prev.dataset.path = prod?.image || '';
  document.getElementById('pf-file').value = '';
  document.getElementById('productModal').style.display = 'flex';
}
function closeProductForm() { document.getElementById('productModal').style.display = 'none'; }
function editProduct(id) { openProductForm(state.products.find(p => p.id === id)); }

async function pickProductImage(input) {
  if (!input.files || !input.files[0]) return;
  setBusy(true, 'جاري رفع الصورة...');
  try {
    const { path, preview } = await uploadImage(input.files[0], document.getElementById('pf-cat').value);
    const prev = document.getElementById('pf-preview');
    prev.src = preview; prev.style.display = 'block'; prev.dataset.path = path;
    toast('✅ تم رفع الصورة', 'success');
  } catch (e) { toast('❌ ' + e.message, 'error'); }
  finally { setBusy(false); }
}

function saveProduct() {
  const name = document.getElementById('pf-name').value.trim();
  const image = document.getElementById('pf-preview').dataset.path;
  if (!name)  return toast('❌ اكتب اسم المنتج', 'error');
  if (!image) return toast('❌ اختر صورة للمنتج', 'error');

  const data = {
    name,
    price: document.getElementById('pf-price').value.trim(),
    description: document.getElementById('pf-desc').value.trim(),
    alt: document.getElementById('pf-alt').value.trim() || `${name} - ${SITE.businessName}`,
    category: document.getElementById('pf-cat').value,
    image,
    date: new Date().toISOString().slice(0, 10)
  };

  if (state.editingId) {
    const i = state.products.findIndex(p => p.id === state.editingId);
    state.products[i] = { ...state.products[i], ...data };
  } else {
    state.products.unshift({ id: 'p-' + Date.now().toString(36), ...data });
  }
  const label = state.editingId ? 'تعديل منتج: ' : 'إضافة منتج: ';
  closeProductForm();
  renderProducts();
  publish(label + name);
}

function deleteProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!confirm(`حذف «${p.name}» نهائياً من الموقع؟`)) return;
  state.products = state.products.filter(x => x.id !== id);
  renderProducts();
  publish('حذف منتج: ' + p.name);
}

/* ------------------ واجهة الصفحة الرئيسية ------------------ */
function renderHomeSlots() {
  const box = document.getElementById('homeSlots');
  box.innerHTML = Object.entries(state.home).map(([key, s]) => `
    <div class="slot-card">
      <img id="slot-img-${key}" src="${srcOf(s.image)}" alt="${esc(s.alt)}">
      <div class="slot-body">
        <strong>${esc(s.label || key)}</strong>
        <label>الاسم / العنوان الظاهر</label>
        <input id="slot-title-${key}" value="${esc(s.title)}"
               ${s.title === '' ? 'disabled placeholder="هذه الصورة بلا عنوان"' : ''}>
        <label>الوصف الظاهر</label>
        <textarea id="slot-desc-${key}" rows="2"
               ${s.description === '' ? 'disabled placeholder="هذه الصورة بلا وصف"' : ''}>${esc(s.description)}</textarea>
        <label>الوصف البديل alt (مهم جداً للسيو)</label>
        <textarea id="slot-alt-${key}" rows="2">${esc(s.alt)}</textarea>
        <input type="file" accept="image/*" onchange="replaceSlotImage('${key}', this)">
      </div>
    </div>`).join('');
}

async function replaceSlotImage(key, input) {
  if (!input.files || !input.files[0]) return;
  setBusy(true, 'جاري رفع الصورة...');
  try {
    const { path, preview } = await uploadImage(input.files[0], '__home');
    state.home[key].image = path;
    document.getElementById('slot-img-' + key).src = preview;
    toast('✅ تم رفع الصورة — اضغط «حفظ ونشر الصفحة الرئيسية»', 'success');
  } catch (e) { toast('❌ ' + e.message, 'error'); }
  finally { setBusy(false); }
}

function saveHome() {
  Object.keys(state.home).forEach(key => {
    const t = document.getElementById('slot-title-' + key);
    const d = document.getElementById('slot-desc-' + key);
    const a = document.getElementById('slot-alt-' + key);
    if (t && !t.disabled) state.home[key].title = t.value.trim();
    if (d && !d.disabled) state.home[key].description = d.value.trim();
    if (a) state.home[key].alt = a.value.trim();
  });
  publish('تحديث محتوى الصفحة الرئيسية');
}

/* ------------------ أدوات الواجهة ------------------ */
function updateStats() {
  document.getElementById('imgCount').textContent = state.products.length;
  document.getElementById('priced').textContent = state.products.filter(p => p.price).length;
  const counts = SITE.sections
    .map(sec => `${sec.icon} ${sec.name}: ${state.products.filter(p => p.category === sec.name).length}`)
    .join(' · ');
  const el = document.getElementById('sectionCounts');
  if (el) el.textContent = counts;
  document.getElementById('repoName').textContent = cfg().repo || '—';
}

function setBusy(on, msg) {
  const el = document.getElementById('busy');
  el.style.display = on ? 'flex' : 'none';
  if (msg) el.querySelector('span').textContent = msg;
}

function toast(message, type) {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.className = 'toast ' + type;
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 4000);
}

function switchTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).style.display = 'block';
  document.querySelector(`[data-tab="${name}"]`).classList.add('active');
}

/* ------------------ الإعدادات والدخول ------------------ */
function saveSettings() {
  saveCfg({
    owner : document.getElementById('cfg-owner').value.trim(),
    repo  : document.getElementById('cfg-repo').value.trim(),
    branch: document.getElementById('cfg-branch').value.trim() || 'main',
    token : document.getElementById('cfg-token').value.trim()
  });
  toast('✅ تم حفظ الإعدادات', 'success');
  bootData();
}

function fillSettings() {
  const c = cfg();
  document.getElementById('cfg-owner').value = c.owner;
  document.getElementById('cfg-repo').value = c.repo;
  document.getElementById('cfg-branch').value = c.branch;
  document.getElementById('cfg-token').value = c.token;
}

async function bootData() {
  if (!cfg().token) {
    toast('⚠️ أدخل رمز GitHub في تبويب «الإعدادات» لتفعيل الرفع', 'error');
    switchTab('settings');
    return;
  }
  setBusy(true, 'جاري تحميل البيانات...');
  try { await loadAll(); switchTab('products'); }
  catch (e) { toast('❌ ' + e.message, 'error'); switchTab('settings'); }
  finally { setBusy(false); }
}

function checkPassword() {
  const input = document.getElementById('passwordInput');
  if (input.value === GATE_PASSWORD) {
    sessionStorage.setItem('adminLoggedIn', 'true');
    showAdminPanel();
  } else {
    document.getElementById('errorMsg').style.display = 'block';
    input.value = ''; input.focus();
  }
}

function showAdminPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  fillSettings();
  bootData();
}

function logout() { sessionStorage.removeItem('adminLoggedIn'); location.reload(); }

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('adminLoggedIn') === 'true') showAdminPanel();
  document.getElementById('passwordInput')
    .addEventListener('keypress', e => { if (e.key === 'Enter') checkPassword(); });
});
