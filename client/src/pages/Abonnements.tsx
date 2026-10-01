import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Check, CreditCard, Headphones, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import MetaSEO from "../components/MetaSEO";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { PLAN_CATEGORY_LABELS, PHOTO_PACKS, FREE_PHOTOS, VO_MODULES, type PlanCategory } from "@shared/plans";

type TabValue = PlanCategory | "publicite";

// Règle centrale (parcours §12) : chaque profil ne voit QUE ses offres.
const TABS: [TabValue, string][] = [
  ["particulier", "Particuliers"],
  ["pro_vente", "Pro Vente"],
  ["vo", "VO"],
  ["garage", "Garage+"],
  ["carrosserie", "Carrosserie"],
  ["location", "Location"],
  ["vtc_taxi", "VTC / TAXI"],
  ["encheres", "Enchères Pro"],
  ["pieces", "Pièces Auto"],
  ["livraison", "Livraison"],
  ["depannage", "Dépannage"],
  ["comptabilite", "Comptabilité"],
  ["franchise", "Franchise"],
  ["publicite", "Publicité"],
];

export default function Abonnements() {
  const { user } = useAuth();
  const { format: formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<TabValue>("pro_vente");
  const plans = trpc.abonnements.listPlans.useQuery();

  // Une catégorie demandée dans l'URL (arrivée depuis le catalogue ou le
  // portail Pro) prime sur la sélection automatique par rôle.
  const categorieDemandee = params.get("categorie");
  useEffect(() => {
    if (!categorieDemandee) return;
    const connue = TABS.some(([v]) => v === categorieDemandee);
    if (connue) setTab(categorieDemandee as TabValue);
  }, [categorieDemandee]);

  // Chaque profil voit d'abord ses offres (Partie 6 §5).
  useEffect(() => {
    if (categorieDemandee) return;
    if (!user) return;
    const byRole: Record<string, PlanCategory> = {
      garage: "garage",
      vtc_taxi: "vtc_taxi",
      vtc: "vtc_taxi",
      delivery: "livraison",
      pro: "pro_vente",
      pro_vente: "pro_vente",
      user: "particulier",
      particulier: "particulier",
      compta: "comptabilite",
      carrosserie: "carrosserie",
      encheres: "encheres",
      pieces: "pieces",
    };
    const target = byRole[user.role];
    if (target) setTab(target);
  }, [user, categorieDemandee]);

  // Reprise auto d'un checkout après connexion : si l'utilisateur a cliqué
  // 'S'abonner' avant de se connecter, on relance automatiquement le paiement.
  useEffect(() => {
    if (!user) return;
    try {
      const pending = sessionStorage.getItem("mkapms_pending_plan");
      if (pending) {
        sessionStorage.removeItem("mkapms_pending_plan");
        setPendingCode(pending);
        checkout.mutate({ planCode: pending });
      }
    } catch { /* stockage indisponible */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  const checkout = trpc.abonnements.createCheckout.useMutation({
    onSuccess: (r) => {
      if (r.url) window.location.href = r.url;
    },
    onError: (err) => {
      setErrMsg(err.message || "Impossible de démarrer le paiement pour le moment.");
    },
  });
  const openPortal = trpc.abonnements.openPortal.useMutation({
    onSuccess: (r) => {
      if (r.url) window.location.href = r.url;
    },
    onError: (err) => {
      setErrMsg(err.message || "Impossible d'ouvrir le portail de gestion.");
    },
  });
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Connexion Smart Engine : chaque sélection d'offre est un événement supervisé.
  const track = trpc.smartEngine.trackAction.useMutation();

  const filtered = tab !== "publicite" ? (plans.data?.filter((p) => p.category === tab) ?? []) : [];
  const selectedPlan = filtered.find((p) => p.code === selectedCode) ?? null;

  // Le changement d'onglet remet la sélection à zéro (offres différentes).
  useEffect(() => {
    setSelectedCode(null);
  }, [tab]);

  // Sélection d'une carte (clic n'importe où / clavier) → mémorise l'offre
  // et notifie le Système Intelligent (parcours §3).
  function selectPlan(code: string) {
    setErrMsg(null);
    setSelectedCode(code);
    track.mutate({
      action: "select_plan",
      target: code,
      metadata: { category: tab, role: user?.role ?? "visiteur" },
    });
  }

  function subscribe(code: string, priceEur: number | null) {
    setErrMsg(null);
    if (!user) {
      // Sauvegarde l'offre visée pour reprise après connexion
      try {
        sessionStorage.setItem("mkapms_pending_plan", code);
      } catch { /* stockage indisponible */ }
      return navigate("/connexion?return=/abonnements");
    }
    if (priceEur == null) {
      // Offre "sur demande" → redirection vers le formulaire de contact
      return navigate(`/contact?sujet=${encodeURIComponent(`Offre sur demande — ${code}`)}`);
    }
    setPendingCode(code);
    checkout.mutate({ planCode: code });
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE] pb-24 text-[#09152C]">
      <MetaSEO
        title="Tarifs & abonnements"
        description="Des abonnements transparents pour particuliers et professionnels de l’automobile, sans engagement et avec paiement sécurisé."
        url="https://mkapms.com/abonnements"
      />

      <section className="relative isolate overflow-hidden bg-[#07111F] px-5 pb-28 pt-16 text-white sm:px-8 sm:pb-36 sm:pt-24">
        <video className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40" autoPlay muted loop playsInline preload="metadata" poster="/pubs/hero5-pro.jpg" aria-hidden="true">
          <source src="/videos/home/home_services.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#050B14] via-[#07111F]/90 to-[#07111F]/55" />
        <div className="mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] backdrop-blur"><Sparkles className="h-4 w-4 text-[#E2B82D]" /> Des offres pensées pour chaque métier</span>
          <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">Le bon abonnement, sans zone d’ombre.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-xl">Comparez ce qui est inclus, choisissez votre profil et gardez le contrôle sur votre abonnement depuis votre espace.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs font-bold text-white/85">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur"><LockKeyhole className="h-4 w-4 text-emerald-300" /> Paiement sécurisé</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur"><BadgeCheck className="h-4 w-4 text-[#E2B82D]" /> Prix affichés clairement</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur"><ShieldCheck className="h-4 w-4 text-blue-300" /> Sans engagement</span>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-[30px] border border-black/5 bg-white p-3 shadow-[0_24px_70px_rgba(9,21,44,.15)] sm:p-4" aria-label="Choisir un profil">
          <p className="px-3 pb-3 pt-2 text-center text-xs font-black uppercase tracking-[.18em] text-black/40">Quel est votre profil ?</p>
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max justify-start gap-2">
              {TABS.map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTab(v)}
                  aria-pressed={tab === v}
                  className={`min-h-12 shrink-0 rounded-2xl px-5 text-sm font-black transition ${tab === v ? "bg-[#D9B323] text-[#111] shadow-md shadow-[#D4AF37]/20" : "bg-[#F4F5F7] text-slate-600 hover:bg-slate-100"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </section>

      {/* Bannière d'erreur (KYC manquant, Stripe non configuré, etc.) */}
      {errMsg && (
        <div
          className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
          data-testid="subscribe-error"
        >
          <div className="flex items-start justify-between gap-3">
            <span>{errMsg}</span>
            <button
              onClick={() => setErrMsg(null)}
              className="shrink-0 text-red-500 hover:text-red-700"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Gérer un abonnement existant (portail client Stripe) */}
      {user && (
        <div className="mx-auto mt-4 max-w-2xl text-center">
          <button
            onClick={() => {
              setErrMsg(null);
              openPortal.mutate({});
            }}
            disabled={openPortal.isPending}
            className="text-xs font-semibold uppercase tracking-widest text-slate-500 underline underline-offset-4 hover:text-slate-800"
            data-testid="open-portal-btn"
          >
            {openPortal.isPending
              ? "Ouverture du portail…"
              : "Gérer mon abonnement (annulation, factures, changement de plan)"}
          </button>
        </div>
      )}

      {/* Particulier → devenir professionnel (accès aux offres pro) */}
      {(user?.role === "user" || user?.role === "particulier") && (
        <div className="mx-auto mt-6 flex max-w-2xl flex-col items-center gap-3 rounded-2xl border-2 border-gold bg-gradient-to-r from-[#111] to-[#1a1a1a] p-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-base font-bold text-gold">Vous êtes un professionnel&nbsp;?</p>
            <p className="text-xs text-white/60">Passez en compte pro pour vendre, gérer votre stock et accéder aux outils professionnels.</p>
          </div>
          <button
            onClick={() => setTab("pro_vente")}
            className="shrink-0 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-noir hover:brightness-95"
          >
            Devenir un pro
          </button>
        </div>
      )}

      <div className="mt-10 text-center">
        <p className="text-xs font-black uppercase tracking-[.2em] text-[#B18B08]">Offres adaptées à votre activité</p>
        <h2 className="mt-2 text-2xl font-black text-[#09152C] sm:text-3xl">{tab === "publicite" ? "Publicité — Emplacements & Tarifs" : PLAN_CATEGORY_LABELS[tab as PlanCategory]}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-black/50">Sélectionnez une offre pour voir clairement votre choix avant de continuer.</p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((p) => {
          const isSelected = selectedCode === p.code;
          return (
          <div
            key={p.code}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`Choisir l'offre ${p.label}`}
            onClick={() => selectPlan(p.code)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectPlan(p.code);
              }
            }}
            data-testid={`plan-card-${p.code}`}
            className={`relative flex cursor-pointer flex-col rounded-[28px] border bg-white p-6 outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-gold ${
              isSelected
                ? "-translate-y-1 border-gold ring-2 ring-gold shadow-[0_18px_50px_rgba(212,175,55,.18)]"
                : p.highlight
                  ? "border-gold shadow-[0_14px_40px_rgba(9,21,44,.10)] hover:-translate-y-1 hover:shadow-xl"
                  : "border-black/5 shadow-[0_12px_36px_rgba(9,21,44,.07)] hover:-translate-y-1 hover:shadow-xl"
            }`}
          >
            {isSelected && (
              <span
                className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gold text-noir shadow-md"
                aria-hidden="true"
              >
                <Check size={18} strokeWidth={3} />
              </span>
            )}
            {p.highlight && (
              <span className="badge absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-noir">
                Le plus choisi
              </span>
            )}
            <h3 className="text-lg font-extrabold text-slate-900">{p.label}</h3>
            <div className="mt-2 text-3xl font-extrabold text-noir">
              {p.priceEur == null ? (
                <span className="text-xl">Sur demande</span>
              ) : (
                <>
                  {formatPrice(p.priceEur)}
                  <span className="text-sm font-medium text-slate-400">
                    {p.recurring ? " /mois" : p.durationDays ? ` / ${p.durationDays}j` : ""}
                  </span>
                </>
              )}
            </div>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-600">
              {p.features.map((feat) => (
                <li key={feat} className="flex gap-2">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-gold-dark" />
                  {feat}
                </li>
              ))}
            </ul>
            <button
              className={p.highlight || isSelected ? "btn-primary mt-6" : "btn-outline mt-6"}
              disabled={checkout.isPending && pendingCode === p.code}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCode(p.code);
                subscribe(p.code, p.priceEur);
              }}
              data-testid={`subscribe-btn-${p.code}`}
            >
              {checkout.isPending && pendingCode === p.code
                ? "Redirection Stripe…"
                : p.priceEur == null
                  ? "Contacter la Direction"
                  : tab === "particulier"
                    ? "Choisir cette option"
                    : "S'abonner"}
            </button>
          </div>
          );
        })}
      </div>

      {/* Barre de confirmation (parcours §3) : la carte sélectionnée active le
          bouton inférieur qui ouvre le tunnel de paiement. */}
      {selectedPlan && (
        <div className="sticky bottom-4 z-20 mx-auto mt-8 flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-gold bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Offre sélectionnée</p>
            <p className="text-base font-extrabold text-slate-900">
              {selectedPlan.label}
              {selectedPlan.priceEur != null && (
                <span className="ml-2 text-gold-dark">
                  {formatPrice(selectedPlan.priceEur)}
                  {selectedPlan.recurring ? " /mois" : selectedPlan.durationDays ? ` / ${selectedPlan.durationDays}j` : ""}
                </span>
              )}
            </p>
          </div>
          <button
            className="btn-primary shrink-0"
            disabled={checkout.isPending && pendingCode === selectedPlan.code}
            onClick={() => subscribe(selectedPlan.code, selectedPlan.priceEur)}
            data-testid="plan-continue-btn"
          >
            {checkout.isPending && pendingCode === selectedPlan.code
              ? "Redirection Stripe…"
              : selectedPlan.priceEur == null
                ? `Continuer — ${selectedPlan.label} (sur demande)`
                : `Continuer avec l'offre ${selectedPlan.label} — ${formatPrice(selectedPlan.priceEur)}${selectedPlan.recurring ? "/mois" : ""}`}
          </button>
        </div>
      )}
      {tab === "particulier" && (
        <div className="mt-12">
          <h2 className="text-center text-lg font-bold text-slate-700">Photos supplémentaires (à l'unité)</h2>
          <p className="mt-1 text-center text-sm text-slate-500">
            {FREE_PHOTOS} photos gratuites incluses par annonce. Au-delà, c'est facturé — jamais bloqué.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PHOTO_PACKS.map((pack) => (
              <div key={pack.code} className="card flex flex-col items-center p-5 text-center">
                <h3 className="font-extrabold text-slate-900">{pack.label}</h3>
                <div className="mt-2 text-2xl font-extrabold text-noir">{formatPrice(pack.priceEur)}</div>
                <p className="mt-1 text-xs text-slate-500">+{pack.extraPhotos} photo{pack.extraPhotos > 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "vo" && (
        <div className="mt-12">
          <h2 className="text-center text-lg font-bold text-slate-700">Options activables</h2>
          <p className="mt-1 text-center text-sm text-slate-500">
            Modules complémentaires pour enrichir votre abonnement VO.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VO_MODULES.map((mod) => (
              <div key={mod.code} className="card flex flex-col p-6">
                <h3 className="text-lg font-extrabold text-slate-900">{mod.label}</h3>
                <div className="mt-2 text-2xl font-extrabold text-noir">
                  {formatPrice(mod.priceEur!)}
                  <span className="text-sm font-medium text-slate-400"> /mois</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                  {mod.features.map((feat) => (
                    <li key={feat} className="flex gap-2">
                      <Check size={16} className="mt-0.5 flex-shrink-0 text-gold-dark" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button className="btn-outline mt-4" onClick={() => subscribe(mod.code, mod.priceEur ?? null)}>
                  Activer ce module
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "publicite" && (
        <div className="mt-6 space-y-4">
          <p className="text-center text-sm text-slate-500">Réservez un emplacement publicitaire sur la plateforme. Chaque emplacement dispose de plusieurs cases en rotation.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { id: 1, name: "Accueil — Carrousel #1", cases: 5, tarif: "50€/jour", tarifSem: "300€/sem", tarifMois: "900€/mois", desc: "Entre annonces Pro et Particuliers. Très visible." },
              { id: 2, name: "Accueil — Carrousel #2", cases: 5, tarif: "40€/jour", tarifSem: "250€/sem", tarifMois: "700€/mois", desc: "Après section Location. Public mixte." },
              { id: 3, name: "Accueil — Premium #3", cases: 5, tarif: "80€/jour", tarifSem: "500€/sem", tarifMois: "1500€/mois", desc: "Section dorée premium. Haute conversion." },
              { id: 4, name: "Page Produit — Bas de page", cases: 4, tarif: "30€/jour", tarifSem: "180€/sem", tarifMois: "500€/mois", desc: "Sous chaque fiche véhicule. Public qualifié." },
              { id: 5, name: "Page Recherche — Sidebar", cases: 3, tarif: "40€/jour", tarifSem: "250€/sem", tarifMois: "700€/mois", desc: "Sidebar droite des résultats." },
              { id: 6, name: "Page Résultats — Entre annonces", cases: 4, tarif: "35€/jour", tarifSem: "200€/sem", tarifMois: "600€/mois", desc: "Inséré entre les annonces. Natif." },
            ].map((emp) => (
              <div key={emp.id} className="card p-5">
                <h3 className="text-sm font-extrabold text-slate-900">#{emp.id} — {emp.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{emp.desc}</p>
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: emp.cases }).map((_, i) => (
                    <div key={i} className="h-3 w-8 rounded bg-[#D4AF37]/30" />
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">{emp.cases} cases disponibles</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-[#FFFDF5] border border-[#D4AF37]/30 px-2 py-1 text-xs font-bold text-[#B8960C]">{emp.tarif}</span>
                  <span className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-1 text-xs text-slate-600">{emp.tarifSem}</span>
                  <span className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-1 text-xs text-slate-600">{emp.tarifMois}</span>
                </div>
                <Link to="/demande-publicite" className="btn-primary mt-4 block text-center !text-xs">
                  Réserver cet emplacement
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
      {checkout.error && (
        <p className="mt-6 text-center text-sm text-red-600">{checkout.error.message}</p>
      )}
        <section className="mt-16 rounded-[32px] bg-[#09152C] p-7 text-white shadow-[0_24px_70px_rgba(9,21,44,.18)] sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#E2B82D]">Un parcours simple et transparent</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Vous savez ce que vous choisissez, avant de payer.</h2>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              ["01", "Choisissez votre profil", "Les offres sont regroupées selon votre activité pour éviter les options inutiles."],
              ["02", "Comparez les éléments inclus", "Chaque fonctionnalité et chaque durée sont affichées directement dans l’offre."],
              ["03", "Gardez le contrôle", "Retrouvez la gestion, les factures et les changements d’abonnement depuis votre espace."],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-3xl border border-white/10 bg-white/[.06] p-6">
                <span className="text-sm font-black text-[#E2B82D]">{number}</span>
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [CreditCard, "Paiement protégé", "Le paiement est traité sur un parcours sécurisé."],
            [BadgeCheck, "Prix transparents", "Le montant et la périodicité restent visibles avant validation."],
            [ShieldCheck, "Gestion autonome", "Gérez vos factures et votre abonnement depuis votre portail."],
            [Headphones, "Une équipe disponible", "Une question sur une offre ? Contactez-nous avant de choisir."],
          ].map(([Icon, title, description]) => {
            const TrustIcon = Icon as typeof CreditCard;
            return <div key={String(title)} className="rounded-[26px] border border-black/5 bg-white p-6 shadow-sm"><TrustIcon className="h-7 w-7 text-[#B18B08]" /><h3 className="mt-4 font-black">{String(title)}</h3><p className="mt-2 text-sm leading-relaxed text-black/50">{String(description)}</p></div>;
          })}
        </section>

        <section className="mt-12 rounded-[32px] border border-black/5 bg-white p-7 shadow-sm sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
            <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#B18B08]">Questions fréquentes</p><h2 className="mt-3 text-3xl font-black tracking-tight">Décidez en confiance.</h2><p className="mt-3 text-sm leading-relaxed text-black/50">Les informations essentielles restent accessibles avant la souscription. Pour une offre sur mesure, la Direction peut vous accompagner.</p></div>
            <div className="space-y-3">
              {[
                ["Puis-je gérer mon abonnement après l’achat ?", "Oui. Une fois connecté, le portail de gestion permet d’accéder aux factures, aux changements de plan et aux options d’annulation disponibles."],
                ["Le prix peut-il changer au moment du paiement ?", "Le prix de l’offre sélectionnée est affiché avant la redirection. Les offres sur demande vous dirigent vers la Direction sans paiement immédiat."],
                ["Puis-je demander de l’aide avant de choisir ?", "Oui. Les offres sur demande et le formulaire de contact permettent d’échanger avec l’équipe avant tout engagement."],
                ["Les offres sont-elles adaptées aux professionnels ?", "Chaque métier dispose de sa propre catégorie : vente, garage, carrosserie, location, livraison, pièces et autres activités."],
              ].map(([question, answer]) => <details key={question} className="group rounded-2xl border border-black/5 bg-[#F7F6F2] px-5 py-4"><summary className="cursor-pointer list-none pr-6 font-black marker:hidden">{question}</summary><p className="mt-3 text-sm leading-relaxed text-black/55">{answer}</p></details>)}
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[32px] bg-gradient-to-r from-[#D9B323] to-[#E8C84A] p-7 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[.2em] text-black/55">Besoin d’un conseil ?</p><h2 className="mt-2 text-3xl font-black tracking-tight text-[#09152C]">Parlez-nous de votre activité.</h2><p className="mt-2 max-w-2xl text-sm text-black/60">L’équipe vous aide à identifier l’offre adaptée, sans modifier votre sélection ni déclencher un paiement.</p></div>
            <Link to="/contact?sujet=Conseil%20abonnement" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#09152C] px-6 py-4 text-sm font-black text-white">Contacter l’équipe <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
