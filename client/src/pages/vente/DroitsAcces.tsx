import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check } from "lucide-react";
const MODULES = ["Véhicules", "Factures", "Documents", "Employés", "Paiements", "Comptabilité", "Statistiques"];
export default function DroitsAcces() {
  const [perms, setPerms] = useState<Record<string, boolean>>({Véhicules: true, Factures: true, Documents: true, Employés: false, Paiements: false, Comptabilité: false, Statistiques: true});
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/employes" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Employés</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} /> Droits d'accès</h1><p className="mt-1 text-sm text-white/80">Commercial — Jean D.</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">{MODULES.map(m => (
        <label key={m} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0">
          <input type="checkbox" checked={perms[m] || false} onChange={() => setPerms({...perms, [m]: !perms[m]})} className="h-5 w-5 rounded accent-blue-600" />
          <span className="text-sm text-[#111]">{m}</span>
        </label>))}</div>
      <div className="px-4 mt-4"><button className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98]">Enregistrer les droits</button></div>
    </div>
  );
}
