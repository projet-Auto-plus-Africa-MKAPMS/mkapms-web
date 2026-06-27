import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users, Car, Home, Wrench, FileText, MessageSquare, Calculator, Shield, ChevronRight, Plus } from "lucide-react";
const ROLES = [
  { role: "Responsable Vente", icon: Car, color: "#8B5CF6", access: "Annonces, réservations, clients vente", restrict: "Comptabilité complète" },
  { role: "Responsable Location", icon: Home, color: "#3B82F6", access: "Réservations, contrats, cautions, paiements location", restrict: "Annonces vente" },
  { role: "Responsable Garage", icon: Wrench, color: "#F59E0B", access: "Planning, mécaniciens, devis, réparations", restrict: "Finance globale" },
  { role: "Responsable Démarches", icon: FileText, color: "#10B981", access: "Cartes grises, dossiers, documents", restrict: "Paiements globaux" },
  { role: "Responsable Support", icon: MessageSquare, color: "#EF4444", access: "Tickets, réclamations, messages", restrict: "Validation annonces" },
  { role: "Comptable", icon: Calculator, color: "#14B8A6", access: "Factures, paiements, remboursements, commissions", restrict: "Modification annonces" },
  { role: "Administrateur Général", icon: Shield, color: "#D4AF37", access: "Validation comptes, annonces, documents, clients", restrict: "Finances fondateur, abonnements" },
];
const EMPLOYEES = [
  { name: "Sophie Martin", role: "Responsable Vente", status: "actif" },
  { name: "Lucas Bernard", role: "Responsable Location", status: "actif" },
  { name: "Marie Dupont", role: "Responsable Garage", status: "actif" },
  { name: "Ahmed Diallo", role: "Responsable Démarches", status: "actif" },
  { name: "Julie Moreau", role: "Responsable Support", status: "actif" },
  { name: "Pierre Lambert", role: "Comptable", status: "actif" },
];
export default function GestionEmployesMKAPMS() {
  const [tab, setTab] = useState<"roles"|"employes">("roles");
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Employés MKA.P-MS</h1>
      </div>
      <div className="px-4 mt-3 flex gap-2 mb-4">
        {(["roles", "employes"] as const).map(t => (<button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${tab === t ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>{t === "roles" ? "Rôles & Droits" : "Équipe"}</button>))}
      </div>
      {tab === "roles" && <div className="px-4 space-y-2">
        {ROLES.map(r => { const Icon = r.icon; return (
          <div key={r.role} className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: r.color + "20" }}><Icon size={14} style={{ color: r.color }} /></div><p className="text-sm font-bold text-[#111]">{r.role}</p></div>
            <p className="text-[10px] text-[#10B981] mb-1">✓ Accès : {r.access}</p>
            <p className="text-[10px] text-[#EF4444]">✗ Restreint : {r.restrict}</p>
          </div>); })}
      </div>}
      {tab === "employes" && <div className="px-4 space-y-2">
        <button className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D4AF37] py-3 text-[#D4AF37] text-sm font-bold"><Plus size={16} /> Ajouter un employé</button>
        {EMPLOYEES.map(e => (
          <div key={e.name} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="h-9 w-9 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-sm font-bold text-[#D4AF37]">{e.name[0]}</div>
            <div className="flex-1"><p className="text-sm font-semibold text-[#111]">{e.name}</p><p className="text-[10px] text-[#6B7280]">{e.role}</p></div>
            <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{e.status}</span>
          </div>))}
      </div>}
    </div>
  );
}
