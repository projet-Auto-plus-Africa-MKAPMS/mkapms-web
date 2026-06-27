import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Users, Plus, Check, Clock, AlertCircle,
  FileCheck, Trash2, Edit, User, Shield, X
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   GESTION DES CONDUCTEURS
   Entreprises : ajouter conducteurs avec documents séparés (permis, ID, validation).
   ══════════════════════════════════════════════════════════════════════════ */

const CONDUCTEURS = [
  { id: 1, nom: "Jean Dupont", role: "Commercial", permis: "valide" as const, identite: "valide" as const, photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", dateAjout: "15/01/2025", vehiculesAutorises: 3 },
  { id: 2, nom: "Marie Lambert", role: "Gestionnaire flotte", permis: "valide" as const, identite: "valide" as const, photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", dateAjout: "20/01/2025", vehiculesAutorises: 5 },
  { id: 3, nom: "Karim Benali", role: "Chauffeur", permis: "en_attente" as const, identite: "valide" as const, photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face", dateAjout: "01/03/2025", vehiculesAutorises: 1 },
];

const DOC_STATUS = {
  valide: { label: "Validé", color: "text-green-600", bg: "bg-green-50", icon: Check },
  en_attente: { label: "En attente", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  refuse: { label: "Refusé", color: "text-red-600", bg: "bg-red-50", icon: X },
};

export default function GestionConducteurs() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Conducteurs</h1>
        <p className="mt-1 text-sm text-white/60">Gérez les conducteurs autorisés de votre flotte</p>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-xl font-black text-[#111]">{CONDUCTEURS.length}</p><p className="text-[10px] text-[#6B7280]">Conducteurs</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-xl font-black text-green-600">{CONDUCTEURS.filter((c) => c.permis === "valide" && c.identite === "valide").length}</p><p className="text-[10px] text-[#6B7280]">Validés</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-xl font-black text-amber-600">{CONDUCTEURS.filter((c) => c.permis === "en_attente" || c.identite === "en_attente").length}</p><p className="text-[10px] text-[#6B7280]">En attente</p>
        </div>
      </div>

      {/* Add button */}
      <div className="px-4 mt-4">
        <button onClick={() => setShowAdd(!showAdd)} className="w-full rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 py-4 text-sm font-bold text-[#D4AF37] flex items-center justify-center gap-2 active:scale-[0.98]">
          <Plus size={16} /> Ajouter un conducteur
        </button>
      </div>

      {showAdd && (
        <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Nouveau conducteur</h3>
          <div><label className="text-xs text-[#6B7280]">Nom complet</label><input type="text" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" placeholder="Prénom Nom" /></div>
          <div><label className="text-xs text-[#6B7280]">Rôle</label><input type="text" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" placeholder="Commercial, Chauffeur, etc." /></div>
          <div><label className="text-xs text-[#6B7280]">Email</label><input type="email" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" placeholder="email@entreprise.com" /></div>
          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-lg border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 py-4 text-xs font-semibold text-[#D4AF37] flex flex-col items-center gap-1"><FileCheck size={16} /> Permis</button>
            <button className="rounded-lg border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 py-4 text-xs font-semibold text-[#D4AF37] flex flex-col items-center gap-1"><FileCheck size={16} /> Pièce d'identité</button>
          </div>
          <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Ajouter le conducteur</button>
        </div>
      )}

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {CONDUCTEURS.map((c) => {
          const permisS = DOC_STATUS[c.permis];
          const idS = DOC_STATUS[c.identite];
          const PermisIcon = permisS.icon;
          const IdIcon = idS.icon;
          return (
            <div key={c.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-3">
                <img src={c.photo} alt={c.nom} className="h-12 w-12 rounded-full object-cover" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#111]">{c.nom}</h3>
                  <p className="text-[10px] text-[#6B7280]">{c.role} · Ajouté le {c.dateAjout}</p>
                </div>
                <button className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center"><Edit size={14} className="text-[#6B7280]" /></button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2">
                  <PermisIcon size={12} className={permisS.color} />
                  <div><p className="text-[9px] text-[#6B7280]">Permis</p><p className={`text-[11px] font-semibold ${permisS.color}`}>{permisS.label}</p></div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2">
                  <IdIcon size={12} className={idS.color} />
                  <div><p className="text-[9px] text-[#6B7280]">Identité</p><p className={`text-[11px] font-semibold ${idS.color}`}>{idS.label}</p></div>
                </div>
              </div>
              <div className="mt-2 rounded-lg bg-[#F5F3EF] px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-[#6B7280]">Véhicules autorisés</span>
                <span className="text-sm font-bold text-[#111]">{c.vehiculesAutorises}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
