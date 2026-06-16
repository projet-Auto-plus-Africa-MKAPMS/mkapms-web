import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
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
  ["location", "Location"],
  ["vtc_taxi", "VTC / TAXI"],
  ["pieces", "Pièces Auto"],
  ["livraison", "Livraison"],
  ["depannage", "Dépannage"],
  ["franchise", "Franchise"],
  ["publicite", "Publicité"],
];

export default function Abonnements() {
  const { user } = useAuth();
  const { format: formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabValue>("pro_vente");
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

  const filtered = tab !== "publicite" ? (plans.data?.filter((p) => p.category === tab) ?? []) : [];

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
