import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const STEPS = [
  "Véhicule",
  "Intervention",
  "Description",
  "Localisation",
  "Coordonnées",
  "Récapitulatif",
  "Confirmation",
];

export default function Devis() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    vehiculeMarque: "",
    vehiculeModele: "",
    vehiculeAnnee: "",
    immatriculation: "",
    typeIntervention: "",
    description: "",
    ville: "",
    codePostal: "",
    contactNom: "",
    contactEmail: "",
    contactTelephone: "",
  });
  const create = trpc.devis.create.useMutation({ onSuccess: () => setStep(6) });

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((o) => ({ ...o, [k]: v }));
  }

  if (!user) {
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h1 className="text-xl font-extrabold text-slate-900">Connectez-vous pour demander un devis</h1>
          <Link to="/connexion" className="btn-primary mt-6 w-full">Se connecter</Link>
        </div>
      </div>
    );
  }

  function submit() {
    create.mutate({
      contactNom: f.contactNom || user!.name,
      contactEmail: f.contactEmail || user!.email,
      contactTelephone: f.contactTelephone || undefined,
      vehiculeMarque: f.vehiculeMarque || undefined,
      vehiculeModele: f.vehiculeModele || undefined,
      vehiculeAnnee: f.vehiculeAnnee ? Number(f.vehiculeAnnee) : undefined,
      immatriculation: f.immatriculation || undefined,
      typeIntervention: f.typeIntervention,
      description: f.description || undefined,
      ville: f.ville || undefined,
      codePostal: f.codePostal || undefined,
    });
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Demande de devis garage</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`badge ${i === step ? "bg-gold text-noir" : i < step ? "bg-gold-soft text-gold-dark" : "bg-slate-100 text-slate-400"}`}
          >
            {i + 1}. {s}
          </span>
        ))}
      </div>

      <div className="card mt-6 max-w-2xl p-6">
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="label">Marque</label><input className="input" value={f.vehiculeMarque} onChange={(e) => set("vehiculeMarque", e.target.value)} /></div>
            <div><label className="label">Modèle</label><input className="input" value={f.vehiculeModele} onChange={(e) => set("vehiculeModele", e.target.value)} /></div>
            <div><label className="label">Année</label><input className="input" type="number" value={f.vehiculeAnnee} onChange={(e) => set("vehiculeAnnee", e.target.value)} /></div>
            <div><label className="label">Immatriculation</label><input className="input" value={f.immatriculation} onChange={(e) => set("immatriculation", e.target.value)} /></div>
          </div>
        )}
        {step === 1 && (
          <div>
            <label className="label">Type d'intervention *</label>
            <select className="input" value={f.typeIntervention} onChange={(e) => set("typeIntervention", e.target.value)}>
              <option value="">Choisir…</option>
              {["Révision / entretien", "Freinage", "Pneumatiques", "Distribution", "Climatisation", "Carrosserie", "Diagnostic électronique", "Vidange", "Autre"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
        {step === 2 && (
          <div>
            <label className="label">Décrivez le besoin</label>
            <textarea className="input min-h-32" value={f.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        )}
        {step === 3 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="label">Ville</label><input className="input" value={f.ville} onChange={(e) => set("ville", e.target.value)} /></div>
            <div><label className="label">Code postal</label><input className="input" value={f.codePostal} onChange={(e) => set("codePostal", e.target.value)} /></div>
          </div>
        )}
        {step === 4 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="label">Nom</label><input className="input" value={f.contactNom} onChange={(e) => set("contactNom", e.target.value)} placeholder={user.name} /></div>
            <div><label className="label">Email</label><input className="input" value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder={user.email} /></div>
            <div><label className="label">Téléphone</label><input className="input" value={f.contactTelephone} onChange={(e) => set("contactTelephone", e.target.value)} /></div>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-2 text-sm text-slate-600">
            <p><b>Véhicule :</b> {f.vehiculeMarque} {f.vehiculeModele} {f.vehiculeAnnee}</p>
            <p><b>Intervention :</b> {f.typeIntervention || "—"}</p>
            <p><b>Description :</b> {f.description || "—"}</p>
            <p><b>Localisation :</b> {f.ville} {f.codePostal}</p>
            <p>Votre demande sera transmise aux garages partenaires de votre zone.</p>
          </div>
        )}
        {step === 6 && (
          <div className="py-8 text-center">
            <h2 className="text-xl font-extrabold text-gold-dark">Demande envoyée ✓</h2>
            <p className="mt-2 text-sm text-slate-500">
              Les garages partenaires vont vous recontacter avec leurs offres.
            </p>
            <Link to="/compte" className="btn-primary mt-6">Voir mes demandes</Link>
          </div>
        )}

        {step < 6 && (
          <div className="mt-6 flex justify-between">
            <button className="btn-outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Précédent
            </button>
            {step < 5 ? (
              <button
                className="btn-primary"
                disabled={step === 1 && !f.typeIntervention}
                onClick={() => setStep((s) => s + 1)}
              >
                Suivant
              </button>
            ) : (
              <button className="btn-primary" disabled={create.isPending} onClick={submit}>
                {create.isPending ? "Envoi…" : "Envoyer la demande"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
