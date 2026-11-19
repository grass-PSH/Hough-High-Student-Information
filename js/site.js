/* Sitewright site script: menu, sticky header, animations, sliders, lightbox,
   counters and the contact form. No dependencies; safe to load on every page. */
(function () {
  'use strict';
  window.SW_READY = true;
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); };

  // ── header ──
  var header = doc.querySelector('.sw-header');
  if (header) {
    var burger = header.querySelector('.sw-burger');
    var setOpen = function (open) {
      header.classList.toggle('sw-nav-open', open);
      if (burger) {
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      }
    };
    if (burger) burger.addEventListener('click', function () { setOpen(!header.classList.contains('sw-nav-open')); });
    $$('.sw-nav a', header).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    var onScroll = function () { header.classList.toggle('sw-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── entrance animations ──
  var animated = $$('[data-anim]');
  if (animated.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      animated.forEach(function (el) { el.classList.add('sw-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('sw-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      animated.forEach(function (el) { io.observe(el); });
    }
  }

  // ── counters ──
  var counters = $$('[data-count]');
  var runCounter = function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (!isFinite(target)) return;
    var decimals = (String(el.getAttribute('data-count')).split('.')[1] || '').length;
    var start = null, dur = 1600;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // ── sliders ──
  $$('.sw-slider').forEach(function (slider) {
    var track = slider.querySelector('.sw-slides');
    var slides = $$('.sw-slide', slider);
    var dots = $$('.sw-sl-dots button', slider);
    if (!track || slides.length < 2) return;
    var i = 0, timer = null;
    var interval = parseFloat(slider.getAttribute('data-autoplay')) || 0;
    var go = function (n) {
      i = (n + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-100 * i) + '%)';
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
    };
    var play = function () {
      if (!interval || reduce) return;
      clearInterval(timer);
      timer = setInterval(function () { go(i + 1); }, interval * 1000);
    };
    var prev = slider.querySelector('.sw-sl-prev'), next = slider.querySelector('.sw-sl-next');
    if (prev) prev.addEventListener('click', function () { go(i - 1); play(); });
    if (next) next.addEventListener('click', function () { go(i + 1); play(); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); play(); }); });
    slider.addEventListener('mouseenter', function () { clearInterval(timer); });
    slider.addEventListener('mouseleave', play);
    var x0 = null;
    slider.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { go(dx < 0 ? i + 1 : i - 1); play(); }
      x0 = null;
    });
    play();
  });

  // ── lightbox ──
  var groups = $$('.sw-gallery');
  groups.forEach(function (g) {
    var items = $$('a[data-lightbox]', g);
    items.forEach(function (a, idx) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openLightbox(items, idx);
      });
    });
  });
  function openLightbox(items, idx) {
    var box = doc.createElement('div');
    box.className = 'sw-lb';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<img alt=""><div class="sw-lb-cap"></div><button class="sw-lb-close" aria-label="Close">&times;</button>' +
      (items.length > 1 ? '<button class="sw-lb-prev" aria-label="Previous">&#8249;</button><button class="sw-lb-next" aria-label="Next">&#8250;</button>' : '');
    var im = box.querySelector('img'), cap = box.querySelector('.sw-lb-cap');
    var show = function (n) {
      idx = (n + items.length) % items.length;
      im.src = items[idx].getAttribute('href');
      var inner = items[idx].querySelector('img');
      im.alt = inner ? inner.alt : '';
      cap.textContent = items[idx].getAttribute('data-caption') || '';
    };
    var close = function () {
      box.classList.remove('is-open');
      doc.removeEventListener('keydown', key);
      setTimeout(function () { box.remove(); }, 250);
    };
    var key = function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    };
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.classList.contains('sw-lb-close')) close();
      else if (e.target.classList.contains('sw-lb-prev')) show(idx - 1);
      else if (e.target.classList.contains('sw-lb-next')) show(idx + 1);
    });
    doc.addEventListener('keydown', key);
    show(idx);
    doc.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add('is-open'); });
    box.querySelector('.sw-lb-close').focus();
  }

  // ── contact forms ──
  $$('form.sw-form').forEach(function (form) {
    var status = form.querySelector('.sw-form-status');
    var say = function (msg, ok) {
      if (!status) return;
      status.textContent = msg;
      status.className = 'sw-form-status ' + (ok ? 'is-ok' : 'is-err');
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (location.protocol === 'file:') {
        say('The form sends messages once the site is uploaded to a web host with PHP.', false);
        return;
      }
      form.classList.add('is-busy');
      fetch(form.getAttribute('action') || 'contact.php', { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          return r.text().then(function (t) {
            var data = null;
            try { data = JSON.parse(t); } catch (err) { /* not JSON: PHP missing */ }
            if (!data) throw new Error('This host does not run PHP, so the form cannot send email here.');
            if (!r.ok || !data.ok) throw new Error(data.error || 'Sorry, your message could not be sent. Please try again.');
            return data;
          });
        })
        .then(function () {
          say(form.getAttribute('data-success') || 'Thank you! Your message has been sent.', true);
          form.reset();
        })
        .catch(function (err) { say(err.message || 'Network error. Please try again.', false); })
        .then(function () { form.classList.remove('is-busy'); });
    });
  });

  // Footer year stays current even if the site is never re-exported.
  $$('.sw-copy').forEach(function (el) {
    el.innerHTML = el.innerHTML.replace(/(©|&copy;)\s?\d{4}/, '$1 ' + new Date().getFullYear());
  });
  root.classList.add('sw-ready');
})();
