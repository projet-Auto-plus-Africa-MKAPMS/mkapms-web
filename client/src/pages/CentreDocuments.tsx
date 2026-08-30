import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Upload, Check, Clock, AlertCircle, XCircle, Eye,
  Search, Download, Plus, Shield, Car,
  Wrench, Briefcase, CreditCard
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   CENTRE DE DOCUMENTS
   Les pièces réellement enregistrées dans le dossier de validation (kyc).
   Chaque action mène à un vrai résultat : le fichier est ouvert/téléchargé
   depuis son URL, ou l'écran de dépôt (/compte/validation) est ouvert.
   ══════════════════════════════════════════════════════════════════════════ */

type DocStatus = "attente" | "envoye" | "verification" | "refuse" | "a_completer" | "valide";

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: typeof Check }> = {
  attente: { label: "En attente", color: "text-[#6B7280]", bg: "bg-[#F3F4F6]", icon: Clock },
  envoye: { label: "Envoyé", color: "text-blue-600", bg: "bg-blue-50", icon: Upload },
  verification: { label: "En vérification", color: "text-amber-600", bg: "bg-amber-50", icon: Eye },
  refuse: { label: "Refusé", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
  a_completer: { label: "À compléter", color: "text-orange-600", bg: "bg-orange-50", icon: AlertCircle },
  valide: { label: "Validé", color: "text-green-600", bg: "bg-green-50", icon: Check },
};

const CATEGORIES = [
  { id: "tous", label: "Tous", icon: FileText },
  { id: "vente", label: "Vente", icon: Car },
  { id: "location", label: "Location", icon: CreditCard },
  { id: "garage", label: "Garage", icon: Wrench },
  { id: "vtc", label: "VTC & Taxi", icon: Shield },
  { id: "admin", label: "Admin", icon: Briefcase },
];

/** Rattache un type de pièce à l'univers qui l'exige. */
const CATEGORIE_PAR_TYPE: Record<string, string> = {
  piece_identite: "admin",
  permis_conduire: "location",
  justificatif_domicile: "location",
  kbis: "admin",
  rib: "admin",
  carte_grise: "vente",
  controle_technique: "garage",
  autre: "vtc",
};

/** L'état du dossier décide de l'état affiché : une pièce seule n'a pas de verdict. */
const STATUT_PAR_DOSSIER: Record<string, DocStatus> = {
  non_demarre: "attente",
  en_cours: "envoye",
  en_validation: "verification",
  valide: "valide",
  refuse: "refuse",
  expire: "a_completer",
};

const LIBELLE_TYPE: Record<string, string> = {
  piece_identite: "Pièce d'identité",
  permis_conduire: "Permis de conduire",
  justificatif_domicile: "Justificatif de domicile",
  kbis: "KBIS société",
  rib: "RIB",
  carte_grise: "Carte grise",
  controle_technique: "Contrôle technique",
  autre: "Autre justificatif",
};

function taille(bytes: number | null): string {
  if (!bytes) return "—";
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function CentreDocuments() {
  const { user } = useAuth();
  const [cat, setCat] = useState("tous");
  const [search, setSearch] = useState("");
  const dossier = trpc.kyc.myProfile.useQuery(undefined, { enabled: !!user });

  const statutDossier = dossier.data?.profile?.status ?? "non_demarre";
  const documents = useMemo(
    () =>
      (dossier.data?.documents ?? []).map((d) => ({
        id: d.id,
        nom: d.fileName || LIBELLE_TYPE[d.docType] || d.docType,
        type: CATEGORIE_PAR_TYPE[d.docType] ?? "admin",
        statut: STATUT_PAR_DOSSIER[statutDossier] ?? "attente",
        date: new Date(d.uploadedAt).toLocaleDateString("fr-FR"),
        taille: taille(d.sizeBytes),
        fileUrl: d.fileUrl,
      })),
    [dossier.data, statutDossier],
  );

  const filtered = documents.filter((d) => {
    if (cat !== "tous" && d.type !== cat) return false;
    if (search && !d.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    valide: documents.filter((d) => d.statut === "valide").length,
    en_cours: documents.filter((d) => !["valide", "refuse"].includes(d.statut)).length,
    refuse: documents.filter((d) => d.statut === "refuse").length,
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white">Centre de documents</h1>
        <p className="mt-1 text-sm text-white/60">Les pièces enregistrées dans votre dossier</p>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2">
        {[
          { label: "Validés", value: counts.valide, color: "text-green-600" },
          { label: "En cours", value: counts.en_cours, color: "text-amber-600" },
          { label: "Refusés", value: counts.refuse, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-[#6B7280]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input type="text" placeholder="Rechercher un document…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.id} onClick={() => setCat(c.id)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${cat === c.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={12} /> {c.label}
            </button>
          );
        })}
      </div>

      {/* Dépôt d'une pièce : l'écran de validation est le seul endroit qui enregistre. */}
      <div className="px-4 mt-4">
        <Link to="/compte/validation" className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 py-4 text-sm font-bold text-[#D4AF37] active:scale-[0.98] transition">
          <Plus size={16} /> Ajouter un document
        </Link>
      </div>

      {/* Documents list */}
      <div className="px-4 mt-4 space-y-2">
        {filtered.map((d) => {
          const s = STATUS_CONFIG[d.statut];
          const SIcon = s.icon;
          return (
            <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EF]">
                    <FileText size={18} className="text-[#6B7280]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111]">{d.nom}</h3>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">{d.date} · {d.taille}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.color} ${s.bg}`}>
                  <SIcon size={10} /> {s.label}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <a href={d.fileUrl} download={d.nom} target="_blank" rel="noreferrer" className="flex-1 rounded-lg bg-[#F5F3EF] py-2 text-xs font-semibold text-[#6B7280] flex items-center justify-center gap-1">
                  <Download size={12} /> Télécharger
                </a>
                {(d.statut === "refuse" || d.statut === "a_completer") && (
                  <Link to="/compte/validation" className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-semibold text-red-600 flex items-center justify-center gap-1">
                    <Upload size={12} /> Renvoyer
                  </Link>
                )}
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-[#F5F3EF] px-3 py-2 text-xs font-semibold text-[#6B7280] flex items-center"><Eye size={12} /></a>
              </div>
            </div>
          );
        })}
      </div>

      {!user && (
        <div className="px-4 mt-8 text-center">
          <FileText size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Connectez-vous pour voir vos documents</p>
          <Link to="/connexion" className="mt-3 inline-block rounded-xl bg-[#111] px-4 py-2 text-xs font-bold text-[#D4AF37]">Se connecter</Link>
        </div>
      )}

      {user && !dossier.isLoading && filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <FileText size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun document enregistré</p>
          <Link to="/compte/validation" className="mt-3 inline-block rounded-xl bg-[#111] px-4 py-2 text-xs font-bold text-[#D4AF37]">Déposer une pièce</Link>
        </div>
      )}
    </div>
  );
}
