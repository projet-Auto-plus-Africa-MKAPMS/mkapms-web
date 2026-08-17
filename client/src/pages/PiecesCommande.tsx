import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, CreditCard, Package, CheckCircle2, AlertTriangle } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import MoyensPaiement from "../components/MoyensPaiement";

const STATUS_LABELS: Record<string, string> = {
  panier: "En attente de paiement",
  confirme: "Payée — confirmée",
  preparation: "En préparation",
  expedie: "Expédiée",
  livre: "Livrée",
  termine: "Terminée",
  annule: "Annulée",
};

/**
 * Fiche d'une commande de pièces et écran de paiement associé.
 *
 * C'est la destination du bouton « Commander et payer » : l'acheteur y voit ce
 * qu'il paie, les moyens acceptés, puis part sur la page carte du prestataire.
 * Une commande non payée reste ici accessible tant qu'elle n'est pas réglée.
 */
export default function PiecesCommande() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [erreur, setErreur] = useState<string | null>(null);

  const detail = trpc.pieces.order.useQuery({ orderId }, { enabled: Number.isFinite(orderId) && !!user });
  const payOrder = trpc.pieces.payOrder.useMutation();

  const payer = async () => {
    setErreur(null);
    try {
      const res = await payOrder.mutateAsync({ orderId });
      if (res.url.startsWith("http")) window.location.href = res.url;
      else navigate(res.url);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Paiement indisponible pour le moment.");
    }
  };

  if (!user) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-slate-600">Connectez-vous pour voir votre commande.</p>
        <button onClick={() => navigate(`/connexion?next=/pieces/commande/${orderId}`)} className="btn-acheter mt-4">
          Se connecter
        </button>
      </div>
    );
  }

  const d = detail.data;
  const order = d?.order;
  const reglementAttendu = d?.awaitingPayment ?? false;
  const totalTtc = Number(order?.totalTtc ?? 0);
  const devise = "EUR";

  return (
    <div className="container-page py-8">
      <button onClick={() => navigate("/pieces")} className="flex items-center gap-1 text-sm text-slate-500">
        <ChevronLeft size={14} /> Pièces auto
      </button>

      {detail.isLoading && <p className="mt-8 text-center text-sm text-slate-400">Chargement…</p>}
      {detail.isError && <p className="mt-8 text-center text-sm text-danger">Commande introuvable.</p>}

      {order && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-lg font-black text-noir">Commande {order.reference}</h1>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {new Date(order.createdAt).toLocaleString("fr-FR")}
                    {d?.shop ? ` · ${d.shop.nom}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {d?.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
                    <span className="text-slate-700">
                      {it.nom ?? `Pièce #${it.catalogId}`} <span className="text-slate-400">× {it.quantite}</span>
                    </span>
                    <span className="font-semibold text-noir">
                      {Number(it.totalHt ?? 0).toLocaleString("fr-FR")} €
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t-2 border-gold-soft pt-3">
                <span className="font-black text-noir">Total TTC</span>
                <span className="text-lg font-black text-gold-dark">{totalTtc.toLocaleString("fr-FR")} €</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {order.modeRetrait === "retrait"
                  ? "Retrait en magasin"
                  : `Livraison${order.livraisonType ? ` — ${order.livraisonType}` : ""}${order.livraisonTarif ? ` (${Number(order.livraisonTarif).toFixed(2)} €)` : ""}`}
              </p>
            </div>

            {d && d.tracking.length > 0 && (
              <div className="card p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-noir">
                  <Package size={16} className="text-gold-dark" /> Suivi
                </p>
                <div className="mt-3 space-y-2">
                  {d.tracking.map((t) => (
                    <div key={t.id} className="text-xs">
                      <span className="font-semibold text-slate-700">{t.label}</span>
                      <span className="text-slate-400"> · {new Date(t.createdAt).toLocaleString("fr-FR")}</span>
                      {t.detail && <p className="text-slate-500">{t.detail}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {params.get("paid") === "1" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={16} /> Retour du prestataire de paiement
                </p>
                <p className="mt-1 text-xs">
                  La confirmation définitive est celle du prestataire : le statut ci-dessus passe à
                  « Payée — confirmée » dès que l'encaissement est confirmé.
                </p>
              </div>
            )}
            {params.get("canceled") === "1" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={16} /> Paiement annulé
                </p>
                <p className="mt-1 text-xs">Votre commande est conservée : vous pouvez régler quand vous voulez.</p>
              </div>
            )}

            <MoyensPaiement countryCode={d?.shop?.countryCode ?? "FR"} currency={devise} service="pieces" />

            {reglementAttendu ? (
              <>
                <button onClick={payer} disabled={payOrder.isPending} className="btn-acheter w-full disabled:opacity-50">
                  <CreditCard size={16} className="mr-1.5 inline" />
                  {payOrder.isPending ? "Ouverture du paiement…" : `Payer ${totalTtc.toLocaleString("fr-FR")} €`}
                </button>
                {erreur && <p className="text-xs font-semibold text-danger">{erreur}</p>}
              </>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                Aucun règlement n'est attendu sur cette commande.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
