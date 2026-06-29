import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, BarChart3, TrendingUp, TrendingDown, Euro, CreditCard,
  Users, Clock, Bell, AlertTriangle, CheckCircle, Eye, Download,
  Car, Key, Wrench, Gavel, Megaphone, FileText, Calendar,
  Target, Award, Shield, ArrowUp, ArrowDown, UserCheck,
  X, Edit3, Trash2, Ban, Phone, Mail, MapPin, Briefcase,
  ShieldCheck, Star, Receipt, Search, Filter, Printer, Send
} from "lucide-react";
import { DocumentView, buildFactureData } from "../components/DocumentPDF";

/* ══════════════════════════════════════════════════════════════════════════
   COMPTABILITE MKA.P-MS — TABLEAU DE BORD DIRIGEANT
   CA par univers, suivi financier, employes, alertes automatiques.
   Le PDG pilote toute l'activite depuis un seul tableau de bord.
   ══════════════════════════════════════════════════════════════════════════ */

type CompTab = "ca" | "finances" | "employes" | "alertes";

/* ---------- data types ---------- */
interface Transaction { id: string; objet: string; montant: string; date: string; client: string; ref: string; statut: string; }
interface UniversData {
  univers: string; icon: typeof Car; ca: string; pct: string; up: boolean; color: string; bg: string;
  transactions: number; barWidth: string;
  details: Transaction[];
  commissionRate: string; commissionTotal: string;
}
interface Employe {
  nom: string; poste: string; heuresM: string; presence: string; taches: number; perf: number;
  statut: string; salaire: string; anciennete: string; contact: string; email: string; adresse: string;
  dateEmbauche: string; services: string[];
}
interface Alerte {
  type: string; titre: string; desc: string; date: string; icon: typeof AlertTriangle;
  color: string; bg: string; border: string; action: string; detail: string;
  client?: string; montant?: string; ref?: string; echeance?: string;
}

/* ---------- static data ---------- */
const UNIVERS_DATA: UniversData[] = [
  {
    univers: "Vente", icon: Car, ca: "142 500 EUR", pct: "+8.2%", up: true, color: "text-blue-600", bg: "bg-blue-50",
    transactions: 47, barWidth: "85%", commissionRate: "3%", commissionTotal: "8 520 EUR",
    details: [
      { id: "V1", objet: "Peugeot 3008 GT", montant: "+28 500 EUR", date: "09/06/2025", client: "Martin D.", ref: "FA-2025-0412", statut: "Recu" },
      { id: "V2", objet: "BMW Serie 3 320d", montant: "+24 800 EUR", date: "08/06/2025", client: "Sophie L.", ref: "FA-2025-0408", statut: "Recu" },
      { id: "V3", objet: "Renault Clio V", montant: "+15 900 EUR", date: "07/06/2025", client: "Ahmed K.", ref: "FA-2025-0405", statut: "Recu" },
      { id: "V4", objet: "Mercedes Classe A", montant: "+32 400 EUR", date: "06/06/2025", client: "Pierre M.", ref: "FA-2025-0401", statut: "En attente" },
      { id: "V5", objet: "Volkswagen Golf 8", montant: "+22 100 EUR", date: "05/06/2025", client: "Fatima A.", ref: "FA-2025-0398", statut: "Recu" },
    ],
  },
  {
    univers: "Location", icon: Key, ca: "68 200 EUR", pct: "+15.1%", up: true, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10",
    transactions: 156, barWidth: "65%", commissionRate: "5%", commissionTotal: "4 260 EUR",
    details: [
      { id: "L1", objet: "Mercedes E Break — 7j", montant: "+1 350 EUR", date: "09/06/2025", client: "Sophie L.", ref: "LO-2025-0189", statut: "Recu" },
      { id: "L2", objet: "BMW X3 — 14j", montant: "+2 100 EUR", date: "08/06/2025", client: "Thomas R.", ref: "LO-2025-0187", statut: "Recu" },
      { id: "L3", objet: "Citroen C3 — 3j", montant: "+180 EUR", date: "07/06/2025", client: "Nadia B.", ref: "LO-2025-0185", statut: "En attente" },
    ],
  },
  {
    univers: "Garage", icon: Wrench, ca: "34 800 EUR", pct: "+22.3%", up: true, color: "text-green-600", bg: "bg-green-50",
    transactions: 89, barWidth: "42%", commissionRate: "4%", commissionTotal: "1 392 EUR",
    details: [
      { id: "G1", objet: "Revision complete Audi A4", montant: "+890 EUR", date: "09/06/2025", client: "Jean-Pierre D.", ref: "GR-2025-0156", statut: "Recu" },
      { id: "G2", objet: "Changement freins Tesla Model 3", montant: "+920 EUR", date: "08/06/2025", client: "Thomas R.", ref: "GR-2025-0154", statut: "Recu" },
      { id: "G3", objet: "Diagnostique BMW 530", montant: "+120 EUR", date: "07/06/2025", client: "Karim S.", ref: "GR-2025-0152", statut: "En attente" },
    ],
  },
  {
    univers: "Encheres", icon: Gavel, ca: "28 950 EUR", pct: "+5.7%", up: true, color: "text-purple-600", bg: "bg-purple-50",
    transactions: 12, barWidth: "35%", commissionRate: "5%", commissionTotal: "2 130 EUR",
    details: [
      { id: "E1", objet: "Porsche 911 Carrera (enchere)", montant: "+45 000 EUR", date: "08/06/2025", client: "Pierre K.", ref: "EN-2025-0012", statut: "Recu" },
      { id: "E2", objet: "Audi RS6 (enchere)", montant: "+38 000 EUR", date: "05/06/2025", client: "Marc D.", ref: "EN-2025-0011", statut: "Recu" },
    ],
  },
  {
    univers: "Publicite", icon: Megaphone, ca: "13 000 EUR", pct: "-3.2%", up: false, color: "text-orange-600", bg: "bg-orange-50",
    transactions: 34, barWidth: "18%", commissionRate: "10%", commissionTotal: "1 300 EUR",
    details: [
      { id: "P1", objet: "Boost Premium Annonce #142", montant: "+29 EUR", date: "09/06/2025", client: "Pierre K.", ref: "PUB-2025-0042", statut: "Recu" },
      { id: "P2", objet: "Banniere Top page — 30j", montant: "+450 EUR", date: "07/06/2025", client: "Auto Express", ref: "PUB-2025-0041", statut: "Recu" },
    ],
  },
];

const EMPLOYES: Employe[] = [
  { nom: "Karim M.", poste: "Mecanicien senior — Atelier", heuresM: "168h", presence: "98%", taches: 34, perf: 92, statut: "present", salaire: "2 800", anciennete: "4 ans", contact: "06 12 34 56 78", email: "karim.m@mkapms.co", adresse: "12 rue de la Paix, 93100 Montreuil", dateEmbauche: "01/06/2021", services: ["Vidange", "Freins", "Distribution", "Diagnostic"] },
  { nom: "Youssef B.", poste: "Mecanicien — Atelier", heuresM: "155h", presence: "95%", taches: 28, perf: 85, statut: "present", salaire: "2 200", anciennete: "2 ans", contact: "06 23 45 67 89", email: "youssef.b@mkapms.co", adresse: "34 av. de la Republique, 93100 Montreuil", dateEmbauche: "15/03/2023", services: ["Pneus", "Geometrie", "Freins"] },
  { nom: "Omar L.", poste: "Mecanicien — Atelier", heuresM: "142h", presence: "90%", taches: 22, perf: 78, statut: "present", salaire: "2 000", anciennete: "1 an", contact: "06 34 56 78 90", email: "omar.l@mkapms.co", adresse: "56 bd Voltaire, 75011 Paris", dateEmbauche: "01/06/2024", services: ["Vidange", "Pneus"] },
  { nom: "Sarah K.", poste: "Responsable location", heuresM: "160h", presence: "97%", taches: 45, perf: 94, statut: "present", salaire: "3 200", anciennete: "5 ans", contact: "06 45 67 89 01", email: "sarah.k@mkapms.co", adresse: "78 rue de Rivoli, 75004 Paris", dateEmbauche: "01/01/2020", services: ["Location courte", "Location longue", "Fleet"] },
  { nom: "Mohamed A.", poste: "Commercial vente", heuresM: "162h", presence: "96%", taches: 38, perf: 88, statut: "present", salaire: "2 600", anciennete: "3 ans", contact: "06 56 78 90 12", email: "mohamed.a@mkapms.co", adresse: "90 rue de Bagnolet, 75020 Paris", dateEmbauche: "01/09/2022", services: ["Vente VO", "Estimation", "Reprise"] },
  { nom: "Fatima B.", poste: "Comptabilite", heuresM: "158h", presence: "99%", taches: 52, perf: 96, statut: "present", salaire: "2 900", anciennete: "6 ans", contact: "06 67 89 01 23", email: "fatima.b@mkapms.co", adresse: "23 rue des Lilas, 93260 Les Lilas", dateEmbauche: "01/01/2019", services: ["Facturation", "TVA", "Paie", "Rapports"] },
  { nom: "Rachid T.", poste: "Apprenti mecanicien", heuresM: "130h", presence: "88%", taches: 15, perf: 65, statut: "present", salaire: "1 200", anciennete: "6 mois", contact: "06 78 90 12 34", email: "rachid.t@mkapms.co", adresse: "45 rue Oberkampf, 75011 Paris", dateEmbauche: "01/12/2024", services: ["Vidange", "Pneus"] },
  { nom: "Amina D.", poste: "Accueil / Administration", heuresM: "160h", presence: "100%", taches: 40, perf: 91, statut: "conge", salaire: "2 400", anciennete: "3 ans", contact: "06 89 01 23 45", email: "amina.d@mkapms.co", adresse: "67 rue de Menilmontant, 75020 Paris", dateEmbauche: "01/06/2022", services: ["Accueil", "Planning", "RH"] },
];

const ALERTES: Alerte[] = [
  { type: "urgent", titre: "Facture impayee — Garage Premium", desc: "Facture FA-2025-0310 de 1 580 EUR en attente depuis 3 jours. Client: Jean-Pierre D.", date: "Il y a 3 jours", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", action: "Relancer le client", detail: "Montant: 1 580 EUR · Echeance: 06/06/2025 · 2eme relance envoyee", client: "Jean-Pierre D.", montant: "1 580 EUR", ref: "FA-2025-0310", echeance: "06/06/2025" },
  { type: "urgent", titre: "Abonnement expire — Pro Vente", desc: "L'abonnement Pro Premium de Garage Auto 93 a expire le 07/06. Pas de renouvellement.", date: "Il y a 2 jours", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", action: "Contacter le client", detail: "Plan: Pro Premium (89 EUR/mois) · Derniere connexion: 05/06/2025", client: "Garage Auto 93", montant: "89 EUR/mois", ref: "AB-PRO-0093" },
  { type: "info", titre: "Paiement recu — 28 500 EUR", desc: "Virement recu pour l'achat de la Peugeot 3008 GT par Martin D.", date: "Il y a 1 jour", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", action: "Voir la transaction", detail: "Ref: FA-2025-0412 · Methode: Virement SEPA · Delai: 2 jours", client: "Martin D.", montant: "28 500 EUR", ref: "FA-2025-0412" },
  { type: "info", titre: "Objectif mensuel atteint — Location", desc: "Objectif de 65 000 EUR atteint pour la Location. Actuel: 68 200 EUR (+105%).", date: "Il y a 1 jour", icon: Target, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", border: "border-[#D4AF37]/30", action: "Voir le rapport", detail: "Objectif: 65 000 EUR · Realise: 68 200 EUR · +4.9% vs mois dernier" },
  { type: "warning", titre: "Anomalie financiere detectee", desc: "Double facturation detectee sur le compte de Sophie L. — 2 factures identiques de 780 EUR.", date: "Aujourd'hui", icon: Shield, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", action: "Verifier et corriger", detail: "Client: Sophie L. · Ref doublons: FA-0389 & FA-0390 · Total: 1 560 EUR", client: "Sophie L.", montant: "1 560 EUR", ref: "FA-0389 & FA-0390" },
  { type: "info", titre: "Nouvel abonne — Atelier Pro", desc: "Garage Meca Plus (Montreuil) a souscrit a l'option Atelier Pro Premium (89 EUR/mois).", date: "Aujourd'hui", icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", action: "Voir le compte", detail: "Garage Meca Plus · SIRET: 891 234 567 · Plan: Atelier Premium", client: "Garage Meca Plus" },
  { type: "warning", titre: "Stock critique — 3 articles", desc: "Courroie distribution Gates, Amortisseur AR Monroe, Kit embrayage Valeo en rupture.", date: "Aujourd'hui", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", action: "Commander", detail: "3 refs en rupture · Delai reappro: 48h · Commande auto possible" },
  { type: "info", titre: "Paiement recu — 920 EUR", desc: "CB recu pour la reparation Tesla Model 3 (pneus + geometrie) par Thomas R.", date: "Hier", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", action: "Voir la facture", detail: "Ref: FA-2025-0410 · Methode: CB · Montant: 920 EUR", client: "Thomas R.", montant: "920 EUR", ref: "FA-2025-0410" },
];

const PAIEMENTS = [
  { objet: "Vente Peugeot 3008 GT", montant: "+28 500 EUR", date: "09/06/2025", statut: "Recu", type: "vente", client: "Martin D.", ref: "FA-2025-0412", methode: "Virement SEPA", delai: "2 jours" },
  { objet: "Location Mercedes E Break", montant: "+1 350 EUR", date: "08/06/2025", statut: "Recu", type: "location", client: "Sophie L.", ref: "FA-2025-0411", methode: "CB", delai: "Immediat" },
  { objet: "Abonnement Pro Premium x12", montant: "+1 068 EUR", date: "07/06/2025", statut: "Recu", type: "abo", client: "Garage Auto 93", ref: "AB-2025-0089", methode: "Prelevement SEPA", delai: "1 jour" },
  { objet: "Devis Garage Auto Express", montant: "+389 EUR", date: "06/06/2025", statut: "En attente", type: "garage", client: "Auto Express", ref: "DV-2025-0156", methode: "CB en attente", delai: "—" },
  { objet: "Boost Premium Annonce #142", montant: "+29 EUR", date: "06/06/2025", statut: "Recu", type: "pub", client: "Pierre K.", ref: "PUB-2025-0042", methode: "CB", delai: "Immediat" },
  { objet: "Remboursement reservation", montant: "-50 EUR", date: "05/06/2025", statut: "Traite", type: "remb", client: "Ahmed M.", ref: "RB-2025-0008", methode: "Virement", delai: "3 jours" },
];

const ABONNEMENTS = [
  { plan: "Pro Vente Premium", abonnes: 45, revenu: "4 005 EUR/mois", taux: "99%", dernier: "09/06/2025", prix: "89 EUR", clients: ["Garage Auto 93", "Auto Express", "Meca Plus", "Pierre K."] },
  { plan: "Pro Vente Elite", abonnes: 12, revenu: "2 148 EUR/mois", taux: "100%", dernier: "08/06/2025", prix: "179 EUR", clients: ["Top Auto", "Prestige Motors"] },
  { plan: "Location Pro", abonnes: 67, revenu: "5 963 EUR/mois", taux: "97%", dernier: "09/06/2025", prix: "89 EUR", clients: ["Rent Express", "Auto Loc 93"] },
  { plan: "Garage Pro Premium", abonnes: 34, revenu: "3 026 EUR/mois", taux: "98%", dernier: "07/06/2025", prix: "89 EUR", clients: ["Garage Central", "Meca Pro"] },
  { plan: "Atelier Pro", abonnes: 28, revenu: "2 492 EUR/mois", taux: "100%", dernier: "06/06/2025", prix: "89 EUR", clients: ["Atelier 93", "Express Meca"] },
  { plan: "Encheres Pro", abonnes: 15, revenu: "735 EUR/mois", taux: "93%", dernier: "08/06/2025", prix: "49 EUR", clients: ["Enchere Auto"] },
  { plan: "Comptabilite Pro", abonnes: 22, revenu: "1 298 EUR/mois", taux: "95%", dernier: "07/06/2025", prix: "59 EUR", clients: ["Cabinet Martin"] },
  { plan: "Carrosserie Pro", abonnes: 18, revenu: "1 062 EUR/mois", taux: "100%", dernier: "09/06/2025", prix: "59 EUR", clients: ["Carrosserie Express"] },
];

/* ================================================================ */

export default function ComptaDirigeant() {
  const [tab, setTab] = useState<CompTab>("ca");
  const [periode, setPeriode] = useState<"jour" | "semaine" | "mois" | "annee">("mois");
  const [expandedUnivers, setExpandedUnivers] = useState<string | null>(null);
  const [expandedFinance, setExpandedFinance] = useState<string | null>(null);
  const [expandedEmploye, setExpandedEmploye] = useState<number | null>(null);
  const [expandedAlerte, setExpandedAlerte] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  /* -------- modals -------- */
  const [modalCA, setModalCA] = useState<UniversData | null>(null);
  const [modalTransaction, setModalTransaction] = useState<Transaction | null>(null);
  const [modalCommission, setModalCommission] = useState(false);
  const [modalPaiement, setModalPaiement] = useState<typeof PAIEMENTS[0] | null>(null);
  const [modalAbonnes, setModalAbonnes] = useState<typeof ABONNEMENTS[0] | null>(null);
  const [modalEmploye, setModalEmploye] = useState<Employe | null>(null);
  const [modalEditEmploye, setModalEditEmploye] = useState<Employe | null>(null);
  const [modalAlerte, setModalAlerte] = useState<Alerte | null>(null);
  const [viewFactureAlerte, setViewFactureAlerte] = useState<Alerte | null>(null);
  const [modalFinanceCard, setModalFinanceCard] = useState<{ label: string; montant: string; detail: string; pct: string; color: string } | null>(null);
  const [editSalaire, setEditSalaire] = useState("");
  const [editPoste, setEditPoste] = useState("");

  const [searchEmploye, setSearchEmploye] = useState("");
  const filteredEmployes = EMPLOYES.filter(e =>
    e.nom.toLowerCase().includes(searchEmploye.toLowerCase()) ||
    e.poste.toLowerCase().includes(searchEmploye.toLowerCase())
  );

  /* -------- modal overlay -------- */
  const Overlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-[#F5F3EF] grid place-items-center"><X size={16} /></button>
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* ========= HEADER ========= */}
      <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Tableau de bord dirigeant</h1>
        <p className="mt-0.5 text-sm text-white/60">Pilotez toute l'activite MKA.P-MS</p>

        <div className="mt-4 rounded-xl bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Chiffre d'affaires total</p>
              <p className="text-2xl font-black text-[#D4AF37]">287 450 EUR</p>
              <p className="text-xs text-green-400 flex items-center gap-1"><TrendingUp size={12} /> +12.4% vs mois precedent</p>
            </div>
            <div className="flex gap-1">
              {(["jour", "semaine", "mois", "annee"] as const).map((p) => (
                <button key={p} onClick={() => setPeriode(p)} className={`rounded-lg px-2 py-1 text-[9px] font-bold ${periode === p ? "bg-[#D4AF37] text-white" : "bg-white/10 text-white/50"}`}>
                  {p === "jour" ? "J" : p === "semaine" ? "S" : p === "mois" ? "M" : "A"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========= TABS ========= */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {([
          { id: "ca" as CompTab, label: "Chiffre d'affaires", icon: Euro },
          { id: "finances" as CompTab, label: "Suivi financier", icon: CreditCard },
          { id: "employes" as CompTab, label: "Employes", icon: Users },
          { id: "alertes" as CompTab, label: "Alertes", icon: Bell },
        ]).map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-4">
        {/* ━━━━━━━━━━━━━━━ CA PAR UNIVERS ━━━━━━━━━━━━━━━ */}
        {tab === "ca" && (
          <div className="space-y-3">
            {UNIVERS_DATA.map((u) => {
              const Icon = u.icon;
              const isExp = expandedUnivers === u.univers;
              return (
                <div key={u.univers} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                  <button onClick={() => setExpandedUnivers(isExp ? null : u.univers)} className="w-full text-left p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-10 w-10 rounded-lg ${u.bg} grid place-items-center`}>
                          <Icon size={18} className={u.color} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111]">{u.univers}</p>
                          <p className="text-[10px] text-slate-400">{u.transactions} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-[#111]">{u.ca}</p>
                        <p className={`text-[10px] font-bold flex items-center gap-0.5 justify-end ${u.up ? "text-green-600" : "text-red-500"}`}>
                          {u.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {u.pct}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${u.color.replace("text-", "bg-")}`} style={{ width: u.barWidth }} />
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-4 pb-4 border-t border-[#E5E7EB] pt-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <button onClick={() => setModalCA(u)} className="rounded-lg bg-[#F5F3EF] p-2 text-center active:scale-95 transition"><span className="text-slate-400">Transactions</span><p className="font-bold text-[#111]">{u.transactions}</p></button>
                        <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><span className="text-slate-400">Evolution</span><p className={`font-bold ${u.up ? "text-green-600" : "text-red-500"}`}>{u.pct}</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><span className="text-slate-400">Commission</span><p className="font-bold text-[#D4AF37]">{u.commissionTotal}</p></div>
                      </div>
                      {/* dernières transactions */}
                      <div className="rounded-lg border border-[#E5E7EB] overflow-hidden">
                        <div className="bg-[#F5F3EF] px-2 py-1"><p className="text-[9px] font-bold text-slate-500">Dernieres transactions</p></div>
                        {u.details.slice(0, 3).map(t => (
                          <button key={t.id} onClick={() => setModalTransaction(t)} className="w-full flex items-center justify-between px-2 py-1.5 border-b border-[#F3F4F6] last:border-0 text-left active:bg-[#F5F3EF] transition">
                            <div>
                              <p className="text-[10px] font-bold text-[#111]">{t.objet}</p>
                              <p className="text-[8px] text-slate-400">{t.client} · {t.date}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-[10px] font-bold ${t.montant.startsWith("-") ? "text-red-500" : "text-green-600"}`}>{t.montant}</p>
                              <span className={`text-[7px] font-bold ${t.statut === "Recu" ? "text-green-600" : "text-amber-600"}`}>{t.statut}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setModalCA(u)} className="w-full rounded-lg bg-[#111] py-2 text-[10px] font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.98] transition"><Eye size={12} /> Voir toutes les transactions {u.univers}</button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Commissions plateforme */}
            <button onClick={() => setModalCommission(true)} className="w-full rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-left active:scale-[0.99] transition">
              <h3 className="text-xs font-bold text-[#D4AF37] mb-2">Commissions plateforme — cliquez pour details</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-lg font-black text-white">8 520 EUR</p><p className="text-[8px] text-white/50">Commission vente (3%)</p></div>
                <div><p className="text-lg font-black text-white">4 260 EUR</p><p className="text-[8px] text-white/50">Commission location (5%)</p></div>
                <div><p className="text-lg font-black text-white">2 130 EUR</p><p className="text-[8px] text-white/50">Commission encheres (5%)</p></div>
              </div>
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━ SUIVI FINANCIER ━━━━━━━━━━━━━━━ */}
        {tab === "finances" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "recus", label: "Paiements recus", montant: "198 450 EUR", icon: ArrowDown, color: "text-green-600", bg: "bg-green-50", detail: "48 transactions ce mois · Moyenne 4 134 EUR", pct: "+12% vs mois dernier" },
                { id: "attente", label: "Paiements en attente", montant: "42 300 EUR", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", detail: "6 transactions en cours · Max 28 500 EUR", pct: "Delai moyen 3.2 jours" },
                { id: "rembours", label: "Remboursements", montant: "3 800 EUR", icon: ArrowUp, color: "text-red-500", bg: "bg-red-50", detail: "4 remboursements traites · Taux 1.9%", pct: "-0.3% vs mois dernier" },
                { id: "abos", label: "Abonnements actifs", montant: "24 680 EUR/mois", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50", detail: "312 abonnes actifs · 8 nouveaux", pct: "+5% ce mois" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <button key={c.id} onClick={() => setModalFinanceCard({ label: c.label, montant: c.montant, detail: c.detail, pct: c.pct, color: c.color.replace("text-", "") })} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden text-left active:scale-[0.97] transition">
                    <div className="p-3">
                      <div className={`h-8 w-8 rounded-lg ${c.bg} grid place-items-center mb-2`}>
                        <Icon size={14} className={c.color} />
                      </div>
                      <p className="text-[10px] text-slate-400">{c.label}</p>
                      <p className="text-sm font-black text-[#111]">{c.montant}</p>
                      <p className={`text-[9px] font-bold mt-0.5 ${c.color}`}>{c.pct}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Derniers paiements */}
            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
	              <div className="bg-[#111] px-3 py-2 flex items-center justify-between">
	                <h3 className="text-xs font-bold text-[#D4AF37]">Derniers paiements</h3>
	                <button 
                    onClick={() => setModalDoc(buildFactureData({ ref: "REP-VENTE-2025", client: "Direction MKA", montant: "Rapport Global", date: "09/06/2025", statut: "Généré" }))}
                    className="text-[9px] text-white/50 flex items-center gap-1 hover:text-white"
                  >
                    <Eye size={10} /> Voir Rapport
                  </button>
	              </div>
	              {PAIEMENTS.map((p, i) => (
	                <button 
                    key={i} 
                    onClick={() => setModalDoc(buildFactureData({ ref: p.ref, client: p.client, montant: p.montant, date: p.date, statut: p.statut === "Recu" ? "Payée" : "En attente" }))}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left border-b border-[#F3F4F6] last:border-0 active:bg-[#F5F3EF] transition"
                  >
                  <div>
                    <p className="text-xs font-bold text-[#111]">{p.objet}</p>
                    <p className="text-[10px] text-slate-400">{p.client} · {p.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${p.montant.startsWith("-") ? "text-red-500" : "text-green-600"}`}>{p.montant}</p>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${p.statut === "Recu" ? "bg-green-50 text-green-700" : p.statut === "En attente" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{p.statut}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Abonnements actifs */}
            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#D4AF37]">Abonnements actifs</h3>
                <span className="text-[10px] text-white/50">312 abonnes</span>
              </div>
              {ABONNEMENTS.map((a, i) => (
                <button key={i} onClick={() => setModalAbonnes(a)} className="w-full flex items-center justify-between px-3 py-2 text-left border-b border-[#F3F4F6] last:border-0 active:bg-[#F5F3EF] transition">
                  <div>
                    <p className="text-xs font-bold text-[#111]">{a.plan}</p>
                    <p className="text-[10px] text-slate-400">{a.abonnes} abonnes · {a.prix}/mois</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#D4AF37]">{a.revenu}</p>
                    <span className="text-[9px] text-green-600">{a.taux} renouvl.</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━ EMPLOYES ━━━━━━━━━━━━━━━ */}
        {tab === "employes" && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Total", val: "28", color: "text-[#D4AF37]" },
                { label: "Presents", val: "24", color: "text-green-600" },
                { label: "Absents", val: "2", color: "text-red-500" },
                { label: "Conges", val: "2", color: "text-blue-500" },
              ].map((s) => (
                <button key={s.label} onClick={() => showToast(`${s.label}: ${s.val} employes`)} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center hover:shadow-md transition active:scale-[0.97]">
                  <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                  <p className="text-[9px] text-slate-400">{s.label}</p>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchEmploye} onChange={e => setSearchEmploye(e.target.value)} placeholder="Rechercher un employe..." className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 py-2 text-xs text-[#111] placeholder:text-slate-400" />
            </div>

            {filteredEmployes.map((e, i) => {
              const isExp = expandedEmploye === i;
              return (
                <div key={i} className={`rounded-xl bg-white border overflow-hidden ${e.statut === "present" ? "border-[#E5E7EB]" : e.statut === "conge" ? "border-blue-200" : "border-red-200"}`}>
                  <button onClick={() => setExpandedEmploye(isExp ? null : i)} className="w-full text-left p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#111] flex items-center gap-2">
                          {e.nom}
                          <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${e.statut === "present" ? "bg-green-50 text-green-700" : e.statut === "conge" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
                            {e.statut === "present" ? "Present" : e.statut === "conge" ? "Conge" : "Absent"}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">{e.poste}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${e.perf >= 90 ? "text-green-600" : e.perf >= 75 ? "text-amber-600" : "text-red-500"}`}>{e.perf}%</p>
                        <p className="text-[9px] text-slate-400">performance</p>
                      </div>
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="font-bold text-[#111]">{e.heuresM}</p><p className="text-slate-400">Heures/mois</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="font-bold text-[#111]">{e.presence}</p><p className="text-slate-400">Presence</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="font-bold text-[#111]">{e.taches}</p><p className="text-slate-400">Taches/mois</p></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="font-bold text-[#D4AF37]">{e.salaire} EUR</p><p className="text-slate-400">Salaire</p></div>
                        <div className="rounded-lg bg-[#F5F3EF] p-1.5"><p className="font-bold text-[#111]">{e.anciennete}</p><p className="text-slate-400">Anciennete</p></div>
                        <button onClick={() => { window.location.href = `tel:${e.contact.replace(/ /g, '')}`; }} className="rounded-lg bg-[#F5F3EF] p-1.5 active:bg-[#E5E7EB] transition"><p className="font-bold text-[#111]">{e.contact}</p><p className="text-slate-400">Telephone</p></button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setModalEmploye(e)} className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Eye size={10} /> Voir profil</button>
                        <button onClick={() => { window.location.href = `tel:${e.contact.replace(/ /g, '')}`; }} className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97] transition"><Phone size={10} /> Contacter</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━ ALERTES ━━━━━━━━━━━━━━━ */}
        {tab === "alertes" && (
          <div className="space-y-2">
            {ALERTES.map((a, i) => {
              const Icon = a.icon;
              const isExp = expandedAlerte === i;
              return (
                <div key={i} className={`rounded-xl bg-white border ${a.border} overflow-hidden`}>
                  <button onClick={() => setExpandedAlerte(isExp ? null : i)} className="w-full text-left p-3">
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 shrink-0 rounded-lg ${a.bg} grid place-items-center`}>
                        <Icon size={16} className={a.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#111]">{a.titre}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.desc}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{a.date}</p>
                      </div>
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 space-y-2">
                      <p className="text-xs text-slate-500">{a.desc}</p>
                      <div className="rounded-lg bg-[#F5F3EF] p-2 text-[10px] space-y-0.5">
                        <p className="text-slate-500">{a.detail}</p>
                        {a.client && <p className="text-[#111] font-bold">Client: {a.client}</p>}
                        {a.montant && <p className="text-[#D4AF37] font-bold">Montant: {a.montant}</p>}
                        {a.ref && <p className="text-slate-500">Ref: {a.ref}</p>}
                      </div>
                      <button onClick={() => setModalAlerte(a)} className={`w-full rounded-lg py-2 text-[10px] font-bold text-white flex items-center justify-center gap-1 active:scale-[0.98] transition ${a.type === "urgent" ? "bg-red-500" : a.type === "warning" ? "bg-amber-500" : "bg-[#D4AF37]"}`}>
                        <Eye size={12} /> {a.action}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          MODALS
         ══════════════════════════════════════════════════ */}

      {/* -------- CA Detail Modal -------- */}
      {modalCA && (
        <Overlay onClose={() => setModalCA(null)}>
          <div className="p-5 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-12 w-12 rounded-xl ${modalCA.bg} grid place-items-center`}>
                <modalCA.icon size={22} className={modalCA.color} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#111]">{modalCA.univers}</h2>
                <p className="text-xs text-slate-500">CA: {modalCA.ca} · {modalCA.transactions} transactions</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-xl bg-[#F5F3EF] p-3 text-center">
                <p className="text-lg font-black text-[#111]">{modalCA.ca}</p>
                <p className="text-[9px] text-slate-400">CA total</p>
              </div>
              <div className="rounded-xl bg-[#F5F3EF] p-3 text-center">
                <p className={`text-lg font-black ${modalCA.up ? "text-green-600" : "text-red-500"}`}>{modalCA.pct}</p>
                <p className="text-[9px] text-slate-400">Evolution</p>
              </div>
              <div className="rounded-xl bg-[#F5F3EF] p-3 text-center">
                <p className="text-lg font-black text-[#D4AF37]">{modalCA.commissionTotal}</p>
                <p className="text-[9px] text-slate-400">Commission ({modalCA.commissionRate})</p>
              </div>
            </div>

            <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Toutes les transactions</h3>
            <div className="space-y-1">
              {modalCA.details.map(t => (
                <button key={t.id} onClick={() => { setModalCA(null); setModalTransaction(t); }} className="w-full flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5 text-left active:bg-[#F5F3EF] transition">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{t.objet}</p>
                    <p className="text-[10px] text-slate-400">{t.client} · {t.date} · Ref: {t.ref}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${t.montant.startsWith("-") ? "text-red-500" : "text-green-600"}`}>{t.montant}</p>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${t.statut === "Recu" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{t.statut}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {/* -------- Transaction Detail — PDF visuel -------- */}
      {modalTransaction && (
        <DocumentView
          doc={buildFactureData({ ref: modalTransaction.ref, objet: modalTransaction.objet, client: modalTransaction.client, montant: modalTransaction.montant, date: modalTransaction.date, statut: modalTransaction.statut, type: "Transaction" })}
          onClose={() => setModalTransaction(null)}
        />
      )}

      {/* -------- Commission Detail Modal -------- */}
      {modalCommission && (
        <Overlay onClose={() => setModalCommission(false)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-4">Commissions plateforme</h2>
            <div className="space-y-2">
              {UNIVERS_DATA.map(u => (
                <div key={u.univers} className="flex items-center justify-between rounded-xl bg-[#F5F3EF] p-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg ${u.bg} grid place-items-center`}><u.icon size={14} className={u.color} /></div>
                    <div>
                      <p className="text-sm font-bold text-[#111]">{u.univers}</p>
                      <p className="text-[10px] text-slate-400">Taux: {u.commissionRate} · {u.transactions} transactions</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-[#D4AF37]">{u.commissionTotal}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#111] p-4 text-center">
              <p className="text-[10px] text-white/50">Total commissions</p>
              <p className="text-2xl font-black text-[#D4AF37]">17 602 EUR</p>
            </div>
            <button onClick={() => { showToast("Rapport commissions exporte"); setModalCommission(false); }} className="w-full mt-3 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Download size={14} /> Exporter rapport commissions</button>
          </div>
        </Overlay>
      )}

      {/* -------- Finance Card Detail Modal -------- */}
      {modalFinanceCard && (
        <Overlay onClose={() => setModalFinanceCard(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">{modalFinanceCard.label}</h2>
            <p className="text-2xl font-black text-[#D4AF37] mb-4">{modalFinanceCard.montant}</p>

            <div className="rounded-xl bg-[#F5F3EF] p-4 mb-3 space-y-1">
              <p className="text-sm text-[#111]">{modalFinanceCard.detail}</p>
              <p className={`text-sm font-bold text-${modalFinanceCard.color}`}>{modalFinanceCard.pct}</p>
            </div>

            <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Transactions liees</h3>
            <div className="space-y-1">
              {PAIEMENTS.filter(p => {
                if (modalFinanceCard.label.includes("recus")) return p.statut === "Recu";
                if (modalFinanceCard.label.includes("attente")) return p.statut === "En attente";
                if (modalFinanceCard.label.includes("Remboursements")) return p.montant.startsWith("-");
                return true;
              }).map((p, i) => (
                <button key={i} onClick={() => { setModalFinanceCard(null); setModalPaiement(p); }} className="w-full flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] px-3 py-2 text-left active:bg-[#F5F3EF] transition">
                  <div>
                    <p className="text-xs font-bold text-[#111]">{p.objet}</p>
                    <p className="text-[10px] text-slate-400">{p.client} · {p.date}</p>
                  </div>
                  <p className={`text-xs font-bold ${p.montant.startsWith("-") ? "text-red-500" : "text-green-600"}`}>{p.montant}</p>
                </button>
              ))}
            </div>
            <button onClick={() => { showToast("Export PDF genere"); setModalFinanceCard(null); }} className="w-full mt-3 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97] transition"><Download size={14} /> Exporter les donnees</button>
          </div>
        </Overlay>
      )}

      {/* -------- Paiement Detail — PDF visuel -------- */}
      {modalPaiement && (
        <DocumentView
          doc={buildFactureData({ ref: modalPaiement.ref, objet: modalPaiement.objet, client: modalPaiement.client, montant: modalPaiement.montant, date: modalPaiement.date, statut: modalPaiement.statut, type: modalPaiement.type })}
          onClose={() => setModalPaiement(null)}
        />
      )}

      {/* -------- Abonnes Management Modal -------- */}
      {modalAbonnes && (
        <Overlay onClose={() => setModalAbonnes(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-1">{modalAbonnes.plan}</h2>
            <p className="text-xs text-slate-500 mb-4">{modalAbonnes.abonnes} abonnes actifs</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-xl bg-[#F5F3EF] p-3 text-center"><p className="text-lg font-black text-[#D4AF37]">{modalAbonnes.revenu}</p><p className="text-[9px] text-slate-400">Revenu mensuel</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3 text-center"><p className="text-lg font-black text-green-600">{modalAbonnes.taux}</p><p className="text-[9px] text-slate-400">Renouvellement</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3 text-center"><p className="text-lg font-black text-[#111]">{modalAbonnes.prix}</p><p className="text-[9px] text-slate-400">Prix/mois</p></div>
            </div>

            <h3 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Abonnes (extrait)</h3>
            <div className="space-y-1">
              {modalAbonnes.clients.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[#D4AF37]/10 grid place-items-center"><Users size={14} className="text-[#D4AF37]" /></div>
                    <p className="text-sm font-bold text-[#111]">{c}</p>
                  </div>
                  <span className="rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[9px] font-bold">Actif</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">+ {modalAbonnes.abonnes - modalAbonnes.clients.length} autres abonnes</p>

            <button onClick={() => { showToast(`Export liste abonnes ${modalAbonnes.plan}`); setModalAbonnes(null); }} className="w-full mt-3 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97] transition"><Download size={14} /> Exporter la liste</button>
          </div>
        </Overlay>
      )}

      {/* -------- Employee Profile Modal -------- */}
      {modalEmploye && (
        <Overlay onClose={() => setModalEmploye(null)}>
          <div className="p-5 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-full bg-[#D4AF37]/10 grid place-items-center">
                <Users size={24} className="text-[#D4AF37]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#111]">{modalEmploye.nom}</h2>
                <p className="text-xs text-slate-500">{modalEmploye.poste}</p>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${modalEmploye.statut === "present" ? "bg-green-50 text-green-700" : modalEmploye.statut === "conge" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
                  {modalEmploye.statut === "present" ? "Present" : modalEmploye.statut === "conge" ? "En conge" : "Absent"}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="rounded-xl bg-[#F5F3EF] p-2 text-center"><p className={`text-lg font-black ${modalEmploye.perf >= 90 ? "text-green-600" : modalEmploye.perf >= 75 ? "text-amber-600" : "text-red-500"}`}>{modalEmploye.perf}%</p><p className="text-[8px] text-slate-400">Performance</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-2 text-center"><p className="text-lg font-black text-[#111]">{modalEmploye.heuresM}</p><p className="text-[8px] text-slate-400">Heures/mois</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-2 text-center"><p className="text-lg font-black text-[#111]">{modalEmploye.presence}</p><p className="text-[8px] text-slate-400">Presence</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-2 text-center"><p className="text-lg font-black text-[#111]">{modalEmploye.taches}</p><p className="text-[8px] text-slate-400">Taches</p></div>
            </div>

            {/* Info detaillees */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 rounded-xl bg-[#F5F3EF] px-3 py-2"><Euro size={14} className="text-[#D4AF37]" /><div><p className="text-[10px] text-slate-400">Salaire mensuel</p><p className="text-sm font-bold text-[#111]">{modalEmploye.salaire} EUR</p></div></div>
              <div className="flex items-center gap-2 rounded-xl bg-[#F5F3EF] px-3 py-2"><Calendar size={14} className="text-blue-500" /><div><p className="text-[10px] text-slate-400">Date d'embauche · Anciennete</p><p className="text-sm font-bold text-[#111]">{modalEmploye.dateEmbauche} · {modalEmploye.anciennete}</p></div></div>
              <button onClick={() => { window.location.href = `tel:${modalEmploye.contact.replace(/ /g, '')}`; }} className="w-full flex items-center gap-2 rounded-xl bg-[#F5F3EF] px-3 py-2 active:bg-[#E5E7EB] transition"><Phone size={14} className="text-green-600" /><div><p className="text-[10px] text-slate-400">Telephone</p><p className="text-sm font-bold text-[#111]">{modalEmploye.contact}</p></div></button>
              <button onClick={() => { window.location.href = `mailto:${modalEmploye.email}`; }} className="w-full flex items-center gap-2 rounded-xl bg-[#F5F3EF] px-3 py-2 active:bg-[#E5E7EB] transition"><Mail size={14} className="text-blue-500" /><div><p className="text-[10px] text-slate-400">Email</p><p className="text-sm font-bold text-[#111]">{modalEmploye.email}</p></div></button>
              <div className="flex items-center gap-2 rounded-xl bg-[#F5F3EF] px-3 py-2"><MapPin size={14} className="text-red-500" /><div><p className="text-[10px] text-slate-400">Adresse</p><p className="text-sm font-bold text-[#111]">{modalEmploye.adresse}</p></div></div>
            </div>

            {/* Services */}
            <div className="mb-4">
              <p className="text-xs font-bold text-[#6B7280] uppercase mb-1">Competences / Services</p>
              <div className="flex flex-wrap gap-1">
                {modalEmploye.services.map(s => (
                  <span key={s} className="rounded-full bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 text-[10px] font-bold">{s}</span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setModalEmploye(null); setEditSalaire(modalEmploye.salaire); setEditPoste(modalEmploye.poste); setModalEditEmploye(modalEmploye); }} className="rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Edit3 size={14} /> Modifier</button>
              <button onClick={() => { window.location.href = `tel:${modalEmploye.contact.replace(/ /g, '')}`; }} className="rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97] transition"><Phone size={14} /> Appeler</button>
              <button onClick={() => { showToast(`Compte ${modalEmploye.nom} suspendu`); setModalEmploye(null); }} className="rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Ban size={14} /> Suspendre</button>
              <button onClick={() => { showToast(`Fiche de paie ${modalEmploye.nom} generee`); }} className="rounded-xl bg-blue-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Receipt size={14} /> Fiche de paie</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* -------- Edit Employee Modal -------- */}
      {modalEditEmploye && (
        <Overlay onClose={() => setModalEditEmploye(null)}>
          <div className="p-5 pt-10">
            <h2 className="text-lg font-black text-[#111] mb-4">Modifier — {modalEditEmploye.nom}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#6B7280]">Poste</label>
                <input value={editPoste} onChange={e => setEditPoste(e.target.value)} className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B7280]">Salaire (EUR)</label>
                <input value={editSalaire} onChange={e => setEditSalaire(e.target.value)} className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B7280]">Telephone</label>
                <input defaultValue={modalEditEmploye.contact} className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B7280]">Email</label>
                <input defaultValue={modalEditEmploye.email} className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6B7280]">Adresse</label>
                <input defaultValue={modalEditEmploye.adresse} className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111]" />
              </div>
              <button onClick={() => { showToast(`Profil ${modalEditEmploye.nom} mis a jour`); setModalEditEmploye(null); }} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white active:scale-[0.97] transition">Enregistrer les modifications</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* -------- Alert Action Modal -------- */}
      {modalAlerte && (
        <Overlay onClose={() => setModalAlerte(null)}>
          <div className="p-5 pt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-12 w-12 rounded-xl ${modalAlerte.bg} grid place-items-center`}>
                <modalAlerte.icon size={22} className={modalAlerte.color} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#111]">{modalAlerte.titre}</h2>
                <p className="text-xs text-slate-500">{modalAlerte.date}</p>
              </div>
            </div>

            <p className="text-sm text-[#111] mb-3">{modalAlerte.desc}</p>

            <div className="rounded-xl bg-[#F5F3EF] p-3 mb-4 space-y-1 text-sm">
              <p className="text-slate-500">{modalAlerte.detail}</p>
              {modalAlerte.client && <p className="text-[#111]"><span className="text-slate-400">Client:</span> <span className="font-bold">{modalAlerte.client}</span></p>}
              {modalAlerte.montant && <p className="text-[#D4AF37] font-bold">Montant: {modalAlerte.montant}</p>}
              {modalAlerte.ref && <p className="text-[#111]"><span className="text-slate-400">Ref:</span> {modalAlerte.ref}</p>}
              {modalAlerte.echeance && <p className="text-[#111]"><span className="text-slate-400">Echeance:</span> {modalAlerte.echeance}</p>}
            </div>

            {/* Actions according to alert type */}
            <div className="space-y-2">
              {modalAlerte.type === "urgent" && modalAlerte.action.includes("Relancer") && (
                <>
                  <button onClick={() => { showToast(`Email de relance envoye a ${modalAlerte.client}`); setModalAlerte(null); }} className="w-full rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Send size={14} /> Envoyer email de relance</button>
                  <button onClick={() => { showToast(`SMS de relance envoye`); setModalAlerte(null); }} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97] transition"><Phone size={14} /> Envoyer SMS de relance</button>
                  <button onClick={() => { window.location.href = `tel:0612345678`; }} className="w-full rounded-xl bg-white border border-[#E5E7EB] py-2.5 text-xs font-bold text-[#111] flex items-center justify-center gap-1 active:scale-[0.97] transition"><Phone size={14} /> Appeler le client</button>
                </>
              )}
              {modalAlerte.type === "urgent" && modalAlerte.action.includes("Contacter") && (
                <>
                  <button onClick={() => { showToast(`Email envoye a ${modalAlerte.client}`); setModalAlerte(null); }} className="w-full rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Mail size={14} /> Envoyer un email</button>
                  <button onClick={() => { showToast(`Offre de renouvellement envoyee`); setModalAlerte(null); }} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Star size={14} /> Proposer une offre de renouvellement</button>
                </>
              )}
              {modalAlerte.action.includes("transaction") && (
                <button onClick={() => { showToast("Transaction consultee"); setModalAlerte(null); }} className="w-full rounded-xl bg-green-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Eye size={14} /> Voir la transaction complete</button>
              )}
              {modalAlerte.action.includes("rapport") && (
                <button onClick={() => { showToast("Rapport telecharge"); setModalAlerte(null); }} className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Download size={14} /> Telecharger le rapport</button>
              )}
              {modalAlerte.action.includes("corriger") && (
                <>
                  <button onClick={() => { showToast("Facture doublon annulee"); setModalAlerte(null); }} className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><ShieldCheck size={14} /> Annuler le doublon</button>
                  <button onClick={() => { showToast(`Remboursement en cours pour ${modalAlerte.client}`); setModalAlerte(null); }} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97] transition"><ArrowUp size={14} /> Rembourser le client</button>
                </>
              )}
              {modalAlerte.action.includes("compte") && (
                <Link to={`/dossier-client/${modalAlerte.client}`} onClick={() => setModalAlerte(null)} className="w-full rounded-xl bg-blue-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Eye size={14} /> Voir le profil complet</Link>
              )}
              {modalAlerte.action.includes("Commander") && (
                <>
                  <button onClick={() => { showToast("Commande automatique lancee — 3 articles"); setModalAlerte(null); }} className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><ShieldCheck size={14} /> Lancer commande auto</button>
                  <button onClick={() => { showToast("Redirection vers fournisseurs"); setModalAlerte(null); }} className="w-full rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97] transition"><Briefcase size={14} /> Contacter le fournisseur</button>
                </>
              )}
              {modalAlerte.action.includes("facture") && (
                <button onClick={() => { setViewFactureAlerte(modalAlerte); setModalAlerte(null); }} className="w-full rounded-xl bg-green-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97] transition"><Receipt size={14} /> Voir la facture</button>
              )}
              <button onClick={() => { showToast("Alerte marquee comme traitee"); setModalAlerte(null); }} className="w-full rounded-xl bg-white border border-[#E5E7EB] py-2 text-xs font-bold text-slate-500 flex items-center justify-center gap-1 active:scale-[0.97] transition"><CheckCircle size={14} /> Marquer comme traitee</button>
            </div>
          </div>
        </Overlay>
      )}

      {viewFactureAlerte && (
        <DocumentView
          doc={buildFactureData({ ref: viewFactureAlerte.ref || "FA-ALERTE", objet: viewFactureAlerte.titre, client: viewFactureAlerte.client || "Client MKA.P-MS", montant: viewFactureAlerte.montant || "0 EUR", date: viewFactureAlerte.date, statut: "Paye", type: "Comptabilite" })}
          onClose={() => setViewFactureAlerte(null)}
        />
      )}
	      {/* Toast */}
	      {toast && (
	        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[90%]">
	          <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-xl flex items-center gap-2">
	            <CheckCircle size={14} className="text-green-400 shrink-0" />
	            <span>{toast}</span>
	            <button onClick={() => setToast(null)} className="ml-auto text-white/40 hover:text-white">&times;</button>
	          </div>
	        </div>
	      )}
	      {modalDoc && <DocumentView doc={modalDoc} onClose={() => setModalDoc(null)} />}
	    </div>
	  );
	}
