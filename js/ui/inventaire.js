// Écran « Inventaire » : deux onglets (Front stage | Backstage) sur la même liste de produits.
// « + » = une bouteille manquante de plus ; « − » = correction. Seul le compteur de l'onglet actif change.
import { html, setHtml } from '../format.js';
import { SECTIONS } from '../products.js';
import { VIEW_LABELS, ZONES, totals } from '../store.js';

let root = null;
let store = null;

export function mount(element, ctx) {
  root = element;
  store = ctx.store;
  root.addEventListener('click', onClick);
  store.subscribe((state, change) => {
    if (root.hidden) return;
    if (change.type === 'count') updateRow(change.id);
    else if (change.type === 'products' || change.type === 'counts') render();
  });
}

function missingLabel(n) {
  return n > 1 ? `${n} manquantes` : `${n} manquante`;
}

function rowTemplate(product, zone) {
  const n = product.counts[zone];
  return html`
    <li class="row${n > 0 ? ' row--missing' : ''}" data-id="${product.id}">
      <span class="row__name">${product.name}</span>
      <button type="button" class="step step--minus" data-action="dec"
        aria-label="Corriger : une de moins pour ${product.name}"${n === 0 ? html` disabled` : ''}>−</button>
      <output class="count" aria-label="Manquantes : ${product.name}">${n}</output>
      <button type="button" class="step step--plus" data-action="inc"
        aria-label="Une bouteille manquante de plus : ${product.name}">+</button>
    </li>`;
}

export function render() {
  const { products, ui } = store.state;
  const { zone, filter } = ui;
  const t = totals(products);
  const sections = SECTIONS.filter((s) => filter === 'all' || s.id === filter);

  setHtml(root, html`
    <div class="segmented" role="tablist" aria-label="Zone comptée">
      ${ZONES.map((z) => html`
        <button type="button" role="tab" class="segmented__btn segmented__btn--${z}"
          data-action="zone" data-zone="${z}" aria-selected="${z === zone}">
          ${VIEW_LABELS[z]}
          <span class="segmented__sub" data-total="${z}">${missingLabel(t[z])}</span>
        </button>`)}
    </div>

    <p class="zone-banner">Tu comptes : ${VIEW_LABELS[zone].toUpperCase()}</p>

    <div class="chips" role="group" aria-label="Filtrer par section">
      <button type="button" class="chip" data-action="filter" data-filter="all"
        aria-pressed="${filter === 'all'}">Tout</button>
      ${SECTIONS.map((s) => html`
        <button type="button" class="chip" data-action="filter" data-filter="${s.id}"
          aria-pressed="${filter === s.id}">${s.emoji} ${s.label}</button>`)}
    </div>

    ${sections.map((section) => {
      const items = products.filter((p) => p.section === section.id);
      return html`
        <h2 class="section-title">${section.emoji} ${section.label}</h2>
        ${items.length
          ? html`<ul class="list">${items.map((p) => rowTemplate(p, zone))}</ul>`
          : html`<p class="muted">Aucun produit dans cette section. Ajoute-en depuis les Réglages.</p>`}`;
    })}
  `);
}

/** Mise à jour ciblée d'une ligne (pas de re-rendu complet : la liste ne saute pas sous le doigt). */
function updateRow(id) {
  const { products, ui } = store.state;
  const product = products.find((p) => p.id === id);
  const row = root.querySelector(`[data-id="${CSS.escape(id)}"]`);
  if (!product || !row) return;
  const n = product.counts[ui.zone];
  row.querySelector('.count').textContent = String(n);
  row.querySelector('[data-action="dec"]').disabled = n === 0;
  row.classList.toggle('row--missing', n > 0);
  const t = totals(products);
  for (const el of root.querySelectorAll('[data-total]')) {
    el.textContent = missingLabel(t[el.dataset.total]);
  }
}

function onClick(event) {
  const btn = event.target.closest('[data-action]');
  if (!btn || !root.contains(btn)) return;
  const { action } = btn.dataset;

  if (action === 'zone') {
    store.setUi({ zone: btn.dataset.zone });
    render();
  } else if (action === 'filter') {
    store.setUi({ filter: btn.dataset.filter });
    render();
  } else if (action === 'inc' || action === 'dec') {
    const { id } = btn.closest('[data-id]').dataset;
    store.increment(id, store.state.ui.zone, action === 'inc' ? 1 : -1);
  }
}
