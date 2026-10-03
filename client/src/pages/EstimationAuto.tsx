import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Info,
  Gavel,
  Handshake,
  Store,
  Wrench,
  Globe2,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  CarFront,
  ArrowRight,
  ScanLine,
  LockKeyhole,
  CircleCheck,
} from "lucide-react";
import VehicleIdentification, { type VehicleData } from "../components/VehicleIdentification";
import { trpc } from "../lib/trpc";
import { useCurrency } from "../lib/currency";

const ETATS = [
  { value: "excellent", label: "Excellent" },
  { value: "tres_bon", label: "Tres bon" },
  { value: "bon", label: "Bon" },
  { value: "correct", label: "Correct" },
  { value: "a_renover", label: "A renover" },
] as const;

const CONFIANCE_LABEL: Record<string, string> = {
  bonne: "Confiance bonne",
  moyenne: "Confiance moyenne",
  faible: "Confiance faible",
};

function euros(n: number) {
  return `${n.toLocaleString("fr-FR")} EUR`;
}

export default function EstimationAuto() {
  const navigate = useNavigate();
  const { country: paysActuel } = useCurrency();
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [km, setKm] = useState("");
  const [etat, setEtat] = useState<(typeof ETATS)[number]["value"]>("bon");
  const [erreur, setErreur] = useState<string | null>(null);
  const [repriseEnvoyee, setRepriseEnvoyee] = useState<string | null>(null);
  const [paysComparaison, setPaysComparaison] = useState(paysActuel ?? "FR");
  const [comparaisonDemandee, setComparaisonDemandee] = useState(false);

  const estimate = trpc.voEngine.estimate.useMutation({
    onError: (e) => setErreur(e.message),
  });
  const reprise = trpc.voEngine.requestReprise.useMutation({
    onSuccess: (r) => setRepriseEnvoyee(r.reference),
    onError: (e) => setErreur(e.message),
  });

  const resultat = estimate.data;

  const comparaisonExterne = trpc.voEngine.comparaisonExterne.useQuery(
    {
      marque: vehicle?.marque ?? "",
      modele: vehicle?.modele ?? "",
      annee: vehicle?.annee ?? undefined,
      countryCode: paysComparaison || undefined,
    },
    { enabled: comparaisonDemandee && Boolean(resultat && vehicle) },
  );

  const lancerEstimation = () => {
    if (!vehicle) return;
    setErreur(null);
    setRepriseEnvoyee(null);
    estimate.mutate({
      plaque: vehicle.plaque,
      vin: vehicle.vin,
      marque: vehicle.marque,
      modele: vehicle.modele,
      version: vehicle.version ?? undefined,
      annee: vehicle.annee ?? undefined,
      kilometrage: km ? Number(km.replace(/\D/g, "")) : undefined,
      carburant: vehicle.carburant ?? undefined,
      boite: vehicle.boite ?? undefined,
      etat,
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <section className="relative isolate overflow-hidden bg-[#07111F] px-4 pb-14 pt-6 text-white sm:px-6 sm:pb-20 sm:pt-8">
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-55"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/pubs/hero2-vendez.jpg"
          aria-hidden="true"
        >
          <source src="/videos/vendre/vendre_hero1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(7,17,31,.96)_3%,rgba(7,17,31,.77)_57%,rgba(7,17,31,.87)_100%)]" />
        <div className="pointer-events-none absolute -right-24 top-12 -z-10 h-72 w-72 rounded-full bg-[#D4AF37]/15 blur-3xl" />

        <div className="mx-auto max-w-5xl">
          <Link to="/acheter" className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white/75 backdrop-blur transition hover:border-[#D4AF37]/60 hover:text-white"><ChevronLeft size={15} /> Retour à la vente</Link>

          <div className="mt-10 grid gap-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-[#EACD64] backdrop-blur"><Sparkles size={14} /> Valeur de marché, sans engagement</div>
              <h1 className="mt-5 text-4xl font-black leading-[.98] tracking-tight sm:text-6xl">Votre véhicule mérite un prix juste.</h1>
              <p className="mt-5 max-w-xl text-sm leading-6 text-white/75 sm:text-base">Identifiez votre véhicule, précisez son état et recevez une fourchette de marché expliquée. Aucun prix de rachat ferme n’est promis avant contrôle réel.</p>
              <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-white/85">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur"><ScanLine size={14} className="text-[#EACD64]" /> Plaque ou VIN</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur"><FileCheck2 size={14} className="text-[#EACD64]" /> Méthode affichée</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur"><Globe2 size={14} className="text-[#EACD64]" /> Comparaison par pays</span>
              </div>
              <div className="mt-9 grid max-w-xl grid-cols-3 gap-3 border-t border-white/15 pt-5">
                {["Identifier", "Préciser", "Comprendre"].map((step, index) => <div key={step}><p className="text-[10px] font-black tracking-[.16em] text-[#EACD64]">0{index + 1}</p><p className="mt-1 text-xs font-bold text-white/80">{step}</p></div>)}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/20 bg-white/[.96] p-3 text-[#111] shadow-[0_26px_80px_rgba(0,0,0,.32)] backdrop-blur sm:p-5">
              <div className="flex items-start gap-3 border-b border-slate-100 px-1 pb-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#111] text-[#EACD64]"><Calculator size={21} /></div>
                <div className="min-w-0"><p className="text-sm font-black">Commencer mon estimation</p><p className="mt-0.5 text-xs leading-5 text-slate-500">Plaque, VIN ou saisie manuelle. Vous gardez la main sur les informations.</p></div>
              </div>
              <div className="pt-4"><VehicleIdentification onVehicleFound={(v) => { setVehicle(v); setErreur(null); }} /></div>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500"><LockKeyhole size={12} className="text-[#0d7391]" /> Données d’identification traitées dans votre parcours MKA.P-MS.</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="-mt-7 grid gap-2 rounded-3xl border border-[#D4AF37]/30 bg-white p-3 shadow-[0_16px_38px_rgba(17,17,17,.12)] sm:grid-cols-3 sm:p-4">
          <div className="flex items-center gap-3 px-2 py-1"><ShieldCheck size={19} className="shrink-0 text-[#0d7391]"/><p className="text-xs font-semibold text-slate-700">Vos données d’identification restent privées.</p></div>
          <div className="flex items-center gap-3 border-y border-slate-100 px-2 py-3 sm:border-x sm:border-y-0 sm:py-1"><FileCheck2 size={19} className="shrink-0 text-[#D4AF37]"/><p className="text-xs font-semibold text-slate-700">La méthode et le niveau de confiance sont affichés.</p></div>
          <div className="flex items-center gap-3 px-2 py-1"><CarFront size={19} className="shrink-0 text-[#0d7391]"/><p className="text-xs font-semibold text-slate-700">L’offre finale dépend toujours du contrôle réel.</p></div>
        </div>

        <section className="mt-7 grid gap-4 rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,17,17,.06)] sm:grid-cols-3 sm:p-7">
          <div><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#D4AF37]/10 text-[#B8962E]"><ScanLine size={19} /></span><h2 className="mt-3 text-sm font-black text-[#111]">1. Identifiez</h2><p className="mt-1 text-xs leading-5 text-slate-600">Plaque, VIN ou informations saisies par vous-même : aucune fiche n’est inventée.</p></div>
          <div><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#0d7391]/10 text-[#0d7391]"><CircleCheck size={19} /></span><h2 className="mt-3 text-sm font-black text-[#111]">2. Précisez l’état</h2><p className="mt-1 text-xs leading-5 text-slate-600">Le kilométrage et l’état général affinent la fourchette avant toute décision.</p></div>
          <div><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#111] text-[#EACD64]"><ArrowRight size={19} /></span><h2 className="mt-3 text-sm font-black text-[#111]">3. Choisissez la suite</h2><p className="mt-1 text-xs leading-5 text-slate-600">Vendre, demander une reprise, déposer en enchère ou trouver un professionnel.</p></div>
        </section>

        <div className="mt-6 flex items-center gap-3 text-sm font-black text-[#111]">
          <span className="h-px flex-1 bg-[#E5E7EB]" /><span>Votre estimation</span><span className="h-px flex-1 bg-[#E5E7EB]" />
        </div>
      </div>

      {vehicle && (
        <div className="mx-auto mt-4 max-w-5xl rounded-3xl bg-white border border-[#E5E7EB] p-4 space-y-4 shadow-[0_14px_34px_rgba(17,17,17,.06)] sm:p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#D4AF37]/10 text-[#B8962E]"><CarFront size={19} /></span><div><p className="text-sm font-black text-[#111]">Affiner la valeur de votre véhicule</p><p className="text-xs text-slate-500">Ces informations améliorent la fourchette affichée.</p></div></div>
          <div>
            <label className="text-[11px] font-bold text-[#6B7280]">Kilometrage</label>
            <input
              value={km}
              onChange={(e) => setKm(e.target.value)}
              inputMode="numeric"
              placeholder="Ex : 85 000"
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#6B7280]">Etat general</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {ETATS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEtat(e.value)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold border ${etat === e.value ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={lancerEstimation}
            disabled={estimate.isPending}
            className="w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-60"
          >
            {estimate.isPending ? "Estimation en cours..." : "Estimer mon vehicule"}
          </button>
        </div>
      )}

      {erreur && (
        <p className="mx-auto mt-3 max-w-5xl rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">{erreur}</p>
      )}

      {resultat && (
        <div className="mx-auto mt-5 max-w-5xl space-y-3 px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
              <TrendingDown size={14} className="mx-auto text-red-500" />
              <p className="text-[9px] text-red-600 mt-1">Basse</p>
              <p className="text-sm font-black text-red-600">{euros(resultat.low)}</p>
            </div>
            <div className="rounded-xl bg-[#D4AF37]/10 border-2 border-[#D4AF37]/40 p-3 text-center">
              <Minus size={14} className="mx-auto text-[#D4AF37]" />
              <p className="text-[9px] text-[#D4AF37] mt-1">Moyenne</p>
              <p className="text-base font-black text-[#D4AF37]">{euros(resultat.mid)}</p>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
              <TrendingUp size={14} className="mx-auto text-green-600" />
              <p className="text-[9px] text-green-600 mt-1">Haute</p>
              <p className="text-sm font-black text-green-600">{euros(resultat.high)}</p>
            </div>
          </div>

          {/* Sur quoi repose reellement ce chiffre */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-start gap-2">
            <Info size={14} className="text-[#6B7280] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-[#111]">
                {resultat.method === "comparables"
                  ? `Base sur ${resultat.sampleSize} annonce(s) comparable(s)`
                  : "Base sur un bareme de decote"}
                {" — "}
                {CONFIANCE_LABEL[resultat.confidence]}
              </p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">{resultat.disclaimer}</p>
            </div>
          </div>

          {/* Comparaison de prix externe par pays (LOT IA02G) */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Globe2 size={14} className="text-[#6B7280]" />
              <p className="text-[11px] font-bold text-[#111]">Comparer avec le marche public a l'exterieur</p>
            </div>
            <div className="flex gap-2">
              <input
                value={paysComparaison}
                onChange={(e) => { setPaysComparaison(e.target.value.toUpperCase().slice(0, 4)); setComparaisonDemandee(false); }}
                placeholder="Code pays (ex : FR, CI, MA)"
                className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() => setComparaisonDemandee(true)}
                disabled={comparaisonExterne.isFetching}
                className="rounded-lg bg-[#111] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-60"
              >
                {comparaisonExterne.isFetching ? "Recherche..." : "Comparer"}
              </button>
            </div>

            {comparaisonDemandee && comparaisonExterne.data && (
              <div className="pt-1">
                {comparaisonExterne.data.status === "ok" && comparaisonExterne.data.amount !== null ? (
                  <div>
                    <p className="text-[11px] text-[#111]">
                      Prix publics releves sur ce marche : <strong>{comparaisonExterne.data.minAmount} - {comparaisonExterne.data.maxAmount} {comparaisonExterne.data.currency}</strong>
                    </p>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">{comparaisonExterne.data.assumptions[0]}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#6B7280]">
                    {comparaisonExterne.data.missingData[0] ?? "Comparaison externe indisponible pour ce marche."}
                  </p>
                )}
                {(comparaisonExterne.data.externalSources?.length ?? 0) > 0 && (
                  <ul className="mt-2 space-y-1">
                    {comparaisonExterne.data.externalSources!.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="text-[10px] text-[#6B7280] underline flex items-center gap-1">
                          <ExternalLink size={10} /> {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {comparaisonDemandee && comparaisonExterne.isError && (
              <p className="text-[11px] text-red-600">Comparaison externe indisponible pour le moment.</p>
            )}
          </div>

          {/* Les suites possibles */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate("/acheter/depot-annonce")}
              className="rounded-xl bg-[#D4AF37] p-3 text-left active:scale-[0.98]"
            >
              <Store size={16} className="text-white" />
              <p className="text-xs font-bold text-white mt-1">Vendre sur MKA.P-MS</p>
            </button>
            <button
              type="button"
              onClick={() =>
                reprise.mutate({ estimationId: resultat.id, countryCode: "FR" })
              }
              disabled={reprise.isPending}
              className="rounded-xl bg-[#111] p-3 text-left active:scale-[0.98] disabled:opacity-60"
            >
              <Handshake size={16} className="text-[#D4AF37]" />
              <p className="text-xs font-bold text-white mt-1">
                {reprise.isPending ? "Envoi..." : "Demander une reprise"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/acheter/encheres")}
              className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98]"
            >
              <Gavel size={16} className="text-[#111]" />
              <p className="text-xs font-bold text-[#111] mt-1">Deposer en enchere</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/garages")}
              className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98]"
            >
              <Wrench size={16} className="text-[#111]" />
              <p className="text-xs font-bold text-[#111] mt-1">Trouver un professionnel</p>
            </button>
          </div>

          {repriseEnvoyee && (
            <p className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-800">
              Demande de reprise enregistree sous la reference <strong>{repriseEnvoyee}</strong>.
              Une offre ferme vous sera proposee apres examen : ce n'est pas encore un engagement d'achat.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
