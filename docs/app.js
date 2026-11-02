import MiniSearch from 'https://cdn.jsdelivr.net/npm/minisearch@6/dist/es/index.js';

const state = {
  mini: null,
  shards: new Map(),
  cities: [],
  seq: 0,
};

const $q      = document.getElementById('q');
const $tbody  = document.querySelector('#results tbody');
const $status = document.getElementById('status');

async function boot() {
  const [searchRaw, meta] = await Promise.all([
    fetch('data/search.json').then(r => r.json()),
    fetch('data/meta.json').then(r => r.json()),
  ]);
  state.cities = meta.cities;

  const items = searchRaw.rows.map(r =>
    Object.fromEntries(searchRaw.fields.map((f, i) => [f, r[i]]))
  );

  state.mini = new MiniSearch({
    idField: 'i',
    fields: ['a', 'b', 'n'],
    storeFields: ['i', 'a', 'b', 'n'],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { a: 4, b: 2, n: 1 },
    },
  });
  state.mini.addAll(items);

  $status.textContent =
    `${items.length.toLocaleString('ru')} позиций · обновлено ` +
    new Date(meta.updated).toLocaleString('ru');
}

async function ensureShard(prefix) {
  if (state.shards.has(prefix)) return;
  const data = await fetch(`data/shards/${prefix}.json`).then(r => r.json());
  state.shards.set(prefix, data);
}

async function runSearch(q) {
  const my = ++state.seq;
  q = q.trim();
  if (q.length < 2) { $tbody.innerHTML = ''; return; }

  const hits = state.mini.search(q).slice(0, 100);
  const prefixes = [...new Set(hits.map(h => h.id.slice(0, 2)))];
  await Promise.all(prefixes.map(ensureShard));
  if (my !== state.seq) return;

  const rows = hits.map(h => {
    const detail = state.shards.get(h.id.slice(0, 2))[h.id] || {};
    return { ...h, price: detail.p, stocks: detail.s || {}, src: detail.src };
  });
  render(rows, q);
}

function highlight(text, terms) {
  if (!text || !terms?.length) return escape(text || '');
  const re = new RegExp('(' + terms.map(escapeRe).join('|') + ')', 'gi');
  return escape(text).replace(re, '<mark>$1</mark>');
}
const escape   = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function render(rows, query) {
  const terms = query.split(/\s+/).filter(Boolean);
  const html = rows.map(r => {
    const badge = r.src === 'elcom'
      ? '<span class="pill">Elcom</span>'
      : '<span class="pill rs">RS</span>';
    const price = r.price != null ? r.price.toFixed(2) + ' ₽' : '—';
    const total = Object.values(r.stocks).reduce((a, b) => a + b, 0);
    return `
      <tr class="row" data-id="${r.id}">
        <td class="name">${highlight(r.n, terms)}<br><small style="color:#6b7280">${highlight(r.b, terms)} · ${highlight(r.a, terms)}${badge}</small></td>
        <td style="white-space:nowrap;text-align:right">${price}</td>
        <td style="white-space:nowrap;text-align:right">${total ? total.toLocaleString('ru') : '—'}</td>
        <td>▸</td>
      </tr>
      <tr class="detail"><td colspan="4">${cityGrid(r.stocks)}</td></tr>
    `;
  }).join('');
  $tbody.innerHTML = html || `<tr><td colspan="4" style="padding:20px;color:#6b7280">Ничего не найдено</td></tr>`;
  $tbody.querySelectorAll('.row').forEach(tr =>
    tr.addEventListener('click', () => tr.classList.toggle('open'))
  );
}

function cityGrid(stocks) {
  return '<div class="city-grid">' + state.cities.map(c => {
    const q = stocks[c] || 0;
    return `<div class="city${q ? '' : ' zero'}"><b>${escape(c)}</b><span class="qty">${q ? q.toLocaleString('ru') : '0'}</span></div>`;
  }).join('') + '</div>';
}

// debounce
let t = null;
$q.addEventListener('input', e => {
  clearTimeout(t);
  const v = e.target.value;
  t = setTimeout(() => runSearch(v), 120);
});

boot().catch(err => {
  console.error(err);
  $status.textContent = 'Ошибка загрузки данных — см. консоль';
});
