/* BookStore — слайдер блога */
(function () {
  "use strict";

  var slider = document.querySelector("[data-slider]");
  if (!slider) return;

  var track = slider.querySelector(".slider-track");
  var slides = Array.prototype.slice.call(track.children);
  var prevBtn = document.querySelector("[data-prev]");
  var nextBtn = document.querySelector("[data-next]");
  var dotsBox = document.querySelector("[data-dots]");
  var index = 0;

  function perView() {
    var w = window.innerWidth;
    if (w <= 680) return 1;
    if (w <= 1080) return 2;
    return 3;
  }

  function maxIndex() {
    return Math.max(0, slides.length - perView());
  }

  function step() {
    if (slides.length < 2) return 0;
    var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    return slides[0].getBoundingClientRect().width + gap;
  }

  function buildDots() {
    if (!dotsBox) return;
    dotsBox.innerHTML = "";
    for (var i = 0; i <= maxIndex(); i++) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Слайд " + (i + 1));
      dot.dataset.index = i;
      dot.addEventListener("click", function () {
        index = Number(this.dataset.index);
        update();
      });
      dotsBox.appendChild(dot);
    }
  }

  function update() {
    if (index > maxIndex()) index = maxIndex();
    if (index < 0) index = 0;

    track.style.transform = "translateX(" + (-index * step()) + "px)";

    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index >= maxIndex();

    if (dotsBox) {
      Array.prototype.forEach.call(dotsBox.children, function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }
  }

  function go(delta) {
    index += delta;
    update();
  }

  if (prevBtn) prevBtn.addEventListener("click", function () { go(-1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { go(1); });

  slider.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });

  /* свайп на тач-устройствах */
  var startX = null;
  slider.addEventListener("touchstart", function (e) {
    startX = e.touches[0].clientX;
  }, { passive: true });
  slider.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
    startX = null;
  });

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      buildDots();
      update();
    }, 150);
  });

  buildDots();
  update();
})();

/* ============ Модальные окна: регистрация и вход ============ */
(function () {
  "use strict";

  var registerModal = document.getElementById("register-modal");
  var loginModal = document.getElementById("login-modal");
  var modals = [registerModal, loginModal].filter(Boolean);
  if (!modals.length) return;

  function openModal(modal) {
    modals.forEach(function (m) {
      if (m !== modal) {
        m.classList.remove("open");
        m.hidden = true;
      }
    });
    modal.hidden = false;
    modal.classList.add("open");
    document.body.classList.add("modal-open");
    var first = modal.querySelector("input");
    if (first) setTimeout(function () { first.focus(); }, 60);
  }

  function closeModal(modal) {
    modal.classList.remove("open");
    modal.hidden = true;
    var anyOpen = modals.some(function (m) { return m.classList.contains("open"); });
    if (!anyOpen) document.body.classList.remove("modal-open");
  }

  function openTrigger(e) {
    if (e) e.preventDefault();
    if (this.hasAttribute("data-open-login")) openModal(loginModal);
    else if (this.hasAttribute("data-open-register")) openModal(registerModal);
  }

  /* кнопки-триггеры: шапка, ссылки внутри блоков и внутри окон */
  Array.prototype.forEach.call(
    document.querySelectorAll("[data-open-register], [data-open-login]"),
    function (el) { el.addEventListener("click", openTrigger); }
  );

  /* закрытие: крестик и затемнение */
  modals.forEach(function (modal) {
    Array.prototype.forEach.call(
      modal.querySelectorAll("[data-close-modal]"),
      function (el) { el.addEventListener("click", function () { closeModal(modal); }); }
    );
  });

  /* Esc закрывает открытое окно */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var opened = modals.filter(function (m) { return m.classList.contains("open"); })[0];
    if (opened) closeModal(opened);
  });

  /* отправка формы: короткий отклик и закрытие окна */
  modals.forEach(function (modal) {
    var form = modal.querySelector("form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('button[type="submit"]');
      if (!submitBtn) return;
      var original = submitBtn.textContent;
      submitBtn.textContent = modal === loginModal ? "Добро пожаловать!" : "Готово! Проверьте почту";
      submitBtn.disabled = true;
      setTimeout(function () {
        submitBtn.textContent = original;
        submitBtn.disabled = false;
        form.reset();
        closeModal(modal);
      }, 1600);
    });
  });
})();

/* ============ Блок «Книги недели»: переключение каталога ============ */
(function () {
  "use strict";

  var btn = document.querySelector("[data-catalog-toggle]");
  var grid = document.querySelector(".book-grid");
  if (!btn || !grid) return;

  var labelDefault = btn.textContent;
  var labelCollapsed = "Свернуть";

  btn.addEventListener("click", function () {
    var open = grid.classList.toggle("is-open");
    btn.textContent = open ? labelCollapsed : labelDefault;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) {
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
})();

/* ============ Появление блоков при прокрутке вниз ============ */
(function () {
  "use strict";

  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var groups = [
    { type: "fade",  stagger: 0,  sel: ".section-head, .partners-note, .slider-dots, .books-cta" },
    { type: "left",  stagger: 0,  sel: ".hero-text, .about-text, .author-text, .register-card" },
    { type: "right", stagger: 0,  sel: ".hero-image, .about-image, .author-photo, .reviews-image" },
    { type: "up",    stagger: 90, sel: ".book-card, .quote-card, .partner-card, .post, .review, .footer-col, .hero-features li, .author-stats div, .acc-item" }
  ];

  function reveal(el) {
    var done = function () {
      el.classList.remove("reveal", "is-visible", "reveal-up", "reveal-fade", "reveal-left", "reveal-right");
      el.style.animationDelay = "";
      el.removeEventListener("animationend", done);
    };
    el.addEventListener("animationend", done);
    el.classList.add("is-visible");
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  groups.forEach(function (group) {
    Array.prototype.forEach.call(document.querySelectorAll(group.sel), function (el) {
      if (el.classList.contains("reveal")) return;
      el.classList.add("reveal", "reveal-" + group.type);
      if (group.stagger) {
        var i = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.animationDelay = Math.min(i, 6) * group.stagger + "ms";
      }
      observer.observe(el);
    });
  });
})();

/* ============ Аккордеон «Вопросы и ответы» ============ */
(function () {
  "use strict";

  var root = document.querySelector("[data-accordion]");
  if (!root) return;

  var items = Array.prototype.slice.call(root.querySelectorAll(".acc-item"));

  function setOpen(item, open) {
    var head = item.querySelector(".acc-head");
    var body = item.querySelector(".acc-body");
    item.classList.toggle("open", open);
    head.setAttribute("aria-expanded", open ? "true" : "false");
    if (!body) return;
    if (open) {
      body.style.maxHeight = body.scrollHeight + "px";
    } else {
      body.style.maxHeight = null;
    }
  }

  items.forEach(function (item) {
    var head = item.querySelector(".acc-head");
    var body = item.querySelector(".acc-body");
    if (!head || !body) return;

    if (item.classList.contains("open")) setOpen(item, true);

    head.addEventListener("click", function () {
      var willOpen = !item.classList.contains("open");
      items.forEach(function (other) {
        if (other !== item) setOpen(other, false);
      });
      setOpen(item, willOpen);
    });
  });

  window.addEventListener("resize", function () {
    items.forEach(function (item) {
      if (item.classList.contains("open")) {
        var body = item.querySelector(".acc-body");
        if (body) body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });
})();

/* ============ Отзывы: кнопка «Читать дальше» ============ */
(function () {
  "use strict";

  var list = document.querySelector(".reviews-cards");
  var btn = document.querySelector("[data-reviews-next]");
  if (!list || !btn) return;

  var reviews = Array.prototype.slice.call(list.querySelectorAll(".review"));
  var perPage = 2;
  var pages = Math.ceil(reviews.length / perPage);
  var page = 0;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clearAnim(review) {
    review.classList.remove("reveal", "is-visible", "reveal-up", "reveal-fade", "reveal-left", "reveal-right", "swap-in");
    review.style.animationDelay = "";
  }

  function show(next) {
    page = next;

    reviews.forEach(function (review, i) {
      clearAnim(review);
      review.classList.toggle("is-extra", Math.floor(i / perPage) !== page);
    });

    if (calm) return;

    reviews.forEach(function (review, i) {
      if (review.classList.contains("is-extra")) return;
      var delay = (i % perPage) * 80;
      review.style.animationDelay = delay + "ms";
      review.classList.add("swap-in");
      window.setTimeout(function () {
        review.classList.remove("swap-in");
        review.style.animationDelay = "";
      }, 700 + delay);
    });
  }

  if (pages < 2) {
    btn.parentNode.remove();
    return;
  }

  btn.addEventListener("click", function () {
    show((page + 1) % pages);
  });
})();

/* ============ Переключение темы (светлая / тёмная) ============ */
(function () {
  "use strict";

  var root = document.documentElement;
  var btn = document.querySelector("[data-theme-toggle]");
  var meta = document.querySelector('meta[name="theme-color"]');
  var KEY = "bookstore-theme";

  function current() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function sync(theme) {
    var dark = theme === "dark";
    if (btn) {
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.setAttribute("aria-label", dark ? "Включить светлую тему" : "Включить тёмную тему");
      btn.setAttribute("title", dark ? "Светлая тема" : "Тёмная тема");
    }
    if (meta) meta.setAttribute("content", dark ? "#0B1220" : "#1B3764");
  }

  sync(current());

  if (!btn) return;

  btn.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    sync(next);
    try {
      localStorage.setItem(KEY, next);
    } catch (e) {}
  });

  // если пользователь ещё не выбирал тему — следуем системной настройке
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onSystemChange = function (event) {
      var saved = null;
      try {
        saved = localStorage.getItem(KEY);
      } catch (e) {}
      if (saved) return;
      root.setAttribute("data-theme", event.matches ? "dark" : "light");
      sync(current());
    };
    if (mq.addEventListener) mq.addEventListener("change", onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);
  }
})();

/* ============ Скрывающийся хедер при прокрутке ============ */
(function () {
  "use strict";

  var nav = document.querySelector('.nav');
  if (!nav) return;

  var lastY = window.scrollY || window.pageYOffset || 0;
  var hide = 0;
  var show = 0;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset || 0;

    if (y > 40) nav.classList.add('nav-solid');
    else nav.classList.remove('nav-solid');

    if (y < 5) {
      nav.classList.remove('nav-hidden');
      hide = 0; show = 0;
      lastY = y;
      return;
    }

    if (y > lastY) {
      hide += (y - lastY);
      show = 0;
      if (hide > 60) {
        nav.classList.add('nav-hidden');
        hide = 0;
      }
    } else if (y < lastY) {
      show += (lastY - y);
      hide = 0;
      if (show > 6) {
        nav.classList.remove('nav-hidden');
        show = 0;
      }
    }

    lastY = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ============ Мобильное меню ============ */
(function () {
  "use strict";

  var nav = document.querySelector('.nav');
  var btn = document.querySelector('[data-menu-toggle]');
  var menu = document.getElementById('site-menu');
  if (!nav || !btn || !menu) return;

  function setOpen(open) {
    nav.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }

  function isOpen() {
    return nav.classList.contains('menu-open');
  }

  btn.addEventListener('click', function () {
    setOpen(!isOpen());
  });

  /* клик по пункту или кнопке внутри меню закрывает панель */
  menu.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a, button')) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) setOpen(false);
  });

  document.addEventListener('click', function (e) {
    if (isOpen() && !nav.contains(e.target)) setOpen(false);
  });

  /* при автоскрытии шапки и переходе на десктоп меню закрываем */
  window.addEventListener('scroll', function () {
    if (isOpen() && nav.classList.contains('nav-hidden')) setOpen(false);
  }, { passive: true });

  window.addEventListener('resize', function () {
    if (isOpen() && window.innerWidth > 1080) setOpen(false);
  });
})();

