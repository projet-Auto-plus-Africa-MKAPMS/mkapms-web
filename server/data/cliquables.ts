/**
 * Inventaire des éléments cliquables de la plateforme.
 *
 * Fichier GÉNÉRÉ par scripts/gen-cliquables.mjs depuis client/src.
 * Ne pas éditer à la main : `npm run gen:cliquables` le régénère, et la
 * construction échoue s'il est périmé.
 *
 * Il sert au module d'auto-branchement : chaque écran est compté par genre de
 * cliquable, et chaque anomalie est nommée avec son fichier et sa ligne, de
 * sorte que le Moteur de boutons, le Moteur de Redirection, le contrôle
 * continu, le Système Intelligent et MKA.P-MS AI travaillent sur des
 * faits et non sur une impression d'écran.
 */

/** Comptage des cliquables d'un écran, par genre. */
export interface EcranCliquables {
  readonly fichier: string;
  /** Tous genres confondus. */
  readonly total: number;
  /** Passés par `BoutonMoteur` : le moteur sait ce qu'ils font. */
  readonly moteur: number;
  /** Liens de navigation interne. */
  readonly liens: number;
  /** Boutons avec exécution locale (onClick / submit) hors moteur. */
  readonly boutonsLocaux: number;
  /** Boutons qui ne déclenchent rien du tout. */
  readonly sansAction: number;
  /** Éléments non-bouton rendus cliquables (div, ligne de tableau, image…). */
  readonly zones: number;
}

export type MotifAnomalie = "sans_action" | "destination_inconnue" | "code_non_declare";

export interface AnomalieCliquable {
  readonly fichier: string;
  readonly ligne: number;
  readonly genre: "bouton" | "lien" | "moteur";
  /** Texte du bouton, destination du lien, ou code d'action selon le genre. */
  readonly libelle: string;
  readonly motif: MotifAnomalie;
}

export const CLIQUABLES_TOTAL = 2639;

export const CLIQUABLES_PAR_ECRAN: readonly EcranCliquables[] = [
  { fichier: "client/src/components/AccessDenied.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/AssistantFlottant.tsx", total: 5, moteur: 0, liens: 1, boutonsLocaux: 4, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/avis/BlocAvis.tsx", total: 7, moteur: 0, liens: 1, boutonsLocaux: 6, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/BoutonIntelligences.tsx", total: 2, moteur: 1, liens: 0, boutonsLocaux: 0, sansAction: 0, zones: 1 },
  { fichier: "client/src/components/CountrySelectModal.tsx", total: 4, moteur: 0, liens: 0, boutonsLocaux: 4, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/demarches/DemarcheFormulaire.tsx", total: 3, moteur: 2, liens: 0, boutonsLocaux: 1, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/DocumentPDF.tsx", total: 8, moteur: 0, liens: 0, boutonsLocaux: 6, sansAction: 0, zones: 2 },
  { fichier: "client/src/components/FileUpload.tsx", total: 1, moteur: 0, liens: 0, boutonsLocaux: 0, sansAction: 0, zones: 1 },
  { fichier: "client/src/components/InstallPrompt.tsx", total: 4, moteur: 0, liens: 0, boutonsLocaux: 4, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/Layout.tsx", total: 12, moteur: 0, liens: 7, boutonsLocaux: 5, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/MicroVocal.tsx", total: 1, moteur: 0, liens: 0, boutonsLocaux: 1, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/NewsletterForm.tsx", total: 1, moteur: 0, liens: 0, boutonsLocaux: 1, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/RequirePermission.tsx", total: 2, moteur: 0, liens: 2, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/ReserverLocationButton.tsx", total: 2, moteur: 0, liens: 0, boutonsLocaux: 2, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/reviews/ReviewCard.tsx", total: 2, moteur: 0, liens: 0, boutonsLocaux: 2, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/reviews/ReviewForm.tsx", total: 4, moteur: 0, liens: 0, boutonsLocaux: 4, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/reviews/ReviewSection.tsx", total: 1, moteur: 0, liens: 0, boutonsLocaux: 1, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/reviews/ReviewStars.tsx", total: 1, moteur: 0, liens: 0, boutonsLocaux: 1, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/SearchLine.tsx", total: 1, moteur: 0, liens: 0, boutonsLocaux: 1, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/ShareButton.tsx", total: 2, moteur: 0, liens: 0, boutonsLocaux: 2, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/SmartRouter.tsx", total: 3, moteur: 0, liens: 0, boutonsLocaux: 3, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/SupportWidget.tsx", total: 3, moteur: 0, liens: 0, boutonsLocaux: 3, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/UniversBoundary.tsx", total: 2, moteur: 0, liens: 1, boutonsLocaux: 1, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/VehicleIdentification.tsx", total: 6, moteur: 0, liens: 0, boutonsLocaux: 6, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/VoiceSettingsPanel.tsx", total: 3, moteur: 0, liens: 0, boutonsLocaux: 3, sansAction: 0, zones: 0 },
  { fichier: "client/src/components/VoProGate.tsx", total: 4, moteur: 0, liens: 4, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/lib/boutonMoteur.tsx", total: 5, moteur: 1, liens: 0, boutonsLocaux: 2, sansAction: 2, zones: 0 },
  { fichier: "client/src/pages/Abonnements.tsx", total: 6, moteur: 0, liens: 1, boutonsLocaux: 4, sansAction: 0, zones: 1 },
  { fichier: "client/src/pages/AbonnementsDefinitifs.tsx", total: 6, moteur: 0, liens: 1, boutonsLocaux: 4, sansAction: 0, zones: 1 },
  { fichier: "client/src/pages/AccesPDG.tsx", total: 1, moteur: 0, liens: 0, boutonsLocaux: 1, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/Acheter.tsx", total: 5, moteur: 0, liens: 1, boutonsLocaux: 4, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/Admin.tsx", total: 108, moteur: 0, liens: 27, boutonsLocaux: 76, sansAction: 0, zones: 5 },
  { fichier: "client/src/pages/AssistanceSinistre.tsx", total: 4, moteur: 0, liens: 2, boutonsLocaux: 2, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/AssistantIntelligences.tsx", total: 4, moteur: 0, liens: 1, boutonsLocaux: 3, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/AtelierPro.tsx", total: 29, moteur: 20, liens: 3, boutonsLocaux: 2, sansAction: 0, zones: 4 },
  { fichier: "client/src/pages/AuditActivation.tsx", total: 4, moteur: 0, liens: 1, boutonsLocaux: 3, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/CentreAlertesStrategiques.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/CentreAutoMarketing.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/CentreCroissance.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/CentreKPI.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/CentreObjectifsEntreprise.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/CentrePerformanceIA.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/EscaladesAutomatiques.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/FilesAttente.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/IAAffectation.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/IAControle.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/IAPriorisation.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/MoteurTaches.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/MoteurWorkflow.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/ObjectifAutomatisations.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/automatisations/WorkflowsPersonnalises.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/AvisUnivers.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/BadgesDefinitifs.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CalendrierDispo.tsx", total: 2, moteur: 0, liens: 2, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CarteGrise.tsx", total: 4, moteur: 0, liens: 0, boutonsLocaux: 4, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CarteMondiale.tsx", total: 1, moteur: 0, liens: 0, boutonsLocaux: 1, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CatalogueTechnique.tsx", total: 15, moteur: 5, liens: 2, boutonsLocaux: 7, sansAction: 0, zones: 1 },
  { fichier: "client/src/pages/CentreActions.tsx", total: 8, moteur: 0, liens: 1, boutonsLocaux: 7, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreAutoBranchement.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreBusEvenements.tsx", total: 3, moteur: 0, liens: 1, boutonsLocaux: 2, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreCommandes.tsx", total: 11, moteur: 0, liens: 4, boutonsLocaux: 7, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreConnaissance.tsx", total: 10, moteur: 0, liens: 1, boutonsLocaux: 9, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreControleContinu.tsx", total: 3, moteur: 0, liens: 1, boutonsLocaux: 2, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreDocuments.tsx", total: 5, moteur: 0, liens: 4, boutonsLocaux: 1, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreIA.tsx", total: 7, moteur: 0, liens: 1, boutonsLocaux: 6, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreIndexation.tsx", total: 6, moteur: 0, liens: 1, boutonsLocaux: 5, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreIntelligences.tsx", total: 21, moteur: 0, liens: 4, boutonsLocaux: 17, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentrePenalites.tsx", total: 2, moteur: 0, liens: 1, boutonsLocaux: 1, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreProduitsGoogle.tsx", total: 3, moteur: 0, liens: 1, boutonsLocaux: 2, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreReglesPays.tsx", total: 5, moteur: 0, liens: 1, boutonsLocaux: 4, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreReputation.tsx", total: 3, moteur: 0, liens: 1, boutonsLocaux: 2, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreResilience.tsx", total: 7, moteur: 0, liens: 1, boutonsLocaux: 6, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CentreSystemeIntelligent.tsx", total: 3, moteur: 0, liens: 1, boutonsLocaux: 2, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/communaute/AvisConseils.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/communaute/GuidesAchat.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/communaute/GuidesGarage.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/communaute/GuidesLocation.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/communaute/GuidesVente.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/communaute/QuestionsReponses.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/Comparateur.tsx", total: 4, moteur: 0, liens: 1, boutonsLocaux: 3, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/CompletionCenter.tsx", total: 4, moteur: 0, liens: 1, boutonsLocaux: 3, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/Comptabilite.tsx", total: 1, moteur: 0, liens: 0, boutonsLocaux: 1, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/comptabilite/AbonnementsCompta.tsx", total: 15, moteur: 0, liens: 1, boutonsLocaux: 12, sansAction: 0, zones: 2 },
  { fichier: "client/src/pages/comptabilite/Alertes.tsx", total: 8, moteur: 0, liens: 1, boutonsLocaux: 5, sansAction: 0, zones: 2 },
  { fichier: "client/src/pages/comptabilite/CentrePilotage.tsx", total: 28, moteur: 0, liens: 1, boutonsLocaux: 25, sansAction: 2, zones: 0 },
  { fichier: "client/src/pages/comptabilite/ComptaAnalytique.tsx", total: 10, moteur: 0, liens: 1, boutonsLocaux: 7, sansAction: 0, zones: 2 },
  { fichier: "client/src/pages/comptabilite/FacturationAvancee.tsx", total: 16, moteur: 0, liens: 1, boutonsLocaux: 13, sansAction: 0, zones: 2 },
  { fichier: "client/src/pages/comptabilite/InvestissementAdmin.tsx", total: 11, moteur: 0, liens: 0, boutonsLocaux: 10, sansAction: 0, zones: 1 },
  { fichier: "client/src/pages/comptabilite/Paiements.tsx", total: 13, moteur: 0, liens: 1, boutonsLocaux: 10, sansAction: 0, zones: 2 },
  { fichier: "client/src/pages/comptabilite/PublicitesRevenu.tsx", total: 8, moteur: 0, liens: 1, boutonsLocaux: 5, sansAction: 0, zones: 2 },
  { fichier: "client/src/pages/comptabilite/Rapports.tsx", total: 13, moteur: 0, liens: 1, boutonsLocaux: 10, sansAction: 0, zones: 2 },
  { fichier: "client/src/pages/comptabilite/TVA.tsx", total: 12, moteur: 0, liens: 1, boutonsLocaux: 9, sansAction: 0, zones: 2 },
  { fichier: "client/src/pages/comptabilite/WalletAdmin.tsx", total: 6, moteur: 0, liens: 0, boutonsLocaux: 6, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/ComptaDirigeant.tsx", total: 22, moteur: 0, liens: 2, boutonsLocaux: 15, sansAction: 0, zones: 5 },
  { fichier: "client/src/pages/Compte.tsx", total: 60, moteur: 0, liens: 13, boutonsLocaux: 39, sansAction: 0, zones: 8 },
  { fichier: "client/src/pages/compte/MesAvis.tsx", total: 2, moteur: 0, liens: 2, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/Confiance.tsx", total: 2, moteur: 0, liens: 2, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/Confidentialite.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/conformite/AssurancesPays.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/conformite/CentrePays.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/conformite/ContratsAdaptes.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/conformite/DevisesAutomatiques.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/conformite/DocumentsObligatoiresPays.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/conformite/GaragePays.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/conformite/IAJuridique.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/conformite/ImmatriculationsPays.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/conformite/LocationPays.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client/src/pages/conformite/MisesAJourReglementaires.tsx", total: 1, moteur: 0, liens: 1, boutonsLocaux: 0, sansAction: 0, zones: 0 },
  { fichier: "client