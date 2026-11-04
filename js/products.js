// Sections et liste de produits par défaut.
//
// Liste du bar telle que réglée par JoJo dans l'appli (Réglages), le 04/11/2026 :
// noms, sections, ordre réel du bar et tailles de pack.
// Les identifiants d'origine sont conservés même quand le produit a été renommé
// (ex. « pujol » s'appelle maintenant « feynard ») : ils ne sont jamais affichés.

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
  'TODO : sirops (Jus & Sirops) : parfums inconnus, à ajouter depuis les Réglages.',
];

const p = (id, name, section, packSize = DEFAULT_PACK_SIZE) => ({ id, name, section, packSize });

export const DEFAULT_PRODUCTS = [
  // 🧊 FRIGO
  p('pepsi', 'Pepsi', 'frigo', 24),
  p('pepsimax', 'Pepsi max', 'frigo', 24),
  p('sevenup', '7up', 'frigo', 24),
  p('perrier', 'Perrier', 'frigo', 24),
  p('orangina', 'Orangina', 'frigo', 24),
  p('lipton', 'Lipton', 'frigo', 24),
  p('schweppesagrume', 'Schweppes agrume', 'frigo', 24),
  p('schweppestonic', 'Schweppes tonic', 'frigo', 24),
  p('eau', 'Eau', 'frigo', 24),
  p('redbull', 'Redbull', 'frigo', 1),
  p('desperados', 'Desperados', 'frigo', 24),
  p('corona', 'Corona', 'frigo', 1),
  p('corona0', 'Corona 0', 'frigo'),
  p('sambuca', 'Sambuca', 'frigo'),
  p('demoisellesansgene', 'Demoiselle sans gêne', 'frigo', 12),
  p('chardonnay', 'Chardonnay', 'frigo'),
  p('pujol', 'feynard', 'frigo'),
  p('martiniprosecco', 'Martini prosecco', 'frigo'),
  p('jager', 'Jager', 'frigo'),
  p('shotcaramel', 'Shot caramel', 'frigo'),
  p('shot-caramel-fraise', 'shot caramel fraise', 'frigo'),
  p('bud', 'Bud', 'frigo', 24),
  p('lilletrose', 'Lillet rose', 'frigo'),
  p('kombuchagingembre', 'Kombucha gingembre', 'frigo', 24),
  p('kombuchaframboise', 'Kombucha framboise', 'frigo', 24),
  p('kombuchaananas', 'Kombucha ananas', 'frigo', 24),
  p('fevertreemediterranean', 'Fever tree mediterranean', 'frigo', 24),
  p('fevertreepremium', 'Fever tree premium', 'frigo', 24),
  p('fevertreegrapefruit', 'Fever tree grapefruit', 'frigo', 24),

  // 🍸 COMPTOIR
  p('pinotnoir', 'Pinot noir', 'comptoir'),
  p('gamaytouraine', 'Grand air', 'comptoir'),
  p('cointreau', 'Cointreau', 'comptoir'),
  p('kahlua', 'Kahlua', 'comptoir'),
  p('baileys', 'Baileys', 'comptoir'),
  p('ricardpastis', 'Ricard pastis de Marseille', 'comptoir'),
  p('suze', 'Suze', 'comptoir'),
  p('giffard1885', 'Amaretto', 'comptoir'),
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
  p('jackdanielsblackberry', "Jack Daniel's Blackberry", 'comptoir'),
  p('jackdanielsvert', 'Jack daniels vert', 'comptoir'),
  p('sailorjerry', 'Sailor Jerry', 'comptoir'),
  p('troisriviere', 'Trois Rivières', 'comptoir'),
  p('bacardispiced', 'Bacardi spiced', 'comptoir'),
  p('bacardiouro', 'Bacardi carta oro', 'comptoir'),
  p('greygoose', 'Grey goose', 'comptoir'),
  p('thoquino', 'Thoquino', 'comptoir'),
  p('malibu', 'Malibu', 'comptoir'),
  p('camparimilan', 'Campari milano', 'comptoir'),

  // 📦 CAISSE
  p('absolut', 'Absolut', 'caisse'),
  p('beefeater', 'Beefeater', 'caisse'),
  p('jameson', 'Jameson', 'caisse'),
  p('eljimadortequila', 'El jimador tequila', 'caisse'),
  p('bacardicartablanca', 'Bacardi carta blanca', 'caisse'),
  p('jackdaniel', 'Jack Daniel', 'caisse'),
  p('triplesec', 'Triple sec', 'caisse'),
  p('cremepeche', 'Crème de pêche', 'caisse'),

  // 🧃 JUS & SIROPS (sirops : TODO, parfums à ajouter depuis les Réglages)
  p('jusorange', "Jus d'orange", 'jus-sirops'),
  p('juspomme', 'Jus de pomme', 'jus-sirops'),
  p('jusananas', "Jus d'ananas", 'jus-sirops'),
  p('juscranberry', 'Jus de cranberry', 'jus-sirops'),
];
