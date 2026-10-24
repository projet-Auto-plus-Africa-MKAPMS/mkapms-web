import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ClipboardList, FileText, Loader2, CheckCircle, RotateCcw, Archive, Euro } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { StepTracker } from "../../components/StepTracker";

/* ══════════════════════════════════════════════════════════════════════════
   DÉTAIL COMMANDE — Véhicule sur commande (vue employé, sections 7, 8, 10, 11
   demande PDG). Suivi interne en 10 étapes + 3 décisions finales + prix/marge
   confidentiel + génération réelle des documents. Aucune validation ne
   dépend d'une IA — toutes les actions ici sont humaines ou par règles.
   ══════════════════════════════════════════════════════════════════════════ */

const ETAPES_INTERNES = [
  { key: "vehicule_selectionne", label: "Véhicule sélectionné chez le fournisseur" },
  { key: "disponibilite_confirmee", label: "Disponibilité confirmée" },
  { key: "documents_controles", label: "Documents contrôlés" },
  { key: "prix_marge_valides", label: "Prix et marge validés" },
  { key: "commande_fournisseur_creee", label: "Commande fournisseur créée" },
  { key: "vehicule_en_preparation", label: "Véhicule en préparation" },
  { key: "transport_organise", label: "Transport organisé" },
  { key: "inspection_realisee", label: "Inspection réalisée" },
  { key: "pret_visite_livraison", label: "Prêt pour visite ou livraison" },
  { key: "decision_finale", label: "Décision finale" },
];

const NEXT_SIMPLE: Record<string, string> = {
  vehicule_selectionne: "disponibilite_confirmee",
  disponibilite_confirmee: "documents_controles",
  prix_marge_valides: "commande_fournisseur_creee",
  commande_fournisseur_creee: "vehicule_en_preparation",
  vehicule_en_preparation: "transport_organise",
  transport_organise: "inspection_realisee",
  inspection_realisee: "pret_visite_livraison",
};

const DOCUMENT_TYPES: { key: string; label: string; genere: boolean }[] = [
  { key: "devis", label: "Devis", genere: true },
  { key: "reservation", label: "Réservation", genere: true },
  { key: "bon_commande", label: "Bon de commande", genere: true },
  { key: "contrat", label: "Contrat", genere: true },
  { key: "recu_acompte", label: "Reçu d'acompte", genere: true },
  { key: "facture_finale", label: "Facture finale", genere: true },
  { key: "facture_solde", label: "Facture de solde", genere: true },
  { key: "pv_inspection", label: "PV d'inspection", genere: true },
  { key: "pv_remise", label: "PV de remise", genere: true },
  { key: "ordre_mission_transporteur", label: "Ordre de mission transporteur", genere: true },
  { key: "dossier_retour", label: "Dossier de retour", genere: true },
  { key: "garantie", label: "Garantie", genere: true },
  { key: "document_cession", label: "Document de cession", genere: false },
  { key: "document_comptable", label: "Document comptable", genere: false },
  // Documents reçus du fournisseur, propres au véhicule (demande PDG) —
  // jamais générés par la plateforme, toujours rattachés une fois reçus.
  { key: "controle_technique", label: "Contrôle technique", genere: false },
  { key: "historique_entretien", label: "Historique d'entretien", genere: false },
  { key: "facture_travaux_autorises", label: "Factures de travaux autorisées", genere: false },
  { key: "rapport_batterie", label: "Rapport de batterie", genere: false },
  { key: "certificat_conformite", label: "Certificat de conformité", genere: false },
];

const DOCS_EMPLOYE_SEUL = new Set(["bon_commande", "ordre_mission_transporteur", "dossier_retour", "document_comptable"]);

export default function CommandeDetailEmploye() {
  const { orderItemId } = useParams();
  const id = Number(orderItemId);
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.orderEngine.detailCommandeEmploye.useQuery({ orderItemId: id });

  const [prix, setPrix] = useState({ totalAmount: "", depositAmount: "", balanceAmount: "", supplierPrice: "" });

  const invalider = () => utils.orderEngine.detailCommandeEmploye.invalidate({ orderItemId: id });

  const avancer = trpc.orderEngine.avancerStatut.useMutation({ onSuccess: invalider, onError: (e) => alert(e.message) });
  const validerPrix = trpc.orderEngine.validerPrixEtMarge.useMutation({ onSuccess: invalider, onError: (e) => alert(e.message) });
  const poserDecision = trpc.orderEngine.poserDecision.useMutation({ onSuccess: invalider, onError: (e) => alert(e.message) });
  const attribuer = trpc.orderEngine.attribuerEmploye.useMutation({ onSuccess: invalider, onError: (e) => alert(e.message) });
  const genererDocument = trpc.orderEngine.genererDocument.useMutation({ onSuccess: invalider, onError: (e) => alert(e.message) });

  if (isLoading) return <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center"><Loader2 className="animate-spin text-[#D4AF37]" /></div>;
  if (!data) return null;

  const { commande, decision, documents } = data;
  const currentIndex = ETAPES_INTERNES.findIndex((e) => e.key === commande.status);
  const estTerminale = currentIndex < 0; // vendue / retour_en_cours / retournee / remise_en_stock / annulee / litige / remboursee
  const peutDecider = commande.status === "pret_visite_livraison" || commande.status === "decision_finale";
  const peutAvancerSimple = NEXT_SIMPLE[commande.status];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-5">
        <Link to="/vehicule-sur-commande/mes-vehicules" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mes véhicules</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><ClipboardList size={20} className="text-[#D4AF37]" /> {commande.reference}</h1>
        <p className="mt-1 text-xs text-white/50">Client #{commande.customerId} · Fournisseur #{commande.supplierProfileId}</p>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {!commande.assignedEmployeeId && (
          <button onClick={() => user && attribuer.mutate({ orderItemId: id, employeeId: user.id })} className="w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-[#D4AF37]">
            S'attribuer ce véhicule
          </button>
        )}

        {estTerminale ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-sm font-bold text-[#111]">
              {commande.status === "vendue" && "Vente acceptée — commande close."}
              {commande.status === "retour_en_cours" && "Retour en cours — dossier de retour ouvert."}
              {commande.status === "retournee" && "Véhicule retourné au fournisseur."}
              {commande.status === "remise_en_stock" && "Véhicule gardé — remis en disponibilité pour d'autres clients."}
              {commande.status === "annulee" && "Commande annulée."}
              {commande.status === "litige" && "Litige en cours."}
              {commande.status === "remboursee" && "Commande remboursée."}
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <StepTracker steps={ETAPES_INTERNES} currentIndex={currentIndex < 0 ? 0 : currentIndex} />
          </div>
        )}

        {/* Prix et marge (étape 4, confidentiel) */}
        {commande.status === "documents_controles" && (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
            <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Prix et marge — validation humaine</h2>
            <input placeholder="Prix public total" value={prix.totalAmount} onChange={(e) => setPrix((p) => ({ ...p, totalAmount: e.target.value }))} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            <input placeholder="Acompte" value={prix.depositAmount} onChange={(e) => setPrix((p) => ({ ...p, depositAmount: e.target.value }))} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            <input placeholder="Solde" value={prix.balanceAmount} onChange={(e) => setPrix((p) => ({ ...p, balanceAmount: e.target.value }))} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            <input placeholder="Prix fournisseur (confidentiel)" value={prix.supplierPrice} onChange={(e) => setPrix((p) => ({ ...p, supplierPrice: e.target.value }))} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            <button
              onClick={() => validerPrix.mutate({ orderItemId: id, totalAmount: Number(prix.totalAmount), depositAmount: Number(prix.depositAmount), balanceAmount: Number(prix.balanceAmount), supplierPrice: Number(prix.supplierPrice) })}
              disabled={validerPrix.isPending || !prix.totalAmount || !prix.supplierPrice}
              className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] disabled:opacity-50"
            >
              <Euro size={14} className="inline mr-1" /> Valider prix et marge
            </button>
          </div>
        )}

        {/* Avancer (étapes simples, hors décision/prix) */}
        {!estTerminale && peutAvancerSimple && commande.status !== "documents_controles" && (
          <button onClick={() => avancer.mutate({ orderItemId: id, to: peutAvancerSimple as never, actorType: "employe" })} disabled={avancer.isPending} className="w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-[#D4AF37] disabled:opacity-50">
            Avancer : {ETAPES_INTERNES.find((e) => e.key === peutAvancerSimple)?.label}
          </button>
        )}

        {/* Décision finale (section 10) */}
        {peutDecider && !decision && (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
            <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Décision finale</h2>
            <button onClick={() => poserDecision.mutate({ orderItemId: id, decision: "accepte" })} disabled={poserDecision.isPending} className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              <CheckCircle size={16} /> Vente acceptée
            </button>
            <button onClick={() => poserDecision.mutate({ orderItemId: id, decision: "retourne" })} disabled={poserDecision.isPending} className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-50 py-2.5 text-sm font-bold text-red-700 disabled:opacity-50">
              <RotateCcw size={16} /> Préparer le retour
            </button>
            <button onClick={() => poserDecision.mutate({ orderItemId: id, decision: "garde" })} disabled={poserDecision.isPending} className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-100 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50">
              <Archive size={16} /> Garder le véhicule / Mettre en stock
            </button>
          </div>
        )}

        {/* Documents (section 11) */}
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Documents</h2>
          <div className="space-y-1.5">
            {DOCUMENT_TYPES.map((d) => {
              const existe = documents.some((doc) => doc.documentType === d.key);
              return (
                <div key={d.key} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-[#374151]">
                    <FileText size={13} className="text-[#D4AF37]" /> {d.label}
                    {DOCS_EMPLOYE_SEUL.has(d.key) && <span className="text-[9px] text-[#9CA3AF]">(interne)</span>}
                  </span>
                  {existe ? (
                    <span className="text-[10px] font-bold text-green-600">Généré</span>
                  ) : d.genere ? (
                    <button onClick={() => genererDocument.mutate({ orderItemId: id, documentType: d.key as never })} disabled={genererDocument.isPending} className="rounded-lg bg-[#D4AF37]/10 px-2.5 py-1 text-[10px] font-bold text-[#D4AF37] disabled:opacity-50">
                      Générer
                    </button>
                  ) : (
                    <span className="text-[9px] text-[#9CA3AF]">Produit par un autre moteur — à rattacher</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
