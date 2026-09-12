import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, PenLine, FileText, Check, Download } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   SIGNATURES GLOBALES (/notifications/signatures-globales)
   Données réelles : trpc.contracts.mine (generated_documents) +
   trpc.contracts.sign (document_signatures) — moteur de contrats déjà
   construit, jamais un second système de signature inventé pour cet écran.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUT_LABEL: Record<string, string> = {
  brouillon: "Brouillon",
  genere: "En attente de signature",
  envoye: "Envoyé pour signature",
  signe: "Signé",
  archive: "Archivé",
  annule: "Annulé",
};

export default function SignaturesGlobales() {
  const mesDocuments = trpc.contracts.mine.useQuery();
  const sign = trpc.contracts.sign.useMutation({ onSuccess: () => mesDocuments.refetch() });
  const [signingId, setSigningId] = useState<number | null>(null);

  const documents = mesDocuments.data ?? [];
  const aSigner = documents.filter((d) => d.status === "genere" || d.status === "envoye");
  const signes = documents.filter((d) => d.status === "signe" || d.status === "archive");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><PenLine size={20} className="text-[#D4AF37]" /> Signatures</h1>
        <p className="mt-1 text-sm text-white/60">Vos contrats et documents à signer</p>
      </div>

      {mesDocuments.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      {aSigner.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-sm font-bold text-[#111]">En attente de signature</h2>
          <div className="mt-2 space-y-2">
            {aSigner.map((d) => (
              <div key={d.id} className="rounded-xl bg-white border border-amber-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                    <FileText size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#111] truncate">{d.titre ?? d.type}</h3>
                    <p className="text-[10px] text-[#6B7280]">{STATUT_LABEL[d.status] ?? d.status} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSigningId(d.id); sign.mutate({ documentId: d.id }, { onSettled: () => setSigningId(null) }); }}
                  disabled={sign.isPending && signingId === d.id}
                  className="mt-3 w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
                >
                  {sign.isPending && signingId === d.id ? "Signature…" : "Signer maintenant"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 mt-6">
        <h2 className="text-sm font-bold text-[#111]">Documents signés</h2>
        {signes.length === 0 && <p className="mt-2 text-xs text-[#6B7280]">Aucun document signé pour le moment.</p>}
        <div className="mt-2 space-y-2">
          {signes.map((d) => (
            <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
                <Check size={16} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#111] truncate">{d.titre ?? d.type}</h3>
                <p className="text-[10px] text-[#6B7280]">{new Date(d.updatedAt).toLocaleDateString("fr-FR")}</p>
              </div>
              {d.pdfUrl && (
                <a href={d.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#D4AF37]">
                  <Download size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {!mesDocuments.isLoading && documents.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <PenLine size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun document à signer pour le moment.</p>
        </div>
      )}
    </div>
  );
}
