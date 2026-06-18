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
            <Route path="/acheter" element={<U name="Vente"><Acheter /></U>} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}
