import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Gift,
  Loader2,
  Sparkles,
  Wallet,
} from "lucide-react";
import MetaSEO from "../components/MetaSEO";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";

/* ══════════════════════════════════════════════════════════════════════════
   AL-HOUDOUD·M — Abonnements (/ia/abonnements), page commerciale PUBLIQUE.
   Données réelles : trpc.iaCommerce.catalog (uniquement les offres actives —
   rien n'est vendable ici tant que le PDG ne l'a pas validé depuis
   /superadmin/tarifs-ia). Jamais de prix ni de catalogue en dur : tout vient
   du registre central via le routeur iaCommerce, déjà construit et figé.

   Mêmes libellés d'audience que l'écran PDG (AdminTarifsIA.tsx) — non
   importés (cet écran n'exporte rien), simplement recopiés à l'identique
   pour ne jamais diverger dans le vocabulaire présenté au PDG et au public.
   ══════════════════════════════════════════════════════════════════════════ */

const AUDIENCE_LABELS: Record<string, string> = {
  particulier: "Particuliers",
  professionnel: "Professionnels",
  developpeur: "Développeurs",
  automobile: "Automobile (add-on)",
  marchand: "Marchands & e-commerce",
  equipe: "Équipes & organisations",
  specialise: "Offres spécialisées",
};
const AUDIENCE_ORDER = Object.keys(AUDIENCE_LABELS);

const DUREE_LABELS: Record<string, string> = {
  hebdomadaire: "Hebdo",
  mensuel: "Mensuel",
  annuel: "Annuel",
};
const DUREE_ORDER = ["hebdomadaire", "mensuel", "annuel"];

interface TierProductMeta {
  tier: string;
  periodiciteLabel: "hebdomadaire" | "mensuel" | "annuel" | "ponctuel";
  creditsInclus: number;
  overageEurParUnite: number | null;
  features: string[];
  seatBased?: boolean;
}
interface TierProduct {
  code: string;
  name: string;
  price: number;
  meta: TierProductMeta | null;
}

/** Une formule (ex. « Particulier Essentiel ») avec un sélecteur de durée quand plusieurs existent. */
function TierCard({
  produits,
  codesActifs,
  onChoisir,
  codePending,
  format,
}: {
  produits: TierProduct[];
  codesActifs: Set<string>;
  onChoisir: (code: string) => void;
  codePending: string | null;
  format: (eur: number) => string;
}) {
  const durees = DUREE_ORDER.filter((d) => produits.some((p) => p.meta?.periodiciteLabel === d));
  const [duree, setDuree] = useState<string>(durees[0] ?? produits[0]?.meta?.periodiciteLabel ?? "mensuel");
  const actuel = produits.find((p) => p.meta?.periodiciteLabel === duree) ?? produits[0];
  if (!actuel) return null;
  const estActif = codesActifs.has(actuel.code);

  return (
    <div className="flex flex-col rounded-xl bg-white border border-[#E5E7EB] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[#111]">{actuel.meta?.tier ?? actuel.name}</h3>
        {actuel.meta?.seatBased && (
          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">Prix / siège</span>
        )}
      </div>

      {durees.length > 1 && (
        <div className="mt-2 flex gap-1.5">
          {durees.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuree(d)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                duree === d ? "bg-[#111] text-white" : "bg-[#F5F3EF] text-[#6B7280] hover:bg-[#EDE9E1]"
              }`}
            >
              {DUREE_LABELS[d] ?? d}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-xl font-black text-[#111]">{format(actuel.price)}</span>
        <span className="text-[11px] text-[#9CA3AF]">/ {DUREE_LABELS[actuel.meta?.periodiciteLabel ?? ""] ?? actuel.meta?.periodiciteLabel}</span>
      </div>
      <p className="mt-1 text-[11px] text-[#6B7280]">
        {actuel.meta?.creditsInclus ?? 0} unités AL-HOUDOUD·M incluses
        {actuel.meta?.overageEurParUnite != null ? ` · dépassement ${actuel.meta.overageEurParUnite.toFixed(2)} €/unité` : ""}
      </p>

      <ul className="mt-3 flex-1 space-y-1.5">
        {(actuel.meta?.features ?? []).map((f, i) => (
          <li key={i} className="flex gap-1.5 text-[11px] text-[#374151]">
            <Check size={12} className="mt-0.5 shrink-0 text-[#D4AF37]" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChoisir(actuel.code)}
        disabled={estActif || codePending === actuel.code}
        className={`mt-4 rounded-lg py-2 text-xs font-bold transition disabled:opacity-70 ${
          estActif ? "bg-green-50 text-green-700" : "bg-[#111] text-white hover:bg-[#222]"
        }`}
      >
        {estActif ? "Abonnement actif" : codePending === actuel.code ? "Redirection…" : "Choisir cette formule"}
      </button>
    </div>
  );
}

export default function OffresIA() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { format } = useCurrency();

  const catalog = trpc.iaCommerce.catalog.useQuery();
  const mesAbonnements = trpc.iaCommerce.mine.useQuery(undefined, { enabled: !!user });

  const produits = catalog.data ?? [];
  type P = (typeof produits)[number];

  const chargement = catalog.isLoading;
  const erreur = catalog.error;
  const vide = !chargement && !erreur && produits.length === 0;

  const decouverte = produits.find((p) => p.meta?.kind === "decouverte");
  const essaiProduit = produits.find((p) => p.meta?.kind === "essai_gratuit");
  const aDesAbonnements = produits.some((p) => p.meta?.kind === "abonnement");

  const codesActifs = new Set((mesAbonnements.data ?? []).filter((s) => s.status === "active").map((s) => s.planCode));

  const parAudience = new Map<string, Map<string, P[]>>();
  for (const p of produits) {
    if (p.meta?.kind !== "abonnement") continue;
    const audience = p.meta.audience;
    const byTier = parAudience.get(audience) ?? new Map<string, P[]>();
    const liste = byTier.get(p.meta.tier) ?? [];
    liste.push(p);
    byTier.set(p.meta.tier, liste);
    parAudience.set(audience, byTier);
  }

  const [tab, setTab] = useState<string>(AUDIENCE_ORDER[0]);
  const [tabChoisiManuellement, setTabChoisiManuellement] = useState(false);

  // Par défaut, ouvre la première catégorie qui a réellement des offres
  // actives plutôt qu'une catégorie vide (normal en début de déploiement,
  // le PDG activant les audiences une à une).
  useEffect(() => {
    if (tabChoisiManuellement || !catalog.data) return;
    const premiereNonVide = AUDIENCE_ORDER.find((a) => (parAudience.get(a)?.size ?? 0) > 0);
    if (premiereNonVide) setTab(premiereNonVide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.data]);

  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);
  const [essaiOk, setEssaiOk] = useState<{ creditsInclus: number; finPeriode: Date } | null>(null);
  const [essaiErr, setEssaiErr] = useState<string | null>(null);

  const checkout = trpc.iaCommerce.checkoutAbonnement.useMutation({
    onSuccess: (r) => {
      if (r.url) window.location.href = r.url;
    },
    onError: (err) => {
      setCheckoutErr(err.message || "Impossible de démarrer le paiement pour le moment.");
      setPendingCode(null);
    },
  });
  const essai = trpc.iaCommerce.startFreeTrial.useMutation({
    onSuccess: (r) => {
      setEssaiErr(null);
      setEssaiOk({ creditsInclus: r.creditsInclus, finPeriode: new Date(r.finPeriode) });
    },
    onError: (err) => setEssaiErr(err.message || "Impossible d'activer l'essai gratuit pour le moment."),
  });

  function lancerCheckout(code: string) {
    setCheckoutErr(null);
    if (!user) {
      navigate(`/connexion?return=${encodeURIComponent("/ia/abonnements")}`);
      return;
    }
    setPendingCode(code);
    checkout.mutate({ code });
  }

  function lancerEssai() {
    setEssaiErr(null);
    if (!user) {
      navigate(`/connexion?return=${encodeURIComponent("/ia/abonnements")}`);
      return;
    }
    essai.mutate();
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <MetaSEO
        title="AL-HOUDOUD·M — Abonnements & crédits"
        description="Découvrez AL-HOUDOUD·M gratuitement, puis choisissez l'abonnement adapté à votre profil : particulier, professionnel, développeur, automobile, marchand, équipe ou spécialisé."
        url="https://mkapms.com/ia/abonnements"
      />

      <div className="bg-[#111] px-4 pt-6 pb-5">
        <h1 className="flex items-center gap-2 text-xl font-black text-white">
          <Sparkles size={20} className="text-[#D4AF37]" /> AL-HOUDOUD·M
        </h1>
        <p className="mt-1 text-sm text-white/60">L'IA centrale de MKA.P-MS — testez-la, puis choisissez l'abonnement adapté à votre usage.</p>
      </div>

      {params.get("success") === "1" && (
        <div className="mx-4 mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-800">
          <p className="flex items-center gap-2 font-bold"><CheckCircle2 size={14} /> Retour du prestataire de paiement</p>
          <p className="mt-1">La confirmation définitive arrive automatiquement dès que l'encaissement est confirmé.</p>
        </div>
      )}
      {params.get("canceled") === "1" && (
        <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="flex items-center gap-2 font-bold"><AlertTriangle size={14} /> Paiement annulé</p>
          <p className="mt-1">Rien n'a été débité, vous pouvez réessayer quand vous voulez.</p>
        </div>
      )}
      {checkoutErr && (
        <div className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <span>{checkoutErr}</span>
          <button onClick={() => setCheckoutErr(null)} aria-label="Fermer" className="shrink-0 text-red-500">✕</button>
        </div>
      )}

      {chargement && (
        <div className="flex justify-center py-10 text-[#6B7280]"><Loader2 className="animate-spin" size={20} /></div>
      )}
      {erreur && !chargement && (
        <p className="px-4 py-6 text-center text-sm text-red-600">Catalogue indisponible pour le moment : {erreur.message}</p>
      )}

      {vide && (
        <div className="px-4 py-14 text-center">
          <Sparkles size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-3 text-sm font-bold text-[#111]">Rien n'est encore disponible à l'achat.</p>
          <p className="mx-auto mt-2 max-w-sm text-xs text-[#6B7280]">
            La grille tarifaire AL-HOUDOUD·M est en préparation et sera publiée dès validation par la Direction. Revenez bientôt.
          </p>
        </div>
      )}

      {!chargement && !erreur && (decouverte || essaiProduit) && (
        <section className="mx-4 mt-4">
          <div className="rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#FFFDF5] p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#B8960C]">
              <Gift size={14} /> Offre découverte — pas l'abonnement normal
            </p>
            <p className="mt-1 text-[11px] text-[#6B7280]">
              Pour essayer AL-HOUDOUD·M avant de choisir un abonnement : courte durée, prix symbolique ou gratuit, jamais reconduit automatiquement.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {decouverte && (
                <div className="rounded-xl bg-white border border-[#D4AF37]/40 p-4">
                  <h3 className="text-sm font-bold text-[#111]">{decouverte.name}</h3>
                  <p className="mt-1 text-lg font-black text-[#B8960C]">
                    {format(decouverte.price)} <span className="text-[10px] font-normal text-[#9CA3AF]">/ {decouverte.validityDays} jours</span>
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {(decouverte.meta?.features ?? []).map((f, i) => (
                      <li key={i} className="flex gap-1.5 text-[11px] text-[#374151]">
                        <Check size={12} className="mt-0.5 shrink-0 text-[#D4AF37]" /> <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => lancerCheckout(decouverte.code)}
                    disabled={checkout.isPending && pendingCode === decouverte.code}
                    className="mt-3 w-full rounded-lg bg-[#D4AF37] py-2 text-xs font-bold text-white transition hover:bg-[#c29f2f] disabled:opacity-70"
                  >
                    {checkout.isPending && pendingCode === decouverte.code ? "Redirection…" : `Découvrir pour ${format(decouverte.price)}`}
                  </button>
                </div>
              )}

              {essaiProduit && (
                <div className="rounded-xl bg-white border border-[#D4AF37]/40 p-4">
                  <h3 className="text-sm font-bold text-[#111]">{essaiProduit.name}</h3>
                  <p className="mt-1 text-lg font-black text-green-600">
                    Gratuit <span className="text-[10px] font-normal text-[#9CA3AF]">/ {essaiProduit.validityDays} jours — une fois par compte</span>
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {(essaiProduit.meta?.features ?? []).map((f, i) => (
                      <li key={i} className="flex gap-1.5 text-[11px] text-[#374151]">
                        <Check size={12} className="mt-0.5 shrink-0 text-[#D4AF37]" /> <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {essaiOk ? (
                    <p className="mt-3 rounded-lg bg-green-50 p-2 text-[11px] font-semibold text-green-700">
                      Essai activé : {essaiOk.creditsInclus} unités jusqu'au {essaiOk.finPeriode.toLocaleDateString("fr-FR")}.
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={lancerEssai}
                      disabled={essai.isPending}
                      className="mt-3 w-full rounded-lg bg-[#111] py-2 text-xs font-bold text-white transition hover:bg-[#222] disabled:opacity-70"
                    >
                      {essai.isPending ? "Activation…" : "Essai gratuit (3 jours)"}
                    </button>
                  )}
                  {essaiErr && <p className="mt-2 text-[11px] text-red-600">{essaiErr}</p>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {!chargement && !erreur && aDesAbonnements && (
        <section className="mt-8 px-4">
          <h2 className="text-center text-xs font-black uppercase tracking-[.18em] text-[#B18B08]">Abonnements par profil</h2>
          <div className="mt-3 overflow-x-auto pb-1">
            <div className="flex min-w-max justify-center gap-2">
              {AUDIENCE_ORDER.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setTabChoisiManuellement(true);
                    setTab(a);
                  }}
                  aria-pressed={tab === a}
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    tab === a ? "bg-[#111] text-white" : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F0EEE8]"
                  }`}
                >
                  {AUDIENCE_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...(parAudience.get(tab)?.entries() ?? [])].map(([tier, prods]) => (
              <TierCard key={tier} produits={prods} codesActifs={codesActifs} onChoisir={lancerCheckout} codePending={pendingCode} format={format} />
            ))}
          </div>

          {!(parAudience.get(tab)?.size) && (
            <p className="mt-8 text-center text-xs text-[#9CA3AF]">Aucune offre active dans cette catégorie pour le moment.</p>
          )}
        </section>
      )}

      {!chargement && !erreur && !vide && (
        <div className="mx-4 mt-10 flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <Wallet size={16} className="text-[#D4AF37]" />
            <span>Besoin de recharger votre solde sans reprendre un abonnement ? Des packs de crédits sont disponibles dans votre portefeuille.</span>
          </div>
          <Link to="/utilisateurs/portefeuille-ia" className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#D4AF37]">
            Portefeuille <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
