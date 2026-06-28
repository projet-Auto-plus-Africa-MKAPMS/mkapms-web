import { Link } from "react-router-dom";
import { ChevronLeft, Users, Plus, Shield, Check } from "lucide-react";
const ROLES = [
  { role: "Directeur", desc: "Accès complet", count: 1 },
  { role: "Responsable VO", desc: "Gestion stock et ventes", count: 1 },
  { role: "Commercial", desc: "Gestion clients et annonces", count: 2 },
  { role: "Comptable", desc: "Factures, paiements, TVA", count: 1 },
  { role: "Préparateur", desc: "Photos, préparation, mise en ligne", count: 1 },
  { role: "Mécanicien", desc: "Diagnostic, réparations, entretien", count: 2 },
];
import { useState } from "react";
import { X, Mail, Phone, Briefcase, Calendar } from "lucide-react";

export default function GestionEmployes() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<any>(null);

  // Mock data pour la démo
  const EMPLOYES_PAR_ROLE: Record<string, any[]> = {
    "Commercial": [
      { id: 1, nom: "Jean Dupont", email: "jean.d@mkapms.fr", tel: "06 01 02 03 04", poste: "Commercial Senior", inscrit: "12/02/2024" },
      { id: 2, nom: "Marie Curie", email: "marie.c@mkapms.fr", tel: "06 05 06 07 08", poste: "Commercial Junior", inscrit: "01/05/2024" }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Dashboard
        </Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Users size={20} className="text-[#D4AF37]" /> Équipe Vente
        </h1>
        <p className="mt-1 text-[10px] text-white/50 uppercase font-bold tracking-wider">Gestion des collaborateurs</p>
      </div>

      <div className="px-4 mt-4 space-y-2">
        {ROLES.map(r => (
          <div key={r.role} className="overflow-hidden rounded-xl bg-white border border-[#E5E7EB]">
            <button 
              onClick={() => setSelectedRole(selectedRole === r.role ? null : r.role)}
              className="w-full p-4 flex items-center gap-3 active:bg-slate-50 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                <Users size={16} className="text-[#D4AF37]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-bold text-[#111]">{r.role}</h3>
                <p className="text-[10px] text-[#6B7280]">{r.desc}</p>
              </div>
              <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[10px] font-black text-[#111]">{r.count}</span>
            </button>

            {selectedRole === r.role && (
              <div className="px-4 pb-4 space-y-2 border-t border-[#E5E7EB] pt-3 bg-slate-50/50">
                {(EMPLOYES_PAR_ROLE[r.role] || []).map(emp => (
                  <button 
                    key={emp.id}
                    onClick={() => setEditModal(emp)}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white p-3 flex items-center justify-between active:scale-[0.98] transition-all"
                  >
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#111]">{emp.nom}</p>
                      <p className="text-[9px] text-[#6B7280]">{emp.email}</p>
                    </div>
                    <ChevronLeft size={12} className="rotate-180 text-[#9CA3AF]" />
                  </button>
                ))}
                {(!EMPLOYES_PAR_ROLE[r.role] || EMPLOYES_PAR_ROLE[r.role].length === 0) && (
                  <p className="text-center py-2 text-[10px] text-[#6B7280] italic">Aucun employé dans cette catégorie</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 mt-4">
        <button className="w-full rounded-xl bg-[#111] py-3.5 text-xs font-black uppercase text-[#D4AF37] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-black/10">
          <Plus size={16} /> Recruter un collaborateur
        </button>
      </div>

      {/* Modal Modification Employé */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditModal(null)}>
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(ev) => ev.stopPropagation()}>
            <div className="bg-[#111] p-6 relative">
              <button onClick={() => setEditModal(null)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><X size={16} className="text-white" /></button>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center">
                  <Users size={32} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{editModal.nom}</h2>
                  <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest">{editModal.poste}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider">Informations personnelles</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#9CA3AF] uppercase ml-1">Nom complet</label>
                    <input className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs font-bold outline-none focus:border-[#D4AF37]" value={editModal.nom} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#9CA3AF] uppercase ml-1">Email professionnel</label>
                      <input className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs font-bold outline-none focus:border-[#D4AF37]" value={editModal.email} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#9CA3AF] uppercase ml-1">Téléphone</label>
                      <input className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs font-bold outline-none focus:border-[#D4AF37]" value={editModal.tel} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#9CA3AF] uppercase ml-1">Poste occupé</label>
                    <input className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs font-bold outline-none focus:border-[#D4AF37]" value={editModal.poste} />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button className="flex-1 rounded-xl border border-[#E5E7EB] py-3.5 text-xs font-black uppercase text-[#6B7280]">Désactiver</button>
                <button className="flex-1 rounded-xl bg-[#D4AF37] py-3.5 text-xs font-black uppercase text-white shadow-lg shadow-[#D4AF37]/20">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
