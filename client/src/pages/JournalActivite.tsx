import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Clock, User, Wrench, Shield, Filter, Search, AlertTriangle, CheckCircle, FileText, CreditCard, Eye, Pencil, Trash2, LogIn, LogOut, RefreshCw, ChevronDown, X, Printer, Download } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   JOURNAL D'ACTIVITE MKA.P-MS
   Tracabilite complete : utilisateurs, garages, admin
   TOUT CLIQUABLE — chaque entree ouvre un detail avec actions
   ══════════════════════════════════════════════════════════════════════════ */

type Tab = "tous" | "utilisateurs" | "garages" | "admin";
type Gravite = "info" | "warning" | "critical";

interface Activite {
  id: number;
  date: string;
  heure: string;
  categorie: Tab;
  type: string;
  acteur: string;
  role: string;
  action: string;
  detail: string;
  ip?: string;
  gravite: Gravite;
  redirectTo?: string;
}

const ACTIVITES: Activite[] = [
  { id: 1, date: "09/06/2026", heure: "18:12", categorie: "utilisateurs", type: "connexion", acteur: "Jean Dupont", role: "Particulier", action: "Connexion", detail: "Connexion reussie depuis Paris", ip: "92.184.xx.xx", gravite: "info", redirectTo: "/admin" },
  { id: 2, date: "09/06/2026", heure: "17:58", categorie: "utilisateurs", type: "annonce", acteur: "Marie Leclerc", role: "Pro Vente", action: "Depot annonce", detail: "Peugeot 308 GT 2024 — 22 500 EUR", gravite: "info", redirectTo: "/acheter" },
  { id: 3, date: "09/06/2026", heure: "17:45", categorie: "utilisateurs", type: "modification", acteur: "Ahmed B.", role: "Particulier", action: "Modification annonce", detail: "Prix modifie : 18 000 EUR → 16 500 EUR", gravite: "info", redirectTo: "/compte?tab=annonces" },
  { id: 4, date: "09/06/2026", heure: "17:30", categorie: "utilisateurs", type: "reservation", acteur: "Sophie Martin", role: "Particulier", action: "Reservation", detail: "Location Renault Clio — 3 jours — 120 EUR", gravite: "info", redirectTo: "/compte?tab=reservations" },
  { id: 5, date: "09/06/2026", heure: "17:15", categorie: "utilisateurs", type: "paiement", acteur: "Pierre Durand", role: "Particulier", action: "Paiement", detail: "Acompte reservation : 500 EUR — CB ****4532", gravite: "info", redirectTo: "/comptabilite?tab=ecritures" },
  { id: 6, date: "09/06/2026", heure: "16:50", categorie: "utilisateurs", type: "deconnexion", acteur: "Jean Dupont", role: "Particulier", action: "Deconnexion", detail: "Session fermee normalement", gravite: "info" },
  { id: 7, date: "09/06/2026", heure: "16:40", categorie: "utilisateurs", type: "connexion", acteur: "Fatou Diallo", role: "Pro Vente", action: "Tentative connexion echouee", detail: "Mot de passe incorrect — 3eme tentative", ip: "41.202.xx.xx", gravite: "warning" },
  { id: 8, date: "09/06/2026", heure: "16:20", categorie: "utilisateurs", type: "favori", acteur: "Lucas Moreau", role: "Particulier", action: "Ajout favori", detail: "BMW Serie 3 320d 2023 ajoute aux favoris", gravite: "info", redirectTo: "/favoris" },
  { id: 9, date: "09/06/2026", heure: "18:05", categorie: "garages", type: "devis", acteur: "Garage AutoPro 77", role: "Garage Premium", action: "Devis cree", detail: "Remplacement embrayage Clio IV — Devis #D-2026-0847 — 890 EUR", gravite: "info", redirectTo: "/compte?tab=devis" },
  { id: 10, date: "09/06/2026", heure: "17:50", categorie: "garages", type: "devis", acteur: "Garage AutoPro 77", role: "Garage Premium", action: "Devis modifie", detail: "Devis #D-2026-0845 — ajout pieces supplementaires — 1 240 EUR", gravite: "info", redirectTo: "/compte?tab=devis" },
  { id: 11, date: "09/06/2026", heure: "17:35", categorie: "garages", type: "reception", acteur: "Meca Service Paris", role: "Garage Elite", action: "Vehicule recu", detail: "Peugeot 3008 AB-456-CD — Reception atelier — Signature client OK", gravite: "info", redirectTo: "/suivi-vehicule" },
  { id: 12, date: "09/06/2026", heure: "17:10", categorie: "garages", type: "statut", acteur: "Meca Service Paris", role: "Garage Elite", action: "Statut modifie", detail: "Renault Megane EF-789-GH — Diagnostic → Pieces commandees", gravite: "info", redirectTo: "/suivi-vehicule" },
  { id: 13, date: "09/06/2026", heure: "16:55", categorie: "garages", type: "facture", acteur: "Garage AutoPro 77", role: "Garage Premium", action: "Facture creee", detail: "Facture #F-2026-0312 — 1 890 EUR TTC — Client Dupont", gravite: "info", redirectTo: "/comptabilite?tab=ecritures" },
  { id: 14, date: "09/06/2026", heure: "16:30", categorie: "garages", type: "stock", acteur: "Meca Service Paris", role: "Garage Elite", action: "Alerte stock", detail: "Plaquettes frein AV Bosch — stock critique : 1 unite restante", gravite: "warning", redirectTo: "/pieces" },
  { id: 15, date: "09/06/2026", heure: "15:45", categorie: "garages", type: "statut", acteur: "Carrosserie Bonneau", role: "Carrosserie Premium", action: "Statut modifie", detail: "Volkswagen Golf IJ-012-KL — Reparation en cours → Controle qualite", gravite: "info", redirectTo: "/suivi-vehicule" },
  { id: 16, date: "09/06/2026", heure: "18:10", categorie: "admin", type: "validation", acteur: "Moussa K. (PDG)", role: "PDG", action: "Annonce validee", detail: "Validation annonce #A-45623 — Mercedes Classe C 2024", gravite: "info", redirectTo: "/admin" },
  { id: 17, date: "09/06/2026", heure: "17:55", categorie: "admin", type: "suppression", acteur: "Directeur Awa S.", role: "Directeur", action: "Annonce supprimee", detail: "Suppression annonce #A-45601 — Motif : fausse annonce signalee", gravite: "critical" },
  { id: 18, date: "09/06/2026", heure: "17:25", categorie: "admin", type: "modification", acteur: "Moussa K. (PDG)", role: "PDG", action: "Tarif modifie", detail: "Pro Vente Premium : 79 EUR → 89 EUR/mois", gravite: "warning", redirectTo: "/abonnements" },
  { id: 19, date: "09/06/2026", heure: "17:00", categorie: "admin", type: "remboursement", acteur: "Directeur Awa S.", role: "Directeur", action: "Remboursement", detail: "Remboursement 150 EUR — Client Martin — Reservation annulee", gravite: "warning", redirectTo: "/comptabilite?tab=ecritures" },
  { id: 20, date: "09/06/2026", heure: "16:45", categorie: "admin", type: "validation", acteur: "Moussa K. (PDG)", role: "PDG", action: "KYC valide", detail: "Validation documents Garage AutoPro 77 — SIRET + KBIS OK", gravite: "info", redirectTo: "/admin" },
  { id: 21, date: "09/06/2026", heure: "16:15", categorie: "admin", type: "modification", acteur: "Employe Karima L.", role: "Employe", action: "Role modifie", detail: "Utilisateur Fatou D. — Particulier → Pro Vente", gravite: "info", redirectTo: "/admin" },
  { id: 22, date: "09/06/2026", heure: "15:30", categorie: "admin", type: "suppression", acteur: "Directeur Awa S.", role: "Directeur", action: "Compte supprime", detail: "Suppression compte inactif #U-8934 — Demande par l'utilisateur (RGPD)", gravite: "critical" },
  { id: 23, date: "08/06/2026", heure: "22:10", categorie: "admin", type: "alerte", acteur: "Systeme", role: "Systeme", action: "Anomalie detectee", detail: "5 tentatives connexion echouees — IP 185.xx.xx.xx — Blocage automatique", gravite: "critical" },
];

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "tous", label: "Tous", icon: Clock },
  { key: "utilisateurs", label: "Utilisateurs", icon: User },
  { key: "garages", label: "Garages", icon: Wrench },
  { key: "admin", label: "Admin", icon: Shield },
];

const ICON_MAP: Record<string, React.ElementType> = {
  connexion: LogIn, deconnexion: LogOut, annonce: FileText, modification: Pencil,
  reservation: CheckCircle, paiement: CreditCard, favori: Eye, devis: FileText,
  reception: CheckCircle, statut: RefreshCw, facture: CreditCard, stock: AlertTriangle,
  validation: CheckCircle, suppression: Trash2, remboursement: RefreshCw, alerte: AlertTriangle,
};

const GRAVITE_COLORS: Record<Gravite, string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

const GRAVITE_BADGE: Record<Gravite, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export default function JournalActivite() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("tous");
  const [search, setSearch] = useState("");
  const [graviteFilter, setGraviteFilter] = useState<Gravite | "tous">("tous");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = ACTIVITES.filter((a) => {
    if (tab !== "tous" && a.categorie !== tab) return false;
    if (graviteFilter !== "tous" && a.gravite !== graviteFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return a.acteur.toLowerCase().includes(s) || a.action.toLowerCase().includes(s) || a.detail.toLowerCase().includes(s);
    }
    return true;
  });

  const countByGravite = (g: Gravite) => ACTIVITES.filter((a) => a.gravite === g && (tab === "tous" || a.categorie === tab)).length;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <Link to="/admin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Administration</Link>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Clock size={22} className="text-[#D4AF37]" /> Journal d'activite</h1>
        <p className="mt-1 text-xs text-white/50">Tracabilite complete — qui a fait quoi et quand</p>
      </div>

      {/* Stats rapides — cliquables */}
      <div className="mx-4 -mt-3 relative z-10 grid grid-cols-3 gap-2 mb-3">
        <button onClick={() => setGraviteFilter(graviteFilter === "info" ? "tous" : "info")} className={`rounded-xl border p-3 text-center transition hover:shadow-md ${graviteFilter === "info" ? "ring-2 ring-blue-400" : ""} bg-blue-50 border-blue-200`}>
          <div className="text-xl font-black text-blue-700">{countByGravite("info")}</div>
          <div className="text-[9px] font-bold text-blue-600">Info</div>
        </button>
        <button onClick={() => setGraviteFilter(graviteFilter === "warning" ? "tous" : "warning")} className={`rounded-xl border p-3 text-center transition hover:shadow-md ${graviteFilter === "warning" ? "ring-2 ring-amber-400" : ""} bg-amber-50 border-amber-200`}>
          <div className="text-xl font-black text-amber-700">{countByGravite("warning")}</div>
          <div className="text-[9px] font-bold text-amber-600">Alertes</div>
        </button>
        <button onClick={() => setGraviteFilter(graviteFilter === "critical" ? "tous" : "critical")} className={`rounded-xl border p-3 text-center transition hover:shadow-md ${graviteFilter === "critical" ? "ring-2 ring-red-400" : ""} bg-red-50 border-red-200`}>
          <div className="text-xl font-black text-red-700">{countByGravite("critical")}</div>
          <div className="text-[9px] font-bold text-red-600">Critiques</div>
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-1.5 overflow-x-auto pb-2 mb-2">
        {TABS.map((t) => { const Icon = t.icon; return (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-[10px] font-bold border transition ${tab === t.key ? "bg-[#111] text-white border-[#111]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>
            <Icon size={12} /> {t.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] font-black ${tab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
              {ACTIVITES.filter((a) => t.key === "tous" || a.categorie === t.key).length}
            </span>
          </button>); })}
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par acteur, action, detail..." className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#D4AF37]" />
        </div>
      </div>

      {/* Liste — CLIQUABLE */}
      <div className="px-4 space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl bg-white border border-slate-200 p-8 text-center">
            <Filter size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Aucune activite trouvee</p>
          </div>
        )}

        {filtered.map((a) => {
          const Icon = ICON_MAP[a.type] || Clock;
          const isExpanded = expandedId === a.id;
          return (
            <div key={a.id}>
              <button onClick={() => setExpandedId(isExpanded ? null : a.id)} className={`w-full text-left rounded-xl border p-3 transition hover:shadow-md cursor-pointer ${GRAVITE_COLORS[a.gravite]} ${isExpanded ? "ring-2 ring-[#D4AF37]/30" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${a.gravite === "critical" ? "bg-red-200" : a.gravite === "warning" ? "bg-amber-200" : "bg-blue-200"}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold">{a.action}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${GRAVITE_BADGE[a.gravite]}`}>
                        {a.gravite === "info" ? "INFO" : a.gravite === "warning" ? "ALERTE" : "CRITIQUE"}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5 leading-snug">{a.detail}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[9px] font-bold opacity-70">{a.acteur}</span>
                      <span className="text-[9px] opacity-50">{a.role}</span>
                      <span className="text-[9px] opacity-50">{a.date} a {a.heure}</span>
                      {a.ip && <span className="text-[9px] opacity-40">IP: {a.ip}</span>}
                    </div>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 shrink-0 mt-1 transition ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExpanded && (
                <div className="mx-2 rounded-b-xl bg-white border-x border-b border-slate-200 p-3 space-y-2 -mt-1">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2">
                      <p className="text-slate-400">Acteur</p>
                      <p className="font-bold text-[#111]">{a.acteur}</p>
                    </div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2">
                      <p className="text-slate-400">Role</p>
                      <p className="font-bold text-[#111]">{a.role}</p>
                    </div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2">
                      <p className="text-slate-400">Date / Heure</p>
                      <p className="font-bold text-[#111]">{a.date} a {a.heure}</p>
                    </div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2">
                      <p className="text-slate-400">Type</p>
                      <p className="font-bold text-[#111]">{a.type}</p>
                    </div>
                    {a.ip && (
                      <div className="rounded-lg bg-[#F5F3EF] p-2 col-span-2">
                        <p className="text-slate-400">Adresse IP</p>
                        <p className="font-bold text-[#111]">{a.ip}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {a.redirectTo && (
                      <button onClick={() => navigate(a.redirectTo!)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[#D4AF37] py-2 text-[10px] font-bold text-white hover:bg-[#C5A028] transition">
                        <Eye size={10} /> Voir le detail
                      </button>
                    )}
                    <button className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-[#111] hover:bg-[#F5F3EF] transition">
                      <Printer size={10} /> Imprimer
                    </button>
                    <button className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-[#111] hover:bg-[#F5F3EF] transition">
                      <Download size={10} /> PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-4 mt-6 rounded-xl bg-white border border-slate-200 p-4">
        <h3 className="text-xs font-bold text-[#111] mb-2">Informations</h3>
        <ul className="space-y-1 text-[10px] text-slate-500">
          <li>• Le journal enregistre automatiquement toutes les actions importantes</li>
          <li>• Conservation des logs : 12 mois minimum (RGPD)</li>
          <li>• Les adresses IP sont partiellement masquees pour la confidentialite</li>
          <li>• En cas de litige, le journal fait foi pour retracer les actions</li>
          <li>• Seuls les comptes PDG et Directeur ont acces au journal complet</li>
        </ul>
      </div>
    </div>
  );
}
