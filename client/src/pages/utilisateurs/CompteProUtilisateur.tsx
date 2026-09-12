import { Link } from "react-router-dom";
import { ChevronLeft, Building2, Check, Clock } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* Données réelles : trpc.pro.getProfile (server/routers/pro.ts, table
   pro_profiles) — le même moteur déjà utilisé par le parcours d'inscription
   réel (client/src/pages/InscriptionProVO.tsx), jamais un second système
   de compte professionnel inventé. */

export default function CompteProUtilisateur() {
  const profil = trpc.pro.getProfile.useQuery();

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Building2 size={20} className="text-[#D4AF37]" /> Compte professionnel</h1>
        <p className="mt-1 text-sm text-white/60">Votre statut professionnel MKA.P-MS</p>
      </div>

      {profil.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      {!profil.isLoading && profil.data && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111]">{profil.data.companyName ?? profil.data.activity}</h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${profil.data.validated ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
              {profil.data.validated ? <Check size={10} /> : <Clock size={10} />} {profil.data.validated ? "Validé" : "En attente de validation"}
            </span>
          </div>
          <p className="text-xs text-[#6B7280]">Activité : {profil.data.activity}</p>
          {profil.data.siret && <p className="text-xs text-[#6B7280]">SIRET : {profil.data.siret}</p>}
          {profil.data.city && <p className="text-xs text-[#6B7280]">{[profil.data.addressLine, profil.data.postalCode, profil.data.city].filter(Boolean).join(", ")}</p>}
        </div>
      )}

      {!profil.isLoading && !profil.data && (
        <div className="px-4 mt-8 text-center">
          <Building2 size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Vous n'avez pas encore de compte professionnel.</p>
          <Link to="/inscription-pro-vo" className="mt-3 inline-block text-xs font-bold text-[#D4AF37] underline">Créer mon compte professionnel</Link>
        </div>
      )}
    </div>
  );
}
