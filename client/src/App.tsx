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
          <Route path="/acheter" element={<Acheter />} />
          <Route path="/louer" element={<Louer />} />
          <Route path="/vehicule/:id" element={<Vehicule />} />
          <Route path="/vendre" element={<Vendre />} />
          <Route path="/devis" element={<Devis />} />
          <Route path="/garages" element={<Garages />} />
          <Route path="/garage-plus" element={<GaragePlus />} />
          <Route path="/univers" element={<Univers />} />
          <Route path="/pieces" element={<Pieces />} />
          <Route path="/livraison" element={<Livraison />} />
          <Route path="/depannage" element={<Depannage />} />
          <Route path="/vtc-taxi" element={<VtcTaxi />} />
          <Route path="/import-africa" element={<ImportAfrica />} />
          <Route path="/historique" element={<Historique />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/abonnements" element={<Abonnements />} />
          <Route path="/aide" element={<Aide />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/compte/*" element={<Compte />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  );
}
