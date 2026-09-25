import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   STATISTIQUES (superadmin)
   Données réelles : trpc.statistiques.globales (server/routers/statistiques.ts).
   Chaque indicateur est recalculé en direct (payments/users/annonces/
   subscriptions) avec une vraie variation mois en cours vs mois précédent.
   "Taux de conversion" reste "Non mesuré" : aucun suivi de visite/session
   n'existe dans ce dépôt. "Taux de désabonnement" est une vraie mesure mais
   une approximation documentée (annulés ce mois / (actifs + annulés)) —
   jamais un motif de désabonnement inventé.
   ══════════════════════════════════════════════════════════════════════════ */

function Variation({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-[10px] font-bold text-[#9CA3AF] flex items-center gap-1"><Minus size={10} /> —</span>;
  const positif = pct >= 0;
  return (
    <span className={`text-[10px] font-bold flex items-center gap-1 ${positif ? "text-green-600" : "text-red-600"}`}>
      {positif ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {positif ? "+" : ""}{pct}%
    </span>
  );
}

export default function AdminStatistiques() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const q = trpc.statistiques.globales.useQuery();

  const cartes = q.data
    ? [
        { id: "ca", label: "Chiffre d'affaires (mois en cours)", valeur: `${Number(q.data.ca.actuel).toLocaleString("fr-FR")} ${q.data.ca.devise}`, pct: q.data.ca.variationPct, detail: "Somme des paiements payés ce mois-ci, comparée au mois précédent." },
        { id: "users", label: "Nouveaux inscrits", valeur: String(q.data.nouveauxInscrits.actuel), pct: q.data.nouveauxInscrits.variationPct, detail: `Particuliers : ${q.data.nouveauxInscrits.particuliers}, Professionnels : ${q.data.nouveauxInscrits.professionnels}.` },
        { id: "annonces", label: "Annonces publiées", valeur: String(q.data.annoncesPubliees.actuel), pct: q.data.annoncesPubliees.variationPct, detail: `Vente : ${q.data.annoncesPubliees.vente}, Location : ${q.data.annoncesPubliees.location}.` },
        { id: "panier", label: "Panier moyen (EUR)", valeur: `${Number(q.data.panierMoyen.actuel).toFixed(2)} ${q.data.panierMoyen.devise}`, pct: q.data.panierMoyen.variationPct, detail: "Moyenne des paiements payés en EUR ce mois-ci." },
        { id: "conv", label: "Taux de conversion", nonMesure: true, detail: "Aucun suivi de visite/session n'existe dans la plateforme aujourd'hui — rien à mesurer honnêtement ici." },
        { id: "churn", label: "Taux de désabonnement (approx.)", valeur: q.data.tauxDesabonnement.actuel !== null ? `${q.data.tauxDesabonnement.actuel}%` : "—", pct: null, detail: `Annulés ce mois : ${q.data.tauxDesabonnement.annulesCeMois}, actifs actuels : ${q.data.tauxDesabonnement.actifsActuels}. Ratio réel, pas un churn par cohorte.` },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Statistiques</h1>
      </div>

      {q.isLoading && <p className="px-4 mt-4 text-xs text-[#9CA3AF]">Chargement…</p>}

      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {cartes.map((s) => {
          const isExp = expanded === s.id;
          return (
            <div key={s.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : s.id)} className="w-full text-left p-3">
                <p className="text-[10px] text-[#6B7280]">{s.label}</p>
                {s.nonMesure ? (
                  <p className="text-sm font-bold text-[#9CA3AF] mt-1">Non mesuré</p>
                ) : (
                  <>
                    <p className="text-lg font-black text-[#111]">{s.valeur}</p>
                    <div className="mt-1"><Variation pct={s.pct ?? null} /></div>
                  </>
                )}
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <p className="text-[10px] text-[#6B7280] leading-relaxed">{s.detail}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
