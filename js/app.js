// Démarrage de BarCount et navigation entre les écrans.
import * as inventaire from './ui/inventaire.js';
import * as remonter from './ui/remonter.js';
import * as reglages from './ui/reglages.js';

const SCREENS = {
  inventaire: { title: 'Inventaire', module: inventaire },
  remonter: { title: 'À remonter', module: remonter },
  reglages: { title: 'Réglages', module: reglages },
};

let currentScreen = 'inventaire';
let toastTimer = null;

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2500);
}

function showScreen(name) {
  if (!SCREENS[name]) name = 'inventaire';
  currentScreen = name;
  document.body.dataset.screen = name;
  for (const section of document.querySelectorAll('.screen')) {
    section.hidden = section.dataset.screen !== name;
  }
  for (const btn of document.querySelectorAll('[data-nav]')) {
    if (btn.dataset.nav === name) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }
  document.getElementById('screen-title').textContent = SCREENS[name].title;
  SCREENS[name].module.render();
  window.scrollTo(0, 0);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' })
      .catch((error) => console.warn('Service worker non enregistré :', error));
  });
}

function start() {
  const ctx = { toast, showScreen };
  for (const [name, { module }] of Object.entries(SCREENS)) {
    module.mount(document.getElementById(`screen-${name}`), ctx);
  }
  document.querySelector('.tabbar').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-nav]');
    if (btn) showScreen(btn.dataset.nav);
  });
  showScreen(currentScreen);
  registerServiceWorker();
}

start();
