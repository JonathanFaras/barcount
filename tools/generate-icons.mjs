// Outil de développement (facultatif) : régénère les PNG d'icônes depuis icons/icon.svg.
// Le site n'en a pas besoin pour fonctionner : les PNG générés sont commités.
//
// Usage, depuis un dossier À PART (pour ne pas ajouter de dépendance au projet) :
//   npm i @resvg/resvg-js
//   node chemin/vers/barcount/tools/generate-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(join(process.cwd(), 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const iconsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const source = readFileSync(join(iconsDir, 'icon.svg'), 'utf8');

// Version « maskable » : même dessin réduit à 72 % pour rester dans la zone de sécurité (cercle de 80 %).
const maskable = source.replace(
  '<g id="glyphe">',
  '<g id="glyphe" transform="translate(256 256) scale(0.72) translate(-256 -256)">'
);
writeFileSync(join(iconsDir, 'icon-maskable.svg'), maskable);

const targets = [
  ['apple-touch-icon.png', source, 180],
  ['icon-192.png', source, 192],
  ['icon-512.png', source, 512],
  ['icon-maskable-192.png', maskable, 192],
  ['icon-maskable-512.png', maskable, 512],
];

for (const [name, svg, size] of targets) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(join(iconsDir, name), png);
  console.log(`${name} (${size}×${size}) : ${png.length} octets`);
}
