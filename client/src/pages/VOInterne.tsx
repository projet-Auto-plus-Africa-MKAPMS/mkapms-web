import { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const VO_STEPS = [
  { key: "achat_enregistre", label: "Achat", icon: "🛒" },
  { key: "en_cours_transport", label: "Transport", icon: "🚚" },
  { key: "vehicule_recu", label: "Réception", icon: "📦" },
  { key: "diagnostic_en_cours", label: "Diagnostic", icon: "🔍" },
  { key: "en_attente_pieces", label: "Pièces", icon: "🔧" },
  { key: "en_reparation", label: "Réparation", icon: "⚙" },
  { key: "preparation_esthetique", label: "Lavage", icon: "🧽" },
  { key: "pret", label: "Prêt", icon: "✓" },
  { key: "en_vente", label: "En vente", icon: "🏷" },
  { key: "vendu", label: "Vendu", icon: "🎉" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  achat_enregistre: "Achat enregistré",
  en_attente_recuperation: "En attente récupération",
  en_cours_transport: "En cours de transport",
  vehicule_recu: "Véhicule réceptionné",
  diagnostic_en_cours: "Diagnostic en cours",
  diagnostic_termine: "Diagnostic terminé",
  en_attente_pieces: "En attente de pièces",
  en_reparation: "En réparation",
  reparation_terminee: "Réparation terminée",
  controle_final: "Contrôle final",
  preparation_esthetique: "Préparation esthétique",
  pret: "Véhicule prêt",
  en_vente: "En vente",
  en_location: "Disponible location",
  vendu: "Vendu",
  loue: "Loué",
  exporte: "Exporté",
  stock_interne: "Stock interne",
  a_revoir: "À revoir",
  archive: "Archivé",
};

function StatusTimeline({ status }: { status: string }) {
  const idx = VO_STEPS.findIndex((s) => s.key === status);
  const activeIdx = idx >= 0 ? idx : VO_STEPS.length;
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto py-2">
      {VO_STEPS.map((step, i) => {
        const done = i <= activeIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${done ? "bg-[#D4AF37] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"}`}>
                {step.icon}
              </div>
              <span className={`mt-0.5 text-[9px] ${done ? "font-semibold text-[#111]" : "text-[#9CA3AF]"}`}>{step.label}</span>
            </div>
            {i < VO_STEPS.length - 1 && <div className={`mx-0.5 h-0.5 w-4 ${i < activeIdx ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function VOInterne() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"liste" | "nouveau" | "stats">("liste");

  if (!user) return <div className="p-8 text-center text-[#6B7280]">Connectez-vous pour accéder au module VO.</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-[#111]">VO Interne MKA.P-MS</h1>
      <p className="mb-6 text-[#6B7280]">Gestion complète des véhicules d'occasion : Achat → Transport → Réception → Diagnostic → Réparation → Lavage → Vente/Location</p>

      <div className="mb-6 flex gap-2 border-b border-[#E5E7EB]">
        {(["liste", "nouveau", "stats"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize ${tab === t ? "border-b-2 border-[#D4AF37] text-[#D4AF37]" : "text-[#6B7280]"}`}>
            {t === "liste" ? "Mes véhicules" : t === "nouveau" ? "Nouvel achat" : "Tableau de bord"}
          </button>
        ))}
      </div>

      {tab === "liste" && <VOListe />}
      {tab === "nouveau" && <VOForm onDone={() => setTab("liste")} />}
      {tab === "stats" && <VOStats />}
    </div>
  );
}

function VOListe() {
  const { data: vehicules, isLoading } = trpc.vo.list.useQuery({});
  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement...</div>;
  if (!vehicules?.length) return <div className="py-8 text-center text-[#6B7280]">Aucun véhicule VO enregistré.</div>;

  return (
    <div className="space-y-4">
      {vehicules.map((v) => (
        <div key={v.id} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-[#111]">{v.marque} {v.modele}</span>
              {v.version && <span className="ml-2 text-sm text-[#6B7280]">{v.version}</span>}
              {v.annee && <span className="ml-2 text-sm text-[#9CA3AF]">({v.annee})</span>}
            </div>
            <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#92400E]">
              {STATUS_LABELS[v.status] ?? v.status}
            </span>
          </div>
          <StatusTimeline status={v.status} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {v.immatriculation && <div><span className="text-[#6B7280]">Plaque :</span> {v.immatriculation}</div>}
            {v.kilometrage != null && <div><span className="text-[#6B7280]">Km :</span> {Number(v.kilometrage).toLocaleString()}</div>}
            {v.prixAchat != null && <div><span className="text-[#6B7280]">Achat :</span> {Number(v.prixAchat).toLocaleString()} €</div>}
            {v.prixVente != null && <div><span className="text-[#6B7280]">Vente :</span> {Number(v.prixVente).toLocaleString()} €</div>}
            {v.modeAchat && <div><span className="text-[#6B7280]">Source :</span> {v.modeAchat}</div>}
            {v.fournisseur && <div><span className="text-[#6B7280]">Fournisseur :</span> {v.fournisseur}</div>}
            {v.coutTotal != null && Number(v.coutTotal) > 0 && <div><span className="text-[#6B7280]">Coût total :</span> {Number(v.coutTotal).toLocaleString()} €</div>}
            {v.margeNette != null && <div className={Number(v.margeNette) >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}><span className="text-[#6B7280]">Marge nette :</span> {Number(v.margeNette).toLocaleString()} €</div>}
          </div>
          <div className="mt-2 text-xs text-[#9CA3AF]">VO-{v.id} — {new Date(v.createdAt).toLocaleDateString("fr-FR")}</div>
        </div>
      ))}
    </div>
  );
}

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
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

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
      <h2 className="text-xl font-bold text-[#111]">Enregistrer un nouvel achat</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Marque *" value={f.marque} onChange={(v) => set("marque", v)} required placeholder="Renault" />
        <Input label="Modèle *" value={f.modele} onChange={(v) => set("modele", v)} required placeholder="Clio" />
        <Input label="Version" value={f.version} onChange={(v) => set("version", v)} placeholder="RS Line" />
        <Input label="Année" value={f.annee} onChange={(v) => set("annee", v)} type="number" placeholder="2022" />
        <Input label="Immatriculation" value={f.immatriculation} onChange={(v) => set("immatriculation", v)} placeholder="AB-123-CD" />
        <Input label="VIN" value={f.vin} onChange={(v) => set("vin", v)} />
        <Input label="Kilométrage" value={f.kilometrage} onChange={(v) => set("kilometrage", v)} type="number" placeholder="50000" />
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
        <Input label="Couleur" value={f.couleur} onChange={(v) => set("couleur", v)} />
        <Input label="Puissance" value={f.puissance} onChange={(v) => set("puissance", v)} placeholder="110 ch" />
        <Input label="Prix d'achat (€) *" value={f.prixAchat} onChange={(v) => set("prixAchat", v)} type="number" placeholder="8500" />
        <Input label="Fournisseur" value={f.fournisseur} onChange={(v) => set("fournisseur", v)} placeholder="Auto1, nom..." />
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151]">Mode d'achat</label>
          <select value={f.modeAchat} onChange={(e) => set("modeAchat", e.target.value)} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none">
            <option value="">Sélectionner</option>
            <option value="auto1">Auto1</option>
            <option value="fournisseur">Fournisseur</option>
            <option value="particulier">Particulier</option>
            <option value="pro">Pro</option>
            <option value="enchere">Enchère</option>
            <option value="depot_vente">Dépôt-vente</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <Input label="Date d'achat" value={f.dateAchat} onChange={(v) => set("dateAchat", v)} type="date" />
        <Input label="Lieu d'achat" value={f.lieuAchat} onChange={(v) => set("lieuAchat", v)} placeholder="Paris, Allemagne..." />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[#374151]">Description</label>
        <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm focus:border-[#D4AF37] focus:outline-none" placeholder="État, historique, remarques..." />
      </div>
      <button type="submit" disabled={create.isPending || !f.marque || !f.modele} className="rounded-lg bg-[#D4AF37] px-8 py-3 font-semibold text-white hover:bg-[#C5A028] disabled:opacity-50">
        {create.isPending ? "Enregistrement..." : "Enregistrer l'achat"}
      </button>
    </form>
  );
}

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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-[#E5E7EB] bg-white p-5 text-center">
          <div className="mb-1 text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          <div className="text-sm text-[#6B7280]">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
