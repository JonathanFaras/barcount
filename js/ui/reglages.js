// Écran « Réglages » : produits (ajout, modification, ordre, suppression), sauvegarde, réinitialisation.
import { html, setHtml } from '../format.js';
import { SECTIONS, TODOS, DEFAULT_PACK_SIZE } from '../products.js';
import {
  backupFileName, parseBackup, totals, MAX_NAME_LENGTH, MAX_PACK_SIZE,
} from '../store.js';

let root = null;
let store = null;
let toast = () => {};
let editingId = null;           // produit en cours de modification
const openSections = new Set(); // sections dépliées dans la liste de gestion

export function mount(element, ctx) {
  root = element;
  store = ctx.store;
  toast = ctx.toast;
  root.addEventListener('click', onClick);
  root.addEventListener('submit', onSubmit);
  root.addEventListener('change', onChange);
  // « toggle » ne remonte pas : on l'écoute en phase de capture.
  root.addEventListener('toggle', (event) => {
    const { section } = event.target.dataset;
    if (!section) return;
    if (event.target.open) openSections.add(section);
    else openSections.delete(section);
  }, true);
  store.subscribe((state, change) => {
    if (!root.hidden && (change.type === 'products' || change.type === 'all')) render();
  });
}

function sectionOptions(selected) {
  return SECTIONS.map((s) => html`
    <option value="${s.id}"${s.id === selected ? html` selected` : ''}>${s.emoji} ${s.label}</option>`);
}

function packLabel(n) { return n > 1 ? `pack de ${n}` : 'à l\'unité'; }

function editTemplate(p) {
  return html`
    <li class="manage manage--editing" data-id="${p.id}">
      <form data-form="edit" data-id="${p.id}">
        <div class="field">
          <label for="edit-name">Nom</label>
          <input class="input" id="edit-name" name="name" required maxlength="${MAX_NAME_LENGTH}"
            value="${p.name}" autocomplete="off">
        </div>
        <div class="fields-inline">
          <div class="field">
            <label for="edit-section">Section</label>
            <select class="select" id="edit-section" name="section">${sectionOptions(p.section)}</select>
          </div>
          <div class="field">
            <label for="edit-pack">Pack</label>
            <input class="input" id="edit-pack" name="packSize" type="number" inputmode="numeric"
              min="1" max="${MAX_PACK_SIZE}" step="1" required value="${p.packSize}">
          </div>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn btn--primary">Enregistrer</button>
          <button type="button" class="btn" data-action="cancel-edit">Annuler</button>
        </div>
      </form>
    </li>`;
}

function manageTemplate(p, isFirst, isLast) {
  if (p.id === editingId) return editTemplate(p);
  return html`
    <li class="manage" data-id="${p.id}">
      <span>
        <span class="row__name">${p.name}</span><br>
        <span class="muted">${packLabel(p.packSize)}</span>
      </span>
      <span class="manage__actions">
        <button type="button" class="icon-btn" data-action="up" aria-label="Monter ${p.name}"${isFirst ? html` disabled` : ''}>↑</button>
        <button type="button" class="icon-btn" data-action="down" aria-label="Descendre ${p.name}"${isLast ? html` disabled` : ''}>↓</button>
        <button type="button" class="icon-btn" data-action="edit" aria-label="Modifier ${p.name}">✏️</button>
        <button type="button" class="icon-btn icon-btn--danger" data-action="delete" aria-label="Supprimer ${p.name}">🗑</button>
      </span>
    </li>`;
}

export function render() {
  const { products } = store.state;
  const editing = products.find((p) => p.id === editingId);
  if (editing) openSections.add(editing.section);
  else editingId = null;

  setHtml(root, html`
    <div class="card">
      <h2>➕ Ajouter un produit</h2>
      <p class="muted">Il apparaît automatiquement au Front stage et au Backstage.</p>
      <form data-form="add">
        <div class="field">
          <label for="add-name">Nom</label>
          <input class="input" id="add-name" name="name" required maxlength="${MAX_NAME_LENGTH}"
            placeholder="ex. Sirop de vanille" autocomplete="off">
        </div>
        <div class="fields-inline">
          <div class="field">
            <label for="add-section">Section</label>
            <select class="select" id="add-section" name="section">${sectionOptions('frigo')}</select>
          </div>
          <div class="field">
            <label for="add-pack">Pack</label>
            <input class="input" id="add-pack" name="packSize" type="number" inputmode="numeric"
              min="1" max="${MAX_PACK_SIZE}" step="1" required value="${DEFAULT_PACK_SIZE}">
          </div>
        </div>
        <button type="submit" class="btn btn--primary btn--block">Ajouter</button>
      </form>
    </div>

    <div class="card">
      <h2>🍾 Produits (${products.length})</h2>
      <p class="muted">Flèches : remets les produits dans l'ordre réel du bar.</p>
      ${SECTIONS.map((section) => {
        const items = products.filter((p) => p.section === section.id);
        return html`
          <details data-section="${section.id}"${openSections.has(section.id) ? html` open` : ''}>
            <summary class="section-title">${section.emoji} ${section.label} (${items.length})</summary>
            ${items.length
              ? html`<ul class="list">${items.map((p, i) => manageTemplate(p, i === 0, i === items.length - 1))}</ul>`
              : html`<p class="muted">Aucun produit.</p>`}
          </details>`;
      })}
    </div>

    <div class="card">
      <h2>💾 Sauvegarde</h2>
      <p class="muted">Tes données restent sur ce téléphone. Exporte-les pour les garder ou les copier ailleurs.</p>
      <div class="btn-row">
        <button type="button" class="btn" data-action="export">⬇️ Exporter</button>
        <button type="button" class="btn" data-action="import">⬆️ Importer</button>
      </div>
      <input type="file" class="file-input" id="import-file" accept=".json,application/json">
    </div>

    <div class="card">
      <h2>♻️ Réinitialiser</h2>
      <p class="muted">Remet la liste de produits par défaut (produits ajoutés, modifications et compteurs perdus).</p>
      <button type="button" class="btn btn--danger btn--block" data-action="reset">Réinitialiser les produits</button>
    </div>

    <div class="card">
      <h2>📝 À compléter</h2>
      <ul>${TODOS.map((t) => html`<li class="todo">${t}</li>`)}</ul>
    </div>

    <p class="muted">BarCount v${self.APP_VERSION || '?'} · données stockées uniquement sur cet appareil</p>
  `);
}

/* ---------------- Sauvegarde ---------------- */

function downloadFile(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function exportBackup() {
  const text = store.exportBackup();
  const filename = backupFileName();
  // Sur téléphone, la feuille de partage permet « Enregistrer dans Fichiers ».
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile && typeof File === 'function' && navigator.canShare) {
    const file = new File([text], filename, { type: 'application/json' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') return;
      }
    }
  }
  downloadFile(text, filename);
  toast(`Sauvegarde exportée : ${filename}`);
}

async function importFile(file) {
  let text;
  try {
    text = await file.text();
  } catch {
    window.alert('Import impossible : fichier illisible.');
    return;
  }
  let preview;
  try {
    preview = parseBackup(text); // validation complète AVANT de demander confirmation
  } catch (error) {
    window.alert(`Import impossible : ${error.message}\n\nTes données actuelles n'ont pas été modifiées.`);
    return;
  }
  const missing = totals(preview.products).general;
  const ok = window.confirm(
    `Remplacer TOUTES les données actuelles par cette sauvegarde ?\n\n`
    + `${preview.products.length} produits · ${missing} bouteilles manquantes.\n`
    + 'Les données actuelles seront écrasées.'
  );
  if (!ok) return;
  store.importBackup(text);
  toast('Sauvegarde importée');
}

/* ---------------- Événements ---------------- */

function onClick(event) {
  const btn = event.target.closest('[data-action]');
  if (!btn || !root.contains(btn)) return;
  const row = btn.closest('[data-id]');
  const id = row ? row.dataset.id : null;
  const product = id ? store.state.products.find((p) => p.id === id) : null;

  switch (btn.dataset.action) {
    case 'up':
    case 'down':
      store.moveProduct(id, btn.dataset.action === 'up' ? -1 : 1);
      break;
    case 'edit':
      editingId = id;
      render();
      root.querySelector('#edit-name')?.focus();
      break;
    case 'cancel-edit':
      editingId = null;
      render();
      break;
    case 'delete':
      if (product && window.confirm(`Supprimer « ${product.name} » ?\n\nIl disparaît du Front stage et du Backstage (compteurs perdus).`)) {
        store.deleteProduct(id);
        toast(`« ${product.name} » supprimé`);
      }
      break;
    case 'export':
      exportBackup();
      break;
    case 'import':
      root.querySelector('#import-file').click();
      break;
    case 'reset':
      if (window.confirm('Avant de réinitialiser, veux-tu exporter une sauvegarde ?\n\nOK = exporter maintenant · Annuler = continuer sans exporter')) {
        exportBackup();
      }
      if (window.confirm('Réinitialiser la liste des produits par défaut ?\n\nProduits ajoutés, modifications et TOUS les compteurs seront perdus.')) {
        editingId = null;
        store.resetProducts();
        toast('Liste par défaut restaurée');
      }
      break;
    default:
      break;
  }
}

function onSubmit(event) {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const values = {
    name: data.get('name'),
    section: data.get('section'),
    packSize: Number(data.get('packSize')),
  };
  try {
    if (form.dataset.form === 'add') {
      const product = store.addProduct(values);
      openSections.add(product.section);
      toast(`« ${product.name} » ajouté (Front et Back)`);
    } else if (form.dataset.form === 'edit') {
      editingId = null; // avant la mise à jour : le re-rendu affiche la ligne normale
      store.updateProduct(form.dataset.id, values);
      toast('Produit modifié');
    }
  } catch (error) {
    if (form.dataset.form === 'edit') editingId = form.dataset.id;
    toast(`⚠️ ${error.message}`);
  }
}

function onChange(event) {
  if (event.target.id !== 'import-file') return;
  const [file] = event.target.files;
  event.target.value = ''; // permet de réimporter le même fichier
  if (file) importFile(file);
}
