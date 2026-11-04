// État de l'application : modèle de données, sauvegarde localStorage, migration, export/import.
//
// Modèle d'un produit :
//   { id, name, section, packSize, counts: { front, back } }
//   counts.front / counts.back = bouteilles MANQUANTES dans chaque zone.
// Front stage et Backstage partagent la même liste de produits, chacun avec ses propres compteurs.
//
// localStorage['barcount-v2'] = { schemaVersion: 2, catalogVersion, products: [...], ui: {...} }

import {
  DEFAULT_PRODUCTS, SECTIONS, SECTION_IDS, DEFAULT_PACK_SIZE, CATALOG_VERSION, RETIRED_IDS,
} from './products.js';
import { slugify, splitPacks, formatPacksShort, formatDateTime, formatIsoDate } from './format.js';

export const STORAGE_KEY = 'barcount-v2';
export const SCHEMA_VERSION = 2;
export const ZONES = ['front', 'back'];
export const VIEWS = ['general', 'front', 'back'];
export const VIEW_LABELS = { general: 'Général', front: 'Front stage', back: 'Backstage' };
export const MAX_COUNT = 999;
export const MAX_PACK_SIZE = 48;
export const MAX_NAME_LENGTH = 60;

const SCREENS = ['inventaire', 'remonter', 'reglages'];
const FILTERS = ['all', ...SECTION_IDS];

export const DEFAULT_UI = Object.freeze({
  screen: 'inventaire',   // écran affiché
  zone: 'front',          // onglet actif de l'inventaire
  filter: 'all',          // filtre de section de l'inventaire
  restockView: 'general', // vue active de « À remonter »
});

function fail(message) { throw new Error(message); }

/* ------------------------------------------------------------------ */
/* État par défaut, migration et validation                            */
/* ------------------------------------------------------------------ */

export function defaultProducts() {
  return DEFAULT_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    section: p.section,
    packSize: p.packSize ?? DEFAULT_PACK_SIZE,
    counts: { front: 0, back: 0 },
  }));
}

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    catalogVersion: CATALOG_VERSION,
    products: defaultProducts(),
    ui: { ...DEFAULT_UI },
  };
}

/**
 * Mise à jour automatique de la liste par défaut (quand CATALOG_VERSION augmente).
 * - les produits de la nouvelle liste remplacent les anciens (nom, section, pack, ordre),
 *   en GARDANT les compteurs Front / Back des produits déjà présents ;
 * - les produits retirés (RETIRED_IDS) disparaissent ;
 * - les produits ajoutés à la main sur le téléphone sont gardés, à la fin de leur section.
 * Renvoie { state, updated }.
 */
export function applyCatalog(state) {
  if (state.catalogVersion >= CATALOG_VERSION) return { state, updated: false };
  const previous = new Map(state.products.map((p) => [p.id, p]));
  const catalogIds = new Set(DEFAULT_PRODUCTS.map((p) => p.id));
  const products = defaultProducts().map((p) => {
    const old = previous.get(p.id);
    return old ? { ...p, counts: { ...old.counts } } : p;
  });
  products.push(...state.products.filter((p) => !catalogIds.has(p.id) && !RETIRED_IDS.includes(p.id)));
  // Tableau rangé section par section ; les produits ajoutés à la main arrivent en fin de section.
  const ordered = SECTIONS.flatMap((s) => products.filter((p) => p.section === s.id));
  return {
    state: { ...state, catalogVersion: CATALOG_VERSION, products: ordered },
    updated: true,
  };
}

/**
 * Met à niveau des données d'une version de schéma antérieure vers SCHEMA_VERSION.
 * Ajouter une étape par nouvelle version, par exemple :
 *   if (data.schemaVersion === 1) data = { ...data, schemaVersion: 2, nouveauChamp: … };
 */
export function migrate(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('Format de données inconnu.');
  const version = raw.schemaVersion;
  if (!Number.isInteger(version) || version < 1) fail('Version de données absente ou invalide.');
  if (version > SCHEMA_VERSION) {
    fail(`Ces données viennent d'une version plus récente de BarCount (schéma ${version}). Mets l'appli à jour.`);
  }
  let data = { ...raw };
  // 1 → 2 : ajout de catalogVersion (les données v1 ont été créées avec la liste n°1).
  if (data.schemaVersion === 1) data = { ...data, schemaVersion: 2, catalogVersion: 1 };
  return data;
}

function isCount(n) { return Number.isInteger(n) && n >= 0 && n <= MAX_COUNT; }

export function validateProduct(p, index = 0) {
  const where = `Produit n°${index + 1}`;
  if (!p || typeof p !== 'object' || Array.isArray(p)) fail(`${where} : format invalide.`);
  if (typeof p.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(p.id)) fail(`${where} : identifiant invalide.`);
  const name = typeof p.name === 'string' ? p.name.trim() : '';
  if (!name || name.length > MAX_NAME_LENGTH) fail(`${where} : nom manquant ou trop long.`);
  if (!SECTION_IDS.includes(p.section)) fail(`${where} (« ${name} ») : section inconnue.`);
  const packSize = p.packSize === undefined ? DEFAULT_PACK_SIZE : p.packSize;
  if (!Number.isInteger(packSize) || packSize < 1 || packSize > MAX_PACK_SIZE) {
    fail(`${where} (« ${name} ») : taille de pack invalide.`);
  }
  const counts = p.counts === undefined ? { front: 0, back: 0 } : p.counts;
  if (!counts || typeof counts !== 'object' || !isCount(counts.front) || !isCount(counts.back)) {
    fail(`${where} (« ${name} ») : compteurs invalides.`);
  }
  return { id: p.id, name, section: p.section, packSize, counts: { front: counts.front, back: counts.back } };
}

export function normalizeUi(ui) {
  const u = ui && typeof ui === 'object' ? ui : {};
  return {
    screen: SCREENS.includes(u.screen) ? u.screen : DEFAULT_UI.screen,
    zone: ZONES.includes(u.zone) ? u.zone : DEFAULT_UI.zone,
    filter: FILTERS.includes(u.filter) ? u.filter : DEFAULT_UI.filter,
    restockView: VIEWS.includes(u.restockView) ? u.restockView : DEFAULT_UI.restockView,
  };
}

/** Vérifie et nettoie un état complet. Lève une Error (message en français) s'il est invalide. */
export function validateState(raw) {
  const data = migrate(raw);
  if (!Array.isArray(data.products)) fail('La liste des produits est absente.');
  const products = data.products.map(validateProduct);
  const seen = new Set();
  for (const p of products) {
    if (seen.has(p.id)) fail(`Identifiant en double : « ${p.id} ».`);
    seen.add(p.id);
  }
  if (!Number.isInteger(data.catalogVersion) || data.catalogVersion < 1) fail('Version de liste invalide.');
  return {
    schemaVersion: SCHEMA_VERSION,
    catalogVersion: data.catalogVersion,
    products,
    ui: normalizeUi(data.ui),
  };
}

/* ------------------------------------------------------------------ */
/* Export / import                                                     */
/* ------------------------------------------------------------------ */

export function serializeBackup(state, date = new Date()) {
  return JSON.stringify({ app: 'barcount', exportedAt: date.toISOString(), ...state }, null, 2);
}

export function backupFileName(date = new Date()) {
  return `barcount-backup-${formatIsoDate(date)}.json`;
}

/** Lit le texte d'un fichier de sauvegarde et renvoie un état validé (ou lève une Error). */
export function parseBackup(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    fail("Ce fichier n'est pas un JSON valide.");
  }
  if (raw && typeof raw === 'object' && raw.app !== undefined && raw.app !== 'barcount') {
    fail('Ce fichier ne vient pas de BarCount.');
  }
  return validateState(raw);
}

/* ------------------------------------------------------------------ */
/* Calculs (fonctions pures)                                           */
/* ------------------------------------------------------------------ */

/** Quantité manquante d'un produit dans une vue : 'front', 'back' ou 'general' (= somme). */
export function quantity(product, view) {
  if (view === 'general') return product.counts.front + product.counts.back;
  return product.counts[view];
}

export function totals(products) {
  let front = 0;
  let back = 0;
  for (const p of products) { front += p.counts.front; back += p.counts.back; }
  return { front, back, general: front + back };
}

/** Produits ayant au moins un manque dans la vue, regroupés par section (dans l'ordre des sections). */
export function restockGroups(products, view) {
  return SECTIONS
    .map((section) => ({
      section,
      items: products
        .filter((p) => p.section === section.id && quantity(p, view) > 0)
        .map((p) => ({ product: p, qty: quantity(p, view) })),
    }))
    .filter((g) => g.items.length > 0);
}

/** Total d'une liste : bouteilles, packs complets et unités hors pack. */
export function packSummary(groups) {
  let bottles = 0;
  let packs = 0;
  let units = 0;
  for (const g of groups) {
    for (const { product, qty } of g.items) {
      const split = splitPacks(qty, product.packSize);
      bottles += qty;
      packs += split.packs;
      units += split.units;
    }
  }
  return { bottles, packs, units };
}

/** Texte à copier / partager pour une vue. */
export function buildShareText(products, view, date = new Date()) {
  const lines = [`À remonter — ${VIEW_LABELS[view]} — ${formatDateTime(date)}`];
  const groups = restockGroups(products, view);
  if (groups.length === 0) lines.push('Rien à remonter.');
  for (const { section, items } of groups) {
    lines.push(`${section.emoji} ${section.label}`);
    for (const { product, qty } of items) {
      let line = `- ${qty}× ${product.name}`;
      const packs = formatPacksShort(qty, product.packSize);
      if (packs) line += ` (${packs})`;
      if (view === 'general') line += ` — Front ${product.counts.front} · Back ${product.counts.back}`;
      lines.push(line);
    }
  }
  return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* Store : état vivant + sauvegarde automatique                        */
/* ------------------------------------------------------------------ */

/** Stockage en mémoire (tests, ou navigateur qui refuse localStorage). */
export function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

function browserStorage() {
  try {
    const s = window.localStorage;
    s.setItem('barcount-test', '1');
    s.removeItem('barcount-test');
    return s;
  } catch {
    return memoryStorage();
  }
}

export function createStore({ storage = browserStorage(), onSaveError = null } = {}) {
  const listeners = new Set();
  let catalogUpdated = false;
  let state = load();
  if (catalogUpdated) save();

  function load() {
    let text = null;
    try { text = storage.getItem(STORAGE_KEY); } catch { /* stockage indisponible */ }
    if (!text) return defaultState();
    try {
      const result = applyCatalog(validateState(JSON.parse(text)));
      catalogUpdated = result.updated;
      return result.state;
    } catch (error) {
      console.warn('Données BarCount illisibles, liste par défaut utilisée :', error);
      // On garde une copie des données abîmées au lieu de les écraser sans trace.
      try { storage.setItem(`${STORAGE_KEY}-illisible`, text); } catch { /* tant pis */ }
      return defaultState();
    }
  }

  function save() {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      if (onSaveError) onSaveError(error);
    }
  }

  function commit(change) {
    save();
    for (const fn of listeners) fn(state, change);
  }

  function find(id) {
    const product = state.products.find((p) => p.id === id);
    if (!product) fail('Produit introuvable.');
    return product;
  }

  function zonesFor(view) {
    if (!VIEWS.includes(view)) fail('Vue inconnue.');
    return view === 'general' ? ZONES : [view];
  }

  function cleanName(name) {
    const n = String(name ?? '').trim().replace(/\s+/g, ' ');
    if (!n) fail('Le nom est obligatoire.');
    if (n.length > MAX_NAME_LENGTH) fail(`Le nom ne doit pas dépasser ${MAX_NAME_LENGTH} caractères.`);
    return n;
  }

  function cleanSection(section) {
    if (!SECTION_IDS.includes(section)) fail('Section inconnue.');
    return section;
  }

  function cleanPackSize(value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > MAX_PACK_SIZE) {
      fail(`La taille de pack doit être un nombre entier entre 1 et ${MAX_PACK_SIZE}.`);
    }
    return n;
  }

  function uniqueId(name) {
    const base = slugify(name);
    let id = base;
    let n = 2;
    while (state.products.some((p) => p.id === id)) id = `${base}-${n++}`;
    return id;
  }

  return {
    get state() { return state; },

    /** true si la liste de produits vient d'être mise à jour automatiquement au démarrage. */
    get catalogUpdated() { return catalogUpdated; },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    setUi(patch) {
      state.ui = normalizeUi({ ...state.ui, ...patch });
      commit({ type: 'ui' });
    },

    /** +1 / −1 sur le compteur d'UNE zone. Jamais en dessous de 0. Renvoie la nouvelle valeur. */
    increment(id, zone, delta = 1) {
      if (!ZONES.includes(zone)) fail('Zone inconnue.');
      const p = find(id);
      const next = Math.min(MAX_COUNT, Math.max(0, p.counts[zone] + delta));
      if (next !== p.counts[zone]) {
        p.counts[zone] = next;
        commit({ type: 'count', id });
      }
      return next;
    },

    /** « Remonté » : remet à 0 le compteur de la vue (les deux en vue Général). */
    markDone(id, view) {
      const p = find(id);
      for (const z of zonesFor(view)) p.counts[z] = 0;
      commit({ type: 'count', id });
    },

    /** « Tout effacer » : remet à 0 tous les compteurs de la vue. */
    clearView(view) {
      const zones = zonesFor(view);
      for (const p of state.products) for (const z of zones) p.counts[z] = 0;
      commit({ type: 'counts' });
    },

    addProduct({ name, section, packSize = DEFAULT_PACK_SIZE }) {
      const cleanedName = cleanName(name);
      const product = {
        id: uniqueId(cleanedName),
        name: cleanedName,
        section: cleanSection(section),
        packSize: cleanPackSize(packSize),
        counts: { front: 0, back: 0 },
      };
      state.products.push(product);
      commit({ type: 'products' });
      return product;
    },

    updateProduct(id, { name, section, packSize } = {}) {
      const p = find(id);
      const next = {
        name: name === undefined ? p.name : cleanName(name),
        section: section === undefined ? p.section : cleanSection(section),
        packSize: packSize === undefined ? p.packSize : cleanPackSize(packSize),
      };
      const sectionChanged = next.section !== p.section;
      Object.assign(p, next);
      if (sectionChanged) {
        // Dans sa nouvelle section, le produit se place en dernier.
        state.products.splice(state.products.indexOf(p), 1);
        state.products.push(p);
      }
      commit({ type: 'products' });
      return p;
    },

    deleteProduct(id) {
      const p = find(id);
      state.products.splice(state.products.indexOf(p), 1);
      commit({ type: 'products' });
    },

    /** Monte (-1) ou descend (+1) un produit à l'intérieur de sa section. */
    moveProduct(id, direction) {
      const list = state.products;
      const i = list.indexOf(find(id));
      const step = direction < 0 ? -1 : 1;
      for (let j = i + step; j >= 0 && j < list.length; j += step) {
        if (list[j].section === list[i].section) {
          [list[i], list[j]] = [list[j], list[i]];
          commit({ type: 'products' });
          return true;
        }
      }
      return false;
    },

    /** Remet la liste de produits par défaut (compteurs à 0). Les préférences d'affichage sont gardées. */
    resetProducts() {
      state.products = defaultProducts();
      state.catalogVersion = CATALOG_VERSION;
      commit({ type: 'products' });
    },

    exportBackup(date = new Date()) {
      return serializeBackup(state, date);
    },

    /** Remplace tout l'état par celui d'une sauvegarde (texte JSON). Lève une Error si invalide. */
    importBackup(text) {
      // Une ancienne sauvegarde reçoit aussi la liste à jour (compteurs conservés).
      state = applyCatalog(parseBackup(text)).state;
      commit({ type: 'all' });
    },
  };
}
