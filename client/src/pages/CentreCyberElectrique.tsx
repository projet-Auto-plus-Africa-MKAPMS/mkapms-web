/**
 * Centre Cyber-Électrique MKA.P-MS · Frontier OS — la vitrine (PDG). Dix salles : accueil et tableau de bord général, plateforme principale,
 * boutiques, connexions et activation, cybersécurité, atelier de réparation, mémoire, incidents et audit, employés et permissions, futures plateformes.
 * L'entrée ouvre l'accueil. SIMULATION : aucun bouton ne branche ni ne débranche une connexion réelle ; la vitrine reflète les états CONFIRMÉS.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import FicheMoteur from "./centre/FicheMoteur";
import SalleConnexions from "./centre/SalleConnexions";
import { SalleAccueil, SalleAtelier, SalleBoutiques, SalleEmployes, SalleFutures, SalleIncidentsAudit, SalleMemoire, SallePlateforme, SalleSecurite } from "./centre/Salles";

const SALLES_PAR_DEFAUT: readonly [string, string][] = [
  ["accueil", "Accueil et tableau de bord"],
  ["plateforme-principale", "Plateforme principale"],
  ["boutiques", "Boutiques"],
  ["connexions", "Connexions et activation"],
  ["cyber-securite", "Cybersécurité"],
  ["atelier", "Atelier de réparation"],
  ["memoire", "Mémoire"],
  ["incidents-audit", "Incidents et audit"],
  ["employes-permissions", "Employés et permissions"],
  ["plateformes-futures", "Futures plateformes"],
];
const COURT: Record<string, string> = { accueil: "Accueil", "plateforme-principale": "Plateforme principale", boutiques: "Boutiques", connexions: "Connexions", "cyber-securite": "Cybersécurité", atelier: "Atelier", memoire: "Mémoire", "incidents-audit": "Incidents & audit", "employes-permissions": "Employés", "plateformes-futures": "Futures" };

export default function CentreCyberElectrique() {
  const salles = trpc.frontierOs.salles.useQuery(undefined, { retry: false });
  const base = trpc.frontierOs.base.useQuery(undefined, { refetchInterval: 15000 });
  const [salle, setSalle] = useState("accueil");
  const [message, setMessage] = useState("");
  const [moteurOuvert, setMoteurOuvert] = useState<string | null>(null);
  const liste: readonly [string, string][] = salles.data ? salles.data.map((s) => [s.code, s.name] as [string, string]) : SALLES_PAR_DEFAUT;
  const ouvrir = (code: string) => setMoteurOuvert(code);

  return (
    <div className="min-h-screen bg-[#070b12] pb-24 text-slate-200">
      <div className="mx-auto max-w-[1500px] px-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link to="/admin" className="text-xs text-cyan-300 hover:underline">← Retour au back-office</Link>
          <Link to="/admin/boutique-cable" className="text-xs text-cyan-300 hover:underline">Câble réel de la Boutique (moteur intermédiaire) →</Link>
        </div>
        <header className="mt-2 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-[#0b1220] to-[#10192b] p-4">
          <h1 className="text-xl font-black text-white">Centre Cyber-Électrique MKA.P-MS · Frontier OS</h1>
          <p className="text-xs text-slate-400">Contrôle, sécurité, réparation et pilotage entre plateformes — tout est moteur, tout est interne. Accès PDG seulement.</p>
          <p role="note" className="mt-2 inline-block rounded border border-amber-400/60 bg-amber-950/40 px-2 py-1 text-xs font-bold text-amber-200">
            MODE SIMULATION — aucune connexion réelle n'est modifiée depuis ce centre. La vitrine n'affiche que des états confirmés par la vérification.
          </p>
        </header>

        {base.data && !base.data.prete && (
          <p role="alert" className="mt-2 rounded-lg border border-red-500/60 bg-red-950/40 p-2 text-sm text-red-100">
            La base propre du centre n'est pas prête : {base.data.erreur ?? "raison inconnue"}. La plateforme continue de fonctionner normalement ; le centre réessaie automatiquement.
          </p>
        )}

        <nav aria-label="Salles du centre" className="mt-3 flex gap-1 overflow-x-auto pb-1">
          {liste.map(([code, nom]) => (
            <button key={code} type="button" onClick={() => setSalle(code)} aria-current={salle === code ? "page" : undefined} title={nom} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-bold ${salle === code ? "border-cyan-400 bg-[#0e2a3a] text-white" : "border-slate-700 bg-[#0b1220] text-slate-300 hover:bg-[#13203a]"}`}>
              {COURT[code] ?? nom}
            </button>
          ))}
        </nav>
        <p role="status" className="mt-2 min-h-5 whitespace-pre-wrap text-sm text-cyan-200" data-testid="message">{message}</p>

        <main className="mt-2">
          {salle === "accueil" && <SalleAccueil onMessage={setMessage} />}
          {salle === "plateforme-principale" && <SallePlateforme code="main" titre="Salle de contrôle de la plateforme principale" onOuvrirMoteur={ouvrir} />}
          {salle === "boutiques" && <SalleBoutiques onOuvrirMoteur={ouvrir} />}
          {salle === "connexions" && <SalleConnexions onOuvrirMoteur={ouvrir} onMessage={setMessage} />}
          {salle === "cyber-securite" && <SalleSecurite onMessage={setMessage} onOuvrirMoteur={ouvrir} />}
          {salle === "atelier" && <SalleAtelier onMessage={setMessage} />}
          {salle === "memoire" && <SalleMemoire />}
          {salle === "incidents-audit" && <SalleIncidentsAudit />}
          {salle === "employes-permissions" && <SalleEmployes />}
          {salle === "plateformes-futures" && <SalleFutures onMessage={setMessage} />}
        </main>
      </div>
      {moteurOuvert && <FicheMoteur code={moteurOuvert} onFermer={() => setMoteurOuvert(null)} />}
    </div>
  );
}
