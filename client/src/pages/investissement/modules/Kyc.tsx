import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { trpc } from "../../../lib/trpc";
import FileUpload from "../../../components/FileUpload";

const LABEL_STATUT: Record<string, string> = {
  non_demarre: "Non commencé",
  en_cours: "En cours",
  en_validation: "En validation",
  valide: "Validé",
  refuse: "Refusé",
  expire: "Expiré",
};

/**
 * Réutilise le vrai moteur KYC (server/routers/kyc.ts, kycProfiles) déjà en
 * production pour les autres profils — aucun moteur de vérification
 * dupliqué. Le contrôle d'authenticité des pièces s'applique de la même
 * façon, une décision humaine valide ensuite le dossier.
 */
export function Kyc() {
  const statut = trpc.investment.monStatutKyc.useQuery();
  const monProfil = trpc.kyc.myProfile.useQuery();
  const submit = trpc.kyc.submitDocuments.useMutation({
    onSuccess: () => {
      statut.refetch();
      monProfil.refetch();
    },
  });
  const [pieceIdentite, setPieceIdentite] = useState<{ url: string; originalName: string; mimeType: string; size: number } | null>(null);
  const [justificatif, setJustificatif] = useState<{ url: string; originalName: string; mimeType: string; size: number } | null>(null);

  const envoyer = () => {
    const documents = [];
    if (pieceIdentite) documents.push({ docType: "piece_identite" as const, fileUrl: pieceIdentite.url, fileName: pieceIdentite.originalName, mimeType: pieceIdentite.mimeType, sizeBytes: pieceIdentite.size });
    if (justificatif) documents.push({ docType: "justificatif_domicile" as const, fileUrl: justificatif.url, fileName: justificatif.originalName, mimeType: justificatif.mimeType, sizeBytes: justificatif.size });
    if (documents.length === 0) return;
    submit.mutate({ documents });
  };

  const statutActuel = statut.data?.statut ?? "non_demarre";

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
        <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#D4AF37]" /><p className="text-sm font-bold text-[#111]">Statut de vérification</p></div>
        <p className="mt-2 text-sm text-[#6B7280]">{LABEL_STATUT[statutActuel] ?? statutActuel}</p>
        {statut.data?.motifRefus && <p className="mt-1 text-xs text-red-600">Motif : {statut.data.motifRefus}</p>}
        {statut.data?.organisationVerifiee === false && <p className="mt-1 text-xs text-amber-600">La société représentée n'est pas encore vérifiée.</p>}
      </div>

      {statutActuel !== "valide" && (
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <p className="text-sm font-bold text-[#111]">Soumettre mes pièces</p>
          <FileUpload label="Pièce d'identité" multiple={false} onUploaded={(f) => f[0] && setPieceIdentite(f[0])} />
          <FileUpload label="Justificatif de domicile" multiple={false} onUploaded={(f) => f[0] && setJustificatif(f[0])} />
          <button
            onClick={envoyer}
            disabled={submit.isPending || (!pieceIdentite && !justificatif)}
            className="rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {submit.isPending ? "Envoi…" : "Envoyer pour validation"}
          </button>
        </div>
      )}
    </div>
  );
}
