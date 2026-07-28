import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { Wallet, ArrowUpRight, ArrowDownLeft, Users, TrendingUp, CheckCircle2, XCircle, Clock, Search, RefreshCw } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  demande: "bg-amber-50 text-amber-700 border-amber-200",
  en_cours: "bg-blue-50 text-blue-700 border-blue-200",
  paye: "bg-green-50 text-green-700 border-green-200",
  echoue: "bg-red-50 text-red-700 border-red-200",
  annule: "bg-slate-50 text-slate-500 border-slate-200",
};
const STATUS_LABELS: Record<string, string> = {
  demande: "En attente", en_cours: "En cours", paye: "Payé", echoue: "Échoué", annule: "Annulé",
};

export default function WalletAdmin() {
  const allWallets = trpc.wallet.adminAllWallets.useQuery();
  const allPayouts = trpc.wallet.adminAllPayouts.useQuery({ status: undefined });
  const updateStatus = trpc.wallet.adminUpdatePayoutStatus.useMutation({ onSuccess: () => allPayouts.refetch() });
  const creditWallet = trpc.wallet.adminCreditWallet.useMutation({ onSuccess: () => allWallets.refetch() });

  const [view, setView] = useState<"wallets" | "virements" | "credit">("wallets");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("tous");
  const [creditForm, setCreditForm] = useState({ userId: "", montant: "", description: "" });

  const wallets = allWallets.data ?? [];
  const payouts = allPayouts.data ?? [];

  // Stats globales
  const totalDisponible = wallets.reduce((s, w) => s + Number(w.soldeDisponible ?? 0), 0);
  const totalAttente = wallets.reduce((s, w) => s + Number(w.soldeAttente ?? 0), 0);
  const totalVire = wallets.reduce((s, w) => s + Number(w.totalVire ?? 0), 0);
  const payoutsEnAttente = payouts.filter((p) => p.status === "demande").length;

  const filteredWallets = wallets.filter((w) =>
    !search || (w as any).userName?.toLowerCase().includes(search.toLowerCase()) || (w as any).userEmail?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPayouts = payouts.filter((p) =>
    (filterStatus === "tous" || p.status === filterStatus) &&
    (!search || (p as any).userName?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#111] flex items-center gap-2">
            <Wallet size={24} className="text-[#D4AF37]" /> Portefeuilles — Vue Comptabilité
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Contrôle global de tous les wallets utilisateurs</p>
        </div>
        <button onClick={() => { allWallets.refetch(); allPayouts.refetch(); }} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8960C] p-4 text-white">
          <p className="text-[10px] font-bold uppercase opacity-80">Total disponible</p>
          <p className="text-2xl font-black mt-1">{totalDisponible.toFixed(2)} €</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-[10px] font-bold uppercase text-slate-500">En attente</p>
          <p className="text-xl font-black text-slate-700 mt-1">{totalAttente.toFixed(2)} €</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-[10px] font-bold uppercase text-slate-500">Total viré</p>
          <p className="text-xl font-black text-slate-700 mt-1">{totalVire.toFixed(2)} €</p>
        </div>
        <div className={`rounded-2xl border p-4 ${payoutsEnAttente > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
          <p className="text-[10px] font-bold uppercase text-slate-500">Virements à traiter</p>
          <p className={`text-xl font-black mt-1 ${payoutsEnAttente > 0 ? "text-amber-700" : "text-slate-700"}`}>{payoutsEnAttente}</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "wallets", label: "Tous les wallets", icon: Users },
          { key: "virements", label: "Virements", icon: ArrowUpRight },
          { key: "credit", label: "Crédit manuel", icon: TrendingUp },
        ] as const).map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${view === v.key ? "bg-[#D4AF37] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            <v.icon size={14} /> {v.label}
          </button>
        ))}
      </div>

      {/* ── Barre de recherche ── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-8 w-full max-w-sm"
          placeholder="Rechercher un utilisateur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Vue Wallets ── */}
      {view === "wallets" && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 font-bold text-slate-600">Utilisateur</th>
                  <th className="text-right p-3 font-bold text-slate-600">Disponible</th>
                  <th className="text-right p-3 font-bold text-slate-600">En attente</th>
                  <th className="text-right p-3 font-bold text-slate-600">Bloqué</th>
                  <th className="text-right p-3 font-bold text-slate-600">Total viré</th>
                  <th className="text-center p-3 font-bold text-slate-600">Fréquence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWallets.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <p className="font-semibold text-slate-800">{(w as any).userName || "—"}</p>
                      <p className="text-[10px] text-slate-400">{(w as any).userEmail || ""}</p>
                    </td>
                    <td className="p-3 text-right font-black text-green-700">{Number(w.soldeDisponible ?? 0).toFixed(2)} €</td>
                    <td className="p-3 text-right text-amber-600">{Number(w.soldeAttente ?? 0).toFixed(2)} €</td>
                    <td className="p-3 text-right text-red-500">{Number(w.soldeBloque ?? 0).toFixed(2)} €</td>
                    <td className="p-3 text-right text-slate-600">{Number(w.totalVire ?? 0).toFixed(2)} €</td>
                    <td className="p-3 text-center">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{w.payoutFrequency || "manuel"}</span>
                    </td>
                  </tr>
                ))}
                {!filteredWallets.length && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">Aucun wallet trouvé</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Vue Virements ── */}
      {view === "virements" && (
        <div className="space-y-4">
          {/* Filtre statut */}
          <div className="flex gap-2 flex-wrap">
            {["tous", "demande", "en_cours", "paye", "echoue"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${filterStatus === s ? "bg-[#D4AF37] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {s === "tous" ? "Tous" : STATUS_LABELS[s] || s}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-3 font-bold text-slate-600">Utilisateur</th>
                    <th className="text-right p-3 font-bold text-slate-600">Montant</th>
                    <th className="text-center p-3 font-bold text-slate-600">Statut</th>
                    <th className="text-left p-3 font-bold text-slate-600">Date</th>
                    <th className="text-center p-3 font-bold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{(p as any).userName || "—"}</p>
                      </td>
                      <td className="p-3 text-right font-black text-slate-800">{Number(p.montant).toFixed(2)} €</td>
                      <td className="p-3 text-center">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_COLORS[p.status] || ""}`}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {p.status === "demande" && (
                            <>
                              <button
                                onClick={() => updateStatus.mutate({ id: p.id, status: "paye" })}
                                className="flex items-center gap-1 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1 text-[10px] font-bold text-green-700 hover:bg-green-100"
                              >
                                <CheckCircle2 size={11} /> Valider
                              </button>
                              <button
                                onClick={() => updateStatus.mutate({ id: p.id, status: "annule" })}
                                className="flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100"
                              >
                                <XCircle size={11} /> Annuler
                              </button>
                            </>
                          )}
                          {p.status === "en_cours" && (
                            <button
                              onClick={() => updateStatus.mutate({ id: p.id, status: "paye" })}
                              className="flex items-center gap-1 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1 text-[10px] font-bold text-green-700 hover:bg-green-100"
                            >
                              <CheckCircle2 size={11} /> Marquer payé
                            </button>
                          )}
                          {(p.status === "paye" || p.status === "annule") && (
                            <span className="text-[10px] text-slate-400 italic">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredPayouts.length && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">Aucun virement trouvé</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Vue Crédit manuel ── */}
      {view === "credit" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 max-w-md">
          <p className="text-sm font-bold text-[#111] mb-1">Crédit manuel d'un portefeuille</p>
          <p className="text-xs text-slate-500 mb-4">Ajoutez des fonds directement sur le wallet d'un utilisateur (remboursement, bonus, correction).</p>
          <div className="space-y-3">
            <div>
              <label className="label">ID utilisateur</label>
              <input className="input" value={creditForm.userId} onChange={(e) => setCreditForm((f) => ({ ...f, userId: e.target.value }))} placeholder="UUID de l'utilisateur" />
            </div>
            <div>
              <label className="label">Montant (€)</label>
              <input type="number" min="0.01" step="0.01" className="input" value={creditForm.montant} onChange={(e) => setCreditForm((f) => ({ ...f, montant: e.target.value }))} placeholder="50.00" />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input" value={creditForm.description} onChange={(e) => setCreditForm((f) => ({ ...f, description: e.target.value }))} placeholder="Remboursement, bonus…" />
            </div>
            <button
              onClick={() => {
                if (!creditForm.userId || !creditForm.montant) return;
                creditWallet.mutate({ userId: creditForm.userId, montant: parseFloat(creditForm.montant), description: creditForm.description });
                setCreditForm({ userId: "", montant: "", description: "" });
              }}
              disabled={creditWallet.isPending || !creditForm.userId || !creditForm.montant}
              className="btn-primary w-full"
            >
              {creditWallet.isPending ? "Envoi…" : "Créditer le wallet"}
            </button>
            {creditWallet.isSuccess && <p className="text-xs text-green-600 font-semibold text-center">Wallet crédité avec succès</p>}
            {creditWallet.isError && <p className="text-xs text-red-500 text-center">Erreur : {creditWallet.error?.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
