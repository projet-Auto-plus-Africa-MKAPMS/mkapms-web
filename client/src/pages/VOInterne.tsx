import { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import FileUpload from "../components/FileUpload";

/* ═══════════════════════════════════════════════════════════
   CONSTANTES — 16 ÉTAPES VO
   ═══════════════════════════════════════════════════════════ */
const VO_STEPS = [
  { key: "achat_enregistre", label: "1. Achat", icon: "🛒" },
  { key: "en_cours_transport", label: "2. Transport", icon: "🚚" },
  { key: "vehicule_recu", label: "3. Réception", icon: "📦" },
  { key: "diagnostic_en_cours", label: "4. Diagnostic", icon: "🔍" },
  { key: "devis_interne", label: "5. Devis", icon: "📋" },
  { key: "en_reparation", label: "6. Réparation", icon: "⚙" },
  { key: "preparation_esthetique", label: "7. Lavage", icon: "🧽" },
  { key: "shooting_media", label: "8. Photos", icon: "📸" },
  { key: "historique_verifie", label: "9. Historique", icon: "📄" },
  { key: "en_vente", label: "10. Mise en vente", icon: "🏷" },
  { key: "annonce_publiee", label: "11. Annonce", icon: "📢" },
  { key: "reserve", label: "12. Réservation", icon: "🔒" },
  { key: "dossier_admin", label: "13. Dossier admin", icon: "📁" },
  { key: "livraison", label: "14. Livraison", icon: "🚛" },
  { key: "vendu", label: "15. Comptabilité", icon: "💰" },
  { key: "archive", label: "16. Archivé", icon: "🗂" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  achat_enregistre: "Achat enregistré",
  en_attente_recuperation: "En attente récupération",
  en_cours_transport: "En cours de transport",
  vehicule_recu: "Véhicule réceptionné",
  diagnostic_en_cours: "Diagnostic en cours",
  diagnostic_termine: "Diagnostic terminé",
  devis_interne: "Devis interne",
  en_attente_pieces: "En attente de pièces",
  en_reparation: "En réparation",
  reparation_terminee: "Réparation terminée",
  controle_final: "Contrôle final",
  preparation_esthetique: "Préparation esthétique",
  shooting_media: "Shooting photo/vidéo",
  historique_verifie: "Historique vérifié",
  pret: "Véhicule prêt",
  en_vente: "En vente",
  annonce_publiee: "Annonce publiée",
  reserve: "Réservé",
  dossier_admin: "Dossier administratif",
  livraison: "Livraison en cours",
  en_location: "Disponible location",
  vendu: "Vendu",
  loue: "Loué",
  exporte: "Exporté",
  stock_interne: "Stock interne",
  a_revoir: "À revoir",
  archive: "Archivé",
};

const MODE_ACHAT_LABELS: Record<string, string> = {
  auto1: "Auto1",
  enchere: "Enchères",
  particulier: "Particulier",
  pro: "Professionnel",
  depot_vente: "Reprise client",
  fournisseur: "Fournisseur",
  autre: "Import / Autre",
};

/* ═══════════════════════════════════════════════════════════
   COMPOSANTS UTILITAIRES
   ═══════════════════════════════════════════════════════════ */
function Input({ label, value, onChange, type = "text", placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[#374151]">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" />
    </div>
  );
}

function SectionCard({ title, icon, children, className = "" }: { title: string; icon: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[#E5E7EB] bg-white p-5 ${className}`}>
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#111]">
        <span className="text-xl">{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string | number | null | undefined; color?: string }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center justify-between border-b border-[#F3F4F6] py-2 text-sm last:border-0">
      <span className="text-[#6B7280]">{label}</span>
      <span className={`font-medium ${color ?? "text-[#111]"}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    achat_enregistre: "bg-blue-100 text-blue-700",
    en_cours_transport: "bg-yellow-100 text-yellow-700",
    vehicule_recu: "bg-green-100 text-green-700",
    diagnostic_en_cours: "bg-purple-100 text-purple-700",
    en_reparation: "bg-orange-100 text-orange-700",
    preparation_esthetique: "bg-cyan-100 text-cyan-700",
    en_vente: "bg-[#FEF3C7] text-[#92400E]",
    vendu: "bg-green-100 text-green-700",
    archive: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status] ?? "bg-[#FEF3C7] text-[#92400E]"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   TIMELINE 16 ÉTAPES
   ═══════════════════════════════════════════════════════════ */
function StatusTimeline({ status, onStepClick }: { status: string; onStepClick?: (step: string) => void }) {
  const idx = VO_STEPS.findIndex((s) => s.key === status);
  const activeIdx = idx >= 0 ? idx : -1;
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto py-2">
      {VO_STEPS.map((step, i) => {
        const done = i <= activeIdx;
        const current = i === activeIdx;
        return (
          <div key={step.key} className="flex items-center">
            <button
              type="button"
              onClick={() => onStepClick?.(step.key)}
              className="flex flex-col items-center"
              title={step.label}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition
                ${current ? "bg-[#D4AF37] text-white ring-2 ring-[#D4AF37]/30" : done ? "bg-[#D4AF37] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"}`}>
                {step.icon}
              </div>
              <span className={`mt-0.5 w-12 text-center text-[8px] leading-tight ${done ? "font-semibold text-[#111]" : "text-[#9CA3AF]"}`}>
                {step.label}
              </span>
            </button>
            {i < VO_STEPS.length - 1 && <div className={`mx-0.5 h-0.5 w-3 ${i < activeIdx ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} />}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════════════════════ */
export default function VOInterne() {
  const { user, isSessionLoading } = useAuth();
  const [tab, setTab] = useState<"liste" | "nouveau" | "stats">("liste");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (isSessionLoading) return <div className="p-8 text-center text-[#6B7280]">Chargement...</div>;
  if (!user) return <div className="p-8 text-center text-[#6B7280]">Connectez-vous pour accéder au module VO.</div>;

  if (selectedId) {
    return <VODetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-[#111]">VO Interne MKA.P-MS</h1>
      <p className="mb-6 text-[#6B7280]">
        Gestion complète des véhicules d'occasion — 16 étapes : Achat → Transport → Réception → Diagnostic → Devis → Réparation → Lavage → Photos → Historique → Mise en vente → Annonce → Réservation → Dossier admin → Livraison → Comptabilité → Archivage
      </p>

      <div className="mb-6 flex gap-2 border-b border-[#E5E7EB]">
        {(["liste", "nouveau", "stats"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium ${tab === t ? "border-b-2 border-[#D4AF37] text-[#D4AF37]" : "text-[#6B7280]"}`}>
            {t === "liste" ? "Mes véhicules" : t === "nouveau" ? "Nouvel achat" : "Tableau de bord"}
          </button>
        ))}
      </div>

      {tab === "liste" && <VOListe onSelect={setSelectedId} />}
      {tab === "nouveau" && <VOForm onDone={() => setTab("liste")} />}
      {tab === "stats" && <VOStats />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LISTE DES VÉHICULES VO
   ═══════════════════════════════════════════════════════════ */
function VOListe({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: vehicules, isLoading } = trpc.vo.list.useQuery({});
  const [filterStatus, setFilterStatus] = useState("");

  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement...</div>;
  if (!vehicules?.length) return <div className="py-8 text-center text-[#6B7280]">Aucun véhicule VO enregistré.</div>;

  const filtered = filterStatus ? vehicules.filter((v) => v.status === filterStatus) : vehicules;

  return (
    <div>
      {/* Filtre par statut */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setFilterStatus("")} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${!filterStatus ? "bg-[#D4AF37] text-white" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
          Tous ({vehicules.length})
        </button>
        {["achat_enregistre", "en_cours_transport", "diagnostic_en_cours", "en_reparation", "preparation_esthetique", "en_vente", "vendu", "archive"].map((s) => {
          const count = vehicules.filter((v) => v.status === s).length;
          if (!count) return null;
          return (
            <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filterStatus === s ? "bg-[#D4AF37] text-white" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
              {STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {filtered.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className="w-full rounded-xl border border-[#E5E7EB] bg-white p-5 text-left transition hover:border-[#D4AF37] hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-[#111]">{v.marque} {v.modele}</span>
                {v.version && <span className="ml-2 text-sm text-[#6B7280]">{v.version}</span>}
                {v.annee && <span className="ml-2 text-sm text-[#9CA3AF]">({v.annee})</span>}
              </div>
              <StatusBadge status={v.status} />
            </div>
            <StatusTimeline status={v.status} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {v.immatriculation && <div><span className="text-[#6B7280]">Plaque :</span> {v.immatriculation}</div>}
              {v.kilometrage != null && <div><span className="text-[#6B7280]">Km :</span> {Number(v.kilometrage).toLocaleString()}</div>}
              {v.prixAchat != null && <div><span className="text-[#6B7280]">Achat :</span> {Number(v.prixAchat).toLocaleString()} €</div>}
              {v.prixVente != null && <div><span className="text-[#6B7280]">Vente :</span> {Number(v.prixVente).toLocaleString()} €</div>}
              {v.modeAchat && <div><span className="text-[#6B7280]">Source :</span> {MODE_ACHAT_LABELS[v.modeAchat] ?? v.modeAchat}</div>}
              {v.fournisseur && <div><span className="text-[#6B7280]">Fournisseur :</span> {v.fournisseur}</div>}
              {v.coutTotal != null && Number(v.coutTotal) > 0 && <div><span className="text-[#6B7280]">Coût total :</span> {Number(v.coutTotal).toLocaleString()} €</div>}
              {v.margeNette != null && <div className={Number(v.margeNette) >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}><span className="text-[#6B7280]">Marge :</span> {Number(v.margeNette).toLocaleString()} €</div>}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#9CA3AF]">
              <span>VO-{v.id} — {new Date(v.createdAt).toLocaleDateString("fr-FR")}</span>
              <span className="font-medium text-[#D4AF37]">Voir le dossier →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DÉTAIL D'UN VÉHICULE VO — 16 ÉTAPES
   ═══════════════════════════════════════════════════════════ */
function VODetail({ id, onBack }: { id: number; onBack: () => void }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.vo.detail.useQuery({ id });
  const updateStatus = trpc.vo.updateStatus.useMutation({ onSuccess: () => utils.vo.detail.invalidate({ id }) });
  const updateTransport = trpc.vo.updateTransport.useMutation({ onSuccess: () => utils.vo.detail.invalidate({ id }) });
  const updateReception = trpc.vo.updateReception.useMutation({ onSuccess: () => utils.vo.detail.invalidate({ id }) });
  const addDocument = trpc.vo.addDocument.useMutation({ onSuccess: () => utils.vo.detail.invalidate({ id }) });
  const addDiagnostic = trpc.vo.addDiagnostic.useMutation({ onSuccess: () => utils.vo.detail.invalidate({ id }) });
  const addReparation = trpc.vo.addReparation.useMutation({ onSuccess: () => utils.vo.detail.invalidate({ id }) });
  const addLavage = trpc.vo.addLavage.useMutation({ onSuccess: () => utils.vo.detail.invalidate({ id }) });
  const setDestination = trpc.vo.setDestination.useMutation({ onSuccess: () => utils.vo.detail.invalidate({ id }) });
  const enregistrerVente = trpc.vo.enregistrerVente.useMutation({ onSuccess: () => utils.vo.detail.invalidate({ id }) });

  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement du dossier...</div>;
  if (!data) return <div className="py-8 text-center text-[#DC2626]">Véhicule introuvable.</div>;

  const v = data.vehicule;

  const tabs = [
    { key: "overview", label: "Vue d'ensemble" },
    { key: "achat", label: "1. Achat" },
    { key: "transport", label: "2. Transport" },
    { key: "reception", label: "3. Réception" },
    { key: "diagnostic", label: "4. Diagnostic" },
    { key: "devis", label: "5. Devis" },
    { key: "reparation", label: "6. Réparation" },
    { key: "lavage", label: "7. Lavage" },
    { key: "shooting", label: "8. Photos/Vidéo" },
    { key: "historique", label: "9. Historique" },
    { key: "vente", label: "10. Mise en vente" },
    { key: "annonce", label: "11. Annonce" },
    { key: "reservation", label: "12. Réservation" },
    { key: "dossier_admin", label: "13. Dossier admin" },
    { key: "livraison", label: "14. Livraison" },
    { key: "comptabilite", label: "15. Comptabilité" },
    { key: "archivage", label: "16. Archivage" },
    { key: "documents", label: "📎 Documents" },
    { key: "historique_etapes", label: "📜 Historique" },
  ];

  function advanceStatus(newStatus: string, commentaire?: string) {
    updateStatus.mutate({ id, status: newStatus as any, commentaire });
  }

  function uploadDoc(category: string, etape: string) {
    return (files: { url: string; originalName: string }[]) => {
      files.forEach((f) => {
        addDocument.mutate({
          vehiculeId: id,
          category: category as any,
          etape,
          nom: f.originalName,
          url: f.url,
        });
      });
    };
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-[#D4AF37] hover:underline">
        ← Retour à la liste
      </button>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">
            VO-{v.id} — {v.marque} {v.modele} {v.version ?? ""} {v.annee ? `(${v.annee})` : ""}
          </h1>
          <p className="text-sm text-[#6B7280]">
            {v.immatriculation && `${v.immatriculation} · `}
            {v.vin && `VIN: ${v.vin} · `}
            Créé le {new Date(v.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <StatusBadge status={v.status} />
      </div>

      {/* Timeline */}
      <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <StatusTimeline status={v.status} onStepClick={(step) => {
          const tabMap: Record<string, string> = {
            achat_enregistre: "achat", en_cours_transport: "transport", vehicule_recu: "reception",
            diagnostic_en_cours: "diagnostic", devis_interne: "devis", en_reparation: "reparation",
            preparation_esthetique: "lavage", shooting_media: "shooting", historique_verifie: "historique",
            en_vente: "vente", annonce_publiee: "annonce", reserve: "reservation",
            dossier_admin: "dossier_admin", livraison: "livraison", vendu: "comptabilite", archive: "archivage",
          };
          setActiveTab(tabMap[step] ?? "overview");
        }} />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeTab === t.key ? "bg-[#D4AF37] text-white shadow-sm" : "text-[#6B7280] hover:text-[#111]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <TabOverview v={v} data={data} />
        )}

        {activeTab === "achat" && (
          <SectionCard title="Étape 1 — Achat du véhicule" icon="🛒">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Source" value={MODE_ACHAT_LABELS[v.modeAchat ?? ""] ?? v.modeAchat} />
              <InfoRow label="Fournisseur" value={v.fournisseur} />
              <InfoRow label="Prix d'achat" value={v.prixAchat ? `${Number(v.prixAchat).toLocaleString()} €` : null} />
              <InfoRow label="Date d'achat" value={v.dateAchat ? new Date(v.dateAchat).toLocaleDateString("fr-FR") : null} />
              <InfoRow label="Lieu d'achat" value={v.lieuAchat} />
              <InfoRow label="Plaque" value={v.immatriculation} />
              <InfoRow label="VIN" value={v.vin} />
              <InfoRow label="Kilométrage" value={v.kilometrage ? `${Number(v.kilometrage).toLocaleString()} km` : null} />
              <InfoRow label="Énergie" value={v.carburant} />
              <InfoRow label="Boîte" value={v.boiteVitesse} />
              <InfoRow label="Couleur" value={v.couleur} />
              <InfoRow label="Puissance" value={v.puissance} />
            </div>
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-[#374151]">Documents achat :</p>
              <FileUpload label="Facture, bon de commande, carte grise, CT, expertise..." accept="image/*,.pdf" multiple onUploaded={uploadDoc("facture_achat", "achat")} iaAnalysis />
              <DocList docs={data.documents.filter((d) => ["facture_achat", "bon_commande", "carte_grise", "controle_technique"].includes(d.category))} />
            </div>
            {v.status === "achat_enregistre" && (
              <button type="button" onClick={() => advanceStatus("en_cours_transport", "Véhicule envoyé en transport")} className="btn-gold mt-4">
                Passer à l'étape Transport →
              </button>
            )}
          </SectionCard>
        )}

        {activeTab === "transport" && (
          <TabTransport v={v} id={id} updateTransport={updateTransport} advanceStatus={advanceStatus} uploadDoc={uploadDoc} docs={data.documents} />
        )}

        {activeTab === "reception" && (
          <TabReception v={v} id={id} updateReception={updateReception} advanceStatus={advanceStatus} uploadDoc={uploadDoc} docs={data.documents} />
        )}

        {activeTab === "diagnostic" && (
          <TabDiagnostic id={id} diagnostics={data.diagnostics} addDiagnostic={addDiagnostic} advanceStatus={advanceStatus} v={v} uploadDoc={uploadDoc} docs={data.documents} />
        )}

        {activeTab === "devis" && (
          <SectionCard title="Étape 5 — Devis interne" icon="📋">
            <p className="text-sm text-[#6B7280]">Création du devis interne basé sur le diagnostic. Liaison directe avec le stock pièces et les fournisseurs.</p>
            <div className="mt-4 rounded-lg bg-[#FFFBEB] p-4 text-sm text-[#92400E]">
              Les pièces nécessaires sont listées dans le diagnostic. Le devis est validé par le Directeur ou Super Admin avant les réparations.
            </div>
            <FileUpload label="Ajouter un devis interne" accept="image/*,.pdf" multiple onUploaded={uploadDoc("devis_interne", "devis")} iaAnalysis />
            <DocList docs={data.documents.filter((d) => d.category === "devis_interne")} />
            {["diagnostic_en_cours", "diagnostic_termine", "devis_interne"].includes(v.status) && (
              <button type="button" onClick={() => advanceStatus("en_reparation", "Devis validé, début des réparations")} className="btn-gold mt-4">
                Valider le devis → Passer en réparation
              </button>
            )}
          </SectionCard>
        )}

        {activeTab === "reparation" && (
          <TabReparation id={id} reparations={data.reparations} addReparation={addReparation} advanceStatus={advanceStatus} v={v} uploadDoc={uploadDoc} docs={data.documents} />
        )}

        {activeTab === "lavage" && (
          <TabLavage id={id} lavages={data.lavages} addLavage={addLavage} advanceStatus={advanceStatus} v={v} uploadDoc={uploadDoc} docs={data.documents} />
        )}

        {activeTab === "shooting" && (
          <SectionCard title="Étape 8 — Shooting photo / vidéo" icon="📸">
            <p className="mb-4 text-sm text-[#6B7280]">
              Photos obligatoires : Avant, Arrière, Profil gauche, Profil droit, Tableau de bord, Coffre, Moteur, Intérieur.
              Vidéo : Présentation véhicule, Démarrage moteur.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-[#374151]">Photos véhicule (illimité)</p>
                <FileUpload label="Ajouter des photos" accept="image/*" multiple maxFiles={50} onUploaded={uploadDoc("photo_apres_reparation", "shooting")} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-[#374151]">Vidéos</p>
                <FileUpload label="Ajouter des vidéos" accept="video/*" multiple maxFiles={5} onUploaded={uploadDoc("autre", "shooting_video")} />
              </div>
            </div>
            <DocList docs={data.documents.filter((d) => ["photo_apres_reparation", "autre"].includes(d.category) && (d.etape === "shooting" || d.etape === "shooting_video"))} />
            {["preparation_esthetique", "shooting_media"].includes(v.status) && (
              <button type="button" onClick={() => advanceStatus("en_vente", "Médias validés, véhicule prêt pour la vente")} className="btn-gold mt-4">
                Médias validés → Mise en vente
              </button>
            )}
          </SectionCard>
        )}

        {activeTab === "historique" && (
          <SectionCard title="Étape 9 — Historique véhicule" icon="📄">
            <p className="mb-4 text-sm text-[#6B7280]">
              Vérification complète de l'historique : kilométrage, sinistres, contrôles techniques, entretiens, propriétaires précédents.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Kilométrage vérifié", "Sinistres", "Contrôles techniques", "Entretiens", "Propriétaires", "Vol / Gage"].map((item) => (
                <div key={item} className="rounded-lg border border-[#E5E7EB] p-3 text-center text-sm font-medium text-[#374151]">
                  {item}
                </div>
              ))}
            </div>
            <FileUpload label="Ajouter le rapport d'historique" accept="image/*,.pdf" multiple onUploaded={uploadDoc("rapport_diagnostic", "historique")} iaAnalysis />
            <DocList docs={data.documents.filter((d) => d.etape === "historique")} />
          </SectionCard>
        )}

        {activeTab === "vente" && (
          <TabMiseEnVente id={id} v={v} setDestination={setDestination} />
        )}

        {activeTab === "annonce" && (
          <SectionCard title="Étape 11 — Annonce" icon="📢">
            <p className="mb-4 text-sm text-[#6B7280]">
              L'annonce est publiée avec : prix, photos, vidéo, historique, rapport atelier, contrôle qualité MKA.P-MS.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {["Acheter", "Réserver", "Faire une offre", "Demander financement", "Demander livraison"].map((btn) => (
                <div key={btn} className="rounded-lg border border-[#D4AF37] bg-[#FFFBEB] p-3 text-center text-sm font-semibold text-[#92400E]">
                  {btn}
                </div>
              ))}
            </div>
            {v.prixVente && (
              <div className="mt-4 text-center">
                <span className="text-3xl font-bold text-[#D4AF37]">{Number(v.prixVente).toLocaleString()} €</span>
              </div>
            )}
          </SectionCard>
        )}

        {activeTab === "reservation" && (
          <SectionCard title="Étape 12 — Réservation" icon="🔒">
            <p className="mb-4 text-sm text-[#6B7280]">Le client réserve le véhicule avec un acompte ou un paiement total.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#E5E7EB] p-4 text-center">
                <p className="text-sm font-semibold text-[#374151]">Acompte</p>
                <p className="text-xs text-[#6B7280]">Réservation partielle</p>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] p-4 text-center">
                <p className="text-sm font-semibold text-[#374151]">Paiement total</p>
                <p className="text-xs text-[#6B7280]">Achat direct</p>
              </div>
            </div>
          </SectionCard>
        )}

        {activeTab === "dossier_admin" && (
          <SectionCard title="Étape 13 — Dossier administratif" icon="📁">
            <p className="mb-4 text-sm text-[#6B7280]">Documents de vente : certificat de cession, facture, carte grise, contrôle technique.</p>
            <FileUpload label="Ajouter des documents administratifs" accept="image/*,.pdf" multiple onUploaded={uploadDoc("certificat_cession", "dossier_admin")} iaAnalysis />
            <DocList docs={data.documents.filter((d) => ["certificat_cession", "facture_vente", "contrat_vente", "piece_identite_acheteur"].includes(d.category))} />
            <div className="mt-4 rounded-lg bg-[#F0FDF4] p-3 text-sm text-[#166534]">
              Transmission automatique : Comptabilité, Carte grise, Client
            </div>
          </SectionCard>
        )}

        {activeTab === "livraison" && (
          <SectionCard title="Étape 14 — Livraison" icon="🚛">
            <p className="mb-4 text-sm text-[#6B7280]">Choix du mode de livraison par le client.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Retrait sur place", desc: "Le client vient chercher le véhicule" },
                { label: "Livraison domicile", desc: "Livraison à l'adresse du client" },
                { label: "Livraison port Afrique", desc: "Export vers un port africain" },
                { label: "Entrepôt MKA.P-MS", desc: "Livraison dans un entrepôt MKA.P-MS" },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-[#E5E7EB] p-4">
                  <p className="font-semibold text-[#111]">{m.label}</p>
                  <p className="text-xs text-[#6B7280]">{m.desc}</p>
                </div>
              ))}
            </div>
            <FileUpload label="Documents livraison" accept="image/*,.pdf" multiple onUploaded={uploadDoc("bon_livraison", "livraison")} iaAnalysis />
            <DocList docs={data.documents.filter((d) => ["bon_livraison", "bon_enlevement"].includes(d.category))} />
          </SectionCard>
        )}

        {activeTab === "comptabilite" && (
          <TabComptabilite v={v} enregistrerVente={enregistrerVente} id={id} />
        )}

        {activeTab === "archivage" && (
          <SectionCard title="Étape 16 — Archivage" icon="🗂">
            <p className="mb-4 text-sm text-[#6B7280]">
              Le véhicule passe dans l'historique avec conservation complète : documents, photos, contrats, factures, historique complet.
            </p>
            {v.status !== "archive" && (
              <button type="button" onClick={() => advanceStatus("archive", "Dossier archivé")} className="btn-gold">
                Archiver ce véhicule
              </button>
            )}
            {v.status === "archive" && (
              <div className="rounded-lg bg-[#F0FDF4] p-4 text-sm font-semibold text-[#166534]">
                Ce véhicule est archivé. Tous les documents et l'historique sont conservés.
              </div>
            )}
          </SectionCard>
        )}

        {activeTab === "documents" && (
          <SectionCard title="Tous les documents" icon="📎">
            <FileUpload label="Ajouter un document" accept="image/*,.pdf,.doc,.docx" multiple onUploaded={uploadDoc("autre", "general")} iaAnalysis />
            <DocList docs={data.documents} />
          </SectionCard>
        )}

        {activeTab === "historique_etapes" && (
          <SectionCard title="Historique des étapes" icon="📜">
            {data.etapes.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Aucune étape enregistrée.</p>
            ) : (
              <div className="space-y-3">
                {data.etapes.map((e, i) => (
                  <div key={i} className="flex gap-3 border-b border-[#F3F4F6] pb-3 last:border-0">
                    <div className="mt-1 h-3 w-3 rounded-full bg-[#D4AF37]" />
                    <div>
                      <p className="text-sm font-semibold text-[#111]">{e.statusLabel}</p>
                      {e.commentaire && <p className="text-xs text-[#6B7280]">{e.commentaire}</p>}
                      <p className="text-xs text-[#9CA3AF]">
                        {e.responsable && `${e.responsable} · `}
                        {new Date(e.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB COMPOSANTS DÉTAIL
   ═══════════════════════════════════════════════════════════ */
function DocList({ docs }: { docs: { id: number; nom: string; url: string; category: string; createdAt: Date }[] }) {
  if (!docs.length) return <p className="mt-2 text-xs text-[#9CA3AF]">Aucun document pour cette étape.</p>;
  return (
    <div className="mt-3 space-y-1">
      {docs.map((d) => (
        <a key={d.id} href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] p-2 text-sm hover:bg-[#F9FAFB]">
          {d.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <img src={d.url} alt="" className="h-8 w-8 rounded object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded bg-[#F3F4F6] text-[10px] font-bold text-[#6B7280]">PDF</span>
          )}
          <span className="flex-1 truncate text-[#374151]">{d.nom}</span>
          <span className="text-xs text-[#9CA3AF]">{new Date(d.createdAt).toLocaleDateString("fr-FR")}</span>
        </a>
      ))}
    </div>
  );
}

function TabOverview({ v, data }: { v: any; data: any }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Informations véhicule" icon="🚗">
        <InfoRow label="Marque / Modèle" value={`${v.marque} ${v.modele} ${v.version ?? ""}`} />
        <InfoRow label="Année" value={v.annee} />
        <InfoRow label="Plaque" value={v.immatriculation} />
        <InfoRow label="VIN" value={v.vin} />
        <InfoRow label="Kilométrage" value={v.kilometrage ? `${Number(v.kilometrage).toLocaleString()} km` : null} />
        <InfoRow label="Énergie" value={v.carburant} />
        <InfoRow label="Boîte" value={v.boiteVitesse} />
        <InfoRow label="Couleur" value={v.couleur} />
        <InfoRow label="Puissance" value={v.puissance} />
      </SectionCard>

      <SectionCard title="Financier" icon="💰">
        <InfoRow label="Prix d'achat" value={v.prixAchat ? `${Number(v.prixAchat).toLocaleString()} €` : null} />
        <InfoRow label="Coût transport" value={v.coutTransport ? `${Number(v.coutTransport).toLocaleString()} €` : null} />
        <InfoRow label="Coût réparations" value={v.coutReparation ? `${Number(v.coutReparation).toLocaleString()} €` : null} />
        <InfoRow label="Coût pièces" value={v.coutPieces ? `${Number(v.coutPieces).toLocaleString()} €` : null} />
        <InfoRow label="Coût lavage" value={v.coutLavage ? `${Number(v.coutLavage).toLocaleString()} €` : null} />
        <InfoRow label="Coût total" value={v.coutTotal ? `${Number(v.coutTotal).toLocaleString()} €` : null} color="text-[#DC2626]" />
        <InfoRow label="Prix de vente" value={v.prixVente ? `${Number(v.prixVente).toLocaleString()} €` : null} color="text-[#D4AF37]" />
        <InfoRow label="Marge brute" value={v.margeBrute ? `${Number(v.margeBrute).toLocaleString()} €` : null} color={Number(v.margeBrute ?? 0) >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"} />
        <InfoRow label="Marge nette" value={v.margeNette ? `${Number(v.margeNette).toLocaleString()} €` : null} color={Number(v.margeNette ?? 0) >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"} />
      </SectionCard>

      <SectionCard title="Documents" icon="📎" className="lg:col-span-2">
        <p className="mb-2 text-sm text-[#6B7280]">{data.documents.length} document(s) enregistré(s)</p>
        <DocList docs={data.documents.slice(0, 10)} />
      </SectionCard>
    </div>
  );
}

function TabTransport({ v, id, updateTransport, advanceStatus, uploadDoc, docs }: any) {
  const [f, setF] = useState({ coutTransport: "", transporteur: "", adresseDepart: "", adresseArrivee: "", dateRecup: "", responsable: "" });
  return (
    <SectionCard title="Étape 2 — Transport" icon="🚚">
      <p className="mb-4 text-sm text-[#6B7280]">Modes : Convoyage, Dépanneuse, Transporteur partenaire, Livraison Auto1</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoRow label="Transporteur" value={v.transporteur} />
        <InfoRow label="Coût transport" value={v.coutTransport ? `${Number(v.coutTransport).toLocaleString()} €` : null} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Transporteur" value={f.transporteur} onChange={(val) => setF({ ...f, transporteur: val })} />
        <Input label="Coût transport (€)" value={f.coutTransport} onChange={(val) => setF({ ...f, coutTransport: val })} type="number" />
        <Input label="Adresse départ" value={f.adresseDepart} onChange={(val) => setF({ ...f, adresseDepart: val })} />
        <Input label="Adresse arrivée" value={f.adresseArrivee} onChange={(val) => setF({ ...f, adresseArrivee: val })} />
        <Input label="Date récupération prévue" value={f.dateRecup} onChange={(val) => setF({ ...f, dateRecup: val })} type="date" />
        <Input label="Responsable transport" value={f.responsable} onChange={(val) => setF({ ...f, responsable: val })} />
      </div>
      <button type="button" className="btn-outline mt-3 !text-sm" onClick={() => {
        updateTransport.mutate({
          id,
          coutTransport: f.coutTransport ? Number(f.coutTransport) : undefined,
          transporteur: f.transporteur || undefined,
          adresseDepart: f.adresseDepart || undefined,
          adresseArrivee: f.adresseArrivee || undefined,
          dateRecupPrevue: f.dateRecup || undefined,
          responsableTransport: f.responsable || undefined,
        });
      }}>
        Enregistrer les infos transport
      </button>
      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-[#374151]">Photos départ / arrivée :</p>
        <FileUpload label="Photos transport" accept="image/*" multiple onUploaded={uploadDoc("photo_achat", "transport")} iaAnalysis />
        <DocList docs={docs.filter((d: any) => d.etape === "transport")} />
      </div>
      {v.status === "en_cours_transport" && (
        <button type="button" onClick={() => advanceStatus("vehicule_recu", "Véhicule arrivé")} className="btn-gold mt-4">
          Véhicule arrivé → Passer à la Réception
        </button>
      )}
    </SectionCard>
  );
}

function TabReception({ v, id, updateReception, advanceStatus, uploadDoc, docs }: any) {
  const [f, setF] = useState({ km: "", carburant: "", carrosserie: "", interieur: "" });
  return (
    <SectionCard title="Étape 3 — Réception" icon="📦">
      <p className="mb-4 text-sm text-[#6B7280]">Contrôle : Carrosserie, Pneus, Éclairage, Moteur, Intérieur, Documents</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Kilométrage réception" value={f.km} onChange={(val) => setF({ ...f, km: val })} type="number" />
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Niveau carburant</label>
          <select value={f.carburant} onChange={(e) => setF({ ...f, carburant: e.target.value })} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm">
            <option value="">—</option>
            <option value="plein">Plein</option>
            <option value="3/4">3/4</option>
            <option value="1/2">1/2</option>
            <option value="1/4">1/4</option>
            <option value="reserve">Réserve</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">État carrosserie</label>
          <select value={f.carrosserie} onChange={(e) => setF({ ...f, carrosserie: e.target.value })} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm">
            <option value="">—</option>
            <option value="excellent">Excellent</option>
            <option value="bon">Bon</option>
            <option value="moyen">Moyen</option>
            <option value="a_reparer">À réparer</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">État intérieur</label>
          <select value={f.interieur} onChange={(e) => setF({ ...f, interieur: e.target.value })} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm">
            <option value="">—</option>
            <option value="excellent">Excellent</option>
            <option value="bon">Bon</option>
            <option value="moyen">Moyen</option>
            <option value="a_nettoyer">À nettoyer</option>
          </select>
        </div>
      </div>
      <button type="button" className="btn-outline mt-3 !text-sm" onClick={() => {
        updateReception.mutate({
          id,
          kilometrageReception: f.km ? Number(f.km) : undefined,
          niveauCarburant: f.carburant || undefined,
          etatCarrosserie: f.carrosserie || undefined,
          etatInterieur: f.interieur || undefined,
        });
      }}>
        Enregistrer la réception
      </button>
      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-[#374151]">Photos obligatoires : Avant, Arrière, Côtés, Intérieur, Compteur</p>
        <FileUpload label="Photos réception" accept="image/*" multiple onUploaded={uploadDoc("photo_achat", "reception")} iaAnalysis />
        <DocList docs={docs.filter((d: any) => d.etape === "reception")} />
      </div>
      {v.status === "vehicule_recu" && (
        <button type="button" onClick={() => advanceStatus("diagnostic_en_cours", "Réception validée, diagnostic lancé")} className="btn-gold mt-4">
          Réception validée → Passer au Diagnostic
        </button>
      )}
    </SectionCard>
  );
}

function TabDiagnostic({ id, diagnostics, addDiagnostic, advanceStatus, v, uploadDoc, docs }: any) {
  const [f, setF] = useState({ categorie: "", resultat: "ok" as const, detail: "" });
  return (
    <SectionCard title="Étape 4 — Diagnostic atelier" icon="🔍">
      <p className="mb-4 text-sm text-[#6B7280]">Diagnostic électronique, mécanique, sécurité, carrosserie → Liste des réparations et pièces nécessaires.</p>
      {diagnostics.length > 0 && (
        <div className="mb-4 space-y-2">
          {diagnostics.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-3 text-sm">
              <div>
                <span className="font-medium text-[#111]">{d.categorie}</span>
                {d.detail && <span className="ml-2 text-[#6B7280]">— {d.detail}</span>}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                d.resultat === "ok" ? "bg-green-100 text-green-700"
                : d.resultat === "a_reparer" ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
              }`}>
                {d.resultat === "ok" ? "OK" : d.resultat === "a_reparer" ? "À réparer" : d.resultat === "a_controler" ? "À contrôler" : "Pièce à commander"}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Catégorie</label>
          <select value={f.categorie} onChange={(e) => setF({ ...f, categorie: e.target.value })} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm">
            <option value="">Sélectionner</option>
            <option value="Diagnostic électronique">Diagnostic électronique</option>
            <option value="Contrôle mécanique">Contrôle mécanique</option>
            <option value="Contrôle sécurité">Contrôle sécurité</option>
            <option value="Contrôle carrosserie">Contrôle carrosserie</option>
            <option value="Freinage">Freinage</option>
            <option value="Pneus">Pneus</option>
            <option value="Éclairage">Éclairage</option>
            <option value="Moteur">Moteur</option>
            <option value="Boîte de vitesse">Boîte de vitesse</option>
            <option value="Climatisation">Climatisation</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Résultat</label>
          <select value={f.resultat} onChange={(e) => setF({ ...f, resultat: e.target.value as any })} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm">
            <option value="ok">OK</option>
            <option value="a_reparer">À réparer</option>
            <option value="a_controler">À contrôler</option>
            <option value="piece_a_commander">Pièce à commander</option>
          </select>
        </div>
        <Input label="Détail" value={f.detail} onChange={(val) => setF({ ...f, detail: val })} placeholder="Description..." />
      </div>
      <button type="button" className="btn-outline mt-3 !text-sm" disabled={!f.categorie} onClick={() => {
        addDiagnostic.mutate({ vehiculeId: id, categorie: f.categorie, resultat: f.resultat, detail: f.detail || undefined });
        setF({ categorie: "", resultat: "ok", detail: "" });
      }}>
        Ajouter un point de diagnostic
      </button>
      <div className="mt-4">
        <FileUpload label="Photos / rapport diagnostic" accept="image/*,.pdf" multiple onUploaded={uploadDoc("rapport_diagnostic", "diagnostic")} iaAnalysis />
        <DocList docs={docs.filter((d: any) => d.etape === "diagnostic")} />
      </div>
      {["diagnostic_en_cours", "diagnostic_termine"].includes(v.status) && (
        <button type="button" onClick={() => advanceStatus("en_reparation", "Diagnostic terminé, passage en réparation")} className="btn-gold mt-4">
          Diagnostic terminé → Passer en Réparation
        </button>
      )}
    </SectionCard>
  );
}

function TabReparation({ id, reparations, addReparation, advanceStatus, v, uploadDoc, docs }: any) {
  const [f, setF] = useState({ prestation: "", mecanicien: "", pieces: "", coutPieces: "", coutMO: "" });
  return (
    <SectionCard title="Étape 6 — Réparation" icon="⚙">
      <p className="mb-4 text-sm text-[#6B7280]">Suivi des travaux : début, fin, mécanicien responsable, pièces remplacées, photos avant/après.</p>
      {reparations.length > 0 && (
        <div className="mb-4 space-y-2">
          {reparations.map((r: any) => (
            <div key={r.id} className="rounded-lg border border-[#E5E7EB] p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#111]">{r.prestation}</span>
                <span className="text-[#D4AF37] font-semibold">{Number(r.coutTotal ?? 0).toLocaleString()} €</span>
              </div>
              {r.mecanicien && <p className="text-xs text-[#6B7280]">Mécanicien : {r.mecanicien}</p>}
              {r.piecesUtilisees && <p className="text-xs text-[#6B7280]">Pièces : {r.piecesUtilisees}</p>}
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Prestation *" value={f.prestation} onChange={(val) => setF({ ...f, prestation: val })} placeholder="Distribution, freins..." />
        <Input label="Mécanicien" value={f.mecanicien} onChange={(val) => setF({ ...f, mecanicien: val })} />
        <Input label="Pièces utilisées" value={f.pieces} onChange={(val) => setF({ ...f, pieces: val })} />
        <Input label="Coût pièces (€)" value={f.coutPieces} onChange={(val) => setF({ ...f, coutPieces: val })} type="number" />
        <Input label="Coût main d'œuvre (€)" value={f.coutMO} onChange={(val) => setF({ ...f, coutMO: val })} type="number" />
      </div>
      <button type="button" className="btn-outline mt-3 !text-sm" disabled={!f.prestation} onClick={() => {
        addReparation.mutate({
          vehiculeId: id,
          prestation: f.prestation,
          mecanicien: f.mecanicien || undefined,
          piecesUtilisees: f.pieces || undefined,
          coutPieces: f.coutPieces ? Number(f.coutPieces) : undefined,
          coutMainOeuvre: f.coutMO ? Number(f.coutMO) : undefined,
        });
        setF({ prestation: "", mecanicien: "", pieces: "", coutPieces: "", coutMO: "" });
      }}>
        Ajouter une réparation
      </button>
      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-[#374151]">Photos avant/après réparation :</p>
        <FileUpload label="Photos réparation" accept="image/*" multiple onUploaded={uploadDoc("photo_avant_reparation", "reparation")} iaAnalysis />
        <DocList docs={docs.filter((d: any) => d.etape === "reparation")} />
      </div>
      {["en_reparation", "reparation_terminee"].includes(v.status) && (
        <button type="button" onClick={() => advanceStatus("preparation_esthetique", "Réparations terminées, passage au lavage")} className="btn-gold mt-4">
          Réparations terminées → Passer au Lavage
        </button>
      )}
    </SectionCard>
  );
}

function TabLavage({ id, lavages, addLavage, advanceStatus, v, uploadDoc, docs }: any) {
  const [f, setF] = useState({ interieur: false, exterieur: false, detailing: false, optique: false, moteur: false, cout: "" });
  return (
    <SectionCard title="Étape 7 — Lavage / Préparation" icon="🧽">
      <p className="mb-4 text-sm text-[#6B7280]">Lavage, nettoyage intérieur, polish, préparation vente.</p>
      {lavages.length > 0 && (
        <div className="mb-4 space-y-2">
          {lavages.map((l: any) => (
            <div key={l.id} className="rounded-lg border border-[#E5E7EB] p-3 text-sm">
              <div className="flex flex-wrap gap-2">
                {l.lavageExterieur && <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Extérieur</span>}
                {l.lavageInterieur && <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Intérieur</span>}
                {l.detailing && <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Detailing</span>}
                {l.renovationOptique && <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Optiques</span>}
                {l.nettoyageMoteur && <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">Moteur</span>}
              </div>
              {l.cout && <p className="mt-1 text-xs text-[#6B7280]">Coût : {Number(l.cout).toLocaleString()} €</p>}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-4">
        {[
          { key: "exterieur", label: "Lavage extérieur" },
          { key: "interieur", label: "Nettoyage intérieur" },
          { key: "detailing", label: "Polish / Detailing" },
          { key: "optique", label: "Rénovation optiques" },
          { key: "moteur", label: "Nettoyage moteur" },
        ].map((opt) => (
          <label key={opt.key} className="flex items-center gap-2 text-sm text-[#374151]">
            <input type="checkbox" checked={(f as any)[opt.key]} onChange={(e) => setF({ ...f, [opt.key]: e.target.checked })} className="rounded border-[#D1D5DB]" />
            {opt.label}
          </label>
        ))}
      </div>
      <Input label="Coût lavage (€)" value={f.cout} onChange={(val) => setF({ ...f, cout: val })} type="number" />
      <button type="button" className="btn-outline mt-3 !text-sm" onClick={() => {
        addLavage.mutate({
          vehiculeId: id,
          lavageInterieur: f.interieur,
          lavageExterieur: f.exterieur,
          detailing: f.detailing,
          renovationOptique: f.optique,
          nettoyageMoteur: f.moteur,
          cout: f.cout ? Number(f.cout) : undefined,
        });
        setF({ interieur: false, exterieur: false, detailing: false, optique: false, moteur: false, cout: "" });
      }}>
        Enregistrer le lavage
      </button>
      <div className="mt-4">
        <FileUpload label="Photos avant/après lavage" accept="image/*" multiple onUploaded={uploadDoc("photo_avant_lavage", "lavage")} iaAnalysis />
        <DocList docs={docs.filter((d: any) => d.etape === "lavage")} />
      </div>
      {v.status === "preparation_esthetique" && (
        <button type="button" onClick={() => advanceStatus("en_vente", "Lavage terminé, véhicule prêt pour les photos et la vente")} className="btn-gold mt-4">
          Lavage terminé → Shooting photos
        </button>
      )}
    </SectionCard>
  );
}

function TabMiseEnVente({ id, v, setDestination }: any) {
  const [f, setF] = useState({ destination: "vente", prixVente: "", garantie: "", equipements: "" });
  return (
    <SectionCard title="Étape 10 — Mise en vente" icon="🏷">
      <p className="mb-4 text-sm text-[#6B7280]">Choix de la destination : Vente France, Europe, Export Afrique, Vente mondiale MKA.P-MS.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Destination</label>
          <select value={f.destination} onChange={(e) => setF({ ...f, destination: e.target.value })} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm">
            <option value="vente">Vente France</option>
            <option value="vente_directe">Vente Europe</option>
            <option value="export_africa">Export Afrique</option>
            <option value="location">Mise en location</option>
            <option value="stock_interne">Stock interne</option>
          </select>
        </div>
        <Input label="Prix de vente (€)" value={f.prixVente} onChange={(val) => setF({ ...f, prixVente: val })} type="number" />
        <Input label="Garantie" value={f.garantie} onChange={(val) => setF({ ...f, garantie: val })} placeholder="6 mois, 12 mois..." />
        <Input label="Équipements" value={f.equipements} onChange={(val) => setF({ ...f, equipements: val })} placeholder="GPS, clim, caméra..." />
      </div>
      <button type="button" className="btn-gold mt-4" onClick={() => {
        setDestination.mutate({
          id,
          destination: f.destination as any,
          prixVente: f.prixVente ? Number(f.prixVente) : undefined,
          garantie: f.garantie || undefined,
          equipements: f.equipements || undefined,
        });
      }}>
        Mettre en vente
      </button>
    </SectionCard>
  );
}

function TabComptabilite({ v, enregistrerVente, id }: any) {
  const [f, setF] = useState({ prixVenteEffectif: "", acheteurNom: "" });
  const coutTotal = Number(v.prixAchat ?? 0) + Number(v.coutTransport ?? 0) + Number(v.coutReparation ?? 0) + Number(v.coutLavage ?? 0);
  return (
    <SectionCard title="Étape 15 — Comptabilité" icon="💰">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-[#E5E7EB] p-4 text-center">
          <p className="text-xs text-[#6B7280]">Prix d'achat</p>
          <p className="text-xl font-bold text-[#DC2626]">{Number(v.prixAchat ?? 0).toLocaleString()} €</p>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] p-4 text-center">
          <p className="text-xs text-[#6B7280]">Coûts totaux</p>
          <p className="text-xl font-bold text-[#DC2626]">{coutTotal.toLocaleString()} €</p>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] p-4 text-center">
          <p className="text-xs text-[#6B7280]">Prix vente effectif</p>
          <p className="text-xl font-bold text-[#16A34A]">{v.prixVenteEffectif ? `${Number(v.prixVenteEffectif).toLocaleString()} €` : "—"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-[#F3F4F6] p-3 text-center text-sm">
          <p className="text-[#6B7280]">Transport</p>
          <p className="font-semibold">{Number(v.coutTransport ?? 0).toLocaleString()} €</p>
        </div>
        <div className="rounded-lg bg-[#F3F4F6] p-3 text-center text-sm">
          <p className="text-[#6B7280]">Réparations</p>
          <p className="font-semibold">{Number(v.coutReparation ?? 0).toLocaleString()} €</p>
        </div>
        <div className="rounded-lg bg-[#F3F4F6] p-3 text-center text-sm">
          <p className="text-[#6B7280]">Lavage</p>
          <p className="font-semibold">{Number(v.coutLavage ?? 0).toLocaleString()} €</p>
        </div>
      </div>

      {v.status !== "vendu" && v.status !== "archive" && (
        <div className="mt-6 rounded-lg border border-[#D4AF37] bg-[#FFFBEB] p-4">
          <p className="mb-3 text-sm font-semibold text-[#92400E]">Enregistrer la vente</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Prix de vente effectif (€) *" value={f.prixVenteEffectif} onChange={(val) => setF({ ...f, prixVenteEffectif: val })} type="number" />
            <Input label="Nom de l'acheteur" value={f.acheteurNom} onChange={(val) => setF({ ...f, acheteurNom: val })} />
          </div>
          <button type="button" className="btn-gold mt-3" disabled={!f.prixVenteEffectif} onClick={() => {
            enregistrerVente.mutate({ id, prixVenteEffectif: Number(f.prixVenteEffectif), acheteurNom: f.acheteurNom || undefined });
          }}>
            Enregistrer la vente
          </button>
        </div>
      )}

      {v.margeNette != null && (
        <div className={`mt-4 rounded-lg p-4 text-center ${Number(v.margeNette) >= 0 ? "bg-[#F0FDF4] text-[#166534]" : "bg-[#FEF2F2] text-[#991B1B]"}`}>
          <p className="text-sm">Marge nette</p>
          <p className="text-3xl font-bold">{Number(v.margeNette).toLocaleString()} €</p>
        </div>
      )}

      <div className="mt-4 rounded-lg bg-[#F3F4F6] p-3 text-sm text-[#6B7280]">
        Export disponible : PDF, Excel, Export comptable
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   FORMULAIRE NOUVEL ACHAT
   ═══════════════════════════════════════════════════════════ */
function VOForm({ onDone }: { onDone: () => void }) {
  const utils = trpc.useUtils();
  const create = trpc.vo.create.useMutation({
    onSuccess: () => { utils.vo.list.invalidate(); onDone(); },
  });
  const [f, setF] = useState({
    marque: "", modele: "", version: "", annee: "", immatriculation: "", vin: "",
    kilometrage: "", carburant: "", boiteVitesse: "", couleur: "", puissance: "",
    prixAchat: "", fournisseur: "", modeAchat: "", dateAchat: "", lieuAchat: "", description: "",
  });
  const set = (k: string, val: string) => setF((p) => ({ ...p, [k]: val }));

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      create.mutate({
        marque: f.marque, modele: f.modele,
        version: f.version || undefined,
        annee: f.annee ? Number(f.annee) : undefined,
        immatriculation: f.immatriculation || undefined,
        vin: f.vin || undefined,
        kilometrage: f.kilometrage ? Number(f.kilometrage) : undefined,
        carburant: f.carburant || undefined,
        boiteVitesse: f.boiteVitesse || undefined,
        couleur: f.couleur || undefined,
        puissance: f.puissance || undefined,
        prixAchat: f.prixAchat ? Number(f.prixAchat) : undefined,
        fournisseur: f.fournisseur || undefined,
        modeAchat: (f.modeAchat || undefined) as any,
        dateAchat: f.dateAchat || undefined,
        lieuAchat: f.lieuAchat || undefined,
        description: f.description || undefined,
      });
    }} className="space-y-4">
      <SectionCard title="Enregistrer un nouvel achat — Étape 1" icon="🛒">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Marque *" value={f.marque} onChange={(val) => set("marque", val)} required placeholder="Renault" />
          <Input label="Modèle *" value={f.modele} onChange={(val) => set("modele", val)} required placeholder="Clio" />
          <Input label="Version" value={f.version} onChange={(val) => set("version", val)} placeholder="RS Line" />
          <Input label="Année" value={f.annee} onChange={(val) => set("annee", val)} type="number" placeholder="2022" />
          <Input label="Immatriculation" value={f.immatriculation} onChange={(val) => set("immatriculation", val)} placeholder="AB-123-CD" />
          <Input label="VIN" value={f.vin} onChange={(val) => set("vin", val)} />
          <Input label="Kilométrage" value={f.kilometrage} onChange={(val) => set("kilometrage", val)} type="number" placeholder="50000" />
          <div>
            <label className="mb-1 block text-sm font-medium text-[#374151]">Carburant</label>
            <select value={f.carburant} onChange={(e) => set("carburant", e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none">
              <option value="">Sélectionner</option>
              <option value="essence">Essence</option>
              <option value="diesel">Diesel</option>
              <option value="electrique">Électrique</option>
              <option value="hybride">Hybride</option>
              <option value="gpl">GPL</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#374151]">Boîte de vitesse</label>
            <select value={f.boiteVitesse} onChange={(e) => set("boiteVitesse", e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none">
              <option value="">Sélectionner</option>
              <option value="manuelle">Manuelle</option>
              <option value="automatique">Automatique</option>
            </select>
          </div>
          <Input label="Couleur" value={f.couleur} onChange={(val) => set("couleur", val)} />
          <Input label="Puissance" value={f.puissance} onChange={(val) => set("puissance", val)} placeholder="110 ch" />
          <Input label="Prix d'achat (€) *" value={f.prixAchat} onChange={(val) => set("prixAchat", val)} type="number" placeholder="8500" />
          <Input label="Fournisseur" value={f.fournisseur} onChange={(val) => set("fournisseur", val)} placeholder="Auto1, nom..." />
          <div>
            <label className="mb-1 block text-sm font-medium text-[#374151]">Source d'achat</label>
            <select value={f.modeAchat} onChange={(e) => set("modeAchat", e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none">
              <option value="">Sélectionner</option>
              <option value="auto1">Auto1</option>
              <option value="enchere">Enchères</option>
              <option value="particulier">Particulier</option>
              <option value="pro">Professionnel</option>
              <option value="depot_vente">Reprise client</option>
              <option value="fournisseur">Fournisseur / Import</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <Input label="Date d'achat" value={f.dateAchat} onChange={(val) => set("dateAchat", val)} type="date" />
          <Input label="Lieu d'achat" value={f.lieuAchat} onChange={(val) => set("lieuAchat", val)} placeholder="Paris, Allemagne..." />
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-[#374151]">Description / Remarques</label>
          <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" placeholder="État, historique, remarques..." />
        </div>
        <button type="submit" disabled={create.isPending || !f.marque || !f.modele} className="btn-gold mt-4">
          {create.isPending ? "Enregistrement..." : "Enregistrer l'achat → Étape 1 validée"}
        </button>
      </SectionCard>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════
   TABLEAU DE BORD / STATS
   ═══════════════════════════════════════════════════════════ */
function VOStats() {
  const { data: stats, isLoading } = trpc.vo.stats.useQuery();
  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement...</div>;
  if (!stats) return null;

  const cards = [
    { label: "Total véhicules", value: stats.total, color: "#111" },
    { label: "En stock", value: stats.enStock, color: "#2563EB" },
    { label: "En réparation", value: stats.enReparation, color: "#F59E0B" },
    { label: "En vente", value: stats.enVente, color: "#D4AF37" },
    { label: "En location", value: stats.enLocation, color: "#7C3AED" },
    { label: "Vendus", value: stats.vendus, color: "#16A34A" },
    { label: "Total achats", value: `${stats.totalAchats.toLocaleString()} €`, color: "#DC2626" },
    { label: "Total ventes", value: `${stats.totalVentes.toLocaleString()} €`, color: "#16A34A" },
    { label: "Marges nettes", value: `${stats.totalMarges.toLocaleString()} €`, color: stats.totalMarges >= 0 ? "#16A34A" : "#DC2626" },
  ];

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-[#111]">Tableau de bord VO</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-[#E5E7EB] bg-white p-5 text-center">
            <div className="mb-1 text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
            <div className="text-sm text-[#6B7280]">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
