/* ==========================================================================
   RKB / Балс — демонстрационный каталог
   --------------------------------------------------------------------------
   ВАЖНО: это ДЕМО-данные для прототипа страницы «Заказать / посчитать».
   Остатки сгенерированы детерминированно и не являются реальными.
   Когда появится настоящий каталог:
     • либо замените массив ниже данными из Google Таблицы,
     • либо подгружайте его по API, не меняя разметку страницы.
   Формат записи:
     { brand, section, cores, voltage, insulation, availability, unit, qty }
   ========================================================================== */
(function () {
  'use strict';

  /* Марки из технического задания заказчика */
  var BRANDS = [
    { brand: 'АВБШВ',    insulation: 'ПВХ',                  gost: 'ГОСТ 31996-2012' },
    { brand: 'АСБл',     insulation: 'Бумажная, свинцовая оболочка', gost: 'ГОСТ 18410-73' },
    { brand: 'АСБ2л',    insulation: 'Бумажная, свинцовая оболочка', gost: 'ГОСТ 18410-73' },
    { brand: 'АПВПуг',   insulation: 'Полиэтилен сшитый',   gost: 'ГОСТ 31996-2012' },
    { brand: 'АПВБШП',   insulation: 'Полиэтилен сшитый',   gost: 'ГОСТ 31996-2012' },
    { brand: 'АПВБШП(г)', insulation: 'Полиэтилен сшитый, не распространяет горение', gost: 'ГОСТ 31996-2012' }
  ];

  var SECTIONS = [50, 70, 95, 120, 150, 185, 240, 300];
  var CORES = [1, 3, 4, 5];
  var VOLTAGES = ['1 кВ', '6 кВ', '10 кВ'];

  /* Детерминированный «псевдослучайный» остаток — нужен, чтобы таблица
     выглядела живой и при этом не менялась при каждой перезагрузке. */
  function seededQty(brand, section, cores, voltage) {
    var key = (brand + '|' + section + '|' + cores + '|' + voltage);
    var h = 0;
    for (var i = 0; i < key.length; i++) {
      h = ((h << 5) - h + key.charCodeAt(i)) | 0;
    }
    var v = Math.abs(h) % 100;
    if (v < 18) return 0;               /* нет на складе -> под заказ */
    if (v < 35) return 50 + (v % 5) * 25; /* мало */
    return 100 + ((v * 37) % 900);        /* в наличии */
  }

  function availability(qty) {
    if (qty === 0) return { key: 'order', label: 'Под заказ' };
    if (qty < 200) return { key: 'low', label: 'Мало' };
    return { key: 'in', label: 'В наличии' };
  }

  var items = [];
  BRANDS.forEach(function (b, bi) {
    /* Не у каждой марки есть весь диапазон: приближаем к реальности */
    var voltages = bi < 3 ? VOLTAGES : VOLTAGES.slice(1);
    var cores = bi === 0 ? CORES : [1, 3, 4];
    voltages.forEach(function (v) {
      cores.forEach(function (c) {
        SECTIONS.forEach(function (s) {
          /* одна жила на 50 мм² в 10 кВ — маловероятно, пропускаем */
          if (c === 1 && s < 70 && v === '10 кВ') return;
          var qty = seededQty(b.brand, s, c, v);
          items.push({
            brand: b.brand,
            insulation: b.insulation,
            gost: b.gost,
            section: s,
            cores: c,
            voltage: v,
            qty: qty,
            availability: availability(qty),
            unit: 'м'
          });
        });
      });
    });
  });

  window.RKB_CATALOG = {
    isDemo: true,
    updatedAt: '2026-11-16',
    items: items,
    sections: SECTIONS,
    cores: CORES,
    voltages: VOLTAGES,
    brands: BRANDS.map(function (b) { return b.brand; })
  };
})();
