import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Package, Euro, FileText, AlertTriangle, Loader2, MapPin } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { StepTracker } from "../../components/StepTracker";

/* ══════════════════════════════════════════════════════════════════════════
   DÉTAIL COMMANDE — Véhicule sur commande (vue client, section 9 demande PDG)
   7 étapes simplifiées, jamais le vocabulaire interne. Paiement acompte/
   solde via le Checkout Stripe unifié existant (createPaymentCheckout).
   ══════════════════════════════════════════════════════════════════════════ */

const ETAPES_CLIENT = [
  { key: "paiement_recu", label: "Paiement reçu" },
  { key: "vehicule_reserve", label: "Véhicule réservé" },
  { key: "vehicule_en_preparation", label: "Véhicule en préparation" },
  { key: "pret_inspection_livraison", label: "Prêt à être inspecté ou livré" },
  { key: "solde_valide", label: "Solde validé" },
  { key: "vehicule_remis_livre", label: "Véhicule remis ou livré" },
  { key: "documents_disponibles", label: "Documents finaux disponibles" },
];

const DOCUMENT_LABEL: Record<string, string> = {
  devis: "Devis", reservation: "Réservation", contrat: "Contrat", recu_acompte: "Reçu d'acompte",
  facture_finale: "Facture finale", facture_solde: "Facture de solde", pv_inspection: "PV d'inspection",
  pv_remise: "PV de remise", document_cession: "Document de cession", garantie: "Garantie", document_comptable: "Document comptable",
  controle_technique: "Contrôle technique", historique_entretien: "Historique d'entretien",
  facture_travaux_autorises: "Factures de travaux autorisées", rapport_batterie: "Rapport de batterie",
  certificat_conformite: "Certificat de conformité",
};

export default function CommandeDetailClient() {
  const { orderItemId } = useParams();
  const id = Number(orderItemId);
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.orderEngine.detailCommandeClient.useQuery({ orderItemId: id });

  const checkoutAcompte = trpc.orderEngine.creerCheckoutAcompte.useMutation({
    onSuccess: (r) => { window.location.href = r.url; },
  });
  const checkoutSolde = trpc.orderEngine.creerCheckoutSolde.useMutation({
    onSuccess: (r) => { window.location.href = r.url; },
  });

  if (isLoading) return <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center"><Loader2 className="animate-spin text-[#D4AF37]" /></div>;
  if (!data) return null;

  const exception = ["annulee", "litige_en_cours", "rembourse"].includes(data.statutClient);
  const currentIndex = ETAPES_CLIENT.findIndex((e) => e.key === data.statutClient);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-5">
        <Link to="/vehicule-sur-commande/mes-commandes" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mes commandes</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Package size={20} className="text-[#D4AF37]" /> {data.reference}</h1>
        {data.estimatedReadyAt && <p className="mt-1 text-xs text-white/50">Estimation de disponibilité : {new Date(data.estimatedReadyAt).toLocaleDateString("fr-FR")}</p>}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {exception ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              {data.statutClient === "annulee" && "Cette commande n'a pas abouti."}
              {data.statutClient === "litige_en_cours" && "Un litige est en cours de traitement sur cette commande."}
              {data.statutClient === "rembourse" && "Cette commande a été remboursée."}
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <StepTracker steps={ETAPES_CLIENT} currentIndex={currentIndex < 0 ? 0 : currentIndex} />
          </div>
        )}

        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Paiement</h2>
          {data.totalAmount && (
            <p className="text-sm text-[#111]">Montant total : <span className="font-bold">{Number(data.totalAmount).toLocaleString("fr-FR")} {data.currency}</span></p>
          )}
          {data.depositAmount && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#374151]">Acompte : {Number(data.depositAmount).toLocaleString("fr-FR")} {data.currency}</span>
              {data.depositPaid ? (
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700">Payé</span>
              ) : (
                <button
                  onClick={() => checkoutAcompte.mutate({ orderItemId: id, successPath: `/vehicule-sur-commande/mes-commandes/${id}?paid=1`, cancelPath: `/vehicule-sur-commande/mes-commandes/${id}` })}
                  disabled={checkoutAcompte.isPending}
                  className="flex items-center gap-1 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] disabled:opacity-50"
                >
                  <Euro size={12} /> Payer l'acompte
                </button>
              )}
            </div>
          )}
          {data.balanceAmount && data.depositPaid && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#374151]">Solde : {Number(data.balanceAmount).toLocaleString("fr-FR")} {data.currency}</span>
              {data.balancePaid ? (
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-700">Payé</span>
              ) : (
                <button
                  onClick={() => checkoutSolde.mutate({ orderItemId: id, successPath: `/vehicule-sur-commande/mes-commandes/${id}?paid=1`, cancelPath: `/vehicule-sur-commande/mes-commandes/${id}` })}
                  disabled={checkoutSolde.isPending}
                  className="flex items-center gap-1 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] disabled:opacity-50"
                >
                  <Euro size={12} /> Payer le solde
                </button>
              )}
            </div>
          )}
          {!data.totalAmount && <p className="text-xs text-[#9CA3AF]">Le prix est en cours de validation par notre équipe.</p>}
        </div>

        {data.exactPickupAddress && (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin size={12} className="text-[#D4AF37]" /> Adresse de remise</h2>
            <p className="text-sm text-[#374151]">{data.exactPickupAddress}</p>
          </div>
        )}

        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Documents</h2>
          {data.documents.length === 0 && <p className="text-xs text-[#9CA3AF]">Aucun document disponible pour l'instant.</p>}
          <div className="space-y-1.5">
            {data.documents.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-sm text-[#374151]">
                <FileText size={14} className="text-[#D4AF37]" /> {DOCUMENT_LABEL[d.documentType] ?? d.documentType}
                <span className="text-[10px] text-[#9CA3AF]">{new Date(d.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
