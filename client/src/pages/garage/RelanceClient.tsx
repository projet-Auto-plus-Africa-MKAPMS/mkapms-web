import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, Bell, Send, FileText, Clock, Shield } from "lucide-react";
const RELANCES = [
  { type: "Devis en attente", client: "Ahmed K.", vehicule: "Golf VIII", depuis: "3 jours", icon: FileText },
  { type: "Véhicule prêt", client: "Marie V.", vehicule: "Captur", depuis: "1 jour", icon: Shield },
  { type: "Paiement en attente", client: "SAS Log+", vehicule: "Classe A", depuis: "2 jours", icon: Clock },
  { type: "CT à venir", client: "Jean D.", vehicule: "Clio V", depuis: "15 jours", icon: Bell },
];
export default function RelanceClient() {
  const [params] = useSearchParams();
  const plaque = params.get("plaque");
  const motif = params.get("motif");
  const [relances, setRelances] = useState<Record<string, string>>({});

  const enregistrerRelance = (client: string) => {
    setRelances((prev) => ({
      ...prev,
      [client]: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }));
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Bell size={20} className="text-[#D4AF37]" /> Relance client</h1></div>
      {(plaque || motif) && (
        <div className="mx-4 mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-800">
            Contexte : {plaque && <>véhicule <span className="font-bold">{plaque}</span></>}{plaque && motif ? " — " : ""}{motif}
          </p>
        </div>
      )}
      <div className="px-4 mt-4 space-y-2">{RELANCES.map(r => { const Icon = r.icon; const envoyee = relances[r.client]; return (
        <div key={r.client} className="rounded-xl bg-white border border-amber-200 p-4">
          <div className="flex items-center gap-2"><Icon size={14} className="text-amber-500" /><h3 className="text-sm font-bold text-[#111]">{r.type}</h3></div>
          <p className="text-[10px] text-[#6B7280] mt-0.5">{r.client} · {r.vehicule} · {r.depuis}</p>
          <button
            onClick={() => enregistrerRelance(r.client)}
            className={`mt-2 w-full rounded-lg py-1.5 text-xs font-bold flex items-center justify-center gap-1 transition ${envoyee ? "bg-green-100 text-green-700" : "bg-[#D4AF37] text-white"}`}
          >
            <Send size={10} /> {envoyee ? `Relance enregistrée à ${envoyee}` : "Envoyer relance"}
          </button>
        </div>); })}</div>
    </div>
  );
}
