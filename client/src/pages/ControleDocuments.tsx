import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ShieldCheck, Check, Clock, AlertCircle,
  FileCheck, User, Car,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import FileUpload from "../components/FileUpload";

/* ══════════════════════════════════════════════════════════════════════════
   CONTRÔLE DES DOCUMENTS AVANT RÉSERVATION (/louer/controle-documents)
   Réutilise le vrai moteur KYC générique (server/routers/kyc.ts,
   kycProfiles/kycDocuments) — aucun second moteur de vérification créé.
   L'âge minimum et l'ancienneté du permis ne sont pas des champs que le
   contrôle d'authenticité des pièces extrait automatiquement : ils restent
   à l'examen humain du dossier, affichés comme tels plutôt que simulés.
   ══════════════════════════════════════════════════════════════════════════ */

const LABEL_STATUT: Record<string, string> = {
  non_verifie: "Non commencé",
  en_cours: "En cours",
  en_validation: "En cours d'examen",
  valide: "Validé",
  refuse: "Refusé",
  expire: "Expiré",
};

export default function ControleDocuments() {
  const monProfil = trpc.kyc.myProfile.useQuery();
  const submit = trpc.kyc.submitDocuments.useMutation({ onSuccess: () => monProfil.refetch() });
  const [pieceIdentite, setPieceIdentite] = useState<{ url: string; originalName: string; mimeType: string; size: number } | null>(null);
  const [permis, setPermis] = useState<{ url: string; originalName: string; mimeType: string; size: number } | null>(null);

  const documents = monProfil.data?.documents ?? [];
  const aIdentite = documents.some((d) => d.docType === "piece_identite");
  const aPermis = documents.some((d) => d.docType === "permis_conduire");
  const statutDossier = monProfil.data?.profile?.status ?? "non_verifie";
  const dossierValide = statutDossier === "valide";

  const envoyer = () => {
    const docs = [];
    if (pieceIdentite && !aIdentite) docs.push({ docType: "piece_identite" as const, fileUrl: pieceIdentite.url, fileName: pieceIdentite.originalName, mimeType: pieceIdentite.mimeType, sizeBytes: pieceIdentite.size });
    if (permis && !aPermis) docs.push({ docType: "permis_conduire" as const, fileUrl: permis.url, fileName: permis.originalName, mimeType: permis.mimeType, sizeBytes: permis.size });
    if (docs.length === 0) return;
    submit.mutate({ documents: docs });
  };

  const validCount = (aIdentite ? 1 : 0) + (aPermis ? 1 : 0) + (dossierValide ? 1 : 0);
  const progress = Math.round((validCount / 3) * 100);
  const peutContinuer = dossierValide;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><ShieldCheck size={20} className="text-[#D4AF37]" /> Contrôle pré-réservation</h1>
        <p className="mt-1 text-sm text-white/60">Vos documents, vérifiés avant paiement</p>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-[#111]">Progression</span>
          <span className="text-sm font-bold text-[#D4AF37]">{validCount}/3</span>
        </div>
        <div className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
          <div className="h-full rounded-full bg-[#D4AF37] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-[#6B7280]">
          {peutContinuer ? "Votre dossier est validé. Vous pouvez réserver." : "Envoyez vos pièces, puis attendez la validation de votre dossier."}
        </p>
      </div>

      <div className="mx-4 mt-3 rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
        <AlertCircle size={14} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800">L'âge minimum et l'ancienneté du permis sont vérifiés à la main lors de l'examen de votre dossier, pas automatiquement à l'envoi de la pièce.</p>
      </div>

      <div className="px-4 mt-4 space-y-2">
        <div className={`rounded-xl bg-white border p-4 ${aPermis ? "border-green-200" : "border-amber-200"}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${aPermis ? "bg-green-50" : "bg-[#F5F3EF]"}`}>
              <Car size={16} className={aPermis ? "text-green-600" : "text-[#6B7280]"} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#111]">Permis de conduire</h3>
              <p className="text-[10px] text-[#6B7280]">Permis valide et non suspendu</p>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${aPermis ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
              {aPermis ? <Check size={10} /> : <Clock size={10} />} {aPermis ? "Envoyé" : "En attente"}
            </span>
          </div>
          {!aPermis && (
            <div className="mt-3">
              <FileUpload label="Ajouter mon permis" multiple={false} onUploaded={(f) => f[0] && setPermis(f[0])} compact />
            </div>
          )}
        </div>

        <div className={`rounded-xl bg-white border p-4 ${aIdentite ? "border-green-200" : "border-amber-200"}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${aIdentite ? "bg-green-50" : "bg-[#F5F3EF]"}`}>
              <User size={16} className={aIdentite ? "text-green-600" : "text-[#6B7280]"} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#111]">Pièce d'identité</h3>
              <p className="text-[10px] text-[#6B7280]">CNI ou passeport en cours de validité</p>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${aIdentite ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
              {aIdentite ? <Check size={10} /> : <Clock size={10} />} {aIdentite ? "Envoyée" : "En attente"}
            </span>
          </div>
          {!aIdentite && (
            <div className="mt-3">
              <FileUpload label="Ajouter ma pièce d'identité" multiple={false} onUploaded={(f) => f[0] && setPieceIdentite(f[0])} compact />
            </div>
          )}
        </div>

        <div className={`rounded-xl bg-white border p-4 ${dossierValide ? "border-green-200" : "border-amber-200"}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${dossierValide ? "bg-green-50" : "bg-[#F5F3EF]"}`}>
              <FileCheck size={16} className={dossierValide ? "text-green-600" : "text-[#6B7280]"} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#111]">Examen du dossier</h3>
              <p className="text-[10px] text-[#6B7280]">Âge minimum et ancienneté du permis vérifiés à la main</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100">
              {LABEL_STATUT[statutDossier] ?? statutDossier}
            </span>
          </div>
        </div>

        {(pieceIdentite || permis) && !dossierValide && (
          <button
            onClick={envoyer}
            disabled={submit.isPending}
            className="w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {submit.isPending ? "Envoi…" : "Envoyer mes pièces pour validation"}
          </button>
        )}
        {submit.error && <p className="text-xs text-red-600 text-center">{submit.error.message}</p>}
      </div>

      <div className="px-4 mt-3">
        <p className="text-[10px] text-[#9CA3AF] text-center">Le moyen de paiement est demandé de façon sécurisée au moment de la réservation, pas avant.</p>
      </div>

      <div className="px-4 mt-6">
        <button
          className={`w-full rounded-xl py-4 text-base font-extrabold text-white transition ${peutContinuer ? "bg-[#D4AF37] active:scale-[0.98] shadow-lg" : "bg-[#D4D4D4]"}`}
          disabled={!peutContinuer}
        >
          {peutContinuer ? "Continuer vers la réservation" : "Vérifications incomplètes"}
        </button>
      </div>
    </div>
  );
}
