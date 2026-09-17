/**
 * Investissement — Vue PDG / Comptabilité (server/investment/, adminProcedure).
 *
 * Le moteur complet (contrats, cycle de vie 12 statuts, versements) existait
 * déjà côté serveur, testé, mais sans aucun écran d'administration : la
 * direction ne pouvait ni voir la liste des investisseurs, ni créer un
 * contrat, ni suivre un versement autrement qu'en base directement.
 *
 * ACTIVE n'est jamais atteint sur la confiance de cet écran : le serveur
 * exige un document contractuel réellement signé (document_signatures) et
 * un paiement réellement confirmé (payments.status="paid") avant d'activer
 * quoi que ce soit — cet écran ne fait qu'exposer ce vrai contrôle, jamais
 * une activation en un clic sans preuve.
 */
import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { Landmark, Users, FileText, Wallet, RefreshCw, Plus, ShieldCheck, AlertTriangle } from "lucide-react";

const INVESTOR_TYPE_LABELS: Record<string, string> = {
  PASSIVE_INVESTOR: "Investisseur passif",
  OPERATOR_INVESTOR: "Investisseur opérateur",
  STRATEGIC_PARTNER: "Partenaire stratégique",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-50 text-slate-600 border-slate-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  AWAITING_SIGNATURE: "bg-blue-50 text-blue-700 border-blue-200",
  AWAITING_PAYMENT: "bg-amber-50 text-amber-700 border-amber-200",
  ACTIVATING: "bg-amber-50 text-amber-700 border-amber-200",
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  SUSPENDED: "bg-red-50 text-red-700 border-red-200",
  EXPIRING: "bg-amber-50 text-amber-700 border-amber-200",
  EXPIRED: "bg-slate-50 text-slate-500 border-slate-200",
  TERMINATED: "bg-slate-50 text-slate-500 border-slate-200",
  CANCELLED: "bg-slate-50 text-slate-500 border-slate-200",
};

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  en_attente: "En attente", paye: "Payé", echoue: "Échoué", litige: "Litige", annule: "Annulé",
};

export default function InvestissementAdmin() {
  const [view, setView] = useState<"investisseurs" | "investissements" | "nouveau">("investisseurs");
  const [investorIdFiltre, setInvestorIdFiltre] = useState<number | null>(null);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<number | null>(null);

  const investisseurs = trpc.investment.investisseurs.useQuery();
  const investissements = trpc.investment.investissements.useQuery(
    investorIdFiltre ? { investorId: investorIdFiltre } : undefined,
  );
  const univers = trpc.investment.universUnivestissables.useQuery();

  const historique = trpc.investment.historiqueStatuts.useQuery(
    { investmentId: selectedInvestmentId! },
    { enabled: !!selectedInvestmentId },
  );
  const versements = trpc.investment.versementsDe.useQuery(
    { investmentId: selectedInvestmentId! },
    { enabled: !!selectedInvestmentId },
  );

  const transitionner = trpc.investment.transitionner.useMutation({
    onSuccess: () => { investissements.refetch(); historique.refetch(); },
  });
  const activer = trpc.investment.activer.useMutation({
    onSuccess: () => { investissements.refetch(); historique.refetch(); },
  });
  const confirmerVersement = trpc.investment.confirmerVersement.useMutation({ onSuccess: () => versements.refetch() });
  const marquerEchec = trpc.investment.marquerEchecVersement.useMutation({ onSuccess: () => versements.refetch() });
  const reessayer = trpc.investment.reessayerVersement.useMutation({ onSuccess: () => versements.refetch() });
  const ouvrirLitige = trpc.investment.ouvrirLitigeVersement.useMutation({ onSuccess: () => versements.refetch() });

  // ── Formulaire « Nouveau contrat » ──
  const [form, setForm] = useState({
    investorId: "", universeId: "", countryCode: "FR", startAt: "", endAt: "",
    pricingModel: "fixed_price" as "fixed_price" | "revenue_share" | "hybrid",
    fixedPrice: "", revenueShare: "", currency: "EUR", payoutSchedule: "mensuel" as "hebdomadaire" | "mensuel" | "autre",
  });
  const conflit = trpc.investment.verifierConflit.useQuery(
    {
      countryCode: form.countryCode,
      universeId: form.universeId,
      startAt: form.startAt ? new Date(form.startAt) : new Date(),
      endAt: form.endAt ? new Date(form.endAt) : null,
    },
    { enabled: !!form.universeId && !!form.countryCode },
  );
  const creerBrouillon = trpc.investment.creerBrouillon.useMutation({
    onSuccess: () => { investissements.refetch(); setView("investissements"); },
  });

  const investissementSelectionne = (investissements.data ?? []).find((i) => i.id === selectedInvestmentId) ?? null;
  const nbActifs = (investissements.data ?? []).filter((i) => i.status === "ACTIVE").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#111] flex items-center gap-2">
            <Landmark size={24} className="text-[#D4AF37]" /> Investissement — Vue Comptabilité
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Droit économique temporaire par univers, pays et durée — contrats et versements réels</p>
        </div>
        <button
          onClick={() => { investisseurs.refetch(); investissements.refetch(); }}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><Users size={12} /> Investisseurs</p>
          <p className="text-2xl font-black text-[#111] mt-1">{investisseurs.data?.length ?? "…"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><FileText size={12} /> Contrats actifs</p>
          <p className="text-2xl font-black text-green-600 mt-1">{nbActifs}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><FileText size={12} /> Contrats au total</p>
          <p className="text-2xl font-black text-[#111] mt-1">{investissements.data?.length ?? "…"}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {([
          { key: "investisseurs", label: "Investisseurs" },
          { key: "investissements", label: "Contrats" },
          { key: "nouveau", label: "+ Nouveau contrat" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px ${view === t.key ? "border-[#D4AF37] text-[#111]" : "border-transparent text-slate-400"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "investisseurs" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
              <tr><th className="p-3">Investisseur</th><th className="p-3">Type</th><th className="p-3">Depuis</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {investisseurs.isLoading && <tr><td colSpan={4} className="p-4 text-center text-slate-400">Chargement…</td></tr>}
              {investisseurs.data?.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">Aucun investisseur pour le moment.</td></tr>}
              {investisseurs.data?.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <p className="font-bold text-[#111]">{inv.utilisateur?.name ?? `Utilisateur #${inv.userId}`}</p>
                    <p className="text-xs text-slate-400">{inv.utilisateur?.email ?? ""}</p>
                  </td>
                  <td className="p-3">{INVESTOR_TYPE_LABELS[inv.investorType] ?? inv.investorType}</td>
                  <td className="p-3 text-slate-500">{new Date(inv.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3">
                    <button
                      onClick={() => { setInvestorIdFiltre(inv.id); setView("investissements"); }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Voir ses contrats
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "investissements" && (
        <div className="space-y-4">
          {investorIdFiltre && (
            <button onClick={() => setInvestorIdFiltre(null)} className="text-xs font-bold text-[#D4AF37]">
              ← Voir tous les contrats
            </button>
          )}
          <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
                <tr><th className="p-3">#</th><th className="p-3">Univers</th><th className="p-3">Pays</th><th className="p-3">Statut</th><th className="p-3">Modèle</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {investissements.isLoading && <tr><td colSpan={6} className="p-4 text-center text-slate-400">Chargement…</td></tr>}
                {investissements.data?.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-slate-400">Aucun contrat pour le moment.</td></tr>}
                {investissements.data?.map((i) => (
                  <tr key={i.id} className={`border-t border-slate-100 cursor-pointer ${selectedInvestmentId === i.id ? "bg-[#FFFDF5]" : ""}`} onClick={() => setSelectedInvestmentId(i.id)}>
                    <td className="p-3 font-bold">#{i.id}</td>
                    <td className="p-3">{i.universeId}</td>
                    <td className="p-3">{i.countryCode}</td>
                    <td className="p-3"><span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_COLORS[i.status]}`}>{i.status}</span></td>
                    <td className="p-3 text-slate-500">{i.pricingModel === "fixed_price" ? `${i.fixedPrice} ${i.currency}` : i.pricingModel === "revenue_share" ? `${Number(i.revenueShare) * 100}% du revenu` : "Hybride"}</td>
                    <td className="p-3"><span className="text-xs font-bold text-[#D4AF37]">Détail →</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {investissementSelectionne && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-[#111]">Contrat #{investissementSelectionne.id} — {investissementSelectionne.universeId} / {investissementSelectionne.countryCode}</h2>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_COLORS[investissementSelectionne.status]}`}>{investissementSelectionne.status}</span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-2">Historique des statuts</h3>
                <ul className="space-y-1 text-sm">
                  {(historique.data ?? []).map((h) => (
                    <li key={h.id} className="text-slate-600">
                      {h.fromStatus ?? "—"} → <strong>{h.toStatus}</strong> · {h.motif} · {new Date(h.changedAt).toLocaleString("fr-FR")}
                    </li>
                  ))}
                  {historique.data?.length === 0 && <li className="text-slate-400">Aucun historique.</li>}
                </ul>
              </div>

              <TransitionActions
                investment={investissementSelectionne}
                onTransition={(vers, motif) => transitionner.mutate({ investmentId: investissementSelectionne.id, vers, motif })}
                onActiver={(paymentId) => activer.mutate({ investmentId: investissementSelectionne.id, paymentId })}
                pending={transitionner.isPending || activer.isPending}
                error={transitionner.error?.message || activer.error?.message}
              />

              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Wallet size={12} /> Versements</h3>
                <ul className="space-y-2">
                  {(versements.data ?? []).map((v) => (
                    <li key={v.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2 text-sm">
                      <div>
                        <p className="font-bold">{v.montantNet} {v.devise} <span className="text-xs font-normal text-slate-400">({PAYOUT_STATUS_LABELS[v.statut]})</span></p>
                        <p className="text-xs text-slate-400">{new Date(v.periodeDebut).toLocaleDateString("fr-FR")} → {new Date(v.periodeFin).toLocaleDateString("fr-FR")} · prévu {new Date(v.datePrevue).toLocaleDateString("fr-FR")}</p>
                      </div>
                      {v.statut === "en_attente" && (
                        <div className="flex gap-1">
                          <button onClick={() => { const ref = prompt("Référence du virement réel :"); if (ref) confirmerVersement.mutate({ payoutId: v.id, reference: ref }); }} className="rounded-lg bg-green-50 px-2 py-1 text-xs font-bold text-green-700">Confirmer</button>
                          <button onClick={() => { const motif = prompt("Motif de l'échec :"); if (motif) marquerEchec.mutate({ payoutId: v.id, motifEchec: motif }); }} className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-700">Échec</button>
                        </div>
                      )}
                      {v.statut === "echoue" && (
                        <div className="flex gap-1">
                          <button onClick={() => reessayer.mutate({ payoutId: v.id })} className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">Réessayer</button>
                          <button onClick={() => { const motif = prompt("Motif du litige :"); if (motif) ouvrirLitige.mutate({ payoutId: v.id, motif }); }} className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">Litige</button>
                        </div>
                      )}
                    </li>
                  ))}
                  {versements.data?.length === 0 && <li className="text-sm text-slate-400">Aucun versement pour ce contrat.</li>}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {view === "nouveau" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 max-w-xl">
          <h2 className="font-black text-[#111] flex items-center gap-2"><Plus size={16} /> Nouveau contrat (brouillon)</h2>
          <label className="block text-xs font-bold text-slate-500">Investisseur</label>
          <select value={form.investorId} onChange={(e) => setForm({ ...form, investorId: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Choisir…</option>
            {investisseurs.data?.map((i) => (
              <option key={i.id} value={i.id}>{i.utilisateur?.name ?? `Utilisateur #${i.userId}`} — {INVESTOR_TYPE_LABELS[i.investorType]}</option>
            ))}
          </select>

          <label className="block text-xs font-bold text-slate-500">Univers investissable</label>
          <select value={form.universeId} onChange={(e) => setForm({ ...form, universeId: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Choisir…</option>
            {univers.data?.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500">Pays (code ISO2)</label>
              <input value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value.toUpperCase() })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" maxLength={2} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500">Devise</label>
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" maxLength={3} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500">Début</label>
              <input type="date" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500">Fin (optionnel)</label>
              <input type="date" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-500">Modèle financier</label>
          <select value={form.pricingModel} onChange={(e) => setForm({ ...form, pricingModel: e.target.value as typeof form.pricingModel })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="fixed_price">Prix fixe</option>
            <option value="revenue_share">Partage de revenu</option>
            <option value="hybrid">Hybride</option>
          </select>
          {form.pricingModel !== "revenue_share" && (
            <div>
              <label className="block text-xs font-bold text-slate-500">Prix fixe</label>
              <input type="number" value={form.fixedPrice} onChange={(e) => setForm({ ...form, fixedPrice: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          )}
          {form.pricingModel !== "fixed_price" && (
            <div>
              <label className="block text-xs font-bold text-slate-500">Part de revenu (ex. 0.03 = 3%)</label>
              <input type="number" step="0.0001" value={form.revenueShare} onChange={(e) => setForm({ ...form, revenueShare: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          )}

          {form.universeId && form.countryCode && conflit.data?.conflit && (
            <p className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> {conflit.data.motif}</p>
          )}
          {form.universeId && form.countryCode && conflit.data && !conflit.data.conflit && (
            <p className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 p-2 text-xs text-green-700"><ShieldCheck size={14} className="mt-0.5 shrink-0" /> {conflit.data.motif}</p>
          )}

          {creerBrouillon.error && <p className="text-xs text-red-600">{creerBrouillon.error.message}</p>}

          <button
            disabled={!form.investorId || !form.universeId || !form.countryCode || conflit.data?.conflit || creerBrouillon.isPending}
            onClick={() =>
              creerBrouillon.mutate({
                investorId: Number(form.investorId),
                universeId: form.universeId as never,
                countryCode: form.countryCode,
                startAt: form.startAt ? new Date(form.startAt) : undefined,
                endAt: form.endAt ? new Date(form.endAt) : undefined,
                pricingModel: form.pricingModel,
                fixedPrice: form.fixedPrice ? Number(form.fixedPrice) : undefined,
                revenueShare: form.revenueShare ? Number(form.revenueShare) : undefined,
                currency: form.currency,
                payoutSchedule: form.payoutSchedule,
              })
            }
            className="w-full rounded-xl bg-[#111] px-4 py-3 text-sm font-black text-[#D4AF37] disabled:opacity-40"
          >
            {creerBrouillon.isPending ? "Création…" : "Créer le brouillon"}
          </button>
        </div>
      )}
    </div>
  );
}

type StatutInvestissement =
  | "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "AWAITING_SIGNATURE" | "AWAITING_PAYMENT"
  | "ACTIVATING" | "ACTIVE" | "SUSPENDED" | "EXPIRING" | "EXPIRED" | "TERMINATED" | "CANCELLED";

interface Investissement {
  id: number;
  universeId: string;
  countryCode: string;
  status: StatutInvestissement;
  pricingModel: "fixed_price" | "revenue_share" | "hybrid";
  fixedPrice: string | null;
  revenueShare: string | null;
  currency: string;
}

/**
 * Cibles réellement acceptées par investment.transitionner (z.enum côté
 * serveur) — intersection avec le graphe complet de contrat.ts. Certaines
 * transitions valides côté moteur (retour DRAFT, ACTIVATING interne à
 * activer(), EXPIRING/EXPIRED, réactivation depuis SUSPENDED) ne sont pas
 * exposées par ce endpoint admin ; jamais un bouton qui serait rejeté par le
 * serveur.
 */
type TransitionCible = "UNDER_REVIEW" | "APPROVED" | "AWAITING_SIGNATURE" | "AWAITING_PAYMENT" | "CANCELLED" | "SUSPENDED" | "TERMINATED";

const TRANSITIONS_AFFICHEES: Partial<Record<StatutInvestissement, TransitionCible[]>> = {
  DRAFT: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "CANCELLED"],
  APPROVED: ["AWAITING_SIGNATURE", "CANCELLED"],
  AWAITING_SIGNATURE: ["AWAITING_PAYMENT", "CANCELLED"],
  AWAITING_PAYMENT: ["CANCELLED"],
  ACTIVE: ["SUSPENDED", "TERMINATED"],
  SUSPENDED: ["TERMINATED"],
  EXPIRING: ["TERMINATED"],
};

function TransitionActions({
  investment, onTransition, onActiver, pending, error,
}: {
  investment: Investissement;
  onTransition: (vers: TransitionCible, motif: string) => void;
  onActiver: (paymentId: number) => void;
  pending: boolean;
  error?: string;
}) {
  const cibles = TRANSITIONS_AFFICHEES[investment.status] ?? [];
  return (
    <div>
      <h3 className="text-xs font-bold text-slate-500 mb-2">Actions</h3>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {cibles.map((vers) => (
          <button
            key={vers}
            disabled={pending}
            onClick={() => {
              const motif = prompt(`Motif de la transition vers ${vers} :`);
              if (motif) onTransition(vers, motif);
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            → {vers}
          </button>
        ))}
        {investment.status === "AWAITING_PAYMENT" && (
          <button
            disabled={pending}
            onClick={() => {
              const paymentId = prompt("ID du paiement confirmé (payments.id, status=\"paid\") :");
              if (paymentId) onActiver(Number(paymentId));
            }}
            className="rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-bold text-green-700 disabled:opacity-40"
          >
            Activer (exige document signé + paiement confirmé)
          </button>
        )}
      </div>
    </div>
  );
}
