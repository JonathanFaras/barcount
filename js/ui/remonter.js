// Écran « À remonter » : vues Général | Front stage | Backstage, regroupées par section, avec détail en packs.
import { html, setHtml, formatPacks } from '../format.js';
import {
  VIEWS, VIEW_LABELS, totals, restockGroups, packSummary, buildShareText,
} from '../store.js';

let root = null;
let store = null;
let toast = () => {};

export function mount(element, ctx) {
  root = element;
  store = ctx.store;
  toast = ctx.toast;
  root.addEventListener('click', onClick);
  store.subscribe((state, change) => {
    if (!root.hidden && change.type !== 'ui') render();
  });
}

const SHORT_LABELS = { general: 'Général', front: 'Front', back: 'Back' };

function plural(n, one, many) { return `${n} ${n > 1 ? many : one}`; }

function itemTemplate({ product, qty }, view) {
  const detail = view === 'general' ? ` (Front ${product.counts.front} · Back ${product.counts.back})` : '';
  return html`
    <li class="restock" data-id="${product.id}">
      <span class="restock__title">${product.name} — <span class="restock__qty">${qty}</span>${detail}</span>
      <span class="restock__detail">${formatPacks(qty, product.packSize)}</span>
      <button type="button" class="btn btn--ok btn--small restock__done" data-action="done"
        aria-label="Remonté : ${product.name}">✓ Remonté</button>
    </li>`;
}

export function render() {
  const { products, ui } = store.state;
  const view = ui.restockView;
  const t = totals(products);
  const groups = restockGroups(products, view);
  const sum = packSummary(groups);
  const canShare = typeof navigator.share === 'function';

  setHtml(root, html`
    <div class="segmented" role="tablist" aria-label="Vue de la liste">
      ${VIEWS.map((v) => html`
        <button type="button" role="tab" class="segmented__btn segmented__btn--${v}"
          data-action="view" data-view="${v}" aria-selected="${v === view}">
          ${SHORT_LABELS[v]} <span class="badge">${t[v]}</span>
        </button>`)}
    </div>

    <div class="summary">
      <div class="summary__main">${VIEW_LABELS[view]} : ${plural(sum.bottles, 'bouteille', 'bouteilles')}</div>
      <div>${plural(sum.units, 'unité', 'unités')} · ${plural(sum.packs, 'pack', 'packs')}</div>
      <div class="muted">Front ${t.front} · Back ${t.back}</div>
    </div>

    <div class="btn-row">
      <button type="button" class="btn btn--primary" data-action="share"${groups.length ? '' : html` disabled`}>
        ${canShare ? '📤 Partager' : '📋 Copier'}
      </button>
      <button type="button" class="btn btn--danger" data-action="clear"${groups.length ? '' : html` disabled`}>
        🗑 Tout effacer
      </button>
    </div>

    ${groups.length === 0
      ? html`<p class="empty">Rien à remonter 🎉</p>`
      : groups.map(({ section, items }) => html`
        <h2 class="section-title">${section.emoji} ${section.label}</h2>
        <ul class="list">${items.map((item) => itemTemplate(item, view))}</ul>`)}
  `);
}

const CLEAR_MESSAGES = {
  general: 'Effacer TOUTE la liste (vue Général) ?\n\nLes compteurs Front stage ET Backstage seront remis à 0.',
  front: 'Effacer la liste Front stage ?\n\nSeuls les compteurs Front stage seront remis à 0. Backstage ne change pas.',
  back: 'Effacer la liste Backstage ?\n\nSeuls les compteurs Backstage seront remis à 0. Front stage ne change pas.',
};

function showCopyDialog(text) {
  const dialog = document.getElementById('copy-dialog');
  const area = document.getElementById('copy-dialog-text');
  area.value = text;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  area.focus();
  area.select();
}

async function share() {
  const view = store.state.ui.restockView;
  const text = buildShareText(store.state.products, view);

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'À remonter', text });
      return;
    } catch (error) {
      if (error && error.name === 'AbortError') return; // partage annulé par l'utilisateur
      // sinon : on tente le presse-papiers
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast('📋 Liste copiée');
  } catch {
    showCopyDialog(text);
  }
}

function onClick(event) {
  const btn = event.target.closest('[data-action]');
  if (!btn || !root.contains(btn)) return;
  const view = store.state.ui.restockView;

  switch (btn.dataset.action) {
    case 'view':
      store.setUi({ restockView: btn.dataset.view });
      render();
      break;
    case 'done': {
      const { id } = btn.closest('[data-id]').dataset;
      store.markDone(id, view);
      toast(view === 'general' ? '✓ Remonté (Front et Back remis à 0)' : `✓ Remonté (${VIEW_LABELS[view]})`);
      break;
    }
    case 'clear':
      if (window.confirm(CLEAR_MESSAGES[view])) {
        store.clearView(view);
        toast(`Liste ${VIEW_LABELS[view]} effacée`);
      }
      break;
    case 'share':
      share();
      break;
    default:
      break;
  }
}
