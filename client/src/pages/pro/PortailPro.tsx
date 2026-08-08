/**
 * MKA.P-MS — Portail Professionnel (.pro)
 *
 * Porte d'entrée des professionnels, distincte du site grand public :
 * métier → pays → besoins → composition de l'offre → panier → compte →
 * paiement → activation.
 *
 * Les métiers, les services et les montants viennent tous du serveur : rien
 * n'est codé en dur ici, de sorte qu'un nouveau métier apparaisse sans
 * retoucher cette page.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase, Globe, Layers, ShoppingCart, Check, ChevronLeft, ChevronRight,
  AlertCircle, Lock, FileText, Loader2,
} from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

type Step = "metier" | "pays" | "besoins" | "panier";

const STEPS: { id: Step; label: string; icon: typeof Briefcase }[] = [
  { id: "metier", label: "Mon métier", icon: Briefcase },
  { id: "pays", label: "Mon pays", icon: Globe },
  { id: "besoins", label: "Mes services", icon: Layers },
  { id: "panier", label: "Mon offre", icon: ShoppingCart },
];

const DRAFT_KEY = "mkapms_pro_portal_session";

/** Clé anonyme stable : permet de reprendre un parcours abandonné. */
function useSessionKey(): string {
  return useMemo(() => {
    const existing = localStorage.getItem(DRAFT_KEY);
    if (existing) return existing;
    const key = `pp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DRAFT_KEY, key);
    return key;
  }, []);
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

export default function PortailPro() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionKey = useSessionKey();

  const [step, setStep] = useState<Step>("metier");
  const [profession, setProfession] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const professions = trpc.proPortal.professions.useQuery(
    country ? { countryCode: country } : undefined,
  );
  const countries = trpc.proPortal.countries.useQuery();
  const modules = trpc.proPortal.modules.useQuery(
    { professionCode: profession ?? "", countryCode: country ?? "" },
    { enabled: !!profession && !!country },
  );
  const quote = trpc.proPortal.quote.useQuery(
    { professionCode: profession ?? "", countryCode: country ?? "", moduleCodes: selected },
    { enabled: !!profession && !!country && step === "panier" },
  );
  const requirements = trpc.proPortal.requirements.useQuery(
    { professionCode: profession ?? "", countryCode: country ?? "" },
    { enabled: !!profession && !!country && step === "panier" },
  );
  const saveDraft = trpc.proPortal.saveDraft.useMutation();

  // Reprise du parcours abandonné.
  const draft = trpc.proPortal.draft.useQuery({ sessionKey });
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    if (restored || !draft.data) return;
    setRestored(true);
    if (draft.data.professionCode) setProfession(draft.data.professionCode);
    if (draft.data.countryCode) setCountry(draft.data.countryCode);
    if (draft.data.moduleCodes?.length) setSelected(draft.data.moduleCodes);
    if (draft.data.step) setStep(draft.data.step as Step);
  }, [draft.data, restored]);

  // Pré-cochage des services recommandés au premier passage sur l'étape.
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (prefilled || step !== "besoins" || !modules.data) return;
    setPrefilled(true);
    if (selected.length === 0) {
      setSelected(modules.data.filter((m) => m.recommended).map((m) => m.code));
    }
  }, [step, modules.data, prefilled, selected.length]);

  function persist(next: Partial<{ step: Step; profession: string | null; country: string | null; selected: string[] }>) {
    saveDraft.mutate({
      sessionKey,
      professionCode: next.profession !== undefined ? next.profession : profession,
      countryCode: next.country !== undefined ? next.country : country,
      moduleCodes: next.selected ?? selected,
      step: next.step ?? step,
    });
  }

  function goTo(next: Step) {
    setStep(next);
    persist({ step: next });
  }

  function toggleModule(code: string, required: boolean) {
    if (required) return;
    const next = selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code];
    setSelected(next);
    persist({ selected: next });
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const selectedCountry = countries.data?.find((c) => c.code === country);
  const selectedProfession = professions.data?.find((p) => p.code === profession);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* En-tête */}
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Accueil
        </Link>
        <h1 className="text-xl font-black text-white">
          Portail Professionnel <span className="text-[#D4AF37]">MKA.P-MS</span>
        </h1>
        <p className="mt-1 text-xs text-white/60">
          Composez votre offre service par service. Vous ne payez que ce dont vous avez besoin.
        </p>
      </div>

      {/* Fil des étapes */}
      <div className="px-4 -mt-3">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-2 flex items-center gap-1 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < stepIndex;
            const active = i === stepIndex;
            // On ne saute pas en avant : chaque étape a besoin de la précédente.
            const reachable = i <= stepIndex;
            return (
              <button
                key={s.id}
                onClick={() => reachable && goTo(s.id)}
                disabled={!reachable}
                className={`shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                  active
                    ? "bg-[#111] text-[#D4AF37]"
                    : done
                      ? "bg-[#F5F3EF] text-[#111]"
                      : "text-[#9CA3AF] cursor-not-allowed"
                }`}
              >
                {done ? <Check size={12} /> : <Icon size={12} />} {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Étape 1 : métier ── */}
      {step === "metier" && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-black text-[#111] mb-2">Quel est votre métier ?</h2>
          {professions.isLoading && <Loading />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(professions.data ?? []).map((p) => (
              <button
                key={p.code}
                onClick={() => {
                  setProfession(p.code);
                  setPrefilled(false);
                  setSelected([]);
                  persist({ profession: p.code, step: "pays", selected: [] });
                  setStep("pays");
                }}
                className={`text-left rounded-xl border p-3 transition hover:border-[#D4AF37] hover:shadow-sm ${
                  profession === p.code ? "border-[#D4AF37] bg-white ring-2 ring-[#D4AF37]/30" : "border-[#E5E7EB] bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#111]">{p.label}</span>
                  <ChevronRight size={14} className="text-[#D4AF37]" />
                </div>
                {p.description && <p className="mt-0.5 text-[11px] text-[#6B7280]">{p.description}</p>}
              </button>
            ))}
          </div>
          {professions.data?.length === 0 && !professions.isLoading && (
            <Empty text="Aucun métier n'est encore ouvert pour ce pays." />
          )}
        </div>
      )}

      {/* ── Étape 2 : pays ── */}
      {step === "pays" && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-black text-[#111] mb-2">Dans quel pays exercez-vous ?</h2>
          {countries.isLoading && <Loading />}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(countries.data ?? []).map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setCountry(c.code);
                  setPrefilled(false);
                  persist({ country: c.code, step: "besoins" });
                  setStep("besoins");
                }}
                className={`rounded-xl border bg-white p-3 text-left transition hover:border-[#D4AF37] ${
                  country === c.code ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30" : "border-[#E5E7EB]"
                }`}
              >
                <div className="text-sm font-bold text-[#111]">{c.name}</div>
                <div className="text-[10px] text-[#6B7280]">{c.currency}</div>
                {!c.paymentReady && (
                  <div className="mt-1 text-[10px] font-semibold text-orange-600">
                    Prestataire de paiement manquant
                  </div>
                )}
              </button>
            ))}
          </div>
          {countries.data?.length === 0 && !countries.isLoading && (
            <Empty text="Aucun pays n'est actuellement ouvert." />
          )}
        </div>
      )}

      {/* ── Étape 3 : besoins ── */}
      {step === "besoins" && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-black text-[#111]">De quoi avez-vous besoin ?</h2>
          <p className="text-[11px] text-[#6B7280] mb-2">
            {selectedProfession?.label} · {selectedCountry?.name}. Cochez ce que vous voulez, retirez le reste.
          </p>
          {modules.isLoading && <Loading />}
          <div className="space-y-2">
            {(modules.data ?? []).map((m) => {
              const isOn = selected.includes(m.code) || m.required;
              return (
                <button
                  key={m.code}
                  onClick={() => toggleModule(m.code, m.required)}
                  className={`w-full text-left rounded-xl border p-3 transition ${
                    isOn ? "border-[#D4AF37] bg-white ring-2 ring-[#D4AF37]/30" : "border-[#E5E7EB] bg-white hover:border-[#D4AF37]"
                  } ${m.required ? "cursor-default" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[#111]">{m.label}</span>
                        {m.required && (
                          <span className="rounded-full bg-[#111] px-1.5 py-0.5 text-[9px] font-bold text-[#D4AF37] flex items-center gap-0.5">
                            <Lock size={8} /> Inclus
                          </span>
                        )}
                      </div>
                      {m.description && <p className="mt-0.5 text-[11px] text-[#6B7280]">{m.description}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      {m.price == null ? (
                        <span className="text-[10px] font-semibold text-orange-600">Tarif à publier</span>
                      ) : (
                        <span className="text-xs font-black text-[#111]">
                          {money(m.price, m.currency ?? "EUR")}
                          {m.periodicity === "monthly" && <span className="text-[10px] font-semibold text-[#6B7280]">/mois</span>}
                        </span>
                      )}
                      <div
                        className={`mt-1 ml-auto h-4 w-4 rounded border flex items-center justify-center ${
                          isOn ? "bg-[#D4AF37] border-[#D4AF37]" : "border-[#D1D5DB]"
                        }`}
                      >
                        {isOn && <Check size={11} className="text-white" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => goTo("panier")}
            className="mt-4 w-full rounded-xl bg-[#111] py-3 text-sm font-black text-[#D4AF37]"
          >
            Voir mon offre
          </button>
        </div>
      )}

      {/* ── Étape 4 : panier ── */}
      {step === "panier" && (
        <div className="px-4 mt-4 space-y-3">
          <h2 className="text-sm font-black text-[#111]">Votre offre MKA.P-MS Pro</h2>
          {quote.isLoading && <Loading />}
          {quote.data && (
            <>
              <div className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className="text-[11px] text-[#6B7280] mb-2">
                  {selectedProfession?.label} · {selectedCountry?.name}
                </div>
                {quote.data.lines.map((l) => (
                  <div key={l.code} className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6] last:border-0">
                    <span className="text-xs text-[#111]">
                      {l.label}
                      {l.required && <span className="ml-1 text-[9px] font-bold text-[#D4AF37]">INCLUS</span>}
                    </span>
                    <span className="text-xs font-bold text-[#111]">
                      {money(l.price, l.currency)}
                      {l.periodicity === "monthly" && <span className="text-[10px] text-[#6B7280]">/mois</span>}
                    </span>
                  </div>
                ))}
                {quote.data.lines.length === 0 && (
                  <p className="text-xs text-[#6B7280] py-2">Aucun service sélectionné.</p>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-[#E5E7EB] pt-2">
                  <span className="text-sm font-black text-[#111]">Total mensuel</span>
                  <span className="text-lg font-black text-[#111]">
                    {money(quote.data.monthlyTotal, quote.data.currency)}
                    <span className="text-[11px] font-semibold text-[#6B7280]">/mois</span>
                  </span>
                </div>
                {quote.data.oneTimeTotal > 0 && (
                  <div className="flex items-center justify-between text-xs text-[#6B7280]">
                    <span>Frais uniques</span>
                    <span className="font-bold">{money(quote.data.oneTimeTotal, quote.data.currency)}</span>
                  </div>
                )}
              </div>

              {quote.data.unpriced.length > 0 && (
                <Notice
                  tone="warn"
                  title="Services sans tarif publié"
                  text={`${quote.data.unpriced.join(", ")} — ils ne sont pas facturés tant que leur tarif n'est pas publié.`}
                />
              )}

              {!quote.data.paymentReady && (
                <Notice
                  tone="warn"
                  title="Pays configuré — prestataire de paiement manquant"
                  text="Votre offre est enregistrée, mais aucun moyen de paiement n'est encore disponible pour ce pays. Notre équipe vous contacte pour l'activation."
                />
              )}

              {requirements.data && requirements.data.length > 0 && (
                <div className="rounded-xl bg-white border border-[#E5E7EB] p-3">
                  <h3 className="text-xs font-black text-[#111] flex items-center gap-1.5">
                    <FileText size={13} className="text-[#D4AF37]" /> À préparer pour l'activation
                  </h3>
                  <ul className="mt-1.5 space-y-1">
                    {requirements.data.map((r) => (
                      <li key={r} className="text-[11px] text-[#6B7280] flex items-start gap-1.5">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#D4AF37]" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => {
                  persist({ step: "panier" });
                  // Le dossier légal précède le paiement : métier, pays et
                  // services choisis sont transmis pour ne rien ressaisir.
                  const q = new URLSearchParams({
                    metier: profession ?? "",
                    pays: country ?? "",
                    modules: selected.join(","),
                  });
                  navigate(user ? `/pro/dossier?${q}` : "/connexion");
                }}
                className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-black text-white"
              >
                {user ? "Créer mon dossier professionnel" : "Créer mon compte professionnel"}
              </button>
              <button
                onClick={() => goTo("besoins")}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 text-xs font-bold text-[#111]"
              >
                Modifier mes services
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-8 text-[#9CA3AF]">
      <Loader2 size={18} className="animate-spin" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-white border border-[#E5E7EB] p-6 text-center">
      <AlertCircle size={24} className="mx-auto text-[#D1D5DB]" />
      <p className="mt-2 text-xs text-[#6B7280]">{text}</p>
    </div>
  );
}

function Notice({ tone, title, text }: { tone: "warn" | "info"; title: string; text: string }) {
  const cls = tone === "warn" ? "border-orange-200 bg-orange-50 text-orange-800" : "border-blue-200 bg-blue-50 text-blue-800";
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="text-xs font-black">{title}</div>
      <p className="mt-0.5 text-[11px]">{text}</p>
    </div>
  );
}
