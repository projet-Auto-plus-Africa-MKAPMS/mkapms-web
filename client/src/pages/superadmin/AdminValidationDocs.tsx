// Validation des justificatifs par la direction.
//
// L'écran affichait cinq dossiers écrits en dur et trois boutons (« Voir »,
// « Valider », « Refuser ») qui ne faisaient rien : aucun dossier réel n'était
// jamais traité. Il lit désormais les dossiers réellement soumis et écrit la
// décision côté serveur (`admin.validateKyc`), avec le constat d'authenticité
// déjà enregistré par le moteur au dépôt de la pièce.
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileCheck, ChevronDown, Check, X, Clock, Eye } from "lucide-react";
import { trpc } from "../../lib/trpc";

const LIBELLE_PIECE: Record<string, string> = {
  piece_identite: "Pièce d'identité",
  permis_conduire: "Permis de conduire",
  justificatif_domicile: "Justificatif de domicile",
  kbis: "KBIS / registre du commerce",
  rib: "RIB",
  carte_grise: "Carte grise",
  controle_technique: "Contrôle technique",
  autre: "Autre pièce",
};

function DossierPieces({ profileId }: { profileId: number }) {
  const pieces = trpc.admin.kycDocuments.useQuery({ profileId });

  if (pieces.isLoading)
    return <p className="text-[10px] text-[#6B7280]">Chargement des pièces…</p>;
  if (pieces.error)
    return <p className="text-[10px] text-red-600">Pièces illisibles : {pieces.error.message}</p>;
  if (!pieces.data || pieces.data.length === 0)
    return (
      <p className="text-[10px] font-semibold text-amber-700">
        Aucune pièce enregistrée pour ce dossier : il ne peut pas être validé en l'état.
      </p>
    );

  return (
    <div className="space-y-1.5">
      {pieces.data.map((p) => (
        <div key={p.id} className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-[#111]">
              {LIBELLE_PIECE[p.docType] ?? p.docType}
            </p>
            <p className="truncate text-[9px] text-[#6B7280]">
              {p.fileName ?? p.fileUrl} · {p.sizeBytes ? `${Math.round(p.sizeBytes / 1024)} Ko` : "taille inconnue"}
            </p>
          </div>
          <a
            href={p.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-lg bg-blue-500 px-2 py-1.5 text-[9px] font-bold text-white flex items-center gap-1"
          >
            <Eye size={10} /> Voir
          </a>
        </div>
      ))}
    </div>
  );
}

export default function AdminValidationDocs() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [erreur, setErreur] = useState("");

  const dossiers = trpc.admin.kycPending.useQuery();
  const decider = trpc.admin.validateKyc.useMutation({
    onSuccess: () => {
      setErreur("");
      void dossiers.refetch();
    },
    onError: (e) => setErreur(e.message),
  });

  const decision = (profileId: number, action: "valide" | "refuse") => {
    if (action === "refuse") {
      const reason = window.prompt("Motif du refus (communiqué au professionnel) :");
      if (!reason) return;
      decider.mutate({ profileId, action, reason });
      return;
    }
    if (!window.confirm("Valider ce dossier ? La décision est enregistrée à ton nom."))
      return;
    decider.mutate({ profileId, action });
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileCheck size={20} className="text-[#D4AF37]" /> Validation documents</h1>
      </div>

      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-lg font-black text-amber-500">
            {dossiers.isLoading ? "…" : (dossiers.data?.length ?? 0)}
          </p>
          <p className="text-[9px] text-[#6B7280]">Dossiers en attente de décision</p>
        </div>
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold text-amber-700">
          Le contrôle automatique constate ce qui est constatable (empreinte, métadonnées,
          réutilisation du fichier, provenance). Il n'établit pas qu'un KBIS est authentique :
          la décision reste la tienne.
        </p>
      </div>

      {erreur && (
        <p className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
          {erreur}
        </p>
      )}

      <div className="px-4 mt-4 space-y-2">
        {dossiers.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
            Dossiers non chargés : {dossiers.error.message}
          </p>
        )}
        {dossiers.data?.length === 0 && (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center text-[11px] text-[#6B7280]">
            Aucun dossier en attente.
          </p>
        )}
        {dossiers.data?.map((d) => {
          const isExp = expanded === d.id;
          return (
            <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : d.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full grid place-items-center bg-amber-50">
                  <Clock size={14} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{d.userName ?? d.userEmail ?? `Compte #${d.userId}`}</p>
                  <p className="text-[10px] text-[#6B7280]">
                    {d.accountType ?? "compte"} · {d.status}
                    {d.submittedAt ? ` · déposé le ${new Date(d.submittedAt).toLocaleDateString("fr-FR")}` : ""}
                  </p>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <DossierPieces profileId={d.id} />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => decision(d.id, "valide")}
                      disabled={decider.isPending}
                      className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Check size={10} /> Valider
                    </button>
                    <button
                      onClick={() => decision(d.id, "refuse")}
                      disabled={decider.isPending}
                      className="flex-1 rounded-lg bg-red-50 py-1.5 text-[9px] font-bold text-red-600 flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <X size={10} /> Refuser
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
