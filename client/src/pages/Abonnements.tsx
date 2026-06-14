import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { PLAN_CATEGORY_LABELS, PHOTO_PACKS, FREE_PHOTOS, VO_MODULES, type PlanCategory } from "@shared/plans";

// Règle centrale (parcours §12) : chaque profil ne voit QUE ses offres.
const TABS: [PlanCategory, string][] = [
  ["particulier", "Particuliers"],
  ["pro_vente", "Pro Vente"],
  ["vo", "VO"],
  ["garage", "Garage+"],
  ["location", "Location"],
  ["vtc_taxi", "VTC / TAXI"],
  ["pieces", "Pièces Auto"],
  ["livraison", "Livraison"],
  ["franchise", "Franchise"],
];

export default function Abonnements() {
  const { user } = useAuth();
  const { format: formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [tab, setTab] = useState<PlanCategory>("pro_vente");
  const plans = trpc.abonnements.listPlans.useQuery();

  // Chaque profil voit d'abord ses offres (Partie 6 §5).
  useEffect(() => {
    if (!user) return;
    const byRole: Record<string, PlanCategory> = {
      garage: "garage",
      vtc_taxi: "vtc_taxi",
      delivery: "livraison",
      pro: "pro_vente",
      user: "particulier",
    };
    const target = byRole[user.role];
    if (target) setTab(target);
  }, [user]);
  const checkout = trpc.abonnements.createCheckout.useMutation({
    onSuccess: (r) => {
      if (r.url) window.location.href = r.url;
    },
  });

  const filtered = plans.data?.filter((p) => p.category === tab) ?? [];

  function subscribe(code: string) {
    if (!user) return navigate("/connexion");
    checkout.mutate({ planCode: code });
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-center text-3xl font-extrabold text-slate-900">Tarifs & abonnements</h1>
      <p className="mt-2 text-center text-slate-500">
        Sans engagement. Paiement sécurisé Stripe. Affichage multi-devises automatique.
      </p>

      <div className="mt-8 flex justify-center">
        <div className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {TABS.map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === v ? "bg-gold text-noir" : "text-slate-600"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <h2 className="mt-8 text-center text-lg font-bold text-slate-700">{PLAN_CATEGORY_LABELS[tab]}</h2>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((p) => (
          <div
            key={p.code}
            className={`card relative flex flex-col p-6 ${p.highlight ? "ring-2 ring-gold" : ""}`}
          >
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
              className={p.highlight ? "btn-primary mt-6" : "btn-outline mt-6"}
              disabled={checkout.isPending}
              onClick={() => subscribe(p.code)}
            >
              {p.priceEur == null ? "Contacter la Direction" : tab === "particulier" ? "Choisir cette option" : "S'abonner"}
            </button>
          </div>
        ))}
      </div>
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
                <button className="btn-outline mt-4" onClick={() => subscribe(mod.code)}>
                  Activer ce module
                </button>
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
