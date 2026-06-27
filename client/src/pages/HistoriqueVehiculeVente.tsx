import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, History, Search, Check, AlertTriangle, X, Shield, Car } from "lucide-react";

export default function HistoriqueVehiculeVente() {
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><History size={20} className="text-[#D4AF37]" /> Historique véhicule</h1>
        <p className="mt-1 text-sm text-white/60">VIN ou immatriculation — rapport complet</p>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <label className="text-sm font-bold text-[#111]">Recherche par VIN ou immatriculation</label>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-3">
          <Search size={14} className="text-[#6B7280]" />
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="VIN ou AB-123-CD…" className="w-full bg-transparent text-sm font-semibold outline-none uppercase" />
        </div>
        <button onClick={() => setShowResult(true)} className={`mt-3 w-full rounded-xl py-3.5 text-sm font-bold text-white transition ${input.length >= 4 ? "bg-[#D4AF37] active:scale-[0.98]" : "bg-[#D4D4D4]"}`} disabled={input.length < 4}>
          Rechercher l'historique
        </button>
      </div>

      {showResult && (
        <div className="mx-4 mt-4 space-y-3">
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
            <Car size={20} className="text-[#D4AF37]" />
            <div><h3 className="text-sm font-bold text-[#111]">Peugeot 3008 GT — 2022</h3><p className="text-[10px] text-[#6B7280]">Hybride · 45 000 km · France</p></div>
          </div>
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-4 py-2"><h3 className="text-xs font-bold text-[#D4AF37]">Rapport complet</h3></div>
            {[
              { label: "Kilométrage", value: "45 230 km", ok: true, detail: "Cohérent avec l'historique" },
              { label: "Contrôle technique", value: "Valide jusqu'au 15/09/2025", ok: true, detail: "Aucune contre-visite" },
              { label: "Sinistres", value: "Aucun", ok: true, detail: "Aucun sinistre déclaré" },
              { label: "Vol", value: "Non signalé", ok: true, detail: "Véhicule non signalé volé" },
              { label: "Gage", value: "Non gagé", ok: true, detail: "Aucun gage ou opposition" },
              { label: "Entretiens", value: "8 interventions", ok: true, detail: "Carnet suivi chez concessionnaire" },
              { label: "Propriétaires", value: "2", ok: true, detail: "1er: 2022-2023, 2e: 2023-présent" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3 px-4 py-3 border-b border-[#F3F4F6] last:border-0">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${r.ok ? "bg-green-50" : "bg-red-50"}`}>
                  {r.ok ? <Check size={12} className="text-green-600" /> : <AlertTriangle size={12} className="text-red-600" />}
                </div>
                <div className="flex-1"><p className="text-sm font-semibold text-[#111]">{r.label}</p><p className="text-[9px] text-[#6B7280]">{r.detail}</p></div>
                <span className="text-xs font-bold text-[#111]">{r.value}</span>
              </div>
            ))}
          </div>
          <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Télécharger le rapport PDF</button>
        </div>
      )}
    </div>
  );
}
