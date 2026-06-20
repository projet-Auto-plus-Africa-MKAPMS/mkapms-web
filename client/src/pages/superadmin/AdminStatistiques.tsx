import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, BarChart3, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";

const STATS = [
  { id: "ca", label: "Chiffre d'affaires", valeur: "198 450 EUR", variation: "+12.5%", positif: true, detail: "CA mensuel cumule de tous les univers. Top univers: Vente (42%), Location (28%), Garage (18%)." },
  { id: "users", label: "Nouveaux inscrits", valeur: "89", variation: "+23%", positif: true, detail: "Particuliers: 62, Professionnels: 18, Garages: 9. Taux conversion inscription → abonnement: 34%." },
  { id: "annonces", label: "Annonces publiees", valeur: "342", variation: "+8%", positif: true, detail: "Vente: 245, Location: 67, Encheres: 30. Duree moyenne publication: 18 jours." },
  { id: "conv", label: "Taux conversion", valeur: "4.2%", variation: "-0.3%", positif: false, detail: "Visites → contact: 4.2%. Mobile: 3.8%, Desktop: 5.1%. Objectif: 5%." },
  { id: "panier", label: "Panier moyen", valeur: "67 EUR", variation: "+5 EUR", positif: true, detail: "Boost: 12 EUR moy, Pack photos: 8 EUR moy, Abonnement: 89 EUR moy." },
  { id: "churn", label: "Taux desabonnement", valeur: "2.1%", variation: "-0.4%", positif: true, detail: "Moyenne secteur: 5%. Retention 12 mois: 85%. Principal motif: prix trop eleve (38%)." },
];

export default function AdminStatistiques() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Statistiques</h1>
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {STATS.map((s) => {
          const isExp = expanded === s.id;
          return (
            <div key={s.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : s.id)} className="w-full text-left p-3">
                <p className="text-[10px] text-[#6B7280]">{s.label}</p>
                <p className="text-lg font-black text-[#111]">{s.valeur}</p>
                <div className="flex items-center gap-1 mt-1">
                  {s.positif ? <TrendingUp size={10} className="text-green-500" /> : <TrendingDown size={10} className="text-red-500" />}
                  <span className={`text-[10px] font-bold ${s.positif ? "text-green-600" : "text-red-600"}`}>{s.variation}</span>
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <p className="text-[10px] text-[#6B7280] leading-relaxed">{s.detail}</p>
                  <button className="mt-2 w-full rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Voir rapport complet</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
