import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Users, Plus, Check, Clock, AlertCircle,
  FileCheck, Trash2, Edit, User, Shield, X, Upload
} from "lucide-react";
import { getToken } from "../lib/auth";
import { normalizeImages } from "../lib/imageUpload";

/* ══════════════════════════════════════════════════════════════════════════
   GESTION DES CONDUCTEURS
   Entreprises : ajouter conducteurs avec documents séparés (permis, ID, validation).
   ══════════════════════════════════════════════════════════════════════════ */

type StatutDoc = "valide" | "en_attente" | "refuse";
type Conducteur = {
  id: number; nom: string; role: string;
  permis: StatutDoc; identite: StatutDoc;
  photo: string; dateAjout: string; vehiculesAutorises: number;
};

const CONDUCTEURS_INITIAUX: Conducteur[] = [
  { id: 1, nom: "Jean Dupont", role: "Commercial", permis: "valide", identite: "valide", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", dateAjout: "15/01/2025", vehiculesAutorises: 3 },
  { id: 2, nom: "Marie Lambert", role: "Gestionnaire flotte", permis: "valide", identite: "valide", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", dateAjout: "20/01/2025", vehiculesAutorises: 5 },
  { id: 3, nom: "Karim Benali", role: "Chauffeur", permis: "en_attente", identite: "valide", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face", dateAjout: "01/03/2025", vehiculesAutorises: 1 },
];

const DOC_STATUS: Record<StatutDoc, { label: string; color: string; bg: string; icon: typeof Check }> = {
  valide: { label: "Validé", color: "text-green-600", bg: "bg-green-50", icon: Check },
  en_attente: { label: "En attente", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  refuse: { label: "Refusé", color: "text-red-600", bg: "bg-red-50", icon: X },
};

const AVATAR_PAR_DEFAUT = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face";

export default function GestionConducteurs() {
  const [conducteurs, setConducteurs] = useState<Conducteur[]>(CONDUCTEURS_INITIAUX);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nomForm, setNomForm] = useState("");
  const [roleForm, setRoleForm] = useState("");
  const [emailForm, setEmailForm] = useState("");
  const [permisUrl, setPermisUrl] = useState<string | null>(null);
  const [identiteUrl, setIdentiteUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"permis" | "identite" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const permisInput = useRef<HTMLInputElement | null>(null);
  const identiteInput = useRef<HTMLInputElement | null>(null);

  async function uploadDoc(doc: "permis" | "identite", files: FileList | File[]) {
    setUploading(doc);
    setFormError(null);
    try {
      const prepared = await normalizeImages(files);
      const fd = new FormData();
      for (const f of prepared) fd.append("files", f);
      const token = getToken();
      const resp = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setFormError(data.error || "Erreur lors de l'envoi du document");
        return;
      }
      const uploadedUrls = ((data.files || []) as { url: string }[]).map((f) => f.url);
      if (!uploadedUrls.length) {
        setFormError("Le document n'a pas pu être traité");
        return;
      }
      if (doc === "permis") setPermisUrl(uploadedUrls[0]);
      else setIdentiteUrl(uploadedUrls[0]);
    } catch (e) {
      setFormError((e as Error).message || "Erreur réseau lors de l'envoi");
    } finally {
      setUploading(null);
    }
  }

  function ajouterConducteur() {
    if (!nomForm.trim()) {
      setFormError("Le nom du conducteur est obligatoire.");
      return;
    }
    const nouveau: Conducteur = {
      id: Date.now(),
      nom: nomForm.trim(),
      role: roleForm.trim() || "Conducteur",
      permis: "en_attente",
      identite: "en_attente",
      photo: AVATAR_PAR_DEFAUT,
      dateAjout: new Date().toLocaleDateString("fr-FR"),
      vehiculesAutorises: 0,
    };
    setConducteurs((c) => [...c, nouveau]);
    setNomForm(""); setRoleForm(""); setEmailForm("");
    setPermisUrl(null); setIdentiteUrl(null);
    setFormError(null);
    setShowAdd(false);
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Conducteurs</h1>
        <p className="mt-1 text-sm text-white/60">Gérez les conducteurs autorisés de votre flotte</p>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-xl font-black text-[#111]">{conducteurs.length}</p><p className="text-[10px] text-[#6B7280]">Conducteurs</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-xl font-black text-green-600">{conducteurs.filter((c) => c.permis === "valide" && c.identite === "valide").length}</p><p className="text-[10px] text-[#6B7280]">Validés</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-xl font-black text-amber-600">{conducteurs.filter((c) => c.permis === "en_attente" || c.identite === "en_attente").length}</p><p className="text-[10px] text-[#6B7280]">En attente</p>
        </div>
      </div>

      {/* Add button */}
      <div className="px-4 mt-4">
        <button onClick={() => setShowAdd(!showAdd)} className="w-full rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#D4AF37]/5 py-4 text-sm font-bold text-[#D4AF37] flex items-center justify-center gap-2 active:scale-[0.98]">
          <Plus size={16} /> Ajouter un conducteur
        </button>
      </div>

      {showAdd && (
        <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Nouveau conducteur</h3>
          {formError && <p className="rounded-lg bg-red-50 border border-red-200 p-2 text-[11px] text-red-700">{formError}</p>}
          <div><label className="text-xs text-[#6B7280]">Nom complet</label><input type="text" value={nomForm} onChange={(e) => setNomForm(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" placeholder="Prénom Nom" /></div>
          <div><label className="text-xs text-[#6B7280]">Rôle</label><input type="text" value={roleForm} onChange={(e) => setRoleForm(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" placeholder="Commercial, Chauffeur, etc." /></div>
          <div><label className="text-xs text-[#6B7280]">Email</label><input type="email" value={emailForm} onChange={(e) => setEmailForm(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" placeholder="email@entreprise.com" /></div>
          <div className="grid grid-cols-2 gap-2">
            <input ref={permisInput} type="file" accept="image/*,.heic,.heif,.pdf" className="hidden" onChange={(e) => {
              const selected = e.target.files ? Array.from(e.target.files) : [];
              e.target.value = "";
              if (selected.length) void uploadDoc("permis", selected);
            }} />
            <button
              type="button"
              onClick={() => { if (uploading !== "permis") permisInput.current?.click(); }}
              className={`rounded-lg border-2 border-dashed py-4 text-xs font-semibold flex flex-col items-center gap-1 ${permisUrl ? "border-green-400 bg-green-50 text-green-700" : "border-[#D4AF37]/40 bg-[#D4AF37]/5 text-[#D4AF37]"}`}
            >
              {permisUrl ? <Check size={16} /> : <FileCheck size={16} />}
              {uploading === "permis" ? "Envoi…" : permisUrl ? "Permis ajouté" : "Permis"}
            </button>
            <input ref={identiteInput} type="file" accept="image/*,.heic,.heif,.pdf" className="hidden" onChange={(e) => {
              const selected = e.target.files ? Array.from(e.target.files) : [];
              e.target.value = "";
              if (selected.length) void uploadDoc("identite", selected);
            }} />
            <button
              type="button"
              onClick={() => { if (uploading !== "identite") identiteInput.current?.click(); }}
              className={`rounded-lg border-2 border-dashed py-4 text-xs font-semibold flex flex-col items-center gap-1 ${identiteUrl ? "border-green-400 bg-green-50 text-green-700" : "border-[#D4AF37]/40 bg-[#D4AF37]/5 text-[#D4AF37]"}`}
            >
              {identiteUrl ? <Check size={16} /> : <FileCheck size={16} />}
              {uploading === "identite" ? "Envoi…" : identiteUrl ? "Pièce ajoutée" : "Pièce d'identité"}
            </button>
          </div>
          <button onClick={ajouterConducteur} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Ajouter le conducteur</button>
        </div>
      )}

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {conducteurs.map((c) => {
          const permisS = DOC_STATUS[c.permis];
          const idS = DOC_STATUS[c.identite];
          const PermisIcon = permisS.icon;
          const IdIcon = idS.icon;
          const editing = editingId === c.id;
          return (
            <div key={c.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-3">
                <img src={c.photo} alt={c.nom} className="h-12 w-12 rounded-full object-cover" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#111]">{c.nom}</h3>
                  {editing ? (
                    <input
                      autoFocus
                      value={c.role}
                      onChange={(e) => {
                        const v = e.target.value;
                        setConducteurs((list) => list.map((x) => (x.id === c.id ? { ...x, role: v } : x)));
                      }}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => { if (e.key === "Enter") setEditingId(null); }}
                      className="mt-0.5 w-full rounded border border-[#D4AF37] px-1.5 py-0.5 text-[10px]"
                    />
                  ) : (
                    <p className="text-[10px] text-[#6B7280]">{c.role} · Ajouté le {c.dateAjout}</p>
                  )}
                </div>
                <button
                  onClick={() => setEditingId(editing ? null : c.id)}
                  aria-label={`Modifier le rôle de ${c.nom}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${editing ? "bg-[#D4AF37]/20" : "bg-[#F3F4F6]"}`}
                >
                  <Edit size={14} className={editing ? "text-[#D4AF37]" : "text-[#6B7280]"} />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2">
                  <PermisIcon size={12} className={permisS.color} />
                  <div><p className="text-[9px] text-[#6B7280]">Permis</p><p className={`text-[11px] font-semibold ${permisS.color}`}>{permisS.label}</p></div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2">
                  <IdIcon size={12} className={idS.color} />
                  <div><p className="text-[9px] text-[#6B7280]">Identité</p><p className={`text-[11px] font-semibold ${idS.color}`}>{idS.label}</p></div>
                </div>
              </div>
              <div className="mt-2 rounded-lg bg-[#F5F3EF] px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-[#6B7280]">Véhicules autorisés</span>
                <span className="text-sm font-bold text-[#111]">{c.vehiculesAutorises}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
