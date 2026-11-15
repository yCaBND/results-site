/* ==========================================================================
   RKB / Балс — небольшие скрипты для страниц-заглушек разделов
   ========================================================================== */
(function () {
  'use strict';
  var esc = window.rkbEsc || function (s) { return String(s == null ? '' : s); };

  /* ---------------- Список на страницах каталога/проектов ---------------- */
  function renderList(hostId, items, placeholder) {
    var host = document.getElementById(hostId);
    if (!host) return;
    if (!items || !items.length) {
      host.innerHTML = '<div class="info-note">' + esc(placeholder) + '</div>';
      return;
    }
    host.innerHTML = items.map(function (it) {
      return '<a class="link-tile" href="' + esc(it.href || '#') + '">' +
        '<svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        '<span>' + esc(it.title) + '</span></a>';
    }).join('');
  }

  /* ---------------- Каталог: плитки категорий ---------------- */
  function initCatalogPage() {
    var host = document.getElementById('catalog-categories');
    if (!host || !window.RKB_CATALOG) return;
    var data = window.RKB_CATALOG;

    host.innerHTML = data.brands.map(function (b) {
      return '<article class="card">' +
        '<div class="card-title">' + esc(b.brand) + '</div>' +
        '<p class="card-text">' + esc(b.insulation) + ' · ' + esc(b.gost) + '</p>' +
        '<p class="card-text" style="margin-top:10px">Сечения: ' + data.sections.join(', ') + ' мм²<br>' +
        'Жил: ' + data.cores.join(', ') + '<br>Напряжение: ' + data.voltages.join(', ') + '</p>' +
        '<a class="arrow-link" style="margin-top:16px" href="../quote/">Проверить наличие</a>' +
        '</article>';
    }).join('');
  }

  function init() {
    initCatalogPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
