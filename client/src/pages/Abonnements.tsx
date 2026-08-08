import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
    <div className="container-page py-10">
      <h1 className="text-center text-3xl font-extrabold text-slate-900">Tarifs & abonnements</h1>
      <p className="mt-2 text-center text-slate-500">
        Sans engagement. Paiement sécurisé Stripe. Affichage multi-devises automatique.
      </p>

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

      <div className="mt-8 flex justify-center">
        <div className="inline-flex max-w-full flex-wrap justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
          {TABS.map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${tab === v ? "bg-gold text-noir shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <h2 className="mt-8 text-center text-lg font-bold text-slate-700">{tab === "publicite" ? "Publicité — Emplacements & Tarifs" : PLAN_CATEGORY_LABELS[tab as PlanCategory]}</h2>

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
            className={`card relative flex cursor-pointer flex-col p-6 outline-none transition duration-150 focus-visible:ring-2 focus-visible:ring-gold ${
              isSelected
                ? "-translate-y-1 ring-2 ring-gold shadow-[0_0_0_4px_rgba(212,175,55,0.25)]"
                : p.highlight
                  ? "ring-2 ring-gold hover:-translate-y-0.5 hover:shadow-lg"
                  : "hover:-translate-y-0.5 hover:shadow-lg"
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
    </div>
  );
}
