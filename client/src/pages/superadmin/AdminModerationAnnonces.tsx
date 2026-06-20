import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Eye, ChevronDown, Check, X, Clock } from "lucide-react";

const ANNONCES = [
  { id: 1, titre: "BMW Serie 3 320d 2020", vendeur: "Pierre L.", prix: "28 500 EUR", soumise: "09/06 14:20", statut: "en_attente" },
  { id: 2, titre: "Renault Clio V 2022", vendeur: "Marie K.", prix: "16 900 EUR", soumise: "09/06 12:00", statut: "en_attente" },
  { id: 3, titre: "Mercedes Classe A 200", vendeur: "Garage Auto 93", prix: "32 000 EUR", soumise: "09/06 10:30", statut: "approuvee" },
  { id: 4, titre: "Peugeot 308 SW", vendeur: "vendeur_suspect", prix: "2 500 EUR", soumise: "08/06 22:00", statut: "refusee" },
  { id: 5, titre: "Audi A4 Avant 2021", vendeur: "Flash Location", prix: "34 900 EUR", soumise: "08/06 18:00", statut: "approuvee" },
];

export default function AdminModerationAnnonces() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Eye size={20} className="text-[#D4AF37]" /> Moderation annonces</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "En attente", v: "8", c: "text-amber-500" },
          { l: "Approuvees", v: "1 245", c: "text-green-500" },
          { l: "Refusees", v: "34", c: "text-red-500" },
        ].map((s) => (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>
      <div className="px-4 mt-4 space-y-2">
        {ANNONCES.map((a) => {
          const isExp = expanded === a.id;
          return (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : a.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${a.statut === "en_attente" ? "bg-amber-50" : a.statut === "approuvee" ? "bg-green-50" : "bg-red-50"}`}>
                  {a.statut === "en_attente" ? <Clock size={14} className="text-amber-500" /> : a.statut === "approuvee" ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{a.titre}</p>
                  <p className="text-[10px] text-[#6B7280]">{a.vendeur} · {a.soumise}</p>
                </div>
                <span className="text-xs font-black text-[#D4AF37]">{a.prix}</span>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="flex gap-2">
                    <button className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white">Approuver</button>
                    <button className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[9px] font-bold text-white">Voir</button>
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
