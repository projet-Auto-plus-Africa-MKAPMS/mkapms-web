import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Info,
  Gavel,
  Handshake,
  Store,
  Wrench,
} from "lucide-react";
import VehicleIdentification, { type VehicleData } from "../components/VehicleIdentification";
import { trpc } from "../lib/trpc";

const ETATS = [
  { value: "excellent", label: "Excellent" },
  { value: "tres_bon", label: "Tres bon" },
  { value: "bon", label: "Bon" },
  { value: "correct", label: "Correct" },
  { value: "a_renover", label: "A renover" },
] as const;

const CONFIANCE_LABEL: Record<string, string> = {
  bonne: "Confiance bonne",
  moyenne: "Confiance moyenne",
  faible: "Confiance faible",
};

function euros(n: number) {
  return `${n.toLocaleString("fr-FR")} EUR`;
}

export default function EstimationAuto() {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [km, setKm] = useState("");
  const [etat, setEtat] = useState<(typeof ETATS)[number]["value"]>("bon");
  const [erreur, setErreur] = useState<string | null>(null);
  const [repriseEnvoyee, setRepriseEnvoyee] = useState<string | null>(null);

  const estimate = trpc.voEngine.estimate.useMutation({
    onError: (e) => setErreur(e.message),
  });
  const reprise = trpc.voEngine.requestReprise.useMutation({
    onSuccess: (r) => setRepriseEnvoyee(r.reference),
    onError: (e) => setErreur(e.message),
  });

  const resultat = estimate.data;

  const lancerEstimation = () => {
    if (!vehicle) return;
    setErreur(null);
    setRepriseEnvoyee(null);
    estimate.mutate({
      plaque: vehicle.plaque,
      vin: vehicle.vin,
      marque: vehicle.marque,
      modele: vehicle.modele,
      version: vehicle.version ?? undefined,
      annee: vehicle.annee ?? undefined,
      kilometrage: km ? Number(km.replace(/\D/g, "")) : undefined,
      carburant: vehicle.carburant ?? undefined,
      boite: vehicle.boite ?? undefined,
      etat,
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Calculator size={20} className="text-[#D4AF37]" /> Estimation automobile</h1>
        <p className="mt-1 text-sm text-white/60 flex items-center gap-1"><Sparkles size={12} /> Fourchette calculee sur le marche reel</p>
      </div>

      <div className="px-4 mt-4">
        <VehicleIdentification onVehicleFound={(v) => { setVehicle(v); setErreur(null); }} />
      </div>

      {vehicle && (
        <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-3 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-[#6B7280]">Kilometrage</label>
            <input
              value={km}
              onChange={(e) => setKm(e.target.value)}
              inputMode="numeric"
              placeholder="Ex : 85 000"
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#6B7280]">Etat general</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {ETATS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEtat(e.value)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold border ${etat === e.value ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={lancerEstimation}
            disabled={estimate.isPending}
            className="w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-60"
          >
            {estimate.isPending ? "Estimation en cours..." : "Estimer mon vehicule"}
          </button>
        </div>
      )}

      {erreur && (
        <p className="mx-4 mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">{erreur}</p>
      )}

      {resultat && (
        <div className="mx-4 mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
              <TrendingDown size={14} className="mx-auto text-red-500" />
              <p className="text-[9px] text-red-600 mt-1">Basse</p>
              <p className="text-sm font-black text-red-600">{euros(resultat.low)}</p>
            </div>
            <div className="rounded-xl bg-[#D4AF37]/10 border-2 border-[#D4AF37]/40 p-3 text-center">
              <Minus size={14} className="mx-auto text-[#D4AF37]" />
              <p className="text-[9px] text-[#D4AF37] mt-1">Moyenne</p>
              <p className="text-base font-black text-[#D4AF37]">{euros(resultat.mid)}</p>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
              <TrendingUp size={14} className="mx-auto text-green-600" />
              <p className="text-[9px] text-green-600 mt-1">Haute</p>
              <p className="text-sm font-black text-green-600">{euros(resultat.high)}</p>
            </div>
          </div>

          {/* Sur quoi repose reellement ce chiffre */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-start gap-2">
            <Info size={14} className="text-[#6B7280] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-[#111]">
                {resultat.method === "comparables"
                  ? `Base sur ${resultat.sampleSize} annonce(s) comparable(s)`
                  : "Base sur un bareme de decote"}
                {" — "}
                {CONFIANCE_LABEL[resultat.confidence]}
              </p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">{resultat.disclaimer}</p>
            </div>
          </div>

          {/* Les suites possibles */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate("/acheter/depot-annonce")}
              className="rounded-xl bg-[#D4AF37] p-3 text-left active:scale-[0.98]"
            >
              <Store size={16} className="text-white" />
              <p className="text-xs font-bold text-white mt-1">Vendre sur MKA.P-MS</p>
            </button>
            <button
              type="button"
              onClick={() =>
                reprise.mutate({ estimationId: resultat.id, countryCode: "FR" })
              }
              disabled={reprise.isPending}
              className="rounded-xl bg-[#111] p-3 text-left active:scale-[0.98] disabled:opacity-60"
            >
              <Handshake size={16} className="text-[#D4AF37]" />
              <p className="text-xs font-bold text-white mt-1">
                {reprise.isPending ? "Envoi..." : "Demander une reprise"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/acheter/encheres")}
              className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98]"
            >
              <Gavel size={16} className="text-[#111]" />
              <p className="text-xs font-bold text-[#111] mt-1">Deposer en enchere</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/garages")}
              className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-left active:scale-[0.98]"
            >
              <Wrench size={16} className="text-[#111]" />
              <p className="text-xs font-bold text-[#111] mt-1">Trouver un professionnel</p>
            </button>
          </div>

          {repriseEnvoyee && (
            <p className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-800">
              Demande de reprise enregistree sous la reference <strong>{repriseEnvoyee}</strong>.
              Une offre ferme vous sera proposee apres examen : ce n'est pas encore un engagement d'achat.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
