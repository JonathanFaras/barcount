# BarCount

PWA pour noter, pendant le service, les bouteilles manquantes au bar, puis générer la liste « À remonter ».
Pensée pour le téléphone : interface en français, gros boutons, utilisable d'une main, et fonctionne hors ligne.

**Site : https://jonathanfaras.github.io/barcount/**
(sur iPhone : Safari → Partager → « Sur l'écran d'accueil »)

## Fonctionnalités

- **Inventaire en deux zones** : onglets **Front stage** et **Backstage** sur la même liste de produits, chacun avec ses propres compteurs.
  - `+` : une bouteille manquante de plus. `−` : correction (jamais en dessous de 0).
  - La zone active se repère tout de suite : couleur (turquoise pour le Front, orange pour le Back), bandeau « Tu comptes : … » et liseré.
  - Filtre par section : 🧊 Frigo · 🍸 Comptoir · 📦 Caisse · 🧃 Jus & Sirops.
- **À remonter** : vues **Général** (somme des deux zones), **Front** et **Back**, avec un badge de total sur chacune.
  - Produits regroupés par section, avec le détail en packs (`14` → `2 packs + 2 unités`) et un total en haut de la liste.
  - **✓ Remonté** remet le produit à 0 dans la vue active (les deux zones en vue Général).
  - **Tout effacer** n'efface que la vue active, après confirmation.
  - **Partager / Copier** la liste en texte propre (feuille de partage, sinon presse-papiers, sinon copie manuelle).
- **Réglages** : ajouter, modifier, supprimer et réordonner les produits (nom, section, taille de pack) ; export et import d'une sauvegarde JSON ; retour à la liste par défaut.
- **Hors ligne** : l'appli s'ouvre et fonctionne sans réseau une fois installée.

## Choix techniques

- **PWA hors ligne** : le service worker (`sw.js`) va d'abord chercher la dernière version sur le réseau, ce qui fait arriver les mises à jour. Sans réseau, ou si le réseau met plus de 4 s à répondre, il sert la copie en cache. Tous les chemins sont relatifs (`./`), ce qui permet de servir le site dans un sous-dossier.
- **Les données restent sur le téléphone** : tout est stocké dans le `localStorage` du navigateur (clé `barcount-v2`, schéma versionné avec `migrate()`). Il n'y a ni serveur, ni compte, ni statistiques. Pour sauvegarder ou changer de téléphone, utilise Réglages → Exporter / Importer.
- **Sécurité** : une `Content-Security-Policy` stricte (`default-src 'self'`) est en place, sans script ni style en ligne et sans `onclick` dans le HTML. Tout texte affiché passe par le gabarit `` html`…` ``, qui échappe automatiquement chaque valeur avec `escapeHtml()`, ou par `textContent`.
- **Aucune dépendance** : HTML, CSS et JavaScript natifs (modules ES), sans framework ni étape de build. Les fichiers sont servis tels quels par GitHub Pages.
- **Tests** : [`tests.html`](https://jonathanfaras.github.io/barcount/tests.html) s'ouvre dans le navigateur et affiche ✅ / ❌. Les modules ES ne se chargent pas en `file://` : pour tester en local, lance un petit serveur, par exemple `python -m http.server`.

## Structure

```
index.html             page unique
css/style.css          styles
js/app.js              démarrage, navigation entre écrans
js/store.js            état, sauvegarde localStorage, migration, export/import
js/products.js         sections et liste de produits par défaut
js/format.js           escapeHtml, html``, formatPacks…
js/ui/                 écrans : inventaire, remonter, reglages
js/version.js          APP_VERSION (affichée dans les Réglages, nomme le cache)
sw.js                  service worker
manifest.webmanifest   manifeste PWA
icons/                 icon.svg (source) + PNG 180 / 192 / 512 / maskable
tools/                 génération des icônes (outil de dev facultatif)
tests.html, js/tests.js
docs/                  captures d'écran
```

## Mettre en ligne une nouvelle version

1. Modifier le code.
2. Augmenter `APP_VERSION` dans `js/version.js` (par ex. `2.0.1`).
3. Faire un commit puis `git push` : GitHub Pages republie le site en une ou deux minutes.

## À compléter

- [ ] Sirops : parfums à ajouter depuis les Réglages.
- [ ] Ajouter des captures d'écran dans `docs/`.

## Licence

[MIT](LICENSE) © 2026 Jonathan Faras

---

Version précédente : [meyodb/barcount.github.io](https://github.com/meyodb/barcount.github.io)
