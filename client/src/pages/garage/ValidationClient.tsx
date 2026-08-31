/**
 * Validation d'un devis par le client — lignes réellement chiffrées par le
 * garage et total calculé côté serveur (TVA du pays via Country OS).
 *
 * L'écran affichait quatre lignes inventées et trois boutons qui n'écrivaient
 * rien : accepter un devis doit engager les deux parties. Les trois actions
 * passent par le Moteur de boutons et changent réellement l'état du devis.
 */
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, Check, X, FileText, Edit } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";
import { trpc } from "../../lib/trpc";

export default function ValidationClient() {
  const [params] = useSearchParams();
  const devisParUrl = Number(params.get("devis")) || null;
  const [devisId, setDevisId] = useState<number | null>(devisParUrl);
  const [message, setMessage] = useState("");

  const mes = trpc.devis.mine.useQuery(undefined, { retry: false });

  // Sans devis choisi, on ouvre le plus récent du client — jamais un exemple.
  useEffect(() => {
    if (devisId == null && mes.data && mes.data.length > 0) setDevisId(mes.data[0].id);
  }, [mes.data, devisId]);

  const detail = trpc.devis.detail.useQuery(
    { devisId: devisId ?? 0 },
    { enabled: devisId != null, retry: false },
  );

  const changer = trpc.devis.updateStatus.useMutation({
    onSuccess: () => {
      setMessage("Décision enregistrée : le garage la reçoit et votre suivi est mis à jour.");
      detail.refetch();
      mes.refetch();
    },
    onError: (e) => setMessage(e.message),
  });

  const lignes = detail.data?.lignes ?? [];
  const montant = detail.data?.montant;
  const devis = detail.data?.devis;

  function decider(status: "accepte" | "refuse") {
    if (devisId == null) return;
    if (status === "accepte" && !montant?.chiffrable) {
      setMessage(
        `Ce devis n'est pas encore chiffré (${montant?.manque ?? "aucune ligne du garage"}) : accepter un montant inconnu vous engagerait à l'aveugle.`,
      );
      return;
    }
    changer.mutate({
      devisId,
      status,
      detail:
        status === "accepte"
          ? "Devis accepté par le client depuis l'écran de validation."
          : "Devis refusé par le client depuis l'écran de validation.",
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Garage
        </Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <FileText size={20} className="text-[#D4AF37]" /> Validation devis
        </h1>
        {devis && (
          <p className="mt-1 text-sm text-white/60">
            DEV-{devis.id} · {devis.typeIntervention} · {devis.status}
          </p>
        )}
      </div>

      {(mes.data?.length ?? 0) > 1 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-3">
          <label className="text-[10px] text-[#6B7280]">Devis à valider</label>
          <select
            value={devisId ?? ""}
            onChange={(e) => setDevisId(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-2 py-2 text-sm"
          >
            {mes.data?.map((d) => (
              <option key={d.id} value={d.id}>
                DEV-{d.id} — {d.typeIntervention}
              </option>
            ))}
          </select>
        </div>
      )}

      {mes.isError && (
        <p className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800">
          Vos devis ne sont pas accessibles : {mes.error.message}
        </p>
      )}

      {!mes.isLoading && !mes.isError && (mes.data?.length ?? 0) === 0 && (
        <p className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 text-xs text-[#6B7280]">
          Vous n'avez aucun devis à valider. Aucun devis d'exemple n'est affiché ici.
        </p>
      )}

      {detail.data && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
          {lignes.length === 0 && (
            <p className="text-xs text-[#6B7280]">
              Le garage n'a pas encore chiffré ce devis : aucune ligne, donc aucun total à valider.
            </p>
          )}
          {lignes.map((l) => (
            <div key={l.id} className="flex justify-between py-2 border-b border-[#F3F4F6] text-sm">
              <span className="text-[#111]">
                {l.designation}
                <span className="ml-1 text-[10px] text-[#9CA3AF]">×{Number(l.quantite)}</span>
              </span>
              <span className="text-[#6B7280]">
                {(Number(l.quantite) * Number(l.prixUnitaireHt)).toLocaleString("fr-FR")} {montant?.devise}
              </span>
            </div>
          ))}

          {montant && lignes.length > 0 && (
            <>
              <div className="flex justify-between pt-2 text-sm">
                <span className="text-[#6B7280]">Total HT</span>
                <span className="font-bold">
                  {montant.totalHt.toLocaleString("fr-FR")} {montant.devise}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">TVA ({montant.tauxTva} %)</span>
                <span className="font-bold">
                  {montant.totalTva.toLocaleString("fr-FR")} {montant.devise}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-[#D4AF37] text-base">
                <span className="font-black text-[#111]">Total TTC</span>
                <span className="font-black text-[#D4AF37]">
                  {montant.totalTtc.toLocaleString("fr-FR")} {montant.devise}
                </span>
              </div>
              <p className="mt-2 text-[10px] text-[#6B7280]">
                Total calculé par le serveur à partir des lignes du garage et de la TVA du pays du devis.
              </p>
            </>
          )}
        </div>
      )}

      {message && (
        <p className="mx-4 mt-3 rounded-lg bg-white border border-[#E5E7EB] p-2 text-[11px] text-[#374151]">
          {message}
        </p>
      )}

      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        <BoutonMoteur
          code="garage_devis_accepter"
          className="rounded-xl bg-green-600 py-3 text-sm font-bold text-white text-center active:scale-[0.98]"
          onExecuter={() => decider("accepte")}
        >
          <Check size={14} className="inline" /> Accepter
        </BoutonMoteur>
        <BoutonMoteur
          code="garage_devis_modifier"
          className="rounded-xl bg-amber-500 py-3 text-sm font-bold text-white text-center active:scale-[0.98]"
          query={devisId != null ? { devis: String(devisId) } : undefined}
        >
          <Edit size={14} className="inline" /> Modifier
        </BoutonMoteur>
        <BoutonMoteur
          code="garage_devis_refuser"
          className="rounded-xl bg-red-500 py-3 text-sm font-bold text-white text-center active:scale-[0.98]"
          onExecuter={() => decider("refuse")}
        >
          <X size={14} className="inline" /> Refuser
        </BoutonMoteur>
      </div>
    </div>
  );
}
