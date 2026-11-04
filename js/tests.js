// Tests de BarCount (affichés par tests.html). Aucune dépendance.
import { escapeHtml, html, formatPacks, formatPacksShort, slugify } from './format.js';
import {
  createStore, memoryStorage, parseBackup, buildShareText, restockGroups, packSummary,
  totals, STORAGE_KEY, SCHEMA_VERSION,
} from './store.js';

const groups = [];
let current = null;

function group(title, fn) {
  current = { title, results: [] };
  groups.push(current);
  try {
    fn();
  } catch (error) {
    current.results.push({ ok: false, name: 'Erreur inattendue', detail: error.stack || String(error) });
  }
}

function test(name, fn) {
  try {
    fn();
    current.results.push({ ok: true, name });
  } catch (error) {
    current.results.push({ ok: false, name, detail: error.message });
  }
}

function eq(actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`obtenu ${a}, attendu ${e}`);
}

function throwsWith(fn, fragment) {
  try {
    fn();
  } catch (error) {
    if (fragment && !error.message.includes(fragment)) {
      throw new Error(`message « ${error.message} » sans « ${fragment} »`);
    }
    return;
  }
  throw new Error("aucune erreur levée");
}

function freshStore() {
  return createStore({ storage: memoryStorage() });
}

function counts(store, id) {
  return { ...store.state.products.find((p) => p.id === id).counts };
}

/* ------------------------------------------------------------------ */

group('formatPacks', () => {
  test('0 → « 0 unité »', () => eq(formatPacks(0), '0 unité'));
  test('1 → « 1 unité »', () => eq(formatPacks(1), '1 unité'));
  test('4 → « 4 unités »', () => eq(formatPacks(4), '4 unités'));
  test('6 → « 1 pack »', () => eq(formatPacks(6), '1 pack'));
  test('14 → « 2 packs + 2 unités »', () => eq(formatPacks(14), '2 packs + 2 unités'));
  test('7 (pack de 6) → « 1 pack + 1 unité »', () => eq(formatPacks(7, 6), '1 pack + 1 unité'));
  test('pack de 12 : 10 → « 10 unités »', () => eq(formatPacks(10, 12), '10 unités'));
  test('pack de 12 : 24 → « 2 packs »', () => eq(formatPacks(24, 12), '2 packs'));
  test('pack de 24 : 30 → « 1 pack + 6 unités »', () => eq(formatPacks(30, 24), '1 pack + 6 unités'));
  test('pack de 1 : 3 → « 3 unités »', () => eq(formatPacks(3, 1), '3 unités'));
  test('valeur négative → « 0 unité »', () => eq(formatPacks(-2), '0 unité'));
  test('version courte : 8 → « 1 pack + 2 »', () => eq(formatPacksShort(8, 6), '1 pack + 2'));
  test('version courte : 6 → « 1 pack »', () => eq(formatPacksShort(6, 6), '1 pack'));
  test('version courte : 4 → « » (pas de pack complet)', () => eq(formatPacksShort(4, 6), ''));
});

group('escapeHtml', () => {
  test('balises et guillemets', () => eq(
    escapeHtml('<script>alert("x")</script>'),
    '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
  ));
  test("apostrophe et esperluette", () => eq(escapeHtml("Jus d'orange & co"), 'Jus d&#39;orange &amp; co'));
  test('null / undefined → chaîne vide', () => { eq(escapeHtml(null), ''); eq(escapeHtml(undefined), ''); });
  test('nombre → texte', () => eq(escapeHtml(42), '42'));
  test('le gabarit html`` échappe les valeurs', () => eq(
    String(html`<li title="${'"><img src=x>'}">${'<b>Absolut</b>'}</li>`),
    '<li title="&quot;&gt;&lt;img src=x&gt;">&lt;b&gt;Absolut&lt;/b&gt;</li>'
  ));
  test('le gabarit html`` n\'échappe pas deux fois un fragment imbriqué', () => eq(
    String(html`<ul>${[html`<li>${'a&b'}</li>`]}</ul>`),
    '<ul><li>a&amp;b</li></ul>'
  ));
});

group('Séparation Front / Back', () => {
  test('« + » au Front ne change pas le Back', () => {
    const s = freshStore();
    s.increment('absolut', 'front', 1);
    s.increment('absolut', 'front', 1);
    eq(counts(s, 'absolut'), { front: 2, back: 0 });
  });
  test('« + » au Back ne change pas le Front', () => {
    const s = freshStore();
    s.increment('absolut', 'back', 1);
    eq(counts(s, 'absolut'), { front: 0, back: 1 });
  });
  test('« − » ne descend jamais sous 0', () => {
    const s = freshStore();
    s.increment('absolut', 'front', -1);
    eq(counts(s, 'absolut'), { front: 0, back: 0 });
  });
  test('la vue Général fait la somme Front + Back', () => {
    const s = freshStore();
    for (let i = 0; i < 5; i++) s.increment('absolut', 'front', 1);
    for (let i = 0; i < 3; i++) s.increment('absolut', 'back', 1);
    const item = restockGroups(s.state.products, 'general')[0].items[0];
    eq([item.product.id, item.qty], ['absolut', 8]);
    eq(totals(s.state.products), { front: 5, back: 3, general: 8 });
  });
  test('Front et Back contiennent exactement les mêmes produits', () => {
    const s = freshStore();
    s.addProduct({ name: 'Sirop test', section: 'jus-sirops', packSize: 6 });
    const p = s.state.products.at(-1);
    eq(p.counts, { front: 0, back: 0 });
  });
  test('total en packs de la liste', () => {
    const s = freshStore();
    for (let i = 0; i < 14; i++) s.increment('absolut', 'back', 1);
    for (let i = 0; i < 4; i++) s.increment('beefeater', 'back', 1);
    eq(packSummary(restockGroups(s.state.products, 'back')), { bottles: 18, packs: 2, units: 6 });
  });
});

group('« Remonté »', () => {
  function seeded() {
    const s = freshStore();
    for (let i = 0; i < 5; i++) s.increment('absolut', 'front', 1);
    for (let i = 0; i < 3; i++) s.increment('absolut', 'back', 1);
    return s;
  }
  test('vue Front : remet seulement le Front à 0', () => {
    const s = seeded();
    s.markDone('absolut', 'front');
    eq(counts(s, 'absolut'), { front: 0, back: 3 });
  });
  test('vue Back : remet seulement le Back à 0', () => {
    const s = seeded();
    s.markDone('absolut', 'back');
    eq(counts(s, 'absolut'), { front: 5, back: 0 });
  });
  test('vue Général : remet les deux à 0', () => {
    const s = seeded();
    s.markDone('absolut', 'general');
    eq(counts(s, 'absolut'), { front: 0, back: 0 });
  });
  test('« Tout effacer » en vue Back ne touche pas le Front', () => {
    const s = seeded();
    s.increment('beefeater', 'back', 1);
    s.clearView('back');
    eq([counts(s, 'absolut'), counts(s, 'beefeater')], [{ front: 5, back: 0 }, { front: 0, back: 0 }]);
  });
});

group('Texte partagé', () => {
  test('format de la liste Backstage', () => {
    const s = freshStore();
    for (let i = 0; i < 8; i++) s.increment('absolut', 'back', 1);
    for (let i = 0; i < 6; i++) s.increment('jusorange', 'back', 1);
    eq(buildShareText(s.state.products, 'back', new Date(2026, 10, 4, 23, 40)).split('\n'), [
      'À remonter — Backstage — 04/11 23:40',
      '📦 Caisse',
      '- 8× Absolut (1 pack + 2)',
      '🧃 Jus & Sirops',
      "- 6× Jus d'orange (1 pack)",
    ]);
  });
});

group('Export / import', () => {
  test("l'import d'un export redonne exactement le même état", () => {
    const a = freshStore();
    a.increment('absolut', 'front', 1);
    a.increment('jameson', 'back', 1);
    a.addProduct({ name: 'Sirop de vanille', section: 'jus-sirops', packSize: 4 });
    a.moveProduct('beefeater', -1);
    a.setUi({ zone: 'back', filter: 'caisse', restockView: 'front', screen: 'reglages' });
    const backup = a.exportBackup(new Date(2026, 10, 4));
    const b = freshStore();
    b.importBackup(backup);
    eq(b.state, a.state);
  });
  test("l'état est bien relu depuis le localStorage", () => {
    const storage = memoryStorage();
    const a = createStore({ storage });
    a.increment('absolut', 'back', 1);
    const b = createStore({ storage });
    eq(b.state, a.state);
    eq(JSON.parse(storage.getItem(STORAGE_KEY)).schemaVersion, SCHEMA_VERSION);
  });
  test('identifiant unique généré depuis le nom', () => {
    const s = freshStore();
    eq(s.addProduct({ name: 'Absolut', section: 'caisse' }).id, 'absolut-2');
    eq(s.addProduct({ name: 'Absolut', section: 'caisse' }).id, 'absolut-3');
    eq(slugify("Jack Daniel's Blackberry"), 'jack-daniel-s-blackberry');
  });
  test('le réordonnancement reste dans la section', () => {
    const s = freshStore();
    const first = s.state.products.find((p) => p.section === 'caisse');
    eq(s.moveProduct(first.id, -1), false); // déjà premier de sa section
  });
});

group("Rejet d'un fichier d'import invalide", () => {
  const valid = () => JSON.parse(freshStore().exportBackup());
  const cases = [
    ['texte qui n\'est pas du JSON', 'ceci n\'est pas du json', 'JSON valide'],
    ['fichier d\'une autre appli', JSON.stringify({ ...valid(), app: 'autre' }), 'BarCount'],
    ['version de schéma absente', JSON.stringify({ products: [] }), 'Version'],
    ['version de schéma future', JSON.stringify({ ...valid(), schemaVersion: 99 }), 'plus récente'],
    ['liste de produits absente', JSON.stringify({ schemaVersion: 1 }), 'produits'],
    ['section inconnue', JSON.stringify({ schemaVersion: 1, products: [{ id: 'x', name: 'X', section: 'cave' }] }), 'section'],
    ['compteur négatif', JSON.stringify({ schemaVersion: 1, products: [{ id: 'x', name: 'X', section: 'frigo', counts: { front: -1, back: 0 } }] }), 'compteurs'],
    ['identifiant en double', JSON.stringify({ schemaVersion: 1, products: [{ id: 'x', name: 'X', section: 'frigo' }, { id: 'x', name: 'Y', section: 'frigo' }] }), 'double'],
    ['nom vide', JSON.stringify({ schemaVersion: 1, products: [{ id: 'x', name: '  ', section: 'frigo' }] }), 'nom'],
  ];
  for (const [name, text, fragment] of cases) {
    test(name, () => throwsWith(() => parseBackup(text), fragment));
  }
  test("un import refusé ne modifie pas l'état actuel", () => {
    const s = freshStore();
    s.increment('absolut', 'front', 1);
    const before = JSON.stringify(s.state);
    throwsWith(() => s.importBackup('{"schemaVersion":1}'));
    eq(JSON.stringify(s.state), before);
  });
});

/* ------------------------------------------------------------------ */
/* Affichage                                                           */
/* ------------------------------------------------------------------ */

function show() {
  const container = document.getElementById('test-results');
  let passed = 0;
  let failed = 0;
  for (const g of groups) {
    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = g.title;
    const list = document.createElement('ul');
    list.className = 'list';
    for (const r of g.results) {
      if (r.ok) passed++; else failed++;
      const li = document.createElement('li');
      li.className = 'restock';
      const label = document.createElement('span');
      label.textContent = `${r.ok ? '✅' : '❌'} ${r.name}`;
      li.append(label);
      if (!r.ok) {
        const detail = document.createElement('span');
        detail.className = 'restock__detail';
        detail.textContent = r.detail;
        li.append(detail);
      }
      list.append(li);
    }
    container.append(title, list);
  }
  const summary = `${failed ? '❌' : '✅'} ${passed} réussis · ${failed} échoués`;
  document.getElementById('test-summary').textContent = summary;
  document.title = `${failed ? '❌' : '✅'} BarCount — tests`;
  window.testResults = { passed, failed, groups };
}

show();
