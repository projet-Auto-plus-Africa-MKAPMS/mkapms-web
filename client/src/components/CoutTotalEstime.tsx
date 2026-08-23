/**
 * Coût total estimé d'un véhicule (Estimation Hub).
 *
 * Le calcul vient du serveur : valeur de marché (VO), acheminement (Vehicle
 * Delivery), importation (Import Risk) et budget pièces. Chaque volet porte sa
 * source ; un volet sans source s'affiche « non mesuré » avec le connecteur
 * manquant nommé, jamais complété par un chiffre plausible.
 */
import { useState } from "react";
import { Calculator, ChevronDown, ChevronUp, Info } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useCurrency } from "../lib/currency";

const QUALITE_LABEL: Record<string, string> = {
  confirme: "Prix confirmé",
  estime: "Estimé",
  non_mesure: "Non mesuré",
  indisponible: "Indisponible",
};

const QUALITE_STYLE: Record<string, string> = {
  confirme: "bg-emerald-600 text-white",
  estime: "bg-amber-400 text-amber-950",
  non_mesure: "bg-slate-400 text-white",
  indisponible: "bg-red-600 text-white",
};

function montant(n: number | null, devise: string) {
  return n === null ? "—" : `${n.toLocaleString("fr-FR")} ${devise}`;
}

export default function CoutTotalEstime({ annonceId }: { annonceId: number }) {
  const { country } = useCurrency();
  const [ouvert, setOuvert] = useState(false);

  const q = trpc.estimation.complete.useQuery(
    { annonceId, paysArrivee: country ?? null },
    { enabled: ouvert && Number.isFinite(annonceId) && annonceId > 0, staleTime: 5 * 60 * 1000 },
  );
  const e = q.data;

  return (
    <section className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-4" aria-label="Coût total estimé">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2">
          <Calculator size={18} className="text-[#D4AF37]" />
          <span className="text-[15px] font-extrabold text-[#2d3436]">Ce que ce véhicule vous coûte réellement</span>
        </span>
        {ouvert ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {!ouvert && (
        <p className="mt-1 text-[12.5px] text-[#2d3436]/60">
          Valeur de marché, acheminement jusqu'à chez vous, droits et taxes à l'arrivée, budget pièces.
        </p>
      )}

      {ouvert && (
        <div className="mt-3">
          {q.isLoading && <p className="text-[13px] text-[#2d3436]/60">Interrogation des moteurs d'estimation…</p>}
          {q.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-[12.5px] text-red-700">
              {q.error.message}
            </p>
          )}

          {e && (
            <>
              <div
                className={`rounded-xl border p-3 ${
                  e.bloquant
                    ? "border-red-200 bg-red-50"
                    : e.totalAcquisition === null
                      ? "border-slate-200 bg-slate-50"
                      : "border-[#D4AF37]/40 bg-[#D4AF37]/10"
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#2d3436]/60">
                  Coût total d'acquisition
                </p>
                <p className="text-xl font-black text-[#2d3436]">
                  {montant(e.totalAcquisition, e.devise)}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#2d3436]/80">{e.resume}</p>
              </div>

              <ul className="mt-3 space-y-2">
                {e.volets.map((v) => (
                  <li key={v.code} className="rounded-xl border border-[#E5E7EB] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-[#2d3436]">{v.label}</span>
                      <span className="text-[13px] font-black text-[#2d3436]">
                        {v.montantBas !== null && v.montantHaut !== null && v.montantBas !== v.montantHaut
                          ? `${v.montantBas.toLocaleString("fr-FR")} – ${v.montantHaut.toLocaleString("fr-FR")} ${v.devise}`
                          : montant(v.montant, v.devise)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${QUALITE_STYLE[v.qualite] ?? QUALITE_STYLE.non_mesure}`}>
                        {QUALITE_LABEL[v.qualite] ?? v.qualite}
                      </span>
                      <span className="text-[11.5px] text-[#2d3436]/55">Moteur : {v.moteur}</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-[#2d3436]/75">{v.preuve}</p>
                    {v.manque && <p className="mt-0.5 text-[11.5px] text-[#2d3436]/55">Manque : {v.manque}</p>}
                  </li>
                ))}
              </ul>

              {e.manques.length > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#F5F3EF] p-3">
                  <Info size={14} className="mt-0.5 shrink-0 text-[#2d3436]/60" />
                  <div>
                    <p className="text-[12px] font-bold text-[#2d3436]">
                      Ce que la plateforme ne sait pas encore mesurer
                    </p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11.5px] text-[#2d3436]/70">
                      {e.manques.slice(0, 6).map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
