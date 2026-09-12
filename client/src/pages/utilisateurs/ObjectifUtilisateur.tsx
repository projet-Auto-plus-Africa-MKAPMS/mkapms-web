import { Link } from "react-router-dom";
import { ChevronLeft, User, Check, Circle } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   OBJECTIF COMPTE (/utilisateurs/objectif)
   Ce que votre compte a déjà réellement complété, à partir de moteurs
   existants (KYC, sécurité, annonces) — jamais un score ou un pourcentage
   inventé : chaque étape est vraie ou fausse, rien entre les deux.
   ══════════════════════════════════════════════════════════════════════════ */

export default function ObjectifUtilisateur() {
  const kyc = trpc.kyc.myProfile.useQuery();
  const mfa = trpc.identity.mfa.status.useQuery();
  const annonces = trpc.annonces.mine.useQuery();
  const favoris = trpc.favoris.mine.useQuery();

  const etapes = [
    { fait: (kyc.data?.documents.length ?? 0) > 0, label: "Envoyer une pièce d'identité", lien: "/louer/controle-documents" },
    { fait: kyc.data?.profile?.status === "valide", label: "Faire valider votre dossier", lien: "/louer/controle-documents" },
    { fait: !!mfa.data?.activated, label: "Activer la double authentification", lien: "/utilisateurs/securite-utilisateur" },
    { fait: (annonces.data?.length ?? 0) > 0, label: "Déposer votre première annonce", lien: "/vendre" },
    { fait: (favoris.data?.length ?? 0) > 0, label: "Enregistrer un véhicule en favori", lien: "/acheter" },
  ];

  const chargement = kyc.isLoading || mfa.isLoading || annonces.isLoading || favoris.isLoading;
  const faites = etapes.filter((e) => e.fait).length;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><User size={20} className="text-[#D4AF37]" /> Objectif compte</h1>
        <p className="mt-1 text-sm text-white/60">{chargement ? "Chargement…" : `${faites}/${etapes.length} étapes complétées`}</p>
      </div>

      <div className="px-4 mt-4 space-y-2">
        {etapes.map((e) => (
          <Link key={e.label} to={e.lien} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${e.fait ? "bg-green-50" : "bg-slate-100"}`}>
              {e.fait ? <Check size={14} className="text-green-600" /> : <Circle size={14} className="text-slate-400" />}
            </div>
            <span className={`text-sm ${e.fait ? "text-[#111] font-semibold" : "text-[#6B7280]"}`}>{e.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
