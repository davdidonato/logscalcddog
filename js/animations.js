/* ══════════════════════════════════════════════
   SCROLL REVEAL (IntersectionObserver)
   ══════════════════════════════════════════════ */
function initScrollReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  els.forEach((el) => observer.observe(el));
}

/* ══════════════════════════════════════════════
   ANIMATED NUMBER COUNTER
   ══════════════════════════════════════════════ */
function animateNumber(el, from, to, duration) {
  if (duration === undefined) duration = 600;
  const start = performance.now();
  const diff = to - from;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const current = Math.round(from + diff * eased);
    el.textContent = current.toLocaleString('en-US');

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

/* ══════════════════════════════════════════════
   CARD ENTRANCE ANIMATION
   ══════════════════════════════════════════════ */
function animateCards(container) {
  const cards = container.querySelectorAll('.result-card');
  cards.forEach((card) => {
    card.classList.remove('card-enter');
    // Force reflow
    void card.offsetWidth;
    card.classList.add('card-enter');
  });
}

/* ══════════════════════════════════════════════
   TOAST NOTIFICATION
   ══════════════════════════════════════════════ */
function showToast(message, duration) {
  if (duration === undefined) duration = 2000;
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(function () {
    toast.classList.remove('show');
  }, duration);
}

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', initScrollReveal);
