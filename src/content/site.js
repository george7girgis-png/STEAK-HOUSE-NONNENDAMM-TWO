// Zentrale Inhaltskonfiguration: Speisen, Kontakt, Presse, Rechtliches, Medien.
// Quelle: https://www.steakhaus-nonnendamm.de/ (geprüft am 24.10.2026).
// Vor dem Launch erneut mit der Live-Seite abgleichen.

export const restaurant = {
  name: 'Steakhaus Nonnendamm',
  legalName: 'Argentinisches Steakhaus Nonnendamm',
  founded: 1982,
  street: 'Nonnendammallee 98',
  zip: '13629',
  city: 'Berlin',
  district: 'Siemensstadt',
  hours: 'Täglich 12:00 bis 24:00 Uhr',
  hoursShort: 'Mo – So 12:00 – 24:00',
  phoneDisplay: '030 382 50 23',
  phoneIntl: '+49 30 3825023',
  phoneHref: 'tel:+49303825023',
  email: 'info@steakhaus-nonnendamm.de',
  directionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=Nonnendammallee+98%2C+13629+Berlin',
  mapEmbedUrl:
    'https://www.google.com/maps?q=Nonnendammallee+98,+13629+Berlin&output=embed',
};

export const nav = [
  { label: 'Startseite', href: '/' },
  { label: 'Unsere Gerichte', href: '/#gerichte' },
  { label: 'Über uns', href: '/ueber-uns/' },
  { label: 'Buffet & Catering', href: '/#catering' },
  { label: 'Presse', href: '/presse/' },
  { label: 'Reservierung', href: '/reservierung/' },
  { label: 'Anfahrt', href: '/so-finden-sie-uns/' },
];

// Die drei Angebote der Startseite (Stand 24.10.2026). Keine weiteren Gerichte oder Preise ergänzen.
// side: Position des Essens im Desktop-Layout. Text steht jeweils auf der Gegenseite.
export const dishes = [
  {
    id: 'hueftsteak',
    number: '01',
    name: 'Hüftsteak',
    weight: 'ca. 150 g',
    price: '19,50 €',
    description:
      'Zartes Hüftsteak vom Rind, über Holzkohle gegrillt. Dazu gemischter Salat und wahlweise Pommes Frites oder gebackene Kartoffel.',
    sourceText:
      'Hüftsteak mit gemischtem Salat, als Beilage Pommes Frites oder gebackene Kartoffel',
    side: 'right',
    alt: 'Gegrilltes Hüftsteak mit gemischtem Salat und Pommes Frites vor glühender Holzkohle (KI-generierte Illustration)',
  },
  {
    id: 'filetspiess',
    number: '02',
    name: 'Filetspieß',
    weight: 'ca. 250 g',
    price: '23,50 €',
    description:
      'Gemischter Spieß aus Hähnchenbrustfilet, Rinderfilet und Schweinefilet vom Grill. Mit gemischtem Salat und wahlweise Pommes Frites oder gebackener Kartoffel.',
    sourceText:
      'Hähnchenbrustfilet, Rinderfilet, Schweinefilet mit gemischtem Salat, als Beilage Pommes Frites oder gebackene Kartoffel',
    side: 'left',
    alt: 'Filetspieß mit Hähnchen-, Rinder- und Schweinefilet, Salat und gebackener Kartoffel (KI-generierte Illustration)',
  },
  {
    id: 'holzfaellersteak',
    number: '03',
    name: 'Holzfällersteak',
    weight: 'ca. 200 g',
    price: '19,90 €',
    description:
      'Saftiges Schweinerückensteak mit Röstzwiebeln, dazu Bratkartoffeln und gemischter Salat.',
    sourceText: 'Schweinerückensteak mit Röstzwiebeln, Bratkartoffeln und gemischtem Salat',
    side: 'right',
    alt: 'Holzfällersteak vom Schweinerücken mit Röstzwiebeln, Bratkartoffeln und Salat (KI-generierte Illustration)',
  },
];

export const highlights = [
  {
    title: 'Exquisite Steaks',
    text: 'Speziell ausgewählte argentinische Steaks, zubereitet auf dem Holzkohlegrill.',
  },
  {
    title: 'Erlesene Weine',
    text: 'Eine Auswahl erlesener Weine, abgestimmt auf unsere Steakgerichte.',
  },
  {
    title: 'Gemütliches Ambiente',
    text: 'Ein einladendes Ambiente, ideal für jeden Anlass.',
  },
  {
    title: 'Tradition seit 1982',
    text: 'Argentinische Grillkultur mit deutscher Gastfreundschaft.',
  },
];

export const catering = {
  occasions: ['Familienfeiern', 'Hochzeiten', 'Firmenrunden', 'Trauerfeiern'],
  maxGuests: 120,
  intro:
    'Ob Familienfeier, Hochzeit, Firmenrunde oder Trauerfeier: Wir gestalten Ihr Buffet oder Menü nach Ihren Wünschen.',
  kitchen:
    'Unsere Küche bietet eine Vielzahl an Fleisch- und Beilagenvariationen, abgestimmt auf Ihre Veranstaltung.',
  services: [
    'Individuelle Buffets und Menüs nach Ihren Wünschen',
    'Veranstaltungen für bis zu 120 Personen',
    'Lieferung des Buffets auf Wunsch direkt zu Ihnen',
  ],
  closing: 'Wir freuen uns auf Ihre Anfrage und beraten Sie gerne persönlich.',
};

// Presse-Archiv. Zusammenfassungen sind eigene Kurztexte; vollständige Artikel erst nach
// Klärung der Wiedergaberechte einfügen. Historische Angaben bleiben historisch.
export const press = [
  {
    id: 'parknews-2009',
    source: 'Parknews',
    date: 'Okt. / Dez. 2009',
    year: '2009',
    image: '/img/presse-parknews.jpg',
    title: 'Mittagspause im Steakhaus Nonnendamm',
    summary:
      'Porträt des Restaurants als feste Größe in Siemensstadt: Grillen am Holzkohlegrill, argentinisches Fleisch, rustikales Ambiente und ein Mittagstisch für Berufstätige. Der Beitrag erwähnt auch die Übernahme durch Sandy Soliman im Jahr 2008.',
  },
  {
    id: 'bz-2012',
    source: 'BZ Berlin',
    author: 'Angelika Spurney',
    date: 'März 2012',
    year: '2012',
    image: '/img/presse-bz.jpg',
    title: 'Steakhouse am Nonnendamm',
    summary:
      'Restaurantbesuch mit Eindrücken zu Steaks, Spezialspieß, Salatbar, Vorspeisen und Dessert. Die genannten Preise und die damalige Spießzusammenstellung entsprechen dem Stand von 2012.',
  },
  {
    id: 'groupon-2013',
    source: 'Groupon',
    date: '2013',
    year: '2013',
    image: '/img/presse-groupon.jpg',
    title: 'Genieße das beste Steak',
    summary:
      'Vorstellung des Steakhauses mit Schwerpunkt auf argentinischen Steaks, Beilagen und den täglichen Öffnungszeiten. Die damalige Angabe zur Platzzahl gibt den Stand von 2013 wieder.',
  },
];
export const pressArchiveNote =
  'Archivbeiträge geben den Stand ihres Erscheinungsdatums wieder. Preise, Gerichte und Platzangaben können sich seitdem geändert haben. Aktuelle Angebote finden Sie auf der Startseite.';

export const reservation = {
  // Endpunkt für Anfragen (POST, JSON). Solange null: Anfrage wird als E-Mail vorbereitet.
  endpoint: null,
  // Nur für Vorschau-Deployments: Link zum bisherigen Formular. Beim Launch auf null setzen,
  // da die neue Seite diese Adresse ersetzt.
  legacyUrl: 'https://www.steakhaus-nonnendamm.de/reservierung/',
  note:
    'Bitte haben Sie Verständnis, dass Reservierungen erst nach unserer Bestätigung gültig sind. Reservierungen für den gleichen Tag nehmen wir gerne telefonisch entgegen.',
  openFrom: '12:00',
  openUntil: '23:59',
};

// Impressum: Angaben der bisherigen Seite. Rechtstexte nicht ohne freigegebene Fassung ändern.
export const legal = {
  provider: ['Steakhaus Nonnendamm', 'Sandy Soliman', 'Nonnendammallee 98', '13629 Berlin'],
  vatId: 'DE257667828',
  responsible: 'Sandy Soliman',
  phone: '030.382 50 23',
  website: 'www.steakhaus-nonnendamm.de',
};

// Drittdienste dieser Website. Alles andere wird nicht geladen.
export const thirdParty = [
  {
    id: 'maps',
    name: 'Google Maps',
    provider: 'Google',
    purpose: 'Anzeige der Lagekarte auf der Startseite und unter „So finden Sie uns“.',
    loads: 'Erst nach Ihrer Zustimmung.',
  },
];

// Medien der Kapitel. status: "temporär" bis freigegebene Food-Aufnahmen vorliegen.
// Alle Food-Szenen sind KI-generiert (Higgsfield) und zeigen nicht das Restaurant selbst.
export const journeyMedia = {
  hero: { ambient: 'hero', poster: 'hero' },
  chapters: [
    { dish: 'hueftsteak', ambient: 'hueftsteak', poster: 'hueftsteak', transition: 'hero-hueftsteak' },
    { dish: 'filetspiess', ambient: 'filetspiess', poster: 'filetspiess', transition: 'hueftsteak-filetspiess' },
    { dish: 'holzfaellersteak', ambient: 'holzfaellersteak', poster: 'holzfaellersteak', transition: 'filetspiess-holzfaellersteak' },
  ],
};
