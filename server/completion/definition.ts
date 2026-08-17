/**
 * Point 119 — définition obligatoire de TERMINÉ.
 *
 * TERMINÉ = Construit + Connecté + Activé + Testé + Observable
 *         + Inscrit au registre des moteurs + Rapporté au Système Intelligent
 *         + Non-régression vérifiée + Preuve de résultat.
 *
 * Tout le reste est PAS TERMINÉ. Ce fichier ne contient que la règle : le
 * calcul, lui, ne lit que des observations réelles (service.ts).
 */
export const MAILLONS = [
  "construit",
  "connecte",
  "active",
  "teste",
  "observable",
  "inscrit_registre",
  "rapporte_systeme",
  "non_regression",
  "preuve_resultat",
] as const;

export type Maillon = (typeof MAILLONS)[number];

export const MAILLON_LABELS: Record<Maillon, string> = {
  construit: "Construit — le code existe et le domaine est déclaré",
  connecte: "Connecté — une surface réellement montée le rend joignable",
  active: "Activé — le moteur est en service, pas en brouillon",
  teste: "Testé — une preuve de test datée existe",
  observable: "Observable — un signal de santé récent est reçu",
  inscrit_registre: "Inscrit au registre central des moteurs",
  rapporte_systeme: "Rapporté au Système Intelligent",
  non_regression: "Non-régression vérifiée à la dernière campagne",
  preuve_resultat: "Preuve de résultat — des données réelles sont produites",
};

/** Ce qui manque pour qu'un maillon absent devienne présent. */
export const MAILLON_MANQUES: Record<Maillon, string> = {
  construit: "Le domaine n'est pas construit : rien à activer pour l'instant.",
  connecte: "Aucune surface montée : le code existe mais personne ne peut l'atteindre.",
  active: "Moteur hors service ou en préproduction : il ne sert pas encore les utilisateurs.",
  teste: "Aucune preuve de test datée : « ça marche » n'est pas une preuve.",
  observable: "Aucun signal de santé récent : une panne passerait inaperçue.",
  inscrit_registre: "Absent du registre central : il échappe à la supervision.",
  rapporte_systeme: "Non relié au Système Intelligent : ses anomalies ne remontent pas.",
  non_regression: "Une régression est ouverte : cela fonctionnait avant.",
  preuve_resultat: "Aucune donnée réelle produite : la fonction n'a jamais servi.",
};

/**
 * Point 121 — domaines du Completion Center, dans l'ordre demandé.
 * Chaque domaine pointe vers les moteurs réels qui le portent : le
 * pourcentage est la part de maillons prouvés, jamais une estimation.
 */
export interface DomaineCompletion {
  cle: string;
  label: string;
  moteurs: string[];
  /** Domaines du Continuous Test Engine qui prouvent ce domaine. */
  testDomaines: string[];
}

export const DOMAINES: DomaineCompletion[] = [
  { cle: "seo", label: "SEO", moteurs: ["seo", "indexation"], testDomaines: ["seo"] },
  {
    cle: "audience",
    label: "Audience",
    moteurs: ["visibility_audience", "visibility"],
    testDomaines: ["audience", "visibility"],
  },
  {
    cle: "google",
    label: "Google",
    moteurs: ["indexation", "product_engine"],
    testDomaines: ["seo", "product_engine"],
  },
  {
    cle: "ia",
    label: "Intelligence artificielle",
    moteurs: ["ai_fabric", "ai_learning_os", "code_graph"],
    testDomaines: ["ai", "code_graph"],
  },
  {
    cle: "paiement",
    label: "Paiement",
    moteurs: ["payment_engine", "payment"],
    testDomaines: ["paiement", "payment"],
  },
  {
    cle: "comptes",
    label: "Comptes",
    moteurs: ["identity", "permission", "account_routing"],
    testDomaines: ["roles", "comptes"],
  },
  { cle: "garage", label: "Garage", moteurs: ["garage"], testDomaines: ["garage"] },
  { cle: "vo", label: "Véhicules d'occasion", moteurs: ["vo", "vo_engine"], testDomaines: ["vo"] },
  { cle: "location", label: "Location", moteurs: ["location"], testDomaines: ["location"] },
  { cle: "pieces", label: "Pièces", moteurs: ["pieces"], testDomaines: ["pieces"] },
  { cle: "pro", label: "Professionnels", moteurs: ["pro_portal", "pro_account"], testDomaines: ["pro"] },
  { cle: "encheres", label: "Enchères", moteurs: ["auction_engine", "encheres"], testDomaines: ["encheres"] },
  {
    cle: "comptabilite",
    label: "Comptabilité",
    moteurs: ["comptabilite", "finance"],
    testDomaines: ["comptabilite", "finance"],
  },
  {
    cle: "avis",
    label: "Avis & réputation",
    moteurs: ["reviews_engine", "reviews"],
    testDomaines: ["avis", "reviews"],
  },
  {
    cle: "reseaux_sociaux",
    label: "Réseaux sociaux",
    moteurs: ["visibility_social", "social_content"],
    testDomaines: ["social"],
  },
  {
    cle: "pays",
    label: "Pays",
    moteurs: ["country", "country_policy", "language"],
    testDomaines: ["pays"],
  },
  {
    cle: "systeme_intelligent",
    label: "Système Intelligent",
    moteurs: ["smart", "smart_audit", "event_bus", "continuous_test"],
    testDomaines: ["smart", "central", "core"],
  },
];
