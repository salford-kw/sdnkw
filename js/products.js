/* ============================================================
   عرض المنتجات في قسم "أعمالنا" + تطبيق صور الصفحة الرئيسية
   البيانات مصدرها: data/products.json و data/home.json
   ============================================================ */

const money = p => (p === '' || p == null) ? '' : String(p).trim();

function productUrl(id) {
  return SITE.abs('product.html?p=' + encodeURIComponent(id));
}

function imgUrl(src) {
  if (!src) return '';
  return /^https?:\/\//i.test(src) ? src : SITE.abs(src);
}

/* ---------- 1) بطاقات المنتجات مقسّمة حسب الأقسام ---------- */
let ALL_PRODUCTS = [];

function cardHtml(p) {
  const price = money(p.price);
  const priceHtml = price
    ? `<span class="product-price">${price} ${SITE.currencyAr}</span>`
    : `<span class="product-price product-price--ask">السعر حسب المقاس</span>`;
  const wa = `https://wa.me/${SITE.whatsapp}?text=` +
    encodeURIComponent(`مرحباً ${SITE.businessName}، أبغي استفسر عن: ${p.name}\n${productUrl(p.id)}`);
  return `
    <article class="product-card" data-cat="${escapeHtml(p.category || '')}">
      <a class="product-media" href="${productUrl(p.id)}">
        <img src="${imgUrl(p.image)}" alt="${escapeHtml(p.alt || p.name)}"
             loading="lazy" width="600" height="450">
        ${p.category ? `<span class="product-cat">${escapeHtml(p.category)}</span>` : ''}
      </a>
      <div class="product-body">
        <h3><a href="${productUrl(p.id)}">${escapeHtml(p.name)}</a></h3>
        <p>${escapeHtml(p.description || '')}</p>
        <div class="product-foot">
          ${priceHtml}
          <a class="btn btn-primary product-wa" href="${wa}" target="_blank" rel="noopener">📱 اطلب الآن</a>
        </div>
      </div>
    </article>`;
}

function renderFilters(products) {
  const bar = document.getElementById('productFilters');
  if (!bar) return;
  const counts = {};
  products.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });

  const used = SITE.sections.filter(s => counts[s.name]);
  if (used.length < 2) { bar.style.display = 'none'; return; }

  bar.innerHTML =
    `<button class="filter-chip active" data-filter="*">الكل (${products.length})</button>` +
    used.map(s => `<button class="filter-chip" data-filter="${s.name}">${s.icon} ${s.name} (${counts[s.name]})</button>`).join('');

  bar.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });
}

function applyFilter(cat) {
  document.querySelectorAll('#productsGrid .product-section').forEach(sec => {
    sec.style.display = (cat === '*' || sec.dataset.cat === cat) ? '' : 'none';
  });
}

function renderProducts(all) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  // data-cat: صفحة قسم واحد (صفحات services) — تعرض منتجات هذا القسم فقط
  const only = (grid.dataset.cat || '').trim();
  let list = only ? all.filter(p => p.category === only) : all;

  // data-limit: الصفحة الرئيسية تعرض مختارات فقط
  const limit = parseInt(grid.dataset.limit || '0', 10);
  const products = limit > 0 ? list.slice(0, limit) : list;
  ALL_PRODUCTS = products;

  // في صفحة قسم واحد: شبكة مسطّحة بلا عنوان قسم مكرر
  if (only) {
    grid.innerHTML = products.length
      ? `<div class="products-grid">${products.map(cardHtml).join('')}</div>`
      : `<p style="text-align:center;color:var(--gray);padding:30px 0">
           لا توجد منتجات معروضة في هذا القسم حالياً — راسلنا على واتساب ونرسل لك أحدث ما توفر.
         </p>`;
    const bar = document.getElementById('productFilters');
    if (bar) bar.style.display = 'none';
    return;
  }

  if (!products.length) {
    grid.innerHTML = '<p style="text-align:center;color:var(--gray)">لا توجد منتجات معروضة حالياً.</p>';
    return;
  }

  // ترتيب الأقسام حسب ما هو معرّف في الإعدادات، ثم أي قسم غير معروف
  const known = SITE.sections.map(s => s.name);
  const extra = [...new Set(products.map(p => p.category).filter(c => c && !known.includes(c)))];

  grid.innerHTML = [...known, ...extra].map(cat => {
    const items = products.filter(p => p.category === cat);
    if (!items.length) return '';
    const meta = SITE.sections.find(s => s.name === cat);
    const id = 'sec-' + (meta ? meta.slug : encodeURIComponent(cat));
    return `
      <div class="product-section" data-cat="${escapeHtml(cat)}" id="${id}">
        <h3 class="product-section-title">
          <span>${meta ? meta.icon : '📦'} ${escapeHtml(cat)}</span>
          ${meta && meta.page
            ? `<a class="section-more" href="${SITE.abs(meta.page)}">كل ${escapeHtml(cat)} (${items.length}) ←</a>`
            : `<small>${items.length} منتج</small>`}
        </h3>
        <div class="products-grid">${items.map(cardHtml).join('')}</div>
      </div>`;
  }).join('');

  renderFilters(products);
}

/* ---------- 2) بيانات منظّمة ItemList + Product ---------- */
function injectProductSchema(products) {
  if (!products.length) return;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'منتجات وأعمال ' + SITE.businessName,
    itemListElement: products.map((p, i) => {
      const item = {
        '@type': 'Product',
        name: p.name,
        description: p.description || '',
        image: imgUrl(p.image),
        url: productUrl(p.id),
        category: p.category || '',
        brand: { '@type': 'Brand', name: SITE.businessName }
      };
      const price = money(p.price);
      if (price && !isNaN(parseFloat(price))) {
        item.offers = {
          '@type': 'Offer',
          price: parseFloat(price),
          priceCurrency: SITE.currency,
          availability: 'https://schema.org/InStock',
          url: productUrl(p.id),
          areaServed: { '@type': 'Country', name: 'الكويت' }
        };
      }
      return { '@type': 'ListItem', position: i + 1, item };
    })
  };

  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
}

/* ---------- 3) استبدال صور ونصوص الصفحة الرئيسية ---------- */
function applyHomeSlots(slots) {
  Object.entries(slots || {}).forEach(([key, slot]) => {
    const host = document.querySelector(`[data-slot="${key}"]`);
    if (!host) return;

    const img = host.matches('img') ? host : host.querySelector('img');
    if (img && slot.image) {
      img.src = imgUrl(slot.image);
      if (slot.alt) img.alt = slot.alt;
    }
    const t = host.querySelector('[data-slot-title]');
    if (t && slot.title) t.textContent = slot.title;
    const d = host.querySelector('[data-slot-desc]');
    if (d && slot.description) d.textContent = slot.description;

    if (key === 'hero' && slot.image) {
      const og = document.querySelector('meta[property="og:image"]');
      if (og) og.setAttribute('content', imgUrl(slot.image));
    }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- تشغيل ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  const bust = '?v=' + Date.now();
  try {
    const [pRes, hRes] = await Promise.all([
      fetch(SITE.abs('data/products.json') + bust, { cache: 'no-store' }),
      fetch(SITE.abs('data/home.json') + bust, { cache: 'no-store' })
    ]);
    if (hRes.ok) applyHomeSlots((await hRes.json()).slots);
    if (pRes.ok) {
      const products = (await pRes.json()).products || [];
      renderProducts(products);
      injectProductSchema(ALL_PRODUCTS);
    }
  } catch (e) {
    console.warn('تعذر تحميل بيانات المنتجات:', e);
  }
});
