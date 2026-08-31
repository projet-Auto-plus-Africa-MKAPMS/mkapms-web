/**
 * Validation interne d'atelier — réellement enregistrée par le Moteur
 * d'Atelier (`atelierEngine.enregistrerValidation`).
 *
 * L'écran ne décrivait qu'une chaîne de validation attendue, faute de dossier
 * serveur. La conformité n'est pas déclarée ici : le serveur la calcule à
 * partir des points réellement cochés, et un contrôle non conforme part en
 * alerte au Système Intelligent via l'Event Bus.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";
import { trpc } from "../../lib/trpc";

const NIVEAUX = ["Mécanicien", "Chef d'atelier", "Responsable"];

export default function ValidationInterne() {
  const [dossier, setDossier] = useState("");
  const [remarque, setRemarque] = useState("");
  const [coches, setCoches] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");

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
          ? `Validation interne enregistrée conforme sur ${v.dossier} (validation n°${v.id}).`
          : `Validation enregistrée NON conforme sur ${v.dossier} : les points non validés sont signalés à la direction.`,
      );
      historique.refetch();
    },
    onError: (e) => setMessage(e.message),
  });

  function envoyer() {
    if (dossier.trim().length === 0) {
      setMessage("Indiquez le dossier ou l'ordre de réparation : une validation sans dossier n'est pas opposable.");
      return;
    }
    const points = NIVEAUX.map((n) => ({ libelle: n, conforme: !!coches[n] }));
    enregistrer.mutate({
      garageId: garageId ?? undefined,
      dossier: dossier.trim(),
      type: "validation_interne",
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
          <Shield size={20} className="text-[#D4AF37]" /> Validation interne
        </h1>
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
        <p className="text-[10px] text-[#6B7280]">
          La conformité globale est calculée par le serveur : elle n'est acquise que si tous les niveaux
          ci-dessous sont validés.
        </p>
      </div>

      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
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
            <div className="flex-1">
              <p className="text-sm font-bold text-[#111]">{niveau}</p>
              <p className="text-[9px] text-[#6B7280]">
                {coches[niveau] ? "Validé" : "En attente — non validé"}
              </p>
            </div>
          </button>
        ))}

        <textarea
          value={remarque}
          onChange={(e) => setRemarque(e.target.value)}
          placeholder="Remarque conservée avec la validation (optionnel)"
          className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[11px]"
          rows={2}
        />

        <BoutonMoteur
          code="garage_validation_interne"
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
          <h3 className="text-sm font-bold text-[#111]">Validations déjà enregistrées</h3>
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
