import { useState } from "react";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { formatPrice } from "@shared/currency";

type Tab = "particulier" | "pro" | "franchise";

export default function Abonnements() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("pro");
  const plans = trpc.abonnements.listPlans.useQuery();
  const checkout = trpc.abonnements.createCheckout.useMutation({
    onSuccess: (r) => {
      if (r.url) window.location.href = r.url;
    },
  });

  const filtered = plans.data?.filter((p) => p.audience === tab) ?? [];

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
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {([
            ["particulier", "Particuliers"],
            ["pro", "Professionnels"],
            ["franchise", "Franchise"],
          ] as [Tab, string][]).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold ${tab === v ? "bg-brand text-white" : "text-slate-600"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {filtered.map((p) => (
          <div
            key={p.code}
            className={`card relative flex flex-col p-6 ${p.highlight ? "ring-2 ring-brand" : ""}`}
          >
            {p.highlight && (
              <span className="badge absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white">
                Le plus choisi
              </span>
            )}
            <h3 className="text-lg font-extrabold text-slate-900">{p.label}</h3>
            <div className="mt-2 text-3xl font-extrabold text-brand">
              {formatPrice(p.priceEur)}
              <span className="text-sm font-medium text-slate-400">
                {p.recurring ? " /mois" : p.durationDays ? ` / ${p.durationDays}j` : ""}
              </span>
            </div>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-600">
              {p.features.map((feat) => (
                <li key={feat} className="flex gap-2">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-brand" />
                  {feat}
                </li>
              ))}
            </ul>
            <button
              className={p.highlight ? "btn-primary mt-6" : "btn-outline mt-6"}
              disabled={checkout.isPending}
              onClick={() => subscribe(p.code)}
            >
              {tab === "particulier" ? "Choisir cette option" : "S'abonner"}
            </button>
          </div>
        ))}
      </div>
      {checkout.error && (
        <p className="mt-6 text-center text-sm text-red-600">{checkout.error.message}</p>
      )}
    </div>
  );
}
