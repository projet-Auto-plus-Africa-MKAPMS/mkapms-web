import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, AlertTriangle, MapPin, Camera, Phone, Truck } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";
import { trpc } from "../../lib/trpc";

const PANNES = ["Panne moteur", "Accident", "Crevaison", "Batterie", "Véhicule immobilisé", "Autre"];

export default function DepannageGarage() {
  const [selectedPanne, setSelectedPanne] = useState<string | null>(null);
  const [adresse, setAdresse] = useState("");
  const [vehicule, setVehicule] = useState("");
  const [message, setMessage] = useState("");

  const demandes = trpc.depannage.myRequests.useQuery(undefined, { retry: false });
  const creer = trpc.depannage.createRequest.useMutation({
    onSuccess: (r) => {
      setMessage(`Demande n°${r.id} enregistrée. Les dépanneurs de la zone peuvent maintenant vous envoyer un devis.`);
      demandes.refetch();
    },
    onError: (e) => setMessage(e.message),
  });

  function envoyer() {
    if (!selectedPanne) {
      setMessage("Choisissez le type de panne : un dépanneur ne peut pas partir sans savoir ce qu'il vient faire.");
      return;
    }
    if (!adresse.trim()) {
      setMessage("Indiquez où se trouve le véhicule : la position n'est pas récupérée automatiquement.");
      return;
    }
    creer.mutate({
      typePanne: selectedPanne,
      adresse: adresse.trim(),
      vehicule: vehicule.trim() || undefined,
      urgent: true,
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-red-700 px-4 pt-6 pb-5">
        <Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><AlertTriangle size={20} /> Dépannage urgent</h1>
        <p className="mt-1 text-sm text-white/80">Demande transmise aux dépanneurs enregistrés</p>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-center">
        <Phone size={20} className="mx-auto text-red-600" />
        <BoutonMoteur
          code="garage_depannage_appel"
          className="mt-1 block w-full text-sm font-bold text-red-700"
        >
          Appel d'urgence
        </BoutonMoteur>
      </div>

      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#111]">Type de panne</h3>
        <div className="flex flex-wrap gap-1.5">
          {PANNES.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPanne(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedPanne === p ? "bg-red-600 text-white" : "bg-[#F5F3EF] text-[#111]"}`}
            >
              {p}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs text-[#6B7280]">Où se trouve le véhicule</label>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5">
            <MapPin size={14} className="text-red-600" />
            <input
              type="text"
              value={adresse}
              onChange={e => setAdresse(e.target.value)}
              placeholder="Adresse, route, point de repère"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-[#6B7280]">Véhicule (optionnel)</label>
          <input
            type="text"
            value={vehicule}
            onChange={e => setVehicule(e.target.value)}
            placeholder="Marque, modèle, plaque"
            className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm"
          />
        </div>

        <BoutonMoteur
          code="garage_depannage_photo"
          className="w-full rounded-lg border-2 border-dashed border-red-300 bg-red-50 py-4 flex flex-col items-center gap-1"
        >
          <Camera size={16} className="text-red-600" />
          <span className="text-[9px]">Joindre une photo</span>
        </BoutonMoteur>

        <BoutonMoteur
          code="garage_depannage_demande"
          className="block w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white text-center active:scale-[0.98]"
          onExecuter={envoyer}
        >
          {creer.isPending ? "Envoi…" : "🚨 Demander un dépanneur"}
        </BoutonMoteur>

        {message && <p className="rounded-lg bg-[#F5F3EF] p-2 text-[11px] text-[#374151]">{message}</p>}
        <p className="text-center text-[10px] text-[#6B7280]">
          Le tarif n'est pas calculé ici : c'est le dépanneur qui envoie son devis après avoir reçu la demande.
        </p>
      </div>

      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <h3 className="text-sm font-bold text-[#111] flex items-center gap-1.5"><Truck size={14} className="text-red-600" /> Mes demandes</h3>
        {demandes.isLoading && <p className="mt-2 text-[11px] text-[#6B7280]">Chargement…</p>}
        {demandes.error && <p className="mt-2 text-[11px] text-[#6B7280]">Connectez-vous pour voir vos demandes de dépannage.</p>}
        {demandes.data?.length === 0 && <p className="mt-2 text-[11px] text-[#6B7280]">Aucune demande enregistrée.</p>}
        <div className="mt-2 space-y-2">
          {demandes.data?.map(d => (
            <div key={d.id} className="rounded-lg border border-[#E5E7EB] p-2.5">
              <p className="text-xs font-bold text-[#111]">n°{d.id} — {d.typePanne ?? "panne non précisée"}</p>
              <p className="text-[10px] text-[#6B7280]">{d.adresse ?? "adresse non transmise"} · état : {d.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
