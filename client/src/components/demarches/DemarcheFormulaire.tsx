/**
 * Formulaire de dépôt d'une démarche administrative.
 *
 * L'écran ne connaît ni les champs ni les pièces : il les lit dans le
 * catalogue du moteur Démarches (`carteGrise.catalogue`), téléverse les
 * pièces par le service d'upload existant, puis confie le dépôt au moteur
 * (`carteGrise.deposerDemarche`) qui refuse tout dossier incomplet. Le suivi
 * affiché ensuite est celui du dossier réellement créé.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, FileText } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { BoutonMoteur } from "../../lib/boutonMoteur";
import FileUpload from "../FileUpload";

interface Props {
  code: string;
  /** Couleur d'accent de l'écran (classe Tailwind de fond du bouton principal). */
  accent?: string;
}

interface PieceFournie {
  code: string;
  nom: string;
  url: string;
  mimeType?: string;
  taille?: number;
}

const LIBELLES_CHAMPS: Record<string, { label: string; placeholder: string }> = {
  immatriculation: { label: "Immatriculation", placeholder: "AA-123-BB" },
  vin: { label: "Numéro VIN (châssis)", placeholder: "17 caractères" },
  marque: { label: "Marque", placeholder: "Marque du véhicule" },
  modele: { label: "Modèle", placeholder: "Modèle du véhicule" },
  annee: { label: "Année", placeholder: "2020" },
  vendeurNom: { label: "Nom du vendeur", placeholder: "Nom complet" },
  acheteurNom: { label: "Nom de l'acheteur / héritier", placeholder: "Nom complet" },
};

export default function DemarcheFormulaire({ code, accent = "bg-[#111]" }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const catalogue = trpc.carteGrise.catalogue.useQuery(undefined, { staleTime: 300_000 });
  const deposer = trpc.carteGrise.deposerDemarche.useMutation();
  const [champs, setChamps] = useState<Record<string, string>>({});
  const [option, setOption] = useState("");
  const [notes, setNotes] = useState("");
  const [pieces, setPieces] = useState<PieceFournie[]>([]);
  const [erreur, setErreur] = useState("");

  const demarche = catalogue.data?.demarches.find((d) => d.code === code);

  if (catalogue.isLoading) {
    return <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">Chargement de la démarche…</div>;
  }
  if (!demarche) {
    return (
      <div className="mx-4 mt-4 rounded-xl bg-white border border-amber-200 p-4 text-sm text-amber-800">
        Cette démarche n'est pas déclarée au moteur Démarches : aucun dépôt possible.
      </div>
    );
  }

  const obligatoiresManquantes = demarche.pieces.filter(
    (p) => p.obligatoire && !pieces.some((f) => f.code === p.code),
  );

  function executer() {
    setErreur("");
    const annee = champs.annee ? Number(champs.annee) : undefined;
    deposer.mutate(
      {
        code,
        immatriculation: champs.immatriculation || undefined,
        vin: champs.vin || undefined,
        marque: champs.marque || undefined,
        modele: champs.modele || undefined,
        annee: annee && Number.isFinite(annee) ? annee : undefined,
        vendeurNom: champs.vendeurNom || undefined,
        acheteurNom: champs.acheteurNom || undefined,
        option: option || undefined,
        notes: notes || undefined,
        pieces,
      },
      {
        onSuccess: (res) => navigate(`/demarches/suivi-dossier?id=${res.id}`),
        onError: (e) => setErreur(e.message),
      },
    );
  }

  return (
    <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
      <p className="text-xs text-[#6B7280]">{demarche.description}</p>

      {demarche.champs.map((c) => {
        const l = LIBELLES_CHAMPS[c];
        return (
          <div key={c}>
            <label className="text-xs text-[#6B7280]">{l.label}</label>
            <input
              type={c === "annee" ? "number" : "text"}
              placeholder={l.placeholder}
              value={champs[c] ?? ""}
              onChange={(e) => setChamps((s) => ({ ...s, [c]: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm"
            />
          </div>
        );
      })}

      {demarche.options && (
        <div>
          <label className="text-xs text-[#6B7280]">{demarche.options.libelle}</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {demarche.options.valeurs.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setOption(v)}
                className={`rounded-lg border py-2.5 text-xs font-bold ${option === v ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#111]" : "border-[#E5E7EB] text-[#6B7280]"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {demarche.noteLibelle && (
        <div>
          <label className="text-xs text-[#6B7280]">{demarche.noteLibelle}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm"
          />
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-bold text-[#111] flex items-center gap-1"><FileText size={12} /> Pièces à fournir</p>
        {demarche.pieces.map((p) => {
          const fournie = pieces.find((f) => f.code === p.code);
          return (
            <div key={p.code} className="rounded-lg border border-[#E5E7EB] p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className={fournie ? "text-[#111] font-semibold" : "text-[#6B7280]"}>
                  {p.libelle}{p.obligatoire && <span className="text-red-500"> *</span>}
                </span>
                {fournie && <Check size={14} className="text-green-600" />}
              </div>
              {fournie ? (
                <p className="mt-1 truncate text-[10px] text-[#6B7280]">{fournie.nom}</p>
              ) : (
                <FileUpload
                  label="Téléverser"
                  multiple={false}
                  maxFiles={1}
                  onUploaded={(files) => {
                    const f = files[0];
                    if (!f) return;
                    setPieces((prev) => [
                      ...prev.filter((x) => x.code !== p.code),
                      { code: p.code, nom: f.originalName, url: f.url, mimeType: f.mimeType, taille: f.size },
                    ]);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {erreur && <p className="rounded-lg bg-red-50 border border-red-200 p-2 text-[11px] text-red-700">{erreur}</p>}

      {!user ? (
        <BoutonMoteur code="demarches_connexion" className={`block w-full rounded-xl ${accent} py-3 text-center text-sm font-bold text-white`}>
          Se connecter pour déposer
        </BoutonMoteur>
      ) : (
        <BoutonMoteur
          code="demarches_deposer"
          onExecuter={executer}
          desactive={
            deposer.isPending
              ? "Dépôt en cours…"
              : obligatoiresManquantes.length
                ? `Pièces manquantes : ${obligatoiresManquantes.map((p) => p.libelle).join(", ")}`
                : undefined
          }
          className={`w-full rounded-xl ${accent} py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50`}
        >
          {deposer.isPending ? "Dépôt en cours…" : `Déposer — ${demarche.titre}`}
        </BoutonMoteur>
      )}
      {obligatoiresManquantes.length > 0 && user && (
        <p className="text-[10px] text-[#6B7280]">Il manque : {obligatoiresManquantes.map((p) => p.libelle).join(", ")}.</p>
      )}
    </div>
  );
}
