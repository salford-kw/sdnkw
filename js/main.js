// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Mobile menu toggle
function toggleMenu() {
    const nav = document.querySelector('nav ul');
    if (nav.style.display === 'flex') {
        nav.style.display = '';
    } else {
        nav.style.display = 'flex';
        nav.style.flexDirection = 'column';
        nav.style.position = 'absolute';
        nav.style.top = '80px';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.background = 'rgba(26, 54, 93, 0.98)';
        nav.style.padding = '20px';
        nav.style.backdropFilter = 'blur(10px)';
        nav.style.zIndex = '999';
    }
}

// FAQ toggle
function toggleFaq(element) {
    const item = element.parentElement;
    const isActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(faq => {
        faq.classList.remove('active');
    });
    if (!isActive) {
        item.classList.add('active');
    }
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Lazy loading enhancement
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                observer.unobserve(img);
            }
        });
    });
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Add current year to footer
document.addEventListener('DOMContentLoaded', function() {
    const yearElements = document.querySelectorAll('.footer-bottom p');
    yearElements.forEach(el => {
        if (el.textContent.includes('2026')) {
            el.innerHTML = el.innerHTML.replace('2026', new Date().getFullYear());
        }
    });
});

/* ============================================================
   الشريط الثابت السفلي: واتساب + اتصال (يظهر في كل الصفحات)
   ============================================================ */
(function () {
  const PHONE = '97919138';
  const PHONE_INTL = '+96597919138';
  const WA = '96597919138';

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('no-sticky-bar')) return;
    if (document.getElementById('stickyBar')) return;

    const pageName = (document.querySelector('h1')?.textContent || document.title || '').trim().slice(0, 90);
    const waHref = 'https://wa.me/' + WA + '?text=' +
      encodeURIComponent('مرحباً سدن الكويت للمفروشات، عندي استفسار بخصوص: ' + pageName + '\n' + location.href);

    const bar = document.createElement('div');
    bar.id = 'stickyBar';
    bar.className = 'sticky-bar';
    bar.setAttribute('role', 'complementary');
    bar.setAttribute('aria-label', 'تواصل سريع');
    bar.innerHTML =
      '<a class="sticky-btn sticky-wa" href="' + waHref + '" target="_blank" rel="noopener"' +
      ' aria-label="تواصل عبر واتساب">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z"/>' +
        '<path fill="currentColor" d="M12.04 2C6.6 2 2.17 6.43 2.17 11.87c0 1.74.46 3.44 1.32 4.94L2 22l5.35-1.4a9.83 9.83 0 0 0 4.69 1.19h.01c5.43 0 9.86-4.43 9.86-9.87A9.8 9.8 0 0 0 19 4.87 9.8 9.8 0 0 0 12.04 2zm0 18.05h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.16 8.16 0 0 1-1.25-4.34c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.86 5.8 2.41a8.15 8.15 0 0 1 2.4 5.8c0 4.52-3.68 8.17-8.2 8.17z"/>' +
        '</svg><span>واتساب</span></a>' +
      '<a class="sticky-btn sticky-call" href="tel:' + PHONE_INTL + '" aria-label="اتصل بنا الآن">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2c.28-.28.68-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1A17 17 0 0 1 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>' +
        '</svg><span>اتصل ' + PHONE + '</span></a>';

    document.body.appendChild(bar);
    document.body.classList.add('has-sticky-bar');
  });
})();
