import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, ShieldAlert, Upload } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { profilesForRole, PROFILE_LIST, type ProfileDef } from "@shared/profiles";

const STATUS_LABEL: Record<string, string> = {
  non_demarre: "Non démarré",
  en_cours: "En cours",
  en_validation: "En attente de validation",
  valide: "Validé",
  refuse: "Refusé",
  expire: "Expiré",
};

export default function Validation() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const myProfile = trpc.kyc.myProfile.useQuery(undefined, { enabled: !!user });
  const submit = trpc.kyc.submitDocuments.useMutation({
    onSuccess: () => utils.kyc.myProfile.invalidate(),
  });

  // Profils possibles pour le rôle ; l'utilisateur confirme son activité.
  const options: ProfileDef[] = useMemo(() => {
    const byRole = user ? profilesForRole(user.role) : [];
    return byRole.length ? byRole : PROFILE_LIST.filter((p) => p.needsValidation);
  }, [user]);

  const [profileType, setProfileType] = useState<string>(options[0]?.type ?? "pro_vente");
  const profile = options.find((p) => p.type === profileType) ?? options[0];
  const [docs, setDocs] = useState<Record<string, string>>({});

  if (!user) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-slate-600">Connectez-vous pour accéder à la validation de votre compte.</p>
        <Link to="/connexion" className="btn-primary mt-4 inline-block">Se connecter</Link>
      </div>
    );
  }

  const status = myProfile.data?.profile?.status;
  const submitted = myProfile.data?.documents ?? [];

  function setDoc(key: string, value: string) {
    setDocs((d) => ({ ...d, [key]: value }));
  }

  function handleSubmit() {
    if (!profile) return;
    const payload = profile.documents
      .map((d, i) => ({ docType: d.docType, fileUrl: docs[`${d.docType}_${i}`]?.trim() ?? "", fileName: d.label }))
      .filter((d) => d.fileUrl.length > 0);
    if (!payload.length) return;
    submit.mutate({ documents: payload });
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-extrabold text-slate-900">Validation de votre compte professionnel</h1>
      <p className="mt-2 text-slate-500">
        Soumettez vos documents. Un membre de l'équipe MKA.P-MS les vérifie avant d'activer l'accès complet.
      </p>

      {status && (
        <div className={`mt-6 flex items-center gap-3 rounded-xl border p-4 ${
          status === "valide" ? "border-green-200 bg-green-50 text-green-700"
          : status === "refuse" ? "border-red-200 bg-red-50 text-red-700"
          : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          {status === "valide" ? <CheckCircle2 size={20} /> : status === "refuse" ? <ShieldAlert size={20} /> : <Clock size={20} />}
          <div>
            <p className="font-semibold">Statut : {STATUS_LABEL[status] ?? status}</p>
            {myProfile.data?.profile?.rejectionReason && (
              <p className="text-sm">Motif : {myProfile.data.profile.rejectionReason}</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="card p-5 md:col-span-1">
          <label className="text-xs font-semibold text-slate-500">Mon activité</label>
          <select
            className="input mt-1"
            value={profileType}
            onChange={(e) => setProfileType(e.target.value)}
          >
            {options.map((p) => (
              <option key={p.type} value={p.type}>{p.label}</option>
            ))}
          </select>
          {profile && <p className="mt-2 text-xs text-slate-400">{profile.description}</p>}
        </div>

        <div className="card p-5 md:col-span-2">
          <h2 className="font-bold text-slate-900">Documents requis</h2>
          <div className="mt-4 space-y-4">
            {profile?.documents.map((d, i) => {
              const key = `${d.docType}_${i}`;
              const already = submitted.find((s) => s.docType === d.docType);
              return (
                <div key={key}>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Upload size={14} className="text-brand" /> {d.label}
                    {already && <span className="badge bg-green-100 text-green-700">déjà soumis</span>}
                  </label>
                  <input
                    className="input mt-1"
                    placeholder="Lien ou référence du document (PDF, photo…)"
                    value={docs[key] ?? ""}
                    onChange={(e) => setDoc(key, e.target.value)}
                  />
                </div>
              );
            })}
          </div>

          {submit.error && <p className="mt-3 text-sm text-red-600">{submit.error.message}</p>}
          {submit.isSuccess && <p className="mt-3 text-sm text-green-600">Documents envoyés. Dossier en attente de validation.</p>}

          <button className="btn-primary mt-5" disabled={submit.isPending} onClick={handleSubmit}>
            {submit.isPending ? "Envoi…" : "Envoyer pour validation"}
          </button>
          <p className="mt-3 text-xs text-slate-400">
            Vos documents sont chiffrés et supprimés 30 jours après la fin de contrat (RGPD).
          </p>
        </div>
      </div>
    </div>
  );
}
