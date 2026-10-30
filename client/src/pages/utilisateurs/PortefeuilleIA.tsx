import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, Loader2, Wallet, Zap } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useCurrency } from "../../lib/currency";

/* ══════════════════════════════════════════════════════════════════════════
   PORTEFEUILLE IA (/utilisateurs/portefeuille-ia)
   Données réelles : trpc.iaCommerce.walletMine (table ia_credit_wallets /
   ia_credit_ledger) + trpc.iaCommerce.catalog filtré sur les packs de
   recharge (meta.kind === "credits"). Jamais un second solde inventé ici.
   Le débit automatique à chaque appel IA réel n'est pas encore branché sur
   le routeur de production (étape suivante, volontairement séparée) :
   ce portefeuille reflète aujourd'hui les achats/essais/ajustements réels,
   pas encore une consommation IA mesurée en direct.
   ══════════════════════════════════════════════════════════════════════════ */

const TYPE_LABEL: Record<string, { label: string; credit: boolean }> = {
  achat: { label: "Achat de crédits", credit: true },
  abonnement: { label: "Crédit d'abonnement", credit: true },
  bonus_essai: { label: "Essai gratuit", credit: true },
  consommation: { label: "Consommation IA", credit: false },
  ajustement_pdg: { label: "Ajustement Direction", credit: true },
};

function libelleType(type: string, unites: number) {
  const base = TYPE_LABEL[type];
  if (base) return base.label;
  return unites >= 0 ? "Crédit" : "Débit";
}

export default function PortefeuilleIA() {
  const { format } = useCurrency();
  const wallet = trpc.iaCommerce.walletMine.useQuery();
  const catalog = trpc.iaCommerce.catalog.useQuery();

  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  const checkout = trpc.iaCommerce.checkoutAbonnement.useMutation({
    onSuccess: (r) => {
      if (r.url) window.location.href = r.url;
    },
    onError: (err) => {
      setCheckoutErr(err.message || "Impossible de démarrer la recharge pour le moment.");
      setPendingCode(null);
    },
  });

  function recharger(code: string) {
    setCheckoutErr(null);
    setPendingCode(code);
    checkout.mutate({ code });
  }

  const solde = wallet.data?.balance ?? 0;
  const ledger = wallet.data?.ledger ?? [];
  const packs = (catalog.data ?? []).filter((p) => p.meta?.kind === "credits");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="mb-2 flex items-center gap-1 text-sm text-white/60"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="flex items-center gap-2 text-xl font-black text-white">
          <Wallet size={20} className="text-[#D4AF37]" /> Portefeuille IA
        </h1>
        <p className="mt-1 text-sm text-white/60">Vos unités AL-HOUDOUD·M</p>
      </div>

      <div className="mx-4 mt-4 rounded-xl border border-[#D4AF37]/40 bg-[#FFFDF5] p-3 text-[11px] text-[#7A5B00]">
        Vos crédits n'expirent jamais et votre travail est conservé même à solde épuisé — seules les nouvelles actions IA sont mises en pause jusqu'à la recharge.
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-5 text-center">
        {wallet.isLoading ? (
          <Loader2 className="mx-auto animate-spin text-[#D4AF37]" size={24} />
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">Solde actuel</p>
            <p className="mt-1 text-4xl font-black text-[#111]">
              {solde.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-semibold text-[#6B7280]">unités AL-HOUDOUD·M</p>
          </>
        )}
        {wallet.error && <p className="mt-2 text-xs text-red-600">{wallet.error.message}</p>}
      </div>

      {checkoutErr && (
        <div className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <span>{checkoutErr}</span>
          <button onClick={() => setCheckoutErr(null)} aria-label="Fermer" className="shrink-0 text-red-500">✕</button>
        </div>
      )}

      <div className="mx-4 mt-6">
        <h2 className="text-xs font-black uppercase tracking-wide text-[#6B7280]">Recharger mon solde</h2>
        {catalog.isLoading && <p className="mt-2 text-xs text-[#6B7280]">Chargement…</p>}
        {!catalog.isLoading && packs.length === 0 && (
          <p className="mt-2 text-xs text-[#6B7280]">Aucun pack de recharge n'est encore activé par la Direction.</p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((p) => (
            <div key={p.code} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                  <Zap size={16} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111]">{format(p.price)}</p>
                  <p className="text-[10px] text-[#6B7280]">{p.meta?.creditsInclus ?? 0} unités créditées</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => recharger(p.code)}
                disabled={checkout.isPending && pendingCode === p.code}
                className="mt-3 w-full rounded-lg bg-[#111] py-2 text-xs font-bold text-white transition hover:bg-[#222] disabled:opacity-70"
              >
                {checkout.isPending && pendingCode === p.code ? "Redirection…" : "Recharger"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-6">
        <h2 className="text-xs font-black uppercase tracking-wide text-[#6B7280]">Historique</h2>
        <div className="mt-2 space-y-2">
          {ledger.map((l) => {
            const unites = Number(l.unites);
            const soldeApres = Number(l.soldeApres);
            const positif = unites >= 0;
            const Icon = positif ? ArrowUpRight : ArrowDownRight;
            return (
              <div key={l.id} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${positif ? "bg-green-50" : "bg-red-50"}`}>
                  <Icon size={16} className={positif ? "text-green-600" : "text-red-600"} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#111]">{libelleType(l.type, unites)}</p>
                  <p className="text-[10px] text-[#6B7280]">{new Date(l.createdAt).toLocaleDateString("fr-FR")} {l.note ? `· ${l.note}` : ""}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-black ${positif ? "text-green-600" : "text-red-600"}`}>
                    {positif ? "+" : ""}{unites.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">solde : {soldeApres.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            );
          })}
        </div>

        {!wallet.isLoading && ledger.length === 0 && (
          <div className="mt-6 text-center">
            <Wallet size={28} className="mx-auto text-[#D4AF37]" />
            <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun mouvement pour le moment.</p>
            <Link to="/ia/abonnements" className="mt-2 inline-block text-xs font-bold text-[#D4AF37] underline">Voir les offres AL-HOUDOUD·M</Link>
          </div>
        )}
      </div>
    </div>
  );
}
