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
            <Route path="/louer/utilitaires" element={<U name="Utilitaires"><Louer /></U>} />
            <Route path="/louer/camions" element={<U name="Camions"><Louer /></U>} />
            <Route path="/louer/minibus" element={<U name="Minibus"><Louer /></U>} />
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
