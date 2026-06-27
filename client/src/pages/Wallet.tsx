import { useState } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import { useAuth } from "../lib/auth";
import { trpc } from "../lib/trpc";

export default function Wallet() {
  const { user } = useAuth();
  const me = trpc.wallet.me.useQuery(undefined, { enabled: !!user });
  const tx = trpc.wallet.transactions.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();
  const payout = trpc.wallet.requestPayout.useMutation({
    onSuccess: () => {
      utils.wallet.me.invalidate();
      utils.wallet.transactions.invalidate();
    },
  });
  const [montant, setMontant] = useState(0);

  if (!user) {
    return <div className="container-page py-16 text-center text-slate-500">Connectez-vous pour accéder à votre wallet professionnel.</div>;
  }

  return (
    <div className="container-page py-8">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
        <WalletIcon className="text-gold-dark" /> Wallet professionnel
      </h1>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Solde disponible</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600">{Number(me.data?.soldeDisponible || 0).toLocaleString("fr-FR")} {me.data?.currency || "EUR"}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">En attente</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-600">{Number(me.data?.soldeAttente || 0).toLocaleString("fr-FR")} {me.data?.currency || "EUR"}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Bloqué (litige)</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-400">{Number(me.data?.soldeBloque || 0).toLocaleString("fr-FR")} {me.data?.currency || "EUR"}</p>
        </div>
      </div>

      <div className="card mt-6 max-w-md p-5">
        <h2 className="font-bold text-slate-800">Demander un retrait</h2>
        <input type="number" className="input mt-3" value={montant} onChange={(e) => setMontant(Number(e.target.value))} />
        <button className="btn-primary mt-3 w-full" disabled={montant <= 0 || payout.isPending} onClick={() => payout.mutate({ montant })}>
          {payout.isPending ? "Envoi…" : "Demander le retrait"}
        </button>
        {payout.error && <p className="mt-2 text-sm text-red-600">{payout.error.message}</p>}
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-800">Historique</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr><th className="p-3">Type</th><th className="p-3">Montant</th><th className="p-3">Description</th></tr>
          </thead>
          <tbody>
            {tx.data?.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="p-3">{t.type}</td>
                <td className="p-3">{Number(t.montant).toLocaleString("fr-FR")} {t.currency}</td>
                <td className="p-3 text-slate-500">{t.description}</td>
              </tr>
            ))}
            {tx.data && tx.data.length === 0 && (
              <tr><td colSpan={3} className="p-6 text-center text-slate-400">Aucune transaction.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
