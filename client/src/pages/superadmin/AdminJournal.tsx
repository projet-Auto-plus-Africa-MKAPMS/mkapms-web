import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileText, ChevronDown } from "lucide-react";

const LOGS = [
  { id: 1, action: "Connexion PDG", user: "mka.garageauto@gmail.com", date: "09/06 18:20", ip: "92.184.xx.xx" },
  { id: 2, action: "Modification abonnement", user: "admin@mkapms.fr", date: "09/06 17:45", ip: "91.168.xx.xx" },
  { id: 3, action: "Suppression annonce #4521", user: "moderateur@mkapms.fr", date: "09/06 16:30", ip: "91.168.xx.xx" },
  { id: 4, action: "Nouveau compte pro valide", user: "admin@mkapms.fr", date: "09/06 15:00", ip: "91.168.xx.xx" },
  { id: 5, action: "Export donnees utilisateurs", user: "admin@mkapms.fr", date: "09/06 14:20", ip: "91.168.xx.xx" },
  { id: 6, action: "Sauvegarde manuelle", user: "mka.garageauto@gmail.com", date: "09/06 12:00", ip: "92.184.xx.xx" },
];

export default function AdminJournal() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Journal d'activite</h1>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {LOGS.map((l) => {
          const isExp = expanded === l.id;
          return (
            <div key={l.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : l.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#D4AF37]/10 grid place-items-center"><FileText size={14} className="text-[#D4AF37]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{l.action}</p>
                  <p className="text-[10px] text-[#6B7280]">{l.date}</p>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Utilisateur</span><p className="font-bold text-[#111]">{l.user}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">IP</span><p className="font-bold text-[#111]">{l.ip}</p></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
