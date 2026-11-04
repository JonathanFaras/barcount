// Version de l'application : une seule source, partagée par la page et le service worker.
// À augmenter à chaque mise en ligne (elle s'affiche dans les Réglages et renomme le cache hors ligne).
// Script classique (pas un module) pour pouvoir être chargé par importScripts() dans sw.js.
self.APP_VERSION = '2.2.0';
