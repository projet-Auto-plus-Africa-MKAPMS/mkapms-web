/**
 * Centre Cyber-Électrique — le MODE RÉEL, dit sans détour : deux clés (variable d'environnement + armement du PDG), ligne par ligne, rien ne se rebranche tout seul.
 * Chaque coupure est étiquetée RÉELLE (elle commande une liaison réelle et son état est relu) ou SIMULÉE (le centre joue la liaison). Une personne qui lit cet écran
 * doit toujours pouvoir dire ce qui est vrai et ce qui est joué.
 */
import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { Carte, LIBELLE_ETAT_LIGNE, bouton, boutonDanger, useConfirmation } from "./commun";

const LIBELLE_COTE: Record<string, string> = { remote: "distant (Boutique)", center: "centre", main: "principal" };

export function CarteModeReel({ onMessage }: { onMessage: (m: string) => void }) {
  const utils = trpc.useUtils();
  const r = trpc.frontierOs.reel.useQuery(undefined, { refetchInterval: 15000 });
  const { demander, dialogue } = useConfirmation();
  const [phrase, setPhrase] = useState("");
  const rafraichir = () => Promise.all([utils.frontierOs.reel.invalidate(), utils.frontierOs.lignes.invalidate(), utils.frontierOs.accueil.invalidate(), utils.frontierOs.securite.invalidate(), utils.frontierOs.incidents.invalidate()]);
  const suite = async (m: string) => {
    onMessage(m);
    await rafraichir();
  };
  const armer = trpc.frontierOs.armerReel.useMutation({ onSuccess: (x) => suite(x.detail), onError: (e) => onMessage(e.message) });
  const desarmer = trpc.frontierOs.desarmerReel.useMutation({ onSuccess: (x) => suite(x.detail), onError: (e) => onMessage(e.message) });
  const modeLigne = trpc.frontierOs.modeLigne.useMutation({ onSuccess: (x) => suite(x.detail), onError: (e) => onMessage(e.message) });
  const reconcilier = trpc.frontierOs.reconcilier.useMutation({ onSuccess: (x) => suite(`Réconciliation : ${x.lignes} ligne(s) réelle(s) contrôlée(s), ${x.coupuresCoupees} liaison(s) coupée(s), ${x.incidents} incident(s).`), onError: (e) => onMessage(e.message) });
  const d = r.data;
  if (r.isLoading) return <Carte titre="Mode réel"><p className="text-sm">Lecture…</p></Carte>;
  if (r.error) return <Carte titre="Mode réel"><p role="alert" className="text-sm text-red-300">{r.error.message}</p></Carte>;
  if (!d) return null;
  return (
    <Carte titre="Mode réel : deux clés, ligne par ligne">
      {dialogue}
      <div className="grid gap-2 md:grid-cols-3" data-testid="mode-reel">
        <p className={`rounded border px-2 py-1 text-xs ${d.environnement.posee ? "border-emerald-500/60 text-emerald-200" : "border-slate-600 text-slate-300"}`} data-cle="environnement">
          Clé 1 — variable <b>{d.environnement.variable}=oui</b> : {d.environnement.posee ? "posée sur le service" : "absente (se pose dans les variables du service, jamais ici)"}
        </p>
        <p className={`rounded border px-2 py-1 text-xs ${d.arme ? "border-red-500/60 text-red-200" : "border-slate-600 text-slate-300"}`} data-cle="armement">
          Clé 2 — armement du PDG : <b>{d.arme ? "ARMÉ" : "non armé"}</b>
        </p>
        <p className={`rounded border px-2 py-1 text-xs font-bold ${d.autorise ? "border-red-500/60 text-red-200" : "border-emerald-500/60 text-emerald-200"}`} data-testid="reel-autorise" data-autorise={d.autorise}>
          {d.autorise ? "MODE RÉEL PERMIS : une ligne passée en réel commande de vrais câbles" : "Mode réel NON permis : tout reste simulé, une ligne « réelle » ne laisse rien passer"}
        </p>
      </div>

      {!d.arme ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input aria-label="Phrase de confirmation" value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder={d.phrase} className="w-64 rounded border border-slate-600 bg-[#0b1220] px-2 py-1 text-xs text-white" />
          <button type="button" className={boutonDanger} disabled={armer.isPending || phrase.trim() !== d.phrase} onClick={() => armer.mutate({ phrase })}>Armer le mode réel</button>
          <span className="text-[11px] text-slate-400">Recopiez exactement « {d.phrase} ». Armer ne branche rien : chaque ligne se passe en réel ensuite, par un acte explicite.</span>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" className={boutonDanger} disabled={desarmer.isPending} onClick={() => demander({ titre: "Désarmer le mode réel", detail: "La clé est retirée D'ABORD (tout passage réel est refusé à l'instant), puis chaque ligne réelle est coupée et revient en simulation une fois la coupure confirmée.", executer: () => desarmer.mutate({ confirme: true }) })}>Désarmer (coupe d'abord)</button>
          <button type="button" className={bouton} disabled={reconcilier.isPending} onClick={() => reconcilier.mutate()}>Contrôler les liaisons réelles maintenant</button>
        </div>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-slate-400"><tr><th>Ligne</th><th>Régime</th><th>État</th><th>Coupures : ce que chacune commande</th><th></th></tr></thead>
          <tbody>
            {d.lignes.map((l) => (
              <tr key={l.id} className="align-top border-t border-slate-800" data-reel-ligne={l.intermediaire ?? l.id} data-regime={l.regime}>
                <td className="py-1 text-slate-100">{l.label}</td>
                <td className={l.regime === "simulation" ? "text-slate-300" : "font-bold text-red-300"}>{l.regime === "simulation" ? "simulation" : l.regime === "reel" ? "RÉEL" : "MIXTE"}</td>
                <td className="text-slate-300">{LIBELLE_ETAT_LIGNE[l.etat]}</td>
                <td>
                  <ul className="space-y-0.5">
                    {l.natures.map((n) => (
                      <li key={n.side} data-nature={`${n.side}:${n.mode}`}>
                        <b className={n.mode === "real" ? "text-red-300" : "text-slate-400"}>{n.mode === "real" ? "RÉEL" : "simulé"}</b> · {LIBELLE_COTE[n.side]} — <span className="text-slate-300">{n.libelle}</span>
                        {!n.disponible && <span className="text-amber-300"> · liaison indisponible : {n.raison}</span>}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  {l.regime === "simulation" ? (
                    <button type="button" className={bouton} disabled={!d.autorise || !l.peutPasserEnReel || modeLigne.isPending} title={!d.autorise ? "Le mode réel n'est pas permis." : !l.peutPasserEnReel ? "Au moins une coupure n'a pas de liaison réelle, ou la ligne n'est pas validée." : ""} onClick={() => demander({ titre: `Passer « ${l.label} » en RÉEL`, detail: "Ses trois coupures sont remises à zéro (coupées, jamais commandées). Rien n'est branché : il faudra ensuite l'activer, avec confirmation.", executer: () => modeLigne.mutate({ ligneId: l.id, mode: "real", confirme: true }) })}>Passer en réel</button>
                  ) : (
                    <button type="button" className={bouton} disabled={modeLigne.isPending} onClick={() => demander({ titre: `Remettre « ${l.label} » en simulation`, detail: "La ligne doit être coupée et confirmée. Ses coupures sont remises à zéro.", executer: () => modeLigne.mutate({ ligneId: l.id, mode: "simulation", confirme: true }) })}>Revenir en simulation</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold text-white">Accès sécurisés (mesurés, jamais une valeur)</p>
          {d.acces === null ? (
            <p className="text-[11px] text-amber-300">Non mesurés : le moteur intermédiaire n'a pas répondu.</p>
          ) : (
            <ul className="text-[11px] text-slate-200" data-testid="acces-reel">
              <li>Clés publiques de la Boutique actives : <b>{d.clesBoutique}</b>{d.clesBoutique === 0 ? " — aucune : la Boutique ne peut signer ni ordre accusé ni message" : ""}</li>
              {d.acces.map((a) => <li key={a.canal}>Canal « {a.canal} » : {a.manques.length === 0 ? <span className="text-emerald-300">prérequis réunis</span> : <span className="text-amber-300">manque — {a.manques.join(" ")}</span>}</li>)}
            </ul>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-white">Ce qui reste simulé ou indisponible</p>
          <ul className="list-disc pl-4 text-[11px] text-slate-300">{d.resteSimule.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      </div>
    </Carte>
  );
}
