/* ==========================================================================
   RKB / Балс — общий каркас: шапка, меню, выпадающие списки, поп-апы, формы
   Подключается на каждой странице. Данные берутся из config.js.
   ========================================================================== */
(function () {
  'use strict';

  var LINKS = window.RKB_LINKS || {};
  var CONFIG = window.RKB_CONFIG || {};
  var MAILTO = CONFIG.mailto || 'bnd@rkb.ru';

  /* ---------------------------------------------------------------- utils */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /**
   * Ссылка из реестра. Пустое значение -> null, чтобы кнопку можно было
   * превратить в заглушку и не вести пользователя на несуществующий адрес.
   */
  function href(key) {
    var v = LINKS[key];
    return (typeof v === 'string' && v.trim()) ? v.trim() : null;
  }
  window.rkbHref = href;

  /* Текущий путь без имени файла: /about/ , / , /contest/ */
  var path = window.location.pathname;
  var depth = (path.match(/\//g) || []).length - 1;
  var root = path.indexOf('/') === 0 ? '/' : '';
  /* Корень сайта считаем по <base> если задан, иначе по абсолютному пути.
     Local <base href> уже проставлен в каждой странице, читаем его. */
  var baseEl = document.querySelector('base');
  var BASE = baseEl ? baseEl.getAttribute('href') : root;

  function url(p) { return (BASE || '/') + p; }

  /* ------------------------------------------------------------ меню/шапка */
  var NAV = [
    { label: 'О компании', href: 'about/' },
    { label: 'Каталог', href: 'catalog/' },
    { label: 'Отрасли', href: 'industries/' },
    { label: 'Доставка', href: 'delivery/' },
    { label: 'Документы', href: 'documents/' },
    { label: 'Проекты', href: 'projects/' },
    { label: 'Новости', href: 'news/' },
    {
      label: 'Поставщикам', href: 'suppliers/', children: [
        { key: 'supplierCable', title: 'Поставщикам кабельно-проводниковой и электротехнической продукции' },
        { key: 'supplierTransport', title: 'Транспортным компаниям' },
        { key: 'supplierPackaging', title: 'Тара и упаковка для кабеля и электротехнической продукции', note: 'Барабаны, паллеты, стрейч, маты и пр.' },
        { key: 'supplierServices', title: 'Прочие услуги' },
        { key: 'supplierGoods', title: 'Прочие товары' }
      ]
    },
    { label: 'Контакты', href: 'contacts/' }
  ];

  var LOGO_SVG =
    '<svg viewBox="0 0 167.94 32.51" role="img" aria-label="Балс" focusable="false">' +
    '<path d="M44.7 32.15l30.66 0c5.65,0 9.98,-1.47 9.98,-8.52 0,-4.85 -1.6,-7.15 -5.91,-7.68l0 -0.14c2.76,-0.8 4.76,-1.86 4.76,-7.37 0,-6.3 -3.97,-8.44 -11.84,-8.44l-27.65 0 0 32.15zm9.41 -12.74l17.69 0c2.14,0 3.55,0.64 3.55,2.82 0,2 -1.42,2.5 -3.55,2.5l-17.69 0 0 -5.32zm0 -11.98l17.47 0c1.82,0 2.89,0.82 2.89,2.68 0,1.82 -1.07,2.8 -2.89,2.8l-17.47 0 0 -5.48z"/>' +
    '<path d="M89.35 26.07c0,5.33 3.33,6.49 8.53,6.44l5.83 0c4.27,0 5.16,-0.48 7.51,-2.93l0 2.57 8.09 0 0 -14.87c0,-5.33 -3.11,-8.12 -8.98,-8.12l-9.91 0c-7.2,0 -10.23,1.02 -10.23,7.15l8.27 0c0.09,-1.6 0.81,-1.82 3.29,-1.82l5.02 0c3.34,0 4,0.8 4,3.01l0 2c-1.65,-1.69 -4.22,-1.82 -8.89,-1.82 -8.27,0 -12.54,0.36 -12.54,6.53l0.01 1.86zm12.76 1.11c-3.33,0 -4.49,-0.58 -4.49,-2.04 0,-1.86 0.76,-2.67 4.35,-2.67l3.78 0.01c4.71,0 5.2,0.62 5.2,2.3 0,1.51 -0.53,2.4 -6.4,2.4l-2.44 0z"/>' +
    '<polygon points="124.09,32.15 132.62,32.15 132.62,0.01 124.09,0.01"/>' +
    '<path d="M136.96 25.1c0,5.59 2.88,7.41 10.75,7.41l8.09 0c9.74,0 12.14,-1.55 12.14,-7.55 0,-4.04 -0.75,-7.46 -10.98,-7.46l-5.91 0c-4.44,0 -5.11,-0.36 -5.11,-1.33 0,-1.55 0.93,-1.69 5.87,-1.69 5.11,0 5.91,0.22 6.36,1.55l8.53 0c-0.09,-5.33 -2.04,-6.88 -13.21,-6.88l-5.95 0c-5.87,0 -10.41,0.84 -10.41,6.48 0,6.22 2.36,7.96 10.32,8l8 0c3.02,0 3.69,0.53 3.69,1.86 0,1.38 -1.03,1.69 -5.07,1.69l-3.02 0c-4.84,0 -5.29,-0.84 -5.29,-2.08l-8.8 0z"/>' +
    '<polygon points="0.01,5.17 19.17,5.17 19.17,0.01 0.01,0.01"/>' +
    '<polygon points="12.99,11.92 32.15,11.92 32.15,6.76 12.99,6.76" fill="var(--red)"/>' +
    '<polygon points="12.99,25.42 32.15,25.42 32.15,20.25 12.99,20.25" fill="var(--red)"/>' +
    '<polygon points="0.01,32.15 19.17,32.15 19.17,26.99 0.01,26.99"/>' +
    '<polygon points="0,18.67 19.16,18.67 19.16,13.5 0,13.5"/>' +
    '</svg>';

  var ICON_ARROW = '<svg class="icon icon-stroke" viewBox="0 0 8 4" aria-hidden="true"><path d="M1 1l3 2 3-2"/></svg>';
  var ICON_ARROW_UP = '<svg class="icon icon-stroke" viewBox="0 0 11 11" aria-hidden="true"><path d="M10.4 10.4V.5M10.4.5H.5M10.4.5L.5 10.4"/></svg>';

  /* Активная страница: сравниваем папку в первом сегменте пути */
  function isActive(hrefRel) {
    var seg = hrefRel.split('/')[0];
    if (!seg) return false;
    var here = path.replace(/index\.html$/, '');
    return here.indexOf('/' + seg + '/') !== -1;
  }

  function isExternal(u) { return /^(https?:)?\/\//.test(u); }

  function dropdownItem(child) {
    var h = href(child.key);
    var note = child.note ? '<small>' + child.note + '</small>' : '';
    var cls = 'dropdown-link' + (h ? '' : ' is-placeholder');
    if (!h) {
      return '<a class="' + cls + '" href="#" data-link-key="' + child.key + '" data-placeholder="1">' +
        child.title + note + '</a>';
    }
    return '<a class="' + cls + '" href="' + esc(h) + '" data-link-key="' + child.key + '" target="_blank" rel="noopener">' +
      child.title + note + '</a>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  window.rkbEsc = esc;

  function renderHeader() {
    var host = $('#site-header');
    if (!host) return;

    var items = NAV.map(function (it) {
      var active = isActive(it.href) ? ' aria-current="page"' : '';
      if (it.children) {
        var sub = it.children.map(dropdownItem).join('');
        return '<li class="header-menu-item has-children">' +
          '<a class="header-menu-link" href="' + url(it.href) + '"' + active + ' aria-haspopup="true">' +
          it.label + ICON_ARROW + '</a>' +
          '<div class="header-dropdown" role="menu">' + sub + '</div>' +
          '</li>';
      }
      return '<li class="header-menu-item"><a class="header-menu-link" href="' + url(it.href) + '"' + active + '>' + it.label + '</a></li>';
    }).join('');

    host.innerHTML =
      '<header class="main-header">' +
        '<div class="wrapper header-inner">' +
          '<div class="header-logo-wrapper">' +
            '<a class="header-logo" href="' + url('') + '" aria-label="Балс — на главную">' + LOGO_SVG + '</a>' +
            '<div class="header-slogan">Просто<br>Удобно<br>Надёжно</div>' +
          '</div>' +
          '<a class="header-catalog-button button gray-button" href="' + url('catalog/') + '">' +
            '<span>Каталог</span>' +
            '<svg class="icon icon-stroke" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 3h12M1 7h12M1 11h12"/></svg>' +
          '</a>' +
          '<nav class="header-nav" aria-label="Основное меню">' +
            '<ul class="header-menu">' + items + '</ul>' +
          '</nav>' +
          '<div class="header-contacts">' +
            '<a href="tel:+79160941120">+7 (916) 094-11-20</a>' +
            '<a href="mailto:' + MAILTO + '">' + MAILTO + '</a>' +
          '</div>' +
          '<div class="header-buttons">' +
            '<button class="header-write-us button" type="button" data-open-modal="write-us">Написать нам</button>' +
            '<button class="header-burger" type="button" id="burger" aria-label="Открыть меню" aria-expanded="false"><span></span></button>' +
          '</div>' +
        '</div>' +
      '</header>' +
      renderMobileMenu();
  }

  function renderMobileMenu() {
    var groups = NAV.map(function (it) {
      if (!it.children) {
        return '<li><a href="' + url(it.href) + '">' + it.label + '</a></li>';
      }
      var subs = it.children.map(function (c) {
        var h = href(c.key);
        return h
          ? '<li><a href="' + esc(h) + '" target="_blank" rel="noopener">' + c.title + '</a></li>'
          : '<li><a href="#" data-link-key="' + c.key + '" data-placeholder="1">' + c.title + '</a></li>';
      }).join('');
      return '<li><a href="' + url(it.href) + '">' + it.label + '</a>' +
        '<div class="mobile-menu-group-title">Анкеты поставщиков</div><ul class="sub">' + subs + '</ul></li>';
    }).join('');

    return '<div class="mobile-menu" id="mobile-menu">' +
      '<div class="mobile-menu-panel">' +
        '<div class="mobile-menu-head">' +
          '<div class="h3" style="font-size:20px">Меню</div>' +
          '<button class="mobile-menu-close" type="button" id="mobile-menu-close" aria-label="Закрыть меню">×</button>' +
        '</div>' +
        '<ul class="mobile-menu-list">' + groups +
          '<li><a href="' + url('quote/') + '">Заказать / посчитать</a></li>' +
          '<li><a href="' + url('partners/') + '">Заработать с РКБ</a></li>' +
          '<li><a href="' + url('contest/') + '">Конкурс</a></li>' +
        '</ul>' +
        '<div class="mobile-menu-footer">' +
          '<a href="tel:+79160941120">+7 (916) 094-11-20</a>' +
          '<a href="mailto:' + MAILTO + '">' + MAILTO + '</a>' +
          '<button class="button" type="button" data-open-modal="write-us">Написать нам</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderFooter() {
    var host = $('#site-footer');
    if (!host) return;

    var nav = [
      ['Каталог', 'catalog/'],
      ['О компании', 'about/'],
      ['Отрасли', 'industries/'],
      ['Доставка', 'delivery/'],
      ['Документы', 'documents/'],
      ['Проекты', 'projects/'],
      ['Новости', 'news/'],
      ['Контакты', 'contacts/'],
      ['Поставщикам', 'suppliers/'],
      ['Заработать с РКБ', 'partners/'],
      ['Конкурс', 'contest/'],
      ['Заказать / посчитать', 'quote/']
    ].map(function (p) {
      return '<li><a href="' + url(p[1]) + '">' + p[0] + '</a></li>';
    }).join('');

    host.innerHTML =
      '<footer class="main-footer">' +
        '<div class="wrapper">' +
          '<div class="footer-top">' +
            '<div>' +
              '<div class="footer-logo-wrapper">' +
                '<span class="footer-logo">' + LOGO_SVG + '</span>' +
                '<div class="footer-slogan">Просто<br>Удобно<br>Надёжно</div>' +
              '</div>' +
              '<p class="footer-description">Оптовые поставки кабельно-проводниковой и электротехнической продукции. Подбор по спецификации, отгрузка со склада, доставка по России.</p>' +
            '</div>' +
            '<div>' +
              '<div class="footer-title">Контакты</div>' +
              '<div class="footer-contacts-item"><a href="tel:+79160941120">+7 (916) 094-11-20</a></div>' +
              '<div class="footer-contacts-item"><a href="mailto:' + MAILTO + '">' + MAILTO + '</a></div>' +
              '<div class="footer-contacts-item"><address>Москва,<br>представительство «Балс»</address></div>' +
            '</div>' +
            '<div>' +
              '<div class="footer-title">Навигация</div>' +
              '<ul class="footer-menu-list">' + nav + '</ul>' +
            '</div>' +
          '</div>' +
          '<div class="footer-bottom">' +
            '<div class="footer-disclaimer">Информация на сайте носит справочный характер и не является публичной офертой, определяемой положениями ст.&nbsp;437&nbsp;(2)&nbsp;ГК&nbsp;РФ.</div>' +
            '<div class="footer-copyright">© Балс. Все права защищены</div>' +
            '<div><a href="' + url('privacy/') + '">Политика конфиденциальности</a></div>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  /* ------------------------------------------------------------ поп-апы */
  var lastFocused = null;

  function openModal(id, trigger) {
    var el = document.getElementById(id);
    if (!el) return;
    lastFocused = trigger || document.activeElement;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var focusable = el.querySelector('input:not([type=hidden]), textarea, button');
    if (focusable) setTimeout(function () { focusable.focus(); }, 60);
  }

  function closeModal(el) {
    if (!el) return;
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  window.rkbOpenModal = openModal;
  window.rkbCloseModal = closeModal;

  function initModals() {
    document.addEventListener('click', function (e) {
      var opener = e.target.closest('[data-open-modal]');
      if (opener) {
        e.preventDefault();
        openModal(opener.getAttribute('data-open-modal'), opener);
        return;
      }
      var closer = e.target.closest('[data-close-modal]');
      if (closer) {
        e.preventDefault();
        closeModal(closer.closest('.overlay'));
        return;
      }
      if (e.target.classList && e.target.classList.contains('overlay')) {
        closeModal(e.target);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var open = $$('.overlay.is-open');
        open.forEach(closeModal);
        closeMobileMenu();
      }
      /* Простой фокус-трап внутри открытого поп-апа */
      if (e.key === 'Tab') {
        var overlay = $('.overlay.is-open');
        if (!overlay) return;
        var f = $$('a[href], button, input:not([type=hidden]), textarea, select, [tabindex]:not([tabindex="-1"])', overlay)
          .filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* --------------------------------------------------------- мобильное меню */
  function openMobileMenu() {
    var m = $('#mobile-menu');
    if (!m) return;
    m.classList.add('is-open');
    var b = $('#burger');
    if (b) b.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileMenu() {
    var m = $('#mobile-menu');
    if (!m || !m.classList.contains('is-open')) return;
    m.classList.remove('is-open');
    var b = $('#burger');
    if (b) b.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  /* ------------------------------------------------------------- формы */
  function fileSizeLabel(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + ' МБ';
  }

  function initForms() {
    $$('form[data-form]').forEach(function (form) {
      var kind = form.getAttribute('data-form');
      var notice = $('.form-notice', form);
      var fileInput = $('input[type=file]', form);
      var fileList = $('.file-list', form);

      if (fileInput && fileList) {
        fileInput.addEventListener('change', function () {
          var files = Array.prototype.slice.call(this.files);
          fileList.textContent = files.length
            ? files.map(function (f) { return f.name + ' (' + fileSizeLabel(f.size) + ')'; }).join(' · ')
            : '';
        });
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!notice) return;
        notice.className = 'form-notice';

        /* Валидация минимальная: required-поля браузер проверил сам */
        var files = fileInput ? Array.prototype.slice.call(fileInput.files) : [];
        var maxMb = CONFIG.maxFileMb || 10;
        var tooBig = files.find(function (f) { return f.size > maxMb * 1024 * 1024; });
        if (tooBig) {
          notice.classList.add('show', 'err');
          notice.textContent = 'Файл «' + tooBig.name + '» больше ' + maxMb + ' МБ. Уменьшите его размер и попробуйте снова.';
          return;
        }

        var data = new FormData(form);
        if (CONFIG.n8nWebhook) {
          var btn = form.querySelector('[type=submit]');
          btn.disabled = true;
          fetch(CONFIG.n8nWebhook, { method: 'POST', body: data })
            .then(function (r) {
              if (!r.ok) throw new Error('HTTP ' + r.status);
              notice.classList.add('show', 'ok');
              notice.textContent = 'Заявка отправлена. Спасибо! Мы свяжемся с вами.';
              form.reset();
              if (fileList) fileList.textContent = '';
            })
            .catch(function () {
              notice.classList.add('show', 'err');
              notice.textContent = 'Не удалось отправить заявку. Напишите нам на ' + MAILTO + '.';
            })
            .finally(function () { btn.disabled = false; });
          return;
        }

        /* Пока n8n не подключён — письмо через почтовый клиент */
        var lines = [];
        data.forEach(function (v, k) {
          if (v instanceof File) return;
          if (k === 'attachment') return;
          lines.push(k + ': ' + v);
        });
        lines.push('Вложения: ' + (files.length
          ? files.map(function (f) { return f.name; }).join(', ') + ' (приложите к письму вручную)'
          : 'нет'));
        lines.push('Страница: ' + (kind || 'заявка'));

        var subject = encodeURIComponent('Заявка с сайта Балс — ' + (data.get('name') || kind || ''));
        var body = encodeURIComponent(lines.join('\n'));
        notice.classList.add('show', 'ok');
        notice.textContent = 'Сейчас откроется ваше почтовое приложение. Вложенные файлы нужно добавить к письму вручную — автоматическая отправка появится вместе с сервером обработки заявок.';
        window.location.href = 'mailto:' + MAILTO + '?subject=' + subject + '&body=' + body;
      });
    });
  }

  /* ------------------------------------------------- плавные якоря/аккордеоны */
  function initAccordions() {
    document.addEventListener('click', function (e) {
      var head = e.target.closest('.accordion-head');
      if (!head) return;
      var acc = head.closest('.accordion');
      var open = acc.classList.toggle('is-open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ----------------------------------------- выпадашка «Поставщикам» в hero */
  function initHeroDropdown() {
    var dd = $('.hero-dropdown');
    if (!dd) return;
    var btn = dd.querySelector('.button');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      /* На мобильном кнопка раскрывает список, а не уводит со страницы */
      if (window.matchMedia('(max-width: 700px)').matches) {
        e.preventDefault();
        dd.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', dd.classList.contains('is-open') ? 'true' : 'false');
      }
    });
    document.addEventListener('click', function (e) {
      if (!dd.contains(e.target)) {
        dd.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ------------------------------------- заглушки внешних ссылок (реестр) */
  function initPlaceholders() {
    document.addEventListener('click', function (e) {
      var ph = e.target.closest('[data-placeholder="1"]');
      if (!ph) return;
      e.preventDefault();
      var key = ph.getAttribute('data-link-key');
      if (window.rkbToast) window.rkbToast('Ссылка на анкету (' + key + ') ещё не подключена. Пришлём адрес — вставим в config.js.');
    });
  }

  /* Легкое всплывающее уведомление */
  function toast(msg) {
    var t = document.getElementById('rkb-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'rkb-toast';
      t.setAttribute('role', 'status');
      t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:400;max-width:min(520px,92vw);padding:14px 20px;border-radius:10px;background:#222;color:#fff;font-size:14px;line-height:1.5;box-shadow:0 14px 40px #00000040;opacity:0;transition:opacity .2s';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(function () { t.style.opacity = '1'; });
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.style.opacity = '0'; }, 4200);
  }
  window.rkbToast = toast;

  /* ----------------------------------------------------------- cookie-баннер */
  function initCookie() {
    var key = 'rkb-cookie-ok';
    var banner = $('#cookie-banner');
    if (!banner) return;
    if (!localStorage.getItem(key)) banner.classList.add('is-open');
    banner.addEventListener('click', function (e) {
      if (e.target.closest('[data-cookie-ok]')) {
        localStorage.setItem(key, '1');
        banner.classList.remove('is-open');
      }
    });
  }

  /* ------------------------------------------------------------- инициализация */
  function init() {
    renderHeader();
    renderFooter();
    initModals();
    initForms();
    initAccordions();
    initHeroDropdown();
    initPlaceholders();
    initCookie();

    var burger = $('#burger');
    if (burger) burger.addEventListener('click', openMobileMenu);
    var mc = $('#mobile-menu-close');
    if (mc) mc.addEventListener('click', closeMobileMenu);
    var mm = $('#mobile-menu');
    if (mm) mm.addEventListener('click', function (e) { if (e.target === mm) closeMobileMenu(); });

    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
