import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, Check, Clock, FileText, ChevronRight } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { BoutonMoteur } from "../../lib/boutonMoteur";

function fmt(d: string | Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Suivi d'un dossier réel (`?id=`) ; sans identifiant, liste des dossiers de l'utilisateur. */
export default function SuiviDossier() {
  const [params] = useSearchParams();
  const id = Number(params.get("id"));
  const { user } = useAuth();
  const detail = trpc.carteGrise.detail.useQuery({ id }, { enabled: !!user && Number.isInteger(id) && id > 0, retry: false });
  const liste = trpc.carteGrise.mesDossiers.useQuery(undefined, { enabled: !!user && !(id > 0) });
  const catalogue = trpc.carteGrise.catalogue.useQuery(undefined, { staleTime: 300_000 });
  const statuts = catalogue.data?.statuts ?? {};

  const dossier = detail.data?.dossier;
  const etapes = detail.data?.etapes ?? [];
  const documents = detail.data?.documents ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Suivi dossier</h1>
        {dossier && <p className="mt-1 text-sm text-white/60">{dossier.reference}</p>}
      </div>

      {!user && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <p className="text-sm text-[#6B7280]">Connectez-vous pour consulter vos dossiers.</p>
          <BoutonMoteur code="demarches_connexion" className="block w-full rounded-xl bg-[#111] py-3 text-center text-sm font-bold text-white">Se connecter</BoutonMoteur>
        </div>
      )}

      {user && id > 0 && (
        <>
          {detail.isLoading && <p className="mx-4 mt-4 text-sm text-[#6B7280]">Chargement du dossier…</p>}
          {detail.error && <p className="mx-4 mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{detail.error.message}</p>}
          {dossier && (
            <>
              <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
                <p className="text-sm font-bold text-[#111]">{[dossier.marque, dossier.modele].filter(Boolean).join(" ") || dossier.type}</p>
                <p className="text-xs text-[#6B7280]">{dossier.immatriculation ?? dossier.vin ?? ""}</p>
                <span className="mt-2 inline-block rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-bold text-[#111]">{statuts[dossier.status] ?? dossier.status}</span>
              </div>
              <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4">
                {etapes.map((e, i) => {
                  const fait = i < etapes.length - 1 || dossier.status === "termine";
                  return (
                    <div key={e.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${fait ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`}>{fait ? <Check size={12} className="text-white" /> : <Clock size={12} className="text-[#9CA3AF]" />}</div>
                        {i < etapes.length - 1 && <div className="w-0.5 h-6 bg-[#D4AF37]" />}
                      </div>
                      <div className="pb-3"><p className="text-sm font-bold text-[#111]">{e.statusLabel}</p><p className="text-[9px] text-[#9CA3AF]">{fmt(e.createdAt)}</p>{e.commentaire && <p className="text-[10px] text-[#6B7280]">{e.commentaire}</p>}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
                <p className="text-xs font-bold text-[#111]">Pièces reçues ({documents.length})</p>
                {documents.map((d) => (
                  <a key={d.id} href={d.url} target="_blank" rel="noreferrer" className="flex items-center justify-between text-xs text-[#111]">
                    <span className="truncate">{d.nom}</span>
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${d.status === "valide" ? "bg-green-50 text-green-600" : d.status === "refuse" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{d.status}</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {user && !(id > 0) && (
        <div className="px-4 mt-4 space-y-2">
          {liste.isLoading && <p className="text-sm text-[#6B7280]">Chargement…</p>}
          {liste.data?.length === 0 && <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">Aucun dossier déposé pour le moment.</p>}
          {liste.data?.map((d) => (
            <BoutonMoteur key={d.id} code="demarches_suivre_dossier" query={{ id: String(d.id) }} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 text-left">
              <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{[d.marque, d.modele].filter(Boolean).join(" ") || d.type}</h3><p className="text-[9px] text-[#6B7280]">{d.reference}</p></div>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600">{statuts[d.status] ?? d.status}</span>
              <ChevronRight size={14} className="text-[#9CA3AF]" />
            </BoutonMoteur>
          ))}
        </div>
      )}
    </div>
  );
}
