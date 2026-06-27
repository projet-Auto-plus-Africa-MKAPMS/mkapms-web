import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileCheck, ChevronDown, Check, X, Clock, Eye } from "lucide-react";

const DOCS = [
  { id: 1, type: "SIRET", client: "Garage Auto 93", soumis: "08/06/2025", statut: "en_attente", fichier: "siret_garage93.pdf" },
  { id: 2, type: "Carte d'identite", client: "Martin D.", soumis: "07/06/2025", statut: "valide", fichier: "cni_martin.pdf" },
  { id: 3, type: "Kbis", client: "LuxDrive VTC", soumis: "06/06/2025", statut: "en_attente", fichier: "kbis_luxdrive.pdf" },
  { id: 4, type: "Assurance pro", client: "Carrosserie SD", soumis: "05/06/2025", statut: "valide", fichier: "assurance_carrosserie.pdf" },
  { id: 5, type: "Permis VTC", client: "LuxDrive VTC", soumis: "06/06/2025", statut: "refuse", fichier: "permis_vtc.pdf" },
];

export default function AdminValidationDocs() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileCheck size={20} className="text-[#D4AF37]" /> Validation documents</h1>
      </div>

      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "En attente", v: "5", c: "text-amber-500" },
          { l: "Valides", v: "234", c: "text-green-500" },
          { l: "Refuses", v: "12", c: "text-red-500" },
        ].map((s) => (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-2">
        {DOCS.map((d) => {
          const isExp = expanded === d.id;
          return (
            <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : d.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${d.statut === "en_attente" ? "bg-amber-50" : d.statut === "valide" ? "bg-green-50" : "bg-red-50"}`}>
                  {d.statut === "en_attente" ? <Clock size={14} className="text-amber-500" /> : d.statut === "valide" ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{d.type}</p>
                  <p className="text-[10px] text-[#6B7280]">{d.client} · {d.soumis}</p>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Fichier</span><p className="font-bold text-[#111]">{d.fichier}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Statut</span><p className={`font-bold ${d.statut === "valide" ? "text-green-600" : d.statut === "refuse" ? "text-red-600" : "text-amber-600"}`}>{d.statut}</p></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1"><Eye size={10} /> Voir</button>
                    <button className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white">Valider</button>
                    <button className="flex-1 rounded-lg bg-red-50 py-1.5 text-[9px] font-bold text-red-600">Refuser</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
