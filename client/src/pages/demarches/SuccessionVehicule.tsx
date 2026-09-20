import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users, Check } from "lucide-react";
import { trpc } from "../../lib/trpc";
import FileUpload from "../../components/FileUpload";

/* Données réelles : trpc.carteGrise.createDossier (type "autre", table
   cg_dossiers) — aucune valeur d'enum dédiée "succession" n'existe côté
   serveur, le motif est donc porté dans notes, comme DuplicataDemarche.tsx
   pour "duplicata". Jamais un second moteur de dossiers. */

const DOCS = [
  { key: "acte_deces", label: "Acte de décès" },
  { key: "certificat_heredite", label: "Certificat d'hérédité" },
  { key: "carte_grise", label: "Carte grise du véhicule" },
  { key: "piece_identite_heritier", label: "Pièce d'identité héritier" },
  { key: "justificatif_domicile", label: "Justificatif domicile" },
];

export default function SuccessionVehicule() {
  const utils = trpc.useUtils();
  const [immatriculation, setImmatriculation] = useState("");
  const [documents, setDocuments] = useState<Record<string, { url: string; originalName: string; mimeType: string }>>({});

  const mesDossiers = trpc.carteGrise.mesDossiers.useQuery();
  const mesDemandes = (mesDossiers.data ?? []).filter((d) => d.type === "autre" && d.notes?.includes("Succession véhicule"));

  const addDocument = trpc.carteGrise.addDocument.useMutation();
  const create = trpc.carteGrise.createDossier.useMutation({
    onSuccess: async (dossier) => {
      for (const [key, f] of Object.entries(documents)) {
        await addDocument.mutateAsync({ dossierId: dossier.id, type: key, nom: f.originalName, url: f.url, mimeType: f.mimeType });
      }
      setImmatriculation("");
      setDocuments({});
      utils.carteGrise.mesDossiers.invalidate();
    },
  });

  const complet = immatriculation.trim().length > 0 && DOCS.every((d) => documents[d.key]);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-indigo-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} /> Succession véhicule</h1></div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!complet) return;
          create.mutate({ type: "autre", immatriculation, notes: "Succession véhicule" });
        }}
      >
        <div className="px-4 mt-4">
          <label className="text-xs text-[#6B7280]">Plaque d'immatriculation du véhicule</label>
          <input value={immatriculation} onChange={(e) => setImmatriculation(e.target.value)} placeholder="AB-123-CD" required className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm bg-white" />
        </div>

        <div className="px-4 mt-4 space-y-2">
          {DOCS.map((d) => (
            <div key={d.key} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
              <p className="text-sm text-[#111] mb-2">{d.label}{documents[d.key] && <Check size={14} className="inline ml-1.5 text-green-600" />}</p>
              <FileUpload compact label="Télécharger" accept="image/*,.pdf" onUploaded={(files) => files[0] && setDocuments((p) => ({ ...p, [d.key]: files[0] }))} />
            </div>
          ))}
        </div>

        {create.isError && <p className="mx-4 mt-3 text-xs font-semibold text-red-600">{create.error.message}</p>}
        {create.isSuccess && <p className="mx-4 mt-3 text-xs font-semibold text-green-600 flex items-center gap-1"><Check size={12} /> Dossier {create.data.reference} soumis.</p>}

        <div className="px-4 mt-3">
          <button type="submit" disabled={!complet || create.isPending} className="w-full rounded-xl bg-indigo-700 py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50">
            {create.isPending ? "Envoi…" : "Soumettre le dossier succession"}
          </button>
        </div>
      </form>

      {mesDemandes.length > 0 && (
        <div className="px-4 mt-4 space-y-2">
          <h2 className="text-xs font-bold text-[#6B7280] uppercase">Vos dossiers</h2>
          {mesDemandes.map((d) => (
            <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#111]">{d.reference}{d.immatriculation ? ` — ${d.immatriculation}` : ""}</p>
                <p className="text-[10px] text-slate-400">{new Date(d.dateCreation).toLocaleDateString("fr-FR")}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">{d.status.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
