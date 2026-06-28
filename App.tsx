import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Layout from "./components/Layout";
import { useAuth } from "./lib/auth";
import { trpc } from "./lib/trpc";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import UniversBoundary from "./components/UniversBoundary";
import InstallPrompt from "./components/InstallPrompt";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Lazy-loaded pages (code-splitting)
const Acheter = lazy(() => import("./pages/Acheter"));
const Louer = lazy(() => import("./pages/Louer"));
const Vehicule = lazy(() => import("./pages/Vehicule"));
const Vendre = lazy(() => import("./pages/Vendre"));
const Devis = lazy(() => import("./pages/Devis"));
const Garages = lazy(() => import("./pages/Garages"));
const GaragePlus = lazy(() => import("./pages/GaragePlus"));
const Abonnements = lazy(() => import("./pages/Abonnements"));
const Aide = lazy(() => import("./pages/Aide"));
const Confiance = lazy(() => import("./pages/Confiance"));
const Connexion = lazy(() => import("./pages/Connexion"));
const Compte = lazy(() => import("./pages/Compte"));
const Favoris = lazy(() => import("./pages/Favoris"));
const Validation = lazy(() => import("./pages/Validation"));
const Admin = lazy(() => import("./pages/Admin"));
const Univers = lazy(() => import("./pages/Univers"));
const Pieces = lazy(() => import("./pages/Pieces"));
const Livraison = lazy(() => import("./pages/Livraison"));
const Depannage = lazy(() => import("./pages/Depannage"));
const VtcTaxi = lazy(() => import("./pages/VtcTaxi"));
const LocationPro = lazy(() => import("./pages/LocationPro"));
const LocationParticulier = lazy(() => import("./pages/LocationParticulier"));
const ProduitVtcTaxi = lazy(() => import("./pages/ProduitVtcTaxi"));
const ProduitParticulier = lazy(() => import("./pages/ProduitParticulier"));
const LocationUtilitaires = lazy(() => import("./pages/LocationUtilitaires"));
const LocationCamions = lazy(() => import("./pages/LocationCamions"));
const LocationMinibus = lazy(() => import("./pages/LocationMinibus"));
const ProduitLocation = lazy(() => import("./pages/ProduitLocation"));
const CentreDocuments = lazy(() => import("./pages/CentreDocuments"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Messagerie = lazy(() => import("./pages/Messagerie"));
const ListeAttente = lazy(() => import("./pages/ListeAttente"));
const ReservationRecurrente = lazy(() => import("./pages/ReservationRecurrente"));
const Comparateur = lazy(() => import("./pages/Comparateur"));
const HistoriqueConsultationsUniv = lazy(() => import("./pages/HistoriqueConsultations"));
const DossierClientUniv = lazy(() => import("./pages/DossierClient"));
const DossierVehiculeNumerique = lazy(() => import("./pages/DossierVehiculeNumerique"));
const AtelierPro = lazy(() => import("./pages/AtelierPro"));
const CatalogueTechniqueStandalone = lazy(() => import("./pages/CatalogueTechnique"));
const Rewards = lazy(() => import("./pages/Rewards"));
const ComptaDirigeant = lazy(() => import("./pages/ComptaDirigeant"));
const SuiviVehicule = lazy(() => import("./pages/SuiviVehicule"));
const JournalActivite = lazy(() => import("./pages/JournalActivite"));
const AccesPDG = lazy(() => import("./pages/AccesPDG"));
const EtatVehicule = lazy(() => import("./pages/EtatVehicule"));
const RenouvellementLocation = lazy(() => import("./pages/RenouvellementLocation"));
const RemplacementVehicule = lazy(() => import("./pages/RemplacementVehicule"));
const GestionConducteurs = lazy(() => import("./pages/GestionConducteurs"));
const InspectionNumerique = lazy(() => import("./pages/InspectionNumerique"));
const AssistanceSinistre = lazy(() => import("./pages/AssistanceSinistre"));
const CentrePenalites = lazy(() => import("./pages/CentrePenalites"));
const ControleDocuments = lazy(() => import("./pages/ControleDocuments"));
const HistoriqueLocation = lazy(() => import("./pages/HistoriqueLocation"));
const ProgrammeVTC = lazy(() => import("./pages/ProgrammeVTC"));
const CalendrierDispo = lazy(() => import("./pages/CalendrierDispo"));
const ScoreConfiance = lazy(() => import("./pages/ScoreConfiance"));
const LivraisonVehicule = lazy(() => import("./pages/LivraisonVehicule"));
const LocationLOA = lazy(() => import("./pages/LocationLOA"));
const VehiculesCertifies = lazy(() => import("./pages/VehiculesCertifies"));
const ReservationMulti = lazy(() => import("./pages/ReservationMulti"));
const GestionFranchises = lazy(() => import("./pages/GestionFranchises"));
const RenouvellementFlotte = lazy(() => import("./pages/RenouvellementFlotte"));
const TableauBordLoueur = lazy(() => import("./pages/TableauBordLoueur"));
const ScoreQualiteLoueur = lazy(() => import("./pages/ScoreQualiteLoueur"));
// Univers Vente
const VenteGenerale = lazy(() => import("./pages/VenteGenerale"));
const VenteParticulier = lazy(() => import("./pages/VenteParticulier"));
const VentePro = lazy(() => import("./pages/VentePro"));
const VenteMKAPMS = lazy(() => import("./pages/VenteMKAPMS"));
const VenteMoto = lazy(() => import("./pages/VenteMoto"));
const VenteUtilitaires = lazy(() => import("./pages/VenteUtilitaires"));
const VenteCamions = lazy(() => import("./pages/VenteCamions"));
const VenteVTC = lazy(() => import("./pages/VenteVTC"));
const VentePromotions = lazy(() => import("./pages/VentePromotions"));
const VenteEncheres = lazy(() => import("./pages/VenteEncheres"));
const EstimationAuto = lazy(() => import("./pages/EstimationAuto"));
const HistoriqueVehiculeVente = lazy(() => import("./pages/HistoriqueVehiculeVente"));
const RepriseVehicule = lazy(() => import("./pages/RepriseVehicule"));
const DepotAnnonce = lazy(() => import("./pages/DepotAnnonce"));
const MesAnnonces = lazy(() => import("./pages/MesAnnonces"));
const EspaceProVente = lazy(() => import("./pages/EspaceProVente"));
// Inscriptions
const InscriptionParticulier = lazy(() => import("./pages/InscriptionParticulier"));
const TableauBordParticulier = lazy(() => import("./pages/TableauBordParticulier"));
const InscriptionProVente = lazy(() => import("./pages/InscriptionProVente"));
const TableauBordProVente = lazy(() => import("./pages/TableauBordProVente"));
// Vente operations
const GestionStockVO = lazy(() => import("./pages/vente/GestionStockVO"));
const DossierVehicule = lazy(() => import("./pages/vente/DossierVehicule"));
const WorkflowAchatVO = lazy(() => import("./pages/vente/WorkflowAchatVO"));
const CentreTransport = lazy(() => import("./pages/vente/CentreTransport"));
const CentreDiagnostic = lazy(() => import("./pages/vente/CentreDiagnostic"));
const CentreReparations = lazy(() => import("./pages/vente/CentreReparations"));
const CentrePhotosMedias = lazy(() => import("./pages/vente/CentrePhotosMedias"));
const ReservationsVente = lazy(() => import("./pages/vente/ReservationsVente"));
const LivraisonVente = lazy(() => import("./pages/vente/LivraisonVente"));
const DossierClient = lazy(() => import("./pages/vente/DossierClient"));
const AvisVendeurs = lazy(() => import("./pages/vente/AvisVendeurs"));
const QualiteVendeur = lazy(() => import("./pages/vente/QualiteVendeur"));
const AchatExpress = lazy(() => import("./pages/vente/AchatExpress"));
const TableauBordVendeur = lazy(() => import("./pages/vente/TableauBordVendeur"));
const AlertesAuto = lazy(() => import("./pages/vente/AlertesAuto"));
const MultiSites = lazy(() => import("./pages/vente/MultiSites"));
const GestionEmployes = lazy(() => import("./pages/vente/GestionEmployes"));
const DroitsAcces = lazy(() => import("./pages/vente/DroitsAcces"));
const CentreFournisseurs = lazy(() => import("./pages/vente/CentreFournisseurs"));
const CentreMarges = lazy(() => import("./pages/vente/CentreMarges"));
const CentreObjectifs = lazy(() => import("./pages/vente/CentreObjectifs"));
const CentrePerformances = lazy(() => import("./pages/vente/CentrePerformances"));
const CentrePublicites = lazy(() => import("./pages/vente/CentrePublicites"));
const CentreCampagnes = lazy(() => import("./pages/vente/CentreCampagnes"));
const CentreClientsVente = lazy(() => import("./pages/vente/CentreClientsVente"));
const CentreFinancement = lazy(() => import("./pages/vente/CentreFinancement"));
const CentreControleQualite = lazy(() => import("./pages/vente/CentreControleQualite"));
const CentreExport = lazy(() => import("./pages/vente/CentreExport"));
const CentreArchives = lazy(() => import("./pages/vente/CentreArchives"));
const CentreSecurite = lazy(() => import("./pages/vente/CentreSecurite"));
// Marketplace Avancée (51-70)
const CentreNegociation = lazy(() => import("./pages/vente/CentreNegociation"));
const CentreReservationAchat = lazy(() => import("./pages/vente/CentreReservationAchat"));
const CentreVisiteVehicule = lazy(() => import("./pages/vente/CentreVisiteVehicule"));
const CentreEssaiRoutier = lazy(() => import("./pages/vente/CentreEssaiRoutier"));
const CentreDossiersAcheteurs = lazy(() => import("./pages/vente/CentreDossiersAcheteurs"));
const CentreComparaison = lazy(() => import("./pages/vente/CentreComparaison"));
const CentreAlertesRecherche = lazy(() => import("./pages/vente/CentreAlertesRecherche"));
const CentreFavorisVente = lazy(() => import("./pages/vente/CentreFavorisVente"));
const CentreRecommandations = lazy(() => import("./pages/vente/CentreRecommandations"));
const CentreHistoriqueConsultations = lazy(() => import("./pages/vente/CentreHistoriqueConsultations"));
const CentreVehiculesCertifiesVente = lazy(() => import("./pages/vente/CentreVehiculesCertifiesVente"));
const CentreGarantieOccasion = lazy(() => import("./pages/vente/CentreGarantieOccasion"));
const CentreRapportsVehicule = lazy(() => import("./pages/vente/CentreRapportsVehicule"));
const CentreAchatDistance = lazy(() => import("./pages/vente/CentreAchatDistance"));
const CentreLivraisonAcheteur = lazy(() => import("./pages/vente/CentreLivraisonAcheteur"));
const CentreRetourClient = lazy(() => import("./pages/vente/CentreRetourClient"));
const CentreBadgesVendeurs = lazy(() => import("./pages/vente/CentreBadgesVendeurs"));
const CentreDetectionFraude = lazy(() => import("./pages/vente/CentreDetectionFraude"));
const CentreConfianceAcheteur = lazy(() => import("./pages/vente/CentreConfianceAcheteur"));
const WorkflowCompletAcheteur = lazy(() => import("./pages/vente/WorkflowCompletAcheteur"));
const ImportAfrica = lazy(() => import("./pages/ImportAfrica"));
const Historique = lazy(() => import("./pages/Historique"));
const Wallet = lazy(() => import("./pages/Wallet"));
const CarteMondiale = lazy(() => import("./pages/CarteMondiale"));
const GlobalCountryEngine = lazy(() => import("./pages/GlobalCountryEngine"));
const DepotVente = lazy(() => import("./pages/DepotVente"));
const VOInterne = lazy(() => import("./pages/VOInterne"));
const Comptabilite = lazy(() => import("./pages/Comptabilite"));
const CarteGrise = lazy(() => import("./pages/CarteGrise"));
const Mission = lazy(() => import("./pages/Mission"));
const EspacePro = lazy(() => import("./pages/EspacePro"));
const InscriptionProVO = lazy(() => import("./pages/InscriptionProVO"));
const Finance = lazy(() => import("./pages/Finance"));
const Rechercher = lazy(() => import("./pages/Rechercher"));
const DemandePublicite = lazy(() => import("./pages/DemandePublicite"));
const PubliciteDetail = lazy(() => import("./pages/PubliciteDetail"));

// Phase finale V1 + SEO + Géolocalisation
const AbonnementsDefinitifs = lazy(() => import("./pages/AbonnementsDefinitifs"));
const BadgesDefinitifs = lazy(() => import("./pages/BadgesDefinitifs"));
const PubliciteInterne = lazy(() => import("./pages/PubliciteInterne"));
const VoitureOccasion = lazy(() => import("./pages/VoitureOccasion"));
const MotoOccasion = lazy(() => import("./pages/MotoOccasion"));
const LocationVoiture = lazy(() => import("./pages/LocationVoiture"));
const GarageAuto = lazy(() => import("./pages/GarageAuto"));
const SEOAbonnements = lazy(() => import("./pages/SEOAbonnements"));
const RechercheGeolocalisee = lazy(() => import("./pages/RechercheGeolocalisee"));
const RechercheLocale = lazy(() => import("./pages/RechercheLocale"));
// Garage
const AssistanceRoutiere = lazy(() => import("./pages/garage/AssistanceRoutiere"));
const BoutiquePieces = lazy(() => import("./pages/garage/BoutiquePieces"));
const CarrosserieGarage = lazy(() => import("./pages/garage/CarrosserieGarage"));
const CentreLavage = lazy(() => import("./pages/garage/CentreLavage"));
const CentreReclamations = lazy(() => import("./pages/garage/CentreReclamations"));
const CommandePieces = lazy(() => import("./pages/garage/CommandePieces"));
const CommandesAutomatiques = lazy(() => import("./pages/garage/CommandesAutomatiques"));
const ContratsFlottes = lazy(() => import("./pages/garage/ContratsFlottes"));
const ControleQualiteGarage = lazy(() => import("./pages/garage/ControleQualiteGarage"));
const ControleQualitePremium = lazy(() => import("./pages/garage/ControleQualitePremium"));
const ControleTechnique = lazy(() => import("./pages/garage/ControleTechnique"));
const DemandeDevis = lazy(() => import("./pages/garage/DemandeDevis"));
const DepannageAvance = lazy(() => import("./pages/garage/DepannageAvance"));
const DepannageGarage = lazy(() => import("./pages/garage/DepannageGarage"));
const DiagnosticAvance = lazy(() => import("./pages/garage/DiagnosticAvance"));
const DiagnosticGarage = lazy(() => import("./pages/garage/DiagnosticGarage"));
const DossiersFlottes = lazy(() => import("./pages/garage/DossiersFlottes"));
const EntretiensPreventifs = lazy(() => import("./pages/garage/EntretiensPreventifs"));
const EsthetiqueAuto = lazy(() => import("./pages/garage/EsthetiqueAuto"));
const FichesTechniciens = lazy(() => import("./pages/garage/FichesTechniciens"));
const FileAttenteAtelier = lazy(() => import("./pages/garage/FileAttenteAtelier"));
const FlottesEntreprises = lazy(() => import("./pages/garage/FlottesEntreprises"));
const FournisseursGarage = lazy(() => import("./pages/garage/FournisseursGarage"));
const GarageGenerale = lazy(() => import("./pages/garage/GarageGenerale"));
const GarageParticulier = lazy(() => import("./pages/garage/GarageParticulier"));
const GarageProfessionnel = lazy(() => import("./pages/garage/GarageProfessionnel"));
const GarantieTravaux = lazy(() => import("./pages/garage/GarantieTravaux"));
const GestionMecaniciens = lazy(() => import("./pages/garage/GestionMecaniciens"));
const GestionOutillage = lazy(() => import("./pages/garage/GestionOutillage"));
const GestionPonts = lazy(() => import("./pages/garage/GestionPonts"));
const HistoriqueGarage = lazy(() => import("./pages/garage/HistoriqueGarage"));
const LavagePreparation = lazy(() => import("./pages/garage/LavagePreparation"));
const MultiGarages = lazy(() => import("./pages/garage/MultiGarages"));
const ObjectifFinalGarage = lazy(() => import("./pages/garage/ObjectifFinalGarage"));
const ObjectifGarage = lazy(() => import("./pages/garage/ObjectifGarage"));
const OrdreReparation = lazy(() => import("./pages/garage/OrdreReparation"));
const PanierPieces = lazy(() => import("./pages/garage/PanierPieces"));
const PhotosIntervention = lazy(() => import("./pages/garage/PhotosIntervention"));
const PhotosTechniques = lazy(() => import("./pages/garage/PhotosTechniques"));
const PlanningAtelier = lazy(() => import("./pages/garage/PlanningAtelier"));
const Pneumatiques = lazy(() => import("./pages/garage/Pneumatiques"));
const PneumatiquesAvance = lazy(() => import("./pages/garage/PneumatiquesAvance"));
const PreparationVenteVO = lazy(() => import("./pages/garage/PreparationVenteVO"));
const PriseRendezVous = lazy(() => import("./pages/garage/PriseRendezVous"));
const ReceptionVehicule = lazy(() => import("./pages/garage/ReceptionVehicule"));
const RecherchePieces = lazy(() => import("./pages/garage/RecherchePieces"));
const RelanceClient = lazy(() => import("./pages/garage/RelanceClient"));
const RentabiliteAtelier = lazy(() => import("./pages/garage/RentabiliteAtelier"));
const ReseauPartenaires = lazy(() => import("./pages/garage/ReseauPartenaires"));
const ReservationAtelier = lazy(() => import("./pages/garage/ReservationAtelier"));
const RestitutionClient = lazy(() => import("./pages/garage/RestitutionClient"));
const StatistiquesGarage = lazy(() => import("./pages/garage/StatistiquesGarage"));
const StockPieces = lazy(() => import("./pages/garage/StockPieces"));
const SuiviTempsReel = lazy(() => import("./pages/garage/SuiviTempsReel"));
const TableauBordChefAtelier = lazy(() => import("./pages/garage/TableauBordChefAtelier"));
const TempsIntervention = lazy(() => import("./pages/garage/TempsIntervention"));
const TransfertDossiers = lazy(() => import("./pages/garage/TransfertDossiers"));
const ValidationClient = lazy(() => import("./pages/garage/ValidationClient"));
const ValidationInterne = lazy(() => import("./pages/garage/ValidationInterne"));
const VehiculesAttente = lazy(() => import("./pages/garage/VehiculesAttente"));
// Démarches
const AlertesDemarches = lazy(() => import("./pages/demarches/AlertesDemarches"));
const ArchivesAdministratives = lazy(() => import("./pages/demarches/ArchivesAdministratives"));
const CarteGriseDemarche = lazy(() => import("./pages/demarches/CarteGriseDemarche"));
const CentreDocumentsDemarches = lazy(() => import("./pages/demarches/CentreDocumentsDemarches"));
const ChangementAdresse = lazy(() => import("./pages/demarches/ChangementAdresse"));
const ChangementTitulaire = lazy(() => import("./pages/demarches/ChangementTitulaire"));
const DeclarationCession = lazy(() => import("./pages/demarches/DeclarationCession"));
const DemarchesGenerale = lazy(() => import("./pages/demarches/DemarchesGenerale"));
const DuplicataDemarche = lazy(() => import("./pages/demarches/DuplicataDemarche"));
const EspaceProDemarches = lazy(() => import("./pages/demarches/EspaceProDemarches"));
const ImmatriculationProvisoire = lazy(() => import("./pages/demarches/ImmatriculationProvisoire"));
const ImportationVehicule = lazy(() => import("./pages/demarches/ImportationVehicule"));
const MessagerieDemarches = lazy(() => import("./pages/demarches/MessagerieDemarches"));
const ObjectifDemarches = lazy(() => import("./pages/demarches/ObjectifDemarches"));
const PaiementDemarches = lazy(() => import("./pages/demarches/PaiementDemarches"));
const PlaquesImmatriculation = lazy(() => import("./pages/demarches/PlaquesImmatriculation"));
const SignaturesElectroniques = lazy(() => import("./pages/demarches/SignaturesElectroniques"));
const StatistiquesDemarches = lazy(() => import("./pages/demarches/StatistiquesDemarches"));
const SuccessionVehicule = lazy(() => import("./pages/demarches/SuccessionVehicule"));
const SuiviDossier = lazy(() => import("./pages/demarches/SuiviDossier"));
const VerificationIA = lazy(() => import("./pages/demarches/VerificationIA"));
const WWGarage = lazy(() => import("./pages/demarches/WWGarage"));
// Pièces
const AbonnementsProPieces = lazy(() => import("./pages/pieces/AbonnementsProPieces"));
const AvisProduitsPieces = lazy(() => import("./pages/pieces/AvisProduitsPieces"));
const FournisseursPieces = lazy(() => import("./pages/pieces/FournisseursPieces"));
const LogistiquePieces = lazy(() => import("./pages/pieces/LogistiquePieces"));
const MontageGarage = lazy(() => import("./pages/pieces/MontageGarage"));
const ObjectifPieces = lazy(() => import("./pages/pieces/ObjectifPieces"));
const PanierPiecesDetachees = lazy(() => import("./pages/pieces/PanierPiecesDetachees"));
const PiecesAccessoires = lazy(() => import("./pages/pieces/PiecesAccessoires"));
const PiecesBatteries = lazy(() => import("./pages/pieces/PiecesBatteries"));
const PiecesCarrosserie = lazy(() => import("./pages/pieces/PiecesCarrosserie"));
const PiecesEclairage = lazy(() => import("./pages/pieces/PiecesEclairage"));
const PiecesFreinage = lazy(() => import("./pages/pieces/PiecesFreinage"));
const PiecesGenerale = lazy(() => import("./pages/pieces/PiecesGenerale"));
const PiecesHuiles = lazy(() => import("./pages/pieces/PiecesHuiles"));
const PiecesMoteur = lazy(() => import("./pages/pieces/PiecesMoteur"));
const PiecesPneumatiques = lazy(() => import("./pages/pieces/PiecesPneumatiques"));
const PiecesSuspension = lazy(() => import("./pages/pieces/PiecesSuspension"));
const RechercheIntelligentePieces = lazy(() => import("./pages/pieces/RechercheIntelligentePieces"));
const RetoursPieces = lazy(() => import("./pages/pieces/RetoursPieces"));
const StatistiquesPieces = lazy(() => import("./pages/pieces/StatistiquesPieces"));
const VendeursPieces = lazy(() => import("./pages/pieces/VendeursPieces"));
const VerificationCompatibilite = lazy(() => import("./pages/pieces/VerificationCompatibilite"));
// Finance
const AcompteFinance = lazy(() => import("./pages/finance/AcompteFinance"));
const AlertesPaiements = lazy(() => import("./pages/finance/AlertesPaiements"));
const CentreEcheancier = lazy(() => import("./pages/finance/CentreEcheancier"));
const CentreFactures = lazy(() => import("./pages/finance/CentreFactures"));
const ContratsFinanciers = lazy(() => import("./pages/finance/ContratsFinanciers"));
const DepotGarantieFinance = lazy(() => import("./pages/finance/DepotGarantieFinance"));
const FinanceGenerale = lazy(() => import("./pages/finance/FinanceGenerale"));
const GarantieSecurite = lazy(() => import("./pages/finance/GarantieSecurite"));
const LOAFinance = lazy(() => import("./pages/finance/LOAFinance"));
const ObjectifFinance = lazy(() => import("./pages/finance/ObjectifFinance"));
const PaiementComptant = lazy(() => import("./pages/finance/PaiementComptant"));
const PaiementFractionne = lazy(() => import("./pages/finance/PaiementFractionne"));
const PaiementsProfessionnels = lazy(() => import("./pages/finance/PaiementsProfessionnels"));
const RemboursementsFinance = lazy(() => import("./pages/finance/RemboursementsFinance"));
const TableauBordFinance = lazy(() => import("./pages/finance/TableauBordFinance"));
// Super Admin
const AdminAbonnements = lazy(() => import("./pages/superadmin/AdminAbonnements"));
const AdminBadges = lazy(() => import("./pages/superadmin/AdminBadges"));
const AdminCarteMoniale = lazy(() => import("./pages/superadmin/AdminCarteMoniale"));
const AdminCommissions = lazy(() => import("./pages/superadmin/AdminCommissions"));
const AdminComptesPro = lazy(() => import("./pages/superadmin/AdminComptesPro"));
const AdminDemarches = lazy(() => import("./pages/superadmin/AdminDemarches"));
const AdminDepannage = lazy(() => import("./pages/superadmin/AdminDepannage"));
const AdminEmployes = lazy(() => import("./pages/superadmin/AdminEmployes"));
const AdminFraude = lazy(() => import("./pages/superadmin/AdminFraude"));
const AdminGarage = lazy(() => import("./pages/superadmin/AdminGarage"));
const AdminGeneral = lazy(() => import("./pages/superadmin/AdminGeneral"));
const AdminJournal = lazy(() => import("./pages/superadmin/AdminJournal"));
const AdminLitiges = lazy(() => import("./pages/superadmin/AdminLitiges"));
const AdminLocation = lazy(() => import("./pages/superadmin/AdminLocation"));
const AdminModerationAnnonces = lazy(() => import("./pages/superadmin/AdminModerationAnnonces"));
const AdminModerationAvis = lazy(() => import("./pages/superadmin/AdminModerationAvis"));
const AdminObjectif = lazy(() => import("./pages/superadmin/AdminObjectif"));
const AdminPaiements = lazy(() => import("./pages/superadmin/AdminPaiements"));
const AdminPieces = lazy(() => import("./pages/superadmin/AdminPieces"));
const AdminSEO = lazy(() => import("./pages/superadmin/AdminSEO"));
const AdminSauvegardes = lazy(() => import("./pages/superadmin/AdminSauvegardes"));
const AdminSecurite = lazy(() => import("./pages/superadmin/AdminSecurite"));
const AdminStatistiques = lazy(() => import("./pages/superadmin/AdminStatistiques"));
const AdminSupport = lazy(() => import("./pages/superadmin/AdminSupport"));
const AdminUtilisateurs = lazy(() => import("./pages/superadmin/AdminUtilisateurs"));
const AdminVente = lazy(() => import("./pages/superadmin/AdminVente"));
const AdminValidationDocs = lazy(() => import("./pages/superadmin/AdminValidationDocs"));
const CentreRH = lazy(() => import("./pages/superadmin/CentreRH"));
const CentreTickets = lazy(() => import("./pages/superadmin/CentreTickets"));
const ComptabiliteComplete = lazy(() => import("./pages/superadmin/ComptabiliteComplete"));
const GestionEmployesMKAPMS = lazy(() => import("./pages/superadmin/GestionEmployesMKAPMS"));
const SuperAdminDashboard = lazy(() => import("./pages/superadmin/SuperAdminDashboard"));
const ValidationDocumentsComplete = lazy(() => import("./pages/superadmin/ValidationDocumentsComplete"));
// Utilisateurs
const AbonnementsUtilisateur = lazy(() => import("./pages/utilisateurs/AbonnementsUtilisateur"));
const CentreAlertesUtilisateur = lazy(() => import("./pages/utilisateurs/CentreAlertesUtilisateur"));
const CentreFavorisUtilisateur = lazy(() => import("./pages/utilisateurs/CentreFavorisUtilisateur"));
const CentreSupportUtilisateur = lazy(() => import("./pages/utilisateurs/CentreSupportUtilisateur"));
const CompteParticulier = lazy(() => import("./pages/utilisateurs/CompteParticulier"));
const CompteProUtilisateur = lazy(() => import("./pages/utilisateurs/CompteProUtilisateur"));
const DocumentsPersonnels = lazy(() => import("./pages/utilisateurs/DocumentsPersonnels"));
const EmployesUtilisateur = lazy(() => import("./pages/utilisateurs/EmployesUtilisateur"));
const FacturesUtilisateur = lazy(() => import("./pages/utilisateurs/FacturesUtilisateur"));
const HistoriqueAchats = lazy(() => import("./pages/utilisateurs/HistoriqueAchats"));
const HistoriqueDemarches = lazy(() => import("./pages/utilisateurs/HistoriqueDemarches"));
const HistoriqueDepannages = lazy(() => import("./pages/utilisateurs/HistoriqueDepannages"));
const HistoriqueEntretiens = lazy(() => import("./pages/utilisateurs/HistoriqueEntretiens"));
const HistoriqueLocations = lazy(() => import("./pages/utilisateurs/HistoriqueLocations"));
const MesVehicules = lazy(() => import("./pages/utilisateurs/MesVehicules"));
const MessagerieGlobale = lazy(() => import("./pages/utilisateurs/MessagerieGlobale"));
const ObjectifUtilisateur = lazy(() => import("./pages/utilisateurs/ObjectifUtilisateur"));
const SecuriteUtilisateur = lazy(() => import("./pages/utilisateurs/SecuriteUtilisateur"));
const SuppressionCompte = lazy(() => import("./pages/utilisateurs/SuppressionCompte"));
const TableauBordPerso = lazy(() => import("./pages/utilisateurs/TableauBordPerso"));
// Notifications
const AlertesUrgentes = lazy(() => import("./pages/notifications/AlertesUrgentes"));
const AnnoncesImportantes = lazy(() => import("./pages/notifications/AnnoncesImportantes"));
const CanauxCommunication = lazy(() => import("./pages/notifications/CanauxCommunication"));
const CoffreFortNumerique = lazy(() => import("./pages/notifications/CoffreFortNumerique"));
const DocumentsEntreprises = lazy(() => import("./pages/notifications/DocumentsEntreprises"));
const DocumentsPersonnelsGlobal = lazy(() => import("./pages/notifications/DocumentsPersonnelsGlobal"));
const DocumentsVehicules = lazy(() => import("./pages/notifications/DocumentsVehicules"));
const HistoriqueNotifications = lazy(() => import("./pages/notifications/HistoriqueNotifications"));
const NotificationsDemarches = lazy(() => import("./pages/notifications/NotificationsDemarches"));
const NotificationsDepannage = lazy(() => import("./pages/notifications/NotificationsDepannage"));
const NotificationsGarage = lazy(() => import("./pages/notifications/NotificationsGarage"));
const NotificationsGenerale = lazy(() => import("./pages/notifications/NotificationsGenerale"));
const NotificationsLocation = lazy(() => import("./pages/notifications/NotificationsLocation"));
const NotificationsMessages = lazy(() => import("./pages/notifications/NotificationsMessages"));
const NotificationsPaiements = lazy(() => import("./pages/notifications/NotificationsPaiements"));
const NotificationsVente = lazy(() => import("./pages/notifications/NotificationsVente"));
const ObjectifNotifications = lazy(() => import("./pages/notifications/ObjectifNotifications"));
const ParametresNotifications = lazy(() => import("./pages/notifications/ParametresNotifications"));
const RappelsAutomatiques = lazy(() => import("./pages/notifications/RappelsAutomatiques"));
const SignaturesGlobales = lazy(() => import("./pages/notifications/SignaturesGlobales"));
// Partenaires
const AttributionDemandes = lazy(() => import("./pages/partenaires/AttributionDemandes"));
const CartePartenaires = lazy(() => import("./pages/partenaires/CartePartenaires"));
const EvaluationPartenaires = lazy(() => import("./pages/partenaires/EvaluationPartenaires"));
const FichePartenaire = lazy(() => import("./pages/partenaires/FichePartenaire"));
const InscriptionPartenaire = lazy(() => import("./pages/partenaires/InscriptionPartenaire"));
const NiveauxPartenaires = lazy(() => import("./pages/partenaires/NiveauxPartenaires"));
const ObjectifPartenaires = lazy(() => import("./pages/partenaires/ObjectifPartenaires"));
const PartenairesGenerale = lazy(() => import("./pages/partenaires/PartenairesGenerale"));
const StatistiquesPartenaires = lazy(() => import("./pages/partenaires/StatistiquesPartenaires"));
const SuspensionPartenaires = lazy(() => import("./pages/partenaires/SuspensionPartenaires"));
// Marketing
const CampagnesAutomatiques = lazy(() => import("./pages/marketing/CampagnesAutomatiques"));
const CodesPromotionnels = lazy(() => import("./pages/marketing/CodesPromotionnels"));
const EspacesPublicitaires = lazy(() => import("./pages/marketing/EspacesPublicitaires"));
const ProgrammeFidelite = lazy(() => import("./pages/marketing/ProgrammeFidelite"));
const ProgrammeParrainage = lazy(() => import("./pages/marketing/ProgrammeParrainage"));
const PublicitesPro = lazy(() => import("./pages/marketing/PublicitesPro"));
// Mobile
const AppAndroid = lazy(() => import("./pages/mobile/AppAndroid"));
const AppIOS = lazy(() => import("./pages/mobile/AppIOS"));
const ModeHorsLigne = lazy(() => import("./pages/mobile/ModeHorsLigne"));
const NotificationsPush = lazy(() => import("./pages/mobile/NotificationsPush"));
// IA
const IAAideDevis = lazy(() => import("./pages/ia/IAAideDevis"));
const IAAnalyseMarche = lazy(() => import("./pages/ia/IAAnalyseMarche"));
const IAAssistantClient = lazy(() => import("./pages/ia/IAAssistantClient"));
const IADetectionFraude = lazy(() => import("./pages/ia/IADetectionFraude"));
const IAEstimation = lazy(() => import("./pages/ia/IAEstimation"));
// International
const MultiDevises = lazy(() => import("./pages/international/MultiDevises"));
const MultiLangues = lazy(() => import("./pages/international/MultiLangues"));
const MultiPays = lazy(() => import("./pages/international/MultiPays"));
// Investisseurs
const EspaceInvestisseurs = lazy(() => import("./pages/investisseurs/EspaceInvestisseurs"));
const ObjectifGlobal = lazy(() => import("./pages/investisseurs/ObjectifGlobal"));
// Entreprises
const CentreCarburant = lazy(() => import("./pages/entreprises/CentreCarburant"));
const CentreGeolocalisation = lazy(() => import("./pages/entreprises/CentreGeolocalisation"));
const CentreImmobilisation = lazy(() => import("./pages/entreprises/CentreImmobilisation"));
const CompteFlotte = lazy(() => import("./pages/entreprises/CompteFlotte"));
const ContratsEntreprises = lazy(() => import("./pages/entreprises/ContratsEntreprises"));
const EntreprisesGestionConducteurs = lazy(() => import("./pages/entreprises/GestionConducteurs"));
const GestionParc = lazy(() => import("./pages/entreprises/GestionParc"));
const HistoriqueFlotte = lazy(() => import("./pages/entreprises/HistoriqueFlotte"));
const ObjectifFlottes = lazy(() => import("./pages/entreprises/ObjectifFlottes"));
const RapportsEntreprises = lazy(() => import("./pages/entreprises/RapportsEntreprises"));
// Formations
const Certificats = lazy(() => import("./pages/formations/Certificats"));
const FormationGarage = lazy(() => import("./pages/formations/FormationGarage"));
const FormationTaxi = lazy(() => import("./pages/formations/FormationTaxi"));
const FormationVTC = lazy(() => import("./pages/formations/FormationVTC"));
const FormationVente = lazy(() => import("./pages/formations/FormationVente"));
// Recrutement
const DepotCV = lazy(() => import("./pages/recrutement/DepotCV"));
const OffresEmploi = lazy(() => import("./pages/recrutement/OffresEmploi"));
const RechercheTalents = lazy(() => import("./pages/recrutement/RechercheTalents"));
// Communauté
const AvisConseils = lazy(() => import("./pages/communaute/AvisConseils"));
const GuidesAchat = lazy(() => import("./pages/communaute/GuidesAchat"));
const GuidesGarage = lazy(() => import("./pages/communaute/GuidesGarage"));
const GuidesLocation = lazy(() => import("./pages/communaute/GuidesLocation"));
const GuidesVente = lazy(() => import("./pages/communaute/GuidesVente"));
const QuestionsReponses = lazy(() => import("./pages/communaute/QuestionsReponses"));
// Corporate
const APropos = lazy(() => import("./pages/corporate/APropos"));
const ContactEntreprise = lazy(() => import("./pages/corporate/ContactEntreprise"));
const NosPartenaires = lazy(() => import("./pages/corporate/NosPartenaires"));
const NosServices = lazy(() => import("./pages/corporate/NosServices"));
const PresseActualites = lazy(() => import("./pages/corporate/PresseActualites"));
const VisionMKAPMS = lazy(() => import("./pages/corporate/VisionMKAPMS"));
// Opérations
const Ambassadeurs = lazy(() => import("./pages/operations/Ambassadeurs"));
const CentreAcquisition = lazy(() => import("./pages/operations/CentreAcquisition"));
const CentreAudit = lazy(() => import("./pages/operations/CentreAudit"));
const CentreConformite = lazy(() => import("./pages/operations/CentreConformite"));
const CentreDonneesMarche = lazy(() => import("./pages/operations/CentreDonneesMarche"));
const CentreExpansion = lazy(() => import("./pages/operations/CentreExpansion"));
const CentreOpportunites = lazy(() => import("./pages/operations/CentreOpportunites"));
const CentrePrevisions = lazy(() => import("./pages/operations/CentrePrevisions"));
const CentreRisques = lazy(() => import("./pages/operations/CentreRisques"));
const CentreValidation = lazy(() => import("./pages/operations/CentreValidation"));
const ControleQualiteGlobal = lazy(() => import("./pages/operations/ControleQualiteGlobal"));
const MKAPMSAfrique = lazy(() => import("./pages/operations/MKAPMSAfrique"));
const MKAPMSAssurance = lazy(() => import("./pages/operations/MKAPMSAssurance"));
const MKAPMSBanque = lazy(() => import("./pages/operations/MKAPMSBanque"));
const MKAPMSMobility = lazy(() => import("./pages/operations/MKAPMSMobility"));
const MKAPMSTransport = lazy(() => import("./pages/operations/MKAPMSTransport"));
const ObjectifFinalPlateforme = lazy(() => import("./pages/operations/ObjectifFinalPlateforme"));
const ProgrammeEntreprisesStrategiques = lazy(() => import("./pages/operations/ProgrammeEntreprisesStrategiques"));
const ProgrammePremium = lazy(() => import("./pages/operations/ProgrammePremium"));
const TableauBordFondateur = lazy(() => import("./pages/operations/TableauBordFondateur"));
// Automatisations
const CentreAlertesStrategiques = lazy(() => import("./pages/automatisations/CentreAlertesStrategiques"));
const CentreAutoMarketing = lazy(() => import("./pages/automatisations/CentreAutoMarketing"));
const CentreCroissance = lazy(() => import("./pages/automatisations/CentreCroissance"));
const CentreKPI = lazy(() => import("./pages/automatisations/CentreKPI"));
const CentreObjectifsEntreprise = lazy(() => import("./pages/automatisations/CentreObjectifsEntreprise"));
const CentrePerformanceIA = lazy(() => import("./pages/automatisations/CentrePerformanceIA"));
const EscaladesAutomatiques = lazy(() => import("./pages/automatisations/EscaladesAutomatiques"));
const FilesAttente = lazy(() => import("./pages/automatisations/FilesAttente"));
const IAAffectation = lazy(() => import("./pages/automatisations/IAAffectation"));
const IAControle = lazy(() => import("./pages/automatisations/IAControle"));
const IAPriorisation = lazy(() => import("./pages/automatisations/IAPriorisation"));
const MoteurTaches = lazy(() => import("./pages/automatisations/MoteurTaches"));
const MoteurWorkflow = lazy(() => import("./pages/automatisations/MoteurWorkflow"));
const ObjectifAutomatisations = lazy(() => import("./pages/automatisations/ObjectifAutomatisations"));
const WorkflowsPersonnalises = lazy(() => import("./pages/automatisations/WorkflowsPersonnalises"));
// Expansion
const CentreInternational = lazy(() => import("./pages/expansion/CentreInternational"));
const MultiDevisesGlobal = lazy(() => import("./pages/expansion/MultiDevisesGlobal"));
const MultiLanguesGlobal = lazy(() => import("./pages/expansion/MultiLanguesGlobal"));
const PhaseAfriqueCentrale = lazy(() => import("./pages/expansion/PhaseAfriqueCentrale"));
const PhaseAfriqueEst = lazy(() => import("./pages/expansion/PhaseAfriqueEst"));
const PhaseAfriqueNord = lazy(() => import("./pages/expansion/PhaseAfriqueNord"));
const PhaseAfriqueOuest = lazy(() => import("./pages/expansion/PhaseAfriqueOuest"));
const PhaseAmeriqueLatine = lazy(() => import("./pages/expansion/PhaseAmeriqueLatine"));
const PhaseAmeriqueNord = lazy(() => import("./pages/expansion/PhaseAmeriqueNord"));
const PhaseAsie = lazy(() => import("./pages/expansion/PhaseAsie"));
const PhaseEurope = lazy(() => import("./pages/expansion/PhaseEurope"));
const PhaseEuropeFranco = lazy(() => import("./pages/expansion/PhaseEuropeFranco"));
const PhaseFrance = lazy(() => import("./pages/expansion/PhaseFrance"));
const PhaseMoyenOrient = lazy(() => import("./pages/expansion/PhaseMoyenOrient"));
const PhaseOceanie = lazy(() => import("./pages/expansion/PhaseOceanie"));
const TableauBordMondial = lazy(() => import("./pages/expansion/TableauBordMondial"));
const VisionFinale = lazy(() => import("./pages/expansion/VisionFinale"));
// Conformité
const AssurancesPays = lazy(() => import("./pages/conformite/AssurancesPays"));
const CentrePays = lazy(() => import("./pages/conformite/CentrePays"));
const ContratsAdaptes = lazy(() => import("./pages/conformite/ContratsAdaptes"));
const DevisesAutomatiques = lazy(() => import("./pages/conformite/DevisesAutomatiques"));
const DocumentsObligatoiresPays = lazy(() => import("./pages/conformite/DocumentsObligatoiresPays"));
const GaragePays = lazy(() => import("./pages/conformite/GaragePays"));
const IAJuridique = lazy(() => import("./pages/conformite/IAJuridique"));
const ImmatriculationsPays = lazy(() => import("./pages/conformite/ImmatriculationsPays"));
const LocationPays = lazy(() => import("./pages/conformite/LocationPays"));
const MisesAJourReglementaires = lazy(() => import("./pages/conformite/MisesAJourReglementaires"));
const MoteurReglesPays = lazy(() => import("./pages/conformite/MoteurReglesPays"));
const MoyensPaiementLocaux = lazy(() => import("./pages/conformite/MoyensPaiementLocaux"));
const ObjectifConformite = lazy(() => import("./pages/conformite/ObjectifConformite"));
const TableauBordInternational = lazy(() => import("./pages/conformite/TableauBordInternational"));
const TaxesAutomatiques = lazy(() => import("./pages/conformite/TaxesAutomatiques"));
const VentePays = lazy(() => import("./pages/conformite/VentePays"));
// Labs
const AcademieMKAPMS = lazy(() => import("./pages/labs/AcademieMKAPMS"));
const AnalyseMarcheMondiale = lazy(() => import("./pages/labs/AnalyseMarcheMondiale"));
const AnalyseTrafic = lazy(() => import("./pages/labs/AnalyseTrafic"));
const ArchivesHistoriques = lazy(() => import("./pages/labs/ArchivesHistoriques"));
const AssistantFondateur = lazy(() => import("./pages/labs/AssistantFondateur"));
const AuditQualite = lazy(() => import("./pages/labs/AuditQualite"));
const AutomatisationComplete = lazy(() => import("./pages/labs/AutomatisationComplete"));
const BenchmarkFlottes = lazy(() => import("./pages/labs/BenchmarkFlottes"));
const BibliothequeAutomobile = lazy(() => import("./pages/labs/BibliothequeAutomobile"));
const BibliothequeReparations = lazy(() => import("./pages/labs/BibliothequeReparations"));
const Brevets = lazy(() => import("./pages/labs/Brevets"));
const CampusAutomobile = lazy(() => import("./pages/labs/CampusAutomobile"));
const CarnetEntretienAuto = lazy(() => import("./pages/labs/CarnetEntretienAuto"));
const CartographieMondiale = lazy(() => import("./pages/labs/CartographieMondiale"));
const CentreAcquisitionsLabs = lazy(() => import("./pages/labs/CentreAcquisitionsLabs"));
const CentreAppelsOffres = lazy(() => import("./pages/labs/CentreAppelsOffres"));
const CentreCoordinationMondial = lazy(() => import("./pages/labs/CentreCoordinationMondial"));
const CentreDecisionsStrategiques = lazy(() => import("./pages/labs/CentreDecisionsStrategiques"));
const CentreDocumentation = lazy(() => import("./pages/labs/CentreDocumentation"));
const CentreDonneesMondiales = lazy(() => import("./pages/labs/CentreDonneesMondiales"));
const CentreExpansionAuto = lazy(() => import("./pages/labs/CentreExpansionAuto"));
const CentreExpansionAutomatique2 = lazy(() => import("./pages/labs/CentreExpansionAutomatique2"));
const CentreExportAuto = lazy(() => import("./pages/labs/CentreExportAuto"));
const CentreFormationAfrique = lazy(() => import("./pages/labs/CentreFormationAfrique"));
const CentreInnovation = lazy(() => import("./pages/labs/CentreInnovation"));
const CentreIntelligenceMarche = lazy(() => import("./pages/labs/CentreIntelligenceMarche"));
const CentreInvestissementsLabs = lazy(() => import("./pages/labs/CentreInvestissementsLabs"));
const CentreOpportunitesMondiales = lazy(() => import("./pages/labs/CentreOpportunitesMondiales"));
const CentreRechercheAuto = lazy(() => import("./pages/labs/CentreRechercheAuto"));
const CentreRechercheMKAPMS = lazy(() => import("./pages/labs/CentreRechercheMKAPMS"));
const CentreStrategieGroupe = lazy(() => import("./pages/labs/CentreStrategieGroupe"));
const CentreTraduction = lazy(() => import("./pages/labs/CentreTraduction"));
const CentresMobiliteUrbaine = lazy(() => import("./pages/labs/CentresMobiliteUrbaine"));
const CentresReconditionnement = lazy(() => import("./pages/labs/CentresReconditionnement"));
const CentresReconditionnement2 = lazy(() => import("./pages/labs/CentresReconditionnement2"));
const CentresTechniques = lazy(() => import("./pages/labs/CentresTechniques"));
const CertificationOccasion = lazy(() => import("./pages/labs/CertificationOccasion"));
const CertificationVehicule = lazy(() => import("./pages/labs/CertificationVehicule"));
const CoffrefortInternational = lazy(() => import("./pages/labs/CoffrefortInternational"));
const ConferencesInternationales = lazy(() => import("./pages/labs/ConferencesInternationales"));
const ControleDistanceFlottes = lazy(() => import("./pages/labs/ControleDistanceFlottes"));
const ControleProduction = lazy(() => import("./pages/labs/ControleProduction"));
const CorridorsLogistiques = lazy(() => import("./pages/labs/CorridorsLogistiques"));
const DataCloudAuto = lazy(() => import("./pages/labs/DataCloudAuto"));
const EncyclopedieAutomobile = lazy(() => import("./pages/labs/EncyclopedieAutomobile"));
const EnergyAfrique = lazy(() => import("./pages/labs/EnergyAfrique"));
const EnergyBatteries = lazy(() => import("./pages/labs/EnergyBatteries"));
const EnergyRecharge = lazy(() => import("./pages/labs/EnergyRecharge"));
const ExpansionMondiale = lazy(() => import("./pages/labs/ExpansionMondiale"));
const Filiales = lazy(() => import("./pages/labs/Filiales"));
const FleetNetworkMondial = lazy(() => import("./pages/labs/FleetNetworkMondial"));
const FondationFormation = lazy(() => import("./pages/labs/FondationFormation"));
const FondationMobilite = lazy(() => import("./pages/labs/FondationMobilite"));
const FondsDeveloppement = lazy(() => import("./pages/labs/FondsDeveloppement"));
const FondsDeveloppement2 = lazy(() => import("./pages/labs/FondsDeveloppement2"));
const FondsExpansionAfrique = lazy(() => import("./pages/labs/FondsExpansionAfrique"));
const FondsInnovation = lazy(() => import("./pages/labs/FondsInnovation"));
const FormationsCertifiantes = lazy(() => import("./pages/labs/FormationsCertifiantes"));
const FranchiseMKAPMS = lazy(() => import("./pages/labs/FranchiseMKAPMS"));
const FranchisesGlobal = lazy(() => import("./pages/labs/FranchisesGlobal"));
const Future2050 = lazy(() => import("./pages/labs/Future2050"));
const GestionEntrepots = lazy(() => import("./pages/labs/GestionEntrepots"));
const GestionFlotteIntelligente = lazy(() => import("./pages/labs/GestionFlotteIntelligente"));
const GestionFlottesConnectees = lazy(() => import("./pages/labs/GestionFlottesConnectees"));
const GestionGroupe = lazy(() => import("./pages/labs/GestionGroupe"));
const GestionMarques = lazy(() => import("./pages/labs/GestionMarques"));
const GestionMobiliteEntreprises = lazy(() => import("./pages/labs/GestionMobiliteEntreprises"));
const GlobalStandards = lazy(() => import("./pages/labs/GlobalStandards"));
const HubAfrique = lazy(() => import("./pages/labs/HubAfrique"));
const HubsRegionaux = lazy(() => import("./pages/labs/HubsRegionaux"));
const IAAutomobile = lazy(() => import("./pages/labs/IAAutomobile"));
const IAAvancee = lazy(() => import("./pages/labs/IAAvancee"));
const IAConseillerAchat = lazy(() => import("./pages/labs/IAConseillerAchat"));
const IAConseillerGarage = lazy(() => import("./pages/labs/IAConseillerGarage"));
const IAConseillerVente = lazy(() => import("./pages/labs/IAConseillerVente"));
const IAOperationnelleMondiale = lazy(() => import("./pages/labs/IAOperationnelleMondiale"));
const IdentiteNumeriqueEntreprise = lazy(() => import("./pages/labs/IdentiteNumeriqueEntreprise"));
const IdentiteNumeriqueVehicule = lazy(() => import("./pages/labs/IdentiteNumeriqueVehicule"));
const IdentiteNumeriqueVehicule2 = lazy(() => import("./pages/labs/IdentiteNumeriqueVehicule2"));
const InspectionDistance = lazy(() => import("./pages/labs/InspectionDistance"));
const InstitutFormation = lazy(() => import("./pages/labs/InstitutFormation"));
const JumeauNumerique = lazy(() => import("./pages/labs/JumeauNumerique"));
const JumeauNumeriqueMondial = lazy(() => import("./pages/labs/JumeauNumeriqueMondial"));
const JumeauxNumeriques = lazy(() => import("./pages/labs/JumeauxNumeriques"));
const LabelCertifie = lazy(() => import("./pages/labs/LabelCertifie"));
const LabelMondial = lazy(() => import("./pages/labs/LabelMondial"));
const LaboratoiresFuturs = lazy(() => import("./pages/labs/LaboratoiresFuturs"));
const LicencesMKAPMS = lazy(() => import("./pages/labs/LicencesMKAPMS"));
const LogistiquesCentres = lazy(() => import("./pages/labs/LogistiquesCentres"));
const MKAPMSWorld = lazy(() => import("./pages/labs/MKAPMSWorld"));
const MaintenancePredictive = lazy(() => import("./pages/labs/MaintenancePredictive"));
const MobiliteComplete = lazy(() => import("./pages/labs/MobiliteComplete"));
const MuseeNumerique = lazy(() => import("./pages/labs/MuseeNumerique"));
const NormeMKAPMS = lazy(() => import("./pages/labs/NormeMKAPMS"));
const ObjectifUltime = lazy(() => import("./pages/labs/ObjectifUltime"));
const ObservatoireAutomobile = lazy(() => import("./pages/labs/ObservatoireAutomobile"));
const ObservatoireMondial = lazy(() => import("./pages/labs/ObservatoireMondial"));
const ParcIndustriel = lazy(() => import("./pages/labs/ParcIndustriel"));
const PasseportNumeriqueVehicule = lazy(() => import("./pages/labs/PasseportNumeriqueVehicule"));
const PlaceMarcheB2B = lazy(() => import("./pages/labs/PlaceMarcheB2B"));
const ProgrammeInnovation = lazy(() => import("./pages/labs/ProgrammeInnovation"));
const ProgrammeJeunesEntrepreneurs = lazy(() => import("./pages/labs/ProgrammeJeunesEntrepreneurs"));
const ProgrammesStrategiques = lazy(() => import("./pages/labs/ProgrammesStrategiques"));
const ReseauAlliances = lazy(() => import("./pages/labs/ReseauAlliances"));
const ReseauAssistance247 = lazy(() => import("./pages/labs/ReseauAssistance247"));
const ReseauCentresFormation = lazy(() => import("./pages/labs/ReseauCentresFormation"));
const ReseauConvoyeurs = lazy(() => import("./pages/labs/ReseauConvoyeurs"));
const ReseauDepannageAfrique = lazy(() => import("./pages/labs/ReseauDepannageAfrique"));
const ReseauDepanneurs = lazy(() => import("./pages/labs/ReseauDepanneurs"));
const ReseauDistribution = lazy(() => import("./pages/labs/ReseauDistribution"));
const ReseauExperts = lazy(() => import("./pages/labs/ReseauExperts"));
const ReseauExpertsGlobal = lazy(() => import("./pages/labs/ReseauExpertsGlobal"));
const ReseauFournisseursGlobal = lazy(() => import("./pages/labs/ReseauFournisseursGlobal"));
const ReseauGaragesAfrique = lazy(() => import("./pages/labs/ReseauGaragesAfrique"));
const ReseauIndustriel = lazy(() => import("./pages/labs/ReseauIndustriel"));
const ReseauMobiliteMondiale = lazy(() => import("./pages/labs/ReseauMobiliteMondiale"));
const ReseauMondialComplet = lazy(() => import("./pages/labs/ReseauMondialComplet"));
const ReseauMondialPartenaires = lazy(() => import("./pages/labs/ReseauMondialPartenaires"));
const ReseauMondialServices = lazy(() => import("./pages/labs/ReseauMondialServices"));
const ReseauPiecesAfrique = lazy(() => import("./pages/labs/ReseauPiecesAfrique"));
const ReseauTransport = lazy(() => import("./pages/labs/ReseauTransport"));
const ReseauTransportMarchandises = lazy(() => import("./pages/labs/ReseauTransportMarchandises"));
const ReseauTransportPersonnes = lazy(() => import("./pages/labs/ReseauTransportPersonnes"));
const ReseauUsines = lazy(() => import("./pages/labs/ReseauUsines"));
const SignatureUniverselle = lazy(() => import("./pages/labs/SignatureUniverselle"));
const SmartVehicles = lazy(() => import("./pages/labs/SmartVehicles"));
const StationnementIntelligent = lazy(() => import("./pages/labs/StationnementIntelligent"));
const SystemesProprietaires = lazy(() => import("./pages/labs/SystemesProprietaires"));
const Telematique = lazy(() => import("./pages/labs/Telematique"));
const TestsPilotes = lazy(() => import("./pages/labs/TestsPilotes"));
const VehiculesConnectes = lazy(() => import("./pages/labs/VehiculesConnectes"));
const VisionFinaleMKAPMS = lazy(() => import("./pages/labs/VisionFinaleMKAPMS"));
const WorldVision = lazy(() => import("./pages/labs/WorldVision"));
const ZonesTechniques = lazy(() => import("./pages/labs/ZonesTechniques"));
// Dépôt Annonce
const AnalyseIA = lazy(() => import("./pages/depot-annonce/AnalyseIA"));
const ConseilsIA = lazy(() => import("./pages/depot-annonce/ConseilsIA"));
const DepotAnnoncePortail = lazy(() => import("./pages/depot-annonce/DepotAnnoncePortail"));
const DescriptionAnnonce = lazy(() => import("./pages/depot-annonce/DescriptionAnnonce"));
const DocumentsAnnonce = lazy(() => import("./pages/depot-annonce/DocumentsAnnonce"));
const ExpirationAnnonce = lazy(() => import("./pages/depot-annonce/ExpirationAnnonce"));
const IdentificationVehicule = lazy(() => import("./pages/depot-annonce/IdentificationVehicule"));
const InformationsPrincipales = lazy(() => import("./pages/depot-annonce/InformationsPrincipales"));
const ModificationAnnonce = lazy(() => import("./pages/depot-annonce/ModificationAnnonce"));
const ObjectifDepotAnnonce = lazy(() => import("./pages/depot-annonce/ObjectifDepotAnnonce"));
const OptionsAnnonce = lazy(() => import("./pages/depot-annonce/OptionsAnnonce"));
const PhotosVehicule = lazy(() => import("./pages/depot-annonce/PhotosVehicule"));
const PublicationAnnonce = lazy(() => import("./pages/depot-annonce/PublicationAnnonce"));
const ScoreQualiteAnnonce = lazy(() => import("./pages/depot-annonce/ScoreQualiteAnnonce"));
const TableauBordAnnonceur = lazy(() => import("./pages/depot-annonce/TableauBordAnnonceur"));
const VideosAnnonce = lazy(() => import("./pages/depot-annonce/VideosAnnonce"));

// Chaque univers est isolé : un crash dans l'un n'affecte pas les autres.
function U({ name, children }: { name: string; children: React.ReactNode }) {
  return <UniversBoundary name={name}>{children}</UniversBoundary>;
}

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
    </div>
  );
}

function SessionLoader() {
  const { token, setUser, setSessionLoaded } = useAuth();
  const me = trpc.auth.me.useQuery(undefined, { enabled: !!token });
  useEffect(() => {
    if (me.data) {
      setUser(me.data as any);
      setSessionLoaded();
    }
  }, [me.data, setUser, setSessionLoaded]);
  useEffect(() => {
    if (me.isError || (me.isFetched && !me.data)) {
      setSessionLoaded();
    }
  }, [me.isError, me.isFetched, me.data, setSessionLoaded]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <SessionLoader />
      <InstallPrompt />
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/louer" element={<U name="Location"><Louer /></U>} />
            <Route path="/louer/vtc-taxi" element={<U name="Location VTC & Taxi"><VtcTaxi /></U>} />
            <Route path="/louer/particulier" element={<U name="Location Particulier"><LocationParticulier /></U>} />
            <Route path="/louer/pro" element={<U name="Location Pro"><LocationPro /></U>} />
            <Route path="/louer/vtc-taxi/vehicule/:id" element={<U name="Produit VTC & Taxi"><ProduitVtcTaxi /></U>} />
            <Route path="/louer/particulier/vehicule/:id" element={<U name="Produit Particulier"><ProduitParticulier /></U>} />
            <Route path="/louer/pro/vehicule/:id" element={<U name="Produit Pro"><ProduitLocation /></U>} />
            <Route path="/louer/utilitaires/vehicule/:id" element={<U name="Produit Utilitaire"><ProduitLocation /></U>} />
            <Route path="/louer/camions/vehicule/:id" element={<U name="Produit Camion"><ProduitLocation /></U>} />
            <Route path="/louer/minibus/vehicule/:id" element={<U name="Produit Minibus"><ProduitLocation /></U>} />
            <Route path="/louer/utilitaires" element={<U name="Utilitaires"><LocationUtilitaires /></U>} />
            <Route path="/louer/camions" element={<U name="Camions"><LocationCamions /></U>} />
            <Route path="/louer/minibus" element={<U name="Minibus"><LocationMinibus /></U>} />
            <Route path="/louer/liste-attente" element={<U name="Liste d'attente"><ListeAttente /></U>} />
            <Route path="/louer/reservations-recurrentes" element={<U name="Réservations récurrentes"><ReservationRecurrente /></U>} />
            <Route path="/louer/comparateur" element={<U name="Comparateur"><Comparateur /></U>} />
            <Route path="/louer/favoris" element={<U name="Favoris"><Favoris /></U>} />
            <Route path="/louer/etats-vehicule" element={<U name="États véhicule"><EtatVehicule /></U>} />
            <Route path="/louer/renouvellement" element={<U name="Renouvellement"><RenouvellementLocation /></U>} />
            <Route path="/documents" element={<U name="Documents"><CentreDocuments /></U>} />
            <Route path="/notifications" element={<U name="Notifications"><Notifications /></U>} />
            <Route path="/messagerie" element={<U name="Messagerie"><Messagerie /></U>} />
            <Route path="/louer/remplacement" element={<U name="Remplacement"><RemplacementVehicule /></U>} />
            <Route path="/louer/conducteurs" element={<U name="Conducteurs"><GestionConducteurs /></U>} />
            <Route path="/louer/inspection" element={<U name="Inspection"><InspectionNumerique /></U>} />
            <Route path="/louer/assistance" element={<U name="Assistance"><AssistanceSinistre /></U>} />
            <Route path="/louer/penalites" element={<U name="Pénalités"><CentrePenalites /></U>} />
            <Route path="/louer/controle-documents" element={<U name="Contrôle documents"><ControleDocuments /></U>} />
            <Route path="/louer/historique" element={<U name="Historique location"><HistoriqueLocation /></U>} />
            <Route path="/louer/programme-vtc" element={<U name="Programme VTC"><ProgrammeVTC /></U>} />
            <Route path="/louer/calendrier" element={<U name="Calendrier"><CalendrierDispo /></U>} />
            <Route path="/louer/score-confiance" element={<U name="Score confiance"><ScoreConfiance /></U>} />
            <Route path="/louer/livraison" element={<U name="Livraison"><LivraisonVehicule /></U>} />
            <Route path="/louer/loa" element={<U name="LOA"><LocationLOA /></U>} />
            <Route path="/louer/certifies" element={<U name="Certifiés"><VehiculesCertifies /></U>} />
            <Route path="/louer/multi-vehicules" element={<U name="Multi-véhicules"><ReservationMulti /></U>} />
            <Route path="/louer/franchises" element={<U name="Franchises"><GestionFranchises /></U>} />
            <Route path="/louer/renouvellement-flotte" element={<U name="Renouvellement flotte"><RenouvellementFlotte /></U>} />
            <Route path="/louer/tableau-bord-loueur" element={<U name="Tableau bord loueur"><TableauBordLoueur /></U>} />
            <Route path="/louer/score-loueur" element={<U name="Score loueur"><ScoreQualiteLoueur /></U>} />
            {/* Univers Vente */}
            <Route path="/acheter" element={<U name="Vente"><VenteGenerale /></U>} />
            <Route path="/acheter/particulier" element={<U name="Vente Particulier"><VenteParticulier /></U>} />
            <Route path="/acheter/professionnel" element={<U name="Vente Pro"><VentePro /></U>} />
            <Route path="/acheter/mkapms-officiel" element={<U name="Vente MKA.P-MS"><VenteMKAPMS /></U>} />
            <Route path="/acheter/moto" element={<U name="Vente Moto"><VenteMoto /></U>} />
            <Route path="/acheter/utilitaires" element={<U name="Vente Utilitaires"><VenteUtilitaires /></U>} />
            <Route path="/acheter/camions" element={<U name="Vente Camions"><VenteCamions /></U>} />
            <Route path="/acheter/vtc-taxi" element={<U name="Vente VTC"><VenteVTC /></U>} />
            <Route path="/acheter/promotions" element={<U name="Promotions"><VentePromotions /></U>} />
            <Route path="/acheter/encheres" element={<U name="Ench\u00e8res"><VenteEncheres /></U>} />
            <Route path="/acheter/estimation" element={<U name="Estimation"><EstimationAuto /></U>} />
            <Route path="/acheter/historique-vehicule" element={<U name="Historique v\u00e9hicule"><HistoriqueVehiculeVente /></U>} />
            <Route path="/acheter/reprise" element={<U name="Reprise"><RepriseVehicule /></U>} />
            <Route path="/acheter/depot-annonce" element={<U name="D\u00e9p\u00f4t annonce"><DepotAnnonce /></U>} />
            <Route path="/acheter/mes-annonces" element={<U name="Mes annonces"><MesAnnonces /></U>} />
            <Route path="/acheter/espace-pro" element={<U name="Espace Pro Vente"><EspaceProVente /></U>} />
            {/* Inscriptions */}
            <Route path="/inscription" element={<U name="Inscription"><InscriptionParticulier /></U>} />
            <Route path="/tableau-de-bord" element={<U name="Mon espace"><TableauBordParticulier /></U>} />
            <Route path="/acheter/inscription-pro" element={<U name="Inscription Pro"><InscriptionProVente /></U>} />
            <Route path="/vente" element={<U name="Tableau de bord Vente"><TableauBordProVente /></U>} />
            {/* Vente operations */}
            <Route path="/vente/stock" element={<U name="Stock VO"><GestionStockVO /></U>} />
            <Route path="/vente/dossier-vehicule/:id?" element={<U name="Dossier véhicule"><DossierVehicule /></U>} />
            <Route path="/vente/workflow/:id?" element={<U name="Workflow VO"><WorkflowAchatVO /></U>} />
            <Route path="/vente/mes-annonces" element={<U name="Mes Annonces"><MesAnnonces /></U>} />
            <Route path="/vente/factures" element={<U name="Factures"><Comptabilite /></U>} />
            <Route path="/vente/abonnements" element={<U name="Abonnements"><Abonnements /></U>} />
            <Route path="/vente/documents-societe" element={<U name="Documents"><CentreDocuments /></U>} />
            <Route path="/vente/statistiques" element={<U name="Statistiques"><CentrePerformances /></U>} />
            <Route path="/vente/transport" element={<U name="Transport"><CentreTransport /></U>} />
            <Route path="/vente/diagnostic" element={<U name="Diagnostic"><CentreDiagnostic /></U>} />
            <Route path="/vente/reparations" element={<U name="R\u00e9parations"><CentreReparations /></U>} />
            <Route path="/vente/photos" element={<U name="Photos"><CentrePhotosMedias /></U>} />
            <Route path="/vente/reservations" element={<U name="R\u00e9servations Vente"><ReservationsVente /></U>} />
            <Route path="/vente/livraison" element={<U name="Livraison Vente"><LivraisonVente /></U>} />
            <Route path="/vente/dossier-client" element={<U name="Dossier Client"><DossierClient /></U>} />
            <Route path="/vente/avis" element={<U name="Avis Vendeurs"><AvisVendeurs /></U>} />
            <Route path="/vente/qualite" element={<U name="Qualit\u00e9 Vendeur"><QualiteVendeur /></U>} />
            <Route path="/vente/achat-express" element={<U name="Achat Express"><AchatExpress /></U>} />
            <Route path="/vente/resume-vendeur" element={<U name="R\u00e9sum\u00e9 Vendeur"><TableauBordVendeur /></U>} />
            <Route path="/vente/alertes" element={<U name="Alertes"><AlertesAuto /></U>} />
            <Route path="/vente/multi-sites" element={<U name="Multi-Sites"><MultiSites /></U>} />
            <Route path="/vente/employes" element={<U name="Employ\u00e9s"><GestionEmployes /></U>} />
            <Route path="/vente/droits" element={<U name="Droits acc\u00e8s"><DroitsAcces /></U>} />
            <Route path="/vente/fournisseurs" element={<U name="Fournisseurs"><CentreFournisseurs /></U>} />
            <Route path="/vente/marges" element={<U name="Marges"><CentreMarges /></U>} />
            <Route path="/vente/objectifs" element={<U name="Objectifs"><CentreObjectifs /></U>} />
            <Route path="/vente/performances" element={<U name="Performances"><CentrePerformances /></U>} />
            <Route path="/vente/publicites" element={<U name="Publicit\u00e9s"><CentrePublicites /></U>} />
            <Route path="/vente/campagnes" element={<U name="Campagnes"><CentreCampagnes /></U>} />
            <Route path="/vente/clients" element={<U name="Clients"><CentreClientsVente /></U>} />
            <Route path="/vente/financement" element={<U name="Financement"><CentreFinancement /></U>} />
            <Route path="/vente/controle-qualite" element={<U name="Contr\u00f4le Qualit\u00e9"><CentreControleQualite /></U>} />
            <Route path="/vente/export" element={<U name="Export"><CentreExport /></U>} />
            <Route path="/vente/archives" element={<U name="Archives"><CentreArchives /></U>} />
            <Route path="/vente/securite" element={<U name="S\u00e9curit\u00e9"><CentreSecurite /></U>} />
            {/* Marketplace Avanc\u00e9e (51-70) */}
            <Route path="/vente/negociation" element={<U name="N\u00e9gociation"><CentreNegociation /></U>} />
            <Route path="/vente/reservation-achat" element={<U name="R\u00e9servation achat"><CentreReservationAchat /></U>} />
            <Route path="/vente/visite" element={<U name="Visite v\u00e9hicule"><CentreVisiteVehicule /></U>} />
            <Route path="/vente/essai" element={<U name="Essai routier"><CentreEssaiRoutier /></U>} />
            <Route path="/vente/dossier-acheteur" element={<U name="Dossier acheteur"><CentreDossiersAcheteurs /></U>} />
            <Route path="/vente/comparaison" element={<U name="Comparaison"><CentreComparaison /></U>} />
            <Route path="/vente/alertes-recherche" element={<U name="Alertes recherche"><CentreAlertesRecherche /></U>} />
            <Route path="/vente/favoris" element={<U name="Favoris Vente"><CentreFavorisVente /></U>} />
            <Route path="/vente/recommandations" element={<U name="Recommandations"><CentreRecommandations /></U>} />
            <Route path="/vente/historique-consultations" element={<U name="Historique consultations"><CentreHistoriqueConsultations /></U>} />
            <Route path="/vente/certifies" element={<U name="V\u00e9hicules certifi\u00e9s"><CentreVehiculesCertifiesVente /></U>} />
            <Route path="/vente/garantie" element={<U name="Garantie occasion"><CentreGarantieOccasion /></U>} />
            <Route path="/vente/rapports" element={<U name="Rapports v\u00e9hicule"><CentreRapportsVehicule /></U>} />
            <Route path="/vente/achat-distance" element={<U name="Achat \u00e0 distance"><CentreAchatDistance /></U>} />
            <Route path="/vente/livraison-acheteur" element={<U name="Livraison acheteur"><CentreLivraisonAcheteur /></U>} />
            <Route path="/vente/retour-client" element={<U name="Retour client"><CentreRetourClient /></U>} />
            <Route path="/vente/badges" element={<U name="Badges vendeurs"><CentreBadgesVendeurs /></U>} />
            <Route path="/vente/fraude" element={<U name="D\u00e9tection fraude"><CentreDetectionFraude /></U>} />
            <Route path="/vente/confiance" element={<U name="Confiance acheteur"><CentreConfianceAcheteur /></U>} />
            <Route path="/vente/parcours-acheteur" element={<U name="Parcours acheteur"><WorkflowCompletAcheteur /></U>} />
            <Route path="/vehicule/:id" element={<U name="Vente"><Vehicule /></U>} />
            <Route path="/vendre" element={<U name="Vente"><Vendre /></U>} />
            <Route path="/devis" element={<U name="Devis"><Devis /></U>} />
            <Route path="/garages" element={<U name="Réseau de garages"><Garages /></U>} />
            <Route path="/garage-plus" element={<U name="Garage+"><GaragePlus /></U>} />
            <Route path="/univers" element={<U name="Univers"><Univers /></U>} />
            <Route path="/pieces" element={<U name="Pièces Auto"><Pieces /></U>} />
            <Route path="/livraison" element={<U name="Livraison"><Livraison /></U>} />
            <Route path="/depannage" element={<U name="Dépannage"><Depannage /></U>} />
            <Route path="/vtc-taxi" element={<U name="VTC / TAXI"><VtcTaxi /></U>} />
            <Route path="/import-africa" element={<U name="Import Africa+"><ImportAfrica /></U>} />
            <Route path="/historique" element={<U name="Historique"><Historique /></U>} />
            <Route path="/wallet" element={<U name="Wallet"><Wallet /></U>} />
            <Route path="/carte" element={<U name="Carte mondiale"><CarteMondiale /></U>} />
            <Route path="/depot-vente" element={<U name="Dépôt-Vente"><DepotVente /></U>} />
            <Route path="/vo" element={<U name="VO Interne"><VOInterne /></U>} />
            <Route path="/comptabilite" element={<U name="Comptabilité"><Comptabilite /></U>} />
            <Route path="/carte-grise" element={<U name="Carte Grise"><CarteGrise /></U>} />
            <Route path="/abonnements" element={<U name="Abonnements"><Abonnements /></U>} />
            <Route path="/aide" element={<Aide />} />
            <Route path="/confiance" element={<Confiance />} />
            <Route path="/mission" element={<Mission />} />
            <Route path="/espace-pro" element={<U name="Espace Pro"><EspacePro /></U>} />
            <Route path="/inscription-pro-vo" element={<U name="Inscription Pro VO"><InscriptionProVO /></U>} />
            <Route path="/finance" element={<U name="Finance+"><Finance /></U>} />
            <Route path="/rechercher" element={<U name="Recherche"><Rechercher /></U>} />
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/demande-publicite" element={<DemandePublicite />} />
            <Route path="/publicite/:id" element={<PubliciteDetail />} />
            <Route path="/favoris" element={<U name="Favoris"><Favoris /></U>} />
            <Route path="/comparateur" element={<U name="Comparateur"><Comparateur /></U>} />
            <Route path="/historique-consultations" element={<U name="Historique"><HistoriqueConsultationsUniv /></U>} />
            <Route path="/dossier-client" element={<U name="Dossier Client"><DossierClientUniv /></U>} />
            <Route path="/dossier-vehicule-numerique" element={<U name="Dossier V\u00e9hicule"><DossierVehiculeNumerique /></U>} />
            <Route path="/atelier-pro" element={<U name="Atelier Pro"><AtelierPro /></U>} />
            <Route path="/catalogue-technique" element={<U name="Catalogue Technique"><CatalogueTechniqueStandalone /></U>} />
            <Route path="/rewards" element={<U name="Rewards"><Rewards /></U>} />
            <Route path="/compta-dirigeant" element={<U name="Comptabilit\u00e9"><ComptaDirigeant /></U>} />
            <Route path="/suivi-vehicule" element={<U name="Suivi v\u00e9hicule"><SuiviVehicule /></U>} />
            <Route path="/journal-activite" element={<U name="Journal"><JournalActivite /></U>} />
            <Route path="/mk-direction" element={<AccesPDG />} />
            <Route path="/mk-global-engine" element={<U name="Global Country Engine"><GlobalCountryEngine /></U>} />
            <Route path="/compte/validation" element={<U name="Validation"><Validation /></U>} />
            <Route path="/compte/*" element={<U name="Mon compte"><Compte /></U>} />
            <Route path="/admin/*" element={<U name="Back-office"><Admin /></U>} />
            {/* Phase finale V1 + SEO + Géolocalisation */}
            <Route path="/abonnements-definitifs" element={<U name="Abonnements"><AbonnementsDefinitifs /></U>} />
            <Route path="/badges-definitifs" element={<U name="Badges"><BadgesDefinitifs /></U>} />
            <Route path="/publicite-interne" element={<U name="Publicité"><PubliciteInterne /></U>} />
            <Route path="/voiture-occasion" element={<U name="Vente"><VoitureOccasion /></U>} />
            <Route path="/moto-occasion" element={<U name="Moto"><MotoOccasion /></U>} />
            <Route path="/location-voiture" element={<U name="Location"><LocationVoiture /></U>} />
            <Route path="/garage-auto" element={<U name="Garage"><GarageAuto /></U>} />
            <Route path="/seo-abonnements" element={<U name="SEO"><SEOAbonnements /></U>} />
            <Route path="/recherche" element={<U name="Recherche"><RechercheGeolocalisee /></U>} />
            <Route path="/:pays/:ville/:modele?" element={<U name="Recherche Locale"><RechercheLocale /></U>} />
            {/* Garage */}
            <Route path="/garage/assistance-routiere" element={<U name="Garage"><AssistanceRoutiere /></U>} />
            <Route path="/garage/boutique-pieces" element={<U name="Garage"><BoutiquePieces /></U>} />
            <Route path="/garage/carrosserie-garage" element={<U name="Garage"><CarrosserieGarage /></U>} />
            <Route path="/garage/centre-lavage" element={<U name="Garage"><CentreLavage /></U>} />
            <Route path="/garage/centre-reclamations" element={<U name="Garage"><CentreReclamations /></U>} />
            <Route path="/garage/commande-pieces" element={<U name="Garage"><CommandePieces /></U>} />
            <Route path="/garage/commandes-automatiques" element={<U name="Garage"><CommandesAutomatiques /></U>} />
            <Route path="/garage/contrats-flottes" element={<U name="Garage"><ContratsFlottes /></U>} />
            <Route path="/garage/controle-qualite-garage" element={<U name="Garage"><ControleQualiteGarage /></U>} />
            <Route path="/garage/controle-qualite-premium" element={<U name="Garage"><ControleQualitePremium /></U>} />
            <Route path="/garage/controle-technique" element={<U name="Garage"><ControleTechnique /></U>} />
            <Route path="/garage/demande-devis" element={<U name="Garage"><DemandeDevis /></U>} />
            <Route path="/garage/depannage-avance" element={<U name="Garage"><DepannageAvance /></U>} />
            <Route path="/garage/depannage-garage" element={<U name="Garage"><DepannageGarage /></U>} />
            <Route path="/garage/diagnostic-avance" element={<U name="Garage"><DiagnosticAvance /></U>} />
            <Route path="/garage/diagnostic-garage" element={<U name="Garage"><DiagnosticGarage /></U>} />
            <Route path="/garage/dossiers-flottes" element={<U name="Garage"><DossiersFlottes /></U>} />
            <Route path="/garage/entretiens-preventifs" element={<U name="Garage"><EntretiensPreventifs /></U>} />
            <Route path="/garage/esthetique-auto" element={<U name="Garage"><EsthetiqueAuto /></U>} />
            <Route path="/garage/fiches-techniciens" element={<U name="Garage"><FichesTechniciens /></U>} />
            <Route path="/garage/file-attente-atelier" element={<U name="Garage"><FileAttenteAtelier /></U>} />
            <Route path="/garage/flottes-entreprises" element={<U name="Garage"><FlottesEntreprises /></U>} />
            <Route path="/garage/fournisseurs-garage" element={<U name="Garage"><FournisseursGarage /></U>} />
            <Route path="/garage" element={<U name="Garage"><GarageGenerale /></U>} />
            <Route path="/garage/garage-particulier" element={<U name="Garage"><GarageParticulier /></U>} />
            <Route path="/garage/garage-professionnel" element={<U name="Garage"><GarageProfessionnel /></U>} />
            <Route path="/garage/garantie-travaux" element={<U name="Garage"><GarantieTravaux /></U>} />
            <Route path="/garage/gestion-mecaniciens" element={<U name="Garage"><GestionMecaniciens /></U>} />
            <Route path="/garage/gestion-outillage" element={<U name="Garage"><GestionOutillage /></U>} />
            <Route path="/garage/gestion-ponts" element={<U name="Garage"><GestionPonts /></U>} />
            <Route path="/garage/historique-garage" element={<U name="Garage"><HistoriqueGarage /></U>} />
            <Route path="/garage/lavage-preparation" element={<U name="Garage"><LavagePreparation /></U>} />
            <Route path="/garage/multi-garages" element={<U name="Garage"><MultiGarages /></U>} />
            <Route path="/garage/objectif-final-garage" element={<U name="Garage"><ObjectifFinalGarage /></U>} />
            <Route path="/garage/objectif-garage" element={<U name="Garage"><ObjectifGarage /></U>} />
            <Route path="/garage/ordre-reparation" element={<U name="Garage"><OrdreReparation /></U>} />
            <Route path="/garage/panier-pieces" element={<U name="Garage"><PanierPieces /></U>} />
            <Route path="/garage/photos-intervention" element={<U name="Garage"><PhotosIntervention /></U>} />
            <Route path="/garage/photos-techniques" element={<U name="Garage"><PhotosTechniques /></U>} />
            <Route path="/garage/planning-atelier" element={<U name="Garage"><PlanningAtelier /></U>} />
            <Route path="/garage/pneumatiques" element={<U name="Garage"><Pneumatiques /></U>} />
            <Route path="/garage/pneumatiques-avance" element={<U name="Garage"><PneumatiquesAvance /></U>} />
            <Route path="/garage/preparation-vente-v-o" element={<U name="Garage"><PreparationVenteVO /></U>} />
            <Route path="/garage/prise-rendez-vous" element={<U name="Garage"><PriseRendezVous /></U>} />
            <Route path="/garage/reception-vehicule" element={<U name="Garage"><ReceptionVehicule /></U>} />
            <Route path="/garage/recherche-pieces" element={<U name="Garage"><RecherchePieces /></U>} />
            <Route path="/garage/relance-client" element={<U name="Garage"><RelanceClient /></U>} />
            <Route path="/garage/rentabilite-atelier" element={<U name="Garage"><RentabiliteAtelier /></U>} />
            <Route path="/garage/reseau-partenaires" element={<U name="Garage"><ReseauPartenaires /></U>} />
            <Route path="/garage/reservation-atelier" element={<U name="Garage"><ReservationAtelier /></U>} />
            <Route path="/garage/restitution-client" element={<U name="Garage"><RestitutionClient /></U>} />
            <Route path="/garage/statistiques-garage" element={<U name="Garage"><StatistiquesGarage /></U>} />
            <Route path="/garage/stock-pieces" element={<U name="Garage"><StockPieces /></U>} />
            <Route path="/garage/suivi-temps-reel" element={<U name="Garage"><SuiviTempsReel /></U>} />
            <Route path="/garage/tableau-bord-chef-atelier" element={<U name="Garage"><TableauBordChefAtelier /></U>} />
            <Route path="/garage/temps-intervention" element={<U name="Garage"><TempsIntervention /></U>} />
            <Route path="/garage/transfert-dossiers" element={<U name="Garage"><TransfertDossiers /></U>} />
            <Route path="/garage/validation-client" element={<U name="Garage"><ValidationClient /></U>} />
            <Route path="/garage/validation-interne" element={<U name="Garage"><ValidationInterne /></U>} />
            <Route path="/garage/vehicules-attente" element={<U name="Garage"><VehiculesAttente /></U>} />
            {/* Démarches */}
            <Route path="/demarches/alertes-demarches" element={<U name="Démarches"><AlertesDemarches /></U>} />
            <Route path="/demarches/archives-administratives" element={<U name="Démarches"><ArchivesAdministratives /></U>} />
            <Route path="/demarches/carte-grise-demarche" element={<U name="Démarches"><CarteGriseDemarche /></U>} />
            <Route path="/demarches/centre-documents-demarches" element={<U name="Démarches"><CentreDocumentsDemarches /></U>} />
            <Route path="/demarches/changement-adresse" element={<U name="Démarches"><ChangementAdresse /></U>} />
            <Route path="/demarches/changement-titulaire" element={<U name="Démarches"><ChangementTitulaire /></U>} />
            <Route path="/demarches/declaration-cession" element={<U name="Démarches"><DeclarationCession /></U>} />
            <Route path="/demarches" element={<U name="Démarches"><DemarchesGenerale /></U>} />
            <Route path="/demarches/duplicata-demarche" element={<U name="Démarches"><DuplicataDemarche /></U>} />
            <Route path="/demarches/espace-pro-demarches" element={<U name="Démarches"><EspaceProDemarches /></U>} />
            <Route path="/demarches/immatriculation-provisoire" element={<U name="Démarches"><ImmatriculationProvisoire /></U>} />
            <Route path="/demarches/importation-vehicule" element={<U name="Démarches"><ImportationVehicule /></U>} />
            <Route path="/demarches/messagerie-demarches" element={<U name="Démarches"><MessagerieDemarches /></U>} />
            <Route path="/demarches/objectif-demarches" element={<U name="Démarches"><ObjectifDemarches /></U>} />
            <Route path="/demarches/paiement-demarches" element={<U name="Démarches"><PaiementDemarches /></U>} />
            <Route path="/demarches/plaques-immatriculation" element={<U name="Démarches"><PlaquesImmatriculation /></U>} />
            <Route path="/demarches/signatures-electroniques" element={<U name="Démarches"><SignaturesElectroniques /></U>} />
            <Route path="/demarches/statistiques-demarches" element={<U name="Démarches"><StatistiquesDemarches /></U>} />
            <Route path="/demarches/succession-vehicule" element={<U name="Démarches"><SuccessionVehicule /></U>} />
            <Route path="/demarches/suivi-dossier" element={<U name="Démarches"><SuiviDossier /></U>} />
            <Route path="/demarches/verification-i-a" element={<U name="Démarches"><VerificationIA /></U>} />
            <Route path="/demarches/w-w-garage" element={<U name="Démarches"><WWGarage /></U>} />
            {/* Pièces */}
            <Route path="/pieces/abonnements-pro-pieces" element={<U name="Pièces"><AbonnementsProPieces /></U>} />
            <Route path="/pieces/avis-produits-pieces" element={<U name="Pièces"><AvisProduitsPieces /></U>} />
            <Route path="/pieces/fournisseurs-pieces" element={<U name="Pièces"><FournisseursPieces /></U>} />
            <Route path="/pieces/logistique-pieces" element={<U name="Pièces"><LogistiquePieces /></U>} />
            <Route path="/pieces/montage-garage" element={<U name="Pièces"><MontageGarage /></U>} />
            <Route path="/pieces/objectif-pieces" element={<U name="Pièces"><ObjectifPieces /></U>} />
            <Route path="/pieces/panier-pieces-detachees" element={<U name="Pièces"><PanierPiecesDetachees /></U>} />
            <Route path="/pieces/pieces-accessoires" element={<U name="Pièces"><PiecesAccessoires /></U>} />
            <Route path="/pieces/pieces-batteries" element={<U name="Pièces"><PiecesBatteries /></U>} />
            <Route path="/pieces/pieces-carrosserie" element={<U name="Pièces"><PiecesCarrosserie /></U>} />
            <Route path="/pieces/pieces-eclairage" element={<U name="Pièces"><PiecesEclairage /></U>} />
            <Route path="/pieces/pieces-freinage" element={<U name="Pièces"><PiecesFreinage /></U>} />
            <Route path="/pieces" element={<U name="Pièces"><PiecesGenerale /></U>} />
            <Route path="/pieces/pieces-huiles" element={<U name="Pièces"><PiecesHuiles /></U>} />
            <Route path="/pieces/pieces-moteur" element={<U name="Pièces"><PiecesMoteur /></U>} />
            <Route path="/pieces/pieces-pneumatiques" element={<U name="Pièces"><PiecesPneumatiques /></U>} />
            <Route path="/pieces/pieces-suspension" element={<U name="Pièces"><PiecesSuspension /></U>} />
            <Route path="/pieces/recherche-intelligente-pieces" element={<U name="Pièces"><RechercheIntelligentePieces /></U>} />
            <Route path="/pieces/retours-pieces" element={<U name="Pièces"><RetoursPieces /></U>} />
            <Route path="/pieces/statistiques-pieces" element={<U name="Pièces"><StatistiquesPieces /></U>} />
            <Route path="/pieces/vendeurs-pieces" element={<U name="Pièces"><VendeursPieces /></U>} />
            <Route path="/pieces/verification-compatibilite" element={<U name="Pièces"><VerificationCompatibilite /></U>} />
            {/* Finance */}
            <Route path="/finance/acompte-finance" element={<U name="Finance"><AcompteFinance /></U>} />
            <Route path="/finance/alertes-paiements" element={<U name="Finance"><AlertesPaiements /></U>} />
            <Route path="/finance/centre-echeancier" element={<U name="Finance"><CentreEcheancier /></U>} />
            <Route path="/finance/centre-factures" element={<U name="Finance"><CentreFactures /></U>} />
            <Route path="/finance/contrats-financiers" element={<U name="Finance"><ContratsFinanciers /></U>} />
            <Route path="/finance/depot-garantie-finance" element={<U name="Finance"><DepotGarantieFinance /></U>} />
            <Route path="/finance" element={<U name="Finance"><FinanceGenerale /></U>} />
            <Route path="/finance/garantie-securite" element={<U name="Finance"><GarantieSecurite /></U>} />
            <Route path="/finance/l-o-a-finance" element={<U name="Finance"><LOAFinance /></U>} />
            <Route path="/finance/objectif-finance" element={<U name="Finance"><ObjectifFinance /></U>} />
            <Route path="/finance/paiement-comptant" element={<U name="Finance"><PaiementComptant /></U>} />
            <Route path="/finance/paiement-fractionne" element={<U name="Finance"><PaiementFractionne /></U>} />
            <Route path="/finance/paiements-professionnels" element={<U name="Finance"><PaiementsProfessionnels /></U>} />
            <Route path="/finance/remboursements-finance" element={<U name="Finance"><RemboursementsFinance /></U>} />
            <Route path="/finance/tableau-bord-finance" element={<U name="Finance"><TableauBordFinance /></U>} />
            {/* Super Admin */}
            <Route path="/superadmin/admin-abonnements" element={<U name="Super Admin"><AdminAbonnements /></U>} />
            <Route path="/superadmin/admin-badges" element={<U name="Super Admin"><AdminBadges /></U>} />
            <Route path="/superadmin/admin-carte-moniale" element={<U name="Super Admin"><AdminCarteMoniale /></U>} />
            <Route path="/superadmin/admin-commissions" element={<U name="Super Admin"><AdminCommissions /></U>} />
            <Route path="/superadmin/admin-comptes-pro" element={<U name="Super Admin"><AdminComptesPro /></U>} />
            <Route path="/superadmin/admin-demarches" element={<U name="Super Admin"><AdminDemarches /></U>} />
            <Route path="/superadmin/admin-depannage" element={<U name="Super Admin"><AdminDepannage /></U>} />
            <Route path="/superadmin/admin-employes" element={<U name="Super Admin"><AdminEmployes /></U>} />
            <Route path="/superadmin/admin-fraude" element={<U name="Super Admin"><AdminFraude /></U>} />
            <Route path="/superadmin/admin-garage" element={<U name="Super Admin"><AdminGarage /></U>} />
            <Route path="/superadmin/admin-general" element={<U name="Super Admin"><AdminGeneral /></U>} />
            <Route path="/superadmin/admin-journal" element={<U name="Super Admin"><AdminJournal /></U>} />
            <Route path="/superadmin/admin-litiges" element={<U name="Super Admin"><AdminLitiges /></U>} />
            <Route path="/superadmin/admin-location" element={<U name="Super Admin"><AdminLocation /></U>} />
            <Route path="/superadmin/admin-moderation-annonces" element={<U name="Super Admin"><AdminModerationAnnonces /></U>} />
            <Route path="/superadmin/admin-moderation-avis" element={<U name="Super Admin"><AdminModerationAvis /></U>} />
            <Route path="/superadmin/admin-objectif" element={<U name="Super Admin"><AdminObjectif /></U>} />
            <Route path="/superadmin/admin-paiements" element={<U name="Super Admin"><AdminPaiements /></U>} />
            <Route path="/superadmin/admin-pieces" element={<U name="Super Admin"><AdminPieces /></U>} />
            <Route path="/superadmin/admin-s-e-o" element={<U name="Super Admin"><AdminSEO /></U>} />
            <Route path="/superadmin/admin-sauvegardes" element={<U name="Super Admin"><AdminSauvegardes /></U>} />
            <Route path="/superadmin/admin-securite" element={<U name="Super Admin"><AdminSecurite /></U>} />
            <Route path="/superadmin/admin-statistiques" element={<U name="Super Admin"><AdminStatistiques /></U>} />
            <Route path="/superadmin/admin-support" element={<U name="Super Admin"><AdminSupport /></U>} />
            <Route path="/superadmin/admin-utilisateurs" element={<U name="Super Admin"><AdminUtilisateurs /></U>} />
            <Route path="/superadmin/admin-vente" element={<U name="Super Admin"><AdminVente /></U>} />
            <Route path="/superadmin/admin-validation-docs" element={<U name="Super Admin"><AdminValidationDocs /></U>} />
            <Route path="/superadmin/centre-r-h" element={<U name="Super Admin"><CentreRH /></U>} />
            <Route path="/superadmin/centre-tickets" element={<U name="Super Admin"><CentreTickets /></U>} />
            <Route path="/superadmin/comptabilite-complete" element={<U name="Super Admin"><ComptabiliteComplete /></U>} />
            <Route path="/superadmin/gestion-employes-m-k-a-p-m-s" element={<U name="Super Admin"><GestionEmployesMKAPMS /></U>} />
            <Route path="/superadmin" element={<U name="Super Admin"><SuperAdminDashboard /></U>} />
            <Route path="/superadmin/validation-documents-complete" element={<U name="Super Admin"><ValidationDocumentsComplete /></U>} />
            {/* Utilisateurs */}
            <Route path="/utilisateurs/abonnements-utilisateur" element={<U name="Utilisateurs"><AbonnementsUtilisateur /></U>} />
            <Route path="/utilisateurs/centre-alertes-utilisateur" element={<U name="Utilisateurs"><CentreAlertesUtilisateur /></U>} />
            <Route path="/utilisateurs/centre-favoris-utilisateur" element={<U name="Utilisateurs"><CentreFavorisUtilisateur /></U>} />
            <Route path="/utilisateurs/centre-support-utilisateur" element={<U name="Utilisateurs"><CentreSupportUtilisateur /></U>} />
            <Route path="/utilisateurs" element={<U name="Utilisateurs"><CompteParticulier /></U>} />
            <Route path="/utilisateurs/compte-pro-utilisateur" element={<U name="Utilisateurs"><CompteProUtilisateur /></U>} />
            <Route path="/utilisateurs/documents-personnels" element={<U name="Utilisateurs"><DocumentsPersonnels /></U>} />
            <Route path="/utilisateurs/employes-utilisateur" element={<U name="Utilisateurs"><EmployesUtilisateur /></U>} />
            <Route path="/utilisateurs/factures-utilisateur" element={<U name="Utilisateurs"><FacturesUtilisateur /></U>} />
            <Route path="/utilisateurs/historique-achats" element={<U name="Utilisateurs"><HistoriqueAchats /></U>} />
            <Route path="/utilisateurs/historique-demarches" element={<U name="Utilisateurs"><HistoriqueDemarches /></U>} />
            <Route path="/utilisateurs/historique-depannages" element={<U name="Utilisateurs"><HistoriqueDepannages /></U>} />
            <Route path="/utilisateurs/historique-entretiens" element={<U name="Utilisateurs"><HistoriqueEntretiens /></U>} />
            <Route path="/utilisateurs/historique-locations" element={<U name="Utilisateurs"><HistoriqueLocations /></U>} />
            <Route path="/utilisateurs/mes-vehicules" element={<U name="Utilisateurs"><MesVehicules /></U>} />
            <Route path="/utilisateurs/messagerie-globale" element={<U name="Utilisateurs"><MessagerieGlobale /></U>} />
            <Route path="/utilisateurs/objectif-utilisateur" element={<U name="Utilisateurs"><ObjectifUtilisateur /></U>} />
            <Route path="/utilisateurs/securite-utilisateur" element={<U name="Utilisateurs"><SecuriteUtilisateur /></U>} />
            <Route path="/utilisateurs/suppression-compte" element={<U name="Utilisateurs"><SuppressionCompte /></U>} />
            <Route path="/utilisateurs/tableau-bord-perso" element={<U name="Utilisateurs"><TableauBordPerso /></U>} />
            {/* Notifications */}
            <Route path="/notifications/alertes-urgentes" element={<U name="Notifications"><AlertesUrgentes /></U>} />
            <Route path="/notifications/annonces-importantes" element={<U name="Notifications"><AnnoncesImportantes /></U>} />
            <Route path="/notifications/canaux-communication" element={<U name="Notifications"><CanauxCommunication /></U>} />
            <Route path="/notifications/coffre-fort-numerique" element={<U name="Notifications"><CoffreFortNumerique /></U>} />
            <Route path="/notifications/documents-entreprises" element={<U name="Notifications"><DocumentsEntreprises /></U>} />
            <Route path="/notifications/documents-personnels-global" element={<U name="Notifications"><DocumentsPersonnelsGlobal /></U>} />
            <Route path="/notifications/documents-vehicules" element={<U name="Notifications"><DocumentsVehicules /></U>} />
            <Route path="/notifications/historique-notifications" element={<U name="Notifications"><HistoriqueNotifications /></U>} />
            <Route path="/notifications/notifications-demarches" element={<U name="Notifications"><NotificationsDemarches /></U>} />
            <Route path="/notifications/notifications-depannage" element={<U name="Notifications"><NotificationsDepannage /></U>} />
            <Route path="/notifications/notifications-garage" element={<U name="Notifications"><NotificationsGarage /></U>} />
            <Route path="/notifications" element={<U name="Notifications"><NotificationsGenerale /></U>} />
            <Route path="/notifications/notifications-location" element={<U name="Notifications"><NotificationsLocation /></U>} />
            <Route path="/notifications/notifications-messages" element={<U name="Notifications"><NotificationsMessages /></U>} />
            <Route path="/notifications/notifications-paiements" element={<U name="Notifications"><NotificationsPaiements /></U>} />
            <Route path="/notifications/notifications-vente" element={<U name="Notifications"><NotificationsVente /></U>} />
            <Route path="/notifications/objectif-notifications" element={<U name="Notifications"><ObjectifNotifications /></U>} />
            <Route path="/notifications/parametres-notifications" element={<U name="Notifications"><ParametresNotifications /></U>} />
            <Route path="/notifications/rappels-automatiques" element={<U name="Notifications"><RappelsAutomatiques /></U>} />
            <Route path="/notifications/signatures-globales" element={<U name="Notifications"><SignaturesGlobales /></U>} />
            {/* Partenaires */}
            <Route path="/partenaires/attribution-demandes" element={<U name="Partenaires"><AttributionDemandes /></U>} />
            <Route path="/partenaires/carte-partenaires" element={<U name="Partenaires"><CartePartenaires /></U>} />
            <Route path="/partenaires/evaluation-partenaires" element={<U name="Partenaires"><EvaluationPartenaires /></U>} />
            <Route path="/partenaires/fiche-partenaire" element={<U name="Partenaires"><FichePartenaire /></U>} />
            <Route path="/partenaires/inscription-partenaire" element={<U name="Partenaires"><InscriptionPartenaire /></U>} />
            <Route path="/partenaires/niveaux-partenaires" element={<U name="Partenaires"><NiveauxPartenaires /></U>} />
            <Route path="/partenaires/objectif-partenaires" element={<U name="Partenaires"><ObjectifPartenaires /></U>} />
            <Route path="/partenaires" element={<U name="Partenaires"><PartenairesGenerale /></U>} />
            <Route path="/partenaires/statistiques-partenaires" element={<U name="Partenaires"><StatistiquesPartenaires /></U>} />
            <Route path="/partenaires/suspension-partenaires" element={<U name="Partenaires"><SuspensionPartenaires /></U>} />
            {/* Marketing */}
            <Route path="/marketing/campagnes-automatiques" element={<U name="Marketing"><CampagnesAutomatiques /></U>} />
            <Route path="/marketing/codes-promotionnels" element={<U name="Marketing"><CodesPromotionnels /></U>} />
            <Route path="/marketing/espaces-publicitaires" element={<U name="Marketing"><EspacesPublicitaires /></U>} />
            <Route path="/marketing/programme-fidelite" element={<U name="Marketing"><ProgrammeFidelite /></U>} />
            <Route path="/marketing/programme-parrainage" element={<U name="Marketing"><ProgrammeParrainage /></U>} />
            <Route path="/marketing/publicites-pro" element={<U name="Marketing"><PublicitesPro /></U>} />
            {/* Mobile */}
            <Route path="/mobile/app-android" element={<U name="Mobile"><AppAndroid /></U>} />
            <Route path="/mobile/app-i-o-s" element={<U name="Mobile"><AppIOS /></U>} />
            <Route path="/mobile/mode-hors-ligne" element={<U name="Mobile"><ModeHorsLigne /></U>} />
            <Route path="/mobile/notifications-push" element={<U name="Mobile"><NotificationsPush /></U>} />
            {/* IA */}
            <Route path="/ia/i-a-aide-devis" element={<U name="IA"><IAAideDevis /></U>} />
            <Route path="/ia/i-a-analyse-marche" element={<U name="IA"><IAAnalyseMarche /></U>} />
            <Route path="/ia/i-a-assistant-client" element={<U name="IA"><IAAssistantClient /></U>} />
            <Route path="/ia/i-a-detection-fraude" element={<U name="IA"><IADetectionFraude /></U>} />
            <Route path="/ia/i-a-estimation" element={<U name="IA"><IAEstimation /></U>} />
            {/* International */}
            <Route path="/international/multi-devises" element={<U name="International"><MultiDevises /></U>} />
            <Route path="/international/multi-langues" element={<U name="International"><MultiLangues /></U>} />
            <Route path="/international/multi-pays" element={<U name="International"><MultiPays /></U>} />
            {/* Investisseurs */}
            <Route path="/investisseurs/espace-investisseurs" element={<U name="Investisseurs"><EspaceInvestisseurs /></U>} />
            <Route path="/investisseurs/objectif-global" element={<U name="Investisseurs"><ObjectifGlobal /></U>} />
            {/* Entreprises */}
            <Route path="/entreprises/centre-carburant" element={<U name="Entreprises"><CentreCarburant /></U>} />
            <Route path="/entreprises/centre-geolocalisation" element={<U name="Entreprises"><CentreGeolocalisation /></U>} />
            <Route path="/entreprises/centre-immobilisation" element={<U name="Entreprises"><CentreImmobilisation /></U>} />
            <Route path="/entreprises/compte-flotte" element={<U name="Entreprises"><CompteFlotte /></U>} />
            <Route path="/entreprises/contrats-entreprises" element={<U name="Entreprises"><ContratsEntreprises /></U>} />
            <Route path="/entreprises/gestion-conducteurs" element={<U name="Entreprises"><EntreprisesGestionConducteurs /></U>} />
            <Route path="/entreprises/gestion-parc" element={<U name="Entreprises"><GestionParc /></U>} />
            <Route path="/entreprises/historique-flotte" element={<U name="Entreprises"><HistoriqueFlotte /></U>} />
            <Route path="/entreprises/objectif-flottes" element={<U name="Entreprises"><ObjectifFlottes /></U>} />
            <Route path="/entreprises/rapports-entreprises" element={<U name="Entreprises"><RapportsEntreprises /></U>} />
            {/* Formations */}
            <Route path="/formations/certificats" element={<U name="Formations"><Certificats /></U>} />
            <Route path="/formations/formation-garage" element={<U name="Formations"><FormationGarage /></U>} />
            <Route path="/formations/formation-taxi" element={<U name="Formations"><FormationTaxi /></U>} />
            <Route path="/formations/formation-v-t-c" element={<U name="Formations"><FormationVTC /></U>} />
            <Route path="/formations/formation-vente" element={<U name="Formations"><FormationVente /></U>} />
            {/* Recrutement */}
            <Route path="/recrutement/depot-c-v" element={<U name="Recrutement"><DepotCV /></U>} />
            <Route path="/recrutement/offres-emploi" element={<U name="Recrutement"><OffresEmploi /></U>} />
            <Route path="/recrutement/recherche-talents" element={<U name="Recrutement"><RechercheTalents /></U>} />
            {/* Communauté */}
            <Route path="/communaute/avis-conseils" element={<U name="Communauté"><AvisConseils /></U>} />
            <Route path="/communaute/guides-achat" element={<U name="Communauté"><GuidesAchat /></U>} />
            <Route path="/communaute/guides-garage" element={<U name="Communauté"><GuidesGarage /></U>} />
            <Route path="/communaute/guides-location" element={<U name="Communauté"><GuidesLocation /></U>} />
            <Route path="/communaute/guides-vente" element={<U name="Communauté"><GuidesVente /></U>} />
            <Route path="/communaute/questions-reponses" element={<U name="Communauté"><QuestionsReponses /></U>} />
            {/* Corporate */}
            <Route path="/corporate/a-propos" element={<U name="Corporate"><APropos /></U>} />
            <Route path="/corporate/contact-entreprise" element={<U name="Corporate"><ContactEntreprise /></U>} />
            <Route path="/corporate/nos-partenaires" element={<U name="Corporate"><NosPartenaires /></U>} />
            <Route path="/corporate/nos-services" element={<U name="Corporate"><NosServices /></U>} />
            <Route path="/corporate/presse-actualites" element={<U name="Corporate"><PresseActualites /></U>} />
            <Route path="/corporate/vision-m-k-a-p-m-s" element={<U name="Corporate"><VisionMKAPMS /></U>} />
            {/* Opérations */}
            <Route path="/operations/ambassadeurs" element={<U name="Opérations"><Ambassadeurs /></U>} />
            <Route path="/operations/centre-acquisition" element={<U name="Opérations"><CentreAcquisition /></U>} />
            <Route path="/operations/centre-audit" element={<U name="Opérations"><CentreAudit /></U>} />
            <Route path="/operations/centre-conformite" element={<U name="Opérations"><CentreConformite /></U>} />
            <Route path="/operations/centre-donnees-marche" element={<U name="Opérations"><CentreDonneesMarche /></U>} />
            <Route path="/operations/centre-expansion" element={<U name="Opérations"><CentreExpansion /></U>} />
            <Route path="/operations/centre-opportunites" element={<U name="Opérations"><CentreOpportunites /></U>} />
            <Route path="/operations/centre-previsions" element={<U name="Opérations"><CentrePrevisions /></U>} />
            <Route path="/operations/centre-risques" element={<U name="Opérations"><CentreRisques /></U>} />
            <Route path="/operations/centre-validation" element={<U name="Opérations"><CentreValidation /></U>} />
            <Route path="/operations/controle-qualite-global" element={<U name="Opérations"><ControleQualiteGlobal /></U>} />
            <Route path="/operations/m-k-a-p-m-s-afrique" element={<U name="Opérations"><MKAPMSAfrique /></U>} />
            <Route path="/operations/m-k-a-p-m-s-assurance" element={<U name="Opérations"><MKAPMSAssurance /></U>} />
            <Route path="/operations/m-k-a-p-m-s-banque" element={<U name="Opérations"><MKAPMSBanque /></U>} />
            <Route path="/operations/m-k-a-p-m-s-mobility" element={<U name="Opérations"><MKAPMSMobility /></U>} />
            <Route path="/operations/m-k-a-p-m-s-transport" element={<U name="Opérations"><MKAPMSTransport /></U>} />
            <Route path="/operations/objectif-final-plateforme" element={<U name="Opérations"><ObjectifFinalPlateforme /></U>} />
            <Route path="/operations/programme-entreprises-strategiques" element={<U name="Opérations"><ProgrammeEntreprisesStrategiques /></U>} />
            <Route path="/operations/programme-premium" element={<U name="Opérations"><ProgrammePremium /></U>} />
            <Route path="/operations/tableau-bord-fondateur" element={<U name="Opérations"><TableauBordFondateur /></U>} />
            {/* Automatisations */}
            <Route path="/automatisations/centre-alertes-strategiques" element={<U name="Automatisations"><CentreAlertesStrategiques /></U>} />
            <Route path="/automatisations/centre-auto-marketing" element={<U name="Automatisations"><CentreAutoMarketing /></U>} />
            <Route path="/automatisations/centre-croissance" element={<U name="Automatisations"><CentreCroissance /></U>} />
            <Route path="/automatisations/centre-k-p-i" element={<U name="Automatisations"><CentreKPI /></U>} />
            <Route path="/automatisations/centre-objectifs-entreprise" element={<U name="Automatisations"><CentreObjectifsEntreprise /></U>} />
            <Route path="/automatisations/centre-performance-i-a" element={<U name="Automatisations"><CentrePerformanceIA /></U>} />
            <Route path="/automatisations/escalades-automatiques" element={<U name="Automatisations"><EscaladesAutomatiques /></U>} />
            <Route path="/automatisations/files-attente" element={<U name="Automatisations"><FilesAttente /></U>} />
            <Route path="/automatisations/i-a-affectation" element={<U name="Automatisations"><IAAffectation /></U>} />
            <Route path="/automatisations/i-a-controle" element={<U name="Automatisations"><IAControle /></U>} />
            <Route path="/automatisations/i-a-priorisation" element={<U name="Automatisations"><IAPriorisation /></U>} />
            <Route path="/automatisations/moteur-taches" element={<U name="Automatisations"><MoteurTaches /></U>} />
            <Route path="/automatisations/moteur-workflow" element={<U name="Automatisations"><MoteurWorkflow /></U>} />
            <Route path="/automatisations/objectif-automatisations" element={<U name="Automatisations"><ObjectifAutomatisations /></U>} />
            <Route path="/automatisations/workflows-personnalises" element={<U name="Automatisations"><WorkflowsPersonnalises /></U>} />
            {/* Expansion */}
            <Route path="/expansion/centre-international" element={<U name="Expansion"><CentreInternational /></U>} />
            <Route path="/expansion/multi-devises-global" element={<U name="Expansion"><MultiDevisesGlobal /></U>} />
            <Route path="/expansion/multi-langues-global" element={<U name="Expansion"><MultiLanguesGlobal /></U>} />
            <Route path="/expansion/phase-afrique-centrale" element={<U name="Expansion"><PhaseAfriqueCentrale /></U>} />
            <Route path="/expansion/phase-afrique-est" element={<U name="Expansion"><PhaseAfriqueEst /></U>} />
            <Route path="/expansion/phase-afrique-nord" element={<U name="Expansion"><PhaseAfriqueNord /></U>} />
            <Route path="/expansion/phase-afrique-ouest" element={<U name="Expansion"><PhaseAfriqueOuest /></U>} />
            <Route path="/expansion/phase-amerique-latine" element={<U name="Expansion"><PhaseAmeriqueLatine /></U>} />
            <Route path="/expansion/phase-amerique-nord" element={<U name="Expansion"><PhaseAmeriqueNord /></U>} />
            <Route path="/expansion/phase-asie" element={<U name="Expansion"><PhaseAsie /></U>} />
            <Route path="/expansion/phase-europe" element={<U name="Expansion"><PhaseEurope /></U>} />
            <Route path="/expansion/phase-europe-franco" element={<U name="Expansion"><PhaseEuropeFranco /></U>} />
            <Route path="/expansion/phase-france" element={<U name="Expansion"><PhaseFrance /></U>} />
            <Route path="/expansion/phase-moyen-orient" element={<U name="Expansion"><PhaseMoyenOrient /></U>} />
            <Route path="/expansion/phase-oceanie" element={<U name="Expansion"><PhaseOceanie /></U>} />
            <Route path="/expansion/tableau-bord-mondial" element={<U name="Expansion"><TableauBordMondial /></U>} />
            <Route path="/expansion/vision-finale" element={<U name="Expansion"><VisionFinale /></U>} />
            {/* Conformité */}
            <Route path="/conformite/assurances-pays" element={<U name="Conformité"><AssurancesPays /></U>} />
            <Route path="/conformite/centre-pays" element={<U name="Conformité"><CentrePays /></U>} />
            <Route path="/conformite/contrats-adaptes" element={<U name="Conformité"><ContratsAdaptes /></U>} />
            <Route path="/conformite/devises-automatiques" element={<U name="Conformité"><DevisesAutomatiques /></U>} />
            <Route path="/conformite/documents-obligatoires-pays" element={<U name="Conformité"><DocumentsObligatoiresPays /></U>} />
            <Route path="/conformite/garage-pays" element={<U name="Conformité"><GaragePays /></U>} />
            <Route path="/conformite/i-a-juridique" element={<U name="Conformité"><IAJuridique /></U>} />
            <Route path="/conformite/immatriculations-pays" element={<U name="Conformité"><ImmatriculationsPays /></U>} />
            <Route path="/conformite/location-pays" element={<U name="Conformité"><LocationPays /></U>} />
            <Route path="/conformite/mises-a-jour-reglementaires" element={<U name="Conformité"><MisesAJourReglementaires /></U>} />
            <Route path="/conformite/moteur-regles-pays" element={<U name="Conformité"><MoteurReglesPays /></U>} />
            <Route path="/conformite/moyens-paiement-locaux" element={<U name="Conformité"><MoyensPaiementLocaux /></U>} />
            <Route path="/conformite/objectif-conformite" element={<U name="Conformité"><ObjectifConformite /></U>} />
            <Route path="/conformite/tableau-bord-international" element={<U name="Conformité"><TableauBordInternational /></U>} />
            <Route path="/conformite/taxes-automatiques" element={<U name="Conformité"><TaxesAutomatiques /></U>} />
            <Route path="/conformite/vente-pays" element={<U name="Conformité"><VentePays /></U>} />
            {/* Labs */}
            <Route path="/labs/academie-m-k-a-p-m-s" element={<U name="Labs"><AcademieMKAPMS /></U>} />
            <Route path="/labs/analyse-marche-mondiale" element={<U name="Labs"><AnalyseMarcheMondiale /></U>} />
            <Route path="/labs/analyse-trafic" element={<U name="Labs"><AnalyseTrafic /></U>} />
            <Route path="/labs/archives-historiques" element={<U name="Labs"><ArchivesHistoriques /></U>} />
            <Route path="/labs/assistant-fondateur" element={<U name="Labs"><AssistantFondateur /></U>} />
            <Route path="/labs/audit-qualite" element={<U name="Labs"><AuditQualite /></U>} />
            <Route path="/labs/automatisation-complete" element={<U name="Labs"><AutomatisationComplete /></U>} />
            <Route path="/labs/benchmark-flottes" element={<U name="Labs"><BenchmarkFlottes /></U>} />
            <Route path="/labs/bibliotheque-automobile" element={<U name="Labs"><BibliothequeAutomobile /></U>} />
            <Route path="/labs/bibliotheque-reparations" element={<U name="Labs"><BibliothequeReparations /></U>} />
            <Route path="/labs/brevets" element={<U name="Labs"><Brevets /></U>} />
            <Route path="/labs/campus-automobile" element={<U name="Labs"><CampusAutomobile /></U>} />
            <Route path="/labs/carnet-entretien-auto" element={<U name="Labs"><CarnetEntretienAuto /></U>} />
            <Route path="/labs/cartographie-mondiale" element={<U name="Labs"><CartographieMondiale /></U>} />
            <Route path="/labs/centre-acquisitions-labs" element={<U name="Labs"><CentreAcquisitionsLabs /></U>} />
            <Route path="/labs/centre-appels-offres" element={<U name="Labs"><CentreAppelsOffres /></U>} />
            <Route path="/labs/centre-coordination-mondial" element={<U name="Labs"><CentreCoordinationMondial /></U>} />
            <Route path="/labs/centre-decisions-strategiques" element={<U name="Labs"><CentreDecisionsStrategiques /></U>} />
            <Route path="/labs/centre-documentation" element={<U name="Labs"><CentreDocumentation /></U>} />
            <Route path="/labs/centre-donnees-mondiales" element={<U name="Labs"><CentreDonneesMondiales /></U>} />
            <Route path="/labs/centre-expansion-auto" element={<U name="Labs"><CentreExpansionAuto /></U>} />
            <Route path="/labs/centre-expansion-automatique2" element={<U name="Labs"><CentreExpansionAutomatique2 /></U>} />
            <Route path="/labs/centre-export-auto" element={<U name="Labs"><CentreExportAuto /></U>} />
            <Route path="/labs/centre-formation-afrique" element={<U name="Labs"><CentreFormationAfrique /></U>} />
            <Route path="/labs/centre-innovation" element={<U name="Labs"><CentreInnovation /></U>} />
            <Route path="/labs/centre-intelligence-marche" element={<U name="Labs"><CentreIntelligenceMarche /></U>} />
            <Route path="/labs/centre-investissements-labs" element={<U name="Labs"><CentreInvestissementsLabs /></U>} />
            <Route path="/labs/centre-opportunites-mondiales" element={<U name="Labs"><CentreOpportunitesMondiales /></U>} />
            <Route path="/labs/centre-recherche-auto" element={<U name="Labs"><CentreRechercheAuto /></U>} />
            <Route path="/labs/centre-recherche-m-k-a-p-m-s" element={<U name="Labs"><CentreRechercheMKAPMS /></U>} />
            <Route path="/labs/centre-strategie-groupe" element={<U name="Labs"><CentreStrategieGroupe /></U>} />
            <Route path="/labs/centre-traduction" element={<U name="Labs"><CentreTraduction /></U>} />
            <Route path="/labs/centres-mobilite-urbaine" element={<U name="Labs"><CentresMobiliteUrbaine /></U>} />
            <Route path="/labs/centres-reconditionnement" element={<U name="Labs"><CentresReconditionnement /></U>} />
            <Route path="/labs/centres-reconditionnement2" element={<U name="Labs"><CentresReconditionnement2 /></U>} />
            <Route path="/labs/centres-techniques" element={<U name="Labs"><CentresTechniques /></U>} />
            <Route path="/labs/certification-occasion" element={<U name="Labs"><CertificationOccasion /></U>} />
            <Route path="/labs/certification-vehicule" element={<U name="Labs"><CertificationVehicule /></U>} />
            <Route path="/labs/coffrefort-international" element={<U name="Labs"><CoffrefortInternational /></U>} />
            <Route path="/labs/conferences-internationales" element={<U name="Labs"><ConferencesInternationales /></U>} />
            <Route path="/labs/controle-distance-flottes" element={<U name="Labs"><ControleDistanceFlottes /></U>} />
            <Route path="/labs/controle-production" element={<U name="Labs"><ControleProduction /></U>} />
            <Route path="/labs/corridors-logistiques" element={<U name="Labs"><CorridorsLogistiques /></U>} />
            <Route path="/labs/data-cloud-auto" element={<U name="Labs"><DataCloudAuto /></U>} />
            <Route path="/labs/encyclopedie-automobile" element={<U name="Labs"><EncyclopedieAutomobile /></U>} />
            <Route path="/labs/energy-afrique" element={<U name="Labs"><EnergyAfrique /></U>} />
            <Route path="/labs/energy-batteries" element={<U name="Labs"><EnergyBatteries /></U>} />
            <Route path="/labs/energy-recharge" element={<U name="Labs"><EnergyRecharge /></U>} />
            <Route path="/labs/expansion-mondiale" element={<U name="Labs"><ExpansionMondiale /></U>} />
            <Route path="/labs/filiales" element={<U name="Labs"><Filiales /></U>} />
            <Route path="/labs/fleet-network-mondial" element={<U name="Labs"><FleetNetworkMondial /></U>} />
            <Route path="/labs/fondation-formation" element={<U name="Labs"><FondationFormation /></U>} />
            <Route path="/labs/fondation-mobilite" element={<U name="Labs"><FondationMobilite /></U>} />
            <Route path="/labs/fonds-developpement" element={<U name="Labs"><FondsDeveloppement /></U>} />
            <Route path="/labs/fonds-developpement2" element={<U name="Labs"><FondsDeveloppement2 /></U>} />
            <Route path="/labs/fonds-expansion-afrique" element={<U name="Labs"><FondsExpansionAfrique /></U>} />
            <Route path="/labs/fonds-innovation" element={<U name="Labs"><FondsInnovation /></U>} />
            <Route path="/labs/formations-certifiantes" element={<U name="Labs"><FormationsCertifiantes /></U>} />
            <Route path="/labs/franchise-m-k-a-p-m-s" element={<U name="Labs"><FranchiseMKAPMS /></U>} />
            <Route path="/labs/franchises-global" element={<U name="Labs"><FranchisesGlobal /></U>} />
            <Route path="/labs/future2050" element={<U name="Labs"><Future2050 /></U>} />
            <Route path="/labs/gestion-entrepots" element={<U name="Labs"><GestionEntrepots /></U>} />
            <Route path="/labs/gestion-flotte-intelligente" element={<U name="Labs"><GestionFlotteIntelligente /></U>} />
            <Route path="/labs/gestion-flottes-connectees" element={<U name="Labs"><GestionFlottesConnectees /></U>} />
            <Route path="/labs/gestion-groupe" element={<U name="Labs"><GestionGroupe /></U>} />
            <Route path="/labs/gestion-marques" element={<U name="Labs"><GestionMarques /></U>} />
            <Route path="/labs/gestion-mobilite-entreprises" element={<U name="Labs"><GestionMobiliteEntreprises /></U>} />
            <Route path="/labs/global-standards" element={<U name="Labs"><GlobalStandards /></U>} />
            <Route path="/labs/hub-afrique" element={<U name="Labs"><HubAfrique /></U>} />
            <Route path="/labs/hubs-regionaux" element={<U name="Labs"><HubsRegionaux /></U>} />
            <Route path="/labs/i-a-automobile" element={<U name="Labs"><IAAutomobile /></U>} />
            <Route path="/labs/i-a-avancee" element={<U name="Labs"><IAAvancee /></U>} />
            <Route path="/labs/i-a-conseiller-achat" element={<U name="Labs"><IAConseillerAchat /></U>} />
            <Route path="/labs/i-a-conseiller-garage" element={<U name="Labs"><IAConseillerGarage /></U>} />
            <Route path="/labs/i-a-conseiller-vente" element={<U name="Labs"><IAConseillerVente /></U>} />
            <Route path="/labs/i-a-operationnelle-mondiale" element={<U name="Labs"><IAOperationnelleMondiale /></U>} />
            <Route path="/labs/identite-numerique-entreprise" element={<U name="Labs"><IdentiteNumeriqueEntreprise /></U>} />
            <Route path="/labs/identite-numerique-vehicule" element={<U name="Labs"><IdentiteNumeriqueVehicule /></U>} />
            <Route path="/labs/identite-numerique-vehicule2" element={<U name="Labs"><IdentiteNumeriqueVehicule2 /></U>} />
            <Route path="/labs/inspection-distance" element={<U name="Labs"><InspectionDistance /></U>} />
            <Route path="/labs/institut-formation" element={<U name="Labs"><InstitutFormation /></U>} />
            <Route path="/labs/jumeau-numerique" element={<U name="Labs"><JumeauNumerique /></U>} />
            <Route path="/labs/jumeau-numerique-mondial" element={<U name="Labs"><JumeauNumeriqueMondial /></U>} />
            <Route path="/labs/jumeaux-numeriques" element={<U name="Labs"><JumeauxNumeriques /></U>} />
            <Route path="/labs/label-certifie" element={<U name="Labs"><LabelCertifie /></U>} />
            <Route path="/labs/label-mondial" element={<U name="Labs"><LabelMondial /></U>} />
            <Route path="/labs/laboratoires-futurs" element={<U name="Labs"><LaboratoiresFuturs /></U>} />
            <Route path="/labs/licences-m-k-a-p-m-s" element={<U name="Labs"><LicencesMKAPMS /></U>} />
            <Route path="/labs/logistiques-centres" element={<U name="Labs"><LogistiquesCentres /></U>} />
            <Route path="/labs/m-k-a-p-m-s-world" element={<U name="Labs"><MKAPMSWorld /></U>} />
            <Route path="/labs/maintenance-predictive" element={<U name="Labs"><MaintenancePredictive /></U>} />
            <Route path="/labs/mobilite-complete" element={<U name="Labs"><MobiliteComplete /></U>} />
            <Route path="/labs/musee-numerique" element={<U name="Labs"><MuseeNumerique /></U>} />
            <Route path="/labs/norme-m-k-a-p-m-s" element={<U name="Labs"><NormeMKAPMS /></U>} />
            <Route path="/labs/objectif-ultime" element={<U name="Labs"><ObjectifUltime /></U>} />
            <Route path="/labs/observatoire-automobile" element={<U name="Labs"><ObservatoireAutomobile /></U>} />
            <Route path="/labs/observatoire-mondial" element={<U name="Labs"><ObservatoireMondial /></U>} />
            <Route path="/labs/parc-industriel" element={<U name="Labs"><ParcIndustriel /></U>} />
            <Route path="/labs/passeport-numerique-vehicule" element={<U name="Labs"><PasseportNumeriqueVehicule /></U>} />
            <Route path="/labs/place-marche-b2-b" element={<U name="Labs"><PlaceMarcheB2B /></U>} />
            <Route path="/labs/programme-innovation" element={<U name="Labs"><ProgrammeInnovation /></U>} />
            <Route path="/labs/programme-jeunes-entrepreneurs" element={<U name="Labs"><ProgrammeJeunesEntrepreneurs /></U>} />
            <Route path="/labs/programmes-strategiques" element={<U name="Labs"><ProgrammesStrategiques /></U>} />
            <Route path="/labs/reseau-alliances" element={<U name="Labs"><ReseauAlliances /></U>} />
            <Route path="/labs/reseau-assistance247" element={<U name="Labs"><ReseauAssistance247 /></U>} />
            <Route path="/labs/reseau-centres-formation" element={<U name="Labs"><ReseauCentresFormation /></U>} />
            <Route path="/labs/reseau-convoyeurs" element={<U name="Labs"><ReseauConvoyeurs /></U>} />
            <Route path="/labs/reseau-depannage-afrique" element={<U name="Labs"><ReseauDepannageAfrique /></U>} />
            <Route path="/labs/reseau-depanneurs" element={<U name="Labs"><ReseauDepanneurs /></U>} />
            <Route path="/labs/reseau-distribution" element={<U name="Labs"><ReseauDistribution /></U>} />
            <Route path="/labs/reseau-experts" element={<U name="Labs"><ReseauExperts /></U>} />
            <Route path="/labs/reseau-experts-global" element={<U name="Labs"><ReseauExpertsGlobal /></U>} />
            <Route path="/labs/reseau-fournisseurs-global" element={<U name="Labs"><ReseauFournisseursGlobal /></U>} />
            <Route path="/labs/reseau-garages-afrique" element={<U name="Labs"><ReseauGaragesAfrique /></U>} />
            <Route path="/labs/reseau-industriel" element={<U name="Labs"><ReseauIndustriel /></U>} />
            <Route path="/labs/reseau-mobilite-mondiale" element={<U name="Labs"><ReseauMobiliteMondiale /></U>} />
            <Route path="/labs/reseau-mondial-complet" element={<U name="Labs"><ReseauMondialComplet /></U>} />
            <Route path="/labs/reseau-mondial-partenaires" element={<U name="Labs"><ReseauMondialPartenaires /></U>} />
            <Route path="/labs/reseau-mondial-services" element={<U name="Labs"><ReseauMondialServices /></U>} />
            <Route path="/labs/reseau-pieces-afrique" element={<U name="Labs"><ReseauPiecesAfrique /></U>} />
            <Route path="/labs/reseau-transport" element={<U name="Labs"><ReseauTransport /></U>} />
            <Route path="/labs/reseau-transport-marchandises" element={<U name="Labs"><ReseauTransportMarchandises /></U>} />
            <Route path="/labs/reseau-transport-personnes" element={<U name="Labs"><ReseauTransportPersonnes /></U>} />
            <Route path="/labs/reseau-usines" element={<U name="Labs"><ReseauUsines /></U>} />
            <Route path="/labs/signature-universelle" element={<U name="Labs"><SignatureUniverselle /></U>} />
            <Route path="/labs/smart-vehicles" element={<U name="Labs"><SmartVehicles /></U>} />
            <Route path="/labs/stationnement-intelligent" element={<U name="Labs"><StationnementIntelligent /></U>} />
            <Route path="/labs/systemes-proprietaires" element={<U name="Labs"><SystemesProprietaires /></U>} />
            <Route path="/labs/telematique" element={<U name="Labs"><Telematique /></U>} />
            <Route path="/labs/tests-pilotes" element={<U name="Labs"><TestsPilotes /></U>} />
            <Route path="/labs/vehicules-connectes" element={<U name="Labs"><VehiculesConnectes /></U>} />
            <Route path="/labs/vision-finale-m-k-a-p-m-s" element={<U name="Labs"><VisionFinaleMKAPMS /></U>} />
            <Route path="/labs/world-vision" element={<U name="Labs"><WorldVision /></U>} />
            <Route path="/labs/zones-techniques" element={<U name="Labs"><ZonesTechniques /></U>} />
            {/* Dépôt Annonce */}
            <Route path="/depot-annonce/analyse-i-a" element={<U name="Dépôt Annonce"><AnalyseIA /></U>} />
            <Route path="/depot-annonce/conseils-i-a" element={<U name="Dépôt Annonce"><ConseilsIA /></U>} />
            <Route path="/depot-annonce" element={<U name="Dépôt Annonce"><DepotAnnoncePortail /></U>} />
            <Route path="/depot-annonce/description-annonce" element={<U name="Dépôt Annonce"><DescriptionAnnonce /></U>} />
            <Route path="/depot-annonce/documents-annonce" element={<U name="Dépôt Annonce"><DocumentsAnnonce /></U>} />
            <Route path="/depot-annonce/expiration-annonce" element={<U name="Dépôt Annonce"><ExpirationAnnonce /></U>} />
            <Route path="/depot-annonce/identification-vehicule" element={<U name="Dépôt Annonce"><IdentificationVehicule /></U>} />
            <Route path="/depot-annonce/informations-principales" element={<U name="Dépôt Annonce"><InformationsPrincipales /></U>} />
            <Route path="/depot-annonce/modification-annonce" element={<U name="Dépôt Annonce"><ModificationAnnonce /></U>} />
            <Route path="/depot-annonce/objectif-depot-annonce" element={<U name="Dépôt Annonce"><ObjectifDepotAnnonce /></U>} />
            <Route path="/depot-annonce/options-annonce" element={<U name="Dépôt Annonce"><OptionsAnnonce /></U>} />
            <Route path="/depot-annonce/photos-vehicule" element={<U name="Dépôt Annonce"><PhotosVehicule /></U>} />
            <Route path="/depot-annonce/publication-annonce" element={<U name="Dépôt Annonce"><PublicationAnnonce /></U>} />
            <Route path="/depot-annonce/score-qualite-annonce" element={<U name="Dépôt Annonce"><ScoreQualiteAnnonce /></U>} />
            <Route path="/depot-annonce/tableau-bord-annonceur" element={<U name="Dépôt Annonce"><TableauBordAnnonceur /></U>} />
            <Route path="/depot-annonce/videos-annonce" element={<U name="Dépôt Annonce"><VideosAnnonce /></U>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}
