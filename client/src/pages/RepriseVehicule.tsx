import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ArrowRightLeft, Check, Car } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   REPRISE VÉHICULE (/vendre/reprise) — moteur réel server/vo-engine :
   estimate() renvoie une fourchette (jamais un prix ferme), requestReprise()
   transmet la demande à l'équipe humaine, accepterOffre/negocierOffre
   permettent au client de répondre à une offre déjà posée par un humain.
   ══════════════════════════════════════════════════════════════════════════ */

const ETAPES = ["Informations", "Estimation", "Demande envoyée"];

const STATUT_LABEL: Record<string, string> = {
  envoyee: "Demande envoyée",
  en_etude: "En étude",
  offre_proposee: "Offre reçue",
  acceptee: "Offre acceptée",
  refusee: "Refusée",
  annulee: "Annulée",
};

export default function RepriseVehicule() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    marque: "",
    modele: "",
    version: "",
    annee: "",
    kilometrage: "",
    carburant: "",
    boite: "",
    plaque: "",
  });
  const [ville, setVille] = useState("");
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState("");
  const [negociation, setNegociation] = useState<Record<number, string>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const estimer = trpc.voEngine.estimate.useMutation();
  const demander = trpc.voEngine.requestReprise.useMutation();
  const mesDemandes = trpc.voEngine.myRepriseRequests.useQuery(undefined, { enabled: !!user });
  const accepter = trpc.voEngine.accepterOffre.useMutation({ onSuccess: () => mesDemandes.refetch() });
  const negocier = trpc.voEngine.negocierOffre.useMutation({ onSuccess: () => mesDemandes.refetch() });

  const lancerEstimation = () => {
    if (!form.marque || !form.modele) return;
    estimer.mutate(
      {
        marque: form.marque,
        modele: form.modele,
        version: form.version || undefined,
        annee: form.annee ? Number(form.annee) : undefined,
        kilometrage: form.kilometrage ? Number(form.kilometrage) : undefined,
        carburant: form.carburant || undefined,
        boite: form.boite || undefined,
        plaque: form.plaque || undefined,
      },
      { onSuccess: () => setStep(1) },
    );
  };

  const envoyerDemande = () => {
    if (!user) return;
    demander.mutate(
      {
        estimationId: estimer.data?.id,
        countryCode: "FR",
        city: ville || undefined,
        contactPhone: telephone || undefined,
        message: message || undefined,
      },
      { onSuccess: () => { setStep(2); mesDemandes.refetch(); } },
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><ArrowRightLeft size={20} className="text-[#D4AF37]" /> Reprise véhicule</h1>
        <p className="mt-1 text-sm text-white/60">Déposez votre véhicule, recevez une proposition</p>
      </div>
      <div className="px-4 mt-4 flex gap-1">
        {ETAPES.map((e, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} />
            <p className={`text-[8px] mt-0.5 text-center ${i <= step ? "text-[#D4AF37] font-bold" : "text-[#9CA3AF]"}`}>{e}</p>
          </div>
        ))}
      </div>

      {!user && (
        <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <Link to="/connexion" className="font-bold underline">Connectez-vous</Link> pour envoyer une demande de reprise.
        </div>
      )}

      {step === 0 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Informations véhicule</h3>
          {([
            ["marque", "Marque", "Ex: Peugeot"],
            ["modele", "Modèle", "Ex: 3008"],
            ["version", "Version (optionnel)", "Ex: GT"],
            ["annee", "Année", "Ex: 2022"],
            ["kilometrage", "Kilométrage", "Ex: 45000"],
            ["carburant", "Carburant", "Essence, Diesel, Hybride…"],
            ["boite", "Boîte", "Manuelle, Automatique"],
            ["plaque", "Immatriculation (optionnel)", "AB-123-CD"],
          ] as const).map(([k, l, p]) => (
            <div key={k}>
              <label className="text-xs text-[#6B7280]">{l}</label>
              <input
                type="text"
                placeholder={p}
                value={form[k]}
                onChange={set(k)}
                className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm"
              />
            </div>
          ))}
          <button
            onClick={lancerEstimation}
            disabled={estimer.isPending || !form.marque || !form.modele}
            className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {estimer.isPending ? "Estimation…" : "Estimer mon véhicule"}
          </button>
          {estimer.error && <p className="text-xs text-red-600 text-center">{estimer.error.message}</p>}
        </div>
      )}

      {step === 1 && estimer.data && (
        <div className="mx-4 mt-4 space-y-3">
          <div className="rounded-xl bg-white border border-[#D4AF37]/30 p-4 text-center">
            <Car size={28} className="mx-auto text-[#D4AF37] mb-2" />
            <p className="text-xs text-[#6B7280]">Fourchette d'estimation</p>
            <p className="text-2xl font-black text-[#D4AF37] mt-1">
              {estimer.data.low.toLocaleString("fr-FR")} – {estimer.data.high.toLocaleString("fr-FR")} {estimer.data.currency}
            </p>
            <p className="text-[10px] text-[#6B7280] mt-2">{estimer.data.disclaimer}</p>
          </div>
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#111]">Vos coordonnées pour la reprise</h3>
            <div>
              <label className="text-xs text-[#6B7280]">Ville</label>
              <input type="text" value={ville} onChange={(e) => setVille(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-[#6B7280]">Téléphone</label>
              <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-[#6B7280]">Message (optionnel)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm resize-none h-16" />
            </div>
            <button
              onClick={envoyerDemande}
              disabled={!user || demander.isPending}
              className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
            >
              {demander.isPending ? "Envoi…" : "Envoyer ma demande de reprise"}
            </button>
            {demander.error && <p className="text-xs text-red-600 text-center">{demander.error.message}</p>}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 text-center space-y-2">
          <Check size={28} className="mx-auto text-green-600" />
          <h3 className="text-base font-bold text-[#111]">Demande envoyée</h3>
          <p className="text-xs text-[#6B7280]">Une offre ferme vous sera proposée après étude humaine de votre dossier.</p>
        </div>
      )}

      {/* Historique réel des demandes — jamais un montant inventé */}
      {user && (mesDemandes.data ?? []).length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-base font-bold text-[#111]">Mes demandes de reprise</h2>
          <div className="mt-3 space-y-2">
            {(mesDemandes.data ?? []).map((d) => (
              <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111]">{d.reference}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100">
                    {STATUT_LABEL[d.status] ?? d.status}
                  </span>
                </div>
                {d.offerAmount && (
                  <p className="text-lg font-black text-[#D4AF37]">{Number(d.offerAmount).toLocaleString("fr-FR")} €</p>
                )}
                {d.status === "offre_proposee" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => accepter.mutate({ id: d.id })}
                        disabled={accepter.isPending}
                        className="rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
                      >
                        Accepter
                      </button>
                      <input
                        type="text"
                        placeholder="Votre contre-proposition…"
                        value={negociation[d.id] ?? ""}
                        onChange={(e) => setNegociation((n) => ({ ...n, [d.id]: e.target.value }))}
                        className="col-span-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs"
                      />
                      <button
                        onClick={() => {
                          const msg = negociation[d.id]?.trim();
                          if (msg) negocier.mutate({ id: d.id, message: msg });
                        }}
                        disabled={negocier.isPending || !negociation[d.id]?.trim()}
                        className="col-span-2 rounded-xl border-2 border-[#E5E7EB] py-2.5 text-sm font-bold text-[#6B7280] disabled:opacity-50"
                      >
                        Négocier
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
