import { CreditCard, Landmark, Smartphone, ShieldCheck, AlertTriangle } from "lucide-react";
import { trpc } from "../lib/trpc";

/**
 * Bloc « moyens de paiement » affiché avant tout démarrage d'encaissement.
 *
 * Il n'annonce pas un moyen de paiement que la plateforme ne sait pas encaisser :
 * l'orchestrateur est interrogé pour le pays, la devise et le service réels, et
 * seul un prestataire réellement branché autorise l'écran carte. Si aucun
 * prestataire n'est utilisable, le motif exact est affiché plutôt qu'un bouton
 * qui échoue au clic.
 */
export interface MoyensPaiementProps {
  countryCode: string;
  currency: string;
  service: string;
}

const CARTES = [
  { code: "visa", label: "VISA", cls: "text-[#1A1F71]" },
  { code: "mastercard", label: "Mastercard", cls: "text-[#EB001B]" },
  { code: "cb", label: "CB", cls: "text-[#0E4C92]" },
  { code: "amex", label: "AMEX", cls: "text-[#016FD0]" },
];

export default function MoyensPaiement({ countryCode, currency, service }: MoyensPaiementProps) {
  const decision = trpc.paymentOrchestrator.resolve.useQuery({
    countryCode: countryCode.toUpperCase(),
    currency: currency.toUpperCase(),
    service,
  });

  const providerLabel = decision.data?.providerLabel ?? null;
  const carteDisponible = !!decision.data?.providerCode;
  const refus = decision.data?.rejected ?? [];

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-[#111]">
        <CreditCard size={16} className="text-[#B8960C]" /> Moyens de paiement
      </p>

      {decision.isLoading && <p className="mt-2 text-xs text-slate-500">Vérification du prestataire…</p>}

      {carteDisponible && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {CARTES.map((c) => (
              <span
                key={c.code}
                className={`rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black tracking-wide ${c.cls}`}
              >
                {c.label}
              </span>
            ))}
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600" />
            Le numéro de carte est saisi sur la page sécurisée de
            {providerLabel ? ` ${providerLabel}` : " notre prestataire"} : MKA.P-MS ne
            voit ni ne conserve vos données bancaires.
          </p>
        </>
      )}

      {decision.data && !carteDisponible && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-center gap-2 text-xs font-bold text-amber-800">
            <AlertTriangle size={14} /> Paiement par carte indisponible pour {countryCode.toUpperCase()} / {currency.toUpperCase()}
          </p>
          <p className="mt-1 text-[11px] text-amber-800">{decision.data.reason}</p>
          {refus.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-[11px] text-amber-700">
              {refus.map((r) => (
                <li key={r.code}>
                  · {r.code} — {r.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
        <p className="flex items-center gap-1.5">
          <Landmark size={12} /> Virement bancaire : encaissement hors ligne, rapprochement par l'équipe.
        </p>
        <p className="flex items-center gap-1.5">
          <Smartphone size={12} /> Paiement mobile : connecteur non encore écrit, jamais proposé au clic.
        </p>
      </div>
    </div>
  );
}
