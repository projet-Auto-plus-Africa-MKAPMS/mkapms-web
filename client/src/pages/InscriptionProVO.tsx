import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Upload, ShieldCheck, Building2, FileText, CreditCard, AlertTriangle, User, ChevronRight, Clock } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { trpc } from "../lib/trpc";
import FileUpload from "../components/FileUpload";
import type { DocType } from "@shared/profiles";

// Pièces du dossier VO. `docType` + `kycLabel` = identité de la pièce dans le
// dossier de validation (server/routers/kyc) : c'est le serveur qui refuse un
// dossier incomplet, l'écran ne fait que l'annoncer plus tôt.
interface PieceDemandee {
  key: string;
  label: string;
  docType: DocType;
  kycLabel: string;
  obligatoire: boolean;
}

const PIECES_DIRIGEANT: PieceDemandee[] = [
  { key: "id_recto", label: "Pièce d'identité (recto)", docType: "piece_identite", kycLabel: "Pièce d'identité du dirigeant", obligatoire: true },
  { key: "id_verso", label: "Pièce d'identité (verso)", docType: "piece_identite", kycLabel: "Pièce d'identité du dirigeant (verso)", obligatoire: true },
  { key: "domicile", label: "Justificatif de domicile (moins de 3 mois)", docType: "justificatif_domicile", kycLabel: "Justificatif de domicile du dirigeant", obligatoire: true },
];

const PIECES_SOCIETE: PieceDemandee[] = [
  { key: "kbis", label: "KBIS (moins de 3 mois)", docType: "kbis", kycLabel: "KBIS ou équivalent", obligatoire: true },
  { key: "assurance", label: "Assurance RC professionnelle", docType: "autre", kycLabel: "Assurance RC professionnelle", obligatoire: true },
  { key: "rib", label: "RIB société", docType: "rib", kycLabel: "RIB société", obligatoire: true },
  { key: "insee", label: "Attestation INSEE", docType: "autre", kycLabel: "Attestation INSEE", obligatoire: false },
  { key: "bail", label: "Justificatif local / Bail commercial", docType: "autre", kycLabel: "Justificatif local / bail (si applicable)", obligatoire: false },
  { key: "activite", label: "Document activité automobile", docType: "autre", kycLabel: "Document activité automobile", obligatoire: false },
];

const PIECE_LOGO: PieceDemandee = { key: "logo", label: "Logo société", docType: "autre", kycLabel: "Logo société", obligatoire: false };

const CHAMPS_DIRIGEANT = ["prenom", "nom", "dateNaissance", "telephone", "email", "adresse", "fonction"] as const;
const CHAMPS_SOCIETE = ["nomCommercial", "raisonSociale", "formeJuridique", "siren", "siret", "adresseSiege", "emailSociete", "telSociete", "activite", "villeActivite"] as const;

const STEPS = [
  "Identité dirigeant",
  "Société",
  "Documents société",
  "Abonnement",
  "Validation",
];

const FORMES_JURIDIQUES = [
  "SAS", "SASU", "SARL", "EURL", "SA", "SCI", "EI", "EIRL", "SNC", "Auto-entrepreneur", "Autre",
];

const VO_PLANS = [
  { code: "vo_start", label: "VO Start", prix: 29, vehicules: "10", features: ["Annonces illimitées", "Photos illimitées", "Messagerie", "Stats de base"] },
  { code: "vo_premium", label: "VO Premium", prix: 59, vehicules: "50", highlight: true, features: ["Tout Start", "Stock VO", "Réservations", "Acomptes", "Boost", "Priorité"] },
  { code: "vo_elite", label: "VO Elite", prix: 99, vehicules: "150", features: ["Tout Premium", "Multi-utilisateurs", "Employés", "Rapports", "Signature électronique"] },
  { code: "vo_business", label: "VO Business", prix: 199, vehicules: "Illimité", features: ["Tout Elite", "Multi-sites", "Comptabilité", "API", "Support 7j/7"] },
  { code: "vo_enterprise", label: "VO Enterprise", prix: null, vehicules: "Illimité+", features: ["Réseaux garages", "Groupes automobiles", "Grands marchands", "Partenaires internationaux"] },
];

export default function InscriptionProVO() {
  const { user } = useAuth();
  const { format: formatPrice } = useCurrency();
  const [step, setStep] = useState(0);
  const utils = trpc.useUtils();

  // Dossier réellement enregistré côté serveur (statut, pièces reçues).
  const dossier = trpc.kyc.myProfile.useQuery(undefined, { enabled: !!user });
  const profilPro = trpc.pro.getProfile.useQuery(undefined, { enabled: !!user });

  const enregistrerProfil = trpc.pro.createProfile.useMutation({
    onSuccess: () => utils.pro.getProfile.invalidate(),
  });
  const envoyerPieces = trpc.kyc.submitDocuments.useMutation({
    onSuccess: () => utils.kyc.myProfile.invalidate(),
  });

  // Paiement de l'abonnement VO (débloque l'accès au VO Pro).
  const checkout = trpc.abonnements.createCheckout.useMutation({
    onSuccess: (r) => { if (r?.url) window.location.href = r.url; },
    onError: (e) => alert(e.message),
  });

  // Étape 1 — Identité dirigeant
  const [dirigeant, setDirigeant] = useState({
    prenom: "", nom: "", dateNaissance: "", nationalite: "", telephone: "",
    email: "", adresse: "", fonction: "",
  });

  // Étape 2 — Société
  const [societe, setSociete] = useState({
    nomCommercial: "", raisonSociale: "", formeJuridique: "", siren: "", siret: "",
    tva: "", adresseSiege: "", adresseEtablissement: "", emailSociete: "",
    telSociete: "", siteWeb: "", activite: "", paysActivite: "France", villeActivite: "",
  });

  // Étapes 1 et 3 — pièces réellement téléversées sur le serveur (/api/upload).
  const [pieces, setPieces] = useState<
    Record<string, { url: string; nom: string; mimeType?: string; taille?: number }>
  >({});

  // Étape 4 — Abonnement
  const [selectedPlan, setSelectedPlan] = useState("vo_premium");

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

  function setD<K extends keyof typeof dirigeant>(k: K, v: string) { setDirigeant((o) => ({ ...o, [k]: v })); }
  function setS<K extends keyof typeof societe>(k: K, v: string) { setSociete((o) => ({ ...o, [k]: v })); }

  if (!user) {
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h1 className="text-xl font-extrabold text-[#111]">Créez d'abord un compte particulier</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Tout utilisateur commence avec un compte particulier MKA.P-MS, puis peut demander l'ouverture d'un compte professionnel VO.
          </p>
          <Link to="/connexion?tab=register" className="btn-primary mt-6 w-full">Créer un compte</Link>
          <Link to="/connexion" className="btn-outline mt-2 w-full">Se connecter</Link>
        </div>
      </div>
    );
  }

  // Champs et pièces réellement manquants — l'envoi est refusé tant qu'il en reste.
  const champsManquants = [
    ...CHAMPS_DIRIGEANT.filter((c) => !dirigeant[c].trim()),
    ...CHAMPS_SOCIETE.filter((c) => !societe[c].trim()),
  ];
  const piecesManquantes = [...PIECES_DIRIGEANT, ...PIECES_SOCIETE].filter(
    (p) => p.obligatoire && !pieces[p.key],
  );

  async function submitDossier() {
    if (champsManquants.length || piecesManquantes.length) return;
    const aEnvoyer = [...PIECES_DIRIGEANT, ...PIECES_SOCIETE, PIECE_LOGO]
      .filter((p) => pieces[p.key])
      .map((p) => ({
        docType: p.docType,
        fileUrl: pieces[p.key].url,
        fileName: p.kycLabel,
        mimeType: pieces[p.key].mimeType,
        sizeBytes: pieces[p.key].taille,
      }));
    try {
      if (!profilPro.data) {
        await enregistrerProfil.mutateAsync({
          activity: "vente_pro",
          companyName: societe.raisonSociale || societe.nomCommercial,
          siret: societe.siret,
          addressLine: societe.adresseSiege,
          city: societe.villeActivite,
          country: societe.paysActivite,
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
    <div className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-[#111]">Devenir Professionnel VO</h1>
      <p className="mt-1 text-sm text-[#6B7280]">Parcours d'inscription sécurisé — étape par étape</p>

      {/* Barre de progression */}
      <div className="mt-6 flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              i === step ? "bg-[#D4AF37] text-white" :
              i < step ? "bg-[#D4AF37]/20 text-[#D4AF37]" :
              "bg-[#F3F4F6] text-[#9CA3AF]"
            }`}>
              {i < step ? <Check size={12} /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-[#D1D5DB]" />}
          </div>
        ))}
      </div>

      <div className="card mt-6 max-w-3xl p-6">

        {/* ═══ ÉTAPE 1: IDENTITÉ DIRIGEANT ═══ */}
        {step === 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#111]"><User size={20} className="text-[#D4AF37]" /> Identité du dirigeant</h3>
            <p className="mt-1 text-xs text-[#6B7280]">Vérification de la personne responsable de la société</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label className="label">Prénom *</label><input className="input" value={dirigeant.prenom} onChange={(e) => setD("prenom", e.target.value)} /></div>
              <div><label className="label">Nom *</label><input className="input" value={dirigeant.nom} onChange={(e) => setD("nom", e.target.value)} /></div>
              <div><label className="label">Date de naissance *</label><input className="input" type="date" value={dirigeant.dateNaissance} onChange={(e) => setD("dateNaissance", e.target.value)} /></div>
              <div><label className="label">Nationalité</label><input className="input" value={dirigeant.nationalite} onChange={(e) => setD("nationalite", e.target.value)} placeholder="Française" /></div>
              <div><label className="label">Téléphone *</label><input className="input" value={dirigeant.telephone} onChange={(e) => setD("telephone", e.target.value)} placeholder="+33 6 ..." /></div>
              <div><label className="label">Email *</label><input className="input" type="email" value={dirigeant.email} onChange={(e) => setD("email", e.target.value)} placeholder={user.email} /></div>
              <div className="sm:col-span-2"><label className="label">Adresse personnelle *</label><input className="input" value={dirigeant.adresse} onChange={(e) => setD("adresse", e.target.value)} /></div>
              <div><label className="label">Fonction dans la société *</label>
                <select className="input" value={dirigeant.fonction} onChange={(e) => setD("fonction", e.target.value)}>
                  <option value="">Choisir…</option>
                  <option value="gerant">Gérant</option>
                  <option value="president">Président</option>
                  <option value="directeur">Directeur général</option>
                  <option value="associe">Associé</option>
                </select>
              </div>
            </div>

            <h4 className="mt-6 flex items-center gap-2 text-sm font-bold text-[#111]"><Upload size={16} className="text-[#D4AF37]" /> Pièces exigées</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {PIECES_DIRIGEANT.map((p) => (
                <div key={p.key} className="rounded-lg border border-dashed border-[#D4AF37]/50 p-4">
                  <label className="block text-xs font-semibold text-[#111]">
                    {p.label}{p.obligatoire ? " *" : ""}
                  </label>
                  <FileUpload
                    label={pieces[p.key] ? "Remplacer la pièce" : "Choisir un fichier"}
                    accept="image/*,.pdf"
                    multiple={false}
                    maxFiles={1}
                    onUploaded={recevoirPiece(p.key)}
                    iaAnalysis
                  />
                  {pieces[p.key] && (
                    <p className="mt-1 text-[10px] text-green-700">
                      Enregistré sur le serveur : {pieces[p.key].nom}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 2: INFORMATIONS SOCIÉTÉ ═══ */}
        {step === 1 && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#111]"><Building2 size={20} className="text-[#D4AF37]" /> Informations société</h3>
            <p className="mt-1 text-xs text-[#6B7280]">Renseignez les informations de votre entreprise</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label className="label">Nom commercial *</label><input className="input" value={societe.nomCommercial} onChange={(e) => setS("nomCommercial", e.target.value)} /></div>
              <div><label className="label">Raison sociale *</label><input className="input" value={societe.raisonSociale} onChange={(e) => setS("raisonSociale", e.target.value)} /></div>
              <div><label className="label">Forme juridique *</label>
                <select className="input" value={societe.formeJuridique} onChange={(e) => setS("formeJuridique", e.target.value)}>
                  <option value="">Choisir…</option>
                  {FORMES_JURIDIQUES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div><label className="label">SIREN *</label><input className="input" value={societe.siren} onChange={(e) => setS("siren", e.target.value)} placeholder="9 chiffres" maxLength={9} /></div>
              <div><label className="label">SIRET *</label><input className="input" value={societe.siret} onChange={(e) => setS("siret", e.target.value)} placeholder="14 chiffres" maxLength={14} /></div>
              <div><label className="label">N° TVA intracommunautaire</label><input className="input" value={societe.tva} onChange={(e) => setS("tva", e.target.value)} placeholder="FR + 11 chiffres" /></div>
              <div className="sm:col-span-2"><label className="label">Adresse siège social *</label><input className="input" value={societe.adresseSiege} onChange={(e) => setS("adresseSiege", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className="label">Adresse établissement</label><input className="input" value={societe.adresseEtablissement} onChange={(e) => setS("adresseEtablissement", e.target.value)} /></div>
              <div><label className="label">Email société *</label><input className="input" type="email" value={societe.emailSociete} onChange={(e) => setS("emailSociete", e.target.value)} /></div>
              <div><label className="label">Téléphone société *</label><input className="input" value={societe.telSociete} onChange={(e) => setS("telSociete", e.target.value)} /></div>
              <div><label className="label">Site internet</label><input className="input" value={societe.siteWeb} onChange={(e) => setS("siteWeb", e.target.value)} placeholder="https://..." /></div>
              <div><label className="label">Activité principale *</label><input className="input" value={societe.activite} onChange={(e) => setS("activite", e.target.value)} placeholder="Commerce automobile" /></div>
              <div><label className="label">Pays d'activité</label><input className="input" value={societe.paysActivite} onChange={(e) => setS("paysActivite", e.target.value)} /></div>
              <div><label className="label">Ville d'activité *</label><input className="input" value={societe.villeActivite} onChange={(e) => setS("villeActivite", e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 3: DOCUMENTS SOCIÉTÉ ═══ */}
        {step === 2 && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#111]"><FileText size={20} className="text-[#D4AF37]" /> Documents société</h3>
            <p className="mt-1 text-xs text-[#6B7280]">Formats acceptés : PDF, JPG, PNG</p>

            <h4 className="mt-4 text-sm font-bold text-[#111]">Pièces exigées</h4>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {PIECES_SOCIETE.filter((p) => p.obligatoire).map((p) => (
                <div key={p.key} className="rounded-lg border border-dashed border-[#D4AF37]/50 p-3">
                  <label className="block text-xs font-semibold text-[#111]">{p.label} *</label>
                  <FileUpload
                    label={pieces[p.key] ? "Remplacer la pièce" : "Choisir un fichier"}
                    accept="image/*,.pdf"
                    multiple={false}
                    maxFiles={1}
                    onUploaded={recevoirPiece(p.key)}
                    iaAnalysis
                  />
                  {pieces[p.key] && (
                    <p className="mt-1 text-[10px] text-green-700">
                      Enregistré sur le serveur : {pieces[p.key].nom}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <h4 className="mt-6 text-sm font-bold text-[#111]">Pièces selon votre situation (facultatives)</h4>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {[...PIECES_SOCIETE.filter((p) => !p.obligatoire), PIECE_LOGO].map((p) => (
                <div key={p.key} className="rounded-lg border border-dashed border-[#E5E7EB] p-3">
                  <label className="block text-xs font-semibold text-[#6B7280]">{p.label}</label>
                  <FileUpload
                    label={pieces[p.key] ? "Remplacer la pièce" : "Choisir un fichier"}
                    accept={p.key === "logo" ? "image/*" : "image/*,.pdf"}
                    multiple={false}
                    maxFiles={1}
                    onUploaded={recevoirPiece(p.key)}
                  />
                  {pieces[p.key] && (
                    <p className="mt-1 text-[10px] text-green-700">
                      Enregistré sur le serveur : {pieces[p.key].nom}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="flex items-center gap-1 text-xs font-semibold text-amber-800">
                <AlertTriangle size={14} /> Contrôle des pièces
              </p>
              <p className="mt-1 text-[10px] text-amber-700">
                Les pièces sont enregistrées sur le serveur puis contrôlées par l'équipe MKA.P-MS
                (lisibilité, date d'émission, cohérence nom / société) avant l'activation du compte.
                Aucun contrôle automatique n'est effectué à l'envoi : un dossier n'est jamais
                déclaré conforme sans lecture humaine.
              </p>
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 4: CHOIX ABONNEMENT ═══ */}
        {step === 3 && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#111]"><CreditCard size={20} className="text-[#D4AF37]" /> Choix abonnement VO</h3>
            <p className="mt-1 text-xs text-[#6B7280]">Choisissez l'abonnement adapté à votre activité</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {VO_PLANS.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => setSelectedPlan(p.code)}
                  className={`flex flex-col rounded-xl border p-4 text-left transition ${
                    selectedPlan === p.code ? "border-[#D4AF37] bg-[#D4AF37]/5 ring-2 ring-[#D4AF37]" :
                    p.highlight ? "border-[#D4AF37]/30" : "border-[#E5E7EB]"
                  } ${p.highlight ? "relative" : ""}`}
                >
                  {p.highlight && (
                    <span className="absolute -top-2 right-3 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[9px] font-bold text-white">Le plus choisi</span>
                  )}
                  <h4 className="text-sm font-extrabold text-[#111]">{p.label}</h4>
                  <div className="mt-1 text-xl font-extrabold text-[#111]">
                    {p.prix ? `${p.prix} €` : "Sur devis"}
                    {p.prix && <span className="text-xs font-normal text-[#6B7280]"> /mois</span>}
                  </div>
                  <p className="mt-1 text-[10px] text-[#D4AF37] font-semibold">Jusqu'à {p.vehicules} véhicules</p>
                  <ul className="mt-2 space-y-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-1 text-[10px] text-[#6B7280]">
                        <Check size={10} className="mt-0.5 shrink-0 text-[#D4AF37]" /> {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ÉTAPE 5: VALIDATION ═══ */}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/10">
              <ShieldCheck size={32} className="text-[#D4AF37]" />
            </div>
            <h3 className="mt-4 text-xl font-extrabold text-[#111]">Dossier envoyé</h3>
            <p className="mt-2 text-sm text-[#6B7280]">
              {envoyerPieces.data
                ? `${envoyerPieces.data.documentsEnregistres} pièce(s) enregistrée(s) sur le serveur.`
                : "Dossier enregistré."}
            </p>

            <div className="mt-6 mx-auto max-w-sm text-left space-y-2">
              {(dossier.data?.documents ?? []).map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-500" />
                  <span className="text-[#111]">{d.fileName ?? d.docType}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-[#D4AF37]" />
                <span className="text-[#D4AF37] font-medium">
                  Dossier {dossier.data?.profile?.status ?? "en_validation"} — en attente du contrôle de l'équipe
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-3 mx-auto max-w-sm text-left">
              <p className="text-xs text-blue-800">
                <b>Prochaines étapes :</b><br />
                1. Contrôle des pièces par l'équipe MKA.P-MS<br />
                2. Décision de validation ou de refus, notifiée dans votre compte<br />
                3. Paiement de l'abonnement<br />
                4. Accès aux services Pro VO
              </p>
              <p className="mt-2 text-[10px] text-blue-600">
                Le suivi du dossier reste visible dans « Mon compte → Validation ».
              </p>
            </div>

            {(() => {
              const plan = VO_PLANS.find((p) => p.code === selectedPlan);
              if (plan?.prix == null) {
                return (
                  <p className="mt-6 text-sm text-[#6B7280]">
                    Offre sur demande : contactez la Direction pour finaliser votre abonnement.
                  </p>
                );
              }
              return (
                <button
                  onClick={() => checkout.mutate({ planCode: selectedPlan })}
                  disabled={checkout.isPending || !user}
                  className="btn-primary mt-6 inline-flex items-center gap-2 disabled:opacity-60"
                >
                  <CreditCard size={16} />
                  {checkout.isPending ? "Redirection…" : `Payer l'abonnement (${formatPrice(plan.prix)}/mois)`}
                </button>
              );
            })()}
            {!user && (
              <p className="mt-3 text-xs text-[#6B7280]">Connectez-vous pour finaliser le paiement.</p>
            )}
            <div className="mt-4">
              <Link to="/compte" className="text-sm font-medium text-[#6B7280] hover:text-[#111]">Retour à mon compte</Link>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
          <div className="mt-6 flex justify-between">
            <button className="btn-outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              ← Précédent
            </button>
            {step < 3 ? (
              <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>
                Suivant →
              </button>
            ) : (
              <button
                className="btn-primary disabled:opacity-60"
                onClick={submitDossier}
                disabled={
                  envoyerPieces.isPending ||
                  enregistrerProfil.isPending ||
                  champsManquants.length > 0 ||
                  piecesManquantes.length > 0
                }
              >
                {envoyerPieces.isPending || enregistrerProfil.isPending
                  ? "Envoi…"
                  : "Soumettre le dossier"}
              </button>
            )}
          </div>
        )}

        {step === 3 && (piecesManquantes.length > 0 || champsManquants.length > 0) && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left">
            {piecesManquantes.length > 0 && (
              <p className="text-xs text-amber-800">
                Pièces obligatoires manquantes : {piecesManquantes.map((p) => p.label).join(", ")}.
              </p>
            )}
            {champsManquants.length > 0 && (
              <p className="mt-1 text-xs text-amber-800">
                Informations obligatoires manquantes : {champsManquants.length} champ(s) aux étapes 1 et 2.
              </p>
            )}
          </div>
        )}

        {(envoyerPieces.error || enregistrerProfil.error) && (
          <p className="mt-3 text-sm text-red-600">
            {envoyerPieces.error?.message ?? enregistrerProfil.error?.message}
          </p>
        )}
      </div>
    </div>
  );
}
