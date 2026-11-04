// Sections et liste de produits par défaut.
// Reprise de l'ancien app.js (meyodb/barcount.github.io), avec ces corrections :
//   - section « comptoire » renommée « comptoir » ;
//   - les 4 jus passent de « caisse » à la nouvelle section « jus-sirops » ;
//   - typos : « Schwepps agrume » → « Schweppes agrume », « Trois rivière » → « Trois Rivières ».
// Les identifiants d'origine sont conservés.
//
// Doublons connus (gardés volontairement, dans deux sections différentes) :
//   - « Jameson » : jamesoncomptoire (comptoir) et jameson (caisse) ;
//   - « El jimador » : eljimadorcomptoire (comptoir) et eljimadortequila (caisse).

export const SECTIONS = [
  { id: 'frigo', label: 'Frigo', emoji: '🧊' },
  { id: 'comptoir', label: 'Comptoir', emoji: '🍸' },
  { id: 'caisse', label: 'Caisse', emoji: '📦' },
  { id: 'jus-sirops', label: 'Jus & Sirops', emoji: '🧃' },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);

export const DEFAULT_PACK_SIZE = 6;

/** Points en attente d'informations (affichés dans les Réglages). Ne pas inventer de produits. */
export const TODOS = [
  "TODO : « Jack Daniel's Blackberry » ajouté dans Comptoir : section à confirmer.",
  'TODO : autres produits à ajouter : liste non fournie.',
  'TODO : produits à retirer : liste non fournie.',
  'TODO : sirops (Jus & Sirops) : parfums inconnus, à ajouter depuis les Réglages.',
];

const p = (id, name, section) => ({ id, name, section, packSize: DEFAULT_PACK_SIZE });

export const DEFAULT_PRODUCTS = [
  // 🧊 FRIGO
  p('pepsi', 'Pepsi', 'frigo'),
  p('pepsimax', 'Pepsi max', 'frigo'),
  p('sevenup', '7up', 'frigo'),
  p('perrier', 'Perrier', 'frigo'),
  p('orangina', 'Orangina', 'frigo'),
  p('lipton', 'Lipton', 'frigo'),
  p('schweppesagrume', 'Schweppes agrume', 'frigo'),
  p('schweppestonic', 'Schweppes tonic', 'frigo'),
  p('eau', 'Eau', 'frigo'),
  p('redbull', 'Redbull', 'frigo'),
  p('desperados', 'Desperados', 'frigo'),
  p('corona', 'Corona', 'frigo'),
  p('corona0', 'Corona 0', 'frigo'),
  p('sambuca', 'Sambuca', 'frigo'),
  p('demoisellesansgene', 'Demoiselle sans gêne', 'frigo'),
  p('chardonnay', 'Chardonnay', 'frigo'),
  p('pujol', 'Pujol', 'frigo'),
  p('martiniprosecco', 'Martini prosecco', 'frigo'),
  p('kombuchaananas', 'Kombucha ananas', 'frigo'),
  p('kombuchaframboise', 'Kombucha framboise', 'frigo'),
  p('kombuchagingembre', 'Kombucha gingembre', 'frigo'),
  p('jager', 'Jager', 'frigo'),
  p('bud', 'Bud', 'frigo'),
  p('fevertreemediterranean', 'Fever tree mediterranean', 'frigo'),
  p('fevertreepremium', 'Fever tree premium', 'frigo'),
  p('fevertreegrapefruit', 'Fever tree grapefruit', 'frigo'),
  p('shotcaramel', 'Shot caramel', 'frigo'),
  p('lilletrose', 'Lillet rose', 'frigo'),

  // 🍸 COMPTOIR
  p('pinotnoir', 'Pinot noir', 'comptoir'),
  p('gamaytouraine', 'Gamay Touraine', 'comptoir'),
  p('cointreau', 'Cointreau', 'comptoir'),
  p('kahlua', 'Kahlua', 'comptoir'),
  p('baileys', 'Baileys', 'comptoir'),
  p('ricardpastis', 'Ricard pastis de Marseille', 'comptoir'),
  p('suze', 'Suze', 'comptoir'),
  p('giffard1885', 'Giffard 1885', 'comptoir'),
  p('get27', 'Get27', 'comptoir'),
  p('stgermain', 'St germain elderflower liqueur', 'comptoir'),
  p('aperol', 'Aperol', 'comptoir'),
  p('campari', 'Campari', 'comptoir'),
  p('bombaybleu', 'Bombay bleu', 'comptoir'),
  p('bombayrouge', 'Bombay rouge', 'comptoir'),
  p('martinibianco', 'Martini bianco', 'comptoir'),
  p('martinirosso', 'Martini rosso', 'comptoir'),
  p('jackdanielsrouge', 'Jack daniels rouge', 'comptoir'),
  p('jackdanielshoney', 'Jack daniels honey', 'comptoir'),
  p('jackdanielsvert', 'Jack daniels vert', 'comptoir'),
  // TODO : section « comptoir » à confirmer (ajout demandé par JoJo).
  p('jackdanielsblackberry', "Jack Daniel's Blackberry", 'comptoir'),
  p('sailorjerry', 'Sailor Jerry', 'comptoir'),
  p('troisriviere', 'Trois Rivières', 'comptoir'),
  p('bacardispiced', 'Bacardi spiced', 'comptoir'),
  p('fourroses', 'Four roses bourbon', 'comptoir'),
  p('jamesoncomptoire', 'Jameson', 'comptoir'), // doublon volontaire avec « jameson » (caisse)
  p('bacardiblanca', 'Bacardi blanca', 'comptoir'),
  p('bacardiouro', 'Bacardi carta oro', 'comptoir'),
  p('greygoose', 'Grey goose', 'comptoir'),
  p('thoquino', 'Thoquino', 'comptoir'),
  p('malibu', 'Malibu', 'comptoir'),
  p('eljimadorcomptoire', 'El jimador', 'comptoir'), // doublon volontaire avec « eljimadortequila » (caisse)
  p('camparimilan', 'Campari milano', 'comptoir'),
  p('parati', 'Parati', 'comptoir'),
  p('lesgalets', 'Les galets', 'comptoir'),

  // 📦 CAISSE
  p('absolut', 'Absolut', 'caisse'),
  p('beefeater', 'Beefeater', 'caisse'),
  p('jameson', 'Jameson', 'caisse'),
  p('eljimadortequila', 'El jimador tequila', 'caisse'),
  p('bacardicartablanca', 'Bacardi carta blanca', 'caisse'),
  p('jackdaniel', 'Jack Daniel', 'caisse'),
  p('bacardioro', 'Bacardi oro', 'caisse'),
  p('triplesec', 'Triple sec', 'caisse'),
  p('cremepeche', 'Crème de pêche', 'caisse'),

  // 🧃 JUS & SIROPS (sirops : TODO, parfums à ajouter depuis les Réglages)
  p('jusorange', "Jus d'orange", 'jus-sirops'),
  p('juspomme', 'Jus de pomme', 'jus-sirops'),
  p('jusananas', "Jus d'ananas", 'jus-sirops'),
  p('juscranberry', 'Jus de cranberry', 'jus-sirops'),
];
