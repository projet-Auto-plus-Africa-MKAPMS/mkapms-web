import { Link } from "react-router-dom";
import { ChevronLeft, FileText, ShieldCheck, Download } from "lucide-react";
import { trpc } from "../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   COFFRE-FORT NUMÉRIQUE — base partagée (/notifications/coffre-fort-numerique
   et ses 3 sous-vues par catégorie de pièce). Données réelles : le moteur KYC
   générique déjà en production (trpc.kyc.myProfile, kycDocuments) est le seul
   vrai stockage de documents personnels sur la plateforme — jamais un second
   coffre-fort inventé pour cet écran.
   ══════════════════════════════════════════════════════════════════════════ */

const DOC_TYPE_LABEL: Record<string, string> = {
  piece_identite: "Pièce d'identité",
  permis_conduire: "Permis de conduire",
  justificatif_domicile: "Justificatif de domicile",
  kbis: "KBIS",
  rib: "RIB",
  carte_grise: "Carte grise",
  controle_technique: "Contrôle technique",
  autre: "Autre document",
};

interface DocumentsVaultProps {
  docTypes?: string[];
  titre?: string;
  sousTitre?: string;
}

export default function DocumentsVault({ docTypes, titre = "Coffre-fort numérique", sousTitre }: DocumentsVaultProps) {
  const monProfil = trpc.kyc.myProfile.useQuery();
  const documents = (monProfil.data?.documents ?? []).filter((d) => !docTypes || docTypes.includes(d.docType));

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><ShieldCheck size={20} className="text-[#D4AF37]" /> {titre}</h1>
        <p className="mt-1 text-sm text-white/60">{sousTitre ?? "Vos documents envoyés pour vérification"}</p>
      </div>

      {monProfil.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {documents.map((d) => (
          <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
              <FileText size={16} className="text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#111] truncate">{DOC_TYPE_LABEL[d.docType] ?? d.docType}</h3>
              <p className="text-[10px] text-[#6B7280] truncate">{d.fileName ?? "Sans nom"} · {new Date(d.uploadedAt).toLocaleDateString("fr-FR")}</p>
            </div>
            <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#D4AF37]">
              <Download size={14} />
            </a>
          </div>
        ))}
      </div>

      {!monProfil.isLoading && documents.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <ShieldCheck size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun document {docTypes ? "dans cette catégorie" : "envoyé"} pour le moment.</p>
          <Link to="/louer/controle-documents" className="mt-3 inline-block text-xs font-bold text-[#D4AF37] underline">Envoyer un document</Link>
        </div>
      )}
    </div>
  );
}
