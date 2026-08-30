import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, Search, Check, Send } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import FileUpload from "../../components/FileUpload";

/* Demande de devis garage — la demande est réellement enregistrée par
   `devis.create` : suivi de service, notification et dossier côté garage.
   Aucun écran de confirmation n'est affiché si le serveur n'a rien accepté. */

const INTERVENTIONS = ["Révision", "Vidange", "Freinage", "Distribution", "Embrayage", "Climatisation", "Diagnostic", "Pneus", "Carrosserie", "Autre"];
const URGENCES = ["Normal", "Urgent", "Très urgent"] as const;

export default function DemandeDevis() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<"plaque" | "vin" | "manuelle">("plaque");
  const [immat, setImmat] = useState("");
  const [vin, setVin] = useState("");
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [annee, setAnnee] = useState("");
  const [motorisation, setMotorisation] = useState("");
  const [intervention, setIntervention] = useState<string>("");
  const [description, setDescription] = useState("");
  const [urgence, setUrgence] = useState<(typeof URGENCES)[number]>("Normal");
  const [photos, setPhotos] = useState<string[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  const creer = trpc.devis.create.useMutation({
    onSuccess: (d) => navigate(`/compte?devis=DEV-${d.id}`),
    onError: (e) => setErreur(e.message),
  });

  function envoyer() {
    setErreur(null);
    if (!user) {
      navigate("/connexion?retour=/garage/demande-devis");
      return;
    }
    if (!intervention) {
      setErreur("Choisissez l'intervention souhaitée.");
      return;
    }
    creer.mutate({
      contactNom: user.name || user.email,
      contactEmail: user.email,
      contactTelephone: user.phone ?? undefined,
      vehiculeMarque: marque || undefined,
      vehiculeModele: modele || undefined,
      vehiculeAnnee: annee ? Number(annee) : undefined,
      immatriculation: method === "plaque" ? immat || undefined : method === "vin" ? vin || undefined : undefined,
      typeIntervention: intervention,
      description: [description, motorisation ? `Motorisation : ${motorisation}` : "", `Urgence : ${urgence}`]
        .filter(Boolean)
        .join("\n"),
      photos,
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Demande de devis</h1><p className="mt-1 text-sm text-white/60">Devis gratuit en 24h</p></div>
      <div className="px-4 mt-4 flex gap-2">{(["plaque", "vin", "manuelle"] as const).map(m => (<button key={m} onClick={() => setMethod(m)} className={`flex-1 rounded-lg py-2 text-xs font-bold ${method === m ? "bg-[#D4AF37] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"}`}>{m === "plaque" ? "Plaque" : m === "vin" ? "VIN" : "Manuelle"}</button>))}</div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        {method === "plaque" && <><label className="text-xs text-[#6B7280]">Plaque d'immatriculation</label><div className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" value={immat} onChange={(e) => setImmat(e.target.value.toUpperCase())} placeholder="AB-123-CD" className="w-full bg-transparent text-sm outline-none" /></div></>}
        {method === "vin" && <><label className="text-xs text-[#6B7280]">Numéro VIN</label><input type="text" value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} placeholder="VF3XXXXXXXXXX" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></>}
        {method === "manuelle" && (
          <>
            {([["Marque", marque, setMarque], ["Modèle", modele, setModele], ["Année", annee, setAnnee], ["Motorisation", motorisation, setMotorisation]] as const).map(([label, valeur, set]) => (
              <div key={label}>
                <label className="text-xs text-[#6B7280]">{label}</label>
                <input type="text" value={valeur} onChange={(e) => set(e.target.value)} placeholder={label} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
              </div>
            ))}
          </>
        )}
        <div>
          <label className="text-xs text-[#6B7280]">Intervention souhaitée</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {INTERVENTIONS.map(i => (
              <button key={i} onClick={() => setIntervention(i)} className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold transition ${intervention === i ? "bg-[#111] text-[#D4AF37]" : "bg-[#F5F3EF] text-[#111]"}`}>
                {intervention === i && <Check size={10} />} {i}
              </button>
            ))}
          </div>
        </div>
        <div><label className="text-xs text-[#6B7280]">Décrivez le problème</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bruit au freinage, voyant allumé..." className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm h-20" /></div>
        <div>
          <label className="text-xs text-[#6B7280]">Photos ou vidéo du problème</label>
          <FileUpload
            label="Ajouter des photos / une vidéo"
            accept="image/*,video/*"
            maxFiles={8}
            onUploaded={(f) => setPhotos((p) => [...p, ...f.map((x) => x.url)])}
          />
        </div>
        <div className="flex gap-2">{URGENCES.map(u => (
          <button key={u} onClick={() => setUrgence(u)} className={`flex-1 rounded-lg py-2 text-xs font-bold border ${urgence === u ? "ring-2 ring-[#111] " : ""}${u === "Normal" ? "bg-green-50 text-green-600 border-green-200" : u === "Urgent" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-red-50 text-red-600 border-red-200"}`}>{u}</button>
        ))}</div>
        {erreur && <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600">{erreur}</p>}
        <button onClick={envoyer} disabled={creer.isPending} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60">
          <Send size={14} /> {creer.isPending ? "Envoi en cours…" : "Envoyer ma demande"}
        </button>
      </div>
    </div>
  );
}
