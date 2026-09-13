/**
 * MKA.P-MS Intelligence — module Fichiers & documents (LOT IA02F).
 *
 * Pipeline réel (server/intelligences/fichiers.ts) : uploaded → validated →
 * parsed → chunked → indexed → searchable → ready_for_rag, ou `failed` avec
 * l'erreur réelle. Aucun bouton factice : dépôt, liste, statut, recherche et
 * suppression appellent tous un vrai backend.
 */
import { useRef, useState } from "react";
import { FileText, Search, Trash2, Upload } from "lucide-react";
import { trpc } from "../../../lib/trpc";

const LABELS_STATUT: Record<string, string> = {
  uploaded: "Déposé",
  validated: "Validé",
  parsed: "Texte extrait",
  chunked: "Découpé",
  indexed: "Indexé",
  searchable: "Cherchable",
  ready_for_rag: "Prêt pour le RAG",
  failed: "Échec",
};

function badgeClasse(statut: string): string {
  if (statut === "ready_for_rag") return "bg-emerald-100 text-emerald-700";
  if (statut === "failed") return "bg-red-100 text-red-700";
  return "bg-black/5 text-black/60";
}

function lireEnBase64(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const resultat = lecteur.result as string;
      resolve(resultat.split(",")[1] ?? "");
    };
    lecteur.onerror = () => reject(lecteur.error);
    lecteur.readAsDataURL(fichier);
  });
}

export function FichiersDocuments() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [q, setQ] = useState("");
  const [terme, setTerme] = useState("");

  const utils = trpc.useUtils();
  const liste = trpc.intelligences.fichiersListe.useQuery();
  const recherche = trpc.intelligences.fichierRechercher.useQuery({ q: terme }, { enabled: terme.length >= 2 });
  const deposer = trpc.intelligences.fichierDeposer.useMutation({
    onSuccess: () => utils.intelligences.fichiersListe.invalidate(),
    onError: (e) => setErreur(e.message),
  });
  const supprimer = trpc.intelligences.fichierSupprimer.useMutation({
    onSuccess: () => utils.intelligences.fichiersListe.invalidate(),
  });

  async function onFichierChoisi(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setErreur("");
    setEnCours(true);
    try {
      const donneesBase64 = await lireEnBase64(fichier);
      await deposer.mutateAsync({ nom: fichier.name, typeMime: fichier.type || "application/octet-stream", donneesBase64 });
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec du dépôt.");
    } finally {
      setEnCours(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Upload className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Déposer un fichier</h2>
        </div>
        <p className="mb-2 text-xs text-black/50">PDF, DOCX, XLSX, TXT, CSV, JSON, images (métadonnées seules, sans OCR dans ce lot).</p>
        <input ref={inputRef} type="file" onChange={onFichierChoisi} disabled={enCours} className="text-sm" />
        {enCours && <p className="mt-2 text-xs text-black/40">Traitement en cours…</p>}
        {erreur && <p className="mt-2 text-xs text-red-600">{erreur}</p>}
      </div>

      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Mes fichiers</h2>
        </div>
        {liste.isLoading && <p className="text-sm text-black/40">Chargement…</p>}
        {liste.data?.length === 0 && <p className="text-sm text-black/40">Aucun fichier déposé.</p>}
        <div className="space-y-2">
          {liste.data?.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg border border-black/5 bg-[#FAFAFA] p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-[#111]">{f.nom}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClasse(f.statutPipeline)}`}>
                    {LABELS_STATUT[f.statutPipeline] ?? f.statutPipeline}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-black/40">
                  {f.tailleOctets < 1024 ? `${f.tailleOctets} o` : `${(f.tailleOctets / 1024).toFixed(0)} Ko`}
                  {f.nbPages ? ` · ${f.nbPages} page(s)` : ""}
                </p>
                {f.statutPipeline === "failed" && f.erreur && <p className="mt-0.5 text-[11px] text-red-600">{f.erreur}</p>}
              </div>
              <button
                onClick={() => supprimer.mutate({ id: f.id })}
                className="shrink-0 rounded-lg p-2 text-black/30 hover:bg-red-50 hover:text-red-600"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Rechercher dans mes fichiers</h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTerme(q.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher…"
            className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#8B7500]"
          />
          <button type="submit" className="rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white">
            Chercher
          </button>
        </form>
        {recherche.data && (
          <div className="mt-3 space-y-2">
            {recherche.data.length === 0 && <p className="text-sm text-black/40">Aucun résultat pour « {terme} ».</p>}
            {recherche.data.map((r, i) => (
              <div key={i} className="rounded-lg border border-black/5 p-2.5 text-sm">
                <span className="font-bold text-[#111]">{r.nom}</span>
                <p className="mt-0.5 text-xs text-black/60">{r.extrait}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
