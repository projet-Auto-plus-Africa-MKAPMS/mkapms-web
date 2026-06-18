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
const CentreDocuments = lazy(() => import("./pages/CentreDocuments"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Messagerie = lazy(() => import("./pages/Messagerie"));
const ListeAttente = lazy(() => import("./pages/ListeAttente"));
const ReservationRecurrente = lazy(() => import("./pages/ReservationRecurrente"));
const Comparateur = lazy(() => import("./pages/Comparateur"));
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
const AdminEmployes = lazy(() => import("./pages/superadmin/AdminEmployes"));
const AdminFraude = lazy(() => import("./pages/superadmin/AdminFraude"));
const AdminJournal = lazy(() => import("./pages/superadmin/AdminJournal"));
const AdminLitiges = lazy(() => import("./pages/superadmin/AdminLitiges"));
const AdminModerationAnnonces = lazy(() => import("./pages/superadmin/AdminModerationAnnonces"));
const AdminModerationAvis = lazy(() => import("./pages/superadmin/AdminModerationAvis"));
const AdminObjectif = lazy(() => import("./pages/superadmin/AdminObjectif"));
const AdminPaiements = lazy(() => import("./pages/superadmin/AdminPaiements"));
const AdminSauvegardes = lazy(() => import("./pages/superadmin/AdminSauvegardes"));
const AdminSecurite = lazy(() => import("./pages/superadmin/AdminSecurite"));
const AdminStatistiques = lazy(() => import("./pages/superadmin/AdminStatistiques"));
const AdminSupport = lazy(() => import("./pages/superadmin/AdminSupport"));
const AdminUtilisateurs = lazy(() => import("./pages/superadmin/AdminUtilisateurs"));
const AdminValidationDocs = lazy(() => import("./pages/superadmin/AdminValidationDocs"));
const SuperAdminDashboard = lazy(() => import("./pages/superadmin/SuperAdminDashboard"));
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
const AnalyseMarcheMondiale = lazy(() => import("./pages/labs/AnalyseMarcheMondiale"));
const AutomatisationComplete = lazy(() => import("./pages/labs/AutomatisationComplete"));
const ControleDistanceFlottes = lazy(() => import("./pages/labs/ControleDistanceFlottes"));
const ExpansionMondiale = lazy(() => import("./pages/labs/ExpansionMondiale"));
const Filiales = lazy(() => import("./pages/labs/Filiales"));
const FranchisesGlobal = lazy(() => import("./pages/labs/FranchisesGlobal"));
const GestionFlotteIntelligente = lazy(() => import("./pages/labs/GestionFlotteIntelligente"));
const IAAvancee = lazy(() => import("./pages/labs/IAAvancee"));
const JumeauxNumeriques = lazy(() => import("./pages/labs/JumeauxNumeriques"));
const LicencesMKAPMS = lazy(() => import("./pages/labs/LicencesMKAPMS"));
const MaintenancePredictive = lazy(() => import("./pages/labs/MaintenancePredictive"));
const Telematique = lazy(() => import("./pages/labs/Telematique"));
const VehiculesConnectes = lazy(() => import("./pages/labs/VehiculesConnectes"));

// Garage
// Démarches
// Pièces
// Finance
// Super Admin
// Utilisateurs
// Notifications
// Partenaires
// Marketing
// Mobile
// IA
// International
// Investisseurs
// Entreprises
// Formations
// Recrutement
// Communauté
// Corporate
// Opérations
// Automatisations
// Expansion
// Conformité
// Labs
const AcademieMKAPMS = lazy(() => import("./pages/labs/AcademieMKAPMS"));
const CarnetEntretienAuto = lazy(() => import("./pages/labs/CarnetEntretienAuto"));
const CentreAcquisitionsLabs = lazy(() => import("./pages/labs/CentreAcquisitionsLabs"));
const CentreAppelsOffres = lazy(() => import("./pages/labs/CentreAppelsOffres"));
const CentreDonneesMondiales = lazy(() => import("./pages/labs/CentreDonneesMondiales"));
const CentreExpansionAuto = lazy(() => import("./pages/labs/CentreExpansionAuto"));
const CentreExportAuto = lazy(() => import("./pages/labs/CentreExportAuto"));
const CentreInnovation = lazy(() => import("./pages/labs/CentreInnovation"));
const CentreInvestissementsLabs = lazy(() => import("./pages/labs/CentreInvestissementsLabs"));
const CentreStrategieGroupe = lazy(() => import("./pages/labs/CentreStrategieGroupe"));
const FranchiseMKAPMS = lazy(() => import("./pages/labs/FranchiseMKAPMS"));
const GestionFlottesConnectees = lazy(() => import("./pages/labs/GestionFlottesConnectees"));
const GestionMarques = lazy(() => import("./pages/labs/GestionMarques"));
const HubAfrique = lazy(() => import("./pages/labs/HubAfrique"));
const IAAutomobile = lazy(() => import("./pages/labs/IAAutomobile"));
const IAConseillerAchat = lazy(() => import("./pages/labs/IAConseillerAchat"));
const IAConseillerGarage = lazy(() => import("./pages/labs/IAConseillerGarage"));
const IAConseillerVente = lazy(() => import("./pages/labs/IAConseillerVente"));
const LabelCertifie = lazy(() => import("./pages/labs/LabelCertifie"));
const PlaceMarcheB2B = lazy(() => import("./pages/labs/PlaceMarcheB2B"));
const ReseauConvoyeurs = lazy(() => import("./pages/labs/ReseauConvoyeurs"));
const ReseauDepannageAfrique = lazy(() => import("./pages/labs/ReseauDepannageAfrique"));
const ReseauDepanneurs = lazy(() => import("./pages/labs/ReseauDepanneurs"));
const ReseauGaragesAfrique = lazy(() => import("./pages/labs/ReseauGaragesAfrique"));
const ReseauPiecesAfrique = lazy(() => import("./pages/labs/ReseauPiecesAfrique"));
const ReseauTransport = lazy(() => import("./pages/labs/ReseauTransport"));
const VisionFinaleMKAPMS = lazy(() => import("./pages/labs/VisionFinaleMKAPMS"));

// Garage
const GarageAssistanceRoutiere = lazy(() => import("./pages/garage/AssistanceRoutiere"));
const GarageBoutiquePieces = lazy(() => import("./pages/garage/BoutiquePieces"));
const GarageCarrosserieGarage = lazy(() => import("./pages/garage/CarrosserieGarage"));
const GarageCentreLavage = lazy(() => import("./pages/garage/CentreLavage"));
const GarageCentreReclamations = lazy(() => import("./pages/garage/CentreReclamations"));
const GarageCommandePieces = lazy(() => import("./pages/garage/CommandePieces"));
const GarageCommandesAutomatiques = lazy(() => import("./pages/garage/CommandesAutomatiques"));
const GarageContratsFlottes = lazy(() => import("./pages/garage/ContratsFlottes"));
const GarageControleQualiteGarage = lazy(() => import("./pages/garage/ControleQualiteGarage"));
const GarageControleQualitePremium = lazy(() => import("./pages/garage/ControleQualitePremium"));
const GarageControleTechnique = lazy(() => import("./pages/garage/ControleTechnique"));
const GarageDemandeDevis = lazy(() => import("./pages/garage/DemandeDevis"));
const GarageDepannageAvance = lazy(() => import("./pages/garage/DepannageAvance"));
const GarageDepannageGarage = lazy(() => import("./pages/garage/DepannageGarage"));
const GarageDiagnosticAvance = lazy(() => import("./pages/garage/DiagnosticAvance"));
const GarageDiagnosticGarage = lazy(() => import("./pages/garage/DiagnosticGarage"));
const GarageDossiersFlottes = lazy(() => import("./pages/garage/DossiersFlottes"));
const GarageEntretiensPreventifs = lazy(() => import("./pages/garage/EntretiensPreventifs"));
const GarageEsthetiqueAuto = lazy(() => import("./pages/garage/EsthetiqueAuto"));
const GarageFichesTechniciens = lazy(() => import("./pages/garage/FichesTechniciens"));
const GarageFileAttenteAtelier = lazy(() => import("./pages/garage/FileAttenteAtelier"));
const GarageFlottesEntreprises = lazy(() => import("./pages/garage/FlottesEntreprises"));
const GarageFournisseursGarage = lazy(() => import("./pages/garage/FournisseursGarage"));
const GarageGarageGenerale = lazy(() => import("./pages/garage/GarageGenerale"));
const GarageGarageParticulier = lazy(() => import("./pages/garage/GarageParticulier"));
const GarageGarageProfessionnel = lazy(() => import("./pages/garage/GarageProfessionnel"));
const GarageGarantieTravaux = lazy(() => import("./pages/garage/GarantieTravaux"));
const GarageGestionMecaniciens = lazy(() => import("./pages/garage/GestionMecaniciens"));
const GarageGestionOutillage = lazy(() => import("./pages/garage/GestionOutillage"));
const GarageGestionPonts = lazy(() => import("./pages/garage/GestionPonts"));
const GarageHistoriqueGarage = lazy(() => import("./pages/garage/HistoriqueGarage"));
const GarageLavagePreparation = lazy(() => import("./pages/garage/LavagePreparation"));
const GarageMultiGarages = lazy(() => import("./pages/garage/MultiGarages"));
const GarageObjectifFinalGarage = lazy(() => import("./pages/garage/ObjectifFinalGarage"));
const GarageObjectifGarage = lazy(() => import("./pages/garage/ObjectifGarage"));
const GarageOrdreReparation = lazy(() => import("./pages/garage/OrdreReparation"));
const GaragePanierPieces = lazy(() => import("./pages/garage/PanierPieces"));
const GaragePhotosIntervention = lazy(() => import("./pages/garage/PhotosIntervention"));
const GaragePhotosTechniques = lazy(() => import("./pages/garage/PhotosTechniques"));
const GaragePlanningAtelier = lazy(() => import("./pages/garage/PlanningAtelier"));
const GaragePneumatiques = lazy(() => import("./pages/garage/Pneumatiques"));
const GaragePneumatiquesAvance = lazy(() => import("./pages/garage/PneumatiquesAvance"));
const GaragePreparationVenteVO = lazy(() => import("./pages/garage/PreparationVenteVO"));
const GaragePriseRendezVous = lazy(() => import("./pages/garage/PriseRendezVous"));
const GarageReceptionVehicule = lazy(() => import("./pages/garage/ReceptionVehicule"));
const GarageRecherchePieces = lazy(() => import("./pages/garage/RecherchePieces"));
const GarageRelanceClient = lazy(() => import("./pages/garage/RelanceClient"));
const GarageRentabiliteAtelier = lazy(() => import("./pages/garage/RentabiliteAtelier"));
const GarageReseauPartenaires = lazy(() => import("./pages/garage/ReseauPartenaires"));
const GarageReservationAtelier = lazy(() => import("./pages/garage/ReservationAtelier"));
const GarageRestitutionClient = lazy(() => import("./pages/garage/RestitutionClient"));
const GarageStatistiquesGarage = lazy(() => import("./pages/garage/StatistiquesGarage"));
const GarageStockPieces = lazy(() => import("./pages/garage/StockPieces"));
const GarageSuiviTempsReel = lazy(() => import("./pages/garage/SuiviTempsReel"));
const GarageTableauBordChefAtelier = lazy(() => import("./pages/garage/TableauBordChefAtelier"));
const GarageTempsIntervention = lazy(() => import("./pages/garage/TempsIntervention"));
const GarageTransfertDossiers = lazy(() => import("./pages/garage/TransfertDossiers"));
const GarageValidationClient = lazy(() => import("./pages/garage/ValidationClient"));
const GarageValidationInterne = lazy(() => import("./pages/garage/ValidationInterne"));
const GarageVehiculesAttente = lazy(() => import("./pages/garage/VehiculesAttente"));
// Démarches
const DemarchesAlertesDemarches = lazy(() => import("./pages/demarches/AlertesDemarches"));
const DemarchesArchivesAdministratives = lazy(() => import("./pages/demarches/ArchivesAdministratives"));
const DemarchesCarteGriseDemarche = lazy(() => import("./pages/demarches/CarteGriseDemarche"));
const DemarchesCentreDocumentsDemarches = lazy(() => import("./pages/demarches/CentreDocumentsDemarches"));
const DemarchesChangementAdresse = lazy(() => import("./pages/demarches/ChangementAdresse"));
const DemarchesChangementTitulaire = lazy(() => import("./pages/demarches/ChangementTitulaire"));
const DemarchesDeclarationCession = lazy(() => import("./pages/demarches/DeclarationCession"));
const DemarchesDemarchesGenerale = lazy(() => import("./pages/demarches/DemarchesGenerale"));
const DemarchesDuplicataDemarche = lazy(() => import("./pages/demarches/DuplicataDemarche"));
const DemarchesEspaceProDemarches = lazy(() => import("./pages/demarches/EspaceProDemarches"));
const DemarchesImmatriculationProvisoire = lazy(() => import("./pages/demarches/ImmatriculationProvisoire"));
const DemarchesImportationVehicule = lazy(() => import("./pages/demarches/ImportationVehicule"));
const DemarchesMessagerieDemarches = lazy(() => import("./pages/demarches/MessagerieDemarches"));
const DemarchesObjectifDemarches = lazy(() => import("./pages/demarches/ObjectifDemarches"));
const DemarchesPaiementDemarches = lazy(() => import("./pages/demarches/PaiementDemarches"));
const DemarchesPlaquesImmatriculation = lazy(() => import("./pages/demarches/PlaquesImmatriculation"));
const DemarchesSignaturesElectroniques = lazy(() => import("./pages/demarches/SignaturesElectroniques"));
const DemarchesStatistiquesDemarches = lazy(() => import("./pages/demarches/StatistiquesDemarches"));
const DemarchesSuccessionVehicule = lazy(() => import("./pages/demarches/SuccessionVehicule"));
const DemarchesSuiviDossier = lazy(() => import("./pages/demarches/SuiviDossier"));
const DemarchesVerificationIA = lazy(() => import("./pages/demarches/VerificationIA"));
const DemarchesWWGarage = lazy(() => import("./pages/demarches/WWGarage"));
// Pièces
const PiecesAbonnementsProPieces = lazy(() => import("./pages/pieces/AbonnementsProPieces"));
const PiecesAvisProduitsPieces = lazy(() => import("./pages/pieces/AvisProduitsPieces"));
const PiecesFournisseursPieces = lazy(() => import("./pages/pieces/FournisseursPieces"));
const PiecesLogistiquePieces = lazy(() => import("./pages/pieces/LogistiquePieces"));
const PiecesMontageGarage = lazy(() => import("./pages/pieces/MontageGarage"));
const PiecesObjectifPieces = lazy(() => import("./pages/pieces/ObjectifPieces"));
const PiecesPanierPiecesDetachees = lazy(() => import("./pages/pieces/PanierPiecesDetachees"));
const PiecesPiecesAccessoires = lazy(() => import("./pages/pieces/PiecesAccessoires"));
const PiecesPiecesBatteries = lazy(() => import("./pages/pieces/PiecesBatteries"));
const PiecesPiecesCarrosserie = lazy(() => import("./pages/pieces/PiecesCarrosserie"));
const PiecesPiecesEclairage = lazy(() => import("./pages/pieces/PiecesEclairage"));
const PiecesPiecesFreinage = lazy(() => import("./pages/pieces/PiecesFreinage"));
const PiecesPiecesGenerale = lazy(() => import("./pages/pieces/PiecesGenerale"));
const PiecesPiecesHuiles = lazy(() => import("./pages/pieces/PiecesHuiles"));
const PiecesPiecesMoteur = lazy(() => import("./pages/pieces/PiecesMoteur"));
const PiecesPiecesPneumatiques = lazy(() => import("./pages/pieces/PiecesPneumatiques"));
const PiecesPiecesSuspension = lazy(() => import("./pages/pieces/PiecesSuspension"));
const PiecesRechercheIntelligentePieces = lazy(() => import("./pages/pieces/RechercheIntelligentePieces"));
const PiecesRetoursPieces = lazy(() => import("./pages/pieces/RetoursPieces"));
const PiecesStatistiquesPieces = lazy(() => import("./pages/pieces/StatistiquesPieces"));
const PiecesVendeursPieces = lazy(() => import("./pages/pieces/VendeursPieces"));
const PiecesVerificationCompatibilite = lazy(() => import("./pages/pieces/VerificationCompatibilite"));
// Finance
const FinanceAcompteFinance = lazy(() => import("./pages/finance/AcompteFinance"));
const FinanceAlertesPaiements = lazy(() => import("./pages/finance/AlertesPaiements"));
const FinanceCentreEcheancier = lazy(() => import("./pages/finance/CentreEcheancier"));
const FinanceCentreFactures = lazy(() => import("./pages/finance/CentreFactures"));
const FinanceContratsFinanciers = lazy(() => import("./pages/finance/ContratsFinanciers"));
const FinanceDepotGarantieFinance = lazy(() => import("./pages/finance/DepotGarantieFinance"));
const FinanceFinanceGenerale = lazy(() => import("./pages/finance/FinanceGenerale"));
const FinanceGarantieSecurite = lazy(() => import("./pages/finance/GarantieSecurite"));
const FinanceLOAFinance = lazy(() => import("./pages/finance/LOAFinance"));
const FinanceObjectifFinance = lazy(() => import("./pages/finance/ObjectifFinance"));
const FinancePaiementComptant = lazy(() => import("./pages/finance/PaiementComptant"));
const FinancePaiementFractionne = lazy(() => import("./pages/finance/PaiementFractionne"));
const FinancePaiementsProfessionnels = lazy(() => import("./pages/finance/PaiementsProfessionnels"));
const FinanceRemboursementsFinance = lazy(() => import("./pages/finance/RemboursementsFinance"));
const FinanceTableauBordFinance = lazy(() => import("./pages/finance/TableauBordFinance"));
// Super Admin
const SuperadminAdminAbonnements = lazy(() => import("./pages/superadmin/AdminAbonnements"));
const SuperadminAdminBadges = lazy(() => import("./pages/superadmin/AdminBadges"));
const SuperadminAdminCarteMoniale = lazy(() => import("./pages/superadmin/AdminCarteMoniale"));
const SuperadminAdminCommissions = lazy(() => import("./pages/superadmin/AdminCommissions"));
const SuperadminAdminComptesPro = lazy(() => import("./pages/superadmin/AdminComptesPro"));
const SuperadminAdminEmployes = lazy(() => import("./pages/superadmin/AdminEmployes"));
const SuperadminAdminFraude = lazy(() => import("./pages/superadmin/AdminFraude"));
const SuperadminAdminJournal = lazy(() => import("./pages/superadmin/AdminJournal"));
const SuperadminAdminLitiges = lazy(() => import("./pages/superadmin/AdminLitiges"));
const SuperadminAdminModerationAnnonces = lazy(() => import("./pages/superadmin/AdminModerationAnnonces"));
const SuperadminAdminModerationAvis = lazy(() => import("./pages/superadmin/AdminModerationAvis"));
const SuperadminAdminObjectif = lazy(() => import("./pages/superadmin/AdminObjectif"));
const SuperadminAdminPaiements = lazy(() => import("./pages/superadmin/AdminPaiements"));
const SuperadminAdminSauvegardes = lazy(() => import("./pages/superadmin/AdminSauvegardes"));
const SuperadminAdminSecurite = lazy(() => import("./pages/superadmin/AdminSecurite"));
const SuperadminAdminStatistiques = lazy(() => import("./pages/superadmin/AdminStatistiques"));
const SuperadminAdminSupport = lazy(() => import("./pages/superadmin/AdminSupport"));
const SuperadminAdminUtilisateurs = lazy(() => import("./pages/superadmin/AdminUtilisateurs"));
const SuperadminAdminValidationDocs = lazy(() => import("./pages/superadmin/AdminValidationDocs"));
const SuperadminSuperAdminDashboard = lazy(() => import("./pages/superadmin/SuperAdminDashboard"));
// Utilisateurs
const UtilisateursAbonnementsUtilisateur = lazy(() => import("./pages/utilisateurs/AbonnementsUtilisateur"));
const UtilisateursCentreAlertesUtilisateur = lazy(() => import("./pages/utilisateurs/CentreAlertesUtilisateur"));
const UtilisateursCentreFavorisUtilisateur = lazy(() => import("./pages/utilisateurs/CentreFavorisUtilisateur"));
const UtilisateursCentreSupportUtilisateur = lazy(() => import("./pages/utilisateurs/CentreSupportUtilisateur"));
const UtilisateursCompteParticulier = lazy(() => import("./pages/utilisateurs/CompteParticulier"));
const UtilisateursCompteProUtilisateur = lazy(() => import("./pages/utilisateurs/CompteProUtilisateur"));
const UtilisateursDocumentsPersonnels = lazy(() => import("./pages/utilisateurs/DocumentsPersonnels"));
const UtilisateursEmployesUtilisateur = lazy(() => import("./pages/utilisateurs/EmployesUtilisateur"));
const UtilisateursFacturesUtilisateur = lazy(() => import("./pages/utilisateurs/FacturesUtilisateur"));
const UtilisateursHistoriqueAchats = lazy(() => import("./pages/utilisateurs/HistoriqueAchats"));
const UtilisateursHistoriqueDemarches = lazy(() => import("./pages/utilisateurs/HistoriqueDemarches"));
const UtilisateursHistoriqueDepannages = lazy(() => import("./pages/utilisateurs/HistoriqueDepannages"));
const UtilisateursHistoriqueEntretiens = lazy(() => import("./pages/utilisateurs/HistoriqueEntretiens"));
const UtilisateursHistoriqueLocations = lazy(() => import("./pages/utilisateurs/HistoriqueLocations"));
const UtilisateursMesVehicules = lazy(() => import("./pages/utilisateurs/MesVehicules"));
const UtilisateursMessagerieGlobale = lazy(() => import("./pages/utilisateurs/MessagerieGlobale"));
const UtilisateursObjectifUtilisateur = lazy(() => import("./pages/utilisateurs/ObjectifUtilisateur"));
const UtilisateursSecuriteUtilisateur = lazy(() => import("./pages/utilisateurs/SecuriteUtilisateur"));
const UtilisateursSuppressionCompte = lazy(() => import("./pages/utilisateurs/SuppressionCompte"));
const UtilisateursTableauBordPerso = lazy(() => import("./pages/utilisateurs/TableauBordPerso"));
// Notifications
const NotificationsAlertesUrgentes = lazy(() => import("./pages/notifications/AlertesUrgentes"));
const NotificationsAnnoncesImportantes = lazy(() => import("./pages/notifications/AnnoncesImportantes"));
const NotificationsCanauxCommunication = lazy(() => import("./pages/notifications/CanauxCommunication"));
const NotificationsCoffreFortNumerique = lazy(() => import("./pages/notifications/CoffreFortNumerique"));
const NotificationsDocumentsEntreprises = lazy(() => import("./pages/notifications/DocumentsEntreprises"));
const NotificationsDocumentsPersonnelsGlobal = lazy(() => import("./pages/notifications/DocumentsPersonnelsGlobal"));
const NotificationsDocumentsVehicules = lazy(() => import("./pages/notifications/DocumentsVehicules"));
const NotificationsHistoriqueNotifications = lazy(() => import("./pages/notifications/HistoriqueNotifications"));
const NotificationsNotificationsDemarches = lazy(() => import("./pages/notifications/NotificationsDemarches"));
const NotificationsNotificationsDepannage = lazy(() => import("./pages/notifications/NotificationsDepannage"));
const NotificationsNotificationsGarage = lazy(() => import("./pages/notifications/NotificationsGarage"));
const NotificationsNotificationsGenerale = lazy(() => import("./pages/notifications/NotificationsGenerale"));
const NotificationsNotificationsLocation = lazy(() => import("./pages/notifications/NotificationsLocation"));
const NotificationsNotificationsMessages = lazy(() => import("./pages/notifications/NotificationsMessages"));
const NotificationsNotificationsPaiements = lazy(() => import("./pages/notifications/NotificationsPaiements"));
const NotificationsNotificationsVente = lazy(() => import("./pages/notifications/NotificationsVente"));
const NotificationsObjectifNotifications = lazy(() => import("./pages/notifications/ObjectifNotifications"));
const NotificationsParametresNotifications = lazy(() => import("./pages/notifications/ParametresNotifications"));
const NotificationsRappelsAutomatiques = lazy(() => import("./pages/notifications/RappelsAutomatiques"));
const NotificationsSignaturesGlobales = lazy(() => import("./pages/notifications/SignaturesGlobales"));
// Partenaires
const PartenairesAttributionDemandes = lazy(() => import("./pages/partenaires/AttributionDemandes"));
const PartenairesCartePartenaires = lazy(() => import("./pages/partenaires/CartePartenaires"));
const PartenairesEvaluationPartenaires = lazy(() => import("./pages/partenaires/EvaluationPartenaires"));
const PartenairesFichePartenaire = lazy(() => import("./pages/partenaires/FichePartenaire"));
const PartenairesInscriptionPartenaire = lazy(() => import("./pages/partenaires/InscriptionPartenaire"));
const PartenairesNiveauxPartenaires = lazy(() => import("./pages/partenaires/NiveauxPartenaires"));
const PartenairesObjectifPartenaires = lazy(() => import("./pages/partenaires/ObjectifPartenaires"));
const PartenairesPartenairesGenerale = lazy(() => import("./pages/partenaires/PartenairesGenerale"));
const PartenairesStatistiquesPartenaires = lazy(() => import("./pages/partenaires/StatistiquesPartenaires"));
const PartenairesSuspensionPartenaires = lazy(() => import("./pages/partenaires/SuspensionPartenaires"));
// Marketing
const MarketingCampagnesAutomatiques = lazy(() => import("./pages/marketing/CampagnesAutomatiques"));
const MarketingCodesPromotionnels = lazy(() => import("./pages/marketing/CodesPromotionnels"));
const MarketingEspacesPublicitaires = lazy(() => import("./pages/marketing/EspacesPublicitaires"));
const MarketingProgrammeFidelite = lazy(() => import("./pages/marketing/ProgrammeFidelite"));
const MarketingProgrammeParrainage = lazy(() => import("./pages/marketing/ProgrammeParrainage"));
const MarketingPublicitesPro = lazy(() => import("./pages/marketing/PublicitesPro"));
// Mobile
const MobileAppAndroid = lazy(() => import("./pages/mobile/AppAndroid"));
const MobileAppIOS = lazy(() => import("./pages/mobile/AppIOS"));
const MobileModeHorsLigne = lazy(() => import("./pages/mobile/ModeHorsLigne"));
const MobileNotificationsPush = lazy(() => import("./pages/mobile/NotificationsPush"));
// IA
const IaIAAideDevis = lazy(() => import("./pages/ia/IAAideDevis"));
const IaIAAnalyseMarche = lazy(() => import("./pages/ia/IAAnalyseMarche"));
const IaIAAssistantClient = lazy(() => import("./pages/ia/IAAssistantClient"));
const IaIADetectionFraude = lazy(() => import("./pages/ia/IADetectionFraude"));
const IaIAEstimation = lazy(() => import("./pages/ia/IAEstimation"));
// International
const InternationalMultiDevises = lazy(() => import("./pages/international/MultiDevises"));
const InternationalMultiLangues = lazy(() => import("./pages/international/MultiLangues"));
const InternationalMultiPays = lazy(() => import("./pages/international/MultiPays"));
// Investisseurs
const InvestisseursEspaceInvestisseurs = lazy(() => import("./pages/investisseurs/EspaceInvestisseurs"));
const InvestisseursObjectifGlobal = lazy(() => import("./pages/investisseurs/ObjectifGlobal"));
// Entreprises
const EntreprisesCentreCarburant = lazy(() => import("./pages/entreprises/CentreCarburant"));
const EntreprisesCentreGeolocalisation = lazy(() => import("./pages/entreprises/CentreGeolocalisation"));
const EntreprisesCentreImmobilisation = lazy(() => import("./pages/entreprises/CentreImmobilisation"));
const EntreprisesCompteFlotte = lazy(() => import("./pages/entreprises/CompteFlotte"));
const EntreprisesContratsEntreprises = lazy(() => import("./pages/entreprises/ContratsEntreprises"));
const UEntreprisesGestionConducteurs = lazy(() => import("./pages/entreprises/GestionConducteurs"));
const EntreprisesGestionParc = lazy(() => import("./pages/entreprises/GestionParc"));
const EntreprisesHistoriqueFlotte = lazy(() => import("./pages/entreprises/HistoriqueFlotte"));
const EntreprisesObjectifFlottes = lazy(() => import("./pages/entreprises/ObjectifFlottes"));
const EntreprisesRapportsEntreprises = lazy(() => import("./pages/entreprises/RapportsEntreprises"));
// Formations
const FormationsCertificats = lazy(() => import("./pages/formations/Certificats"));
const FormationsFormationGarage = lazy(() => import("./pages/formations/FormationGarage"));
const FormationsFormationTaxi = lazy(() => import("./pages/formations/FormationTaxi"));
const FormationsFormationVTC = lazy(() => import("./pages/formations/FormationVTC"));
const FormationsFormationVente = lazy(() => import("./pages/formations/FormationVente"));
// Recrutement
const RecrutementDepotCV = lazy(() => import("./pages/recrutement/DepotCV"));
const RecrutementOffresEmploi = lazy(() => import("./pages/recrutement/OffresEmploi"));
const RecrutementRechercheTalents = lazy(() => import("./pages/recrutement/RechercheTalents"));
// Communauté
const CommunauteAvisConseils = lazy(() => import("./pages/communaute/AvisConseils"));
const CommunauteGuidesAchat = lazy(() => import("./pages/communaute/GuidesAchat"));
const CommunauteGuidesGarage = lazy(() => import("./pages/communaute/GuidesGarage"));
const CommunauteGuidesLocation = lazy(() => import("./pages/communaute/GuidesLocation"));
const CommunauteGuidesVente = lazy(() => import("./pages/communaute/GuidesVente"));
const CommunauteQuestionsReponses = lazy(() => import("./pages/communaute/QuestionsReponses"));
// Corporate
const CorporateAPropos = lazy(() => import("./pages/corporate/APropos"));
const CorporateContactEntreprise = lazy(() => import("./pages/corporate/ContactEntreprise"));
const CorporateNosPartenaires = lazy(() => import("./pages/corporate/NosPartenaires"));
const CorporateNosServices = lazy(() => import("./pages/corporate/NosServices"));
const CorporatePresseActualites = lazy(() => import("./pages/corporate/PresseActualites"));
const CorporateVisionMKAPMS = lazy(() => import("./pages/corporate/VisionMKAPMS"));
// Opérations
const OperationsAmbassadeurs = lazy(() => import("./pages/operations/Ambassadeurs"));
const OperationsCentreAcquisition = lazy(() => import("./pages/operations/CentreAcquisition"));
const OperationsCentreAudit = lazy(() => import("./pages/operations/CentreAudit"));
const OperationsCentreConformite = lazy(() => import("./pages/operations/CentreConformite"));
const OperationsCentreDonneesMarche = lazy(() => import("./pages/operations/CentreDonneesMarche"));
const OperationsCentreExpansion = lazy(() => import("./pages/operations/CentreExpansion"));
const OperationsCentreOpportunites = lazy(() => import("./pages/operations/CentreOpportunites"));
const OperationsCentrePrevisions = lazy(() => import("./pages/operations/CentrePrevisions"));
const OperationsCentreRisques = lazy(() => import("./pages/operations/CentreRisques"));
const OperationsCentreValidation = lazy(() => import("./pages/operations/CentreValidation"));
const OperationsControleQualiteGlobal = lazy(() => import("./pages/operations/ControleQualiteGlobal"));
const OperationsMKAPMSAfrique = lazy(() => import("./pages/operations/MKAPMSAfrique"));
const OperationsMKAPMSAssurance = lazy(() => import("./pages/operations/MKAPMSAssurance"));
const OperationsMKAPMSBanque = lazy(() => import("./pages/operations/MKAPMSBanque"));
const OperationsMKAPMSMobility = lazy(() => import("./pages/operations/MKAPMSMobility"));
const OperationsMKAPMSTransport = lazy(() => import("./pages/operations/MKAPMSTransport"));
const OperationsObjectifFinalPlateforme = lazy(() => import("./pages/operations/ObjectifFinalPlateforme"));
const OperationsProgrammeEntreprisesStrategiques = lazy(() => import("./pages/operations/ProgrammeEntreprisesStrategiques"));
const OperationsProgrammePremium = lazy(() => import("./pages/operations/ProgrammePremium"));
const OperationsTableauBordFondateur = lazy(() => import("./pages/operations/TableauBordFondateur"));
// Automatisations
const AutomatisationsCentreAlertesStrategiques = lazy(() => import("./pages/automatisations/CentreAlertesStrategiques"));
const AutomatisationsCentreAutoMarketing = lazy(() => import("./pages/automatisations/CentreAutoMarketing"));
const AutomatisationsCentreCroissance = lazy(() => import("./pages/automatisations/CentreCroissance"));
const AutomatisationsCentreKPI = lazy(() => import("./pages/automatisations/CentreKPI"));
const AutomatisationsCentreObjectifsEntreprise = lazy(() => import("./pages/automatisations/CentreObjectifsEntreprise"));
const AutomatisationsCentrePerformanceIA = lazy(() => import("./pages/automatisations/CentrePerformanceIA"));
const AutomatisationsEscaladesAutomatiques = lazy(() => import("./pages/automatisations/EscaladesAutomatiques"));
const AutomatisationsFilesAttente = lazy(() => import("./pages/automatisations/FilesAttente"));
const AutomatisationsIAAffectation = lazy(() => import("./pages/automatisations/IAAffectation"));
const AutomatisationsIAControle = lazy(() => import("./pages/automatisations/IAControle"));
const AutomatisationsIAPriorisation = lazy(() => import("./pages/automatisations/IAPriorisation"));
const AutomatisationsMoteurTaches = lazy(() => import("./pages/automatisations/MoteurTaches"));
const AutomatisationsMoteurWorkflow = lazy(() => import("./pages/automatisations/MoteurWorkflow"));
const AutomatisationsObjectifAutomatisations = lazy(() => import("./pages/automatisations/ObjectifAutomatisations"));
const AutomatisationsWorkflowsPersonnalises = lazy(() => import("./pages/automatisations/WorkflowsPersonnalises"));
// Expansion
const ExpansionCentreInternational = lazy(() => import("./pages/expansion/CentreInternational"));
const ExpansionMultiDevisesGlobal = lazy(() => import("./pages/expansion/MultiDevisesGlobal"));
const ExpansionMultiLanguesGlobal = lazy(() => import("./pages/expansion/MultiLanguesGlobal"));
const ExpansionPhaseAfriqueCentrale = lazy(() => import("./pages/expansion/PhaseAfriqueCentrale"));
const ExpansionPhaseAfriqueEst = lazy(() => import("./pages/expansion/PhaseAfriqueEst"));
const ExpansionPhaseAfriqueNord = lazy(() => import("./pages/expansion/PhaseAfriqueNord"));
const ExpansionPhaseAfriqueOuest = lazy(() => import("./pages/expansion/PhaseAfriqueOuest"));
const ExpansionPhaseAmeriqueLatine = lazy(() => import("./pages/expansion/PhaseAmeriqueLatine"));
const ExpansionPhaseAmeriqueNord = lazy(() => import("./pages/expansion/PhaseAmeriqueNord"));
const ExpansionPhaseAsie = lazy(() => import("./pages/expansion/PhaseAsie"));
const ExpansionPhaseEurope = lazy(() => import("./pages/expansion/PhaseEurope"));
const ExpansionPhaseEuropeFranco = lazy(() => import("./pages/expansion/PhaseEuropeFranco"));
const ExpansionPhaseFrance = lazy(() => import("./pages/expansion/PhaseFrance"));
const ExpansionPhaseMoyenOrient = lazy(() => import("./pages/expansion/PhaseMoyenOrient"));
const ExpansionPhaseOceanie = lazy(() => import("./pages/expansion/PhaseOceanie"));
const ExpansionTableauBordMondial = lazy(() => import("./pages/expansion/TableauBordMondial"));
const ExpansionVisionFinale = lazy(() => import("./pages/expansion/VisionFinale"));
// Conformité
const ConformiteAssurancesPays = lazy(() => import("./pages/conformite/AssurancesPays"));
const ConformiteCentrePays = lazy(() => import("./pages/conformite/CentrePays"));
const ConformiteContratsAdaptes = lazy(() => import("./pages/conformite/ContratsAdaptes"));
const ConformiteDevisesAutomatiques = lazy(() => import("./pages/conformite/DevisesAutomatiques"));
const ConformiteDocumentsObligatoiresPays = lazy(() => import("./pages/conformite/DocumentsObligatoiresPays"));
const ConformiteGaragePays = lazy(() => import("./pages/conformite/GaragePays"));
const ConformiteIAJuridique = lazy(() => import("./pages/conformite/IAJuridique"));
const ConformiteImmatriculationsPays = lazy(() => import("./pages/conformite/ImmatriculationsPays"));
const ConformiteLocationPays = lazy(() => import("./pages/conformite/LocationPays"));
const ConformiteMisesAJourReglementaires = lazy(() => import("./pages/conformite/MisesAJourReglementaires"));
const ConformiteMoteurReglesPays = lazy(() => import("./pages/conformite/MoteurReglesPays"));
const ConformiteMoyensPaiementLocaux = lazy(() => import("./pages/conformite/MoyensPaiementLocaux"));
const ConformiteObjectifConformite = lazy(() => import("./pages/conformite/ObjectifConformite"));
const ConformiteTableauBordInternational = lazy(() => import("./pages/conformite/TableauBordInternational"));
const ConformiteTaxesAutomatiques = lazy(() => import("./pages/conformite/TaxesAutomatiques"));
const ConformiteVentePays = lazy(() => import("./pages/conformite/VentePays"));
// Labs
const LabsAcademieMKAPMS = lazy(() => import("./pages/labs/AcademieMKAPMS"));
const LabsAnalyseMarcheMondiale = lazy(() => import("./pages/labs/AnalyseMarcheMondiale"));
const LabsAutomatisationComplete = lazy(() => import("./pages/labs/AutomatisationComplete"));
const BenchmarkFlottes = lazy(() => import("./pages/labs/BenchmarkFlottes"));
const LabsCarnetEntretienAuto = lazy(() => import("./pages/labs/CarnetEntretienAuto"));
const LabsCentreAcquisitionsLabs = lazy(() => import("./pages/labs/CentreAcquisitionsLabs"));
const LabsCentreAppelsOffres = lazy(() => import("./pages/labs/CentreAppelsOffres"));
const CentreDecisionsStrategiques = lazy(() => import("./pages/labs/CentreDecisionsStrategiques"));
const LabsCentreDonneesMondiales = lazy(() => import("./pages/labs/CentreDonneesMondiales"));
const LabsCentreExpansionAuto = lazy(() => import("./pages/labs/CentreExpansionAuto"));
const LabsCentreExportAuto = lazy(() => import("./pages/labs/CentreExportAuto"));
const LabsCentreInnovation = lazy(() => import("./pages/labs/CentreInnovation"));
const LabsCentreInvestissementsLabs = lazy(() => import("./pages/labs/CentreInvestissementsLabs"));
const CentreRechercheMKAPMS = lazy(() => import("./pages/labs/CentreRechercheMKAPMS"));
const LabsCentreStrategieGroupe = lazy(() => import("./pages/labs/CentreStrategieGroupe"));
const CertificationVehicule = lazy(() => import("./pages/labs/CertificationVehicule"));
const CoffrefortInternational = lazy(() => import("./pages/labs/CoffrefortInternational"));
const LabsControleDistanceFlottes = lazy(() => import("./pages/labs/ControleDistanceFlottes"));
const ControleProduction = lazy(() => import("./pages/labs/ControleProduction"));
const DataCloudAuto = lazy(() => import("./pages/labs/DataCloudAuto"));
const EnergyAfrique = lazy(() => import("./pages/labs/EnergyAfrique"));
const EnergyBatteries = lazy(() => import("./pages/labs/EnergyBatteries"));
const EnergyRecharge = lazy(() => import("./pages/labs/EnergyRecharge"));
const LabsExpansionMondiale = lazy(() => import("./pages/labs/ExpansionMondiale"));
const LabsFiliales = lazy(() => import("./pages/labs/Filiales"));
const FleetNetworkMondial = lazy(() => import("./pages/labs/FleetNetworkMondial"));
const LabsFranchiseMKAPMS = lazy(() => import("./pages/labs/FranchiseMKAPMS"));
const LabsFranchisesGlobal = lazy(() => import("./pages/labs/FranchisesGlobal"));
const GestionEntrepots = lazy(() => import("./pages/labs/GestionEntrepots"));
const LabsGestionFlotteIntelligente = lazy(() => import("./pages/labs/GestionFlotteIntelligente"));
const LabsGestionFlottesConnectees = lazy(() => import("./pages/labs/GestionFlottesConnectees"));
const GestionGroupe = lazy(() => import("./pages/labs/GestionGroupe"));
const LabsGestionMarques = lazy(() => import("./pages/labs/GestionMarques"));
const LabsHubAfrique = lazy(() => import("./pages/labs/HubAfrique"));
const LabsIAAutomobile = lazy(() => import("./pages/labs/IAAutomobile"));
const LabsIAAvancee = lazy(() => import("./pages/labs/IAAvancee"));
const LabsIAConseillerAchat = lazy(() => import("./pages/labs/IAConseillerAchat"));
const LabsIAConseillerGarage = lazy(() => import("./pages/labs/IAConseillerGarage"));
const LabsIAConseillerVente = lazy(() => import("./pages/labs/IAConseillerVente"));
const InspectionDistance = lazy(() => import("./pages/labs/InspectionDistance"));
const JumeauNumerique = lazy(() => import("./pages/labs/JumeauNumerique"));
const LabsJumeauxNumeriques = lazy(() => import("./pages/labs/JumeauxNumeriques"));
const LabsLabelCertifie = lazy(() => import("./pages/labs/LabelCertifie"));
const LabsLicencesMKAPMS = lazy(() => import("./pages/labs/LicencesMKAPMS"));
const LogistiquesCentres = lazy(() => import("./pages/labs/LogistiquesCentres"));
const LabsMaintenancePredictive = lazy(() => import("./pages/labs/MaintenancePredictive"));
const ObservatoireAutomobile = lazy(() => import("./pages/labs/ObservatoireAutomobile"));
const LabsPlaceMarcheB2B = lazy(() => import("./pages/labs/PlaceMarcheB2B"));
const LabsReseauConvoyeurs = lazy(() => import("./pages/labs/ReseauConvoyeurs"));
const LabsReseauDepannageAfrique = lazy(() => import("./pages/labs/ReseauDepannageAfrique"));
const LabsReseauDepanneurs = lazy(() => import("./pages/labs/ReseauDepanneurs"));
const ReseauDistribution = lazy(() => import("./pages/labs/ReseauDistribution"));
const ReseauFournisseursGlobal = lazy(() => import("./pages/labs/ReseauFournisseursGlobal"));
const LabsReseauGaragesAfrique = lazy(() => import("./pages/labs/ReseauGaragesAfrique"));
const ReseauMondialPartenaires = lazy(() => import("./pages/labs/ReseauMondialPartenaires"));
const ReseauMondialServices = lazy(() => import("./pages/labs/ReseauMondialServices"));
const LabsReseauPiecesAfrique = lazy(() => import("./pages/labs/ReseauPiecesAfrique"));
const LabsReseauTransport = lazy(() => import("./pages/labs/ReseauTransport"));
const ReseauUsines = lazy(() => import("./pages/labs/ReseauUsines"));
const SmartVehicles = lazy(() => import("./pages/labs/SmartVehicles"));
const LabsTelematique = lazy(() => import("./pages/labs/Telematique"));
const LabsVehiculesConnectes = lazy(() => import("./pages/labs/VehiculesConnectes"));
const LabsVisionFinaleMKAPMS = lazy(() => import("./pages/labs/VisionFinaleMKAPMS"));

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
  const { token, setUser } = useAuth();
  const me = trpc.auth.me.useQuery(undefined, { enabled: !!token });
  useEffect(() => {
    if (me.data) setUser(me.data as any);
  }, [me.data, setUser]);
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
            <Route path="/louer/utilitaires" element={<U name="Utilitaires"><Louer /></U>} />
            <Route path="/louer/camions" element={<U name="Camions"><Louer /></U>} />
            <Route path="/louer/minibus" element={<U name="Minibus"><Louer /></U>} />
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
            <Route path="/acheter/espace-pro" element={<U name="Espace Pro Vente"><EspaceProVente /></U>} />
            {/* Inscriptions */}
            <Route path="/inscription" element={<U name="Inscription"><InscriptionParticulier /></U>} />
            <Route path="/tableau-de-bord" element={<U name="Mon espace"><TableauBordParticulier /></U>} />
            <Route path="/acheter/inscription-pro" element={<U name="Inscription Pro"><InscriptionProVente /></U>} />
            <Route path="/vente/tableau-de-bord-pro" element={<U name="Dashboard Pro"><TableauBordProVente /></U>} />
            {/* Vente operations */}
            <Route path="/vente/stock" element={<U name="Stock VO"><GestionStockVO /></U>} />
            <Route path="/vente/dossier-vehicule" element={<U name="Dossier v\u00e9hicule"><DossierVehicule /></U>} />
            <Route path="/vente/workflow" element={<U name="Workflow VO"><WorkflowAchatVO /></U>} />
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
            <Route path="/compte/validation" element={<U name="Validation"><Validation /></U>} />
            <Route path="/compte/*" element={<U name="Mon compte"><Compte /></U>} />
            <Route path="/admin/*" element={<U name="Back-office"><Admin /></U>} />
            {/* Garage */}
            <Route path="/garage/assistance-routiere" element={<U name="Garage"><GarageAssistanceRoutiere /></U>} />
            <Route path="/garage/boutique-pieces" element={<U name="Garage"><GarageBoutiquePieces /></U>} />
            <Route path="/garage/carrosserie-garage" element={<U name="Garage"><GarageCarrosserieGarage /></U>} />
            <Route path="/garage/centre-lavage" element={<U name="Garage"><GarageCentreLavage /></U>} />
            <Route path="/garage/centre-reclamations" element={<U name="Garage"><GarageCentreReclamations /></U>} />
            <Route path="/garage/commande-pieces" element={<U name="Garage"><GarageCommandePieces /></U>} />
            <Route path="/garage/commandes-automatiques" element={<U name="Garage"><GarageCommandesAutomatiques /></U>} />
            <Route path="/garage/contrats-flottes" element={<U name="Garage"><GarageContratsFlottes /></U>} />
            <Route path="/garage/controle-qualite-garage" element={<U name="Garage"><GarageControleQualiteGarage /></U>} />
            <Route path="/garage/controle-qualite-premium" element={<U name="Garage"><GarageControleQualitePremium /></U>} />
            <Route path="/garage/controle-technique" element={<U name="Garage"><GarageControleTechnique /></U>} />
            <Route path="/garage/demande-devis" element={<U name="Garage"><GarageDemandeDevis /></U>} />
            <Route path="/garage/depannage-avance" element={<U name="Garage"><GarageDepannageAvance /></U>} />
            <Route path="/garage/depannage-garage" element={<U name="Garage"><GarageDepannageGarage /></U>} />
            <Route path="/garage/diagnostic-avance" element={<U name="Garage"><GarageDiagnosticAvance /></U>} />
            <Route path="/garage/diagnostic-garage" element={<U name="Garage"><GarageDiagnosticGarage /></U>} />
            <Route path="/garage/dossiers-flottes" element={<U name="Garage"><GarageDossiersFlottes /></U>} />
            <Route path="/garage/entretiens-preventifs" element={<U name="Garage"><GarageEntretiensPreventifs /></U>} />
            <Route path="/garage/esthetique-auto" element={<U name="Garage"><GarageEsthetiqueAuto /></U>} />
            <Route path="/garage/fiches-techniciens" element={<U name="Garage"><GarageFichesTechniciens /></U>} />
            <Route path="/garage/file-attente-atelier" element={<U name="Garage"><GarageFileAttenteAtelier /></U>} />
            <Route path="/garage/flottes-entreprises" element={<U name="Garage"><GarageFlottesEntreprises /></U>} />
            <Route path="/garage/fournisseurs-garage" element={<U name="Garage"><GarageFournisseursGarage /></U>} />
            <Route path="/garage" element={<U name="Garage"><GarageGarageGenerale /></U>} />
            <Route path="/garage/garage-particulier" element={<U name="Garage"><GarageGarageParticulier /></U>} />
            <Route path="/garage/garage-professionnel" element={<U name="Garage"><GarageGarageProfessionnel /></U>} />
            <Route path="/garage/garantie-travaux" element={<U name="Garage"><GarageGarantieTravaux /></U>} />
            <Route path="/garage/gestion-mecaniciens" element={<U name="Garage"><GarageGestionMecaniciens /></U>} />
            <Route path="/garage/gestion-outillage" element={<U name="Garage"><GarageGestionOutillage /></U>} />
            <Route path="/garage/gestion-ponts" element={<U name="Garage"><GarageGestionPonts /></U>} />
            <Route path="/garage/historique-garage" element={<U name="Garage"><GarageHistoriqueGarage /></U>} />
            <Route path="/garage/lavage-preparation" element={<U name="Garage"><GarageLavagePreparation /></U>} />
            <Route path="/garage/multi-garages" element={<U name="Garage"><GarageMultiGarages /></U>} />
            <Route path="/garage/objectif-final-garage" element={<U name="Garage"><GarageObjectifFinalGarage /></U>} />
            <Route path="/garage/objectif-garage" element={<U name="Garage"><GarageObjectifGarage /></U>} />
            <Route path="/garage/ordre-reparation" element={<U name="Garage"><GarageOrdreReparation /></U>} />
            <Route path="/garage/panier-pieces" element={<U name="Garage"><GaragePanierPieces /></U>} />
            <Route path="/garage/photos-intervention" element={<U name="Garage"><GaragePhotosIntervention /></U>} />
            <Route path="/garage/photos-techniques" element={<U name="Garage"><GaragePhotosTechniques /></U>} />
            <Route path="/garage/planning-atelier" element={<U name="Garage"><GaragePlanningAtelier /></U>} />
            <Route path="/garage/pneumatiques" element={<U name="Garage"><GaragePneumatiques /></U>} />
            <Route path="/garage/pneumatiques-avance" element={<U name="Garage"><GaragePneumatiquesAvance /></U>} />
            <Route path="/garage/preparation-vente-v-o" element={<U name="Garage"><GaragePreparationVenteVO /></U>} />
            <Route path="/garage/prise-rendez-vous" element={<U name="Garage"><GaragePriseRendezVous /></U>} />
            <Route path="/garage/reception-vehicule" element={<U name="Garage"><GarageReceptionVehicule /></U>} />
            <Route path="/garage/recherche-pieces" element={<U name="Garage"><GarageRecherchePieces /></U>} />
            <Route path="/garage/relance-client" element={<U name="Garage"><GarageRelanceClient /></U>} />
            <Route path="/garage/rentabilite-atelier" element={<U name="Garage"><GarageRentabiliteAtelier /></U>} />
            <Route path="/garage/reseau-partenaires" element={<U name="Garage"><GarageReseauPartenaires /></U>} />
            <Route path="/garage/reservation-atelier" element={<U name="Garage"><GarageReservationAtelier /></U>} />
            <Route path="/garage/restitution-client" element={<U name="Garage"><GarageRestitutionClient /></U>} />
            <Route path="/garage/statistiques-garage" element={<U name="Garage"><GarageStatistiquesGarage /></U>} />
            <Route path="/garage/stock-pieces" element={<U name="Garage"><GarageStockPieces /></U>} />
            <Route path="/garage/suivi-temps-reel" element={<U name="Garage"><GarageSuiviTempsReel /></U>} />
            <Route path="/garage/tableau-bord-chef-atelier" element={<U name="Garage"><GarageTableauBordChefAtelier /></U>} />
            <Route path="/garage/temps-intervention" element={<U name="Garage"><GarageTempsIntervention /></U>} />
            <Route path="/garage/transfert-dossiers" element={<U name="Garage"><GarageTransfertDossiers /></U>} />
            <Route path="/garage/validation-client" element={<U name="Garage"><GarageValidationClient /></U>} />
            <Route path="/garage/validation-interne" element={<U name="Garage"><GarageValidationInterne /></U>} />
            <Route path="/garage/vehicules-attente" element={<U name="Garage"><GarageVehiculesAttente /></U>} />
            {/* Démarches */}
            <Route path="/demarches/alertes-demarches" element={<U name="Démarches"><DemarchesAlertesDemarches /></U>} />
            <Route path="/demarches/archives-administratives" element={<U name="Démarches"><DemarchesArchivesAdministratives /></U>} />
            <Route path="/demarches/carte-grise-demarche" element={<U name="Démarches"><DemarchesCarteGriseDemarche /></U>} />
            <Route path="/demarches/centre-documents-demarches" element={<U name="Démarches"><DemarchesCentreDocumentsDemarches /></U>} />
            <Route path="/demarches/changement-adresse" element={<U name="Démarches"><DemarchesChangementAdresse /></U>} />
            <Route path="/demarches/changement-titulaire" element={<U name="Démarches"><DemarchesChangementTitulaire /></U>} />
            <Route path="/demarches/declaration-cession" element={<U name="Démarches"><DemarchesDeclarationCession /></U>} />
            <Route path="/demarches" element={<U name="Démarches"><DemarchesDemarchesGenerale /></U>} />
            <Route path="/demarches/duplicata-demarche" element={<U name="Démarches"><DemarchesDuplicataDemarche /></U>} />
            <Route path="/demarches/espace-pro-demarches" element={<U name="Démarches"><DemarchesEspaceProDemarches /></U>} />
            <Route path="/demarches/immatriculation-provisoire" element={<U name="Démarches"><DemarchesImmatriculationProvisoire /></U>} />
            <Route path="/demarches/importation-vehicule" element={<U name="Démarches"><DemarchesImportationVehicule /></U>} />
            <Route path="/demarches/messagerie-demarches" element={<U name="Démarches"><DemarchesMessagerieDemarches /></U>} />
            <Route path="/demarches/objectif-demarches" element={<U name="Démarches"><DemarchesObjectifDemarches /></U>} />
            <Route path="/demarches/paiement-demarches" element={<U name="Démarches"><DemarchesPaiementDemarches /></U>} />
            <Route path="/demarches/plaques-immatriculation" element={<U name="Démarches"><DemarchesPlaquesImmatriculation /></U>} />
            <Route path="/demarches/signatures-electroniques" element={<U name="Démarches"><DemarchesSignaturesElectroniques /></U>} />
            <Route path="/demarches/statistiques-demarches" element={<U name="Démarches"><DemarchesStatistiquesDemarches /></U>} />
            <Route path="/demarches/succession-vehicule" element={<U name="Démarches"><DemarchesSuccessionVehicule /></U>} />
            <Route path="/demarches/suivi-dossier" element={<U name="Démarches"><DemarchesSuiviDossier /></U>} />
            <Route path="/demarches/verification-i-a" element={<U name="Démarches"><DemarchesVerificationIA /></U>} />
            <Route path="/demarches/w-w-garage" element={<U name="Démarches"><DemarchesWWGarage /></U>} />
            {/* Pièces */}
            <Route path="/pieces/abonnements-pro-pieces" element={<U name="Pièces"><PiecesAbonnementsProPieces /></U>} />
            <Route path="/pieces/avis-produits-pieces" element={<U name="Pièces"><PiecesAvisProduitsPieces /></U>} />
            <Route path="/pieces/fournisseurs-pieces" element={<U name="Pièces"><PiecesFournisseursPieces /></U>} />
            <Route path="/pieces/logistique-pieces" element={<U name="Pièces"><PiecesLogistiquePieces /></U>} />
            <Route path="/pieces/montage-garage" element={<U name="Pièces"><PiecesMontageGarage /></U>} />
            <Route path="/pieces/objectif-pieces" element={<U name="Pièces"><PiecesObjectifPieces /></U>} />
            <Route path="/pieces/panier-pieces-detachees" element={<U name="Pièces"><PiecesPanierPiecesDetachees /></U>} />
            <Route path="/pieces/pieces-accessoires" element={<U name="Pièces"><PiecesPiecesAccessoires /></U>} />
            <Route path="/pieces/pieces-batteries" element={<U name="Pièces"><PiecesPiecesBatteries /></U>} />
            <Route path="/pieces/pieces-carrosserie" element={<U name="Pièces"><PiecesPiecesCarrosserie /></U>} />
            <Route path="/pieces/pieces-eclairage" element={<U name="Pièces"><PiecesPiecesEclairage /></U>} />
            <Route path="/pieces/pieces-freinage" element={<U name="Pièces"><PiecesPiecesFreinage /></U>} />
            <Route path="/pieces" element={<U name="Pièces"><PiecesPiecesGenerale /></U>} />
            <Route path="/pieces/pieces-huiles" element={<U name="Pièces"><PiecesPiecesHuiles /></U>} />
            <Route path="/pieces/pieces-moteur" element={<U name="Pièces"><PiecesPiecesMoteur /></U>} />
            <Route path="/pieces/pieces-pneumatiques" element={<U name="Pièces"><PiecesPiecesPneumatiques /></U>} />
            <Route path="/pieces/pieces-suspension" element={<U name="Pièces"><PiecesPiecesSuspension /></U>} />
            <Route path="/pieces/recherche-intelligente-pieces" element={<U name="Pièces"><PiecesRechercheIntelligentePieces /></U>} />
            <Route path="/pieces/retours-pieces" element={<U name="Pièces"><PiecesRetoursPieces /></U>} />
            <Route path="/pieces/statistiques-pieces" element={<U name="Pièces"><PiecesStatistiquesPieces /></U>} />
            <Route path="/pieces/vendeurs-pieces" element={<U name="Pièces"><PiecesVendeursPieces /></U>} />
            <Route path="/pieces/verification-compatibilite" element={<U name="Pièces"><PiecesVerificationCompatibilite /></U>} />
            {/* Finance */}
            <Route path="/finance/acompte-finance" element={<U name="Finance"><FinanceAcompteFinance /></U>} />
            <Route path="/finance/alertes-paiements" element={<U name="Finance"><FinanceAlertesPaiements /></U>} />
            <Route path="/finance/centre-echeancier" element={<U name="Finance"><FinanceCentreEcheancier /></U>} />
            <Route path="/finance/centre-factures" element={<U name="Finance"><FinanceCentreFactures /></U>} />
            <Route path="/finance/contrats-financiers" element={<U name="Finance"><FinanceContratsFinanciers /></U>} />
            <Route path="/finance/depot-garantie-finance" element={<U name="Finance"><FinanceDepotGarantieFinance /></U>} />
            <Route path="/finance" element={<U name="Finance"><FinanceFinanceGenerale /></U>} />
            <Route path="/finance/garantie-securite" element={<U name="Finance"><FinanceGarantieSecurite /></U>} />
            <Route path="/finance/l-o-a-finance" element={<U name="Finance"><FinanceLOAFinance /></U>} />
            <Route path="/finance/objectif-finance" element={<U name="Finance"><FinanceObjectifFinance /></U>} />
            <Route path="/finance/paiement-comptant" element={<U name="Finance"><FinancePaiementComptant /></U>} />
            <Route path="/finance/paiement-fractionne" element={<U name="Finance"><FinancePaiementFractionne /></U>} />
            <Route path="/finance/paiements-professionnels" element={<U name="Finance"><FinancePaiementsProfessionnels /></U>} />
            <Route path="/finance/remboursements-finance" element={<U name="Finance"><FinanceRemboursementsFinance /></U>} />
            <Route path="/finance/tableau-bord-finance" element={<U name="Finance"><FinanceTableauBordFinance /></U>} />
            {/* Super Admin */}
            <Route path="/superadmin/admin-abonnements" element={<U name="Super Admin"><SuperadminAdminAbonnements /></U>} />
            <Route path="/superadmin/admin-badges" element={<U name="Super Admin"><SuperadminAdminBadges /></U>} />
            <Route path="/superadmin/admin-carte-moniale" element={<U name="Super Admin"><SuperadminAdminCarteMoniale /></U>} />
            <Route path="/superadmin/admin-commissions" element={<U name="Super Admin"><SuperadminAdminCommissions /></U>} />
            <Route path="/superadmin/admin-comptes-pro" element={<U name="Super Admin"><SuperadminAdminComptesPro /></U>} />
            <Route path="/superadmin/admin-employes" element={<U name="Super Admin"><SuperadminAdminEmployes /></U>} />
            <Route path="/superadmin/admin-fraude" element={<U name="Super Admin"><SuperadminAdminFraude /></U>} />
            <Route path="/superadmin/admin-journal" element={<U name="Super Admin"><SuperadminAdminJournal /></U>} />
            <Route path="/superadmin/admin-litiges" element={<U name="Super Admin"><SuperadminAdminLitiges /></U>} />
            <Route path="/superadmin/admin-moderation-annonces" element={<U name="Super Admin"><SuperadminAdminModerationAnnonces /></U>} />
            <Route path="/superadmin/admin-moderation-avis" element={<U name="Super Admin"><SuperadminAdminModerationAvis /></U>} />
            <Route path="/superadmin/admin-objectif" element={<U name="Super Admin"><SuperadminAdminObjectif /></U>} />
            <Route path="/superadmin/admin-paiements" element={<U name="Super Admin"><SuperadminAdminPaiements /></U>} />
            <Route path="/superadmin/admin-sauvegardes" element={<U name="Super Admin"><SuperadminAdminSauvegardes /></U>} />
            <Route path="/superadmin/admin-securite" element={<U name="Super Admin"><SuperadminAdminSecurite /></U>} />
            <Route path="/superadmin/admin-statistiques" element={<U name="Super Admin"><SuperadminAdminStatistiques /></U>} />
            <Route path="/superadmin/admin-support" element={<U name="Super Admin"><SuperadminAdminSupport /></U>} />
            <Route path="/superadmin/admin-utilisateurs" element={<U name="Super Admin"><SuperadminAdminUtilisateurs /></U>} />
            <Route path="/superadmin/admin-validation-docs" element={<U name="Super Admin"><SuperadminAdminValidationDocs /></U>} />
            <Route path="/superadmin" element={<U name="Super Admin"><SuperadminSuperAdminDashboard /></U>} />
            {/* Utilisateurs */}
            <Route path="/utilisateurs/abonnements-utilisateur" element={<U name="Utilisateurs"><UtilisateursAbonnementsUtilisateur /></U>} />
            <Route path="/utilisateurs/centre-alertes-utilisateur" element={<U name="Utilisateurs"><UtilisateursCentreAlertesUtilisateur /></U>} />
            <Route path="/utilisateurs/centre-favoris-utilisateur" element={<U name="Utilisateurs"><UtilisateursCentreFavorisUtilisateur /></U>} />
            <Route path="/utilisateurs/centre-support-utilisateur" element={<U name="Utilisateurs"><UtilisateursCentreSupportUtilisateur /></U>} />
            <Route path="/utilisateurs" element={<U name="Utilisateurs"><UtilisateursCompteParticulier /></U>} />
            <Route path="/utilisateurs/compte-pro-utilisateur" element={<U name="Utilisateurs"><UtilisateursCompteProUtilisateur /></U>} />
            <Route path="/utilisateurs/documents-personnels" element={<U name="Utilisateurs"><UtilisateursDocumentsPersonnels /></U>} />
            <Route path="/utilisateurs/employes-utilisateur" element={<U name="Utilisateurs"><UtilisateursEmployesUtilisateur /></U>} />
            <Route path="/utilisateurs/factures-utilisateur" element={<U name="Utilisateurs"><UtilisateursFacturesUtilisateur /></U>} />
            <Route path="/utilisateurs/historique-achats" element={<U name="Utilisateurs"><UtilisateursHistoriqueAchats /></U>} />
            <Route path="/utilisateurs/historique-demarches" element={<U name="Utilisateurs"><UtilisateursHistoriqueDemarches /></U>} />
            <Route path="/utilisateurs/historique-depannages" element={<U name="Utilisateurs"><UtilisateursHistoriqueDepannages /></U>} />
            <Route path="/utilisateurs/historique-entretiens" element={<U name="Utilisateurs"><UtilisateursHistoriqueEntretiens /></U>} />
            <Route path="/utilisateurs/historique-locations" element={<U name="Utilisateurs"><UtilisateursHistoriqueLocations /></U>} />
            <Route path="/utilisateurs/mes-vehicules" element={<U name="Utilisateurs"><UtilisateursMesVehicules /></U>} />
            <Route path="/utilisateurs/messagerie-globale" element={<U name="Utilisateurs"><UtilisateursMessagerieGlobale /></U>} />
            <Route path="/utilisateurs/objectif-utilisateur" element={<U name="Utilisateurs"><UtilisateursObjectifUtilisateur /></U>} />
            <Route path="/utilisateurs/securite-utilisateur" element={<U name="Utilisateurs"><UtilisateursSecuriteUtilisateur /></U>} />
            <Route path="/utilisateurs/suppression-compte" element={<U name="Utilisateurs"><UtilisateursSuppressionCompte /></U>} />
            <Route path="/utilisateurs/tableau-bord-perso" element={<U name="Utilisateurs"><UtilisateursTableauBordPerso /></U>} />
            {/* Notifications */}
            <Route path="/notifications/alertes-urgentes" element={<U name="Notifications"><NotificationsAlertesUrgentes /></U>} />
            <Route path="/notifications/annonces-importantes" element={<U name="Notifications"><NotificationsAnnoncesImportantes /></U>} />
            <Route path="/notifications/canaux-communication" element={<U name="Notifications"><NotificationsCanauxCommunication /></U>} />
            <Route path="/notifications/coffre-fort-numerique" element={<U name="Notifications"><NotificationsCoffreFortNumerique /></U>} />
            <Route path="/notifications/documents-entreprises" element={<U name="Notifications"><NotificationsDocumentsEntreprises /></U>} />
            <Route path="/notifications/documents-personnels-global" element={<U name="Notifications"><NotificationsDocumentsPersonnelsGlobal /></U>} />
            <Route path="/notifications/documents-vehicules" element={<U name="Notifications"><NotificationsDocumentsVehicules /></U>} />
            <Route path="/notifications/historique-notifications" element={<U name="Notifications"><NotificationsHistoriqueNotifications /></U>} />
            <Route path="/notifications/notifications-demarches" element={<U name="Notifications"><NotificationsNotificationsDemarches /></U>} />
            <Route path="/notifications/notifications-depannage" element={<U name="Notifications"><NotificationsNotificationsDepannage /></U>} />
            <Route path="/notifications/notifications-garage" element={<U name="Notifications"><NotificationsNotificationsGarage /></U>} />
            <Route path="/notifications" element={<U name="Notifications"><NotificationsNotificationsGenerale /></U>} />
            <Route path="/notifications/notifications-location" element={<U name="Notifications"><NotificationsNotificationsLocation /></U>} />
            <Route path="/notifications/notifications-messages" element={<U name="Notifications"><NotificationsNotificationsMessages /></U>} />
            <Route path="/notifications/notifications-paiements" element={<U name="Notifications"><NotificationsNotificationsPaiements /></U>} />
            <Route path="/notifications/notifications-vente" element={<U name="Notifications"><NotificationsNotificationsVente /></U>} />
            <Route path="/notifications/objectif-notifications" element={<U name="Notifications"><NotificationsObjectifNotifications /></U>} />
            <Route path="/notifications/parametres-notifications" element={<U name="Notifications"><NotificationsParametresNotifications /></U>} />
            <Route path="/notifications/rappels-automatiques" element={<U name="Notifications"><NotificationsRappelsAutomatiques /></U>} />
            <Route path="/notifications/signatures-globales" element={<U name="Notifications"><NotificationsSignaturesGlobales /></U>} />
            {/* Partenaires */}
            <Route path="/partenaires/attribution-demandes" element={<U name="Partenaires"><PartenairesAttributionDemandes /></U>} />
            <Route path="/partenaires/carte-partenaires" element={<U name="Partenaires"><PartenairesCartePartenaires /></U>} />
            <Route path="/partenaires/evaluation-partenaires" element={<U name="Partenaires"><PartenairesEvaluationPartenaires /></U>} />
            <Route path="/partenaires/fiche-partenaire" element={<U name="Partenaires"><PartenairesFichePartenaire /></U>} />
            <Route path="/partenaires/inscription-partenaire" element={<U name="Partenaires"><PartenairesInscriptionPartenaire /></U>} />
            <Route path="/partenaires/niveaux-partenaires" element={<U name="Partenaires"><PartenairesNiveauxPartenaires /></U>} />
            <Route path="/partenaires/objectif-partenaires" element={<U name="Partenaires"><PartenairesObjectifPartenaires /></U>} />
            <Route path="/partenaires" element={<U name="Partenaires"><PartenairesPartenairesGenerale /></U>} />
            <Route path="/partenaires/statistiques-partenaires" element={<U name="Partenaires"><PartenairesStatistiquesPartenaires /></U>} />
            <Route path="/partenaires/suspension-partenaires" element={<U name="Partenaires"><PartenairesSuspensionPartenaires /></U>} />
            {/* Marketing */}
            <Route path="/marketing/campagnes-automatiques" element={<U name="Marketing"><MarketingCampagnesAutomatiques /></U>} />
            <Route path="/marketing/codes-promotionnels" element={<U name="Marketing"><MarketingCodesPromotionnels /></U>} />
            <Route path="/marketing/espaces-publicitaires" element={<U name="Marketing"><MarketingEspacesPublicitaires /></U>} />
            <Route path="/marketing/programme-fidelite" element={<U name="Marketing"><MarketingProgrammeFidelite /></U>} />
            <Route path="/marketing/programme-parrainage" element={<U name="Marketing"><MarketingProgrammeParrainage /></U>} />
            <Route path="/marketing/publicites-pro" element={<U name="Marketing"><MarketingPublicitesPro /></U>} />
            {/* Mobile */}
            <Route path="/mobile/app-android" element={<U name="Mobile"><MobileAppAndroid /></U>} />
            <Route path="/mobile/app-i-o-s" element={<U name="Mobile"><MobileAppIOS /></U>} />
            <Route path="/mobile/mode-hors-ligne" element={<U name="Mobile"><MobileModeHorsLigne /></U>} />
            <Route path="/mobile/notifications-push" element={<U name="Mobile"><MobileNotificationsPush /></U>} />
            {/* IA */}
            <Route path="/ia/i-a-aide-devis" element={<U name="IA"><IaIAAideDevis /></U>} />
            <Route path="/ia/i-a-analyse-marche" element={<U name="IA"><IaIAAnalyseMarche /></U>} />
            <Route path="/ia/i-a-assistant-client" element={<U name="IA"><IaIAAssistantClient /></U>} />
            <Route path="/ia/i-a-detection-fraude" element={<U name="IA"><IaIADetectionFraude /></U>} />
            <Route path="/ia/i-a-estimation" element={<U name="IA"><IaIAEstimation /></U>} />
            {/* International */}
            <Route path="/international/multi-devises" element={<U name="International"><InternationalMultiDevises /></U>} />
            <Route path="/international/multi-langues" element={<U name="International"><InternationalMultiLangues /></U>} />
            <Route path="/international/multi-pays" element={<U name="International"><InternationalMultiPays /></U>} />
            {/* Investisseurs */}
            <Route path="/investisseurs/espace-investisseurs" element={<U name="Investisseurs"><InvestisseursEspaceInvestisseurs /></U>} />
            <Route path="/investisseurs/objectif-global" element={<U name="Investisseurs"><InvestisseursObjectifGlobal /></U>} />
            {/* Entreprises */}
            <Route path="/entreprises/centre-carburant" element={<U name="Entreprises"><EntreprisesCentreCarburant /></U>} />
            <Route path="/entreprises/centre-geolocalisation" element={<U name="Entreprises"><EntreprisesCentreGeolocalisation /></U>} />
            <Route path="/entreprises/centre-immobilisation" element={<U name="Entreprises"><EntreprisesCentreImmobilisation /></U>} />
            <Route path="/entreprises/compte-flotte" element={<U name="Entreprises"><EntreprisesCompteFlotte /></U>} />
            <Route path="/entreprises/contrats-entreprises" element={<U name="Entreprises"><EntreprisesContratsEntreprises /></U>} />
            <Route path="/entreprises/gestion-conducteurs" element={<U name="Entreprises"><UEntreprisesGestionConducteurs /></U>} />
            <Route path="/entreprises/gestion-parc" element={<U name="Entreprises"><EntreprisesGestionParc /></U>} />
            <Route path="/entreprises/historique-flotte" element={<U name="Entreprises"><EntreprisesHistoriqueFlotte /></U>} />
            <Route path="/entreprises/objectif-flottes" element={<U name="Entreprises"><EntreprisesObjectifFlottes /></U>} />
            <Route path="/entreprises/rapports-entreprises" element={<U name="Entreprises"><EntreprisesRapportsEntreprises /></U>} />
            {/* Formations */}
            <Route path="/formations/certificats" element={<U name="Formations"><FormationsCertificats /></U>} />
            <Route path="/formations/formation-garage" element={<U name="Formations"><FormationsFormationGarage /></U>} />
            <Route path="/formations/formation-taxi" element={<U name="Formations"><FormationsFormationTaxi /></U>} />
            <Route path="/formations/formation-v-t-c" element={<U name="Formations"><FormationsFormationVTC /></U>} />
            <Route path="/formations/formation-vente" element={<U name="Formations"><FormationsFormationVente /></U>} />
            {/* Recrutement */}
            <Route path="/recrutement/depot-c-v" element={<U name="Recrutement"><RecrutementDepotCV /></U>} />
            <Route path="/recrutement/offres-emploi" element={<U name="Recrutement"><RecrutementOffresEmploi /></U>} />
            <Route path="/recrutement/recherche-talents" element={<U name="Recrutement"><RecrutementRechercheTalents /></U>} />
            {/* Communauté */}
            <Route path="/communaute/avis-conseils" element={<U name="Communauté"><CommunauteAvisConseils /></U>} />
            <Route path="/communaute/guides-achat" element={<U name="Communauté"><CommunauteGuidesAchat /></U>} />
            <Route path="/communaute/guides-garage" element={<U name="Communauté"><CommunauteGuidesGarage /></U>} />
            <Route path="/communaute/guides-location" element={<U name="Communauté"><CommunauteGuidesLocation /></U>} />
            <Route path="/communaute/guides-vente" element={<U name="Communauté"><CommunauteGuidesVente /></U>} />
            <Route path="/communaute/questions-reponses" element={<U name="Communauté"><CommunauteQuestionsReponses /></U>} />
            {/* Corporate */}
            <Route path="/corporate/a-propos" element={<U name="Corporate"><CorporateAPropos /></U>} />
            <Route path="/corporate/contact-entreprise" element={<U name="Corporate"><CorporateContactEntreprise /></U>} />
            <Route path="/corporate/nos-partenaires" element={<U name="Corporate"><CorporateNosPartenaires /></U>} />
            <Route path="/corporate/nos-services" element={<U name="Corporate"><CorporateNosServices /></U>} />
            <Route path="/corporate/presse-actualites" element={<U name="Corporate"><CorporatePresseActualites /></U>} />
            <Route path="/corporate/vision-m-k-a-p-m-s" element={<U name="Corporate"><CorporateVisionMKAPMS /></U>} />
            {/* Opérations */}
            <Route path="/operations/ambassadeurs" element={<U name="Opérations"><OperationsAmbassadeurs /></U>} />
            <Route path="/operations/centre-acquisition" element={<U name="Opérations"><OperationsCentreAcquisition /></U>} />
            <Route path="/operations/centre-audit" element={<U name="Opérations"><OperationsCentreAudit /></U>} />
            <Route path="/operations/centre-conformite" element={<U name="Opérations"><OperationsCentreConformite /></U>} />
            <Route path="/operations/centre-donnees-marche" element={<U name="Opérations"><OperationsCentreDonneesMarche /></U>} />
            <Route path="/operations/centre-expansion" element={<U name="Opérations"><OperationsCentreExpansion /></U>} />
            <Route path="/operations/centre-opportunites" element={<U name="Opérations"><OperationsCentreOpportunites /></U>} />
            <Route path="/operations/centre-previsions" element={<U name="Opérations"><OperationsCentrePrevisions /></U>} />
            <Route path="/operations/centre-risques" element={<U name="Opérations"><OperationsCentreRisques /></U>} />
            <Route path="/operations/centre-validation" element={<U name="Opérations"><OperationsCentreValidation /></U>} />
            <Route path="/operations/controle-qualite-global" element={<U name="Opérations"><OperationsControleQualiteGlobal /></U>} />
            <Route path="/operations/m-k-a-p-m-s-afrique" element={<U name="Opérations"><OperationsMKAPMSAfrique /></U>} />
            <Route path="/operations/m-k-a-p-m-s-assurance" element={<U name="Opérations"><OperationsMKAPMSAssurance /></U>} />
            <Route path="/operations/m-k-a-p-m-s-banque" element={<U name="Opérations"><OperationsMKAPMSBanque /></U>} />
            <Route path="/operations/m-k-a-p-m-s-mobility" element={<U name="Opérations"><OperationsMKAPMSMobility /></U>} />
            <Route path="/operations/m-k-a-p-m-s-transport" element={<U name="Opérations"><OperationsMKAPMSTransport /></U>} />
            <Route path="/operations/objectif-final-plateforme" element={<U name="Opérations"><OperationsObjectifFinalPlateforme /></U>} />
            <Route path="/operations/programme-entreprises-strategiques" element={<U name="Opérations"><OperationsProgrammeEntreprisesStrategiques /></U>} />
            <Route path="/operations/programme-premium" element={<U name="Opérations"><OperationsProgrammePremium /></U>} />
            <Route path="/operations/tableau-bord-fondateur" element={<U name="Opérations"><OperationsTableauBordFondateur /></U>} />
            {/* Automatisations */}
            <Route path="/automatisations/centre-alertes-strategiques" element={<U name="Automatisations"><AutomatisationsCentreAlertesStrategiques /></U>} />
            <Route path="/automatisations/centre-auto-marketing" element={<U name="Automatisations"><AutomatisationsCentreAutoMarketing /></U>} />
            <Route path="/automatisations/centre-croissance" element={<U name="Automatisations"><AutomatisationsCentreCroissance /></U>} />
            <Route path="/automatisations/centre-k-p-i" element={<U name="Automatisations"><AutomatisationsCentreKPI /></U>} />
            <Route path="/automatisations/centre-objectifs-entreprise" element={<U name="Automatisations"><AutomatisationsCentreObjectifsEntreprise /></U>} />
            <Route path="/automatisations/centre-performance-i-a" element={<U name="Automatisations"><AutomatisationsCentrePerformanceIA /></U>} />
            <Route path="/automatisations/escalades-automatiques" element={<U name="Automatisations"><AutomatisationsEscaladesAutomatiques /></U>} />
            <Route path="/automatisations/files-attente" element={<U name="Automatisations"><AutomatisationsFilesAttente /></U>} />
            <Route path="/automatisations/i-a-affectation" element={<U name="Automatisations"><AutomatisationsIAAffectation /></U>} />
            <Route path="/automatisations/i-a-controle" element={<U name="Automatisations"><AutomatisationsIAControle /></U>} />
            <Route path="/automatisations/i-a-priorisation" element={<U name="Automatisations"><AutomatisationsIAPriorisation /></U>} />
            <Route path="/automatisations/moteur-taches" element={<U name="Automatisations"><AutomatisationsMoteurTaches /></U>} />
            <Route path="/automatisations/moteur-workflow" element={<U name="Automatisations"><AutomatisationsMoteurWorkflow /></U>} />
            <Route path="/automatisations/objectif-automatisations" element={<U name="Automatisations"><AutomatisationsObjectifAutomatisations /></U>} />
            <Route path="/automatisations/workflows-personnalises" element={<U name="Automatisations"><AutomatisationsWorkflowsPersonnalises /></U>} />
            {/* Expansion */}
            <Route path="/expansion/centre-international" element={<U name="Expansion"><ExpansionCentreInternational /></U>} />
            <Route path="/expansion/multi-devises-global" element={<U name="Expansion"><ExpansionMultiDevisesGlobal /></U>} />
            <Route path="/expansion/multi-langues-global" element={<U name="Expansion"><ExpansionMultiLanguesGlobal /></U>} />
            <Route path="/expansion/phase-afrique-centrale" element={<U name="Expansion"><ExpansionPhaseAfriqueCentrale /></U>} />
            <Route path="/expansion/phase-afrique-est" element={<U name="Expansion"><ExpansionPhaseAfriqueEst /></U>} />
            <Route path="/expansion/phase-afrique-nord" element={<U name="Expansion"><ExpansionPhaseAfriqueNord /></U>} />
            <Route path="/expansion/phase-afrique-ouest" element={<U name="Expansion"><ExpansionPhaseAfriqueOuest /></U>} />
            <Route path="/expansion/phase-amerique-latine" element={<U name="Expansion"><ExpansionPhaseAmeriqueLatine /></U>} />
            <Route path="/expansion/phase-amerique-nord" element={<U name="Expansion"><ExpansionPhaseAmeriqueNord /></U>} />
            <Route path="/expansion/phase-asie" element={<U name="Expansion"><ExpansionPhaseAsie /></U>} />
            <Route path="/expansion/phase-europe" element={<U name="Expansion"><ExpansionPhaseEurope /></U>} />
            <Route path="/expansion/phase-europe-franco" element={<U name="Expansion"><ExpansionPhaseEuropeFranco /></U>} />
            <Route path="/expansion/phase-france" element={<U name="Expansion"><ExpansionPhaseFrance /></U>} />
            <Route path="/expansion/phase-moyen-orient" element={<U name="Expansion"><ExpansionPhaseMoyenOrient /></U>} />
            <Route path="/expansion/phase-oceanie" element={<U name="Expansion"><ExpansionPhaseOceanie /></U>} />
            <Route path="/expansion/tableau-bord-mondial" element={<U name="Expansion"><ExpansionTableauBordMondial /></U>} />
            <Route path="/expansion/vision-finale" element={<U name="Expansion"><ExpansionVisionFinale /></U>} />
            {/* Conformité */}
            <Route path="/conformite/assurances-pays" element={<U name="Conformité"><ConformiteAssurancesPays /></U>} />
            <Route path="/conformite/centre-pays" element={<U name="Conformité"><ConformiteCentrePays /></U>} />
            <Route path="/conformite/contrats-adaptes" element={<U name="Conformité"><ConformiteContratsAdaptes /></U>} />
            <Route path="/conformite/devises-automatiques" element={<U name="Conformité"><ConformiteDevisesAutomatiques /></U>} />
            <Route path="/conformite/documents-obligatoires-pays" element={<U name="Conformité"><ConformiteDocumentsObligatoiresPays /></U>} />
            <Route path="/conformite/garage-pays" element={<U name="Conformité"><ConformiteGaragePays /></U>} />
            <Route path="/conformite/i-a-juridique" element={<U name="Conformité"><ConformiteIAJuridique /></U>} />
            <Route path="/conformite/immatriculations-pays" element={<U name="Conformité"><ConformiteImmatriculationsPays /></U>} />
            <Route path="/conformite/location-pays" element={<U name="Conformité"><ConformiteLocationPays /></U>} />
            <Route path="/conformite/mises-a-jour-reglementaires" element={<U name="Conformité"><ConformiteMisesAJourReglementaires /></U>} />
            <Route path="/conformite/moteur-regles-pays" element={<U name="Conformité"><ConformiteMoteurReglesPays /></U>} />
            <Route path="/conformite/moyens-paiement-locaux" element={<U name="Conformité"><ConformiteMoyensPaiementLocaux /></U>} />
            <Route path="/conformite/objectif-conformite" element={<U name="Conformité"><ConformiteObjectifConformite /></U>} />
            <Route path="/conformite/tableau-bord-international" element={<U name="Conformité"><ConformiteTableauBordInternational /></U>} />
            <Route path="/conformite/taxes-automatiques" element={<U name="Conformité"><ConformiteTaxesAutomatiques /></U>} />
            <Route path="/conformite/vente-pays" element={<U name="Conformité"><ConformiteVentePays /></U>} />
            {/* Labs */}
            <Route path="/labs/academie-m-k-a-p-m-s" element={<U name="Labs"><LabsAcademieMKAPMS /></U>} />
            <Route path="/labs/analyse-marche-mondiale" element={<U name="Labs"><LabsAnalyseMarcheMondiale /></U>} />
            <Route path="/labs/automatisation-complete" element={<U name="Labs"><LabsAutomatisationComplete /></U>} />
            <Route path="/labs/benchmark-flottes" element={<U name="Labs"><BenchmarkFlottes /></U>} />
            <Route path="/labs/carnet-entretien-auto" element={<U name="Labs"><LabsCarnetEntretienAuto /></U>} />
            <Route path="/labs/centre-acquisitions-labs" element={<U name="Labs"><LabsCentreAcquisitionsLabs /></U>} />
            <Route path="/labs/centre-appels-offres" element={<U name="Labs"><LabsCentreAppelsOffres /></U>} />
            <Route path="/labs/centre-decisions-strategiques" element={<U name="Labs"><CentreDecisionsStrategiques /></U>} />
            <Route path="/labs/centre-donnees-mondiales" element={<U name="Labs"><LabsCentreDonneesMondiales /></U>} />
            <Route path="/labs/centre-expansion-auto" element={<U name="Labs"><LabsCentreExpansionAuto /></U>} />
            <Route path="/labs/centre-export-auto" element={<U name="Labs"><LabsCentreExportAuto /></U>} />
            <Route path="/labs/centre-innovation" element={<U name="Labs"><LabsCentreInnovation /></U>} />
            <Route path="/labs/centre-investissements-labs" element={<U name="Labs"><LabsCentreInvestissementsLabs /></U>} />
            <Route path="/labs/centre-recherche-m-k-a-p-m-s" element={<U name="Labs"><CentreRechercheMKAPMS /></U>} />
            <Route path="/labs/centre-strategie-groupe" element={<U name="Labs"><LabsCentreStrategieGroupe /></U>} />
            <Route path="/labs/certification-vehicule" element={<U name="Labs"><CertificationVehicule /></U>} />
            <Route path="/labs/coffrefort-international" element={<U name="Labs"><CoffrefortInternational /></U>} />
            <Route path="/labs/controle-distance-flottes" element={<U name="Labs"><LabsControleDistanceFlottes /></U>} />
            <Route path="/labs/controle-production" element={<U name="Labs"><ControleProduction /></U>} />
            <Route path="/labs/data-cloud-auto" element={<U name="Labs"><DataCloudAuto /></U>} />
            <Route path="/labs/energy-afrique" element={<U name="Labs"><EnergyAfrique /></U>} />
            <Route path="/labs/energy-batteries" element={<U name="Labs"><EnergyBatteries /></U>} />
            <Route path="/labs/energy-recharge" element={<U name="Labs"><EnergyRecharge /></U>} />
            <Route path="/labs/expansion-mondiale" element={<U name="Labs"><LabsExpansionMondiale /></U>} />
            <Route path="/labs/filiales" element={<U name="Labs"><LabsFiliales /></U>} />
            <Route path="/labs/fleet-network-mondial" element={<U name="Labs"><FleetNetworkMondial /></U>} />
            <Route path="/labs/franchise-m-k-a-p-m-s" element={<U name="Labs"><LabsFranchiseMKAPMS /></U>} />
            <Route path="/labs/franchises-global" element={<U name="Labs"><LabsFranchisesGlobal /></U>} />
            <Route path="/labs/gestion-entrepots" element={<U name="Labs"><GestionEntrepots /></U>} />
            <Route path="/labs/gestion-flotte-intelligente" element={<U name="Labs"><LabsGestionFlotteIntelligente /></U>} />
            <Route path="/labs/gestion-flottes-connectees" element={<U name="Labs"><LabsGestionFlottesConnectees /></U>} />
            <Route path="/labs/gestion-groupe" element={<U name="Labs"><GestionGroupe /></U>} />
            <Route path="/labs/gestion-marques" element={<U name="Labs"><LabsGestionMarques /></U>} />
            <Route path="/labs/hub-afrique" element={<U name="Labs"><LabsHubAfrique /></U>} />
            <Route path="/labs/i-a-automobile" element={<U name="Labs"><LabsIAAutomobile /></U>} />
            <Route path="/labs/i-a-avancee" element={<U name="Labs"><LabsIAAvancee /></U>} />
            <Route path="/labs/i-a-conseiller-achat" element={<U name="Labs"><LabsIAConseillerAchat /></U>} />
            <Route path="/labs/i-a-conseiller-garage" element={<U name="Labs"><LabsIAConseillerGarage /></U>} />
            <Route path="/labs/i-a-conseiller-vente" element={<U name="Labs"><LabsIAConseillerVente /></U>} />
            <Route path="/labs/inspection-distance" element={<U name="Labs"><InspectionDistance /></U>} />
            <Route path="/labs/jumeau-numerique" element={<U name="Labs"><JumeauNumerique /></U>} />
            <Route path="/labs/jumeaux-numeriques" element={<U name="Labs"><LabsJumeauxNumeriques /></U>} />
            <Route path="/labs/label-certifie" element={<U name="Labs"><LabsLabelCertifie /></U>} />
            <Route path="/labs/licences-m-k-a-p-m-s" element={<U name="Labs"><LabsLicencesMKAPMS /></U>} />
            <Route path="/labs/logistiques-centres" element={<U name="Labs"><LogistiquesCentres /></U>} />
            <Route path="/labs/maintenance-predictive" element={<U name="Labs"><LabsMaintenancePredictive /></U>} />
            <Route path="/labs/observatoire-automobile" element={<U name="Labs"><ObservatoireAutomobile /></U>} />
            <Route path="/labs/place-marche-b2-b" element={<U name="Labs"><LabsPlaceMarcheB2B /></U>} />
            <Route path="/labs/reseau-convoyeurs" element={<U name="Labs"><LabsReseauConvoyeurs /></U>} />
            <Route path="/labs/reseau-depannage-afrique" element={<U name="Labs"><LabsReseauDepannageAfrique /></U>} />
            <Route path="/labs/reseau-depanneurs" element={<U name="Labs"><LabsReseauDepanneurs /></U>} />
            <Route path="/labs/reseau-distribution" element={<U name="Labs"><ReseauDistribution /></U>} />
            <Route path="/labs/reseau-fournisseurs-global" element={<U name="Labs"><ReseauFournisseursGlobal /></U>} />
            <Route path="/labs/reseau-garages-afrique" element={<U name="Labs"><LabsReseauGaragesAfrique /></U>} />
            <Route path="/labs/reseau-mondial-partenaires" element={<U name="Labs"><ReseauMondialPartenaires /></U>} />
            <Route path="/labs/reseau-mondial-services" element={<U name="Labs"><ReseauMondialServices /></U>} />
            <Route path="/labs/reseau-pieces-afrique" element={<U name="Labs"><LabsReseauPiecesAfrique /></U>} />
            <Route path="/labs/reseau-transport" element={<U name="Labs"><LabsReseauTransport /></U>} />
            <Route path="/labs/reseau-usines" element={<U name="Labs"><ReseauUsines /></U>} />
            <Route path="/labs/smart-vehicles" element={<U name="Labs"><SmartVehicles /></U>} />
            <Route path="/labs/telematique" element={<U name="Labs"><LabsTelematique /></U>} />
            <Route path="/labs/vehicules-connectes" element={<U name="Labs"><LabsVehiculesConnectes /></U>} />
            <Route path="/labs/vision-finale-m-k-a-p-m-s" element={<U name="Labs"><LabsVisionFinaleMKAPMS /></U>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}
