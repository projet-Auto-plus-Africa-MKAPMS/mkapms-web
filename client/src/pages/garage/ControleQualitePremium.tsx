/**
 * Contrôle qualité premium — réellement enregistré par le Moteur d'Atelier.
 *
 * Les points cochés restaient sur l'appareil : un contrôle qualité qui
 * disparaît au changement d'écran ne protège personne. Chaque point part
 * maintenant au serveur, qui calcule la conformité globale et publie
 * `atelier.controle_non_conforme` quand un point manque.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";
import { trpc } from "../../lib/trpc";

const CHECKLIST = [
  "Travaux conformes",
  "Niveaux vérifiés",
  "Test freinage",
  "Test route",
  "Voyants éteints",
  "Propreté",
];
const NIVEAUX = ["Mécanicien", "Responsable d'atelier"];

export default function ControleQualitePremium() {
  const [coches, setCoches] = useState<Record<string, boolean>>({});
  const [dossier, setDossier] = useState("");
  const [remarque, setRemarque] = useState("");
  const [message, setMessage] = useState("");
  const faits = CHECKLIST.filter((c) => coches[c]).length;

  const garages = trpc.atelierEngine.mesGarages.useQuery(undefined, { retry: false });
  const [garageId, setGarageId] = useState<number | null>(null);

  const historique = trpc.atelierEngine.validationsDossier.useQuery(
    { dossier: dossier.trim() },
    { enabled: dossier.trim().length > 0, retry: false },
  );

  const enregistrer = trpc.atelierEngine.enregistrerValidation.useMutation({
    onSuccess: (v) => {
      setMessage(
        v.conforme
          ? `Contrôle qualité conforme enregistré sur ${v.dossier} (contrôle n°${v.id}).`
          : `Contrôle enregistré NON conforme sur ${v.dossier} : le véhicule ne doit pas être restitué en l'état, la direction est alertée.`,
      );
      historique.refetch();
    },
    onError: (e) => setMessage(e.message),
  });

  function envoyer() {
    if (dossier.trim().length === 0) {
      setMessage("Indiquez le dossier contrôlé : un contrôle qualité sans dossier ne peut pas être retrouvé.");
      return;
    }
    const points = [
      ...CHECKLIST.map((c) => ({ libelle: c, conforme: !!coches[c] })),
      ...NIVEAUX.map((n) => ({ libelle: `Validation ${n}`, conforme: !!coches[n] })),
    ];
    enregistrer.mutate({
      garageId: garageId ?? undefined,
      dossier: dossier.trim(),
      type: "controle_qualite",
      points,
      remarque: remarque.trim() || undefined,
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Garage
        </Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Shield size={20} className="text-[#D4AF37]" /> CQ Premium
        </h1>
        <p className="mt-1 text-sm text-white/60">Double validation obligatoire</p>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
        <label className="text-[10px] text-[#6B7280]">Dossier / ordre de réparation</label>
        <input
          type="text"
          value={dossier}
          onChange={(e) => setDossier(e.target.value)}
          placeholder="OR-2026-0142"
          className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
        />
        {(garages.data?.length ?? 0) > 1 && (
          <select
            value={garageId ?? ""}
            onChange={(e) => setGarageId(Number(e.target.value))}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
          >
            <option value="">Garage concerné</option>
            {garages.data?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}
        <p className="text-sm font-bold text-[#111]">
          Contrôle à cocher par l'atelier — {faits}/{CHECKLIST.length}
        </p>
        <p className="text-[11px] text-[#6B7280]">
          Rien n'est coché d'avance : la conformité globale est calculée par le serveur et n'est acquise que si
          tous les points et les deux validations sont faits.
        </p>
      </div>

      <div className="px-4 mt-3 space-y-1.5">
        {CHECKLIST.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCoches((v) => ({ ...v, [c]: !v[c] }))}
            className="w-full rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3 text-left"
          >
            {coches[c] ? (
              <Check size={14} className="text-green-600" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-[#D4D4D4]" />
            )}
            <span className="text-sm text-[#111]">{c}</span>
          </button>
        ))}
      </div>

      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
        <h3 className="text-sm font-bold text-[#111]">Validations obligatoires</h3>
        {NIVEAUX.map((niveau) => (
          <button
            key={niveau}
            type="button"
            onClick={() => setCoches((v) => ({ ...v, [niveau]: !v[niveau] }))}
            className="w-full flex items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0 text-left"
          >
            {coches[niveau] ? (
              <Check size={14} className="text-green-600" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-[#D4D4D4]" />
            )}
            <p className="flex-1 text-sm font-semibold text-[#111]">
              {niveau} — {coches[niveau] ? "validé" : "en attente"}
            </p>
          </button>
        ))}

        <textarea
          value={remarque}
          onChange={(e) => setRemarque(e.target.value)}
          placeholder="Remarque conservée avec le contrôle (optionnel)"
          className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[11px]"
          rows={2}
        />

        <BoutonMoteur
          code="garage_cq_validation"
          className="block w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white text-center"
          onExecuter={envoyer}
        >
          {enregistrer.isPending ? "Enregistrement…" : "Valider"}
        </BoutonMoteur>

        {message && (
          <p className="rounded-lg bg-[#F5F3EF] p-2 text-[11px] text-[#374151]">{message}</p>
        )}
      </div>

      {(historique.data?.length ?? 0) > 0 && (
        <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-bold text-[#111]">Contrôles déjà enregistrés</h3>
          {historique.data?.map((v) => (
            <p key={v.id} className="mt-1 text-[10px] text-[#6B7280]">
              #{v.id} · {v.type} · {v.conforme ? "conforme" : "non conforme"} ·{" "}
              {new Date(v.createdAt).toLocaleString("fr-FR")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
