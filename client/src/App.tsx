import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import { useAuth } from "./lib/auth";
import { trpc } from "./lib/trpc";
import Home from "./pages/Home";
import Acheter from "./pages/Acheter";
import Louer from "./pages/Louer";
import Vehicule from "./pages/Vehicule";
import Vendre from "./pages/Vendre";
import Devis from "./pages/Devis";
import Garages from "./pages/Garages";
import GaragePlus from "./pages/GaragePlus";
import Abonnements from "./pages/Abonnements";
import Aide from "./pages/Aide";
import Connexion from "./pages/Connexion";
import Compte from "./pages/Compte";
import Admin from "./pages/Admin";
import Univers from "./pages/Univers";
import Pieces from "./pages/Pieces";
import Livraison from "./pages/Livraison";
import Depannage from "./pages/Depannage";
import VtcTaxi from "./pages/VtcTaxi";
import ImportAfrica from "./pages/ImportAfrica";
import Historique from "./pages/Historique";
import Wallet from "./pages/Wallet";
import NotFound from "./pages/NotFound";
import UniversBoundary from "./components/UniversBoundary";

// Chaque univers est isolé : un crash dans l'un n'affecte pas les autres.
function U({ name, children }: { name: string; children: React.ReactNode }) {
  return <UniversBoundary name={name}>{children}</UniversBoundary>;
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
      <SessionLoader />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/acheter" element={<U name="Vente"><Acheter /></U>} />
          <Route path="/louer" element={<U name="Location"><Louer /></U>} />
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
          <Route path="/abonnements" element={<U name="Abonnements"><Abonnements /></U>} />
          <Route path="/aide" element={<Aide />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/compte/*" element={<U name="Mon compte"><Compte /></U>} />
          <Route path="/admin/*" element={<U name="Back-office"><Admin /></U>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  );
}
