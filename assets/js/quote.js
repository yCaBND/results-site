/* ==========================================================================
   RKB / Балс — страница «Заказать / посчитать»
   Блок А: окно ИИ-ассистента (пока только интерфейс)
   Блок Б: каталог продукции с остатками (демо-данные из catalog-demo.js)
   ========================================================================== */
(function () {
  'use strict';

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  var esc = window.rkbEsc || function (s) { return String(s == null ? '' : s); };

  /* ------------------------------------------------------ Свёрнутые блоки */
  function initCollapse() {
    $$('[data-collapse]').forEach(function (block) {
      var head = $('.accordion-head', block);
      if (!head) return;
      head.addEventListener('click', function () {
        var open = block.classList.toggle('is-open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          var body = $('.accordion-body', block);
          if (body) body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  }

  /* --------------------------------------------------------- Блок А: ИИ-окно */
  function initAI() {
    var panel = $('#ai-panel');
    if (!panel) return;

    var form = $('#ai-form');
    var input = $('#ai-input');
    var thread = $('#ai-thread');
    var attachList = $('#ai-attach-list');
    var fileInput = $('#ai-file');
    var recording = $('#ai-recording');
    var status = $('#ai-status');

    /* Введённый текст и выбранные файлы держим в памяти страницы */
    var attachments = [];

    function addMsg(text, who, note) {
      var el = document.createElement('div');
      el.className = 'ai-msg ' + who;
      el.textContent = text;
      if (note) {
        var sm = document.createElement('small');
        sm.textContent = note;
        el.appendChild(sm);
      }
      thread.appendChild(el);
      thread.scrollTop = thread.scrollHeight;
      return el;
    }

    function renderAttachments() {
      attachList.innerHTML = attachments.map(function (a, i) {
        return '<span class="ai-attach-chip">' + esc(a.name) +
          '<button type="button" data-remove="' + i + '" aria-label="Удалить вложение ' + esc(a.name) + '">×</button></span>';
      }).join('');
    }

    attachList.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-remove]');
      if (!btn) return;
      attachments.splice(Number(btn.getAttribute('data-remove')), 1);
      renderAttachments();
    });

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        Array.prototype.slice.call(this.files).forEach(function (f) {
          attachments.push({ name: f.name, size: f.size, type: f.type || 'file' });
        });
        this.value = '';
        renderAttachments();
      });
    }

    /* Кнопка «скриншот»: пробуем системный захват экрана, иначе предлагаем файл */
    var shotBtn = $('#ai-shot');
    if (shotBtn) {
      shotBtn.addEventListener('click', function () {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          navigator.mediaDevices.getDisplayMedia({ video: true })
            .then(function (stream) {
              attachments.push({ name: 'снимок-экрана.png', size: 0, type: 'image/png' });
              renderAttachments();
              stream.getTracks().forEach(function (t) { t.stop(); });
            })
            .catch(function () {
              if (window.rkbToast) window.rkbToast('Захват экрана отменён. Можно приложить файл кнопкой «Скрепка».');
            });
        } else if (window.rkbToast) {
          window.rkbToast('Браузер не поддерживает захват экрана — приложите файл скрепкой.');
        }
      });
    }

    /* Голосовое сообщение: интерфейс-заглушка */
    var voiceBtn = $('#ai-voice');
    var isRecording = false;
    var recTimer = null;

    function stopRecording(addAttachment) {
      isRecording = false;
      clearInterval(recTimer);
      recording.classList.remove('is-on');
      voiceBtn.setAttribute('aria-pressed', 'false');
      if (addAttachment) {
        attachments.push({ name: 'голосовое-сообщение.webm', size: 0, type: 'audio/webm' });
        renderAttachments();
      }
    }

    if (voiceBtn) {
      voiceBtn.addEventListener('click', function () {
        if (!isRecording) {
          isRecording = true;
          recording.classList.add('is-on');
          voiceBtn.setAttribute('aria-pressed', 'true');
          var sec = 0;
          recording.querySelector('span:last-child').textContent = 'Идёт запись… 0:00';
          recTimer = setInterval(function () {
            sec++;
            recording.querySelector('span:last-child').textContent =
              'Идёт запись… 0:' + String(sec).padStart(2, '0');
            if (sec >= 60) stopRecording(true);
          }, 1000);
        } else {
          stopRecording(true);
        }
      });
    }

    /* Автовысота поля ввода */
    if (input) {
      input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 160) + 'px';
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          form.requestSubmit();
        }
      });
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = (input.value || '').trim();
        if (!text && !attachments.length) {
          input.focus();
          return;
        }
        var note = attachments.length ? 'Вложений: ' + attachments.length : '';
        addMsg(text || 'Запрос с вложением', 'user', note);
        input.value = '';
        input.style.height = 'auto';
        attachments = [];
        renderAttachments();
        stopRecording(false);

        /* Заглушка ответа. Здесь будет вызываться ИИ-агент. */
        var thinking = addMsg('Подбираю позиции…', 'bot');
        setTimeout(function () {
          thinking.remove();
          addMsg(
            'Пока это демонстрационный режим: настоящий ассистент ещё не подключён. ' +
            'Пришлите запрос на ' + (window.RKB_CONFIG && window.RKB_CONFIG.mailto ? window.RKB_CONFIG.mailto : 'почту') +
            ' — менеджер подберёт продукцию и рассчитает стоимость.',
            'bot',
            'Ответ будет в реальном времени после подключения агента'
          );
        }, 700);
      });
    }

    if (status) {
      status.textContent = 'Демонстрационный режим — агент не подключён';
    }
  }

  /* ------------------------------------------------ Блок Б: каталог остатков */
  function initCatalog() {
    var body = $('#stock-body');
    if (!body) return;

    var data = window.RKB_CATALOG;
    if (!data || !Array.isArray(data.items)) return;

    var fBrand = $('#f-brand');
    var fSection = $('#f-section');
    var fCores = $('#f-cores');
    var fVoltage = $('#f-voltage');
    var summary = $('#catalog-summary');
    var reset = $('#filter-reset');
    var askBtn = $('#ask-from-catalog');

    /* Заполняем фильтры */
    fBrand.innerHTML = '<option value="">Все марки</option>' +
      data.brands.map(function (b) { return '<option value="' + esc(b) + '">' + esc(b) + '</option>'; }).join('');
    fSection.innerHTML = '<option value="">Любое</option>' +
      data.sections.map(function (s) { return '<option value="' + s + '">' + s + ' мм²</option>'; }).join('');
    fCores.innerHTML = '<option value="">Любое</option>' +
      data.cores.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    fVoltage.innerHTML = '<option value="">Любое</option>' +
      data.voltages.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join('');

    var LIMIT = 60;

    function matches(it) {
      if (fBrand.value && it.brand !== fBrand.value) return false;
      if (fSection.value && String(it.section) !== fSection.value) return false;
      if (fCores.value && String(it.cores) !== fCores.value) return false;
      if (fVoltage.value && it.voltage !== fVoltage.value) return false;
      return true;
    }

    function badge(a) {
      var cls = a.key === 'in' ? 'badge-in' : a.key === 'low' ? 'badge-low' : 'badge-order';
      return '<span class="badge ' + cls + '">' + esc(a.label) + '</span>';
    }

    function render() {
      var rows = data.items.filter(matches);

      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="7" class="stock-empty">По заданным параметрам ничего не найдено. Измените фильтры или отправьте запрос — подберём аналог.</td></tr>';
        summary.textContent = 'Найдено: 0 позиций';
        return;
      }

      var shown = rows.slice(0, LIMIT);
      body.innerHTML = shown.map(function (it) {
        var qtyText = it.qty ? String(it.qty) + ' ' + it.unit : '—';
        return '<tr>' +
          '<td class="brand">' + esc(it.brand) + '</td>' +
          '<td class="num">' + it.section + '</td>' +
          '<td class="num">' + it.cores + '</td>' +
          '<td>' + esc(it.voltage) + '</td>' +
          '<td class="num">' + qtyText + '</td>' +
          '<td>' + badge(it.availability) + '</td>' +
          '<td class="actions"><button class="button gray-button" type="button" ' +
            'data-add="' + esc(it.brand + ' ' + it.cores + 'х' + it.section + ' ' + it.voltage) + '">В запрос</button></td>' +
        '</tr>';
      }).join('');

      summary.textContent = 'Найдено: ' + rows.length + ' позиций' +
        (rows.length > LIMIT ? ' · показаны первые ' + LIMIT + '. Уточните фильтры.' : '');
    }

    [fBrand, fSection, fCores, fVoltage].forEach(function (el) {
      el.addEventListener('change', render);
    });

    reset.addEventListener('click', function () {
      fBrand.value = ''; fSection.value = ''; fCores.value = ''; fVoltage.value = '';
      render();
    });

    /* «В запрос» — переносит позицию в окно ИИ как текст */
    body.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-add]');
      if (!btn) return;
      var text = btn.getAttribute('data-add');
      var input = $('#ai-input');
      if (input) {
        input.value = (input.value ? input.value + '\n' : '') + text + ' — ' +
          (btn.closest('tr').querySelector('.badge').textContent === 'Под заказ' ? 'под заказ' : 'со склада');
        input.focus();
        input.dispatchEvent(new Event('input'));
        var panel = $('#ai-panel');
        if (panel && !panel.classList.contains('is-open')) {
          $('.accordion-head', panel).click();
        }
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.rkbToast) window.rkbToast('Позиция добавлена в поле запроса.');
      }
    });

    if (askBtn) {
      askBtn.addEventListener('click', function () {
        var input = $('#ai-input');
        if (input) {
          input.value = 'Нужен подбор по фильтрам: ' +
            (fBrand.value || 'любая марка') + ', ' +
            (fSection.value || 'любое') + ' мм², ' +
            (fCores.value || 'любое') + ' жил, ' +
            (fVoltage.value || 'любое') + '.';
          input.focus();
          input.dispatchEvent(new Event('input'));
        }
      });
    }

    render();
  }

  /* ------------------------------------------------------------- запуск */
  function init() {
    initCollapse();
    initAI();
    initCatalog();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
