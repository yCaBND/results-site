/* ==========================================================================
   RKB / Балс — страница «Конкурс»
   Таблица участников берётся из опубликованной Google Таблицы (CSV).
   Адрес листа задаётся в assets/js/config.js -> RKB_LINKS.contestSheet.
   Пока адрес пуст — показывается понятное пустое состояние, ошибок нет.
   ========================================================================== */
(function () {
  'use strict';

  function $(s, c) { return (c || document).querySelector(s); }
  var esc = window.rkbEsc || function (s) { return String(s == null ? '' : s); };

  /* Разбор CSV с поддержкой кавычек и переводов строк внутри ячеек */
  function parseCSV(text) {
    var rows = [], row = [], cell = '', quoted = false, i, c, n;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      n = text[i + 1];
      if (c === '"' && quoted && n === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = !quoted; }
      else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
      else if ((c === '\n' || c === '\r') && !quoted) {
        if (c === '\r' && n === '\n') i++;
        row.push(cell);
        if (row.some(function (x) { return String(x).trim() !== ''; })) rows.push(row);
        row = []; cell = '';
      } else { cell += c; }
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function findCol(headers, names) {
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i] || '').trim().toLowerCase();
      if (names.indexOf(h) !== -1) return i;
    }
    return -1;
  }

  function num(v) {
    return Number(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.')) || 0;
  }

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  function money(n) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency', currency: 'RUB', maximumFractionDigits: 0
    }).format(Number(n) || 0);
  }

  function setEmpty(text) {
    var body = $('#contest-body');
    if (body) {
      body.innerHTML = '<tr><td colspan="5" class="stock-empty">' + esc(text) + '</td></tr>';
    }
  }

  function render(rows) {
    var head = rows[0] || [];
    var iName = findCol(head, ['участник', 'компания', 'участник конкурса']);
    var iCity = findCol(head, ['регион', 'город', 'филиал']);
    var iSales = findCol(head, ['продажи', 'сумма продаж', 'объём', 'объем']);
    var iScore = findCol(head, ['баллы', 'очки', 'результат']);

    if (iName < 0) {
      setEmpty('В таблице не найден столбец «Участник». Проверьте заголовки листа.');
      return;
    }

    var list = rows.slice(1).map(function (r) {
      return {
        name: String(r[iName] || '').trim(),
        city: iCity >= 0 ? String(r[iCity] || '').trim() : '',
        sales: iSales >= 0 ? num(r[iSales]) : 0,
        score: iScore >= 0 ? num(r[iScore]) : 0
      };
    }).filter(function (p) { return p.name; });

    if (!list.length) {
      setEmpty('Участников пока нет. Заполните лист конкурса — таблица обновится при следующем открытии страницы.');
      return;
    }

    /* Сортировка: по баллам, если есть, иначе по продажам */
    var byScore = list.some(function (p) { return p.score; });
    list.sort(function (a, b) {
      return byScore ? (b.score - a.score) || (b.sales - a.sales) : b.sales - a.sales;
    });

    var total = list.reduce(function (s, p) { return s + p.sales; }, 0);

    var body = $('#contest-body');
    body.innerHTML = list.map(function (p, i) {
      var share = total > 0 ? (p.sales / total * 100) : 0;
      var result = byScore ? p.score.toLocaleString('ru-RU') : money(p.sales);
      return '<tr>' +
        '<td class="num rank">' + String(i + 1).padStart(2, '0') + '</td>' +
        '<td class="participant">' + esc(p.name) + '</td>' +
        '<td>' + esc(p.city || '—') + '</td>' +
        '<td class="num">' + esc(result) + '</td>' +
        '<td class="share-cell">' + share.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + '%' +
          '<span class="share-bar"><i style="width:' + Math.min(100, share) + '%"></i></span></td>' +
      '</tr>';
    }).join('');

    var count = $('#contest-count');
    if (count) {
      count.textContent = list.length + ' ' + plural(list.length, 'участник', 'участника', 'участников');
    }

    /* Блок «Итоги месяца»: первый в списке */
    var leader = list[0];
    var lName = $('#winner-top');
    var lDetail = $('#winner-top-detail');
    if (lName && leader) {
      lName.textContent = leader.name;
      if (lDetail) {
        lDetail.textContent = (leader.city ? leader.city + ' · ' : '') +
          (byScore ? leader.score.toLocaleString('ru-RU') + ' баллов' : money(leader.sales) + ' продаж');
      }
    }

    /* Прогресс, если в таблице есть параметры «Цель» и «Сумма продаж» */
    var target = $('#contest-target-value');
    if (target && total > 0) {
      target.textContent = money(total);
    }
  }

  async function load() {
    var links = window.RKB_LINKS || {};
    var url = (links.contestSheet || '').trim();
    var updateBtn = $('#contest-refresh');

    if (!url) {
      setEmpty('Таблица конкурса ещё не подключена. Как только адрес листа будет добавлен, рейтинг появится здесь автоматически.');
      var count = $('#contest-count');
      if (count) count.textContent = '0 участников';
      var status = $('#contest-status-text');
      if (status) status.textContent = 'Таблица ещё не подключена';
      if (updateBtn) updateBtn.setAttribute('aria-disabled', 'true');
      return;
    }

    if (updateBtn) { updateBtn.disabled = true; updateBtn.textContent = 'Загружаем…'; }
    try {
      var sep = url.indexOf('?') === -1 ? '?' : '&';
      var res = await fetch(url + sep + 't=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var text = await res.text();
      render(parseCSV(text));
      var st = $('#contest-status-text');
      if (st) st.textContent = 'Данные обновлены';
      var err = $('#contest-error');
      if (err) err.classList.remove('show');
    } catch (e) {
      setEmpty('Не удалось прочитать таблицу конкурса. Проверьте, что лист опубликован как CSV и доступен по ссылке.');
      var er = $('#contest-error');
      if (er) {
        er.classList.add('show');
        er.textContent = 'Ошибка загрузки данных: ' + e.message;
      }
    } finally {
      if (updateBtn) {
        updateBtn.disabled = false;
        updateBtn.textContent = 'Обновить данные';
      }
    }
  }

  function init() {
    var btn = $('#contest-refresh');
    if (btn) btn.addEventListener('click', load);
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
