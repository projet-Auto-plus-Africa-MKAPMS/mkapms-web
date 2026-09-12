import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, AlertTriangle, Phone, MapPin, Camera, Car,
  Wrench, Shield, Clock, Check, ChevronRight,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import FileUpload from "../components/FileUpload";

/* ══════════════════════════════════════════════════════════════════════════
   ASSISTANCE & SINISTRE (contexte location, /louer/assistance)
   Réutilise le même moteur Dépannage (server/routers/depannage.ts) que
   /depannage — un seul moteur, jamais un second système d'assistance créé
   pour le contexte location.
   ══════════════════════════════════════════════════════════════════════════ */

const URGENCES = [
  { id: "panne", label: "Panne", desc: "Mon véhicule ne démarre pas ou s'est arrêté", icon: Wrench, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "accident", label: "Accident", desc: "J'ai eu un accident avec le véhicule", icon: AlertTriangle, color: "bg-red-50 text-red-700 border-red-200" },
  { id: "depannage", label: "Dépannage", desc: "J'ai besoin d'un dépanneur sur place", icon: Car, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "immobilise", label: "Véhicule immobilisé", desc: "Le véhicule est bloqué et inutilisable", icon: Shield, color: "bg-purple-50 text-purple-700 border-purple-200" },
];

const STATUT_LABEL: Record<string, string> = {
  demande: "Demande envoyée",
  en_recherche: "Recherche en cours",
  devis_envoye: "Devis reçu",
  acceptee: "Mission acceptée",
  en_intervention: "Intervention en cours",
  terminee: "Résolu",
  annulee: "Annulée",
  litige: "Litige en cours",
};

export default function AssistanceSinistre() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<{ url: string }[]>([]);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLabel, setGpsLabel] = useState("Position non détectée");
  const [envoye, setEnvoye] = useState(false);

  const mesRequetes = trpc.depannage.myRequests.useQuery(undefined, { enabled: !!user });
  const createRequest = trpc.depannage.createRequest.useMutation({
    onSuccess: () => {
      setEnvoye(true);
      setSelected(null);
      setDescription("");
      setPhotos([]);
      mesRequetes.refetch();
    },
  });

  const detecterPosition = () => {
    if (!navigator.geolocation) { setGpsLabel("GPS non supporté"); return; }
    setGpsLabel("Détection…");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsLabel("Position actuelle détectée"); },
      () => setGpsLabel("Position non disponible"),
    );
  };

  const envoyer = () => {
    if (!user || !selected) return;
    createRequest.mutate({
      typePanne: URGENCES.find((u) => u.id === selected)?.label,
      description: description || undefined,
      urgent: selected === "accident" || selected === "immobilise",
      lat: gps?.lat,
      lng: gps?.lng,
      photos: photos.length > 0 ? photos.map((p) => p.url) : undefined,
    });
  };

  const historique = (mesRequetes.data ?? []).filter((r) => r.status === "terminee" || r.status === "annulee");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-red-600 px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><AlertTriangle size={20} /> Assistance & Sinistre</h1>
        <p className="mt-1 text-sm text-white/80">Assistance 24h/24, 7j/7</p>
      </div>

      {/* Emergency call — même numéro déjà affiché, désormais un vrai lien d'appel */}
      <div className="mx-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3 shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
          <Phone size={20} className="text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[#111]">Appel d'urgence</h3>
          <p className="text-xs text-[#6B7280]">09 70 70 50 50 — 24h/24</p>
        </div>
        <a href="tel:0970705050" className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white active:scale-[0.98]">Appeler</a>
      </div>

      {!user && (
        <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <Link to="/connexion" className="font-bold underline">Connectez-vous</Link> pour envoyer une demande d'assistance suivie dans votre compte.
        </div>
      )}

      {envoye && (
        <div className="mx-4 mt-4 rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-800 flex items-center gap-2">
          <Check size={14} /> Demande envoyée — suivez son évolution ci-dessous ou depuis « Mes démarches ».
        </div>
      )}

      {/* Type selection */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Quel est votre problème ?</h2>
        <div className="mt-3 space-y-2">
          {URGENCES.map((u) => {
            const Icon = u.icon;
            return (
              <button key={u.id} onClick={() => setSelected(u.id)} className={`w-full flex items-center gap-3 rounded-xl border-2 p-4 text-left transition ${selected === u.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : `${u.color}`}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm"><Icon size={18} /></div>
                <div className="flex-1"><span className="text-sm font-bold text-[#111]">{u.label}</span><p className="text-[10px] text-[#6B7280]">{u.desc}</p></div>
                <ChevronRight size={16} className="text-red-500" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Steps after selection */}
      {selected && user && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-4">
          <h3 className="text-sm font-bold text-[#111]">Détails de l'incident</h3>

          <div>
            <label className="text-xs text-[#6B7280]">Position GPS</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
              <MapPin size={14} className="text-red-500" />
              <span className="text-sm text-[#111]">{gpsLabel}</span>
              <button onClick={detecterPosition} className="ml-auto text-xs font-semibold text-[#D4AF37]">Détecter</button>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#6B7280]">Description</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm resize-none h-16"
              placeholder="Décrivez la situation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-[#6B7280]">Photos de l'incident</label>
            <div className="mt-1">
              <FileUpload label="Ajouter des photos" accept="image/*" onUploaded={(files) => setPhotos((p) => [...p, ...files])} compact />
            </div>
            {photos.length > 0 && <p className="mt-1 text-xs text-green-600">{photos.length} photo(s) ajoutée(s)</p>}
          </div>

          <button
            onClick={envoyer}
            disabled={createRequest.isPending}
            className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md disabled:opacity-50"
          >
            <AlertTriangle size={16} /> {createRequest.isPending ? "Envoi…" : "Envoyer la demande d'assistance"}
          </button>
          {createRequest.error && <p className="text-xs text-red-600 text-center">{createRequest.error.message}</p>}
          <p className="text-[10px] text-[#9CA3AF] text-center">Votre demande est transmise aux dépanneurs partenaires de votre secteur.</p>
        </div>
      )}

      {/* History — réel (trpc.depannage.myRequests), jamais des incidents inventés */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Historique des incidents</h2>
        {!user && <p className="mt-3 text-xs text-[#6B7280]">Connectez-vous pour voir votre historique.</p>}
        {user && historique.length === 0 && <p className="mt-3 text-xs text-[#6B7280]">Aucun incident pour le moment.</p>}
        <div className="mt-3 space-y-2">
          {historique.map((h) => (
            <div key={h.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111]">{h.typePanne ?? "Incident"}{h.vehicule ? ` — ${h.vehicule}` : ""}</h3>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${h.status === "terminee" ? "text-green-600 bg-green-50" : "text-slate-500 bg-slate-100"}`}>
                  {h.status === "terminee" && <Check size={10} />} {STATUT_LABEL[h.status] ?? h.status}
                </span>
              </div>
              {h.description && <p className="text-xs text-[#6B7280] mt-1">{h.description}</p>}
              <p className="text-[10px] text-[#9CA3AF] mt-1">{new Date(h.createdAt).toLocaleDateString("fr-FR")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
