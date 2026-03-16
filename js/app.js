/* ══════════════════════════════════════════════
   APP INITIALIZATION
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  function init() {
    initStickyHeader();
    initSmoothScroll();
    initHamburger();
  }

  /* ── Sticky header shadow on scroll ── */
  function initStickyHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    function onScroll() {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Smooth scroll for nav links ── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = this.getAttribute('href');
        if (id === '#') return;
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });

          // Close mobile nav if open
          var navLinks = document.querySelector('.nav-links');
          if (navLinks) navLinks.classList.remove('open');
        }
      });
    });
  }

  /* ── Hamburger menu toggle ── */
  function initHamburger() {
    var btn = document.querySelector('.hamburger');
    var nav = document.querySelector('.nav-links');
    if (!btn || !nav) return;

    btn.addEventListener('click', function () {
      nav.classList.toggle('open');

      // Update aria
      var expanded = nav.classList.contains('open');
      btn.setAttribute('aria-expanded', expanded);
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!btn.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
