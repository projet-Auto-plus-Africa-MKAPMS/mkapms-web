import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Upload, Check, Clock, AlertCircle, XCircle, Eye,
  ChevronDown, Search, Filter, Download, Plus, Shield, Car,
  Wrench, Briefcase, CreditCard, FileCheck
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   CENTRE DE DOCUMENTS
   Tous les documents restent dans la plateforme.
   Présent dans : Vente, Location, Garage, VTC, Taxi, Démarches admin.
   ══════════════════════════════════════════════════════════════════════════ */

type DocStatus = "attente" | "envoye" | "recu" | "verification" | "refuse" | "a_completer" | "valide";

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: typeof Check }> = {
  attente: { label: "En attente", color: "text-[#6B7280]", bg: "bg-[#F3F4F6]", icon: Clock },
  envoye: { label: "Envoyé", color: "text-blue-600", bg: "bg-blue-50", icon: Upload },
  recu: { label: "Reçu", color: "text-indigo-600", bg: "bg-indigo-50", icon: FileText },
  verification: { label: "En vérification", color: "text-amber-600", bg: "bg-amber-50", icon: Eye },
  refuse: { label: "Refusé", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
  a_completer: { label: "À compléter", color: "text-orange-600", bg: "bg-orange-50", icon: AlertCircle },
  valide: { label: "Validé", color: "text-green-600", bg: "bg-green-50", icon: Check },
};

const CATEGORIES = [
  { id: "tous", label: "Tous", icon: FileText },
  { id: "vente", label: "Vente", icon: Car },
  { id: "location", label: "Location", icon: CreditCard },
  { id: "garage", label: "Garage", icon: Wrench },
  { id: "vtc", label: "VTC & Taxi", icon: Shield },
  { id: "admin", label: "Admin", icon: Briefcase },
];

const DOCUMENTS = [
  { id: 1, nom: "Pièce d'identité", type: "location", statut: "valide" as DocStatus, date: "2025-01-15", taille: "2.4 Mo" },
  { id: 2, nom: "Permis de conduire", type: "location", statut: "valide" as DocStatus, date: "2025-01-15", taille: "1.8 Mo" },
  { id: 3, nom: "Carte VTC", type: "vtc", statut: "verification" as DocStatus, date: "2025-02-01", taille: "3.1 Mo" },
  { id: 4, nom: "KBIS Société", type: "admin", statut: "envoye" as DocStatus, date: "2025-02-10", taille: "1.2 Mo" },
  { id: 5, nom: "Assurance RC Pro", type: "vtc", statut: "a_completer" as DocStatus, date: "2025-02-12", taille: "0 Mo" },
  { id: 6, nom: "Carte grise véhicule", type: "vente", statut: "valide" as DocStatus, date: "2025-01-20", taille: "1.5 Mo" },
  { id: 7, nom: "Contrôle technique", type: "garage", statut: "attente" as DocStatus, date: "2025-03-01", taille: "0 Mo" },
  { id: 8, nom: "Justificatif de domicile", type: "location", statut: "refuse" as DocStatus, date: "2025-02-05", taille: "0.8 Mo" },
  { id: 9, nom: "Attestation URSSAF", type: "vtc", statut: "recu" as DocStatus, date: "2025-02-20", taille: "0.5 Mo" },
];

export default function CentreDocuments() {
  const [cat, setCat] = useState("tous");
  const [search, setSearch] = useState("");

  const filtered = DOCUMENTS.filter((d) => {
    if (cat !== "tous" && d.type !== cat) return false;
    if (search && !d.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = { total: DOCUMENTS.length, valide: DOCUMENTS.filter((d) => d.statut === "valide").length, en_cours: DOCUMENTS.filter((d) => !["valide", "refuse"].includes(d.statut)).length, refuse: DOCUMENTS.filter((d) => d.statut === "refuse").length };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white">Centre de documents</h1>
        <p className="mt-1 text-sm text-white/60">Tous vos documents au même endroit</p>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2">
        {[
          { label: "Validés", value: counts.valide, color: "text-green-600" },
          { label: "En cours", value: counts.en_cours, color: "text-amber-600" },
          { label: "Refusés", value: counts.refuse, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-[#6B7280]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input type="text" placeholder="Rechercher un document…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.id} onClick={() => setCat(c.id)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${cat === c.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={12} /> {c.label}
            </button>
          );
        })}
      </div>

      {/* Upload button */}
      <div className="px-4 mt-4">
        <button className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 py-4 text-sm font-bold text-[#D4AF37] active:scale-[0.98] transition">
          <Plus size={16} /> Ajouter un document
        </button>
      </div>

      {/* Documents list */}
      <div className="px-4 mt-4 space-y-2">
        {filtered.map((d) => {
          const s = STATUS_CONFIG[d.statut];
          const SIcon = s.icon;
          return (
            <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EF]">
                    <FileText size={18} className="text-[#6B7280]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111]">{d.nom}</h3>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">{d.date} · {d.taille}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.color} ${s.bg}`}>
                  <SIcon size={10} /> {s.label}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                {d.statut === "valide" && <button className="flex-1 rounded-lg bg-[#F5F3EF] py-2 text-xs font-semibold text-[#6B7280] flex items-center justify-center gap-1"><Download size={12} /> Télécharger</button>}
                {d.statut === "refuse" && <button className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-semibold text-red-600 flex items-center justify-center gap-1"><Upload size={12} /> Renvoyer</button>}
                {d.statut === "a_completer" && <button className="flex-1 rounded-lg bg-[#D4AF37]/10 py-2 text-xs font-semibold text-[#D4AF37] flex items-center justify-center gap-1"><Upload size={12} /> Compléter</button>}
                {d.statut === "attente" && <button className="flex-1 rounded-lg bg-[#D4AF37]/10 py-2 text-xs font-semibold text-[#D4AF37] flex items-center justify-center gap-1"><Upload size={12} /> Envoyer</button>}
                <button className="rounded-lg bg-[#F5F3EF] px-3 py-2 text-xs font-semibold text-[#6B7280]"><Eye size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <FileText size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun document trouvé</p>
        </div>
      )}
    </div>
  );
}
