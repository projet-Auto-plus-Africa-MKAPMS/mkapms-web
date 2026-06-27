import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Award, ChevronDown } from "lucide-react";

const BADGES = [
  { id: 1, nom: "Vendeur certifie", description: "Identite verifiee + 10 ventes", attribues: 45, couleur: "bg-green-50 text-green-600" },
  { id: 2, nom: "Garage premium", description: "Note > 4.5 + professionnel verifie", attribues: 23, couleur: "bg-[#D4AF37]/10 text-[#D4AF37]" },
  { id: 3, nom: "Top vendeur", description: "Plus de 50 annonces vendues", attribues: 8, couleur: "bg-purple-50 text-purple-600" },
  { id: 4, nom: "Super loueur", description: "Plus de 100 locations effectuees", attribues: 12, couleur: "bg-blue-50 text-blue-600" },
  { id: 5, nom: "Expert technique", description: "Certifie Atelier Pro + AutoData Pro", attribues: 5, couleur: "bg-amber-50 text-amber-600" },
];

export default function AdminBadges() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Award size={20} className="text-[#D4AF37]" /> Badges & Certifications</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {BADGES.map((b) => {
          const isExp = expanded === b.id;
          return (
            <div key={b.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : b.id)} className="w-full text-left p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${b.couleur}`}>{b.nom}</span>
                </div>
                <p className="text-lg font-black text-[#111]">{b.attribues}</p>
                <p className="text-[9px] text-[#6B7280]">attribues</p>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <p className="text-[10px] text-[#6B7280] mb-2">{b.description}</p>
                  <button className="w-full rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Gerer criteres</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
