// Fonctions de formatage pures (aucun accès au DOM ni au stockage) : faciles à tester.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };

/** Échappe un texte pour l'insérer sans risque dans du HTML. */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'`]/g, (c) => ESCAPES[c]);
}

/** Fragment HTML déjà sûr (produit uniquement par le gabarit html``). */
class SafeHtml {
  constructor(value) { this.value = value; }
  toString() { return this.value; }
}

function renderValue(v) {
  if (v instanceof SafeHtml) return v.value;
  if (Array.isArray(v)) return v.map(renderValue).join('');
  if (v === null || v === undefined || v === false) return '';
  return escapeHtml(v);
}

/**
 * Gabarit HTML qui échappe AUTOMATIQUEMENT toutes les valeurs insérées.
 * Exemple : html`<li>${produit.name}</li>` — le nom ne peut pas injecter de HTML.
 */
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => { out += renderValue(v) + strings[i + 1]; });
  return new SafeHtml(out);
}

/** Seul point d'écriture dans innerHTML : refuse tout ce qui ne vient pas de html``. */
export function setHtml(element, fragment) {
  if (!(fragment instanceof SafeHtml)) throw new TypeError('setHtml() attend un fragment créé avec html``');
  element.innerHTML = fragment.value;
}

function plural(n, singular, pluralForm) {
  return `${n} ${n > 1 ? pluralForm : singular}`;
}

function cleanQty(qty) {
  const q = Math.floor(Number(qty));
  return Number.isFinite(q) && q > 0 ? q : 0;
}

function cleanPackSize(packSize) {
  const p = Math.floor(Number(packSize));
  return Number.isFinite(p) && p > 0 ? p : 6;
}

/** Découpe une quantité en packs complets + unités restantes. */
export function splitPacks(qty, packSize = 6) {
  const q = cleanQty(qty);
  const p = cleanPackSize(packSize);
  return { packs: Math.floor(q / p), units: q % p };
}

/**
 * Détail lisible d'une quantité en packs.
 * 4 → « 4 unités » ; 6 → « 1 pack » ; 14 → « 2 packs + 2 unités » ; 0 → « 0 unité ».
 */
export function formatPacks(qty, packSize = 6) {
  const q = cleanQty(qty);
  const p = cleanPackSize(packSize);
  if (q === 0) return '0 unité';
  if (p === 1) return plural(q, 'unité', 'unités');
  const { packs, units } = splitPacks(q, p);
  const parts = [];
  if (packs) parts.push(plural(packs, 'pack', 'packs'));
  if (units) parts.push(plural(units, 'unité', 'unités'));
  return parts.join(' + ');
}

/**
 * Version courte pour le texte partagé : « 1 pack + 2 », « 1 pack », ou '' s'il n'y a pas de pack complet.
 */
export function formatPacksShort(qty, packSize = 6) {
  const p = cleanPackSize(packSize);
  const { packs, units } = splitPacks(qty, p);
  if (!packs || p === 1) return '';
  const label = plural(packs, 'pack', 'packs');
  return units ? `${label} + ${units}` : label;
}

function pad(n) { return String(n).padStart(2, '0'); }

/** « 04/11 23:40 » (heure locale). */
export function formatDateTime(date = new Date()) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** « 2026-11-04 » (date locale), pour les noms de fichiers. */
export function formatIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Identifiant à partir d'un nom : « Jus d'Orange ! » → « jus-d-orange ». */
export function slugify(name) {
  const slug = String(name ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'produit';
}
