/* ============================================
   TECHHOME AUDIO — script.js
   Theme · Hero Slider · All interactions
   ============================================ */

'use strict';

/* ──────────────────────────────────────────
   1. THEME ENGINE  (light / dark / auto)
   ────────────────────────────────────────── */
(function () {
  const html       = document.documentElement;
  const switcher   = document.getElementById('themeSwitcher');
  const btns       = switcher ? Array.from(switcher.querySelectorAll('.theme-btn')) : [];
  const KEY        = 'tha-theme';
  const sysDark    = window.matchMedia('(prefers-color-scheme: dark)');

  function getSaved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function setSaved(m) {
    try { localStorage.setItem(KEY, m); } catch (e) {}
  }

  function applyTheme(mode) {
    let resolved = mode;
    if (mode === 'auto') {
      // also check time: dark 20:00–07:00, light otherwise
      const h = new Date().getHours();
      const timeDark = h >= 20 || h < 7;
      resolved = (sysDark.matches || timeDark) ? 'dark' : 'light';
    }
    html.setAttribute('data-theme', resolved);

    if (switcher) {
      switcher.setAttribute('data-active', mode);
      btns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    }
  }

  function setMode(mode) {
    setSaved(mode);
    applyTheme(mode);
  }

  // Init on load
  applyTheme(getSaved() || 'auto');

  // Button clicks
  btns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  // System preference change
  sysDark.addEventListener('change', () => {
    if ((getSaved() || 'auto') === 'auto') applyTheme('auto');
  });

  // Re-check every minute for time-based auto switching
  setInterval(() => {
    if ((getSaved() || 'auto') === 'auto') applyTheme('auto');
  }, 60_000);
})();


/* ──────────────────────────────────────────
   2. HEADER — scroll shadow
   ────────────────────────────────────────── */
(function () {
  const header = document.getElementById('header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
})();


/* ──────────────────────────────────────────
   3. HAMBURGER MENU
   ────────────────────────────────────────── */
(function () {
  const btn   = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    links.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    btn.classList.remove('open');
    links.classList.remove('open');
    document.body.style.overflow = '';
  }));
})();


/* ──────────────────────────────────────────
   4. HERO SLIDER
   ────────────────────────────────────────── */
(function () {
  const slider   = document.querySelector('.hero-slider');
  if (!slider) return;

  const slides   = Array.from(slider.querySelectorAll('.hs-slide'));
  const dotBtns  = Array.from(slider.querySelectorAll('.hs-dot-btn'));
  const prevBtn  = document.getElementById('hsPrev');
  const nextBtn  = document.getElementById('hsNext');
  const progFill = document.getElementById('hsProgressFill');

  if (!slides.length) return;

  const DURATION   = 6000;   // ms per slide
  const ANIM_TIME  = 700;    // ms for CSS transition
  let   current    = 0;
  let   animating  = false;
  let   paused     = false;
  let   progStart  = null;
  let   progRaf    = null;

  /* ── Make sure only slide[0] has hs-active at start ── */
  slides.forEach((s, i) => {
    s.classList.remove('hs-active', 'hs-enter', 'hs-leave');
    if (i === 0) s.classList.add('hs-active');
  });
  dotBtns.forEach((d, i) => {
    d.classList.remove('hs-dot-active');
    if (i === 0) d.classList.add('hs-dot-active');
  });

  /* ── Navigate to slide idx ── */
  function goTo(idx) {
    if (animating) return;
    const next = ((idx % slides.length) + slides.length) % slides.length;
    if (next === current) return;

    animating = true;
    const prev = current;
    current = next;

    // Leave old
    slides[prev].classList.add('hs-leave');
    slides[prev].classList.remove('hs-active');

    // Enter new
    slides[current].classList.add('hs-enter');

    // After animation: finalise classes
    setTimeout(() => {
      slides[prev].classList.remove('hs-leave');
      slides[current].classList.remove('hs-enter');
      slides[current].classList.add('hs-active');
      animating = false;
    }, ANIM_TIME);

    // Update dots
    dotBtns.forEach((d, i) => d.classList.toggle('hs-dot-active', i === current));

    // Restart progress
    restartProgress();
  }

  /* ── Progress bar (rAF-based, pausable) ── */
  function restartProgress() {
    if (progRaf) cancelAnimationFrame(progRaf);
    progStart = performance.now();
    if (progFill) progFill.style.width = '0%';

    function tick(now) {
      if (paused) {
        progStart += 16; // freeze timer while paused
      }
      const pct = Math.min(((now - progStart) / DURATION) * 100, 100);
      if (progFill) progFill.style.width = pct + '%';

      if (pct < 100) {
        progRaf = requestAnimationFrame(tick);
      } else {
        goTo(current + 1);
      }
    }
    progRaf = requestAnimationFrame(tick);
  }

  /* ── Controls ── */
  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));
  dotBtns.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

  /* ── Keyboard ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  /* ── Touch / swipe ── */
  let touchX = 0;
  slider.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
  }, { passive: true });
  slider.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ── Pause on hover ── */
  slider.addEventListener('mouseenter', () => { paused = true;  });
  slider.addEventListener('mouseleave', () => { paused = false; });

  /* ── Start ── */
  restartProgress();
})();


/* ──────────────────────────────────────────
   5. ABOUT SECTION PARALLAX
   ────────────────────────────────────────── */
(function () {
  const aboutBg = document.getElementById('aboutBg');
  if (!aboutBg) return;

  let raf = null;
  function update() {
    const about = aboutBg.closest('.about');
    if (!about) return;
    const mid = about.getBoundingClientRect().top + about.offsetHeight / 2 - window.innerHeight / 2;
    aboutBg.style.transform = `translateY(${mid * -0.22}px)`;
    raf = null;
  }
  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
})();


/* ──────────────────────────────────────────
   6. SCROLL REVEAL  (IntersectionObserver)
   ────────────────────────────────────────── */
(function () {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll(
    '.reveal-fade, .reveal-left, .reveal-right, .brand-card, .contact-card'
  ).forEach(el => obs.observe(el));
})();


/* ──────────────────────────────────────────
   7. FLOATING CONTACT BUTTON
   ────────────────────────────────────────── */
(function () {
  const wrap = document.getElementById('floatWrap');
  const main = document.getElementById('floatMain');
  if (!wrap || !main) return;

  main.addEventListener('click', e => {
    e.stopPropagation();
    wrap.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) wrap.classList.remove('open');
  });
})();


/* ──────────────────────────────────────────
   8. SMOOTH SCROLL for anchor links
   ────────────────────────────────────────── */
(function () {
  const html = document.documentElement;
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const hh = parseInt(getComputedStyle(html).getPropertyValue('--header-h')) || 56;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - hh,
        behavior: 'smooth'
      });
    });
  });
})();


/* ──────────────────────────────────────────
   9. ACTIVE NAV LINK on scroll
   ────────────────────────────────────────── */
(function () {
  const navLinks = document.querySelectorAll('.nav-link');
  document.querySelectorAll('section[id]').forEach(sec => {
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(a =>
            a.classList.toggle('active', a.getAttribute('href') === '#' + sec.id)
          );
        }
      });
    }, { threshold: 0.4 }).observe(sec);
  });
})();


/* ──────────────────────────────────────────
   10. PRODUCT IMAGE 3D TILT
   ────────────────────────────────────────── */
(function () {
  document.querySelectorAll('.product-img-wrap').forEach(wrap => {
    wrap.addEventListener('mousemove', e => {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      wrap.style.transform   = `perspective(640px) rotateY(${x * 7}deg) rotateX(${-y * 5}deg) scale(1.02)`;
      wrap.style.transition  = 'transform .05s';
    });
    wrap.addEventListener('mouseleave', () => {
      wrap.style.transform  = '';
      wrap.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
    });
  });
})();


/* ──────────────────────────────────────────
   11. STAT COUNTER ANIMATION
   ────────────────────────────────────────── */
(function () {
  function countUp(el) {
    const raw    = parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
    const hasK   = raw >= 1000;
    const suffix = el.textContent.includes('+') ? '+' : '';
    const dur    = 1500;
    const start  = performance.now();
    (function tick(now) {
      const p    = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      if (hasK) {
        el.textContent = (Math.round(ease * raw / 100) / 10) + 'K' + suffix;
      } else {
        el.textContent = Math.round(ease * raw) + suffix;
      }
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = hasK ? (raw / 1000) + 'K' + suffix : raw + suffix;
    })(start);
  }

  document.querySelectorAll('.stat').forEach(stat => {
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const n = e.target.querySelector('.stat-n');
        if (!n || n.dataset.counted) return;
        n.dataset.counted = '1';
        countUp(n);
      });
    }, { threshold: 0.7 }).observe(stat);
  });
})();


/* ──────────────────────────────────────────
   12. BRAND CARD MONOGRAM BOUNCE
   ────────────────────────────────────────── */
(function () {
  document.querySelectorAll('.brand-card').forEach(card => {
    const mono = card.querySelector('.bm');
    if (!mono) return;
    card.addEventListener('mouseenter', () => {
      mono.style.transform  = 'scale(1.18)';
      mono.style.transition = 'transform .4s cubic-bezier(.34,1.56,.64,1)';
    });
    card.addEventListener('mouseleave', () => {
      mono.style.transform  = '';
      mono.style.transition = 'transform .3s ease';
    });
  });
})();


/* ──────────────────────────────────────────
   13. CURSOR GLOW  (desktop only)
   ────────────────────────────────────────── */
(function () {
  if (!window.matchMedia('(pointer:fine)').matches) return;
  const glow = document.createElement('div');
  Object.assign(glow.style, {
    position:     'fixed',
    pointerEvents:'none',
    zIndex:       '0',
    width:        '320px',
    height:       '320px',
    borderRadius: '50%',
    background:   'radial-gradient(circle, rgba(237,29,79,.05) 0%, transparent 70%)',
    transform:    'translate(-50%,-50%)',
    transition:   'left .1s ease, top .1s ease',
    mixBlendMode: 'multiply',
    top: '-999px',
    left: '-999px',
  });
  document.body.appendChild(glow);
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
})();


/* ──────────────────────────────────────────
   LOG
   ────────────────────────────────────────── */
console.log('%cTechHome Audio 🎵', 'font-size:1.2rem;font-weight:700;color:#ed1d4f;font-family:Georgia,serif;');
console.log('%c"New way to play" — Cách mới để nghe', 'font-size:.8rem;color:#888;');
