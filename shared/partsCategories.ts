// Catalogue exhaustif de catégories/sous-catégories pièces auto.
// Source unique partagée entre frontend (recherche, filtres) et backend (référencement).

export interface PartsSubCategory {
  code: string;
  label: string;
  keywords: string[];
}

export interface PartsCategory {
  code: string;
  label: string;
  icon: string;
  subs: PartsSubCategory[];
}

export const PARTS_CATEGORIES: PartsCategory[] = [
  {
    code: "moteur", label: "Moteur", icon: "⚙️",
    subs: [
      { code: "bloc_moteur", label: "Bloc moteur", keywords: ["bloc moteur", "carter", "chemise", "piston", "bielle", "vilebrequin", "culasse", "soupape", "joint de culasse", "cache culbuteur"] },
      { code: "distribution", label: "Distribution", keywords: ["courroie distribution", "chaîne distribution", "kit distribution", "tendeur", "galet", "poulie", "arbre à cames"] },
      { code: "alimentation", label: "Alimentation carburant", keywords: ["injecteur", "pompe à essence", "pompe injection", "rampe injection", "filtre essence", "filtre gasoil", "carburateur", "régulateur pression"] },
      { code: "allumage", label: "Allumage", keywords: ["bougie", "bougie préchauffage", "bobine allumage", "module allumage", "faisceau allumage", "capteur PMH"] },
      { code: "turbo", label: "Turbo / Suralimentation", keywords: ["turbo", "turbocompresseur", "échangeur", "intercooler", "wastegate", "dump valve", "tuyau admission"] },
      { code: "admission", label: "Admission", keywords: ["filtre à air", "boîtier papillon", "collecteur admission", "débitmètre", "tuyau admission", "manchon turbo"] },
    ],
  },
  {
    code: "freinage", label: "Freinage", icon: "🛑",
    subs: [
      { code: "disques", label: "Disques de frein", keywords: ["disque frein", "disque avant", "disque arrière", "disque ventilé", "disque plein"] },
      { code: "plaquettes", label: "Plaquettes de frein", keywords: ["plaquette frein", "plaquette avant", "plaquette arrière", "garniture frein"] },
      { code: "etriers", label: "Étriers", keywords: ["étrier frein", "piston étrier", "support étrier", "kit réparation étrier"] },
      { code: "tambours", label: "Tambours / Mâchoires", keywords: ["tambour frein", "mâchoire frein", "cylindre de roue", "kit tambour"] },
      { code: "flexible", label: "Flexibles / Conduites", keywords: ["flexible frein", "tuyau frein", "conduite frein", "maître cylindre", "répartiteur", "servo frein"] },
      { code: "frein_main", label: "Frein à main", keywords: ["câble frein à main", "levier frein", "frein parking", "frein stationnement"] },
      { code: "liquide", label: "Liquide de frein", keywords: ["liquide frein", "DOT4", "DOT5", "purge frein"] },
    ],
  },
  {
    code: "suspension", label: "Suspension / Direction", icon: "🔧",
    subs: [
      { code: "amortisseurs", label: "Amortisseurs", keywords: ["amortisseur avant", "amortisseur arrière", "jambe de force", "coupelle amortisseur", "butée amortisseur"] },
      { code: "ressorts", label: "Ressorts", keywords: ["ressort suspension", "ressort hélicoïdal", "lame de ressort", "barre de torsion"] },
      { code: "bras", label: "Bras / Triangles", keywords: ["triangle suspension", "bras suspension", "bras oscillant", "bras transversal", "rotule"] },
      { code: "silent_bloc", label: "Silent-blocs", keywords: ["silent bloc", "silentbloc", "bague caoutchouc", "tampon"] },
      { code: "roulement", label: "Roulements de roue", keywords: ["roulement roue", "moyeu", "kit roulement"] },
      { code: "biellette", label: "Biellettes / Barre stab", keywords: ["biellette barre stabilisatrice", "barre antiroulis", "tirant direction"] },
      { code: "rotule", label: "Rotules", keywords: ["rotule direction", "rotule suspension", "soufflet rotule"] },
      { code: "direction", label: "Direction", keywords: ["crémaillère direction", "pompe direction", "colonne direction", "volant", "biellette direction", "soufflet crémaillère", "huile direction", "direction assistée"] },
    ],
  },
  {
    code: "transmission", label: "Transmission", icon: "⚡",
    subs: [
      { code: "embrayage", label: "Embrayage", keywords: ["kit embrayage", "disque embrayage", "mécanisme embrayage", "butée embrayage", "volant moteur", "volant bi-masse", "câble embrayage", "maître cylindre embrayage", "récepteur embrayage"] },
      { code: "boite_vitesse", label: "Boîte de vitesses", keywords: ["boîte vitesse", "boîte manuelle", "boîte automatique", "roulement boîte", "joint spi", "huile boîte", "synchro", "levier vitesse", "câble sélection"] },
      { code: "cardan", label: "Cardan / Transmission", keywords: ["cardan", "arbre transmission", "soufflet cardan", "joint homocinétique", "croisillon cardan", "manchon"] },
      { code: "differentiel", label: "Différentiel", keywords: ["différentiel", "pont", "couronne", "pignon attaque", "roulement pont"] },
    ],
  },
  {
    code: "echappement", label: "Échappement", icon: "💨",
    subs: [
      { code: "collecteur", label: "Collecteur", keywords: ["collecteur échappement", "joint collecteur"] },
      { code: "catalyseur", label: "Catalyseur / FAP", keywords: ["catalyseur", "pot catalytique", "filtre à particules", "FAP", "DPF", "vanne EGR"] },
      { code: "silencieux", label: "Silencieux", keywords: ["silencieux avant", "silencieux intermédiaire", "silencieux arrière", "pot échappement"] },
      { code: "tuyau_echappement", label: "Tuyaux", keywords: ["tuyau échappement", "tube échappement", "flexible échappement", "collier échappement", "joint échappement"] },
      { code: "sonde", label: "Sondes", keywords: ["sonde lambda", "sonde O2", "capteur NOx", "capteur température échappement"] },
    ],
  },
  {
    code: "electricite", label: "Électricité", icon: "🔌",
    subs: [
      { code: "batterie", label: "Batterie", keywords: ["batterie", "batterie voiture", "borne batterie", "cosse batterie", "câble batterie"] },
      { code: "demarreur", label: "Démarreur", keywords: ["démarreur", "contacteur démarreur", "lanceur démarreur"] },
      { code: "alternateur", label: "Alternateur", keywords: ["alternateur", "régulateur alternateur", "poulie alternateur", "courroie alternateur"] },
      { code: "capteurs", label: "Capteurs", keywords: ["capteur ABS", "capteur vitesse", "capteur température", "capteur pression", "capteur recul", "capteur pluie", "capteur parking", "sonde température"] },
      { code: "fusibles", label: "Fusibles / Relais", keywords: ["fusible", "boîte fusibles", "relais", "porte-fusible"] },
      { code: "faisceau", label: "Faisceau électrique", keywords: ["faisceau électrique", "câblage", "connecteur", "fiche", "prise"] },
    ],
  },
  {
    code: "eclairage", label: "Éclairage", icon: "💡",
    subs: [
      { code: "phares", label: "Phares", keywords: ["phare", "phare avant", "optique", "projecteur", "phare LED", "phare xénon", "phare halogène", "réglage phare"] },
      { code: "feux_arriere", label: "Feux arrière", keywords: ["feu arrière", "feu stop", "platine feu", "porte-ampoule"] },
      { code: "clignotants", label: "Clignotants", keywords: ["clignotant", "répétiteur", "clignotant rétro"] },
      { code: "anti_brouillard", label: "Anti-brouillard", keywords: ["anti-brouillard", "feu brouillard", "longue portée"] },
      { code: "ampoules", label: "Ampoules", keywords: ["ampoule H1", "ampoule H4", "ampoule H7", "ampoule LED", "ampoule xénon", "ampoule navette", "ampoule tableau bord"] },
      { code: "eclairage_interieur", label: "Éclairage intérieur", keywords: ["plafonnier", "éclairage habitacle", "éclairage coffre", "éclairage boîte gants"] },
    ],
  },
  {
    code: "carrosserie", label: "Carrosserie", icon: "🚗",
    subs: [
      { code: "pare_chocs", label: "Pare-chocs", keywords: ["pare-chocs avant", "pare-chocs arrière", "absorbeur choc", "support pare-chocs", "grille pare-chocs", "lèvre pare-chocs"] },
      { code: "capot", label: "Capot / Coffre", keywords: ["capot", "charnière capot", "vérin capot", "hayon", "coffre", "vérin coffre", "serrure capot", "câble capot"] },
      { code: "ailes", label: "Ailes", keywords: ["aile avant", "aile arrière", "passage de roue", "élargisseur aile", "jonc aile"] },
      { code: "portes", label: "Portes", keywords: ["porte avant", "porte arrière", "charnière porte", "poignée porte", "serrure porte", "lève-vitre", "mécanisme vitre"] },
      { code: "retroviseurs", label: "Rétroviseurs", keywords: ["rétroviseur", "miroir rétro", "coque rétro", "rétroviseur électrique", "rétroviseur rabattable", "dégivrant rétro"] },
      { code: "vitrage", label: "Vitrage", keywords: ["pare-brise", "lunette arrière", "vitre latérale", "vitre custode", "joint vitre", "mastic pare-brise"] },
      { code: "calandre", label: "Calandre", keywords: ["calandre", "grille calandre", "sigle", "logo", "monogramme"] },
      { code: "bas_caisse", label: "Bas de caisse / Jupes", keywords: ["bas de caisse", "jupe", "protection sous moteur", "carter protection", "cache sous moteur"] },
      { code: "toit", label: "Toit / Pavillon", keywords: ["toit", "barre de toit", "galerie", "antenne toit", "toit ouvrant"] },
    ],
  },
  {
    code: "climatisation", label: "Climatisation / Chauffage", icon: "❄️",
    subs: [
      { code: "compresseur", label: "Compresseur clim", keywords: ["compresseur climatisation", "compresseur clim", "embrayage compresseur", "poulie compresseur"] },
      { code: "condenseur", label: "Condenseur", keywords: ["condenseur", "condenseur clim", "deshydrateur", "bouteille déshydratante"] },
      { code: "evaporateur", label: "Évaporateur", keywords: ["évaporateur", "détendeur clim", "valve expansion"] },
      { code: "chauffage", label: "Chauffage", keywords: ["radiateur chauffage", "résistance ventilateur", "ventilateur habitacle", "pulseur air", "volet chauffage", "câble chauffage"] },
      { code: "gaz_clim", label: "Gaz / Tuyaux clim", keywords: ["gaz clim", "R134a", "R1234yf", "tuyau clim", "flexible clim", "raccord clim"] },
    ],
  },
  {
    code: "refroidissement", label: "Refroidissement", icon: "🌡️",
    subs: [
      { code: "radiateur", label: "Radiateur", keywords: ["radiateur moteur", "radiateur eau", "bouchon radiateur", "support radiateur"] },
      { code: "pompe_eau", label: "Pompe à eau", keywords: ["pompe à eau", "joint pompe eau"] },
      { code: "thermostat", label: "Thermostat", keywords: ["thermostat", "calorstat", "boîtier thermostat"] },
      { code: "ventilateur_moteur", label: "Ventilateur moteur", keywords: ["ventilateur moteur", "moto-ventilateur", "GMV", "thermocontact"] },
      { code: "durites", label: "Durites / Tuyaux", keywords: ["durite", "durite eau", "durite radiateur", "durite chauffage", "collier durite"] },
      { code: "liquide_refroidissement", label: "Liquide de refroidissement", keywords: ["liquide refroidissement", "antigel", "vase expansion", "bouchon vase"] },
    ],
  },
  {
    code: "filtration", label: "Filtration", icon: "🔍",
    subs: [
      { code: "filtre_huile", label: "Filtre à huile", keywords: ["filtre huile", "filtre à huile"] },
      { code: "filtre_air", label: "Filtre à air", keywords: ["filtre air", "filtre à air", "boîte à air"] },
      { code: "filtre_carburant", label: "Filtre carburant", keywords: ["filtre carburant", "filtre essence", "filtre gasoil", "filtre diesel"] },
      { code: "filtre_habitacle", label: "Filtre habitacle", keywords: ["filtre habitacle", "filtre pollen", "filtre charbon actif"] },
      { code: "huile_moteur", label: "Huile moteur", keywords: ["huile moteur", "5W30", "5W40", "10W40", "0W20", "huile synthétique", "vidange"] },
    ],
  },
  {
    code: "essuie_glaces", label: "Essuie-glaces", icon: "🌧️",
    subs: [
      { code: "balais", label: "Balais d'essuie-glaces", keywords: ["balai essuie-glace", "essuie-glace avant", "essuie-glace arrière", "raclette", "lame essuie-glace"] },
      { code: "moteur_essuie", label: "Moteur / Mécanisme", keywords: ["moteur essuie-glace", "tringlerie", "mécanisme essuie-glace", "bras essuie-glace"] },
      { code: "lave_glace", label: "Lave-glace", keywords: ["lave-glace", "pompe lave-glace", "réservoir lave-glace", "gicleur", "tuyau lave-glace", "liquide lave-glace"] },
    ],
  },
  {
    code: "visserie", label: "Visserie / Fixations", icon: "🔩",
    subs: [
      { code: "vis", label: "Vis", keywords: ["vis", "vis carrosserie", "vis pare-chocs", "vis tôle", "vis auto-taraudeuse", "vis moteur"] },
      { code: "boulons", label: "Boulons / Écrous", keywords: ["boulon", "écrou", "écrou de roue", "goujon", "rondelle", "boulon roue"] },
      { code: "clips", label: "Clips / Agrafes", keywords: ["clip", "agrafe", "rivet", "attache", "clip pare-chocs", "clip passage roue", "clip garnissage"] },
      { code: "colliers", label: "Colliers", keywords: ["collier serrage", "collier durite", "collier échappement", "serflex"] },
      { code: "joints", label: "Joints", keywords: ["joint", "joint torique", "joint plat", "joint papier", "joint cuivre", "joint spi", "joint carter", "pâte à joint"] },
    ],
  },
  {
    code: "interieur", label: "Intérieur / Habitacle", icon: "🪑",
    subs: [
      { code: "sieges", label: "Sièges", keywords: ["siège", "siège avant", "siège arrière", "assise", "dossier", "rail siège", "appuie-tête", "housse siège"] },
      { code: "tableau_bord", label: "Tableau de bord", keywords: ["tableau de bord", "compteur", "combiné instruments", "horloge", "afficheur"] },
      { code: "volant", label: "Volant", keywords: ["volant", "commodo", "airbag volant", "contacteur tournant"] },
      { code: "pedales", label: "Pédales", keywords: ["pédale", "pédalier", "pédale frein", "pédale accélérateur", "pédale embrayage", "capteur pédale"] },
      { code: "garnitures", label: "Garnitures", keywords: ["garnissage", "panneau porte", "moquette", "tapis sol", "garniture pavillon", "garniture coffre"] },
      { code: "commandes", label: "Commandes", keywords: ["bouton", "interrupteur", "commande vitre", "commande clim", "commande chauffage", "lève-vitre électrique"] },
    ],
  },
  {
    code: "securite", label: "Sécurité", icon: "🛡️",
    subs: [
      { code: "airbag", label: "Airbag", keywords: ["airbag", "coussin gonflable", "airbag conducteur", "airbag passager", "airbag latéral", "airbag rideau", "calculateur airbag"] },
      { code: "ceinture", label: "Ceintures", keywords: ["ceinture sécurité", "enrouleur ceinture", "prétensionneur", "boucle ceinture"] },
      { code: "antivol", label: "Antivol / Serrures", keywords: ["antivol", "neiman", "barillet", "serrure", "clé", "télécommande", "transpondeur", "verrouillage centralisé"] },
    ],
  },
  {
    code: "roues", label: "Roues / Pneus", icon: "🛞",
    subs: [
      { code: "jantes", label: "Jantes", keywords: ["jante", "jante alu", "jante tôle", "enjoliveur", "centre de roue", "cache moyeu"] },
      { code: "pneus", label: "Pneus", keywords: ["pneu", "pneu été", "pneu hiver", "pneu 4 saisons", "pneu neuf", "pneu occasion"] },
      { code: "capteur_pression", label: "Capteur pression (TPMS)", keywords: ["capteur pression pneu", "TPMS", "valve", "valve pneu"] },
    ],
  },
  {
    code: "accessoires", label: "Accessoires", icon: "🎒",
    subs: [
      { code: "attelage", label: "Attelage", keywords: ["attelage", "boule attelage", "faisceau attelage", "rotule attelage"] },
      { code: "galerie", label: "Galerie / Barres", keywords: ["barre de toit", "galerie", "coffre de toit"] },
      { code: "outillage", label: "Outillage", keywords: ["cric", "clé roue", "triangle", "gilet", "kit dépannage", "compresseur"] },
      { code: "entretien", label: "Produits entretien", keywords: ["nettoyant", "dégraissant", "polish", "cire", "shampooing", "lustrant", "anti-rouille", "dégrippant", "WD40"] },
    ],
  },
];

// Flat list of all keywords for search indexing
export const ALL_PARTS_KEYWORDS: string[] = PARTS_CATEGORIES.flatMap(c =>
  c.subs.flatMap(s => [s.label, ...s.keywords])
);

// Flat list of categories for select dropdowns
export const PARTS_CATEGORY_OPTIONS = PARTS_CATEGORIES.map(c => ({
  code: c.code,
  label: `${c.icon} ${c.label}`,
  subs: c.subs.map(s => ({ code: s.code, label: s.label })),
}));

// Search helper: find matching categories/subcategories for a keyword
export function searchPartsByKeyword(query: string): { category: string; subCategory: string; label: string }[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: { category: string; subCategory: string; label: string }[] = [];
  for (const cat of PARTS_CATEGORIES) {
    for (const sub of cat.subs) {
      if (
        sub.label.toLowerCase().includes(q) ||
        sub.keywords.some(k => k.toLowerCase().includes(q))
      ) {
        results.push({ category: cat.label, subCategory: sub.label, label: `${cat.label} > ${sub.label}` });
      }
    }
  }
  return results;
}
