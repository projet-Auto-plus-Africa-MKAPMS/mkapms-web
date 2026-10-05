/**
 * MKA.P-MS AI — Tool Registry, famille Boutique (catégorie « boutique »).
 *
 * L'IA principale travaille DANS la boutique (SHOP) avec le jeton de service que le PDG a créé côté boutique et
 * déposé dans le Coffre secret (server/intelligences/boutique.ts). Décision du PDG du 2 octobre 2026.
 *
 * Quatre outils de lecture et quatre outils d'écriture de faible risque, tous bornés par les portées du jeton :
 *  - lancer les photos met une tâche en file côté boutique (droits d'image = ceux enregistrés par le PDG) ;
 *  - proposer une fiche écrit un BROUILLON « à relire » : seul le PDG approuve et publie, dans la boutique.
 * Un sixième outil LIT la fiche complète (prix fournisseur, prix saisi, offre boutique, colis, stock observé, photos) : décision
 * du PDG du 3 octobre 2026, en lecture seule et seulement si le PDG a créé le jeton avec la portée facultative catalogue.full.
 * Deux outils règlent la livraison (nombre de colis avec preuve, grille de tarifs du fournisseur) avec la portée delivery.work, décision du PDG du 3 octobre 2026. Aucun outil ne MODIFIE un prix, une TVA, un stock, ni n'approuve ou ne publie quoi que ce soit : la
 * boutique ne l'autorise pas à ce jeton, et aucun outil n'existe pour le demander.
 *
 * Réservés au PDG, comme le coffre dont ils dépendent.
 */
import type { OutilSpec } from "../registre.js";

const COMMUN = {
  version: "1.0.0",
  available: true,
  enabled: true,
  implementationStatus: "IMPLEMENTED" as const,
  allowedRoles: ["super_admin"],
  allowedCountries: null,
  blockedCountries: [],
  requiredSubscription: null,
  requiresHumanApproval: false,
  requiresStrongAuthentication: false,
  category: "boutique" as const,
  provider: "Boutique MKA.P-MS (SHOP) — jeton de service du coffre secret",
  internalReplacementStatus: "Sans objet — SHOP est le moteur de la boutique ; son IA propre prendra le relais quand elle sera prête.",
  timeoutMs: 25_000,
  auditCategory: "boutique_service",
};

const LECTURE = {
  ...COMMUN,
  requiredPermissions: ["READ" as const],
  riskLevel: "READ_ONLY" as const,
  idempotent: true,
  legalBasis: "Lecture des fiches de la boutique de l'entreprise avec un jeton que le PDG a lui-même créé (portée catalogue.read) ; usage journalisé dans le coffre et dans la boutique.",
  fallback: "Adresse ou jeton absent, refusé, expiré ou boutique indisponible : l'outil le dit tel quel — jamais une fiche supposée.",
};

const ECRITURE = {
  ...COMMUN,
  requiredPermissions: ["WRITE" as const],
  riskLevel: "LOW" as const,
  idempotent: false,
};

export const OUTILS_BOUTIQUE: OutilSpec[] = [
  {
    ...LECTURE,
    toolId: "boutique.capacites",
    name: "boutiqueCapacites",
    description:
      "Dit ce que le jeton de service de la boutique permet réellement (portées accordées) et ce qui reste interdit quelle que soit la portée (modifier un prix, la TVA, le stock ou la livraison, approuver, publier). À utiliser avant de promettre un travail dans la boutique.",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, scopes: { type: "array" }, neverAllowed: { type: "array" }, note: { type: "string" } } },
  },
  {
    ...LECTURE,
    toolId: "boutique.listerProduits",
    name: "boutiqueListerProduits",
    description:
      "Liste les fiches produit en cours dans la boutique (identifiant, titre, SKU, état de relecture et révision, publiée ou non, nombre de photos originales archivées et de photos premium prêtes, état de la tâche photo). Jamais de prix. Filtre facultatif par état : DRAFT, REVIEW_REQUIRED, APPROVED, REJECTED, NEEDS_CORRECTION.",
    schemaInput: {
      type: "object",
      properties: { etat: { type: "string", enum: ["DRAFT", "REVIEW_REQUIRED", "APPROVED", "REJECTED", "NEEDS_CORRECTION"] }, limite: { type: "number" }, decalage: { type: "number" } },
      required: [],
    },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, rows: { type: "array" } } },
  },
  {
    ...LECTURE,
    toolId: "boutique.lireProduit",
    name: "boutiqueLireProduit",
    description:
      "Lit une fiche produit de la boutique : titre fournisseur et titre actuel, description fournisseur originale, brouillon de description MKA.P-MS, champs et leur source, colis, état et révision, médias (état, contrôle de marque, photo principale). Jamais de prix ni d'adresse fournisseur.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" } }, required: ["produitId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, id: { type: "string" }, revision: { type: "number" }, media: { type: "array" } } },
  },
  {
    ...LECTURE,
    toolId: "boutique.lireFicheComplete",
    name: "boutiqueLireFicheComplete",
    description:
      "Lit TOUT d'une fiche produit de la boutique, en lecture seule : titre, descriptions, champs, colis (nombre et preuve : un colis, deux colis…), prix fournisseur confirmé, prix saisi par le PDG, offre boutique, stock observé, ligne d'origine du fournisseur telle que reçue (colonnes de prix et de colis non confirmées comprises), avertissements (par exemple PRICE_UNCONFIRMED), photos d'origine et médias. Donne `readiness` : READY_FOR_PDG_REVIEW quand tout ce que l'IA peut préparer est acquis (droits d'image, originaux archivés, photos premium, photo principale, description, champs sourcés, colis, stock réel, prix du PDG présent, fiche « à relire », non publiée) — sinon INCOMPLETE avec la liste de ce qui manque ; `delivery` (grille de livraison du fournisseur) ; `publicationCheck` (ce qui bloquerait une publication : la publication reste au Fondateur). Indique aussi si la preuve des droits d'image du fournisseur est enregistrée (mediaRights) et pourquoi un stock est vide (stockSync : lien CSV de stock présent ? dernière synchronisation, erreur). Un prix absent ou non confirmé est dit tel quel, jamais deviné. Nécessite un jeton créé avec la portée facultative catalogue.full. Ne modifie rien. Les prix et la fiche complète restent entre le PDG et cette IA : ne les copier dans aucun message public.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" } }, required: ["produitId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, id: { type: "string" }, supplierPrice: { type: "object" }, founderPrice: { type: "object" }, shopOffer: { type: "object" }, parcels: { type: "object" }, stock: { type: "object" }, supplierSheet: { type: "object" }, warnings: { type: "array" } } },
    legalBasis: "Lecture complète d'une fiche de la boutique de l'entreprise avec un jeton que le PDG a lui-même créé avec la portée facultative catalogue.full (décision du PDG du 3 octobre 2026) ; usage journalisé dans le coffre et dans la boutique.",
    fallback: "Jeton sans la portée catalogue.full, refusé ou boutique indisponible : l'outil le dit tel quel — jamais un prix supposé.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.synchroniserStock",
    name: "boutiqueSynchroniserStock",
    description:
      "Demande à la boutique de synchroniser le stock du fournisseur d'un produit depuis le lien CSV de stock que le PDG a enregistré dans le coffre de la boutique, puis rend le stock lu pour ce SKU (statut, quantité, date d'observation). L'adresse du flux n'est jamais fournie ici. Une synchronisation par minute et par fournisseur. Si le lien manque ou ne répond pas, l'outil le dit : le stock reste INCONNU, jamais supposé. Nécessite un jeton créé avec la portée facultative stock.sync. Ne crée aucun produit et ne touche à aucun prix.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" } }, required: ["produitId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, sync: { type: "object" }, stock: { type: "object" } } },
    legalBasis: "Synchronisation d'un flux de stock fournisseur déjà configuré par le PDG dans la boutique, avec un jeton qu'il a lui-même créé avec la portée stock.sync ; usage journalisé dans le coffre et dans la boutique.",
    fallback: "Jeton sans la portée, lien de stock absent ou illisible, ou boutique indisponible : l'outil le dit tel quel — aucune disponibilité n'est inventée.",
  },
  {
    ...LECTURE,
    toolId: "boutique.lireApercu",
    name: "boutiqueLireApercu",
    description:
      "Lit l'APERÇU de la fiche tel qu'il apparaît au PDG avant publication, c'est-à-dire la page de vente : titre, description (MKA.P-MS ou, à défaut, celle du fournisseur), photos, PRIX DE VENTE client (distinct du prix fournisseur), disponibilité réelle (« EN STOCK — quantité réelle restante : X »), détails, nombre de colis et tarif de livraison par pays, plus le volet privé (prix fournisseur, ce qui bloque encore la publication). Lecture seule : l'IA ne fixe jamais un prix de vente, le PDG le saisit dans l'atelier produits. Exige la portée catalogue.full.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" } }, required: ["produitId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, product: { type: "object" }, sellingPrice: { type: "object" }, stock: { type: "object" }, delivery: { type: "object" }, private: { type: "object" } } },
    legalBasis: "Lecture de l'aperçu d'une fiche de la boutique de l'entreprise avec un jeton que le PDG a lui-même créé avec la portée facultative catalogue.full (décision du PDG du 3 octobre 2026) ; usage journalisé dans le coffre et dans la boutique.",
    fallback: "Jeton sans la portée catalogue.full, refusé ou boutique indisponible : l'outil le dit tel quel — jamais un prix ou un stock supposé.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.recontrolerMarquePhoto",
    name: "boutiqueRecontrolerMarquePhoto",
    description:
      "Relance le VRAI contrôle de marque d'une version de photo (fiche complète → médias) dont le contrôle n'a pas pu s'exécuter (NOT_CHECKED / CHECK_UNAVAILABLE) ou qui montrait une marque. La version est reconstruite depuis l'original archivé puis contrôlée par l'IA de la boutique ; elle n'est jamais déclarée propre par défaut. Si le contrôle ne peut toujours pas tourner, l'outil rend le motif exact (IA de la boutique non activée, clé absente, quota…). Exige la portée photos.work. Ne publie rien.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" }, mediaId: { type: "string" } }, required: ["produitId", "mediaId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, brandState: { type: "string" }, brandReason: { type: "string" }, eligibleAsMain: { type: "boolean" }, why: { type: "string" } } },
    legalBasis: "Relance d'un contrôle de marque sur une photo déjà archivée par la boutique, avec un jeton que le PDG a lui-même créé (portée photos.work) ; usage journalisé dans le coffre et dans la boutique.",
    fallback: "Version déjà contrôlée, d'un autre produit, jeton sans la portée ou IA de la boutique indisponible : l'outil le dit tel quel — la photo reste non éligible.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.definirColis",
    name: "boutiqueDefinirColis",
    description:
      "Enregistre le NOMBRE DE COLIS d'un produit (1, 2…) avec sa preuve (fiche, message ou document du fournisseur). Le panier public en déduit ensuite tout seul le prix de livraison de 1, 2… colis. Jamais un nombre supposé : sans preuve, l'outil refuse. Exige la portée delivery.work du jeton. Ne touche ni prix, ni TVA, ni stock, et ne publie rien.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" }, nombre: { type: "integer" }, preuve: { type: "string" } }, required: ["produitId", "nombre", "preuve"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, parcelCount: { type: "integer" } } },
    legalBasis: "Enregistrement d'un nombre de colis justifié par le fournisseur, avec un jeton que le PDG a lui-même créé avec la portée delivery.work (décision du PDG du 3 octobre 2026) ; usage journalisé dans le coffre et dans la boutique.",
    fallback: "Jeton sans la portée, preuve absente ou boutique indisponible : l'outil le dit tel quel — le nombre de colis ne change pas.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.retirerPhotosProduit",
    name: "boutiqueRetirerPhotosProduit",
    description:
      "Retire d'un coup de la fiche (aperçu, galerie, vitrine) TOUTES les photos venues avec le produit, pour les remplacer par celles qu'on ajoute soi-même (boutique.ajouterMediaParLien). La boutique ne supprime JAMAIS rien : le retrait est réversible (boutique.retirerMediaGalerie avec remettre=true) et les originaux du fournisseur restent conservés tels quels. La photo principale actuelle reste tant qu'une autre n'est pas choisie. Pour une fiche publiée, la vitrine est mise à jour tout de suite, sans republier. Exige la portée photos.work. Ne touche ni prix, ni stock, ni publication.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" } }, required: ["produitId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, retired: { type: "integer" }, mainKept: { type: "boolean" } } },
    legalBasis: "Retrait réversible de photos de la galerie, avec un jeton que le PDG a lui-même créé (portée photos.work) ; aucune suppression ; usage journalisé dans le coffre et dans la boutique.",
    fallback: "Produit inconnu ou jeton sans la portée : l'outil le dit tel quel — la galerie ne change pas.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.remplirFicheDepuisFournisseur",
    name: "boutiqueRemplirFicheDepuisFournisseur",
    description:
      "Reprend dans la fiche d'un produit les CARACTÉRISTIQUES que le fournisseur a lui-même données (âge minimum, charge maximale de l'enfant, batterie, moteurs, vitesse, télécommande, démarrage progressif, siège, ceinture, suspension, éclairage, audio/MP3, USB, Bluetooth, dimensions…), chacune avec sa source. Jamais d'écrasement d'une valeur déjà saisie, jamais d'invention (âge maximum jamais déduit) ; pays d'origine et autres données fournisseur restent internes. Une fiche publiée n'est pas touchée. La fiche reste « à relire ». Exige la portée drafts.propose. Ne touche ni prix, ni stock, ni publication.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" } }, required: ["produitId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, filled: { type: "integer" }, results: { type: "array" } } },
    legalBasis: "Reprise des seules données du fournisseur dans la fiche privée, avec un jeton que le PDG a lui-même créé (portée drafts.propose) ; usage journalisé dans le coffre et dans la boutique.",
    fallback: "Aucun attribut reconnu, fiche publiée ou jeton sans la portée : l'outil le dit tel quel — la fiche ne change pas.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.appliquerColisFournisseur",
    name: "boutiqueAppliquerColisFournisseur",
    description:
      "Applique à un produit le NOMBRE DE COLIS lu dans l'attribut « Shipment » du fournisseur (« Regular shipment » = 1 colis, « 2x regular shipping » = 2 colis). Palette ou texte inconnu : aucun nombre inventé, la fiche reste « à confirmer ». Pour un nombre confirmé par le PDG sans attribut, utiliser boutique.definirColis avec sa preuve. Le panier compte ensuite 1 ou 2 frais de colis. Exige la portée delivery.work. Ne touche ni prix, ni stock, ni publication.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" } }, required: ["produitId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, applied: { type: "array" }, missing: { type: "array" }, pallet: { type: "array" } } },
    legalBasis: "Application du nombre de colis indiqué par le fournisseur lui-même, avec un jeton que le PDG a lui-même créé avec la portée delivery.work ; usage journalisé dans le coffre et dans la boutique.",
    fallback: "Attribut absent, palette, texte inconnu ou jeton sans la portée : l'outil le dit tel quel — le nombre de colis ne change pas.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.importerGrilleLivraison",
    name: "boutiqueImporterGrilleLivraison",
    description:
      "Enregistre la grille de tarifs de livraison du FOURNISSEUR du produit, par pays, telle que communiquée par lui (« Pays ; montant », une ligne par pays). Précisez hors taxes ou taxes comprises, la preuve (document/message du fournisseur) et la date de fin de validité. apercu=true montre ce qui serait enregistré sans rien écrire. Les tarifs ne sont jamais inventés : seulement ceux que le fournisseur a transmis. Exige la portée delivery.work. Ne touche ni prix, ni TVA, ni stock.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" }, grille: { type: "string" }, devise: { type: "string" }, base: { type: "string", enum: ["PER_PARCEL", "PER_ITEM"] }, taxe: { type: "string", enum: ["EXCLUDED", "INCLUDED"] }, preuve: { type: "string" }, valideJusqua: { type: "string" }, apercu: { type: "boolean" } }, required: ["produitId", "grille", "taxe", "preuve", "valideJusqua"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, stored: { type: "integer" }, countries: { type: "array" }, rejected: { type: "array" } } },
    legalBasis: "Enregistrement des tarifs de livraison communiqués par le fournisseur, avec un jeton que le PDG a lui-même créé avec la portée delivery.work (décision du PDG du 3 octobre 2026) ; usage journalisé dans le coffre et dans la boutique.",
    fallback: "Jeton sans la portée, grille illisible, preuve ou validité absentes, ou boutique indisponible : l'outil le dit tel quel — aucun tarif n'est enregistré.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.choisirPhotoPrincipale",
    name: "boutiqueChoisirPhotoPrincipale",
    description:
      "Choisit, parmi les versions prêtes du produit (fiche complète → médias), la photo PRINCIPALE de la fiche ; les autres versions prêtes restent les photos secondaires. La boutique refuse une photo fournisseur dont la marque n'est pas contrôlée « sans marque » : choisir alors une version MKA.P-MS contrôlée. Ne publie rien et ne touche à aucun prix. Nécessite la portée photos.work.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" }, mediaId: { type: "string" } }, required: ["produitId", "mediaId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, selected: { type: "boolean" } } },
    legalBasis: "Choix d'une photo déjà préparée et contrôlée par la boutique, avec un jeton que le PDG a lui-même créé (portée photos.work) ; usage journalisé dans le coffre et dans la boutique.",
    fallback: "Photo non prête, marque non contrôlée, jeton sans la portée ou boutique indisponible : l'outil le dit tel quel — la photo principale ne change pas.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.ajouterMediaParLien",
    name: "boutiqueAjouterMediaParLien",
    description:
      "AJOUTE à une fiche de la boutique une photo ou une vidéo DÉJÀ PRÉPARÉE (lien https public : fichier direct, sans identifiant ni secret). La boutique ne retouche, ne recadre et ne remplace rien : le fichier est gardé tel que reçu (photo convertie en WebP). Les originaux du fournisseur ne sont jamais touchés. « principale » = choisir cette photo comme photo principale. Une VIDÉO doit être réelle et autorisée (« reelle » true + « droits » = référence de l'autorisation), 10 secondes minimum, sans texte ; ne jamais présenter une vidéo comme un essai réel si ce n'en est pas un. Droits des photos : ceux enregistrés par le PDG pour le fournisseur. Rien n'est publié.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" }, url: { type: "string" }, type: { type: "string", enum: ["photo", "video"] }, principale: { type: "boolean" }, reelle: { type: "boolean" }, droits: { type: "string" }, libelle: { type: "string" } }, required: ["produitId", "url", "type"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, mediaId: { type: "string" }, selected: { type: "boolean" }, video: { type: "object" } } },
    legalBasis: "Ajout d'un fichier déjà préparé par une personne ou un agent, avec un jeton que le PDG a lui-même créé (portée photos.work) ; droits d'image enregistrés par le PDG ; usage journalisé dans le coffre et dans la boutique.",
    fallback: "Lien refusé (non https, adresse privée, secret dans le lien), fichier du mauvais type ou trop lourd, droits d'image absents, vidéo trop courte, jeton sans la portée ou boutique indisponible : l'outil le dit tel quel — rien n'est ajouté.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.retirerMediaGalerie",
    name: "boutiqueRetirerMediaGalerie",
    description:
      "Retire une photo de la galerie d'une fiche (aperçu, galerie, vitrine) pour la REMPLACER, ou la remet (« remettre » true). La boutique ne supprime JAMAIS rien : le fichier et les originaux du fournisseur restent conservés. La photo principale ne se retire pas : choisir d'abord une autre photo principale. Une fiche déjà publiée voit sa galerie mise à jour sans republication.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" }, mediaId: { type: "string" }, remettre: { type: "boolean" } }, required: ["produitId", "mediaId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, hidden: { type: "boolean" } } },
    legalBasis: "Retrait réversible d'une photo de la galerie, avec un jeton que le PDG a lui-même créé (portée photos.work) ; aucune suppression ; usage journalisé dans le coffre et dans la boutique.",
    fallback: "Photo inconnue pour ce produit, photo principale ou jeton sans la portée : l'outil le dit tel quel — la galerie ne change pas.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.lancerPhotos",
    name: "boutiqueLancerPhotos",
    description:
      "Met en file, dans la boutique, la préparation automatique des photos MKA.P-MS d'une fiche — DÉSACTIVÉE par défaut dans la boutique (le PDG ajoute les photos lui-même ou par un agent : voir boutique.ajouterMediaParLien) (archivage de l'original, recadrage fidèle sans rien inventer, contrôle de marque). Exige que le PDG ait déjà enregistré les droits d'image du fournisseur dans la boutique ; sinon l'outil le dit et rien ne démarre. Ne publie rien.",
    schemaInput: { type: "object", properties: { produitId: { type: "string" } }, required: ["produitId"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, detail: { type: "string" } } },
    legalBasis: "Mise en file d'un traitement déjà prévu par la boutique, avec la référence de droits d'image enregistrée par le PDG pour le fournisseur (portée photos.work) ; usage journalisé.",
    fallback: "Droits d'image absents, jeton sans la portée, ou boutique indisponible : l'outil le dit tel quel — aucune photo n'est traitée.",
  },
  {
    ...ECRITURE,
    toolId: "boutique.proposerFiche",
    name: "boutiqueProposerFiche",
    description:
      "Propose le contenu d'une fiche produit (titre, description MKA.P-MS originale, caractéristiques avec leur source, colis). C'est un BROUILLON « à relire » : le PDG l'approuve ou le refuse dans la boutique, jamais l'IA. Lire d'abord la fiche (révision attendue). N'inventer aucune caractéristique : chaque champ renseigné exige sa source ; un champ inconnu reste FIELD_MISSING. FORME EXACTE de `champs` : un objet dont chaque clé est UN de ces noms — RecommendedAgeMin, RecommendedAgeMax, RecommendedHeightMin, RecommendedHeightMax, MaxChildWeight, Seats, SeatDimensions, ProductLength, ProductWidth, ProductHeight, ProductWeight, BatteryVoltage, BatteryCapacity, MotorCount, MotorPower, MaxSpeed, EstimatedRuntime, ChargingTime, RemoteControl, WheelType, SeatType, Lights, Bluetooth, USB, Audio, ChargerIncluded, BatteryIncluded, SafetyWarnings, AdultSupervision, IndoorOutdoor (aucun autre nom) — et dont la valeur est { statut, valeur, source } (les clés status/value/sourceRef sont aussi acceptées) : statut = FIELD_AVAILABLE (valeur ET source obligatoires), FIELD_NOT_APPLICABLE (source obligatoire), FIELD_UNVERIFIED ou FIELD_MISSING ; valeur = TEXTE (écrire « 30 kg », pas un nombre seul si l'unité compte). Exemple : {\"Seats\":{\"statut\":\"FIELD_AVAILABLE\",\"valeur\":\"1\",\"source\":\"fiche fournisseur c4k1166\"}}. FORME de `colis` : liste de { longueurMm, largeurMm, hauteurMm, poidsGrammes, source } en nombres positifs (arrondis à l'entier) ; ne déclarer un colis que si ses mesures sont documentées. En cas de refus, le message nomme le champ en cause : corriger CE champ et rejouer, sans rien inventer.",
    schemaInput: {
      type: "object",
      properties: {
        produitId: { type: "string" },
        revisionAttendue: { type: "number" },
        titre: { type: "string" },
        descriptionBoutique: { type: "string" },
        champs: { type: "object", description: "Clés = noms de champs de la boutique ; valeur = { statut, valeur (texte), source }." },
        colis: { type: "array", description: "Liste de { longueurMm, largeurMm, hauteurMm, poidsGrammes, source }." },
      },
      required: ["produitId", "revisionAttendue", "titre", "descriptionBoutique"],
    },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" }, saved: { type: "boolean" }, revision: { type: "number" }, state: { type: "string" } } },
    legalBasis: "Écriture d'un brouillon de fiche, non publié et soumis à relecture du PDG, avec un jeton que le PDG a lui-même créé (portée drafts.propose) ; historique signé côté boutique.",
    fallback: "Jeton sans la portée, révision périmée, champ sans source ou boutique indisponible : l'outil le dit tel quel — rien n'est enregistré.",
  },
];
