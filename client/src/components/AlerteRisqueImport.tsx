/**
 * Alerte de risque avant achat ou livraison (Import Risk Engine).
 *
 * Le diagnostic vient du serveur : aucune règle n'est écrite ici. Ce qui n'est
 * pas mesuré est affiché comme non mesuré — un acheteur prévenu d'un doute
 * perd moins qu'un acheteur rassuré à tort.
 */
import { useState } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, Info, ShieldAlert } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useCurrency } from "../lib/currency";

type Niveau = "bloquant" | "important" | "verification" | "non_mesure" | "conforme";

const STYLE: Record<Niveau, { badge: string; cadre: string; icone: typeof AlertTriangle }> = {
  bloquant: { badge: "bg-red-600 text-white", cadre: "border-red-300 bg-red-50", icone: ShieldAlert },
  important: { badge: "bg-orange-500 text-white", cadre: "border-orange-200 bg-orange-50", icone: AlertTriangle },
  verification: { badge: "bg-amber-400 text-amber-950", cadre: "border-amber-200 bg-amber-50", icone: HelpCircle },
  non_mesure: { badge: "bg-slate-400 text-white", cadre: "border-slate-200 bg-slate-50", icone: Info },
  conforme: { badge: "bg-emerald-600 text-white", cadre: "border-emerald-200 bg-emerald-50", icone: CheckCircle2 },
};

const LABEL: Record<Niveau, string> = {
  bloquant: "Bloquant",
  important: "Important",
  verification: "À vérifier",
  non_mesure: "Non mesuré",
  conforme: "Conforme",
};

export interface EtatRisqueImport {
  annonceId: number;
  diagnostic:
    | {
        importation: boolean;
        paysSource: string | null;
        paysDestination: string | null;
        paysDestinationNom: string | null;
        bloquant: boolean;
        confirmationRequise: boolean;
        resume: string;
        risques: { code: string; titre: string; niveau: string; message: string; preuve: string; manque?: string | null }[];
      }
    | undefined;
  chargement: boolean;
  confirme: boolean;
  setConfirme: (v: boolean) => void;
  /** Vrai quand l'action d'achat doit être retenue jusqu'à confirmation. */
  doitConfirmer: boolean;
}

/**
 * Diagnostic + état de confirmation, partagés entre l'encart et le bouton
 * d'achat : le bouton ne peut pas ignorer ce que l'encart affiche.
 */
export function useRisqueImport(annonceId: number, actif = true): EtatRisqueImport {
  const { country } = useCurrency();
  const [confirme, setConfirme] = useState(false);
  const q = trpc.risqueImport.diagnostic.useQuery(
    { annonceId, paysDestination: country ?? null },
    { enabled: actif && Number.isFinite(annonceId) && annonceId > 0, staleTime: 5 * 60 * 1000 },
  );
  const d = q.data;
  return {
    annonceId,
    diagnostic: d,
    chargement: q.isLoading,
    confirme,
    setConfirme,
    doitConfirmer: !!d?.confirmationRequise && !confirme,
  };
}

export default function AlerteRisqueImport({ etat }: { etat: EtatRisqueImport }) {
  const d = etat.diagnostic;
  if (!d) return null;

  const aSignaler = d.risques.filter((r) => r.niveau !== "conforme");
  if (!d.importation && aSignaler.length === 0) return null;

  const pire: Niveau = d.bloquant
    ? "bloquant"
    : aSignaler.some((r) => r.niveau === "important")
      ? "important"
      : aSignaler.some((r) => r.niveau === "verification")
        ? "verification"
        : "non_mesure";
  const s = STYLE[pire];
  const Icone = s.icone;

  return (
    <section className={`mt-4 rounded-2xl border p-4 ${s.cadre}`} aria-label="Risques avant achat ou livraison">
      <div className="flex items-start gap-3">
        <Icone size={22} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <h3 className="text-[15px] font-extrabold text-[#2d3436]">
            {d.bloquant ? "Attention — achat ou livraison impossible en l'état" : "Avant d'acheter ou de faire livrer"}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-[#2d3436]/85">{d.resume}</p>
          {d.paysDestinationNom && (
            <p className="mt-1 text-[12px] text-[#2d3436]/60">
              Diagnostic pour une livraison vers {d.paysDestinationNom}
              {d.paysSource ? ` depuis ${d.paysSource}` : ""}.
            </p>
          )}
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {aSignaler.map((r) => {
          const n = (r.niveau as Niveau) in LABEL ? (r.niveau as Niveau) : "non_mesure";
          return (
            <li key={r.code} className="rounded-xl border border-black/5 bg-white/70 p-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STYLE[n].badge}`}>{LABEL[n]}</span>
                <span className="text-[13px] font-bold text-[#2d3436]">{r.titre}</span>
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#2d3436]/85">{r.message}</p>
              <p className="mt-1 text-[11.5px] text-[#2d3436]/55">Source : {r.preuve}</p>
              {r.manque && <p className="text-[11.5px] text-[#2d3436]/55">Manque : {r.manque}</p>}
            </li>
          );
        })}
      </ul>

      {d.confirmationRequise && (
        <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-black/10 bg-white p-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4"
            checked={etat.confirme}
            onChange={(e) => etat.setConfirme(e.target.checked)}
          />
          <span className="text-[12.5px] leading-relaxed text-[#2d3436]">
            J'ai lu ces risques et je souhaite continuer en connaissance de cause. MKA.P-MS ne garantit ni
            l'homologation, ni l'immatriculation, ni la circulation de ce véhicule dans mon pays.
          </span>
        </label>
      )}
    </section>
  );
}
