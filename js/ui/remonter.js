// Écran « À remonter » : contenu ajouté dans une prochaine phase.
import { html, setHtml } from '../format.js';

let root = null;

export function mount(element) {
  root = element;
}

export function render() {
  setHtml(root, html`<p class="empty">Écran « À remonter » en construction.</p>`);
}
