import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users, ChevronDown, Phone, Mail, Clock, Star } from "lucide-react";

const EMPLOYES = [
  { id: 1, nom: "Karim M.", poste: "Responsable technique", service: "Atelier", statut: "actif", email: "karim@mkapms.fr", tel: "06 12 34 56 78", anciennete: "2 ans", performance: 92 },
  { id: 2, nom: "Sarah B.", poste: "Charge clientele", service: "Support", statut: "actif", email: "sarah@mkapms.fr", tel: "06 23 45 67 89", anciennete: "1 an", performance: 88 },
  { id: 3, nom: "Omar L.", poste: "Mecanicien senior", service: "Atelier", statut: "actif", email: "omar@mkapms.fr", tel: "06 34 56 78 90", anciennete: "3 ans", performance: 85 },
  { id: 4, nom: "Julie P.", poste: "Comptable", service: "Finance", statut: "conge", email: "julie@mkapms.fr", tel: "06 45 67 89 01", anciennete: "6 mois", performance: 90 },
  { id: 5, nom: "Ahmed T.", poste: "Developpeur", service: "Tech", statut: "actif", email: "ahmed@mkapms.fr", tel: "06 56 78 90 12", anciennete: "1 an", performance: 95 },
];

export default function AdminEmployes() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Employes MKA.P-MS</h1>
      </div>

      <div className="px-4 mt-4 grid grid-cols-4 gap-2">
        {[
          { l: "Total", v: "12", c: "text-[#D4AF37]" },
          { l: "Actifs", v: "10", c: "text-green-500" },
          { l: "Conge", v: "2", c: "text-amber-500" },
          { l: "Perf. moy.", v: "90%", c: "text-blue-500" },
        ].map((s) => (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[8px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-2">
        {EMPLOYES.map((e) => {
          const isExp = expanded === e.id;
          return (
            <div key={e.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : e.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#D4AF37]/10 grid place-items-center shrink-0"><Users size={16} className="text-[#D4AF37]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{e.nom}</p>
                  <p className="text-[10px] text-[#6B7280]">{e.poste} · {e.service}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${e.statut === "actif" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{e.statut}</span>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1"><Mail size={10} className="text-[#D4AF37]" /><p className="font-bold text-[#111]">{e.email}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1"><Phone size={10} className="text-[#D4AF37]" /><p className="font-bold text-[#111]">{e.tel}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1"><Clock size={10} className="text-[#D4AF37]" /><p className="font-bold text-[#111]">{e.anciennete}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1"><Star size={10} className="text-[#D4AF37]" /><p className={`font-bold ${e.performance >= 90 ? "text-green-600" : "text-amber-600"}`}>{e.performance}%</p></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Profil</button>
                    <button className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Planning</button>
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
