import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Percent, ChevronDown, Loader2 } from "lucide-react";
import { trpc } from "../../lib/trpc";

export default function AdminCommissions() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const produits = trpc.paymentEngine.productsAll.useQuery();
  const stats = trpc.paymentEngine.stats.useQuery();

  const chargement = produits.isLoading || stats.isLoading;
  const erreur = produits.error || stats.error;

  // Regroupement réel par univers — aucun taux ni montant fabriqué : la
  // commission vient du registre central des produits (Document OS des
  // prix, Payment Engine), le chiffre d'affaires du Payment Engine.
  const parUnivers = new Map<string, { produitsActifs: number; taux: Set<number> }>();
  for (const p of produits.data ?? []) {
    if (!p.active) continue;
    const entry = parUnivers.get(p.univers) ?? { produitsActifs: 0, taux: new Set<number>() };
    entry.produitsActifs += 1;
    entry.taux.add(Number(p.commissionRate));
    parUnivers.set(p.univers, entry);
  }
  const revenuParUnivers = new Map((stats.data?.revenueByUnivers ?? []).map((r) => [r.univers ?? "non_precise", Number(r.total)]));
  const universUnion = new Set([...parUnivers.keys(), ...revenuParUnivers.keys()]);
  const lignes = [...universUnion].map((univers) => {
    const barometre = parUnivers.get(univers);
    const taux = barometre ? [...barometre.taux].sort((a, b) => a - b) : [];
    return {
      univers,
      produitsActifs: barometre?.produitsActifs ?? 0,
      tauxLabel: taux.length === 0 ? "Aucun produit actif" : taux.length === 1 ? `${taux[0]}%` : `${taux[0]}% – ${taux[taux.length - 1]}%`,
      revenu: revenuParUnivers.get(univers) ?? 0,
    };
  }).sort((a, b) => b.revenu - a.revenu);

  const totalRevenu = lignes.reduce((s, l) => s + l.revenu, 0);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Percent size={20} className="text-[#D4AF37]" /> Commissions</h1>
        <p className="mt-1 text-xs text-white/50">
          {chargement ? "Chargement…" : `Chiffre d'affaires validé/reçu (toutes périodes) : ${totalRevenu.toLocaleString("fr-FR")} EUR`}
        </p>
      </div>

      {chargement && (
        <div className="flex justify-center py-10 text-[#6B7280]"><Loader2 className="animate-spin" size={20} /></div>
      )}
      {erreur && !chargement && (
        <p className="px-4 py-6 text-sm text-red-600">Données indisponibles : {erreur.message}</p>
      )}
      {!chargement && !erreur && lignes.length === 0 && (
        <p className="px-4 py-6 text-sm text-[#6B7280]">Aucun produit ni transaction enregistrée pour l'instant.</p>
      )}

      <div className="px-4 mt-4 space-y-2">
        {lignes.map((l) => {
          const isExp = expanded === l.univers;
          return (
            <div key={l.univers} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : l.univers)} className="w-full text-left p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#111] capitalize">{l.univers}</p>
                  <p className="text-[10px] text-[#6B7280]">Taux : {l.tauxLabel} · {l.produitsActifs} produit(s) actif(s)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-[#D4AF37]">{l.revenu.toLocaleString("fr-FR")} EUR</span>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Taux (produits actifs)</span><p className="font-bold text-[#D4AF37]">{l.tauxLabel}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Produits actifs</span><p className="font-bold text-[#111]">{l.produitsActifs}</p></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
