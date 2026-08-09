/**
 * Partner Engine — catalogue des services partenaires (point 36).
 *
 * Un partenaire couvre un ou plusieurs services dans une zone. Les mots-clés
 * servent au point 37 : reconnaître, dans les recherches réellement faites par
 * les visiteurs, qu'un besoin concerne ce service. Ils vivent ici plutôt que
 * dans une requête SQL pour qu'ajouter un service ne demande pas de toucher au
 * moteur de détection.
 */
export interface PartnerServiceDef {
  code: string;
  label: string;
  /** Métiers du portail Pro capables de couvrir ce service. */
  professions: string[];
  /** Mots-clés observés dans les recherches (minuscules, sans accent obligatoire). */
  keywords: string[];
}

export const PARTNER_SERVICES: PartnerServiceDef[] = [
  {
    code: "controle_technique",
    label: "Contrôle technique",
    professions: ["controle_technique"],
    keywords: ["controle technique", "contrôle technique", "ct auto", "controle tech"],
  },
  {
    code: "garage",
    label: "Garage / entretien",
    professions: ["garage"],
    keywords: ["garage", "entretien", "revision", "révision", "reparation", "réparation", "vidange", "embrayage"],
  },
  {
    code: "carrosserie",
    label: "Carrosserie",
    professions: ["carrosserie"],
    keywords: ["carrosserie", "carrossier", "peinture auto", "debosselage", "débosselage", "pare-brise"],
  },
  {
    code: "depannage",
    label: "Dépannage / remorquage",
    professions: ["depannage"],
    keywords: ["depannage", "dépannage", "remorquage", "remorqueur", "panne"],
  },
  {
    code: "pieces",
    label: "Pièces automobiles",
    professions: ["pieces"],
    keywords: ["piece", "pièce", "pieces auto", "plaquette", "pneu", "batterie", "amortisseur"],
  },
  {
    code: "location",
    label: "Location de véhicule",
    professions: ["loueur"],
    keywords: ["location", "louer", "louer voiture", "location utilitaire"],
  },
  {
    code: "vtc_taxi",
    label: "VTC / Taxi",
    professions: ["vtc_taxi"],
    keywords: ["vtc", "taxi", "chauffeur"],
  },
  {
    code: "transport",
    label: "Transport / livraison de véhicule",
    professions: ["transport_livraison"],
    keywords: ["transport vehicule", "transport véhicule", "livraison vehicule", "convoyage"],
  },
  {
    code: "comptabilite",
    label: "Comptabilité",
    professions: ["comptabilite"],
    keywords: ["comptable", "comptabilite", "comptabilité", "expert comptable", "bilan"],
  },
  {
    code: "lavage",
    label: "Lavage / préparation",
    professions: ["garage"],
    keywords: ["lavage", "nettoyage auto", "preparation esthetique", "préparation esthétique", "detailing"],
  },
];

export function findPartnerService(code: string): PartnerServiceDef | undefined {
  return PARTNER_SERVICES.find((s) => s.code === code);
}
