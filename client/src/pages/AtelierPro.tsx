import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Wrench, Search, Car, Calendar, Users, FileText,
  Clock, Settings, ShoppingBag, ChevronRight, Plus, MapPin,
  Phone, Mail, Star, CheckCircle, AlertTriangle, Eye,
  Download, Cog, CircuitBoard, Gauge, Fuel, Thermometer,
  Wind, Zap, Disc, LifeBuoy, Battery, Lightbulb
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   MODULE ATELIER PRO + CATALOGUE TECHNIQUE
   Planning atelier, ordres de reparation, devis, factures, clients,
   vehicules, pieces, main-d'oeuvre, historique.
   Catalogue technique type AutoData — tous vehicules, tous systemes.
   ══════════════════════════════════════════════════════════════════════════ */

type AtelierTab = "planning" | "ordres" | "devis" | "factures" | "clients" | "vehicules" | "catalogue" | "pieces";

const TABS_ATELIER: { id: AtelierTab; label: string; icon: typeof Wrench; count?: number }[] = [
  { id: "planning", label: "Planning", icon: Calendar },
  { id: "ordres", label: "Ordres", icon: FileText, count: 5 },
  { id: "devis", label: "Devis", icon: FileText, count: 3 },
  { id: "factures", label: "Factures", icon: FileText, count: 8 },
  { id: "clients", label: "Clients", icon: Users, count: 42 },
  { id: "vehicules", label: "Vehicules", icon: Car, count: 67 },
  { id: "catalogue", label: "Catalogue", icon: Search },
  { id: "pieces", label: "Pieces", icon: ShoppingBag, count: 156 },
];

/* PLANNING */
const PLANNING_SLOTS = [
  { id: 1, heure: "08:00", vehicule: "Peugeot 3008 GT", plaque: "AB-123-CD", travail: "Revision complete", tech: "Karim M.", duree: "2h30", statut: "en_cours" },
  { id: 2, heure: "08:30", vehicule: "BMW Serie 3 320i", plaque: "EF-456-GH", travail: "Freins AV + AR", tech: "Youssef B.", duree: "3h00", statut: "en_cours" },
  { id: 3, heure: "10:30", vehicule: "Renault Clio V", plaque: "IJ-789-KL", travail: "Diagnostic moteur", tech: "Karim M.", duree: "1h00", statut: "attente" },
  { id: 4, heure: "11:00", vehicule: "Mercedes Classe C", plaque: "MN-012-OP", travail: "Distribution", tech: "Omar L.", duree: "5h00", statut: "attente" },
  { id: 5, heure: "14:00", vehicule: "Volkswagen Golf 8", plaque: "QR-345-ST", travail: "Pneus x4 + geometrie", tech: "Youssef B.", duree: "1h30", statut: "planifie" },
  { id: 6, heure: "15:30", vehicule: "Citroen C3 Aircross", plaque: "UV-678-WX", travail: "Vidange + filtre", tech: "Karim M.", duree: "1h00", statut: "planifie" },
];

/* ORDRES DE REPARATION */
const ORDRES = [
  { id: 1, ref: "OR-2024-0147", vehicule: "Peugeot 3008 GT", plaque: "AB-123-CD", client: "Martin D.", travaux: "Revision 30k km — vidange, filtres, bougies, liquide frein, controle general", statut: "en_cours", tech: "Karim M.", dateEntree: "09/06/2024", dateSortie: "-", montant: "389 EUR" },
  { id: 2, ref: "OR-2024-0146", vehicule: "BMW Serie 3 320i", plaque: "EF-456-GH", client: "Sophie L.", travaux: "Plaquettes + disques AV + AR + purge circuit", statut: "en_cours", tech: "Youssef B.", dateEntree: "09/06/2024", dateSortie: "-", montant: "780 EUR" },
  { id: 3, ref: "OR-2024-0145", vehicule: "Renault Clio V", plaque: "IJ-789-KL", client: "Ahmed K.", travaux: "Diagnostic OBD — voyant moteur allume, defaut P0300", statut: "diagnostic", tech: "Karim M.", dateEntree: "09/06/2024", dateSortie: "-", montant: "60 EUR" },
  { id: 4, ref: "OR-2024-0144", vehicule: "Mercedes Classe C", plaque: "MN-012-OP", client: "Julie P.", travaux: "Distribution + pompe a eau + galets", statut: "attente_pieces", tech: "Omar L.", dateEntree: "08/06/2024", dateSortie: "-", montant: "1 250 EUR" },
  { id: 5, ref: "OR-2024-0143", vehicule: "Tesla Model 3", plaque: "YZ-901-AB", client: "Thomas R.", travaux: "Pneus Michelin PS5 x4 + parallélisme", statut: "termine", tech: "Youssef B.", dateEntree: "07/06/2024", dateSortie: "08/06/2024", montant: "920 EUR" },
];

/* DEVIS */
const DEVIS_ATELIER = [
  { id: 1, ref: "DV-2024-0089", vehicule: "Audi A4 40 TDI", plaque: "CD-234-EF", client: "Pierre M.", objet: "Embrayage complet + volant moteur bi-masse", montant: "1 890 EUR", statut: "envoye", date: "09/06/2024" },
  { id: 2, ref: "DV-2024-0088", vehicule: "Peugeot 308 II", plaque: "GH-567-IJ", client: "Nadia S.", objet: "Climatisation — recharge + remplacement compresseur", montant: "850 EUR", statut: "accepte", date: "08/06/2024" },
  { id: 3, ref: "DV-2024-0087", vehicule: "Dacia Sandero", plaque: "KL-890-MN", client: "Marc T.", objet: "Revision + CT preparation", montant: "420 EUR", statut: "refuse", date: "07/06/2024" },
];

/* FACTURES */
const FACTURES_ATELIER = [
  { id: 1, ref: "FA-2024-0312", vehicule: "Tesla Model 3", client: "Thomas R.", montant: "920 EUR", date: "08/06/2024", statut: "payee" },
  { id: 2, ref: "FA-2024-0311", vehicule: "Renault Megane", client: "Laura V.", montant: "245 EUR", date: "07/06/2024", statut: "payee" },
  { id: 3, ref: "FA-2024-0310", vehicule: "Citroen C4", client: "Jean-Pierre D.", montant: "1 580 EUR", date: "06/06/2024", statut: "en_attente" },
  { id: 4, ref: "FA-2024-0309", vehicule: "BMW X3", client: "Fatima B.", montant: "380 EUR", date: "05/06/2024", statut: "payee" },
];

/* CLIENTS */
const CLIENTS_ATELIER = [
  { id: 1, nom: "Martin D.", vehicules: 2, visites: 8, derniere: "09/06/2024", total: "2 450 EUR", tel: "06 12 34 56 78" },
  { id: 2, nom: "Sophie L.", vehicules: 1, visites: 5, derniere: "09/06/2024", total: "1 890 EUR", tel: "06 23 45 67 89" },
  { id: 3, nom: "Ahmed K.", vehicules: 3, visites: 12, derniere: "09/06/2024", total: "4 120 EUR", tel: "06 34 56 78 90" },
  { id: 4, nom: "Julie P.", vehicules: 1, visites: 3, derniere: "08/06/2024", total: "1 680 EUR", tel: "06 45 67 89 01" },
  { id: 5, nom: "Thomas R.", vehicules: 1, visites: 2, derniere: "08/06/2024", total: "920 EUR", tel: "06 56 78 90 12" },
];

/* VEHICULES ATELIER */
const VEHICULES_ATELIER = [
  { id: 1, marque: "Peugeot", modele: "3008 GT Hybrid", plaque: "AB-123-CD", vin: "VF3MCYHZRML123456", annee: 2024, km: "15 200", client: "Martin D.", derniereVisite: "09/06/2024" },
  { id: 2, marque: "BMW", modele: "Serie 3 320i", plaque: "EF-456-GH", vin: "WBAPK5C52BA123456", annee: 2024, km: "8 200", client: "Sophie L.", derniereVisite: "09/06/2024" },
  { id: 3, marque: "Renault", modele: "Clio V TCe 130", plaque: "IJ-789-KL", vin: "VF15RFL0A67123456", annee: 2024, km: "5 800", client: "Ahmed K.", derniereVisite: "09/06/2024" },
  { id: 4, marque: "Mercedes", modele: "Classe C 220d", plaque: "MN-012-OP", vin: "WDD2050012R123456", annee: 2023, km: "22 400", client: "Julie P.", derniereVisite: "08/06/2024" },
];

export default function AtelierPro() {
  const [tab, setTab] = useState<AtelierTab>("planning");
  const [searchPlaque, setSearchPlaque] = useState("");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* Hero */}
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/garage-plus" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage Pro</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} className="text-[#D4AF37]" /> Atelier Pro</h1>
        <p className="mt-0.5 text-sm text-white/60">Gestion atelier, devis, factures, catalogue technique</p>

        {/* Stats rapides */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            { label: "En cours", val: "3", color: "text-green-400" },
            { label: "Attente", val: "2", color: "text-amber-400" },
            { label: "Termines", val: "1", color: "text-blue-400" },
            { label: "Clients", val: "42", color: "text-[#D4AF37]" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-white/5 p-2 text-center">
              <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
              <p className="text-[9px] text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS_ATELIER.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={12} /> {t.label} {t.count != null && <span className="text-[10px] opacity-60">({t.count})</span>}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-4">
        {/* ━━━━━ PLANNING ━━━━━ */}
        {tab === "planning" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#111]">Planning du jour — Lundi 9 Juin 2025</h2>
              <button className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1"><Plus size={12} /> RDV</button>
            </div>
            {PLANNING_SLOTS.map((s) => (
              <div key={s.id} className={`rounded-xl bg-white border p-3 ${s.statut === "en_cours" ? "border-green-300" : s.statut === "attente" ? "border-amber-200" : "border-[#E5E7EB]"}`}>
                <div className="flex items-center gap-3">
                  <div className="text-center shrink-0">
                    <p className="text-sm font-black text-[#111]">{s.heure}</p>
                    <p className="text-[9px] text-slate-400">{s.duree}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#111] truncate">{s.vehicule}</p>
                    <p className="text-[11px] text-slate-500">{s.plaque} — {s.travail}</p>
                    <p className="text-[10px] text-slate-400">Tech: {s.tech}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    s.statut === "en_cours" ? "bg-green-50 text-green-700" :
                    s.statut === "attente" ? "bg-amber-50 text-amber-700" :
                    "bg-slate-50 text-slate-600"
                  }`}>
                    {s.statut === "en_cours" ? "En cours" : s.statut === "attente" ? "Attente" : "Planifie"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ━━━━━ ORDRES DE REPARATION ━━━━━ */}
        {tab === "ordres" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#111]">Ordres de reparation</h2>
              <button className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1"><Plus size={12} /> Nouvel OR</button>
            </div>
            {ORDRES.map((o) => (
              <div key={o.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">{o.ref}</p>
                    <p className="text-sm font-bold text-[#111]">{o.vehicule} <span className="text-slate-400 font-normal">({o.plaque})</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">{o.travaux}</p>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                      <span>Client: {o.client}</span>
                      <span>Tech: {o.tech}</span>
                      <span>Entree: {o.dateEntree}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-bold text-[#D4AF37]">{o.montant}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      o.statut === "en_cours" ? "bg-green-50 text-green-700" :
                      o.statut === "diagnostic" ? "bg-blue-50 text-blue-700" :
                      o.statut === "attente_pieces" ? "bg-amber-50 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {o.statut === "en_cours" ? "En cours" : o.statut === "diagnostic" ? "Diagnostic" : o.statut === "attente_pieces" ? "Attente pieces" : "Termine"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ━━━━━ DEVIS ━━━━━ */}
        {tab === "devis" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[#111]">Devis atelier</h2>
              <button className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1"><Plus size={12} /> Nouveau devis</button>
            </div>
            {DEVIS_ATELIER.map((d) => (
              <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">{d.ref}</p>
                    <p className="text-sm font-bold text-[#111]">{d.vehicule} <span className="text-slate-400 font-normal">({d.plaque})</span></p>
                    <p className="text-xs text-slate-500">{d.objet}</p>
                    <p className="text-[10px] text-slate-400">Client: {d.client} . {d.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#D4AF37]">{d.montant}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      d.statut === "accepte" ? "bg-green-50 text-green-700" : d.statut === "refuse" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                    }`}>{d.statut === "accepte" ? "Accepte" : d.statut === "refuse" ? "Refuse" : "Envoye"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ━━━━━ FACTURES ━━━━━ */}
        {tab === "factures" && (
          <div className="space-y-2">
            {FACTURES_ATELIER.map((f) => (
              <div key={f.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">{f.ref}</p>
                  <p className="text-sm font-bold text-[#111]">{f.vehicule}</p>
                  <p className="text-[10px] text-slate-400">{f.client} . {f.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#D4AF37]">{f.montant}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${f.statut === "payee" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{f.statut === "payee" ? "Payee" : "En attente"}</span>
                  </div>
                  <button className="rounded-lg bg-[#F5F3EF] p-1.5"><Download size={14} className="text-slate-500" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ━━━━━ CLIENTS ━━━━━ */}
        {tab === "clients" && (
          <div className="space-y-2">
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher un client..." className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 py-2.5 text-sm" />
            </div>
            {CLIENTS_ATELIER.map((c) => (
              <div key={c.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{c.nom}</p>
                    <p className="text-xs text-slate-500">{c.vehicules} vehicule{c.vehicules > 1 ? "s" : ""} . {c.visites} visites</p>
                    <p className="text-[10px] text-slate-400">Derniere: {c.derniere} . Total: {c.total}</p>
                  </div>
                  <div className="flex gap-1">
                    <a href={`tel:${c.tel}`} className="rounded-lg bg-green-50 p-2"><Phone size={14} className="text-green-600" /></a>
                    <button className="rounded-lg bg-[#F5F3EF] p-2"><Eye size={14} className="text-slate-500" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ━━━━━ VEHICULES ━━━━━ */}
        {tab === "vehicules" && (
          <div className="space-y-2">
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher par plaque, VIN, marque..." className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 py-2.5 text-sm" />
            </div>
            {VEHICULES_ATELIER.map((v) => (
              <div key={v.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111]">{v.marque} {v.modele}</p>
                    <p className="text-xs text-slate-500">{v.plaque} . {v.annee} . {v.km} km</p>
                    <p className="text-[10px] text-slate-400">Client: {v.client} . VIN: {v.vin.slice(0, 11)}...</p>
                  </div>
                  <div className="flex gap-1">
                    <Link to="/catalogue-technique" className="rounded-lg bg-[#D4AF37]/10 p-2"><Search size={14} className="text-[#D4AF37]" /></Link>
                    <button className="rounded-lg bg-[#F5F3EF] p-2"><Eye size={14} className="text-slate-500" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ━━━━━ CATALOGUE TECHNIQUE ━━━━━ */}
        {tab === "catalogue" && (
          <CatalogueTechnique />
        )}

        {/* ━━━━━ PIECES ━━━━━ */}
        {tab === "pieces" && (
          <PiecesDetachees />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CATALOGUE TECHNIQUE — Type AutoData
   Tous vehicules (anciens, recents), tous systemes (mecaniques, electroniques,
   electriques, carrosserie). Recherche par plaque ou VIN.
   ══════════════════════════════════════════════════════════════════════════ */

function CatalogueTechnique() {
  const [plaque, setPlaque] = useState("");
  const [found, setFound] = useState(false);
  const [systemTab, setSystemTab] = useState("moteur");

  const doSearch = () => {
    if (plaque.trim().length >= 3) setFound(true);
  };

  const SYSTEMS = [
    { id: "moteur", label: "Moteur", icon: Cog, color: "text-red-500" },
    { id: "distribution", label: "Distribution", icon: Settings, color: "text-orange-500" },
    { id: "embrayage", label: "Embrayage", icon: Disc, color: "text-amber-600" },
    { id: "boite", label: "Boite vitesses", icon: Settings, color: "text-yellow-600" },
    { id: "freinage", label: "Freinage", icon: LifeBuoy, color: "text-blue-500" },
    { id: "direction", label: "Direction", icon: LifeBuoy, color: "text-indigo-500" },
    { id: "suspension", label: "Suspension", icon: Settings, color: "text-violet-500" },
    { id: "refroidissement", label: "Refroidissement", icon: Thermometer, color: "text-cyan-500" },
    { id: "echappement", label: "Echappement", icon: Wind, color: "text-slate-500" },
    { id: "alimentation", label: "Alimentation", icon: Fuel, color: "text-green-600" },
    { id: "turbo", label: "Turbo", icon: Gauge, color: "text-rose-500" },
    { id: "injection", label: "Injection", icon: Zap, color: "text-purple-500" },
    { id: "allumage", label: "Allumage", icon: Zap, color: "text-pink-500" },
    { id: "abs_esp", label: "ABS / ESP", icon: Shield, color: "text-blue-600" },
    { id: "airbags", label: "Airbags", icon: Shield, color: "text-red-600" },
    { id: "climatisation", label: "Climatisation", icon: Thermometer, color: "text-sky-500" },
    { id: "tableau_bord", label: "Tableau de bord", icon: Gauge, color: "text-emerald-500" },
    { id: "capteurs", label: "Capteurs", icon: CircuitBoard, color: "text-teal-500" },
    { id: "calculateurs", label: "Calculateurs", icon: CircuitBoard, color: "text-fuchsia-500" },
    { id: "multiplexage", label: "CAN / LIN", icon: CircuitBoard, color: "text-lime-600" },
    { id: "batterie", label: "Batterie", icon: Battery, color: "text-green-500" },
    { id: "alternateur", label: "Alternateur", icon: Zap, color: "text-amber-500" },
    { id: "demarreur", label: "Demarreur", icon: Zap, color: "text-orange-600" },
    { id: "eclairage", label: "Eclairage", icon: Lightbulb, color: "text-yellow-500" },
    { id: "fusibles", label: "Fusibles", icon: Settings, color: "text-gray-500" },
    { id: "cablage", label: "Cablage", icon: CircuitBoard, color: "text-gray-600" },
  ];

  const DETAILS_MOTEUR = {
    coupleSerrage: [
      { piece: "Culasse", valeur: "40 Nm + 90° + 90°", ordre: "Depuis le centre en spirale" },
      { piece: "Bielle", valeur: "30 Nm + 45°", ordre: "Chapeau de bielle" },
      { piece: "Palier vilebrequin", valeur: "25 Nm + 60°", ordre: "Du centre vers l'exterieur" },
      { piece: "Bougie allumage", valeur: "25 Nm", ordre: "-" },
      { piece: "Injecteur", valeur: "9 Nm", ordre: "-" },
      { piece: "Carter huile", valeur: "10 Nm", ordre: "En etoile" },
      { piece: "Couvre-culasse", valeur: "8 Nm", ordre: "En spirale" },
      { piece: "Collecteur admission", valeur: "20 Nm", ordre: "Du centre" },
      { piece: "Collecteur echappement", valeur: "25 Nm", ordre: "Du centre" },
      { piece: "Capteur pression huile", valeur: "15 Nm", ordre: "-" },
    ],
    tempsBaremes: [
      { operation: "Vidange + filtre huile", temps: "0.5h", difficulte: "Facile" },
      { operation: "Remplacement bougies (4 cyl)", temps: "0.8h", difficulte: "Facile" },
      { operation: "Distribution complete", temps: "4.5h", difficulte: "Expert" },
      { operation: "Joints de culasse", temps: "6.0h", difficulte: "Expert" },
      { operation: "Remplacement turbo", temps: "3.5h", difficulte: "Avance" },
      { operation: "Injecteurs (4 cyl)", temps: "2.0h", difficulte: "Avance" },
      { operation: "Pompe a eau", temps: "2.5h", difficulte: "Moyen" },
      { operation: "Courroie accessoire", temps: "0.7h", difficulte: "Facile" },
      { operation: "Support moteur (1x)", temps: "1.5h", difficulte: "Moyen" },
      { operation: "Joint carter huile", temps: "3.0h", difficulte: "Avance" },
    ],
    capacites: [
      { type: "Huile moteur", quantite: "5.2 L", spec: "5W-30 ACEA C2" },
      { type: "Liquide refroidissement", quantite: "7.5 L", spec: "Type D / Rose-Orange" },
      { type: "Liquide de frein", quantite: "0.6 L", spec: "DOT 4+" },
      { type: "Liquide direction", quantite: "1.1 L", spec: "ATF Dexron III" },
      { type: "Reservoir carburant", quantite: "53 L", spec: "Sans plomb 95/98" },
      { type: "Huile boite auto", quantite: "6.8 L", spec: "ATF AW-1" },
    ],
  };

  return (
    <div className="space-y-3">
      {/* Recherche par plaque/VIN */}
      <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
        <h2 className="text-sm font-bold text-[#111] mb-3 flex items-center gap-2"><Search size={14} className="text-[#D4AF37]" /> Catalogue technique</h2>
        <p className="text-xs text-slate-500 mb-3">Recherchez par plaque ou VIN — tous vehicules, tous systemes</p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-[9px] font-bold text-white bg-blue-600 px-1 rounded">F</span>
            </div>
            <input
              type="text"
              value={plaque}
              onChange={(e) => setPlaque(e.target.value.toUpperCase())}
              placeholder="AB-123-CD ou VIN"
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F5F3EF] pl-10 pr-3 py-3 text-sm font-bold text-center tracking-widest uppercase"
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
          </div>
          <button onClick={doSearch} className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-white"><Search size={16} /></button>
        </div>
      </div>

      {found && (
        <>
          {/* Fiche vehicule identifie */}
          <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm font-bold text-green-400">Vehicule identifie</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {[
                ["Marque", "Peugeot"], ["Modele", "3008 GT"], ["Version", "1.6 PureTech 225 Hybrid4"],
                ["Annee", "2024"], ["Motorisation", "EP6FADTX (225 ch)"], ["Cylindree", "1 598 cm3"],
                ["Puissance", "225 ch / 165 kW"], ["Couple", "300 Nm"], ["Norme", "Euro 6d"],
                ["Transmission", "BVA 8 EAT8"], ["Poids", "1 880 kg"], ["Dimensions", "4 447 x 1 841 x 1 620 mm"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">{label}</span>
                  <span className="font-bold text-white">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Systemes */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h3 className="text-sm font-bold text-[#111] mb-3">Systemes techniques</h3>
            <div className="flex flex-wrap gap-1.5">
              {SYSTEMS.map((s) => {
                const Icon = s.icon;
                return (
                  <button key={s.id} onClick={() => setSystemTab(s.id)} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${systemTab === s.id ? "bg-[#111] text-[#D4AF37]" : "bg-[#F5F3EF] text-[#6B7280] hover:bg-[#E5E7EB]"}`}>
                    <Icon size={10} className={systemTab === s.id ? "text-[#D4AF37]" : s.color} /> {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Donnees techniques du systeme selectionne */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2">
              <h3 className="text-xs font-bold text-[#D4AF37]">Couples de serrage — {SYSTEMS.find((s) => s.id === systemTab)?.label}</h3>
            </div>
            {DETAILS_MOTEUR.coupleSerrage.map((c, i) => (
              <div key={i} className="flex items-center px-3 py-2 border-b border-[#F3F4F6] last:border-0 text-xs">
                <span className="w-[35%] text-slate-500">{c.piece}</span>
                <span className="w-[30%] font-bold text-[#111]">{c.valeur}</span>
                <span className="w-[35%] text-slate-400">{c.ordre}</span>
              </div>
            ))}
          </div>

          {/* Temps baremes */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2">
              <h3 className="text-xs font-bold text-[#D4AF37]">Temps baremes</h3>
            </div>
            {DETAILS_MOTEUR.tempsBaremes.map((t, i) => (
              <div key={i} className="flex items-center px-3 py-2 border-b border-[#F3F4F6] last:border-0 text-xs">
                <span className="w-[45%] text-slate-500">{t.operation}</span>
                <span className="w-[20%] font-bold text-[#111]">{t.temps}</span>
                <span className={`w-[35%] font-bold ${t.difficulte === "Expert" ? "text-red-500" : t.difficulte === "Avance" ? "text-orange-500" : t.difficulte === "Moyen" ? "text-amber-500" : "text-green-500"}`}>{t.difficulte}</span>
              </div>
            ))}
          </div>

          {/* Capacites */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2">
              <h3 className="text-xs font-bold text-[#D4AF37]">Capacites & specifications</h3>
            </div>
            {DETAILS_MOTEUR.capacites.map((c, i) => (
              <div key={i} className="flex items-center px-3 py-2 border-b border-[#F3F4F6] last:border-0 text-xs">
                <span className="w-[35%] text-slate-500">{c.type}</span>
                <span className="w-[25%] font-bold text-[#111]">{c.quantite}</span>
                <span className="w-[40%] text-slate-400">{c.spec}</span>
              </div>
            ))}
          </div>

          {/* Schema cliquable */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h3 className="text-sm font-bold text-[#111] mb-3">Schema interactif — Moteur</h3>
            <p className="text-xs text-slate-500 mb-3">Cliquez sur un element pour voir sa reference et commander</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { nom: "Bougie allumage", ref: "PSA 9806 043 880", dispo: true, prix: "12 EUR" },
                { nom: "Filtre a huile", ref: "PSA 1109 CK", dispo: true, prix: "15 EUR" },
                { nom: "Filtre a air", ref: "PSA 1444 TT", dispo: true, prix: "22 EUR" },
                { nom: "Injecteur", ref: "Continental A2C59517051", dispo: false, prix: "195 EUR" },
                { nom: "Bobine allumage", ref: "PSA 9808 653 680", dispo: true, prix: "58 EUR" },
                { nom: "Courroie distrib.", ref: "Gates K026PK1078", dispo: true, prix: "45 EUR" },
                { nom: "Pompe a eau", ref: "SKF VKPC 83649", dispo: true, prix: "89 EUR" },
                { nom: "Thermostat", ref: "PSA 1336 Z7", dispo: false, prix: "42 EUR" },
                { nom: "Capteur PMH", ref: "PSA 1920 LS", dispo: true, prix: "35 EUR" },
                { nom: "Turbo", ref: "Garrett 784011-5005S", dispo: false, prix: "890 EUR" },
                { nom: "Joint culasse", ref: "Elring 150.131", dispo: true, prix: "78 EUR" },
                { nom: "Kit embrayage", ref: "Valeo 826 818", dispo: true, prix: "420 EUR" },
              ].map((p, i) => (
                <button key={i} className={`rounded-lg border p-2 text-left transition hover:shadow-md ${p.dispo ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
                  <p className="text-[10px] font-bold text-[#111] truncate">{p.nom}</p>
                  <p className="text-[8px] text-slate-400 truncate">{p.ref}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#D4AF37]">{p.prix}</span>
                    <span className={`text-[8px] font-bold ${p.dispo ? "text-green-600" : "text-red-500"}`}>{p.dispo ? "En stock" : "Commande"}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!found && (
        <div className="text-center py-8">
          <Car size={40} className="mx-auto text-[#D4AF37] opacity-40" />
          <p className="mt-3 text-sm font-semibold text-[#6B7280]">Entrez une plaque ou un VIN</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Le catalogue identifiera automatiquement le vehicule et affichera toutes les donnees techniques</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PIECES DETACHEES — Stock, commandes, integration devis
   ══════════════════════════════════════════════════════════════════════════ */

function PiecesDetachees() {
  const STOCK = [
    { id: 1, nom: "Plaquettes freins AV ATE", ref: "ATE 13.0460-7186.2", qte: 8, prix: "32 EUR", categorie: "Freinage" },
    { id: 2, nom: "Filtre huile PSA 1.6", ref: "PSA 1109 CK", qte: 15, prix: "12 EUR", categorie: "Filtration" },
    { id: 3, nom: "Bougie NGK", ref: "NGK LZKR6AI-10G", qte: 24, prix: "9 EUR", categorie: "Allumage" },
    { id: 4, nom: "Courroie accessoire Gates", ref: "Gates 6PK1078", qte: 3, prix: "25 EUR", categorie: "Distribution" },
    { id: 5, nom: "Disque frein AV Brembo", ref: "Brembo 09.B265.10", qte: 4, prix: "65 EUR", categorie: "Freinage" },
    { id: 6, nom: "Amortisseur AR Monroe", ref: "Monroe G7387", qte: 2, prix: "78 EUR", categorie: "Suspension" },
    { id: 7, nom: "Liquide frein DOT4 1L", ref: "TRW PFB440", qte: 6, prix: "8 EUR", categorie: "Liquides" },
    { id: 8, nom: "Huile 5W30 Total 5L", ref: "Total Quartz 9000", qte: 10, prix: "35 EUR", categorie: "Lubrifiants" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-[#111]">Stock pieces</h2>
        <button className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1"><Plus size={12} /> Commander</button>
      </div>
      <div className="relative mb-2">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Rechercher par nom, reference..." className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 py-2.5 text-sm" />
      </div>
      {STOCK.map((p) => (
        <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#111]">{p.nom}</p>
            <p className="text-xs text-slate-400">{p.ref} . {p.categorie}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-[#D4AF37]">{p.prix}</p>
              <p className={`text-[10px] font-bold ${p.qte > 5 ? "text-green-600" : p.qte > 0 ? "text-amber-600" : "text-red-600"}`}>Stock: {p.qte}</p>
            </div>
            <button className="rounded-lg bg-[#D4AF37]/10 p-2"><Plus size={14} className="text-[#D4AF37]" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
