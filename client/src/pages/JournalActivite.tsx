import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Clock, User, Wrench, Shield, Filter, Search, AlertTriangle, CheckCircle, FileText, CreditCard, Eye, Pencil, Trash2, LogIn, LogOut, RefreshCw } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   JOURNAL D'ACTIVITÉ MKA.P-MS
   Traçabilité complète : utilisateurs, garages, admin
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
}

const ACTIVITES: Activite[] = [
  // Utilisateurs
  { id: 1, date: "09/06/2026", heure: "18:12", categorie: "utilisateurs", type: "connexion", acteur: "Jean Dupont", role: "Particulier", action: "Connexion", detail: "Connexion r\u00e9ussie depuis Paris", ip: "92.184.xx.xx", gravite: "info" },
  { id: 2, date: "09/06/2026", heure: "17:58", categorie: "utilisateurs", type: "annonce", acteur: "Marie Leclerc", role: "Pro Vente", action: "D\u00e9p\u00f4t annonce", detail: "Peugeot 308 GT 2024 \u2014 22 500 \u20ac", gravite: "info" },
  { id: 3, date: "09/06/2026", heure: "17:45", categorie: "utilisateurs", type: "modification", acteur: "Ahmed B.", role: "Particulier", action: "Modification annonce", detail: "Prix modifi\u00e9 : 18 000 \u20ac \u2192 16 500 \u20ac", gravite: "info" },
  { id: 4, date: "09/06/2026", heure: "17:30", categorie: "utilisateurs", type: "reservation", acteur: "Sophie Martin", role: "Particulier", action: "R\u00e9servation", detail: "Location Renault Clio \u2014 3 jours \u2014 120 \u20ac", gravite: "info" },
  { id: 5, date: "09/06/2026", heure: "17:15", categorie: "utilisateurs", type: "paiement", acteur: "Pierre Durand", role: "Particulier", action: "Paiement", detail: "Acompte r\u00e9servation : 500 \u20ac \u2014 CB ****4532", gravite: "info" },
  { id: 6, date: "09/06/2026", heure: "16:50", categorie: "utilisateurs", type: "deconnexion", acteur: "Jean Dupont", role: "Particulier", action: "D\u00e9connexion", detail: "Session ferm\u00e9e normalement", gravite: "info" },
  { id: 7, date: "09/06/2026", heure: "16:40", categorie: "utilisateurs", type: "connexion", acteur: "Fatou Diallo", role: "Pro Vente", action: "Tentative connexion \u00e9chou\u00e9e", detail: "Mot de passe incorrect \u2014 3\u00e8me tentative", ip: "41.202.xx.xx", gravite: "warning" },
  { id: 8, date: "09/06/2026", heure: "16:20", categorie: "utilisateurs", type: "favori", acteur: "Lucas Moreau", role: "Particulier", action: "Ajout favori", detail: "BMW S\u00e9rie 3 320d 2023 ajout\u00e9 aux favoris", gravite: "info" },

  // Garages
  { id: 9, date: "09/06/2026", heure: "18:05", categorie: "garages", type: "devis", acteur: "Garage AutoPro 77", role: "Garage Premium", action: "Devis cr\u00e9\u00e9", detail: "Remplacement embrayage Clio IV \u2014 Devis #D-2026-0847 \u2014 890 \u20ac", gravite: "info" },
  { id: 10, date: "09/06/2026", heure: "17:50", categorie: "garages", type: "devis", acteur: "Garage AutoPro 77", role: "Garage Premium", action: "Devis modifi\u00e9", detail: "Devis #D-2026-0845 \u2014 ajout pi\u00e8ces suppl\u00e9mentaires \u2014 1 240 \u20ac", gravite: "info" },
  { id: 11, date: "09/06/2026", heure: "17:35", categorie: "garages", type: "reception", acteur: "Meca Service Paris", role: "Garage Elite", action: "V\u00e9hicule re\u00e7u", detail: "Peugeot 3008 AB-456-CD \u2014 R\u00e9ception atelier \u2014 Signature client OK", gravite: "info" },
  { id: 12, date: "09/06/2026", heure: "17:10", categorie: "garages", type: "statut", acteur: "Meca Service Paris", role: "Garage Elite", action: "Statut modifi\u00e9", detail: "Renault Megane EF-789-GH \u2014 Diagnostic \u2192 Pi\u00e8ces command\u00e9es", gravite: "info" },
  { id: 13, date: "09/06/2026", heure: "16:55", categorie: "garages", type: "facture", acteur: "Garage AutoPro 77", role: "Garage Premium", action: "Facture cr\u00e9\u00e9e", detail: "Facture #F-2026-0312 \u2014 1 890 \u20ac TTC \u2014 Client Dupont", gravite: "info" },
  { id: 14, date: "09/06/2026", heure: "16:30", categorie: "garages", type: "stock", acteur: "Meca Service Paris", role: "Garage Elite", action: "Alerte stock", detail: "Plaquettes frein AV Bosch \u2014 stock critique : 1 unit\u00e9 restante", gravite: "warning" },
  { id: 15, date: "09/06/2026", heure: "15:45", categorie: "garages", type: "statut", acteur: "Carrosserie Bonneau", role: "Carrosserie Premium", action: "Statut modifi\u00e9", detail: "Volkswagen Golf IJ-012-KL \u2014 R\u00e9paration en cours \u2192 Contr\u00f4le qualit\u00e9", gravite: "info" },

  // Admin
  { id: 16, date: "09/06/2026", heure: "18:10", categorie: "admin", type: "validation", acteur: "Moussa K. (PDG)", role: "PDG", action: "Annonce valid\u00e9e", detail: "Validation annonce #A-45623 \u2014 Mercedes Classe C 2024", gravite: "info" },
  { id: 17, date: "09/06/2026", heure: "17:55", categorie: "admin", type: "suppression", acteur: "Directeur Awa S.", role: "Directeur", action: "Annonce supprim\u00e9e", detail: "Suppression annonce #A-45601 \u2014 Motif : fausse annonce signal\u00e9e", gravite: "critical" },
  { id: 18, date: "09/06/2026", heure: "17:25", categorie: "admin", type: "modification", acteur: "Moussa K. (PDG)", role: "PDG", action: "Tarif modifi\u00e9", detail: "Pro Vente Premium : 79 \u20ac \u2192 89 \u20ac/mois", gravite: "warning" },
  { id: 19, date: "09/06/2026", heure: "17:00", categorie: "admin", type: "remboursement", acteur: "Directeur Awa S.", role: "Directeur", action: "Remboursement", detail: "Remboursement 150 \u20ac \u2014 Client Martin \u2014 R\u00e9servation annul\u00e9e", gravite: "warning" },
  { id: 20, date: "09/06/2026", heure: "16:45", categorie: "admin", type: "validation", acteur: "Moussa K. (PDG)", role: "PDG", action: "KYC valid\u00e9", detail: "Validation documents Garage AutoPro 77 \u2014 SIRET + KBIS OK", gravite: "info" },
  { id: 21, date: "09/06/2026", heure: "16:15", categorie: "admin", type: "modification", acteur: "Employ\u00e9 Karima L.", role: "Employ\u00e9", action: "R\u00f4le modifi\u00e9", detail: "Utilisateur Fatou D. \u2014 Particulier \u2192 Pro Vente", gravite: "info" },
  { id: 22, date: "09/06/2026", heure: "15:30", categorie: "admin", type: "suppression", acteur: "Directeur Awa S.", role: "Directeur", action: "Compte supprim\u00e9", detail: "Suppression compte inactif #U-8934 \u2014 Demand\u00e9 par l'utilisateur (RGPD)", gravite: "critical" },
  { id: 23, date: "08/06/2026", heure: "22:10", categorie: "admin", type: "alerte", acteur: "Syst\u00e8me", role: "Syst\u00e8me", action: "Anomalie d\u00e9tect\u00e9e", detail: "5 tentatives connexion \u00e9chou\u00e9es \u2014 IP 185.xx.xx.xx \u2014 Blocage automatique", gravite: "critical" },
];

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "tous", label: "Tous", icon: Clock },
  { key: "utilisateurs", label: "Utilisateurs", icon: User },
  { key: "garages", label: "Garages", icon: Wrench },
  { key: "admin", label: "Admin", icon: Shield },
];

const ICON_MAP: Record<string, React.ElementType> = {
  connexion: LogIn,
  deconnexion: LogOut,
  annonce: FileText,
  modification: Pencil,
  reservation: CheckCircle,
  paiement: CreditCard,
  favori: Eye,
  devis: FileText,
  reception: CheckCircle,
  statut: RefreshCw,
  facture: CreditCard,
  stock: AlertTriangle,
  validation: CheckCircle,
  suppression: Trash2,
  remboursement: RefreshCw,
  alerte: AlertTriangle,
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
  const [tab, setTab] = useState<Tab>("tous");
  const [search, setSearch] = useState("");
  const [graviteFilter, setGraviteFilter] = useState<Gravite | "tous">("tous");

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
      {/* Header */}
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <Link to="/admin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Administration</Link>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Clock size={22} className="text-[#D4AF37]" /> Journal d'activit&eacute;</h1>
        <p className="mt-1 text-xs text-white/50">Tra&ccedil;abilit&eacute; compl&egrave;te &mdash; qui a fait quoi et quand</p>
      </div>

      {/* Stats rapides */}
      <div className="mx-4 -mt-3 relative z-10 grid grid-cols-3 gap-2 mb-3">
        <button onClick={() => setGraviteFilter(graviteFilter === "info" ? "tous" : "info")} className={`rounded-xl border p-3 text-center transition ${graviteFilter === "info" ? "ring-2 ring-blue-400" : ""} bg-blue-50 border-blue-200`}>
          <div className="text-xl font-black text-blue-700">{countByGravite("info")}</div>
          <div className="text-[9px] font-bold text-blue-600">Info</div>
        </button>
        <button onClick={() => setGraviteFilter(graviteFilter === "warning" ? "tous" : "warning")} className={`rounded-xl border p-3 text-center transition ${graviteFilter === "warning" ? "ring-2 ring-amber-400" : ""} bg-amber-50 border-amber-200`}>
          <div className="text-xl font-black text-amber-700">{countByGravite("warning")}</div>
          <div className="text-[9px] font-bold text-amber-600">Alertes</div>
        </button>
        <button onClick={() => setGraviteFilter(graviteFilter === "critical" ? "tous" : "critical")} className={`rounded-xl border p-3 text-center transition ${graviteFilter === "critical" ? "ring-2 ring-red-400" : ""} bg-red-50 border-red-200`}>
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
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par acteur, action, d\u00e9tail..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="px-4 space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl bg-white border border-slate-200 p-8 text-center">
            <Filter size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Aucune activit&eacute; trouv&eacute;e</p>
          </div>
        )}

        {filtered.map((a) => {
          const Icon = ICON_MAP[a.type] || Clock;
          return (
            <div key={a.id} className={`rounded-xl border p-3 transition ${GRAVITE_COLORS[a.gravite]}`}>
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
                    <span className="text-[9px] opacity-50">{a.date} &agrave; {a.heure}</span>
                    {a.ip && <span className="text-[9px] opacity-40">IP: {a.ip}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="mx-4 mt-6 rounded-xl bg-white border border-slate-200 p-4">
        <h3 className="text-xs font-bold text-[#111] mb-2">Informations</h3>
        <ul className="space-y-1 text-[10px] text-slate-500">
          <li>&bull; Le journal enregistre automatiquement toutes les actions importantes</li>
          <li>&bull; Conservation des logs : 12 mois minimum (RGPD)</li>
          <li>&bull; Les adresses IP sont partiellement masqu&eacute;es pour la confidentialit&eacute;</li>
          <li>&bull; En cas de litige, le journal fait foi pour retracer les actions</li>
          <li>&bull; Seuls les comptes PDG et Directeur ont acc&egrave;s au journal complet</li>
        </ul>
      </div>
    </div>
  );
}
