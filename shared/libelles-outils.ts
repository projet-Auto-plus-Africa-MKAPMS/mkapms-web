/**
 * Libellés lisibles des outils appelés par AL-HUDHUD·M : ce que l'écran montre
 * « en direct » (Chat et Travail) à la place de l'identifiant technique.
 */
const ACTIONS: Record<string, string> = {
  "boutique.capacites": "Vérifie les autorisations de la Boutique",
  "boutique.listerProduits": "Parcourt les produits de la Boutique",
  "boutique.lireProduit": "Lit la fiche produit",
  "boutique.lireFicheComplete": "Lit la fiche produit complète",
  "boutique.synchroniserStock": "Synchronise le stock du fournisseur",
  "boutique.lireApercu": "Lit l’aperçu de la page de vente",
  "boutique.recontrolerMarquePhoto": "Recontrôle la marque sur la photo",
  "boutique.definirColis": "Enregistre le nombre de colis",
  "boutique.importerGrilleLivraison": "Enregistre la grille de livraison",
  "boutique.choisirPhotoPrincipale": "Choisit la photo principale",
  "boutique.lancerPhotos": "Prépare les photos de la fiche",
  "boutique.proposerFiche": "Propose le brouillon de la fiche",
};

const FAMILLES: Record<string, string> = {
  boutique: "Boutique",
  recherche: "Recherche",
  vehicules: "Véhicules",
  estimate: "Estimation",
  memory: "Mémoire",
  knowledge: "Connaissances",
  rag: "Documents",
  files: "Fichiers",
  fichiers: "Fichiers",
  filesystem: "Fichiers du projet",
  documents: "Documents",
  code: "Code",
  project: "Projet",
  build: "Construction",
  typecheck: "Contrôle des types",
  lint: "Contrôle du code",
  test: "Tests",
  preview: "Aperçu",
  railway_deploiement: "Déploiement",
  api_externes: "API externe",
  images: "Images",
  voix: "Voix",
  stock: "Stock",
  livraison: "Livraison",
  transport: "Transport",
  douane: "Douane",
  pieces: "Pièces",
  paiements: "Paiements",
  securite: "Sécurité",
  permissions: "Permissions",
  observabilite: "Surveillance",
};

/** « lireFicheComplete » → « lire fiche complete » */
function mots(identifiant: string): string {
  return identifiant
    .replace(/[_.]+/g, " ")
    .replace(/([a-zà-ÿ0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .trim();
}

export function libelleOutil(toolId: string): string {
  const connu = ACTIONS[toolId];
  if (connu) return connu;
  const point = toolId.indexOf(".");
  if (point < 0) return mots(toolId) || toolId;
  const famille = toolId.slice(0, point);
  const action = mots(toolId.slice(point + 1));
  const nom = FAMILLES[famille] ?? mots(famille);
  const phrase = action ? `${nom} : ${action}` : nom;
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

export type StatutAppelOutil = "en_cours" | "fait" | "refuse" | "en_attente_autorisation" | "echec";

export function statutAppelOutil(verdictPolitique: string, statutExecution: string | null): StatutAppelOutil {
  if (verdictPolitique === "attente_approbation_humaine") return "en_attente_autorisation";
  if (verdictPolitique !== "autorise") return "refuse";
  if (statutExecution === null) return "en_cours";
  return statutExecution === "execute" ? "fait" : "echec";
}
