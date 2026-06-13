import { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const TYPE_LABELS: Record<string, string> = {
  declaration_achat: "Déclaration d'achat",
  declaration_cession: "Déclaration de cession",
  changement_titulaire: "Changement de titulaire",
  carte_grise: "Carte grise",
  vehicule_etranger: "Véhicule étranger",
  ww_cpi: "WW / CPI",
  w_garage: "W garage",
  duplicata: "Duplicata",
  correction: "Correction",
  autre: "Autre",
};

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  documents_a_verifier: "Documents à fournir",
  en_verification: "En vérification",
  documents_valides: "Documents validés",
  document_manquant: "Document manquant",
  document_refuse: "Document refusé",
  renvoye: "Renvoyé",
  envoye_agence: "Envoyé à l'agence",
  en_traitement: "En traitement",
  accepte: "Accepté",
  bloque: "Bloqué",
  termine: "Terminé",
  annule: "Annulé",
  archive: "Archivé",
};

const STATUS_COLORS: Record<string, string> = {
  brouillon: "bg-[#F3F4F6] text-[#6B7280]",
  documents_a_verifier: "bg-[#FEF3C7] text-[#92400E]",
  en_verification: "bg-[#DBEAFE] text-[#1E40AF]",
  documents_valides: "bg-[#DCFCE7] text-[#166534]",
  document_manquant: "bg-[#FEE2E2] text-[#991B1B]",
  document_refuse: "bg-[#FEE2E2] text-[#991B1B]",
  envoye_agence: "bg-[#DBEAFE] text-[#1E40AF]",
  en_traitement: "bg-[#DBEAFE] text-[#1E40AF]",
  accepte: "bg-[#DCFCE7] text-[#166534]",
  bloque: "bg-[#FEE2E2] text-[#991B1B]",
  termine: "bg-[#DCFCE7] text-[#166534]",
  annule: "bg-[#F3F4F6] text-[#6B7280]",
};

const CG_STEPS = [
  { key: "documents_a_verifier", label: "Documents", icon: "📄" },
  { key: "en_verification", label: "Vérification", icon: "🔍" },
  { key: "documents_valides", label: "Validés", icon: "✓" },
  { key: "envoye_agence", label: "Agence", icon: "🏢" },
  { key: "en_traitement", label: "Traitement", icon: "⚙" },
  { key: "accepte", label: "Accepté", icon: "👍" },
  { key: "termine", label: "Terminé", icon: "🎉" },
] as const;

function DossierTimeline({ status }: { status: string }) {
  const idx = CG_STEPS.findIndex((s) => s.key === status);
  const activeIdx = idx >= 0 ? idx : -1;
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto py-2">
      {CG_STEPS.map((step, i) => {
        const done = i <= activeIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${done ? "bg-[#D4AF37] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"}`}>
                {step.icon}
              </div>
              <span className={`mt-0.5 text-[9px] ${done ? "font-semibold text-[#111]" : "text-[#9CA3AF]"}`}>{step.label}</span>
            </div>
            {i < CG_STEPS.length - 1 && <div className={`mx-0.5 h-0.5 w-4 ${i < activeIdx ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function CarteGrise() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"mes_dossiers" | "nouveau" | "info" | "agence">("info");

  if (!user) return <div className="p-8 text-center text-[#6B7280]">Connectez-vous pour accéder aux démarches carte grise.</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-[#111]">Démarches Carte Grise / SIV</h1>
      <p className="mb-6 text-[#6B7280]">Déclaration d'achat, cession, changement de titulaire, carte grise, véhicule étranger, WW/CPI, W garage.</p>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-[#E5E7EB]">
        {(["info", "mes_dossiers", "nouveau", "agence"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium ${tab === t ? "border-b-2 border-[#D4AF37] text-[#D4AF37]" : "text-[#6B7280]"}`}>
            {t === "info" ? "Comment ça marche" : t === "mes_dossiers" ? "Mes dossiers" : t === "nouveau" ? "Nouveau dossier" : "Espace agence"}
          </button>
        ))}
      </div>

      {tab === "info" && <InfoTab />}
      {tab === "mes_dossiers" && <MesDossiers />}
      {tab === "nouveau" && <NouveauDossier onDone={() => setTab("mes_dossiers")} />}
      {tab === "agence" && <EspaceAgence />}
    </div>
  );
}

function InfoTab() {
  const steps = [
    { n: "1", title: "Choisissez votre démarche", desc: "Déclaration d'achat, cession, carte grise, véhicule étranger, WW/CPI, W garage..." },
    { n: "2", title: "Envoyez vos documents", desc: "Carte grise, certificat de cession, contrôle technique, pièce d'identité, justificatif de domicile, facture." },
    { n: "3", title: "Vérification automatique", desc: "Le système vérifie la conformité des documents. Si un document manque ou est incorrect, vous êtes notifié immédiatement." },
    { n: "4", title: "Traitement par une agence habilitée", desc: "Votre dossier est traité par une agence professionnelle habilitée SIV partenaire MKA.P-MS." },
    { n: "5", title: "Suivi en temps réel", desc: "Suivez chaque étape de votre dossier : envoyé, en traitement, accepté, terminé. Notifications à chaque changement." },
    { n: "6", title: "Documents finaux", desc: "Recevez votre nouvelle carte grise, certificat de cession, ou CPI directement dans votre espace." },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37] text-lg font-bold text-white">{s.n}</div>
            <h3 className="mb-1 font-bold text-[#111]">{s.title}</h3>
            <p className="text-sm text-[#6B7280]">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-[#FEF3C7] p-5">
        <h3 className="mb-2 font-bold text-[#92400E]">Vous êtes un professionnel ?</h3>
        <p className="text-sm text-[#92400E]">Les agences habilitées SIV peuvent créer un compte professionnel sur MKA.P-MS pour gérer les dossiers carte grise de leurs clients. Abonnements à partir de 29,99 € HT/mois.</p>
      </div>
    </div>
  );
}

function MesDossiers() {
  const { data: dossiers, isLoading } = trpc.carteGrise.mesDossiers.useQuery();
  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement...</div>;
  if (!dossiers?.length) return <div className="py-8 text-center text-[#6B7280]">Aucun dossier carte grise. Créez votre premier dossier.</div>;

  return (
    <div className="space-y-4">
      {dossiers.map((d) => (
        <div key={d.id} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-[#111]">{d.reference}</span>
              <span className="ml-3 text-sm text-[#6B7280]">{TYPE_LABELS[d.type] ?? d.type}</span>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[d.status] ?? "bg-[#F3F4F6] text-[#6B7280]"}`}>
              {STATUS_LABELS[d.status] ?? d.status}
            </span>
          </div>
          <DossierTimeline status={d.status} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {d.immatriculation && <div><span className="text-[#6B7280]">Plaque :</span> {d.immatriculation}</div>}
            {d.marque && <div><span className="text-[#6B7280]">Véhicule :</span> {d.marque} {d.modele}</div>}
            {d.vendeurNom && <div><span className="text-[#6B7280]">Vendeur :</span> {d.vendeurNom}</div>}
            {d.acheteurNom && <div><span className="text-[#6B7280]">Acheteur :</span> {d.acheteurNom}</div>}
          </div>
          <div className="mt-2 text-xs text-[#9CA3AF]">Créé le {new Date(d.dateCreation).toLocaleDateString("fr-FR")}</div>
        </div>
      ))}
    </div>
  );
}

function NouveauDossier({ onDone }: { onDone: () => void }) {
  const utils = trpc.useUtils();
  const create = trpc.carteGrise.createDossier.useMutation({
    onSuccess: () => { utils.carteGrise.mesDossiers.invalidate(); onDone(); },
  });
  const [f, setF] = useState({
    type: "" as string,
    immatriculation: "", vin: "", marque: "", modele: "", annee: "",
    vendeurNom: "", acheteurNom: "", notes: "",
  });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!f.type) return;
      create.mutate({
        type: f.type as any,
        immatriculation: f.immatriculation || undefined,
        vin: f.vin || undefined,
        marque: f.marque || undefined,
        modele: f.modele || undefined,
        annee: f.annee ? Number(f.annee) : undefined,
        vendeurNom: f.vendeurNom || undefined,
        acheteurNom: f.acheteurNom || undefined,
        notes: f.notes || undefined,
      });
    }} className="space-y-4">
      <h2 className="text-xl font-bold text-[#111]">Nouveau dossier Carte Grise</h2>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#374151]">Type de démarche *</label>
        <select value={f.type} onChange={(e) => set("type", e.target.value)} required className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none">
          <option value="">Sélectionnez...</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Immatriculation" value={f.immatriculation} onChange={(v) => set("immatriculation", v)} placeholder="AB-123-CD" />
        <Input label="VIN" value={f.vin} onChange={(v) => set("vin", v)} />
        <Input label="Marque" value={f.marque} onChange={(v) => set("marque", v)} placeholder="Renault" />
        <Input label="Modèle" value={f.modele} onChange={(v) => set("modele", v)} placeholder="Clio" />
        <Input label="Année" value={f.annee} onChange={(v) => set("annee", v)} type="number" placeholder="2022" />
        <Input label="Nom vendeur" value={f.vendeurNom} onChange={(v) => set("vendeurNom", v)} />
        <Input label="Nom acheteur" value={f.acheteurNom} onChange={(v) => set("acheteurNom", v)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#374151]">Notes / commentaires</label>
        <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" />
      </div>
      <button type="submit" disabled={create.isPending || !f.type} className="rounded-lg bg-[#D4AF37] px-8 py-3 font-semibold text-white hover:bg-[#C5A028] disabled:opacity-50">
        {create.isPending ? "Création..." : "Créer le dossier"}
      </button>
    </form>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[#374151]">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" />
    </div>
  );
}

function EspaceAgence() {
  const { data: agence, isLoading } = trpc.carteGrise.monAgence.useQuery();
  const { data: abonnements } = trpc.carteGrise.abonnements.useQuery();
  const { data: packs } = trpc.carteGrise.packs.useQuery();

  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement...</div>;

  if (!agence) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-center">
          <h3 className="mb-2 text-xl font-bold text-[#111]">Vous êtes un professionnel habilité SIV ?</h3>
          <p className="mb-4 text-[#6B7280]">Créez votre agence carte grise sur MKA.P-MS et gérez les dossiers de vos clients en ligne.</p>
          <p className="text-sm text-[#6B7280]">Documents requis : KBIS, identité dirigeant, justificatif de domicile, assurance professionnelle, habilitation SIV.</p>
        </div>
        {/* Abonnements */}
        <h3 className="text-xl font-bold text-[#111]">Abonnements agences</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { nom: "START", prix: "29,99", dossiers: 20, features: ["Tableau de bord", "Messagerie", "Notifications"] },
            { nom: "PREMIUM", prix: "59,99", dossiers: 75, features: ["Gestion équipe", "Statistiques", "Documents clients"] },
            { nom: "ELITE", prix: "99,99", dossiers: 200, features: ["Multi-utilisateurs", "Priorité dossiers", "Rapports avancés"] },
            { nom: "MAX", prix: "149,99", dossiers: 500, features: ["Multi-agences", "Gestion complète", "Support prioritaire"] },
          ].map((p) => (
            <div key={p.nom} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <div className="mb-2 text-lg font-bold text-[#D4AF37]">{p.nom}</div>
              <div className="mb-1 text-2xl font-bold text-[#111]">{p.prix} € <span className="text-sm font-normal text-[#6B7280]">HT/mois</span></div>
              <div className="mb-3 text-sm text-[#6B7280]">{p.dossiers} dossiers/mois</div>
              <ul className="space-y-1 text-sm text-[#374151]">
                {p.features.map((f) => <li key={f}>• {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        {/* Packs crédits */}
        <h3 className="mt-4 text-xl font-bold text-[#111]">Packs crédits</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { nom: "Pack 5", dossiers: 5, prix: "39,99" },
            { nom: "Pack 12", dossiers: 12, prix: "79,99" },
            { nom: "Pack 29", dossiers: 29, prix: "149,99" },
            { nom: "Pack 100", dossiers: 100, prix: "399,99" },
          ].map((p) => (
            <div key={p.nom} className="rounded-xl border border-[#E5E7EB] bg-white p-5 text-center">
              <div className="mb-1 font-bold text-[#111]">{p.nom}</div>
              <div className="mb-1 text-2xl font-bold text-[#D4AF37]">{p.prix} € <span className="text-sm font-normal text-[#6B7280]">HT</span></div>
              <div className="text-sm text-[#6B7280]">{p.dossiers} dossiers</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#111]">{agence.nom}</h3>
            <p className="text-sm text-[#6B7280]">{agence.adresse} — {agence.ville}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${agence.status === "validee" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEF3C7] text-[#92400E]"}`}>
            {agence.status === "validee" ? "Validée" : agence.status === "en_attente" ? "En attente" : agence.status}
          </span>
        </div>
      </div>
      <AgenceDossiers agenceId={agence.id} />
    </div>
  );
}

function AgenceDossiers({ agenceId }: { agenceId: number }) {
  const { data: dossiers, isLoading } = trpc.carteGrise.dossiersPourAgence.useQuery({ agenceId });
  if (isLoading) return <div className="py-4 text-center text-[#6B7280]">Chargement dossiers...</div>;
  if (!dossiers?.length) return <div className="py-4 text-center text-[#6B7280]">Aucun dossier affecté à votre agence.</div>;

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-[#111]">Dossiers reçus ({dossiers.length})</h3>
      {dossiers.map((d) => (
        <div key={d.id} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#111]">{d.reference} — {TYPE_LABELS[d.type]}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status] ?? ""}`}>
              {STATUS_LABELS[d.status]}
            </span>
          </div>
          {d.immatriculation && <div className="mt-1 text-sm text-[#6B7280]">Plaque : {d.immatriculation}</div>}
        </div>
      ))}
    </div>
  );
}
