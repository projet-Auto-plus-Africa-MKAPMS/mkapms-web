import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Euro } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   PAIEMENT DÉMARCHES (/demarches/paiement-demarches/:id)
   Données réelles : trpc.carteGrise.detail + payerDossier (server/routers/
   cartegrise.ts). montantTaxe/montantPrestation ne sont jamais calculés
   côté client : ils sont fixés par l'agence une fois le dossier chiffré.
   Tant qu'ils ne le sont pas, aucun montant n'est affiché ni inventé.
   ══════════════════════════════════════════════════════════════════════════ */

export default function PaiementDemarches() {
  const { id } = useParams();
  const dossierId = Number(id);
  const { data, isLoading } = trpc.carteGrise.detail.useQuery({ id: dossierId }, { enabled: Number.isFinite(dossierId) });
  const payer = trpc.carteGrise.payerDossier.useMutation({
    onSuccess: (r) => { if (r.url) window.location.href = r.url; },
  });

  if (!Number.isFinite(dossierId) || (!isLoading && !data)) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] p-4">
        <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">Dossier introuvable — revenez depuis « Démarches ».</p>
      </div>
    );
  }

  const dossier = data?.dossier;
  const taxe = dossier?.montantTaxe ? Number(dossier.montantTaxe) : 0;
  const prestation = dossier?.montantPrestation ? Number(dossier.montantPrestation) : 0;
  const total = taxe + prestation;
  const chiffre = total > 0;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Euro size={20} className="text-[#D4AF37]" /> Paiement</h1>
        {dossier && <p className="mt-1 text-sm text-white/60">Dossier {dossier.reference}</p>}
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        {!chiffre ? (
          <p className="text-sm text-[#6B7280] text-center py-2">
            Ce dossier n'a pas encore été chiffré par l'agence. Le montant à payer apparaîtra ici dès qu'il sera connu.
          </p>
        ) : (
          <>
            {taxe > 0 && <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Taxe</span><span className="font-bold">{taxe.toLocaleString("fr-FR")} €</span></div>}
            {prestation > 0 && <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Frais de service MKA.P-MS</span><span className="font-bold">{prestation.toLocaleString("fr-FR")} €</span></div>}
            <div className="flex justify-between pt-2 border-t-2 border-[#D4AF37] text-base"><span className="font-black">Total</span><span className="font-black text-[#D4AF37]">{total.toLocaleString("fr-FR")} €</span></div>
            {payer.error && <p className="text-xs text-red-600">{payer.error.message}</p>}
            <button
              onClick={() => payer.mutate({ dossierId })}
              disabled={payer.isPending}
              className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
            >
              {payer.isPending ? "Redirection…" : "Payer par carte"}
            </button>
            <p className="text-center text-[9px] text-[#6B7280]">Paiement sécurisé · Facture automatique · Archivage</p>
          </>
        )}
      </div>
    </div>
  );
}
