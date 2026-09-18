import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check } from "lucide-react";
import { trpc } from "../../lib/trpc";
import FileUpload from "../../components/FileUpload";

/** Données réelles : trpc.carteGrise.createDossier (type "declaration_cession", table cg_dossiers). */
export default function DeclarationCession() {
  const utils = trpc.useUtils();
  const [immatriculation, setImmatriculation] = useState("");
  const [vendeurNom, setVendeurNom] = useState("");
  const [acheteurNom, setAcheteurNom] = useState("");
  const [documents, setDocuments] = useState<{ url: string; originalName: string; mimeType: string }[]>([]);

  const mesDossiers = trpc.carteGrise.mesDossiers.useQuery();
  const mesDemandes = (mesDossiers.data ?? []).filter((d) => d.type === "declaration_cession");

  const addDocument = trpc.carteGrise.addDocument.useMutation();
  const create = trpc.carteGrise.createDossier.useMutation({
    onSuccess: async (dossier) => {
      for (const f of documents) {
        await addDocument.mutateAsync({ dossierId: dossier.id, type: "piece_dossier", nom: f.originalName, url: f.url, mimeType: f.mimeType });
      }
      setImmatriculation(""); setVendeurNom(""); setAcheteurNom(""); setDocuments([]);
      utils.carteGrise.mesDossiers.invalidate();
    },
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-green-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} /> Déclaration cession</h1></div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!immatriculation.trim()) return;
          create.mutate({ type: "declaration_cession", immatriculation, vendeurNom: vendeurNom || undefined, acheteurNom: acheteurNom || undefined });
        }}
        className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3"
      >
        <div><label className="text-xs text-[#6B7280]">Immatriculation</label><input value={immatriculation} onChange={(e) => setImmatriculation(e.target.value)} placeholder="AB-123-CD" required className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
        <div><label className="text-xs text-[#6B7280]">Vendeur</label><input value={vendeurNom} onChange={(e) => setVendeurNom(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
        <div><label className="text-xs text-[#6B7280]">Acheteur</label><input value={acheteurNom} onChange={(e) => setAcheteurNom(e.target.value)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
        <div>
          <label className="text-xs text-[#6B7280]">Certificat de cession (Cerfa), carte grise barrée, pièce d'identité vendeur</label>
          <div className="mt-1"><FileUpload compact label="Télécharger" accept="image/*,.pdf" onUploaded={(files) => setDocuments((p) => [...p, ...files])} /></div>
        </div>
        <button type="submit" disabled={create.isPending || !immatriculation.trim()} className="w-full rounded-xl bg-green-700 py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50">
          {create.isPending ? "Envoi…" : "Valider la cession"}
        </button>
        {create.isError && <p className="text-xs font-semibold text-red-600">{create.error.message}</p>}
        {create.isSuccess && <p className="text-xs font-semibold text-green-600 flex items-center gap-1"><Check size={12} /> Dossier {create.data.reference} créé.</p>}
      </form>

      {mesDemandes.length > 0 && (
        <div className="mx-4 mt-4 space-y-2">
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
