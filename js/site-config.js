/* ============================================================
   إعدادات الموقع — الملف الوحيد اللي تعدّله يدوياً
   ============================================================ */

const SITE = {
  /* اسم المستخدم واسم المستودع على GitHub — عدّلهم لأسمائك الحقيقية */
  githubOwner: 'salford-kw',
  githubRepo : 'sdnkw',
  githubBranch: 'main',

  /* بيانات النشاط (NAP) — لازم تكون متطابقة حرفياً مع ملفك على خرائط جوجل */
  businessName: 'سدن الكويت للمفروشات',
  phone       : '97919138',
  phoneIntl   : '+96597919138',
  whatsapp    : '96597919138',
  currency    : 'KWD',
  currencyAr  : 'د.ك',

  /* مجلد حفظ صور المنتجات داخل المستودع */
  imagesDir: 'assets/products',

  /* أقسام المنتجات — أضف أو احذف قسماً من هنا فقط
     slug يُستخدم في اسم ملف الصورة ورابط القسم (لا تغيّره بعد النشر) */
  sections: [
    { name: 'ستائر',        slug: 'curtains', icon: '🪟', page: 'services/curtains.html' },
    { name: 'سجاد',         slug: 'carpets',  icon: '🧶', page: 'services/carpets.html' },
    { name: 'مجالس ومساند', slug: 'majlis',   icon: '🛋️', page: 'services/mattresses.html' },
    { name: 'موكيت',        slug: 'flooring', icon: '📐', page: 'services/flooring.html' }
  ]
};

/* الرابط الأساسي — يُحسب تلقائياً من العنوان الحالي، فلا تحتاج تعدله */
SITE.baseUrl = (function () {
  const a = document.createElement('a');
  a.href = document.querySelector('base')?.href || './';
  let url = new URL(a.href, location.href).href;
  // إزالة أي اسم ملف من النهاية
  url = url.replace(/\/[^\/]*\.html.*$/i, '/');
  url = url.replace(/\/(services|areas|admin|js|css|data|assets)\/.*$/i, '/');
  if (!url.endsWith('/')) url += '/';
  return url;
})();

SITE.abs = p => SITE.baseUrl + String(p).replace(/^\/+/, '');
