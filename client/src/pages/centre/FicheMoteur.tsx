/** Fiche d'un moteur : inventaire (état prouvé, définition, fonction, références, tests, manques, doublons, à vérifier), versions, capacités annoncées / mesurées, liaisons, accusés. */
import { trpc } from "../../lib/trpc";
import { Carte, Pastille, date, heure } from "./commun";

const UNITES: Record<string, string> = { throughput_per_min: "par minute", latency_ms: "ms", memory_mb: "Mo", recovery_ms: "ms", error_rate: "%", capacity_factor: "×" };
const LIBELLE_METRIQUE: Record<string, string> = { throughput_per_min: "Débit", latency_ms: "Latence", memory_mb: "Mémoire", recovery_ms: "Reprise après panne", error_rate: "Taux d'erreur", capacity_factor: "Facteur de capacité (2 sondes en parallèle)" };

const Liste = ({ titre, items }: { titre: string; items: readonly string[] | undefined }) =>
  items && items.length > 0 ? (
    <div>
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{titre}</p>
      <ul className="ml-4 list-disc text-xs text-slate-200">{items.map((x, i) => <li key={i} className="break-words">{x}</li>)}</ul>
    </div>
  ) : null;

export default function FicheMoteur({ code, onFermer }: { code: string; onFermer: () => void }) {
  const q = trpc.frontierOs.moteur.useQuery({ code });
  const d = q.data;
  const m = d?.moteur;
  const det = (m?.details ?? {}) as { manques?: string[]; doublons?: string[]; aVerifier?: string[]; connexionsExistantes?: string[]; connexionsAConstruire?: string[]; tests?: string[]; entrees?: string[]; entreesTrouvees?: number; tables?: string[]; dependances?: string[]; domaine?: string; niveauDeclare?: string };
  return (
    <aside role="dialog" aria-label={`Fiche du moteur ${code}`} className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-cyan-500/40 bg-[#070b12] p-4 shadow-2xl" data-testid="fiche-moteur">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-all text-[11px] text-slate-400">{code}</p>
          <h2 className="text-lg font-black text-white">{m?.name ?? "Moteur"}</h2>
        </div>
        <button type="button" onClick={onFermer} className="rounded-lg border border-slate-500 px-3 py-1 text-xs font-bold text-slate-200" aria-label="Fermer la fiche">Fermer</button>
      </div>
      {q.isLoading && <p className="mt-3 text-sm">Lecture du moteur…</p>}
      {q.error && <p className="mt-3 text-sm text-red-300">{q.error.message}</p>}
      {d === null && <p className="mt-3 text-sm text-amber-200">Moteur inconnu du registre du centre.</p>}
      {d && m && (
        <div className="mt-3 space-y-3">
          <Carte>
            <div className="flex flex-wrap items-center gap-2">
              <Pastille etat={m.inventoryState} declareSeulement={m.declaredOnly && m.origin === "inventory"} />
              <span className="rounded border border-slate-600 px-1.5 text-[10px] text-slate-300">{m.kind}</span>
              <span className="rounded border border-slate-600 px-1.5 text-[10px] text-slate-300">plateforme : {m.platformCode}</span>
              <span className="rounded border border-slate-600 px-1.5 text-[10px] text-slate-300">propriétaire : {m.ownerKind}:{m.ownerCode}</span>
              {m.origin === "center" && <span className={`rounded border px-1.5 text-[10px] ${m.running ? "border-emerald-500/60 text-emerald-300" : "border-red-500/60 text-red-300"}`}>{m.running ? "en marche" : "ARRÊTÉ"} · santé {m.health}{m.healthCheckedAt ? ` (${heure(m.healthCheckedAt)})` : ""}</span>}
            </div>
            <p className="mt-2 text-sm text-slate-100">{m.function}</p>
            {d.definitionEtat && <p className="mt-1 text-[11px] text-slate-400">« {d.libelleEtat} » : {d.definitionEtat}</p>}
            {m.origin === "inventory" && <p className="mt-1 text-[11px] text-slate-400">Niveau de preuve : <b>{m.evidenceLevel}</b> · version relevée : {m.version} · service d'exécution : {m.executionService || "aucun relevé"}</p>}
            {m.plannedIntermediary && <p className="mt-1 text-[11px] text-cyan-200">Intermédiaire prévu : {m.plannedIntermediary}</p>}
          </Carte>

          {d.specInterne && (
            <Carte titre="Moteur interne : fonctionnement">
              <p className="text-xs text-slate-200"><b>Entrées</b> : {d.specInterne.entrees}</p>
              <p className="text-xs text-slate-200"><b>Sorties</b> : {d.specInterne.sorties}</p>
              <p className="text-xs text-slate-200"><b>Mécanisme d'arrêt</b> : {d.specInterne.arret}</p>
              {d.latence ? <p className="mt-1 text-xs text-emerald-200">Latence mesurée : médiane {d.latence.p50} ms · p95 {d.latence.p95} ms · max {d.latence.max} ms ({d.latence.n} messages, dernier {heure(d.latence.dernierLe)})</p> : <p className="mt-1 text-xs text-slate-400">Latence : non mesurée (aucun message encore).</p>}
            </Carte>
          )}

          {m.origin === "inventory" && (
            <Carte titre="Inventaire (relevé en lecture seule)">
              <div className="space-y-2">
                <Liste titre="Où est le code" items={m.codeLocation} />
                {det.entrees && det.entrees.length > 0 && <Liste titre={`Points d'entrée (${det.entreesTrouvees ?? 0} trouvé(s) dans le code)`} items={det.entrees} />}
                <Liste titre="Tests existants relevés" items={det.tests} />
                {(det.tests ?? []).length === 0 && <p className="text-xs text-amber-200">Aucun fichier de test relevé pour ce moteur.</p>}
                <Liste titre="Connexions existantes" items={det.connexionsExistantes} />
                <Liste titre="Connexions à construire" items={det.connexionsAConstruire} />
                <Liste titre="Ce qui manque" items={det.manques} />
                <Liste titre="Doublons et recouvrements relevés" items={det.doublons} />
                <Liste titre="À vérifier" items={det.aVerifier} />
                <Liste titre="Tables" items={det.tables} />
                <Liste titre="Dépendances déclarées" items={det.dependances} />
              </div>
            </Carte>
          )}

          <Carte titre="Versions relevées">
            {d.versions.length === 0 ? <p className="text-xs text-slate-400">Aucune version enregistrée.</p> : (
              <ul className="text-xs text-slate-200">{d.versions.map((v) => <li key={v.id}><code>{v.version}</code> · {v.inventoryState} / {v.evidenceLevel} · {v.sourceRepo.split("/").pop()}@{v.sourceCommit.slice(0, 7)} · {date(v.recordedAt)}</li>)}</ul>
            )}
          </Carte>

          <Carte titre="Capacités : annoncées et mesurées">
            {d.capacites.length === 0 ? <p className="text-xs text-slate-400">Aucune capacité annoncée ni mesurée. Une capacité qui n'est pas mesurée n'est pas affirmée.</p> : (
              <table className="w-full text-left text-xs"><thead className="text-slate-400"><tr><th>Mesure</th><th>Annoncée</th><th>Mesurée</th></tr></thead><tbody>
                {d.capacites.map((c) => <tr key={c.metric}><td>{LIBELLE_METRIQUE[c.metric] ?? c.metric}</td><td>{c.declaredValue ?? "aucune annonce"}</td><td>{c.measuredValue === null ? "non mesurée" : `${Number(c.measuredValue.toFixed(2))} ${UNITES[c.metric] ?? ""}`}</td></tr>)}
              </tbody></table>
            )}
            {d.capacites.some((c) => c.metric === "capacity_factor") && <p className="mt-1 text-[11px] text-slate-400">{d.capacites.find((c) => c.metric === "capacity_factor")!.method}. Ce facteur ne prouve pas une redondance.</p>}
          </Carte>

          <Carte titre="Liaisons commande / vérification">
            {d.liaisonsCommeCible.length > 0 && <ul className="text-xs text-slate-200">{d.liaisonsCommeCible.map((l, i) => <li key={i}>{l.cible} ← commande <code>{l.commande}</code> + vérification <code>{l.verification}</code></li>)}</ul>}
            {d.liaisonsCommeMoteur.total > 0 && <p className="text-xs text-slate-200">Ce moteur sert {d.liaisonsCommeMoteur.total} cible(s) : {d.liaisonsCommeMoteur.exemples.slice(0, 6).map((e) => `${e.targetKind} ${e.targetCode} (${e.role})`).join(", ")}…</p>}
            {d.liaisonsCommeCible.length === 0 && d.liaisonsCommeMoteur.total === 0 && <p className="text-xs text-slate-400">Aucune liaison.</p>}
          </Carte>

          {d.lignes.length > 0 && <Carte titre="Lignes qui l'utilisent"><ul className="text-xs text-slate-200">{d.lignes.map((l) => <li key={l.id}>{l.label} <span className="text-slate-500">({l.groupe})</span></li>)}</ul></Carte>}

          <Carte titre="Derniers accusés de ce moteur">
            {d.recus.length === 0 ? <p className="text-xs text-slate-400">Aucun accusé encore.</p> : (
              <ul className="text-xs text-slate-200">{d.recus.map((r) => <li key={r.id}>{heure(r.at)} · commande {r.commandId} · {r.phase}/{r.role} → <b className={r.outcome === "ok" ? "text-emerald-300" : "text-red-300"}>{r.outcome}</b> · {r.detail}</li>)}</ul>
            )}
          </Carte>
        </div>
      )}
    </aside>
  );
}
