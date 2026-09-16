import { Link } from "react-router-dom";
import { ChevronLeft, MousePointerClick, AlertTriangle, RefreshCcw, Link2Off } from "lucide-react";
import { trpc } from "../../lib/trpc";

/**
 * Direction — Moteur de boutons (Architecture 3, ghost_buttons=0).
 *
 * Consomme `buttonEngine.inventaire()` (server/button-engine/router.ts),
 * réel et opérationnel depuis longtemps mais sans aucun consommateur avant
 * cet écran — même défaut « backend orphelin » déjà rencontré et corrigé
 * plusieurs fois dans ce chantier (encheres, Plan Maître Fournisseurs,
 * Google Business).
 */

const GENRE_LABEL: Record<string, string> = {
  navigation: "Navigation",
  appel: "Appel",
  email: "E-mail",
  document: "Document",
  formulaire: "Formulaire",
  non_branchee: "Non branchée",
};

export default function MoteurBoutons() {
  const query = trpc.buttonEngine.inventaire.useQuery();
  const a = query.data;
  const ghostButtons = (a?.boutonsMuets ?? 0) + (a?.nonBranchees.length ?? 0) + (a?.ciblesCassees.length ?? 0);

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-24">
      <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white flex items-center gap-2"><MousePointerClick size={20} className="text-purple-400" /> Moteur de boutons</h1>
          <button onClick={() => query.refetch()} className="rounded-lg bg-white/10 p-2 hover:bg-white/20 transition" title="Actualiser">
            <RefreshCcw size={14} className={`text-white/70 ${query.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="mt-1 text-xs text-white/40">Chaque bouton important déclare son action ; le moteur signale « bouton.sans_action » au lieu de laisser un bouton muet ou un faux succès.</p>
      </div>

      {query.isLoading && <p className="px-4 mt-6 text-sm text-white/40">Chargement…</p>}
      {query.isError && <p className="px-4 mt-6 text-sm text-red-400">Données indisponibles : {query.error.message}</p>}

      {a && (
        <div className="px-4 mt-6 space-y-4">
          <div className={`rounded-2xl border p-5 ${ghostButtons === 0 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
            <p className="text-[10px] uppercase tracking-wider text-white/40">Objectif ghost_buttons = 0</p>
            <p className={`mt-1 text-3xl font-black ${ghostButtons === 0 ? "text-green-400" : "text-red-400"}`}>{ghostButtons}</p>
            <p className="mt-1 text-xs text-white/40">
              {a.boutonsMuets} bouton(s) sans déclaration sur {a.ecransMuets} écran(s) · {a.nonBranchees.length} action(s) déclarée(s) sans exécution serveur · {a.ciblesCassees.length} destination(s) cassée(s).
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3">Actions déclarées, par genre</h2>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(a.parGenre).map(([genre, n]) => (
                <div key={genre} className="rounded-lg bg-white/5 p-2.5">
                  <p className="text-[9px] text-white/40">{GENRE_LABEL[genre] ?? genre}</p>
                  <p className="text-lg font-bold text-white">{n}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" /> Actions déclarées sans exécution serveur
            </h2>
            {a.nonBranchees.length === 0 ? (
              <p className="text-xs text-green-400">Aucune — toute action déclarée est réellement exécutée.</p>
            ) : (
              <div className="space-y-1.5">
                {a.nonBranchees.map((b) => (
                  <div key={b.code} className="rounded-lg bg-white/5 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{b.libelle}</span>
                      <code className="text-[10px] text-white/40">{b.code}</code>
                    </div>
                    <p className="text-[10px] text-white/40">{b.ecran}</p>
                    {b.manque && <p className="text-[10px] text-amber-300 mt-0.5">{b.manque}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Link2Off size={16} className="text-red-400" /> Destinations catalogées cassées
            </h2>
            {a.ciblesCassees.length === 0 ? (
              <p className="text-xs text-green-400">Aucune — toute destination catalogée mène à une page réelle.</p>
            ) : (
              <div className="space-y-1.5">
                {a.ciblesCassees.map((b) => (
                  <div key={b.code} className="rounded-lg bg-white/5 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{b.libelle}</span>
                      <code className="text-[10px] text-white/40">{b.code}</code>
                    </div>
                    <p className="text-[10px] text-white/40">{b.ecran}</p>
                    <p className="text-[10px] text-red-300 mt-0.5">Cible : {b.cible ?? "?"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
