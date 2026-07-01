import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, BarChart3, TrendingUp, TrendingDown, Euro, CreditCard,
  Users, Clock, Bell, AlertTriangle, CheckCircle, Eye, Download,
  Car, Key, Wrench, Gavel, Megaphone, FileText, Calendar,
  Target, Award, Shield, ArrowUp, ArrowDown, UserCheck,
  X, Pencil, Trash2, Printer, Phone, Mail, ChevronDown, ChevronRight
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   COMPTABILITE MKA.P-MS — TABLEAU DE BORD DIRIGEANT
   CA par univers, suivi financier, employes, alertes automatiques.
   Le PDG pilote toute l'activite depuis un seul tableau de bord.
   TOUT EST CLIQUABLE — chaque chiffre, chaque ligne, chaque alerte.
   ══════════════════════════════════════════════════════════════════════════ */

type CompTab = "ca" | "finances" | "employes" | "alertes";
type EmployeFilter = "tous" | "present" | "absent" | "conge";

interface Employe {
  id: number;
  nom: string;
  poste: string;
  heuresM: string;
  presence: string;
  taches: number;
  perf: number;
  statut: "present" | "absent" | "conge";
  email: string;
  tel: string;
  dateEmbauche: string;
  departement: string;
  salaire: string;
  formation: string;
  derniereCo: string;
}

interface Alerte {
  id: number;
  type: "urgent" | "info" | "warning";
  titre: string;
  desc: string;
  date: string;
  icon: typeof Bell;
  color: string;
  bg: string;
  border: string;
  categorie: "impayee" | "abonnement" | "paiement" | "objectif" | "anomalie" | "stock" | "nouvel_abonne";
  montant?: string;
  actionLabel: string;
  redirectTo: string;
}

const EMPLOYES: Employe[] = [
  { id: 1, nom: "Karim M.", poste: "Mecanicien senior — Atelier", heuresM: "168h", presence: "98%", taches: 34, perf: 92, statut: "present", email: "karim.m@mkapms.com", tel: "+33 6 12 34 56 78", dateEmbauche: "15/03/2023", departement: "Atelier Mecanique", salaire: "2 800 EUR", formation: "CAP Mecanique Auto + BTS", derniereCo: "09/06/2026 18:00" },
  { id: 2, nom: "Youssef B.", poste: "Mecanicien — Atelier", heuresM: "155h", presence: "95%", taches: 28, perf: 85, statut: "present", email: "youssef.b@mkapms.com", tel: "+33 6 23 45 67 89", dateEmbauche: "01/06/2023", departement: "Atelier Mecanique", salaire: "2 400 EUR", formation: "CAP Mecanique Auto", derniereCo: "09/06/2026 17:30" },
  { id: 3, nom: "Omar L.", poste: "Mecanicien — Atelier", heuresM: "142h", presence: "90%", taches: 22, perf: 78, statut: "present", email: "omar.l@mkapms.com", tel: "+33 6 34 56 78 90", dateEmbauche: "15/09/2023", departement: "Atelier Mecanique", salaire: "2 200 EUR", formation: "CAP Mecanique Auto", derniereCo: "09/06/2026 16:45" },
  { id: 4, nom: "Sarah K.", poste: "Responsable location", heuresM: "160h", presence: "97%", taches: 45, perf: 94, statut: "present", email: "sarah.k@mkapms.com", tel: "+33 6 45 67 89 01", dateEmbauche: "01/01/2023", departement: "Location", salaire: "3 200 EUR", formation: "BTS Commerce + Location VTC", derniereCo: "09/06/2026 18:10" },
  { id: 5, nom: "Mohamed A.", poste: "Commercial vente", heuresM: "162h", presence: "96%", taches: 38, perf: 88, statut: "present", email: "mohamed.a@mkapms.com", tel: "+33 6 56 78 90 12", dateEmbauche: "15/02/2023", departement: "Vente", salaire: "2 600 EUR + commissions", formation: "BTS NRC", derniereCo: "09/06/2026 17:55" },
  { id: 6, nom: "Fatima B.", poste: "Comptabilite", heuresM: "158h", presence: "99%", taches: 52, perf: 96, statut: "present", email: "fatima.b@mkapms.com", tel: "+33 6 67 89 01 23", dateEmbauche: "01/04/2023", departement: "Comptabilite", salaire: "3 000 EUR", formation: "DCG Comptabilite", derniereCo: "09/06/2026 18:05" },
  { id: 7, nom: "Rachid T.", poste: "Apprenti mecanicien", heuresM: "130h", presence: "88%", taches: 15, perf: 65, statut: "absent", email: "rachid.t@mkapms.com", tel: "+33 6 78 90 12 34", dateEmbauche: "01/09/2024", departement: "Atelier Mecanique", salaire: "1 200 EUR (alternance)", formation: "CAP Mecanique en cours", derniereCo: "07/06/2026 16:00" },
  { id: 8, nom: "Amina D.", poste: "Accueil / Administration", heuresM: "160h", presence: "100%", taches: 40, perf: 91, statut: "conge", email: "amina.d@mkapms.com", tel: "+33 6 89 01 23 45", dateEmbauche: "15/05/2023", departement: "Administration", salaire: "2 500 EUR", formation: "BTS Assistant de Gestion", derniereCo: "05/06/2026 17:30" },
  { id: 9, nom: "Ibrahima S.", poste: "Carrossier", heuresM: "165h", presence: "97%", taches: 31, perf: 89, statut: "present", email: "ibrahima.s@mkapms.com", tel: "+33 6 90 12 34 56", dateEmbauche: "01/07/2023", departement: "Carrosserie", salaire: "2 700 EUR", formation: "CAP Carrosserie + Peinture", derniereCo: "09/06/2026 17:40" },
  { id: 10, nom: "Nadia M.", poste: "Service client", heuresM: "160h", presence: "98%", taches: 48, perf: 93, statut: "present", email: "nadia.m@mkapms.com", tel: "+33 6 01 23 45 67", dateEmbauche: "01/03/2023", departement: "Support Client", salaire: "2 500 EUR", formation: "BTS Commerce", derniereCo: "09/06/2026 18:15" },
  { id: 11, nom: "Ali K.", poste: "Mecanicien electricien", heuresM: "160h", presence: "95%", taches: 30, perf: 87, statut: "present", email: "ali.k@mkapms.com", tel: "+33 6 12 23 34 45", dateEmbauche: "15/04/2023", departement: "Atelier Electricite", salaire: "2 600 EUR", formation: "BEP Electricite Auto", derniereCo: "09/06/2026 17:50" },
  { id: 12, nom: "Khadija B.", poste: "Gestionnaire de stock", heuresM: "155h", presence: "96%", taches: 42, perf: 90, statut: "present", email: "khadija.b@mkapms.com", tel: "+33 6 23 34 45 56", dateEmbauche: "01/08/2023", departement: "Stock / Logistique", salaire: "2 400 EUR", formation: "BTS Logistique", derniereCo: "09/06/2026 17:20" },
  { id: 13, nom: "David R.", poste: "Peintre automobile", heuresM: "158h", presence: "94%", taches: 26, perf: 86, statut: "present", email: "david.r@mkapms.com", tel: "+33 6 34 45 56 67", dateEmbauche: "15/06/2023", departement: "Carrosserie", salaire: "2 500 EUR", formation: "CAP Peinture Carrosserie", derniereCo: "09/06/2026 16:50" },
  { id: 14, nom: "Lamine D.", poste: "Chauffeur / Livreur", heuresM: "170h", presence: "97%", taches: 55, perf: 91, statut: "present", email: "lamine.d@mkapms.com", tel: "+33 6 45 56 67 78", dateEmbauche: "01/10/2023", departement: "Logistique / Livraison", salaire: "2 300 EUR", formation: "Permis B/C/D", derniereCo: "09/06/2026 18:20" },
  { id: 15, nom: "Mariama T.", poste: "Assistante comptable", heuresM: "155h", presence: "98%", taches: 38, perf: 88, statut: "present", email: "mariama.t@mkapms.com", tel: "+33 6 56 67 78 89", dateEmbauche: "01/11/2023", departement: "Comptabilite", salaire: "2 200 EUR", formation: "BTS Comptabilite", derniereCo: "09/06/2026 17:45" },
  { id: 16, nom: "Franck M.", poste: "Chef d'atelier", heuresM: "172h", presence: "99%", taches: 60, perf: 95, statut: "present", email: "franck.m@mkapms.com", tel: "+33 6 67 78 89 90", dateEmbauche: "01/01/2023", departement: "Atelier Mecanique", salaire: "3 500 EUR", formation: "BTS Mecanique + 15 ans exp.", derniereCo: "09/06/2026 18:05" },
  { id: 17, nom: "Aissatou S.", poste: "Chargee marketing", heuresM: "158h", presence: "96%", taches: 35, perf: 87, statut: "present", email: "aissatou.s@mkapms.com", tel: "+33 6 78 89 90 01", dateEmbauche: "15/01/2024", departement: "Marketing", salaire: "2 800 EUR", formation: "Master Marketing Digital", derniereCo: "09/06/2026 17:30" },
  { id: 18, nom: "Thomas P.", poste: "Responsable informatique", heuresM: "165h", presence: "97%", taches: 44, perf: 92, statut: "present", email: "thomas.p@mkapms.com", tel: "+33 6 89 90 01 12", dateEmbauche: "01/02/2024", departement: "IT / Informatique", salaire: "3 800 EUR", formation: "Master Informatique", derniereCo: "09/06/2026 18:25" },
  { id: 19, nom: "Ousmane K.", poste: "Mecanicien pneumatique", heuresM: "160h", presence: "93%", taches: 28, perf: 82, statut: "present", email: "ousmane.k@mkapms.com", tel: "+33 6 90 01 12 23", dateEmbauche: "01/03/2024", departement: "Atelier Mecanique", salaire: "2 300 EUR", formation: "Formation Pneumatique", derniereCo: "09/06/2026 17:10" },
  { id: 20, nom: "Julie L.", poste: "Responsable RH", heuresM: "160h", presence: "100%", taches: 50, perf: 94, statut: "present", email: "julie.l@mkapms.com", tel: "+33 6 01 12 23 34", dateEmbauche: "15/12/2023", departement: "Ressources Humaines", salaire: "3 200 EUR", formation: "Master RH", derniereCo: "09/06/2026 18:00" },
  { id: 21, nom: "Moussa B.", poste: "Agent de securite", heuresM: "176h", presence: "100%", taches: 20, perf: 90, statut: "present", email: "moussa.b@mkapms.com", tel: "+33 6 12 23 34 45", dateEmbauche: "01/05/2024", departement: "Securite", salaire: "2 100 EUR", formation: "CQP Agent de Securite", derniereCo: "09/06/2026 18:30" },
  { id: 22, nom: "Awa N.", poste: "Assistante de direction", heuresM: "160h", presence: "99%", taches: 45, perf: 93, statut: "present", email: "awa.n@mkapms.com", tel: "+33 6 23 34 45 56", dateEmbauche: "01/06/2024", departement: "Direction", salaire: "2 800 EUR", formation: "BTS Assistante Direction", derniereCo: "09/06/2026 17:55" },
  { id: 23, nom: "Patrick V.", poste: "Controleur technique", heuresM: "160h", presence: "95%", taches: 32, perf: 88, statut: "present", email: "patrick.v@mkapms.com", tel: "+33 6 34 45 56 67", dateEmbauche: "01/07/2024", departement: "Controle Technique", salaire: "2 600 EUR", formation: "Agrement CT", derniereCo: "09/06/2026 17:15" },
  { id: 24, nom: "Fatoumata D.", poste: "Community manager", heuresM: "155h", presence: "94%", taches: 40, perf: 85, statut: "present", email: "fatoumata.d@mkapms.com", tel: "+33 6 45 56 67 78", dateEmbauche: "01/08/2024", departement: "Marketing", salaire: "2 200 EUR", formation: "Licence Communication", derniereCo: "09/06/2026 17:40" },
  { id: 25, nom: "Eric G.", poste: "Magasinier pieces", heuresM: "168h", presence: "96%", taches: 50, perf: 89, statut: "present", email: "eric.g@mkapms.com", tel: "+33 6 56 67 78 89", dateEmbauche: "15/08/2024", departement: "Stock / Pieces", salaire: "2 100 EUR", formation: "Formation interne", derniereCo: "09/06/2026 16:30" },
  { id: 26, nom: "Saliou M.", poste: "Depanneur", heuresM: "175h", presence: "97%", taches: 35, perf: 91, statut: "present", email: "saliou.m@mkapms.com", tel: "+33 6 67 78 89 90", dateEmbauche: "01/09/2024", departement: "Depannage", salaire: "2 500 EUR", formation: "Permis PL + Formation Depannage", derniereCo: "09/06/2026 18:00" },
  { id: 27, nom: "Claire F.", poste: "Juriste", heuresM: "155h", presence: "98%", taches: 25, perf: 92, statut: "conge", email: "claire.f@mkapms.com", tel: "+33 6 78 89 90 01", dateEmbauche: "01/10/2024", departement: "Juridique", salaire: "3 500 EUR", formation: "Master Droit des Affaires", derniereCo: "04/06/2026 17:00" },
  { id: 28, nom: "Abdou S.", poste: "Mecanicien diagnostic", heuresM: "162h", presence: "95%", taches: 33, perf: 86, statut: "absent", email: "abdou.s@mkapms.com", tel: "+33 6 89 90 01 12", dateEmbauche: "15/10/2024", departement: "Atelier Diagnostic", salaire: "2 400 EUR", formation: "Formation Diagnostic Electronique", derniereCo: "08/06/2026 16:00" },
];

const ALERTES: Alerte[] = [
  { id: 1, type: "urgent", titre: "Facture impayee — Garage Premium", desc: "Facture FA-2025-0310 de 1 580 EUR en attente depuis 3 jours. Client: Jean-Pierre D.", date: "Il y a 3 jours", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", categorie: "impayee", montant: "1 580 EUR", actionLabel: "Relancer le client", redirectTo: "/comptabilite?tab=ecritures" },
  { id: 2, type: "urgent", titre: "Abonnement expire — Pro Vente", desc: "L'abonnement Pro Premium de Garage Auto 93 a expire le 07/06. Pas de renouvellement.", date: "Il y a 2 jours", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", categorie: "abonnement", actionLabel: "Contacter le client", redirectTo: "/abonnements" },
  { id: 3, type: "info", titre: "Paiement recu — 28 500 EUR", desc: "Virement recu pour l'achat de la Peugeot 3008 GT par Martin D.", date: "Il y a 1 jour", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", categorie: "paiement", montant: "28 500 EUR", actionLabel: "Voir le paiement", redirectTo: "/comptabilite?tab=ecritures" },
  { id: 4, type: "info", titre: "Objectif mensuel atteint — Location", desc: "Objectif de 65 000 EUR atteint pour la Location. Actuel: 68 200 EUR (+105%).", date: "Il y a 1 jour", icon: Target, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", border: "border-[#D4AF37]/30", categorie: "objectif", actionLabel: "Voir les details", redirectTo: "/compta-dirigeant" },
  { id: 5, type: "warning", titre: "Anomalie financiere detectee", desc: "Double facturation detectee sur le compte de Sophie L. — 2 factures identiques de 780 EUR.", date: "Aujourd'hui", icon: Shield, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", categorie: "anomalie", montant: "780 EUR", actionLabel: "Verifier les factures", redirectTo: "/comptabilite?tab=ecritures" },
  { id: 6, type: "info", titre: "Nouvel abonne — Atelier Pro", desc: "Garage Meca Plus (Montreuil) a souscrit a l'option Atelier Pro Premium (89 EUR/mois).", date: "Aujourd'hui", icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", categorie: "nouvel_abonne", actionLabel: "Voir le profil", redirectTo: "/abonnements" },
  { id: 7, type: "warning", titre: "Stock critique — 3 articles", desc: "Courroie distribution Gates, Amortisseur AR Monroe, Kit embrayage Valeo en rupture.", date: "Aujourd'hui", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", categorie: "stock", actionLabel: "Commander les pieces", redirectTo: "/pieces" },
  { id: 8, type: "info", titre: "Paiement recu — 920 EUR", desc: "CB recu pour la reparation Tesla Model 3 (pneus + geometrie) par Thomas R.", date: "Hier", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", categorie: "paiement", montant: "920 EUR", actionLabel: "Voir le paiement", redirectTo: "/comptabilite?tab=ecritures" },
  { id: 9, type: "urgent", titre: "Facture impayee — Location Mercedes", desc: "Facture LOC-2025-0189 de 2 350 EUR — Location Mercedes Classe E. Client: Pierre M.", date: "Il y a 5 jours", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", categorie: "impayee", montant: "2 350 EUR", actionLabel: "Relancer le client", redirectTo: "/comptabilite?tab=ecritures" },
  { id: 10, type: "warning", titre: "Abonnement expire — Location Pro", desc: "L'abonnement Pro Location de Auto Loc 78 a expire hier. Renouvellement non effectue.", date: "Hier", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", categorie: "abonnement", actionLabel: "Contacter le client", redirectTo: "/abonnements" },
  { id: 11, type: "info", titre: "Nouvel abonne — Comptabilite Pro", desc: "Cabinet Expert 92 a souscrit a Comptabilite Pro Premium (59 EUR/mois).", date: "Hier", icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", categorie: "nouvel_abonne", actionLabel: "Voir le profil", redirectTo: "/abonnements" },
  { id: 12, type: "warning", titre: "Anomalie stock — Pieces Bosch", desc: "Ecart de stock detecte : 12 plaquettes freins enregistrees mais seulement 8 en stock physique.", date: "Aujourd'hui", icon: Shield, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", categorie: "stock", actionLabel: "Verifier le stock", redirectTo: "/pieces" },
];

export default function ComptaDirigeant() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<CompTab>("ca");
  const [periode, setPeriode] = useState<"jour" | "semaine" | "mois" | "annee">("mois");
  const [empFilter, setEmpFilter] = useState<EmployeFilter>("tous");
  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  const [selectedAlerte, setSelectedAlerte] = useState<Alerte | null>(null);
  const [alerteFilter, setAlerteFilter] = useState<string>("tous");
  const [expandedPaiement, setExpandedPaiement] = useState<number | null>(null);

  const filteredEmployes = EMPLOYES.filter((e) => {
    if (empFilter === "tous") return true;
    return e.statut === empFilter;
  });

  const empCounts = {
    tous: EMPLOYES.length,
    present: EMPLOYES.filter((e) => e.statut === "present").length,
    absent: EMPLOYES.filter((e) => e.statut === "absent").length,
    conge: EMPLOYES.filter((e) => e.statut === "conge").length,
  };

  const filteredAlertes = ALERTES.filter((a) => {
    if (alerteFilter === "tous") return true;
    return a.categorie === alerteFilter;
  });

  const alerteCounts = {
    tous: ALERTES.length,
    impayee: ALERTES.filter((a) => a.categorie === "impayee").length,
    abonnement: ALERTES.filter((a) => a.categorie === "abonnement").length,
    anomalie: ALERTES.filter((a) => a.categorie === "anomalie").length,
    stock: ALERTES.filter((a) => a.categorie === "stock").length,
    paiement: ALERTES.filter((a) => a.categorie === "paiement").length,
    objectif: ALERTES.filter((a) => a.categorie === "objectif").length,
    nouvel_abonne: ALERTES.filter((a) => a.categorie === "nouvel_abonne").length,
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Tableau de bord dirigeant</h1>
        <p className="mt-0.5 text-sm text-white/60">Pilotez toute l'activite MKA.P-MS</p>

        {/* CA Total — cliquable */}
        <button onClick={() => { setTab("ca"); }} className="mt-4 w-full text-left rounded-xl bg-white/5 p-4 hover:bg-white/10 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Chiffre d'affaires total</p>
              <p className="text-2xl font-black text-[#D4AF37]">287 450 EUR</p>
              <p className="text-xs text-green-400 flex items-center gap-1"><TrendingUp size={12} /> +12.4% vs mois precedent</p>
            </div>
            <div className="flex gap-1">
              {(["jour", "semaine", "mois", "annee"] as const).map((p) => (
                <button key={p} onClick={(e) => { e.stopPropagation(); setPeriode(p); }} className={`rounded-lg px-2 py-1 text-[9px] font-bold ${periode === p ? "bg-[#D4AF37] text-white" : "bg-white/10 text-white/50"}`}>
                  {p === "jour" ? "J" : p === "semaine" ? "S" : p === "mois" ? "M" : "A"}
                </button>
              ))}
            </div>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {([
          { id: "ca" as CompTab, label: "Chiffre d'affaires", icon: Euro },
          { id: "finances" as CompTab, label: "Suivi financier", icon: CreditCard },
          { id: "employes" as CompTab, label: `Employes (${empCounts.tous})`, icon: Users },
          { id: "alertes" as CompTab, label: `Alertes (${alerteCounts.tous})`, icon: Bell },
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
        {/* ━━━━━ CA PAR UNIVERS — chaque ligne cliquable ━━━━━ */}
        {tab === "ca" && (
          <div className="space-y-3">
            {[
              { univers: "Vente", icon: Car, ca: "142 500 EUR", pct: "+8.2%", up: true, color: "text-blue-600", bg: "bg-blue-50", transactions: 47, barWidth: "85%", route: "/acheter" },
              { univers: "Location", icon: Key, ca: "68 200 EUR", pct: "+15.1%", up: true, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", transactions: 156, barWidth: "65%", route: "/louer" },
              { univers: "Garage", icon: Wrench, ca: "34 800 EUR", pct: "+22.3%", up: true, color: "text-green-600", bg: "bg-green-50", transactions: 89, barWidth: "42%", route: "/garages" },
              { univers: "Encheres", icon: Gavel, ca: "28 950 EUR", pct: "+5.7%", up: true, color: "text-purple-600", bg: "bg-purple-50", transactions: 12, barWidth: "35%", route: "/acheter/encheres" },
              { univers: "Publicite", icon: Megaphone, ca: "13 000 EUR", pct: "-3.2%", up: false, color: "text-orange-600", bg: "bg-orange-50", transactions: 34, barWidth: "18%", route: "/demande-publicite" },
            ].map((u) => {
              const Icon = u.icon;
              return (
                <button key={u.univers} onClick={() => navigate(u.route)} className="w-full text-left rounded-xl bg-white border border-[#E5E7EB] p-4 hover:border-[#D4AF37] hover:shadow-md transition cursor-pointer">
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
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-base font-black text-[#111]">{u.ca}</p>
                        <p className={`text-[10px] font-bold flex items-center gap-0.5 justify-end ${u.up ? "text-green-600" : "text-red-500"}`}>
                          {u.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {u.pct}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${u.color.replace("text-", "bg-")}`} style={{ width: u.barWidth }} />
                  </div>
                </button>
              );
            })}

            {/* Commissions plateforme — cliquables */}
            <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
              <h3 className="text-xs font-bold text-[#D4AF37] mb-2">Commissions plateforme</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Commission vente (3%)", montant: "8 520 EUR", route: "/comptabilite?tab=ecritures" },
                  { label: "Commission location (5%)", montant: "4 260 EUR", route: "/comptabilite?tab=ecritures" },
                  { label: "Commission encheres (5%)", montant: "2 130 EUR", route: "/comptabilite?tab=ecritures" },
                ].map((c) => (
                  <button key={c.label} onClick={() => navigate(c.route)} className="hover:bg-white/10 rounded-lg p-1 transition">
                    <p className="text-lg font-black text-white">{c.montant}</p>
                    <p className="text-[8px] text-white/50">{c.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━ SUIVI FINANCIER — tout cliquable ━━━━━ */}
        {tab === "finances" && (
          <div className="space-y-3">
            {/* Cartes resume — cliquables */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Paiements recus", montant: "198 450 EUR", icon: ArrowDown, color: "text-green-600", bg: "bg-green-50", route: "/comptabilite?tab=ecritures" },
                { label: "Paiements en attente", montant: "42 300 EUR", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", route: "/comptabilite?tab=ecritures" },
                { label: "Remboursements", montant: "3 800 EUR", icon: ArrowUp, color: "text-red-500", bg: "bg-red-50", route: "/comptabilite?tab=ecritures" },
                { label: "Abonnements actifs", montant: "24 680 EUR/mois", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50", route: "/abonnements" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <button key={c.label} onClick={() => navigate(c.route)} className="w-full text-left rounded-xl bg-white border border-[#E5E7EB] p-3 hover:border-[#D4AF37] hover:shadow-md transition cursor-pointer">
                    <div className={`h-8 w-8 rounded-lg ${c.bg} grid place-items-center mb-2`}>
                      <Icon size={14} className={c.color} />
                    </div>
                    <p className="text-[10px] text-slate-400">{c.label}</p>
                    <p className="text-sm font-black text-[#111]">{c.montant}</p>
                  </button>
                );
              })}
            </div>

            {/* Derniers paiements — cliquables avec detail expandable */}
            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2"><h3 className="text-xs font-bold text-[#D4AF37]">Derniers paiements</h3></div>
              {[
                { id: 1, objet: "Vente Peugeot 3008 GT", montant: "+28 500 EUR", date: "09/06/2025", statut: "Recu", type: "vente", ref: "PAY-2025-0892", client: "Martin D.", methode: "Virement bancaire" },
                { id: 2, objet: "Location Mercedes E Break", montant: "+1 350 EUR", date: "08/06/2025", statut: "Recu", type: "location", ref: "PAY-2025-0891", client: "Sophie L.", methode: "CB ****4532" },
                { id: 3, objet: "Abonnement Pro Premium x12", montant: "+1 068 EUR", date: "07/06/2025", statut: "Recu", type: "abo", ref: "PAY-2025-0890", client: "Garage Auto 93", methode: "Prelevement SEPA" },
                { id: 4, objet: "Devis Garage Auto Express", montant: "+389 EUR", date: "06/06/2025", statut: "En attente", type: "garage", ref: "PAY-2025-0889", client: "Jean Dupont", methode: "Attente CB" },
                { id: 5, objet: "Boost Premium Annonce #142", montant: "+29 EUR", date: "06/06/2025", statut: "Recu", type: "pub", ref: "PAY-2025-0888", client: "Auto Premium", methode: "CB ****8721" },
                { id: 6, objet: "Remboursement reservation", montant: "-50 EUR", date: "05/06/2025", statut: "Traite", type: "remb", ref: "REM-2025-0156", client: "Ahmed B.", methode: "Remboursement CB" },
              ].map((p) => (
                <div key={p.id}>
                  <button onClick={() => setExpandedPaiement(expandedPaiement === p.id ? null : p.id)} className="w-full flex items-center justify-between px-3 py-2.5 border-b border-[#F3F4F6] last:border-0 hover:bg-[#F5F3EF]/50 transition">
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#111]">{p.objet}</p>
                      <p className="text-[10px] text-slate-400">{p.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${p.montant.startsWith("-") ? "text-red-500" : "text-green-600"}`}>{p.montant}</p>
                        <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${p.statut === "Recu" ? "bg-green-50 text-green-700" : p.statut === "En attente" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{p.statut}</span>
                      </div>
                      <ChevronDown size={12} className={`text-slate-300 transition ${expandedPaiement === p.id ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {expandedPaiement === p.id && (
                    <div className="px-3 py-3 bg-[#F5F3EF]/50 border-b border-[#F3F4F6] space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div><span className="text-slate-400">Reference:</span> <span className="font-bold text-[#111]">{p.ref}</span></div>
                        <div><span className="text-slate-400">Client:</span> <span className="font-bold text-[#111]">{p.client}</span></div>
                        <div><span className="text-slate-400">Methode:</span> <span className="font-bold text-[#111]">{p.methode}</span></div>
                        <div><span className="text-slate-400">Type:</span> <span className="font-bold text-[#111]">{p.type}</span></div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => navigate("/comptabilite?tab=ecritures")} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#D4AF37] py-2 text-[10px] font-bold text-white"><Eye size={10} /> Voir la facture</button>
                        <button className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-[#111]"><Printer size={10} /> Imprimer</button>
                        <button className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-[#111]"><Download size={10} /> PDF</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Abonnements actifs — cliquables */}
            <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="bg-[#111] px-3 py-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#D4AF37]">Abonnements actifs</h3>
                <button onClick={() => navigate("/abonnements")} className="text-[10px] text-white/50 hover:text-[#D4AF37] transition">312 abonnes →</button>
              </div>
              {[
                { plan: "Pro Vente Premium", abonnes: 45, revenu: "4 005 EUR/mois", route: "/abonnements" },
                { plan: "Pro Vente Elite", abonnes: 12, revenu: "2 148 EUR/mois", route: "/abonnements" },
                { plan: "Location Pro", abonnes: 67, revenu: "5 963 EUR/mois", route: "/abonnements" },
                { plan: "Garage Pro Premium", abonnes: 34, revenu: "3 026 EUR/mois", route: "/abonnements" },
                { plan: "Atelier Pro", abonnes: 28, revenu: "2 492 EUR/mois", route: "/abonnements" },
                { plan: "Encheres Pro", abonnes: 15, revenu: "735 EUR/mois", route: "/abonnements" },
                { plan: "Comptabilite Pro", abonnes: 22, revenu: "1 298 EUR/mois", route: "/abonnements" },
                { plan: "Carrosserie Pro", abonnes: 18, revenu: "1 062 EUR/mois", route: "/abonnements" },
              ].map((a, i) => (
                <button key={i} onClick={() => navigate(a.route)} className="w-full flex items-center justify-between px-3 py-2 border-b border-[#F3F4F6] last:border-0 hover:bg-[#F5F3EF]/50 transition">
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#111]">{a.plan}</p>
                    <p className="text-[10px] text-slate-400">{a.abonnes} abonnes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-[#D4AF37]">{a.revenu}</p>
                    <ChevronRight size={12} className="text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ━━━━━ EMPLOYES — stats cliquables + detail modal ━━━━━ */}
        {tab === "employes" && (
          <div className="space-y-3">
            {/* Stats globales — CLIQUABLES pour filtrer */}
            <div className="grid grid-cols-4 gap-2">
              {([
                { label: "Total", val: empCounts.tous, color: "text-[#D4AF37]", filter: "tous" as EmployeFilter, ring: "ring-[#D4AF37]" },
                { label: "Presents", val: empCounts.present, color: "text-green-600", filter: "present" as EmployeFilter, ring: "ring-green-400" },
                { label: "Absents", val: empCounts.absent, color: "text-red-500", filter: "absent" as EmployeFilter, ring: "ring-red-400" },
                { label: "Conges", val: empCounts.conge, color: "text-blue-500", filter: "conge" as EmployeFilter, ring: "ring-blue-400" },
              ]).map((s) => (
                <button key={s.label} onClick={() => setEmpFilter(empFilter === s.filter ? "tous" : s.filter)} className={`rounded-xl bg-white border border-[#E5E7EB] p-3 text-center transition hover:border-[#D4AF37] hover:shadow-md cursor-pointer ${empFilter === s.filter ? `ring-2 ${s.ring}` : ""}`}>
                  <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                  <p className="text-[9px] text-slate-400">{s.label}</p>
                </button>
              ))}
            </div>

            {empFilter !== "tous" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Filtre: <span className="font-bold text-[#111]">{empFilter === "present" ? "Presents" : empFilter === "absent" ? "Absents" : "En conge"}</span></span>
                <button onClick={() => setEmpFilter("tous")} className="text-[10px] text-[#D4AF37] font-bold hover:underline">Voir tous</button>
              </div>
            )}

            {/* Liste employes — CLIQUABLES */}
            {filteredEmployes.map((e) => (
              <button key={e.id} onClick={() => setSelectedEmploye(e)} className={`w-full text-left rounded-xl bg-white border p-3 hover:border-[#D4AF37] hover:shadow-md transition cursor-pointer ${e.statut === "present" ? "border-[#E5E7EB]" : e.statut === "conge" ? "border-blue-200" : "border-red-200"}`}>
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
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${e.perf >= 90 ? "text-green-600" : e.perf >= 75 ? "text-amber-600" : "text-red-500"}`}>{e.perf}%</p>
                      <p className="text-[9px] text-slate-400">performance</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-1.5">
                    <p className="font-bold text-[#111]">{e.heuresM}</p>
                    <p className="text-slate-400">Heures/mois</p>
                  </div>
                  <div className="rounded-lg bg-[#F5F3EF] p-1.5">
                    <p className="font-bold text-[#111]">{e.presence}</p>
                    <p className="text-slate-400">Presence</p>
                  </div>
                  <div className="rounded-lg bg-[#F5F3EF] p-1.5">
                    <p className="font-bold text-[#111]">{e.taches}</p>
                    <p className="text-slate-400">Taches/mois</p>
                  </div>
                </div>
              </button>
            ))}

            {filteredEmployes.length === 0 && (
              <div className="text-center py-8">
                <Users size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">Aucun employe dans cette categorie</p>
              </div>
            )}
          </div>
        )}

        {/* ━━━━━ ALERTES — filtrage par categorie + cliquables ━━━━━ */}
        {tab === "alertes" && (
          <div className="space-y-3">
            {/* Filtres alertes */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {[
                { id: "tous", label: `Toutes (${alerteCounts.tous})` },
                { id: "impayee", label: `Impayees (${alerteCounts.impayee})` },
                { id: "abonnement", label: `Abonnements (${alerteCounts.abonnement})` },
                { id: "anomalie", label: `Anomalies (${alerteCounts.anomalie})` },
                { id: "stock", label: `Stocks (${alerteCounts.stock})` },
                { id: "paiement", label: `Paiements (${alerteCounts.paiement})` },
                { id: "nouvel_abonne", label: `Nouveaux (${alerteCounts.nouvel_abonne})` },
              ].map((f) => (
                <button key={f.id} onClick={() => setAlerteFilter(f.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${alerteFilter === f.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {filteredAlertes.map((a) => {
              const Icon = a.icon;
              return (
                <button key={a.id} onClick={() => setSelectedAlerte(a)} className={`w-full text-left rounded-xl bg-white border ${a.border} p-3 hover:shadow-md transition cursor-pointer`}>
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 shrink-0 rounded-lg ${a.bg} grid place-items-center`}>
                      <Icon size={16} className={a.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[#111]">{a.titre}</p>
                        <ChevronRight size={14} className="text-slate-300 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="text-[10px] text-slate-400">{a.date}</p>
                        {a.montant && <span className="rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[9px] font-bold text-[#D4AF37]">{a.montant}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredAlertes.length === 0 && (
              <div className="text-center py-8">
                <Bell size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">Aucune alerte dans cette categorie</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ━━━━━ MODAL DETAIL EMPLOYE ━━━━━ */}
      {selectedEmploye && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedEmploye(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-5 pt-5 pb-4 rounded-t-2xl sm:rounded-t-2xl flex items-start justify-between">
              <div>
                <p className="text-lg font-black text-white">{selectedEmploye.nom}</p>
                <p className="text-xs text-white/60">{selectedEmploye.poste}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${selectedEmploye.statut === "present" ? "bg-green-500/20 text-green-400" : selectedEmploye.statut === "conge" ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"}`}>
                  {selectedEmploye.statut === "present" ? "Present" : selectedEmploye.statut === "conge" ? "En conge" : "Absent"}
                </span>
              </div>
              <button onClick={() => setSelectedEmploye(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"><X size={16} className="text-white" /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Performance */}
              <div className="rounded-xl bg-[#F5F3EF] p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className={`text-xl font-black ${selectedEmploye.perf >= 90 ? "text-green-600" : selectedEmploye.perf >= 75 ? "text-amber-600" : "text-red-500"}`}>{selectedEmploye.perf}%</p>
                    <p className="text-[9px] text-slate-400">Performance</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-[#111]">{selectedEmploye.heuresM}</p>
                    <p className="text-[9px] text-slate-400">Heures/mois</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-[#111]">{selectedEmploye.taches}</p>
                    <p className="text-[9px] text-slate-400">Taches/mois</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className={`h-full rounded-full ${selectedEmploye.perf >= 90 ? "bg-green-500" : selectedEmploye.perf >= 75 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${selectedEmploye.perf}%` }} />
                </div>
              </div>

              {/* Informations */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#111]">Informations</h3>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {[
                    { label: "Email", val: selectedEmploye.email },
                    { label: "Telephone", val: selectedEmploye.tel },
                    { label: "Departement", val: selectedEmploye.departement },
                    { label: "Date embauche", val: selectedEmploye.dateEmbauche },
                    { label: "Salaire", val: selectedEmploye.salaire },
                    { label: "Presence", val: selectedEmploye.presence },
                    { label: "Formation", val: selectedEmploye.formation },
                    { label: "Derniere connexion", val: selectedEmploye.derniereCo },
                  ].map((info) => (
                    <div key={info.label} className="rounded-lg bg-white border border-[#E5E7EB] p-2">
                      <p className="text-[9px] text-slate-400">{info.label}</p>
                      <p className="font-bold text-[#111] truncate">{info.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] py-3 text-xs font-bold text-white hover:bg-[#C5A028] transition"><Pencil size={14} /> Modifier</button>
                <button className="flex items-center justify-center gap-1.5 rounded-xl bg-red-500 py-3 text-xs font-bold text-white hover:bg-red-600 transition"><Trash2 size={14} /> Supprimer</button>
                <button className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] py-3 text-xs font-bold text-[#111] hover:bg-[#F5F3EF] transition"><Printer size={14} /> Imprimer la fiche</button>
                <button className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] py-3 text-xs font-bold text-[#111] hover:bg-[#F5F3EF] transition"><Mail size={14} /> Envoyer un mail</button>
                <button className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] py-3 text-xs font-bold text-[#111] hover:bg-[#F5F3EF] transition"><Phone size={14} /> Appeler</button>
                <button className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E7EB] py-3 text-xs font-bold text-[#111] hover:bg-[#F5F3EF] transition"><FileText size={14} /> Journal d'activite</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━ MODAL DETAIL ALERTE ━━━━━ */}
      {selectedAlerte && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAlerte(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className={`px-5 pt-5 pb-4 rounded-t-2xl flex items-start justify-between ${selectedAlerte.bg} border-b ${selectedAlerte.border}`}>
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg ${selectedAlerte.type === "urgent" ? "bg-red-200" : selectedAlerte.type === "warning" ? "bg-amber-200" : "bg-green-200"} grid place-items-center`}>
                  {(() => { const Icon = selectedAlerte.icon; return <Icon size={18} className={selectedAlerte.color} />; })()}
                </div>
                <div>
                  <p className="text-sm font-black text-[#111]">{selectedAlerte.titre}</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[8px] font-bold ${selectedAlerte.type === "urgent" ? "bg-red-100 text-red-700" : selectedAlerte.type === "warning" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                    {selectedAlerte.type === "urgent" ? "URGENT" : selectedAlerte.type === "warning" ? "ATTENTION" : "INFO"}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedAlerte(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 hover:bg-white transition"><X size={16} className="text-[#111]" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-[#F5F3EF] p-4">
                <p className="text-sm text-[#111] leading-relaxed">{selectedAlerte.desc}</p>
                <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-400">
                  <span>{selectedAlerte.date}</span>
                  {selectedAlerte.montant && <span className="rounded-full bg-[#D4AF37]/10 px-2 py-0.5 font-bold text-[#D4AF37]">{selectedAlerte.montant}</span>}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-500">{selectedAlerte.categorie}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button onClick={() => { navigate(selectedAlerte.redirectTo); setSelectedAlerte(null); }} className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] py-3 text-xs font-bold text-white hover:bg-[#C5A028] transition">
                  <Eye size={14} /> {selectedAlerte.actionLabel}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button className="flex items-center justify-center gap-1 rounded-xl border border-[#E5E7EB] py-2.5 text-[10px] font-bold text-[#111] hover:bg-[#F5F3EF] transition"><CheckCircle size={12} /> Resoudre</button>
                  <button className="flex items-center justify-center gap-1 rounded-xl border border-[#E5E7EB] py-2.5 text-[10px] font-bold text-[#111] hover:bg-[#F5F3EF] transition"><Printer size={12} /> Imprimer</button>
                  <button className="flex items-center justify-center gap-1 rounded-xl border border-[#E5E7EB] py-2.5 text-[10px] font-bold text-[#111] hover:bg-[#F5F3EF] transition"><Download size={12} /> Exporter</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
