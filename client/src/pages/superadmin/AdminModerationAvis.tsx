import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MessageSquare, ChevronDown, Star, Check, X } from "lucide-react";

const AVIS = [
  { id: 1, auteur: "Sophie L.", cible: "Garage Auto 93", note: 5, commentaire: "Excellent service, reparation rapide et prix correct.", date: "09/06 15:00", statut: "en_attente" },
  { id: 2, auteur: "Paul M.", cible: "LuxDrive VTC", note: 4, commentaire: "Tres bon chauffeur, voiture propre.", date: "09/06 13:30", statut: "approuve" },
  { id: 3, auteur: "Anonymous", cible: "Carrosserie SD", note: 1, commentaire: "ARNAQUE!! NE PAS ALLER!!!", date: "09/06 11:00", statut: "en_attente" },
  { id: 4, auteur: "Jean D.", cible: "Flash Location", note: 3, commentaire: "RAS, correct mais sans plus.", date: "08/06 17:00", statut: "approuve" },
];

export default function AdminModerationAvis() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><MessageSquare size={20} className="text-[#D4AF37]" /> Moderation avis</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "En attente", v: "6", c: "text-amber-500" },
          { l: "Publies", v: "892", c: "text-green-500" },
          { l: "Supprimes", v: "15", c: "text-red-500" },
        ].map((s) => (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>
      <div className="px-4 mt-4 space-y-2">
        {AVIS.map((a) => {
          const isExp = expanded === a.id;
          return (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : a.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="flex gap-0.5">{Array.from({ length: a.note }).map((_, i) => <Star key={i} size={10} className="text-[#D4AF37] fill-[#D4AF37]" />)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{a.auteur} → {a.cible}</p>
                  <p className="text-[10px] text-[#6B7280]">{a.date}</p>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <p className="text-[10px] text-[#6B7280] mb-2 italic">"{a.commentaire}"</p>
                  <div className="flex gap-2">
                    <button className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1"><Check size={10} /> Publier</button>
                    <button className="flex-1 rounded-lg bg-red-50 py-1.5 text-[9px] font-bold text-red-600 flex items-center justify-center gap-1"><X size={10} /> Supprimer</button>
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
