import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Building2, Car, Truck, User, Check, Loader2, ArrowRight } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   CANDIDATURE DE LOCATION FLOTTE (Pro / VTC / Taxi / Société)
   Point d'entrée réel du moteur server/routers/rentalApplications.ts
   (créé et testé, mais jusqu'ici jamais appelé par aucun écran) : une
   candidature à qualifier par un agent, pas une réservation confirmée —
   aucune disponibilité ni tarif n'est garanti avant décision de l'agence.
   ══════════════════════════════════════════════════════════════════════════ */

type ApplicantType = "individual" | "society" | "vtc" | "taxi";

const TYPES: { id: ApplicantType; label: string; desc: string; icon: typeof User }[] = [
  { id: "individual", label: "Particulier", desc: "Location longue durée à titre personnel", icon: User },
  { id: "society", label: "Société", desc: "Flotte d'entreprise, plusieurs véhicules possibles", icon: Building2 },
  { id: "vtc", label: "VTC", desc: "Véhicule dédié à l'activité VTC", icon: Car },
  { id: "taxi", label: "Taxi", desc: "Véhicule dédié à l'activité taxi", icon: Truck },
];

export default function CandidatureLocationFlotte() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const mineQ = trpc.rentalApplications.mine.useQuery(undefined, { enabled: !!user });
  const create = trpc.rentalApplications.create.useMutation();
  const updateStep = trpc.rentalApplications.updateStep.useMutation();
  const submit = trpc.rentalApplications.submit.useMutation();

  const [appId, setAppId] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [applicantType, setApplicantType] = useState<ApplicantType | null>(null);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [ville, setVille] = useState("");
  const [detailSociete, setDetailSociete] = useState("");
  const [detailPermisOuCarte, setDetailPermisOuCarte] = useState("");
  const [envoye, setEnvoye] = useState(false);

  // Reprise d'un brouillon existant : jamais de deuxième candidature en
  // parallèle créée par erreur pour le même besoin.
  useEffect(() => {
    if (!mineQ.data || appId !== null) return;
    const brouillon = mineQ.data.find((a) => a.status === "draft");
    if (brouillon) {
      const d = (brouillon.data && typeof brouillon.data === "object" ? brouillon.data : {}) as Record<string, unknown>;
      setAppId(brouillon.id);
      setApplicantType(brouillon.applicantType as ApplicantType);
      setStep(brouillon.currentStep || 0);
      if (typeof d.nom === "string") setNom(d.nom);
      if (typeof d.telephone === "string") setTelephone(d.telephone);
      if (typeof d.ville === "string") setVille(d.ville);
      if (typeof d.detailSociete === "string") setDetailSociete(d.detailSociete);
      if (typeof d.detailPermisOuCarte === "string") setDetailPermisOuCarte(d.detailPermisOuCarte);
    }
  }, [mineQ.data, appId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-sm text-[#6B7280]">Connectez-vous pour déposer une candidature de location flotte.</p>
          <button onClick={() => navigate(`/connexion?next=${encodeURIComponent("/louer/pro/candidature")}`)} className="rounded-xl bg-[#111] px-5 py-2.5 text-sm font-bold text-white">
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  async function choisirType(t: ApplicantType) {
    setApplicantType(t);
    const app = await create.mutateAsync({ applicantType: t });
    setAppId(app.id);
    setStep(1);
  }

  async function suivantEtape1() {
    if (!appId) return;
    await updateStep.mutateAsync({ id: appId, data: { nom, telephone, ville }, currentStep: 2 });
    setStep(2);
  }

  async function suivantEtape2() {
    if (!appId) return;
    await updateStep.mutateAsync({ id: appId, data: { detailSociete, detailPermisOuCarte }, currentStep: 3 });
    setStep(3);
  }

  async function envoyer() {
    if (!appId) return;
    await submit.mutateAsync({ id: appId });
    utils.rentalApplications.mine.invalidate();
    setEnvoye(true);
  }

  const champComplementaireLabel =
    applicantType === "society" ? "Raison sociale et SIRET"
      : applicantType === "vtc" ? "Numéro de carte professionnelle VTC"
      : applicantType === "taxi" ? "Numéro de carte professionnelle taxi"
      : "Numéro de permis de conduire";

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer/pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location Pro</Link>
        <h1 className="text-xl font-black text-white">Candidature de location flotte</h1>
        <p className="mt-1 text-sm text-white/60">Une candidature à qualifier par notre équipe — pas une réservation confirmée.</p>
      </div>

      {envoye ? (
        <div className="mx-4 mt-6 rounded-xl bg-white border border-[#E5E7EB] p-6 text-center space-y-3">
          <Check size={28} className="mx-auto text-emerald-600" />
          <h2 className="text-base font-bold text-[#111]">Candidature envoyée</h2>
          <p className="text-sm text-[#6B7280]">Notre équipe l'examine. Vous serez notifié de la décision et pourrez suivre son statut.</p>
          <Link to="/location/mes-candidatures" className="inline-block rounded-xl bg-[#111] px-5 py-2.5 text-sm font-bold text-white">Suivre ma candidature</Link>
        </div>
      ) : (
        <div className="px-4 mt-4">
          {/* Étape 0 : type de candidature */}
          {step === 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-[#111]">Vous êtes…</h2>
              {TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    disabled={create.isPending}
                    onClick={() => choisirType(t.id)}
                    className="w-full flex items-center gap-3 rounded-xl border-2 border-[#E5E7EB] bg-white p-3.5 text-left active:scale-[0.99] transition disabled:opacity-50"
                  >
                    <Icon size={20} className="text-[#D4AF37]" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#111]">{t.label}</p>
                      <p className="text-xs text-[#6B7280]">{t.desc}</p>
                    </div>
                    {create.isPending && applicantType === t.id ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} className="text-[#9CA3AF]" />}
                  </button>
                );
              })}
              {create.isError && <p className="text-xs font-semibold text-red-600">{create.error.message}</p>}
            </div>
          )}

          {/* Étape 1 : coordonnées */}
          {step === 1 && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
              <h2 className="text-sm font-bold text-[#111]">Vos coordonnées</h2>
              <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom complet ou raison sociale" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
              <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ville" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
              <button
                disabled={!nom || !telephone || !ville || updateStep.isPending}
                onClick={suivantEtape1}
                className="w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                {updateStep.isPending ? "Enregistrement…" : "Continuer"}
              </button>
              {updateStep.isError && <p className="text-xs font-semibold text-red-600">{updateStep.error.message}</p>}
            </div>
          )}

          {/* Étape 2 : justificatif selon le profil */}
          {step === 2 && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
              <h2 className="text-sm font-bold text-[#111]">{champComplementaireLabel}</h2>
              {applicantType === "society" ? (
                <input value={detailSociete} onChange={(e) => setDetailSociete(e.target.value)} placeholder="Raison sociale — N° SIRET" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
              ) : (
                <input value={detailPermisOuCarte} onChange={(e) => setDetailPermisOuCarte(e.target.value)} placeholder={champComplementaireLabel} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
              )}
              <p className="text-[10px] text-[#9CA3AF]">Un justificatif pourra vous être demandé par l'agent avant décision.</p>
              <button
                disabled={(applicantType === "society" ? !detailSociete : !detailPermisOuCarte) || updateStep.isPending}
                onClick={suivantEtape2}
                className="w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                {updateStep.isPending ? "Enregistrement…" : "Continuer"}
              </button>
              {updateStep.isError && <p className="text-xs font-semibold text-red-600">{updateStep.error.message}</p>}
            </div>
          )}

          {/* Étape 3 : récapitulatif et envoi */}
          {step === 3 && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
              <h2 className="text-sm font-bold text-[#111]">Récapitulatif</h2>
              <div className="space-y-1.5 text-xs text-[#111]">
                <p><span className="text-[#6B7280]">Profil : </span>{TYPES.find((t) => t.id === applicantType)?.label}</p>
                <p><span className="text-[#6B7280]">Nom : </span>{nom}</p>
                <p><span className="text-[#6B7280]">Téléphone : </span>{telephone}</p>
                <p><span className="text-[#6B7280]">Ville : </span>{ville}</p>
                <p><span className="text-[#6B7280]">{champComplementaireLabel} : </span>{applicantType === "society" ? detailSociete : detailPermisOuCarte}</p>
              </div>
              <p className="text-[10px] text-[#9CA3AF]">
                Aucun tarif ni acompte n'est fixé à ce stade — l'agence les déterminera après examen de votre candidature.
              </p>
              <button disabled={submit.isPending} onClick={envoyer} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white disabled:opacity-40">
                {submit.isPending ? "Envoi…" : "Envoyer ma candidature"}
              </button>
              {submit.isError && <p className="text-xs font-semibold text-red-600">{submit.error.message}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
