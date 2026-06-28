import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Wrench, Search, Car, Calendar, Users, FileText,
  Clock, Settings, ShoppingBag, ChevronRight, Plus, MapPin,
  Phone, Mail, Star, CheckCircle, AlertTriangle, Eye,
  Download, Cog, CircuitBoard, Gauge, Fuel, Thermometer,
  Wind, Zap, Disc, LifeBuoy, Battery, Lightbulb, Truck,
  Camera, PenTool, Package, BarChart3, ArrowDown, ArrowUp,
  AlertCircle, Bell, UserCheck, ClipboardList, Edit3, Trash2
} from "lucide-react";
import { DocumentView, buildDevisData, buildFactureData } from "../components/DocumentPDF";

/* ══════════════════════════════════════════════════════════════════════════
   MODULE ATELIER PRO COMPLET
   Planning, ordres de reparation complets (reception/signature/photos/
   etat carrosserie/bon sortie/restitution), suivi temps reel, employes
   atelier, stock magasin, devis, factures, clients, vehicules, catalogue,
   pieces — tout integre.
   ══════════════════════════════════════════════════════════════════════════ */

type AtelierTab = "suivi" | "planning" | "ordres" | "employes" | "stock" | "devis" | "factures" | "clients" | "vehicules" | "catalogue" | "pieces";

const TABS_ATELIER: { id: AtelierTab; label: string; icon: typeof Wrench; count?: number }[] = [
  { id: "suivi", label: "Suivi", icon: Eye },
  { id: "planning", label: "Planning", icon: Calendar },
  { id: "ordres", label: "Ordres", icon: ClipboardList, count: 5 },
  { id: "employes", label: "Employes", icon: Users, count: 4 },
  { id: "stock", label: "Stock", icon: Package, count: 156 },
  { id: "devis", label: "Devis", icon: FileText, count: 3 },
  { id: "factures", label: "Factures", icon: FileText, count: 8 },
  { id: "clients", label: "Clients", icon: Users, count: 42 },
  { id: "vehicules", label: "Vehicules", icon: Car, count: 67 },
  { id: "catalogue", label: "Catalogue", icon: Search },
  { id: "pieces", label: "Pieces", icon: ShoppingBag },
];

/* ━━━━━ STATUTS INTERVENTION TEMPS REEL ━━━━━ */
const STATUTS_INTERVENTION = [
  { id: "recu", label: "Vehicule recu", color: "bg-blue-500", textColor: "text-blue-700", bgLight: "bg-blue-50" },
  { id: "diagnostic", label: "Diagnostic en cours", color: "bg-purple-500", textColor: "text-purple-700", bgLight: "bg-purple-50" },
  { id: "pieces_commandees", label: "Pieces commandees", color: "bg-amber-500", textColor: "text-amber-700", bgLight: "bg-amber-50" },
  { id: "reparation", label: "Reparation en cours", color: "bg-orange-500", textColor: "text-orange-700", bgLight: "bg-orange-50" },
  { id: "controle_qualite", label: "Controle qualite", color: "bg-indigo-500", textColor: "text-indigo-700", bgLight: "bg-indigo-50" },
  { id: "pret", label: "Vehicule pret", color: "bg-green-500", textColor: "text-green-700", bgLight: "bg-green-50" },
  { id: "livre", label: "Vehicule livre", color: "bg-slate-400", textColor: "text-slate-600", bgLight: "bg-slate-50" },
];

interface SuiviVehicule {
  id: number;
  vehicule: string;
  plaque: string;
  client: string;
  tel: string;
  statut: string;
  tech: string;
  dateEntree: string;
  travaux: string;
  progression: number;
}

const SUIVI_DATA: SuiviVehicule[] = [
  { id: 1, vehicule: "Peugeot 3008 GT", plaque: "AB-123-CD", client: "Martin D.", tel: "06 12 34 56 78", statut: "reparation", tech: "Karim M.", dateEntree: "09/06/2025", travaux: "Revision complete 30k km", progression: 65 },
  { id: 2, vehicule: "BMW Serie 3 320i", plaque: "EF-456-GH", client: "Sophie L.", tel: "06 23 45 67 89", statut: "reparation", tech: "Youssef B.", dateEntree: "09/06/2025", travaux: "Freins AV + AR complets", progression: 45 },
  { id: 3, vehicule: "Renault Clio V", plaque: "IJ-789-KL", client: "Ahmed K.", tel: "06 34 56 78 90", statut: "diagnostic", tech: "Karim M.", dateEntree: "09/06/2025", travaux: "Voyant moteur — diagnostic OBD", progression: 20 },
  { id: 4, vehicule: "Mercedes Classe C", plaque: "MN-012-OP", client: "Julie P.", tel: "06 45 67 89 01", statut: "pieces_commandees", tech: "Omar L.", dateEntree: "08/06/2025", travaux: "Distribution + pompe a eau", progression: 30 },
  { id: 5, vehicule: "Tesla Model 3", plaque: "YZ-901-AB", client: "Thomas R.", tel: "06 56 78 90 12", statut: "pret", tech: "Youssef B.", dateEntree: "07/06/2025", travaux: "Pneus x4 + geometrie", progression: 100 },
  { id: 6, vehicule: "Audi A4 40 TDI", plaque: "CD-234-EF", client: "Pierre M.", tel: "06 67 89 01 23", statut: "recu", tech: "-", dateEntree: "09/06/2025", travaux: "Embrayage complet", progression: 5 },
  { id: 7, vehicule: "Volkswagen Golf 8", plaque: "QR-345-ST", client: "Nadia S.", tel: "06 78 90 12 34", statut: "livre", tech: "Karim M.", dateEntree: "05/06/2025", travaux: "Climatisation recharge + compresseur", progression: 100 },
];

/* ━━━━━ PLANNING ━━━━━ */
const PLANNING_SLOTS = [
  { id: 1, heure: "08:00", vehicule: "Peugeot 3008 GT", plaque: "AB-123-CD", travail: "Revision complete", tech: "Karim M.", duree: "2h30", statut: "en_cours" },
  { id: 2, heure: "08:30", vehicule: "BMW Serie 3 320i", plaque: "EF-456-GH", travail: "Freins AV + AR", tech: "Youssef B.", duree: "3h00", statut: "en_cours" },
  { id: 3, heure: "10:30", vehicule: "Renault Clio V", plaque: "IJ-789-KL", travail: "Diagnostic moteur", tech: "Karim M.", duree: "1h00", statut: "attente" },
  { id: 4, heure: "11:00", vehicule: "Mercedes Classe C", plaque: "MN-012-OP", travail: "Distribution", tech: "Omar L.", duree: "5h00", statut: "attente" },
  { id: 5, heure: "14:00", vehicule: "Volkswagen Golf 8", plaque: "QR-345-ST", travail: "Pneus x4 + geometrie", tech: "Youssef B.", duree: "1h30", statut: "planifie" },
  { id: 6, heure: "15:30", vehicule: "Citroen C3 Aircross", plaque: "UV-678-WX", travail: "Vidange + filtre", tech: "Karim M.", duree: "1h00", statut: "planifie" },
];

/* ━━━━━ ORDRES DE REPARATION COMPLETS ━━━━━ */
interface OrdreReparation {
  id: number;
  ref: string;
  vehicule: string;
  plaque: string;
  vin: string;
  client: string;
  tel: string;
  travaux: string;
  statut: string;
  tech: string;
  dateEntree: string;
  dateSortie: string;
  montant: string;
  receptionSignee: boolean;
  photosReception: number;
  etatCarrosserie: string;
  bonSortie: boolean;
  signatureRestitution: boolean;
  remarquesReception: string;
}

const ORDRES: OrdreReparation[] = [
  { id: 1, ref: "OR-2025-0147", vehicule: "Peugeot 3008 GT", plaque: "AB-123-CD", vin: "VF3MCYHZRML123456", client: "Martin D.", tel: "06 12 34 56 78", travaux: "Revision 30k km — vidange, filtres, bougies, liquide frein, controle general", statut: "en_cours", tech: "Karim M.", dateEntree: "09/06/2025", dateSortie: "-", montant: "389 EUR", receptionSignee: true, photosReception: 12, etatCarrosserie: "Bon etat general — micro-rayure aile AVD", bonSortie: false, signatureRestitution: false, remarquesReception: "Client signale bruit frein AR" },
  { id: 2, ref: "OR-2025-0146", vehicule: "BMW Serie 3 320i", plaque: "EF-456-GH", vin: "WBAPK5C52BA123456", client: "Sophie L.", tel: "06 23 45 67 89", travaux: "Plaquettes + disques AV + AR + purge circuit freinage", statut: "en_cours", tech: "Youssef B.", dateEntree: "09/06/2025", dateSortie: "-", montant: "780 EUR", receptionSignee: true, photosReception: 8, etatCarrosserie: "RAS", bonSortie: false, signatureRestitution: false, remarquesReception: "" },
  { id: 3, ref: "OR-2025-0145", vehicule: "Renault Clio V", plaque: "IJ-789-KL", vin: "VF15RFL0A67123456", client: "Ahmed K.", tel: "06 34 56 78 90", travaux: "Diagnostic OBD — voyant moteur, defaut P0300 ratee allumage", statut: "diagnostic", tech: "Karim M.", dateEntree: "09/06/2025", dateSortie: "-", montant: "60 EUR", receptionSignee: true, photosReception: 6, etatCarrosserie: "Impact pare-brise cote passager", bonSortie: false, signatureRestitution: false, remarquesReception: "Voyant allume depuis 2 jours" },
  { id: 4, ref: "OR-2025-0144", vehicule: "Mercedes Classe C", plaque: "MN-012-OP", vin: "WDD2050012R123456", client: "Julie P.", tel: "06 45 67 89 01", travaux: "Distribution + pompe a eau + galets + liquide refroidissement", statut: "attente_pieces", tech: "Omar L.", dateEntree: "08/06/2025", dateSortie: "-", montant: "1 250 EUR", receptionSignee: true, photosReception: 10, etatCarrosserie: "Bon etat", bonSortie: false, signatureRestitution: false, remarquesReception: "Kilometrage : 89 500 km" },
  { id: 5, ref: "OR-2025-0143", vehicule: "Tesla Model 3", plaque: "YZ-901-AB", vin: "5YJ3E1EA7KF123456", client: "Thomas R.", tel: "06 56 78 90 12", travaux: "Pneus Michelin PS5 x4 + parallelisme", statut: "termine", tech: "Youssef B.", dateEntree: "07/06/2025", dateSortie: "08/06/2025", montant: "920 EUR", receptionSignee: true, photosReception: 8, etatCarrosserie: "RAS", bonSortie: true, signatureRestitution: true, remarquesReception: "" },
];

/* ━━━━━ EMPLOYES ATELIER ━━━━━ */
interface Employe {
  id: number;
  nom: string;
  role: string;
  specialite: string;
  vehiculesJour: number;
  vehiculesSemaine: number;
  heuresJour: string;
  heuresSemaine: string;
  productivite: number;
  statut: "actif" | "pause" | "absent";
  vehiculeActuel: string | null;
  plaqueActuel: string | null;
  tacheActuelle: string | null;
}

const EMPLOYES: Employe[] = [
  { id: 1, nom: "Karim M.", role: "Mecanicien senior", specialite: "Moteur, Distribution, Diagnostic", vehiculesJour: 2, vehiculesSemaine: 11, heuresJour: "5h30", heuresSemaine: "38h", productivite: 92, statut: "actif", vehiculeActuel: "Peugeot 3008 GT", plaqueActuel: "AB-123-CD", tacheActuelle: "Revision 30k km" },
  { id: 2, nom: "Youssef B.", role: "Mecanicien", specialite: "Freinage, Suspension, Pneus", vehiculesJour: 1, vehiculesSemaine: 9, heuresJour: "4h00", heuresSemaine: "35h", productivite: 85, statut: "actif", vehiculeActuel: "BMW Serie 3 320i", plaqueActuel: "EF-456-GH", tacheActuelle: "Freins AV + AR" },
  { id: 3, nom: "Omar L.", role: "Mecanicien", specialite: "Distribution, Embrayage, Boite", vehiculesJour: 0, vehiculesSemaine: 7, heuresJour: "0h", heuresSemaine: "32h", productivite: 78, statut: "pause", vehiculeActuel: null, plaqueActuel: null, tacheActuelle: null },
  { id: 4, nom: "Rachid T.", role: "Apprenti", specialite: "Vidange, Filtres, Pneus", vehiculesJour: 1, vehiculesSemaine: 5, heuresJour: "3h00", heuresSemaine: "28h", productivite: 65, statut: "actif", vehiculeActuel: "Citroen C3", plaqueActuel: "UV-678-WX", tacheActuelle: "Vidange + filtre" },
];

/* ━━━━━ STOCK MAGASIN ━━━━━ */
interface StockItem {
  id: number;
  nom: string;
  ref: string;
  categorie: string;
  qteActuelle: number;
  qteMinimum: number;
  prixAchat: string;
  prixVente: string;
  fournisseur: string;
  dernierMouvement: string;
  alerteRupture: boolean;
}

const STOCK_MAGASIN: StockItem[] = [
  { id: 1, nom: "Plaquettes freins AV ATE", ref: "ATE 13.0460-7186.2", categorie: "Freinage", qteActuelle: 8, qteMinimum: 4, prixAchat: "18 EUR", prixVente: "32 EUR", fournisseur: "AD Parts", dernierMouvement: "Sortie -2 le 09/06", alerteRupture: false },
  { id: 2, nom: "Filtre huile PSA 1.6", ref: "PSA 1109 CK", categorie: "Filtration", qteActuelle: 15, qteMinimum: 5, prixAchat: "6 EUR", prixVente: "12 EUR", fournisseur: "PSA Direct", dernierMouvement: "Sortie -1 le 09/06", alerteRupture: false },
  { id: 3, nom: "Bougie NGK", ref: "NGK LZKR6AI-10G", categorie: "Allumage", qteActuelle: 24, qteMinimum: 8, prixAchat: "4 EUR", prixVente: "9 EUR", fournisseur: "NGK Europe", dernierMouvement: "Entree +16 le 07/06", alerteRupture: false },
  { id: 4, nom: "Courroie distrib. Gates", ref: "Gates KP15606XS", categorie: "Distribution", qteActuelle: 2, qteMinimum: 3, prixAchat: "95 EUR", prixVente: "185 EUR", fournisseur: "Gates France", dernierMouvement: "Sortie -1 le 08/06", alerteRupture: true },
  { id: 5, nom: "Disque frein AV Brembo", ref: "Brembo 09.B265.10", categorie: "Freinage", qteActuelle: 4, qteMinimum: 4, prixAchat: "38 EUR", prixVente: "65 EUR", fournisseur: "AD Parts", dernierMouvement: "Sortie -2 le 09/06", alerteRupture: false },
  { id: 6, nom: "Amortisseur AR Monroe", ref: "Monroe G7387", categorie: "Suspension", qteActuelle: 1, qteMinimum: 2, prixAchat: "42 EUR", prixVente: "78 EUR", fournisseur: "Monroe France", dernierMouvement: "Sortie -1 le 06/06", alerteRupture: true },
  { id: 7, nom: "Liquide frein DOT4 1L", ref: "TRW PFB440", categorie: "Liquides", qteActuelle: 6, qteMinimum: 4, prixAchat: "4 EUR", prixVente: "8 EUR", fournisseur: "TRW", dernierMouvement: "Sortie -1 le 09/06", alerteRupture: false },
  { id: 8, nom: "Huile 5W30 Total 5L", ref: "Total Quartz 9000", categorie: "Lubrifiants", qteActuelle: 10, qteMinimum: 3, prixAchat: "22 EUR", prixVente: "35 EUR", fournisseur: "TotalEnergies", dernierMouvement: "Sortie -1 le 09/06", alerteRupture: false },
  { id: 9, nom: "Kit embrayage Valeo", ref: "Valeo 826 818", categorie: "Embrayage", qteActuelle: 0, qteMinimum: 1, prixAchat: "220 EUR", prixVente: "420 EUR", fournisseur: "Valeo France", dernierMouvement: "Sortie -1 le 05/06", alerteRupture: true },
  { id: 10, nom: "Filtre a air PSA", ref: "PSA 1444 TT", categorie: "Filtration", qteActuelle: 12, qteMinimum: 5, prixAchat: "10 EUR", prixVente: "22 EUR", fournisseur: "PSA Direct", dernierMouvement: "Entree +10 le 07/06", alerteRupture: false },
];

/* ━━━━━ DEVIS ━━━━━ */
const DEVIS_ATELIER = [
  { id: 1, ref: "DV-2025-0089", vehicule: "Audi A4 40 TDI", plaque: "CD-234-EF", client: "Pierre M.", objet: "Embrayage complet + volant moteur bi-masse", montant: "1 890 EUR", statut: "envoye", date: "09/06/2025" },
  { id: 2, ref: "DV-2025-0088", vehicule: "Peugeot 308 II", plaque: "GH-567-IJ", client: "Nadia S.", objet: "Climatisation — recharge + remplacement compresseur", montant: "850 EUR", statut: "accepte", date: "08/06/2025" },
  { id: 3, ref: "DV-2025-0087", vehicule: "Dacia Sandero", plaque: "KL-890-MN", client: "Marc T.", objet: "Revision + CT preparation", montant: "420 EUR", statut: "refuse", date: "07/06/2025" },
];

/* ━━━━━ FACTURES ━━━━━ */
const FACTURES_ATELIER = [
  { id: 1, ref: "FA-2025-0312", vehicule: "Tesla Model 3", client: "Thomas R.", montant: "920 EUR", date: "08/06/2025", statut: "payee" },
  { id: 2, ref: "FA-2025-0311", vehicule: "Renault Megane", client: "Laura V.", montant: "245 EUR", date: "07/06/2025", statut: "payee" },
  { id: 3, ref: "FA-2025-0310", vehicule: "Citroen C4", client: "Jean-Pierre D.", montant: "1 580 EUR", date: "06/06/2025", statut: "en_attente" },
  { id: 4, ref: "FA-2025-0309", vehicule: "BMW X3", client: "Fatima B.", montant: "380 EUR", date: "05/06/2025", statut: "payee" },
];

/* ━━━━━ CLIENTS ━━━━━ */
const CLIENTS_ATELIER = [
  { id: 1, nom: "Martin D.", vehicules: 2, visites: 8, derniere: "09/06/2025", total: "2 450 EUR", tel: "06 12 34 56 78" },
  { id: 2, nom: "Sophie L.", vehicules: 1, visites: 5, derniere: "09/06/2025", total: "1 890 EUR", tel: "06 23 45 67 89" },
  { id: 3, nom: "Ahmed K.", vehicules: 3, visites: 12, derniere: "09/06/2025", total: "4 120 EUR", tel: "06 34 56 78 90" },
  { id: 4, nom: "Julie P.", vehicules: 1, visites: 3, derniere: "08/06/2025", total: "1 680 EUR", tel: "06 45 67 89 01" },
  { id: 5, nom: "Thomas R.", vehicules: 1, visites: 2, derniere: "08/06/2025", total: "920 EUR", tel: "06 56 78 90 12" },
];

/* ━━━━━ VEHICULES ATELIER ━━━━━ */
const VEHICULES_ATELIER = [
  { id: 1, marque: "Peugeot", modele: "3008 GT Hybrid", plaque: "AB-123-CD", vin: "VF3MCYHZRML123456", annee: 2024, km: "15 200", client: "Martin D.", derniereVisite: "09/06/2025" },
  { id: 2, marque: "BMW", modele: "Serie 3 320i", plaque: "EF-456-GH", vin: "WBAPK5C52BA123456", annee: 2024, km: "8 200", client: "Sophie L.", derniereVisite: "09/06/2025" },
  { id: 3, marque: "Renault", modele: "Clio V TCe 130", plaque: "IJ-789-KL", vin: "VF15RFL0A67123456", annee: 2024, km: "5 800", client: "Ahmed K.", derniereVisite: "09/06/2025" },
  { id: 4, marque: "Mercedes", modele: "Classe C 220d", plaque: "MN-012-OP", vin: "WDD2050012R123456", annee: 2023, km: "22 400", client: "Julie P.", derniereVisite: "08/06/2025" },
];

export default function AtelierPro() {
  const [tab, setTab] = useState<AtelierTab>("suivi");
  const [suiviFilter, setSuiviFilter] = useState<string>("tous");
  const [stockFilter, setStockFilter] = useState<string>("tous");
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [selectedPlanning, setSelectedPlanning] = useState<number | null>(null);
  const [selectedOrdre, setSelectedOrdre] = useState<number | null>(null);
  const [selectedEmploye, setSelectedEmploye] = useState<number | null>(null);
  const [selectedStock, setSelectedStock] = useState<number | null>(null);
  const [selectedDevis, setSelectedDevis] = useState<number | null>(null);
  const [selectedFacture, setSelectedFacture] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [selectedVehAtelier, setSelectedVehAtelier] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [statusPanel, setStatusPanel] = useState<number | null>(null);
  const [suiviStatuts, setSuiviStatuts] = useState<Record<number, string>>({});
  const [planningStatuts, setPlanningStatuts] = useState<Record<number, string>>({});
  const [devisStatuts, setDevisStatuts] = useState<Record<number, string>>({});
  const [factureStatuts, setFactureStatuts] = useState<Record<number, string>>({});
  const [stockQtes, setStockQtes] = useState<Record<number, number>>({});
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newVehForm, setNewVehForm] = useState({ plaque: "", vin: "", marque: "", modele: "", annee: "", km: "", client: "", tel: "" });
  const [extraVehicules, setExtraVehicules] = useState<typeof VEHICULES_ATELIER>([]);
  const [viewDevisPDF, setViewDevisPDF] = useState<typeof DEVIS_ATELIER[0] | null>(null);
  const [viewFacturePDF, setViewFacturePDF] = useState<typeof FACTURES_ATELIER[0] | null>(null);
  const [viewOrdrePDF, setViewOrdrePDF] = useState<OrdreReparation | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const alertesStock = STOCK_MAGASIN.filter((s) => s.alerteRupture).length;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* Hero */}
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/garage-plus" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage Pro</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} className="text-[#D4AF37]" /> Atelier Pro</h1>
        <p className="mt-0.5 text-sm text-white/60">Gestion complete de l'atelier, suivi temps reel, stock, catalogue</p>

        {/* Stats rapides (cliquables) */}
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {[
            { label: "Recus", val: String(SUIVI_DATA.filter((s) => s.statut === "recu").length), color: "text-blue-400", filter: "recu" },
            { label: "En cours", val: String(SUIVI_DATA.filter((s) => ["diagnostic", "reparation", "pieces_commandees"].includes(s.statut)).length), color: "text-orange-400", filter: "reparation" },
            { label: "Prets", val: String(SUIVI_DATA.filter((s) => s.statut === "pret").length), color: "text-green-400", filter: "pret" },
            { label: "Livres", val: String(SUIVI_DATA.filter((s) => s.statut === "livre").length), color: "text-slate-400", filter: "livre" },
            { label: "Alertes", val: String(alertesStock), color: "text-red-400", filter: "stock_alert" },
          ].map((s) => (
            <button key={s.label} onClick={() => { if (s.filter === "stock_alert") { setTab("stock"); } else { setTab("suivi"); setSuiviFilter(s.filter); } }} className="rounded-lg bg-white/5 p-2 text-center hover:bg-white/10 transition cursor-pointer">
              <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
              <p className="text-[8px] text-white/50">{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {TABS_ATELIER.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition ${tab === t.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={11} /> {t.label}
              {t.id === "stock" && alertesStock > 0 && <span className="ml-0.5 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[8px] font-bold text-white grid place-items-center">{alertesStock}</span>}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-4">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           SUIVI INTERVENTION TEMPS REEL
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {tab === "suivi" && (
          <div className="space-y-3">
            {/* Filtres statut */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <button onClick={() => setSuiviFilter("tous")} className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${suiviFilter === "tous" ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>Tous ({SUIVI_DATA.length})</button>
              {STATUTS_INTERVENTION.map((st) => {
                const c = SUIVI_DATA.filter((s) => s.statut === st.id).length;
                if (c === 0) return null;
                return (
                  <button key={st.id} onClick={() => setSuiviFilter(st.id)} className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${suiviFilter === st.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
                    <span className={`h-2 w-2 rounded-full ${st.color}`} /> {st.label} ({c})
                  </button>
                );
              })}
            </div>

            {/* Timeline vehicules */}
            {(suiviFilter === "tous" ? SUIVI_DATA : SUIVI_DATA.filter((s) => s.statut === suiviFilter)).map((v) => {
              const st = STATUTS_INTERVENTION.find((s) => s.id === v.statut)!;
              const stepIndex = STATUTS_INTERVENTION.findIndex((s) => s.id === v.statut);
              const isExpanded = selectedVehicle === v.id;
              return (
                <div key={v.id} className={`rounded-xl bg-white border-l-4 border ${st.color.replace("bg-", "border-")} border-r-[#E5E7EB] border-t-[#E5E7EB] border-b-[#E5E7EB] overflow-hidden transition-all`}>
                  <button onClick={() => setSelectedVehicle(isExpanded ? null : v.id)} className="w-full text-left p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#111]">{v.vehicule}</p>
                        <p className="text-xs text-slate-500">{v.plaque} — {v.client}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${st.bgLight} ${st.textColor}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{v.travaux}</p>

                    {/* Barre de progression */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400">Progression</span>
                        <span className="text-[10px] font-bold text-[#111]">{v.progression}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${st.color} transition-all`} style={{ width: `${v.progression}%` }} />
                      </div>
                    </div>

                    {/* Etapes timeline */}
                    <div className="mt-3 flex items-center gap-0.5">
                      {STATUTS_INTERVENTION.map((s, i) => (
                        <div key={s.id} className="flex-1 flex flex-col items-center">
                          <div className={`h-1.5 w-full rounded-full ${i <= stepIndex ? s.color : "bg-slate-200"}`} />
                          <span className={`mt-0.5 text-[7px] ${i <= stepIndex ? "text-[#111] font-bold" : "text-slate-300"}`}>{s.label.split(" ").pop()}</span>
                        </div>
                      ))}
                    </div>
                  </button>

                  {/* Detail panel (expanded) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[#E5E7EB] pt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Technicien</span><p className="font-bold text-[#111]">{v.tech}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Date entree</span><p className="font-bold text-[#111]">{v.dateEntree}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Telephone client</span><p className="font-bold text-[#111]">{v.tel}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Progression</span><p className="font-bold text-[#111]">{v.progression}%</p></div>
                      </div>
                      <div className="rounded-lg bg-[#F5F3EF] p-2 text-[10px]">
                        <span className="text-slate-400">Travaux</span>
                        <p className="font-bold text-[#111] mt-0.5">{v.travaux}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setStatusPanel(statusPanel === v.id ? null : v.id); }} className="flex-1 rounded-lg bg-[#D4AF37] py-2 text-[10px] font-bold text-white text-center">Changer statut</button>
                        <button onClick={(e) => { e.stopPropagation(); showToast(`Notification envoyee a ${v.client} (${v.tel})`); }} className="flex-1 rounded-lg bg-blue-500 py-2 text-[10px] font-bold text-white text-center">Notifier client</button>
                        <a href={`tel:${v.tel}`} className="flex-1 rounded-lg bg-green-500 py-2 text-[10px] font-bold text-white text-center">Appeler</a>
                      </div>
                      {statusPanel === v.id && (
                        <div className="mt-2 rounded-lg bg-white border border-[#E5E7EB] p-2 space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 mb-1">Choisir un nouveau statut :</p>
                          {STATUTS_INTERVENTION.map((s) => {
                            const cur = suiviStatuts[v.id] || v.statut;
                            return (
                              <button key={s.id} onClick={(e) => { e.stopPropagation(); setSuiviStatuts(prev => ({ ...prev, [v.id]: s.id })); setStatusPanel(null); showToast(`Statut ${v.vehicule} → ${s.label}`); }}
                                className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold transition ${cur === s.id ? `${s.bgLight} ${s.textColor} ring-1 ring-current` : "hover:bg-slate-50 text-slate-600"}`}
                              >
                                <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} /> {s.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━━ PLANNING ━━━━━ */}
        {tab === "planning" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#111]">Planning du jour — Lundi 9 Juin 2025</h2>
              <button className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1"><Plus size={12} /> RDV</button>
            </div>
            {PLANNING_SLOTS.map((s) => {
              const isExp = selectedPlanning === s.id;
              return (
                <div key={s.id} className={`rounded-xl bg-white border overflow-hidden ${s.statut === "en_cours" ? "border-green-300" : s.statut === "attente" ? "border-amber-200" : "border-[#E5E7EB]"}`}>
                  <button onClick={() => setSelectedPlanning(isExp ? null : s.id)} className="w-full text-left p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center shrink-0 w-14">
                        <p className="text-sm font-black text-[#111]">{s.heure}</p>
                        <p className="text-[9px] text-slate-400">{s.duree}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#111] truncate">{s.vehicule}</p>
                        <p className="text-[11px] text-slate-500">{s.plaque} — {s.travail}</p>
                        <p className="text-[10px] text-slate-400">Tech: {s.tech}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${s.statut === "en_cours" ? "bg-green-50 text-green-700" : s.statut === "attente" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"}`}>
                        {s.statut === "en_cours" ? "En cours" : s.statut === "attente" ? "Attente" : "Planifie"}
                      </span>
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Vehicule</span><p className="font-bold text-[#111]">{s.vehicule}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Plaque</span><p className="font-bold text-[#111]">{s.plaque}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Travail</span><p className="font-bold text-[#111]">{s.travail}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Duree estimee</span><p className="font-bold text-[#111]">{s.duree}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/atelier/rdv/${s.id}`} onClick={(e) => e.stopPropagation()} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white text-center">Modifier RDV</Link>
                        <button onClick={(e) => { e.stopPropagation(); setPlanningStatuts(prev => ({ ...prev, [s.id]: "en_cours" })); showToast(`${s.vehicule} — intervention demarree`); }} className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[10px] font-bold text-white">Demarrer</button>
                        <button onClick={(e) => { e.stopPropagation(); setPlanningStatuts(prev => ({ ...prev, [s.id]: "annule" })); showToast(`RDV ${s.heure} — ${s.vehicule} : annule`); }} className="flex-1 rounded-lg bg-red-50 py-1.5 text-[10px] font-bold text-red-600">Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━━ ORDRES DE REPARATION COMPLETS ━━━━━ */}
        {tab === "ordres" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-[#111]">Ordres de reparation</h2>
              <button className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1"><Plus size={12} /> Nouvel OR</button>
            </div>
            {ORDRES.map((o) => (
              <div key={o.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                {/* En-tete OR */}
                <div className="bg-[#111] px-3 py-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D4AF37]">{o.ref}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    o.statut === "en_cours" ? "bg-green-500/20 text-green-300" :
                    o.statut === "diagnostic" ? "bg-purple-500/20 text-purple-300" :
                    o.statut === "attente_pieces" ? "bg-amber-500/20 text-amber-300" :
                    "bg-white/10 text-white/70"
                  }`}>
                    {o.statut === "en_cours" ? "En cours" : o.statut === "diagnostic" ? "Diagnostic" : o.statut === "attente_pieces" ? "Attente pieces" : "Termine"}
                  </span>
                </div>

                <div className="p-3">
                  {/* Vehicule + Client */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#111]">{o.vehicule} <span className="text-slate-400 font-normal">({o.plaque})</span></p>
                      <p className="text-[10px] text-slate-400">VIN: {o.vin}</p>
                    </div>
                    <p className="text-sm font-bold text-[#D4AF37]">{o.montant}</p>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">{o.travaux}</p>

                  {/* Reception */}
                  <div className="mt-3 rounded-lg bg-[#F5F3EF] p-2.5">
                    <h4 className="text-[10px] font-bold text-[#111] mb-1.5">Reception vehicule</h4>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div className="flex items-center gap-1">
                        {o.receptionSignee ? <CheckCircle size={10} className="text-green-500" /> : <AlertCircle size={10} className="text-red-500" />}
                        <span className="text-slate-600">Signature client: {o.receptionSignee ? "Oui" : "Non"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Camera size={10} className="text-blue-500" />
                        <span className="text-slate-600">Photos reception: {o.photosReception}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <Car size={10} className="text-slate-500" />
                        <span className="text-slate-600">Etat carrosserie: {o.etatCarrosserie}</span>
                      </div>
                      {o.remarquesReception && (
                        <div className="col-span-2 flex items-center gap-1">
                          <FileText size={10} className="text-amber-500" />
                          <span className="text-amber-600 font-semibold">Remarque: {o.remarquesReception}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sortie */}
                  <div className="mt-2 rounded-lg bg-[#F5F3EF] p-2.5">
                    <h4 className="text-[10px] font-bold text-[#111] mb-1.5">Bon de sortie</h4>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div className="flex items-center gap-1">
                        {o.bonSortie ? <CheckCircle size={10} className="text-green-500" /> : <Clock size={10} className="text-slate-400" />}
                        <span className="text-slate-600">Bon de sortie: {o.bonSortie ? "Signe" : "En attente"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {o.signatureRestitution ? <CheckCircle size={10} className="text-green-500" /> : <Clock size={10} className="text-slate-400" />}
                        <span className="text-slate-600">Signature restitution: {o.signatureRestitution ? "Oui" : "Non"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Infos bas */}
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
                    <span>Client: {o.client}</span>
                    <span>Tech: {o.tech}</span>
                    <span>Entree: {o.dateEntree}</span>
                    {o.dateSortie !== "-" && <span>Sortie: {o.dateSortie}</span>}
                  </div>

                  {/* Actions */}
                  <div className="mt-2 flex gap-1.5">
                    <button onClick={() => showToast(`Ordre ${o.ref} — modification en cours`)} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white text-center">Modifier</button>
                    <button onClick={() => showToast(`${o.photosReception} photos reception — ${o.vehicule}`)} className="flex-1 rounded-lg bg-[#F5F3EF] py-1.5 text-[10px] font-bold text-slate-600 text-center">Photos</button>
                    <button onClick={() => setViewOrdrePDF(o)} className="flex-1 rounded-lg bg-[#F5F3EF] py-1.5 text-[10px] font-bold text-slate-600 text-center">PDF</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ━━━━━ EMPLOYES ATELIER ━━━━━ */}
        {tab === "employes" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-[#111]">Equipe atelier</h2>
              <button className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1"><Plus size={12} /> Ajouter</button>
            </div>

            {/* Synthese equipe */}
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <h3 className="text-xs font-bold text-[#D4AF37] mb-2">Synthese du jour</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div><p className="text-lg font-black text-white">{EMPLOYES.filter((e) => e.statut === "actif").length}</p><p className="text-[8px] text-white/50">Actifs</p></div>
                <div><p className="text-lg font-black text-white">{EMPLOYES.reduce((s, e) => s + e.vehiculesJour, 0)}</p><p className="text-[8px] text-white/50">Vehicules</p></div>
                <div><p className="text-lg font-black text-white">{Math.round(EMPLOYES.reduce((s, e) => s + e.productivite, 0) / EMPLOYES.length)}%</p><p className="text-[8px] text-white/50">Productivite</p></div>
                <div><p className="text-lg font-black text-white">{EMPLOYES.filter((e) => e.statut === "pause").length}</p><p className="text-[8px] text-white/50">En pause</p></div>
              </div>
            </div>

            {/* Fiches employes */}
            {EMPLOYES.map((emp) => {
              const isExp = selectedEmploye === emp.id;
              return (
                <div key={emp.id} className={`rounded-xl bg-white border overflow-hidden ${emp.statut === "actif" ? "border-green-200" : emp.statut === "pause" ? "border-amber-200" : "border-red-200"}`}>
                  <button onClick={() => setSelectedEmploye(isExp ? null : emp.id)} className="w-full text-left p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#111] flex items-center gap-2">
                          {emp.nom}
                          <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${emp.statut === "actif" ? "bg-green-50 text-green-700" : emp.statut === "pause" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                            {emp.statut === "actif" ? "Actif" : emp.statut === "pause" ? "Pause" : "Absent"}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">{emp.role} — {emp.specialite}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <BarChart3 size={12} className="text-[#D4AF37]" />
                          <span className={`text-sm font-bold ${emp.productivite >= 90 ? "text-green-600" : emp.productivite >= 75 ? "text-amber-600" : "text-red-600"}`}>{emp.productivite}%</span>
                        </div>
                        <p className="text-[9px] text-slate-400">productivite</p>
                      </div>
                    </div>

                    {/* Vehicule actuel */}
                    {emp.vehiculeActuel && (
                      <div className="mt-2 rounded-lg bg-green-50 p-2 flex items-center gap-2">
                        <Car size={14} className="text-green-600" />
                        <div>
                          <p className="text-xs font-bold text-green-700">{emp.vehiculeActuel} ({emp.plaqueActuel})</p>
                          <p className="text-[10px] text-green-600">{emp.tacheActuelle}</p>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="mt-2 grid grid-cols-4 gap-2 text-center text-[10px]">
                      <div className="rounded-lg bg-[#F5F3EF] p-1.5">
                        <p className="font-bold text-[#111]">{emp.vehiculesJour}</p>
                        <p className="text-slate-400">Vehicules/j</p>
                      </div>
                      <div className="rounded-lg bg-[#F5F3EF] p-1.5">
                        <p className="font-bold text-[#111]">{emp.vehiculesSemaine}</p>
                        <p className="text-slate-400">Vehicules/sem</p>
                      </div>
                      <div className="rounded-lg bg-[#F5F3EF] p-1.5">
                        <p className="font-bold text-[#111]">{emp.heuresJour}</p>
                        <p className="text-slate-400">Heures/j</p>
                      </div>
                      <div className="rounded-lg bg-[#F5F3EF] p-1.5">
                        <p className="font-bold text-[#111]">{emp.heuresSemaine}</p>
                        <p className="text-slate-400">Heures/sem</p>
                      </div>
                    </div>
                  </button>

                  {/* Detail panel */}
                  {isExp && (
                    <div className="px-4 pb-4 border-t border-[#E5E7EB] pt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Role</span><p className="font-bold text-[#111]">{emp.role}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Specialite</span><p className="font-bold text-[#111]">{emp.specialite}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Productivite</span><p className="font-bold text-[#111]">{emp.productivite}%</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Statut</span><p className="font-bold text-[#111]">{emp.statut}</p></div>
                      </div>
                      {emp.vehiculeActuel && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-2 text-[10px]">
                          <p className="font-bold text-green-700">En cours : {emp.vehiculeActuel} ({emp.plaqueActuel})</p>
                          <p className="text-green-600">{emp.tacheActuelle}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={(ev) => { ev.stopPropagation(); showToast(`Employe ${emp.nom} \u2014 fiche en modification`); }} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white">Modifier</button>
                        <button onClick={(e) => { e.stopPropagation(); showToast(`Historique interventions charge`); }} className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[10px] font-bold text-white">Historique</button>
                        <button onClick={(e) => { e.stopPropagation(); setTab("planning"); showToast("Planning atelier ouvert"); }} className="flex-1 rounded-lg bg-[#F5F3EF] py-1.5 text-[10px] font-bold text-slate-600">Planning</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━━ STOCK MAGASIN ━━━━━ */}
        {tab === "stock" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-[#111]">Stock magasin</h2>
              <div className="flex gap-1.5">
                <button className="rounded-lg bg-[#F5F3EF] px-2.5 py-1.5 text-[10px] font-bold text-slate-600 flex items-center gap-1"><Download size={10} /> Inventaire</button>
                <button className="rounded-lg bg-[#D4AF37] px-2.5 py-1.5 text-[10px] font-bold text-white flex items-center gap-1"><Plus size={10} /> Entree stock</button>
              </div>
            </div>

            {/* Alertes rupture */}
            {alertesStock > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-xs font-bold text-red-700">{alertesStock} alerte{alertesStock > 1 ? "s" : ""} rupture de stock</span>
                </div>
                {STOCK_MAGASIN.filter((s) => s.alerteRupture).map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-1 text-[10px]">
                    <span className="text-red-700 font-semibold">{s.nom} ({s.ref})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-bold">Stock: {s.qteActuelle} / Min: {s.qteMinimum}</span>
                      <button onClick={() => showToast(`Commande ${s.nom} envoyee a ${s.fournisseur}`)} className="rounded bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white">Commander</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filtres stock */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {["tous", "Freinage", "Filtration", "Allumage", "Distribution", "Suspension", "Liquides", "Lubrifiants", "Embrayage"].map((f) => (
                <button key={f} onClick={() => setStockFilter(f)} className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${stockFilter === f ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
                  {f === "tous" ? `Tous (${STOCK_MAGASIN.length})` : f}
                </button>
              ))}
            </div>

            {/* Liste stock */}
            {(stockFilter === "tous" ? STOCK_MAGASIN : STOCK_MAGASIN.filter((s) => s.categorie === stockFilter)).map((s) => {
              const isExp = selectedStock === s.id;
              return (
                <div key={s.id} className={`rounded-xl bg-white border overflow-hidden ${s.alerteRupture ? "border-red-300" : "border-[#E5E7EB]"}`}>
                  <button onClick={() => setSelectedStock(isExp ? null : s.id)} className="w-full text-left p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#111]">{s.nom}</p>
                        <p className="text-[10px] text-slate-400">{s.ref} — {s.categorie}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-bold ${s.alerteRupture ? "text-red-600" : s.qteActuelle <= s.qteMinimum ? "text-amber-600" : "text-green-600"}`}>{s.qteActuelle}</span>
                          <span className="text-[10px] text-slate-400">/ min {s.qteMinimum}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Reference</span><p className="font-bold text-[#111]">{s.ref}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Categorie</span><p className="font-bold text-[#111]">{s.categorie}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Prix achat</span><p className="font-bold text-[#111]">{s.prixAchat}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Prix vente</span><p className="font-bold text-[#111]">{s.prixVente}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Fournisseur</span><p className="font-bold text-[#111]">{s.fournisseur}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Dernier mouvement</span><p className="font-bold text-[#111]">{s.dernierMouvement}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setStockQtes(prev => ({ ...prev, [s.id]: (prev[s.id] ?? s.qteActuelle) + 1 })); showToast(`${s.nom} — +1 entree (total: ${(stockQtes[s.id] ?? s.qteActuelle) + 1})`); }} className="flex-1 rounded-lg bg-green-500 py-1.5 text-[10px] font-bold text-white flex items-center justify-center gap-1"><ArrowDown size={10} /> Entree</button>
                        <button onClick={(e) => { e.stopPropagation(); const cur = stockQtes[s.id] ?? s.qteActuelle; if (cur > 0) { setStockQtes(prev => ({ ...prev, [s.id]: cur - 1 })); showToast(`${s.nom} — -1 sortie (total: ${cur - 1})`); } else { showToast(`${s.nom} — stock a zero !`); } }} className="flex-1 rounded-lg bg-red-500 py-1.5 text-[10px] font-bold text-white flex items-center justify-center gap-1"><ArrowUp size={10} /> Sortie</button>
                        <button onClick={(e) => { e.stopPropagation(); showToast(`Commande ${s.nom} envoyee a ${s.fournisseur}`); }} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white">Commander</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━━ DEVIS ━━━━━ */}
        {tab === "devis" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#111]">Devis atelier</h2>
              <button className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1"><Plus size={12} /> Nouveau devis</button>
            </div>
            {DEVIS_ATELIER.map((d) => {
              const isExp = selectedDevis === d.id;
              return (
                <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setSelectedDevis(isExp ? null : d.id)} className="w-full text-left p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">{d.ref}</p>
                        <p className="text-sm font-bold text-[#111]">{d.vehicule} <span className="text-slate-400 font-normal">({d.plaque})</span></p>
                        <p className="text-xs text-slate-500">{d.objet}</p>
                        <p className="text-[10px] text-slate-400">Client: {d.client} — {d.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#D4AF37]">{d.montant}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${d.statut === "accepte" ? "bg-green-50 text-green-700" : d.statut === "refuse" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                          {d.statut === "accepte" ? "Accepte" : d.statut === "refuse" ? "Refuse" : "Envoye"}
                        </span>
                      </div>
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Vehicule</span><p className="font-bold text-[#111]">{d.vehicule}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Plaque</span><p className="font-bold text-[#111]">{d.plaque}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Client</span><p className="font-bold text-[#111]">{d.client}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Date</span><p className="font-bold text-[#111]">{d.date}</p></div>
                        <div className="col-span-2 rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Objet</span><p className="font-bold text-[#111]">{d.objet}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); showToast(`Devis ${d.ref} — modification en cours`); }} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white">Modifier</button>
                        <button onClick={(e) => { e.stopPropagation(); setDevisStatuts(prev => ({ ...prev, [d.id]: "accepte" })); showToast(`Devis ${d.ref} accepte !`); }} className="flex-1 rounded-lg bg-green-500 py-1.5 text-[10px] font-bold text-white">Accepter</button>
                        <button onClick={(e) => { e.stopPropagation(); showToast(`Devis ${d.ref} envoye a ${d.client}`); }} className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[10px] font-bold text-white">Envoyer</button>
                        <button onClick={(e) => { e.stopPropagation(); setModalDoc(buildDevisData({ ref: d.ref, type: d.objet, client: d.client, montant: d.montant, date: d.date, vehicule: d.vehicule })); }} className="flex-1 rounded-lg bg-[#F5F3EF] py-1.5 text-[10px] font-bold text-slate-600">PDF</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━━ FACTURES ━━━━━ */}
        {tab === "factures" && (
          <div className="space-y-2">
            {FACTURES_ATELIER.map((f) => {
              const isExp = selectedFacture === f.id;
              return (
                <div key={f.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setSelectedFacture(isExp ? null : f.id)} className="w-full text-left p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">{f.ref}</p>
                      <p className="text-sm font-bold text-[#111]">{f.vehicule}</p>
                      <p className="text-[10px] text-slate-400">{f.client} — {f.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#D4AF37]">{f.montant}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${f.statut === "payee" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{f.statut === "payee" ? "Payee" : "En attente"}</span>
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Reference</span><p className="font-bold text-[#111]">{f.ref}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Vehicule</span><p className="font-bold text-[#111]">{f.vehicule}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Client</span><p className="font-bold text-[#111]">{f.client}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Date</span><p className="font-bold text-[#111]">{f.date}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Montant</span><p className="font-bold text-[#D4AF37]">{f.montant}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Statut</span><p className={`font-bold ${f.statut === "payee" ? "text-green-700" : "text-amber-700"}`}>{f.statut === "payee" ? "Payee" : "En attente"}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setModalDoc(buildFactureData({ ref: f.ref, objet: `Prestation Atelier — ${f.vehicule}`, client: f.client, montant: f.montant, date: f.date, statut: f.statut, type: "Facture" })); }} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white flex items-center justify-center gap-1"><Download size={10} /> Voir PDF</button>
                        <button onClick={(e) => { e.stopPropagation(); showToast(`Relance paiement envoyee a ${f.client}`); }} className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[10px] font-bold text-white">Relancer paiement</button>
                        <button onClick={(e) => { e.stopPropagation(); setFactureStatuts(prev => ({ ...prev, [f.id]: "dupliquee" })); showToast(`Facture ${f.ref} dupliquee`); }} className="flex-1 rounded-lg bg-[#F5F3EF] py-1.5 text-[10px] font-bold text-slate-600">Dupliquer</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━━ CLIENTS ━━━━━ */}
        {tab === "clients" && (
          <div className="space-y-2">
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher un client..." className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 py-2.5 text-sm" />
            </div>
            {CLIENTS_ATELIER.map((c) => {
              const isExp = selectedClient === c.id;
              return (
                <div key={c.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setSelectedClient(isExp ? null : c.id)} className="w-full text-left p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#111]">{c.nom}</p>
                        <p className="text-xs text-slate-500">{c.vehicules} vehicule{c.vehicules > 1 ? "s" : ""} — {c.visites} visites</p>
                        <p className="text-[10px] text-slate-400">Derniere: {c.derniere} — Total: {c.total}</p>
                      </div>
                      <ChevronRight size={14} className={`text-slate-400 transition ${isExp ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Telephone</span><p className="font-bold text-[#111]">{c.tel}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Vehicules</span><p className="font-bold text-[#111]">{c.vehicules}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Visites total</span><p className="font-bold text-[#111]">{c.visites}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">CA total</span><p className="font-bold text-[#D4AF37]">{c.total}</p></div>
                        <div className="col-span-2 rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Derniere visite</span><p className="font-bold text-[#111]">{c.derniere}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <a href={`tel:${c.tel}`} className="flex-1 rounded-lg bg-green-500 py-1.5 text-[10px] font-bold text-white text-center">Appeler</a>
                        <button onClick={(e) => { e.stopPropagation(); showToast(`Historique ${c.nom} — ${c.visites} visites, CA ${c.total}`); }} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white">Historique</button>
                        <button onClick={(e) => { e.stopPropagation(); setTab("devis"); showToast(`Nouveau devis pour ${c.nom}`); }} className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[10px] font-bold text-white">Nouveau devis</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━━ VEHICULES ━━━━━ */}
        {tab === "vehicules" && (
          <div className="space-y-2">
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Rechercher par plaque, VIN, marque..." className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 py-2.5 text-sm" />
              </div>
              <button onClick={() => setShowNewVehicle(!showNewVehicle)} className="shrink-0 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-white flex items-center gap-1"><Plus size={14} /> Nouveau</button>
            </div>

            {showNewVehicle && (
              <div className="rounded-xl bg-white border-2 border-[#D4AF37] p-4 space-y-3">
                <h4 className="text-sm font-bold text-[#111] flex items-center gap-2"><Car size={16} className="text-[#D4AF37]" /> Enregistrer un nouveau vehicule</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Plaque (ex: AB-123-CD)" value={newVehForm.plaque} onChange={(e) => setNewVehForm({ ...newVehForm, plaque: e.target.value.toUpperCase() })} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs bg-[#F5F3EF]" />
                  <input placeholder="VIN (17 caracteres)" value={newVehForm.vin} onChange={(e) => setNewVehForm({ ...newVehForm, vin: e.target.value.toUpperCase() })} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs bg-[#F5F3EF]" />
                  <input placeholder="Marque" value={newVehForm.marque} onChange={(e) => setNewVehForm({ ...newVehForm, marque: e.target.value })} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs bg-[#F5F3EF]" />
                  <input placeholder="Modele" value={newVehForm.modele} onChange={(e) => setNewVehForm({ ...newVehForm, modele: e.target.value })} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs bg-[#F5F3EF]" />
                  <input placeholder="Annee" type="number" value={newVehForm.annee} onChange={(e) => setNewVehForm({ ...newVehForm, annee: e.target.value })} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs bg-[#F5F3EF]" />
                  <input placeholder="Kilometrage" type="number" value={newVehForm.km} onChange={(e) => setNewVehForm({ ...newVehForm, km: e.target.value })} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs bg-[#F5F3EF]" />
                  <input placeholder="Nom du client" value={newVehForm.client} onChange={(e) => setNewVehForm({ ...newVehForm, client: e.target.value })} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs bg-[#F5F3EF]" />
                  <input placeholder="Telephone client" value={newVehForm.tel} onChange={(e) => setNewVehForm({ ...newVehForm, tel: e.target.value })} className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs bg-[#F5F3EF]" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    if (!newVehForm.plaque || !newVehForm.marque || !newVehForm.modele) { showToast("Plaque, marque et modele obligatoires"); return; }
                    const nv = { id: 100 + extraVehicules.length, plaque: newVehForm.plaque, marque: newVehForm.marque, modele: newVehForm.modele, annee: newVehForm.annee || "2024", km: newVehForm.km || "0", vin: newVehForm.vin || "VIN-" + newVehForm.plaque, client: newVehForm.client || "—", derniereVisite: "Nouveau" };
                    setExtraVehicules([nv, ...extraVehicules]);
                    setNewVehForm({ plaque: "", vin: "", marque: "", modele: "", annee: "", km: "", client: "", tel: "" });
                    setShowNewVehicle(false);
                    showToast(`${newVehForm.marque} ${newVehForm.modele} (${newVehForm.plaque}) enregistre avec succes !`);
                  }} className="flex-1 rounded-lg bg-[#D4AF37] py-2 text-xs font-bold text-white">Enregistrer le vehicule</button>
                  <button onClick={() => setShowNewVehicle(false)} className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Annuler</button>
                </div>
              </div>
            )}

            {[...extraVehicules, ...VEHICULES_ATELIER].map((v) => {
              const isExp = selectedVehAtelier === v.id;
              return (
                <div key={v.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setSelectedVehAtelier(isExp ? null : v.id)} className="w-full text-left p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#111]">{v.marque} {v.modele}</p>
                        <p className="text-xs text-slate-500">{v.plaque} — {v.annee} — {v.km} km</p>
                        <p className="text-[10px] text-slate-400">Client: {v.client} — VIN: {v.vin.slice(0, 11)}...</p>
                      </div>
                      <ChevronRight size={14} className={`text-slate-400 transition ${isExp ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Marque</span><p className="font-bold text-[#111]">{v.marque}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Modele</span><p className="font-bold text-[#111]">{v.modele}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Plaque</span><p className="font-bold text-[#111]">{v.plaque}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Annee</span><p className="font-bold text-[#111]">{v.annee}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Kilometrage</span><p className="font-bold text-[#111]">{v.km} km</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Client</span><p className="font-bold text-[#111]">{v.client}</p></div>
                        <div className="col-span-2 rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">VIN complet</span><p className="font-bold text-[#111]">{v.vin}</p></div>
                        <div className="col-span-2 rounded-lg bg-[#F5F3EF] p-2"><span className="text-slate-400">Derniere visite</span><p className="font-bold text-[#111]">{v.derniereVisite}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <Link to="/catalogue-technique" className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white text-center">Catalogue technique</Link>
                        <button onClick={(e) => { e.stopPropagation(); showToast(`Historique ${v.marque} ${v.modele} (${v.plaque}) — derniere visite ${v.derniereVisite}`); }} className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[10px] font-bold text-white">Historique</button>
                        <button onClick={(e) => { e.stopPropagation(); setTab("devis"); showToast(`Nouveau devis pour ${v.marque} ${v.modele}`); }} className="flex-1 rounded-lg bg-green-500 py-1.5 text-[10px] font-bold text-white">Nouveau devis</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━━ CATALOGUE TECHNIQUE ━━━━━ */}
        {tab === "catalogue" && (
          <div className="text-center py-8">
            <Search size={40} className="mx-auto text-[#D4AF37]" />
            <h3 className="mt-3 text-sm font-bold text-[#111]">Catalogue technique AutoData</h3>
            <p className="mt-1 text-xs text-slate-500">26 systemes, couples de serrage, temps baremes, outils speciaux, pieces cliquables</p>
            <Link to="/catalogue-technique" className="mt-4 inline-flex rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white">Ouvrir le catalogue</Link>
          </div>
        )}

        {/* ━━━━━ PIECES ━━━━━ */}
        {tab === "pieces" && (
          <div className="text-center py-8">
            <ShoppingBag size={40} className="mx-auto text-[#D4AF37]" />
            <h3 className="mt-3 text-sm font-bold text-[#111]">Pieces detachees</h3>
            <p className="mt-1 text-xs text-slate-500">Recherche par reference, commande fournisseur, integration devis</p>
            <Link to="/catalogue-technique" className="mt-4 inline-flex rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white">Rechercher une piece</Link>
          </div>
        )}
      </div>

      {viewDevisPDF && (
        <DocumentView
          doc={buildDevisData({ type: "Reparation", garage: "Atelier Pro MKA.P-MS", montant: viewDevisPDF.montant, date: viewDevisPDF.date, vehicule: viewDevisPDF.vehicule, client: viewDevisPDF.client, ref: viewDevisPDF.ref })}
          onClose={() => setViewDevisPDF(null)}
        />
      )}
      {viewFacturePDF && (
        <DocumentView
          doc={buildFactureData({ ref: viewFacturePDF.ref, objet: `Reparation ${viewFacturePDF.vehicule}`, client: viewFacturePDF.client, montant: viewFacturePDF.montant, date: viewFacturePDF.date, statut: viewFacturePDF.statut === "payee" ? "Paye" : "En attente", type: "Atelier" })}
          onClose={() => setViewFacturePDF(null)}
        />
      )}
      {viewOrdrePDF && (
        <DocumentView
          doc={buildDevisData({ type: "Ordre de Reparation", garage: "Atelier Pro MKA.P-MS", montant: viewOrdrePDF.montant, date: viewOrdrePDF.dateEntree, vehicule: `${viewOrdrePDF.vehicule} — ${viewOrdrePDF.plaque}`, client: viewOrdrePDF.client, ref: viewOrdrePDF.ref })}
          onClose={() => setViewOrdrePDF(null)}
        />
      )}
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] animate-[fadeIn_0.3s_ease] pointer-events-auto">
          <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-xl flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400 shrink-0" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-white/40 hover:text-white">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
