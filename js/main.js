/* PK Accounting — shared page behaviour (vanilla, no dependencies) */
(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- preload splash: logo draws its double rule, then fades ---- */
  var splash = document.querySelector('.splash');
  if (splash) {
    var hide = function () { splash.classList.add('done'); document.body.classList.add('ready'); };
    if (reduce) hide();
    else {
      window.addEventListener('load', function () { setTimeout(hide, 650); });
      setTimeout(hide, 2600); // never hold the page hostage on slow mobile data
    }
  }

  /* ---- smart sticky header: shows on any upward scroll ---- */
  var header = document.querySelector('.site-header');
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('scrolled', y > 8);
      if (y > lastY && y > 240 && !(menu && menu.classList.contains('open'))) header.classList.add('hide');
      else if (y < lastY) header.classList.remove('hide');
    }
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---- mobile menu ---- */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    });
  }

  /* ---- scroll reveals ---- */
  var revealEls = document.querySelectorAll('.reveal, [data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- light 3D: service cards lean toward the cursor (desktop pointers only) ---- */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var raf = null;
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.transform = 'perspective(900px) rotateX(' + (-y * 5).toFixed(2) + 'deg) rotateY(' + (x * 6).toFixed(2) + 'deg) translateY(-4px)';
        });
      });
      card.addEventListener('pointerleave', function () {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = '';
      });
    });
  }

  /* ---- floating WhatsApp: shows its label once, after the visitor has scrolled a bit ---- */
  var wa = document.querySelector('.wa-float');
  if (wa) {
    var shown = false;
    window.addEventListener('scroll', function () {
      if (!shown && window.scrollY > 500) {
        shown = true; wa.classList.add('show-label');
        setTimeout(function () { wa.classList.remove('show-label'); }, 4200);
      }
    }, { passive: true });
  }

  /* ---- KRA deadline strip: highlight whichever due date comes next ---- */
  var strip = document.querySelector('[data-deadlines]');
  if (strip) {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    function nextMonthly(day) {
      var d = new Date(now.getFullYear(), now.getMonth(), day);
      if (d < now) d = new Date(now.getFullYear(), now.getMonth() + 1, day);
      return d;
    }
    function nextOf(months, day) { // months are 0-based
      for (var add = 0; add < 2; add++) {
        for (var i = 0; i < months.length; i++) {
          var d = new Date(now.getFullYear() + add, months[i], day);
          if (d >= now) return d;
        }
      }
    }
    var dates = {
      paye: nextMonthly(9),
      vat: nextMonthly(20),
      instalment: nextOf([3, 5, 8, 11], 20), // 20th of the 4th, 6th, 9th and 12th month (Dec year-end)
      itr: nextOf([5], 30)
    };
    var best = null;
    strip.querySelectorAll('[data-dl]').forEach(function (el) {
      var d = dates[el.getAttribute('data-dl')];
      var days = Math.round((d - now) / 864e5);
      var out = el.querySelector('[data-days]');
      if (out) out.textContent = days === 0 ? 'due today' : 'in ' + days + (days === 1 ? ' day' : ' days');
      if (!best || d < best.d) best = { d: d, el: el };
    });
    if (best) {
      best.el.classList.add('next');
      var b = document.createElement('span'); b.className = 'badge'; b.textContent = 'Next up';
      best.el.insertBefore(b, best.el.firstChild);
    }
  }

  /* ---- footer year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
