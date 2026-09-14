import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Building2, User, Upload, FileText, Check, Shield, AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "../lib/auth";
import { trpc } from "../lib/trpc";
import FileUpload from "../components/FileUpload";
import type { DocType } from "@shared/profiles";

/* ══════════════════════════════════════════════════════════════════════════
   4-6. PASSAGE COMPTE PRO VENTE + IDENTITÉ DIRIGEANT + INFOS SOCIÉTÉ
   Choix activité, identité, société, documents, statuts.

   Dossier réellement enregistré via les mêmes procédures tRPC que
   InscriptionProVO (pro.createProfile, kyc.submitDocuments) : les deux
   parcours produisent le même profil pro (activity "vente_pro",
   profileType "pro_vente" — shared/profiles.ts), seule la sélection
   d'activité affichée diffère. L'activité choisie ici est indicative pour
   l'utilisateur : aucune colonne dédiée n'existe côté serveur pour la
   sous-activité, seule "vente_pro" est transmise.
   ══════════════════════════════════════════════════════════════════════════ */

const ACTIVITES = [
  "Vente VO", "Garage vendeur", "Marchand automobile", "Concessionnaire",
  "Vendeur moto", "Vendeur utilitaire", "Vendeur camion",
];

interface PieceDemandee {
  key: string;
  label: string;
  docType: DocType;
  obligatoire: boolean;
}

const PIECES_DIRIGEANT: PieceDemandee[] = [
  { key: "id", label: "Pièce d'identité", docType: "piece_identite", obligatoire: true },
  { key: "domicile", label: "Justificatif de domicile", docType: "justificatif_domicile", obligatoire: true },
];

const PIECES_SOCIETE: PieceDemandee[] = [
  { key: "kbis", label: "KBIS ou équivalent", docType: "kbis", obligatoire: true },
  { key: "local", label: "Justificatif local / bail (si applicable)", docType: "autre", obligatoire: false },
];

const CHAMPS_DIRIGEANT = ["prenom", "nom", "telephone", "email", "adresse"] as const;
const CHAMPS_SOCIETE = ["nomCommercial", "siret", "adresseSiege", "ville", "emailSociete", "telSociete"] as const;

export default function InscriptionProVente() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedActivite, setSelectedActivite] = useState<string | null>(null);
  const ETAPES = ["Activité", "Dirigeant", "Société", "Documents", "Validation"];
  const utils = trpc.useUtils();

  const dossier = trpc.kyc.myProfile.useQuery(undefined, { enabled: !!user });
  const profilPro = trpc.pro.getProfile.useQuery(undefined, { enabled: !!user });

  const enregistrerProfil = trpc.pro.createProfile.useMutation({
    onSuccess: () => utils.pro.getProfile.invalidate(),
  });
  const envoyerPieces = trpc.kyc.submitDocuments.useMutation({
    onSuccess: () => utils.kyc.myProfile.invalidate(),
  });

  const [dirigeant, setDirigeant] = useState({
    prenom: "", nom: "", dateNaissance: "", telephone: "", email: "", adresse: "",
  });
  const [societe, setSociete] = useState({
    nomCommercial: "", siret: "", adresseSiege: "", ville: "", emailSociete: "", telSociete: "",
  });
  const [pieces, setPieces] = useState<
    Record<string, { url: string; nom: string; mimeType?: string; taille?: number }>
  >({});

  function setD<K extends keyof typeof dirigeant>(k: K, v: string) { setDirigeant((o) => ({ ...o, [k]: v })); }
  function setS<K extends keyof typeof societe>(k: K, v: string) { setSociete((o) => ({ ...o, [k]: v })); }

  function recevoirPiece(key: string) {
    return (files: { url: string; originalName: string; size: number; mimeType: string }[]) => {
      const f = files[0];
      if (!f) return;
      setPieces((p) => ({
        ...p,
        [key]: { url: f.url, nom: f.originalName, mimeType: f.mimeType, taille: f.size },
      }));
    };
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="mx-4 mt-8 rounded-xl bg-white border border-[#E5E7EB] p-8 text-center">
          <h1 className="text-lg font-extrabold text-[#111]">Créez d'abord un compte particulier</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Tout utilisateur commence avec un compte particulier MKA.P-MS, puis peut demander l'ouverture d'un compte professionnel.
          </p>
          <Link to="/connexion?tab=register" className="mt-6 block w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white">Créer un compte</Link>
          <Link to="/connexion" className="mt-2 block w-full rounded-xl border border-[#E5E7EB] py-3 text-sm font-bold text-[#111]">Se connecter</Link>
        </div>
      </div>
    );
  }

  const champsManquants = [
    ...CHAMPS_DIRIGEANT.filter((c) => !dirigeant[c].trim()),
    ...CHAMPS_SOCIETE.filter((c) => !societe[c].trim()),
  ];
  const piecesManquantes = [...PIECES_DIRIGEANT, ...PIECES_SOCIETE].filter(
    (p) => p.obligatoire && !pieces[p.key],
  );

  async function submitDossier() {
    if (champsManquants.length || piecesManquantes.length) return;
    const aEnvoyer = [...PIECES_DIRIGEANT, ...PIECES_SOCIETE]
      .filter((p) => pieces[p.key])
      .map((p) => ({
        docType: p.docType,
        fileUrl: pieces[p.key].url,
        fileName: p.label,
        mimeType: pieces[p.key].mimeType,
        sizeBytes: pieces[p.key].taille,
      }));
    try {
      if (!profilPro.data) {
        await enregistrerProfil.mutateAsync({
          activity: "vente_pro",
          companyName: societe.nomCommercial,
          siret: societe.siret,
          addressLine: societe.adresseSiege,
          city: societe.ville,
          phone: societe.telSociete,
          email: societe.emailSociete,
        });
      }
      await envoyerPieces.mutateAsync({ profileType: "pro_vente", documents: aEnvoyer });
      setStep(4);
    } catch {
      // L'erreur est affichée sous le bouton : le dossier n'est pas soumis.
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/tableau-de-bord" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon espace</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Building2 size={20} /> Devenir professionnel</h1>
        <p className="mt-1 text-sm text-white/80">Ouvrir un compte pro vente MKA.P-MS</p>
      </div>
      <div className="px-4 mt-4 flex gap-1">{ETAPES.map((e, i) => (<div key={i} className="flex-1"><div className={`h-1 rounded-full ${i <= step ? "bg-blue-600" : "bg-[#E5E7EB]"}`} /><p className={`text-[7px] mt-0.5 text-center ${i <= step ? "text-blue-700 font-bold" : "text-[#9CA3AF]"}`}>{e}</p></div>))}</div>

      {step === 0 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
          <h3 className="text-sm font-bold text-[#111]">Choisissez votre activité</h3>
          {ACTIVITES.map((a) => (
            <button key={a} onClick={() => setSelectedActivite(a)} className={`w-full flex items-center gap-3 rounded-lg border-2 p-3 text-left transition ${selectedActivite === a ? "border-blue-600 bg-blue-50" : "border-[#E5E7EB]"}`}>
              <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${selectedActivite === a ? "border-blue-600 bg-blue-600" : "border-[#D4D4D4]"}`}>{selectedActivite === a && <Check size={10} className="text-white" />}</span>
              <span className="text-sm font-semibold text-[#111]">{a}</span>
            </button>
          ))}
          <button onClick={() => setStep(1)} className={`mt-2 w-full rounded-xl py-3 text-sm font-bold text-white transition ${selectedActivite ? "bg-blue-800 active:scale-[0.98]" : "bg-[#D4D4D4]"}`} disabled={!selectedActivite}>Suivant</button>
        </div>
      )}

      {step === 1 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#111]"><User size={16} className="text-blue-600" /> Identité du dirigeant</h3>
          <div><label className="text-xs text-[#6B7280]">Prénom *</label><input className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" value={dirigeant.prenom} onChange={(e) => setD("prenom", e.target.value)} /></div>
          <div><label className="text-xs text-[#6B7280]">Nom *</label><input className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" value={dirigeant.nom} onChange={(e) => setD("nom", e.target.value)} /></div>
          <div><label className="text-xs text-[#6B7280]">Date de naissance</label><input type="date" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" value={dirigeant.dateNaissance} onChange={(e) => setD("dateNaissance", e.target.value)} /></div>
          <div><label className="text-xs text-[#6B7280]">Téléphone *</label><input className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" value={dirigeant.telephone} onChange={(e) => setD("telephone", e.target.value)} placeholder="Votre numéro" /></div>
          <div><label className="text-xs text-[#6B7280]">Email *</label><input type="email" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" value={dirigeant.email} onChange={(e) => setD("email", e.target.value)} placeholder={user.email} /></div>
          <div><label className="text-xs text-[#6B7280]">Adresse *</label><input className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" value={dirigeant.adresse} onChange={(e) => setD("adresse", e.target.value)} placeholder="Votre adresse complète" /></div>

          <h4 className="text-xs font-bold text-[#111] pt-2">Documents dirigeant</h4>
          {PIECES_DIRIGEANT.map((p) => (
            <div key={p.key} className="rounded-lg border border-dashed border-blue-300 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#111]"><Upload size={14} className="text-blue-600" /> {p.label}{p.obligatoire ? " *" : ""}</p>
              <FileUpload
                label={pieces[p.key] ? "Remplacer la pièce" : "Télécharger"}
                accept="image/*,.pdf"
                multiple={false}
                maxFiles={1}
                onUploaded={recevoirPiece(p.key)}
                iaAnalysis
              />
              {pieces[p.key] && (
                <p className="mt-1 text-[10px] text-green-700">Enregistré sur le serveur : {pieces[p.key].nom}</p>
              )}
            </div>
          ))}
          <button onClick={() => setStep(2)} className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98]">Suivant</button>
        </div>
      )}

      {step === 2 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Informations société</h3>
          <div><label className="text-xs text-[#6B7280]">Nom société *</label><input className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" value={societe.nomCommercial} onChange={(e) => setS("nomCommercial", e.target.value)} placeholder="Auto Premium" /></div>
          <div><label className="text-xs text-[#6B7280]">SIRET *</label><input className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" value={societe.siret} onChange={(e) => setS("siret", e.target.value)} placeholder="123 456 789 00012" maxLength={14} /></div>
          <div><label className="text-xs text-[#6B7280]">Adresse siège *</label><input className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" value={societe.adresseSiege} onChange={(e) => setS("adresseSiege", e.target.value)} placeholder="12 Rue de la Paix, Paris" /></div>
          <div><label className="text-xs text-[#6B7280]">Ville *</label><input className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" value={societe.ville} onChange={(e) => setS("ville", e.target.value)} /></div>
          <div><label className="text-xs text-[#6B7280]">Email société *</label><input type="email" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" value={societe.emailSociete} onChange={(e) => setS("emailSociete", e.target.value)} placeholder="contact@autopremium.fr" /></div>
          <div><label className="text-xs text-[#6B7280]">Téléphone société *</label><input className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" value={societe.telSociete} onChange={(e) => setS("telSociete", e.target.value)} placeholder="+33 1 23 45 67 89" /></div>
          <button onClick={() => setStep(3)} className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98]">Suivant</button>
        </div>
      )}

      {step === 3 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Documents société</h3>
          {PIECES_SOCIETE.map((p) => (
            <div key={p.key} className="rounded-lg border border-dashed border-blue-300 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#111]"><FileText size={14} className="text-blue-600" /> {p.label}{p.obligatoire ? " *" : ""}</p>
              <FileUpload
                label={pieces[p.key] ? "Remplacer la pièce" : "Télécharger"}
                accept="image/*,.pdf"
                multiple={false}
                maxFiles={1}
                onUploaded={recevoirPiece(p.key)}
                iaAnalysis={p.docType === "kbis"}
              />
              {pieces[p.key] && (
                <p className="mt-1 text-[10px] text-green-700">Enregistré sur le serveur : {pieces[p.key].nom}</p>
              )}
            </div>
          ))}

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="flex items-center gap-1 text-xs font-semibold text-amber-800"><AlertTriangle size={14} /> Contrôle des pièces</p>
            <p className="mt-1 text-[10px] text-amber-700">
              Les pièces sont enregistrées sur le serveur puis contrôlées par l'équipe MKA.P-MS
              avant l'activation du compte. Aucun contrôle automatique n'est effectué à l'envoi.
            </p>
          </div>

          {(piecesManquantes.length > 0 || champsManquants.length > 0) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              {piecesManquantes.length > 0 && (
                <p className="text-xs text-amber-800">Pièces obligatoires manquantes : {piecesManquantes.map((p) => p.label).join(", ")}.</p>
              )}
              {champsManquants.length > 0 && (
                <p className="mt-1 text-xs text-amber-800">Informations obligatoires manquantes : {champsManquants.length} champ(s) aux étapes 1 et 2.</p>
              )}
            </div>
          )}

          {(envoyerPieces.error || enregistrerProfil.error) && (
            <p className="text-sm text-red-600">{envoyerPieces.error?.message ?? enregistrerProfil.error?.message}</p>
          )}

          <button
            onClick={submitDossier}
            disabled={envoyerPieces.isPending || enregistrerProfil.isPending || champsManquants.length > 0 || piecesManquantes.length > 0}
            className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-60"
          >
            {envoyerPieces.isPending || enregistrerProfil.isPending ? "Envoi…" : "Soumettre"}
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3 text-center">
          <Shield size={32} className="mx-auto text-blue-600" />
          <h3 className="text-base font-bold text-[#111]">Dossier soumis</h3>
          <p className="text-xs text-[#6B7280]">
            {envoyerPieces.data
              ? `${envoyerPieces.data.documentsEnregistres} pièce(s) enregistrée(s) sur le serveur.`
              : "Votre dossier est en cours de vérification."}
          </p>
          <div className="space-y-1.5 text-left">
            {(dossier.data?.documents ?? []).map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-xs">
                <Check size={14} className="text-green-500" />
                <span className="text-[#111]">{d.fileName ?? d.docType}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-xs">
              <Clock size={14} className="text-blue-600" />
              <span className="font-semibold text-blue-700">
                Dossier {dossier.data?.profile?.status ?? "en_validation"} — en attente du contrôle de l'équipe
              </span>
            </div>
          </div>
          <Link to="/tableau-de-bord" className="inline-block w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white mt-2 active:scale-[0.98]">Retour à mon espace</Link>
        </div>
      )}
    </div>
  );
}
