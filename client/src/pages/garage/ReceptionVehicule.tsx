import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Camera, FileText, Check } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";
import { imprimerFeuille } from "../../lib/documents";

const PHOTOS = ["Avant gauche", "Avant droite", "Arrière gauche", "Arrière droite", "Intérieur"];
const CHAMPS = [
  { cle: "plaque", label: "Plaque" },
  { cle: "vehicule", label: "Marque / Modèle" },
  { cle: "kilometrage", label: "Kilométrage" },
  { cle: "observations", label: "Observations" },
] as const;

export default function ReceptionVehicule() {
  const [fiche, setFiche] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const complet = !!fiche.plaque?.trim() && !!fiche.vehicule?.trim();

  function editerFiche() {
    if (!complet) {
      setMessage("Plaque et véhicule sont nécessaires : une fiche de réception sans identification n'est opposable à personne.");
      return;
    }
    const ok = imprimerFeuille({
      titre: "Fiche de réception véhicule",
      sousTitre: "Atelier — état constaté à l'arrivée",
      reference: fiche.plaque?.toUpperCase(),
      informations: [
        ...CHAMPS.map((c) => ({ libelle: c.label, valeur: fiche[c.cle] || "—" })),
        { libelle: "Photos sélectionnées", valeur: `${Object.keys(photos).length} / ${PHOTOS.length}` },
      ],
      mentions: [
        "Les photos choisies ne sont ni jointes à ce document ni archivées : aucun stockage des photos de réception n'existe encore côté serveur.",
        "La signature du client se fait sur le document imprimé : aucune signature électronique n'est enregistrée à ce jour.",
      ],
      typeDocument: "export_donnees",
    });
    setMessage(
      ok
        ? "Fiche ouverte : imprimez-la ou enregistrez-la en PDF, puis faites-la signer au client."
        : "La fenêtre d'impression a été bloquée par le navigateur : autorisez les fenêtres pour ce site.",
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Réception véhicule</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#111]">Fiche réception</h3>
        {CHAMPS.map(c => (
          <div key={c.cle}>
            <label className="text-xs text-[#6B7280]">{c.label}</label>
            <input
              type="text"
              value={fiche[c.cle] ?? ""}
              onChange={e => setFiche(f => ({ ...f, [c.cle]: e.target.value }))}
              placeholder={c.label}
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm"
            />
          </div>
        ))}
        <h3 className="text-sm font-bold text-[#111] pt-2">Photos de l'état constaté</h3>
        <div className="grid grid-cols-3 gap-2">{PHOTOS.map(p => (
          <label key={p} className="cursor-pointer rounded-lg border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 py-6 flex flex-col items-center gap-1">
            {photos[p] ? <Check size={16} className="text-green-600" /> : <Camera size={16} className="text-[#D4AF37]" />}
            <span className="text-[8px] font-semibold text-[#111] text-center px-1">{p}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) setPhotos(prev => ({ ...prev, [p]: f.name }));
              }}
            />
          </label>))}
        </div>
        <p className="text-[10px] text-[#6B7280]">
          {Object.keys(photos).length} photo(s) sélectionnée(s) sur {PHOTOS.length}. Le compte est repris sur la fiche imprimée ; les fichiers eux-mêmes ne sont pas encore archivés côté serveur.
        </p>
        <div className="pt-2 space-y-2">
          <BoutonMoteur
            code="garage_reception_fiche"
            className="block w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white text-center active:scale-[0.98]"
            onExecuter={editerFiche}
          >
            Éditer la fiche de réception
          </BoutonMoteur>
          <BoutonMoteur
            code="garage_reception_devis"
            className="block w-full rounded-xl bg-white border border-[#E5E7EB] py-3 text-sm font-bold text-[#111] text-center"
            query={fiche.plaque?.trim() ? { plaque: fiche.plaque.trim() } : undefined}
          >
            Ouvrir une demande de devis
          </BoutonMoteur>
        </div>
        {message && <p className="rounded-lg bg-[#F5F3EF] p-2 text-[11px] text-[#374151]">{message}</p>}
      </div>
    </div>
  );
}
