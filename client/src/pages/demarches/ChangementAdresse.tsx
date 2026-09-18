import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MapPin, Check } from "lucide-react";
import { trpc } from "../../lib/trpc";
import FileUpload from "../../components/FileUpload";

/**
 * Changement d'adresse (/demarches/changement-adresse).
 *
 * Données réelles : trpc.carteGrise.createDossier (server/routers/cartegrise.ts,
 * table cg_dossiers) — aucun type dédié « changement_adresse » n'existe dans
 * l'énumération réelle des démarches (declaration_achat/cession, carte_grise,
 * changement_titulaire, vehicule_etranger, ww_cpi, w_garage, duplicata,
 * correction, autre) : ce dossier est donc créé en type « autre », avec la
 * nouvelle adresse portée dans le champ notes réel — jamais un champ adresse
 * inventé qui n'existe pas dans le schéma.
 */
const PREFIXE_NOTES = "Changement d'adresse —";

export default function ChangementAdresse() {
  const utils = trpc.useUtils();
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [ville, setVille] = useState("");
  const [justificatifs, setJustificatifs] = useState<{ url: string; originalName: string; mimeType: string }[]>([]);

  const mesDossiers = trpc.carteGrise.mesDossiers.useQuery();
  const mesDemandes = (mesDossiers.data ?? []).filter((d) => d.type === "autre" && d.notes?.startsWith(PREFIXE_NOTES));

  const addDocument = trpc.carteGrise.addDocument.useMutation();
  const create = trpc.carteGrise.createDossier.useMutation({
    onSuccess: async (dossier) => {
      for (const f of justificatifs) {
        await addDocument.mutateAsync({ dossierId: dossier.id, type: "justificatif_domicile", nom: f.originalName, url: f.url, mimeType: f.mimeType });
      }
      setAdresse(""); setCodePostal(""); setVille(""); setJustificatifs([]);
      utils.carteGrise.mesDossiers.invalidate();
    },
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-cyan-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><MapPin size={20} /> Changement adresse</h1></div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!adresse.trim()) return;
          create.mutate({ type: "autre", notes: `${PREFIXE_NOTES} ${adresse}, ${codePostal} ${ville}`.trim() });
        }}
        className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3"
      >
        <div><label className="text-xs text-[#6B7280]">Nouvelle adresse</label><input value={adresse} onChange={(e) => setAdresse(e.target.value)} type="text" placeholder="Adresse complète" required className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
        <div><label className="text-xs text-[#6B7280]">Code postal</label><input value={codePostal} onChange={(e) => setCodePostal(e.target.value)} type="text" placeholder="75000" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
        <div><label className="text-xs text-[#6B7280]">Ville</label><input value={ville} onChange={(e) => setVille(e.target.value)} type="text" placeholder="Paris" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
        <div>
          <label className="text-xs text-[#6B7280]">Justificatif domicile</label>
          <div className="mt-1"><FileUpload compact label="Télécharger" accept="image/*,.pdf" onUploaded={(files) => setJustificatifs((p) => [...p, ...files])} /></div>
        </div>
        <button type="submit" disabled={create.isPending || !adresse.trim()} className="w-full rounded-xl bg-cyan-700 py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50">
          {create.isPending ? "Envoi…" : "Valider le changement"}
        </button>
        {create.isError && <p className="text-xs font-semibold text-red-600">{create.error.message}</p>}
        {create.isSuccess && <p className="text-xs font-semibold text-green-600 flex items-center gap-1"><Check size={12} /> Demande {create.data.reference} envoyée.</p>}
      </form>

      {mesDemandes.length > 0 && (
        <div className="mx-4 mt-4 space-y-2">
          <h2 className="text-xs font-bold text-[#6B7280] uppercase">Vos demandes</h2>
          {mesDemandes.map((d) => (
            <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#111]">{d.reference}</p>
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
