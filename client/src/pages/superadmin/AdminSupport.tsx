import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Headphones, ChevronDown, Clock, Check, AlertCircle, MessageSquare } from "lucide-react";

const TICKETS = [
  { id: 1, sujet: "Impossible de publier mon annonce", client: "Martin D.", priorite: "haute", statut: "ouvert", date: "09/06/2025", categorie: "Publication", messages: 3 },
  { id: 2, sujet: "Question sur mon abonnement Pro", client: "Garage Auto 93", priorite: "normale", statut: "en_cours", date: "09/06/2025", categorie: "Abonnement", messages: 5 },
  { id: 3, sujet: "Remboursement demande", client: "Sophie L.", priorite: "haute", statut: "ouvert", date: "08/06/2025", categorie: "Paiement", messages: 2 },
  { id: 4, sujet: "Bug affichage photos", client: "Ahmed K.", priorite: "basse", statut: "resolu", date: "07/06/2025", categorie: "Technique", messages: 4 },
  { id: 5, sujet: "Demande de verification Pro", client: "Flash Location", priorite: "normale", statut: "en_cours", date: "07/06/2025", categorie: "Verification", messages: 1 },
];

export default function AdminSupport() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Headphones size={20} className="text-[#D4AF37]" /> Support</h1>
      </div>

      <div className="px-4 mt-4 grid grid-cols-4 gap-2">
        {[
          { l: "Ouverts", v: "12", c: "text-red-500" },
          { l: "En cours", v: "8", c: "text-amber-500" },
          { l: "Resolus", v: "156", c: "text-green-500" },
          { l: "Temps moy.", v: "2h", c: "text-blue-500" },
        ].map((s) => (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[8px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-2">
        {TICKETS.map((t) => {
          const isExp = expanded === t.id;
          return (
            <div key={t.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : t.id)} className="w-full text-left p-3">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full grid place-items-center ${t.statut === "ouvert" ? "bg-red-50" : t.statut === "en_cours" ? "bg-amber-50" : "bg-green-50"}`}>
                    {t.statut === "ouvert" ? <AlertCircle size={14} className="text-red-500" /> : t.statut === "en_cours" ? <Clock size={14} className="text-amber-500" /> : <Check size={14} className="text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#111] truncate">{t.sujet}</p>
                    <p className="text-[10px] text-[#6B7280]">{t.client} · {t.date}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5 text-[9px] text-[#6B7280]"><MessageSquare size={10} /> {t.messages}</span>
                    <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Categorie</span><p className="font-bold text-[#111]">{t.categorie}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Priorite</span><p className={`font-bold ${t.priorite === "haute" ? "text-red-600" : "text-[#111]"}`}>{t.priorite}</p></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Repondre</button>
                    <button className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white">Resoudre</button>
                    <button className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Escalader</button>
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
