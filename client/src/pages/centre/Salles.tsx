/**
 * Centre Cyber-Électrique — les salles (hors plan de connexions) : accueil, plateforme principale, boutiques, cybersécurité, atelier de réparation,
 * mémoire, incidents et audit, employés et permissions, futures plateformes. Chaque chiffre vient de la base propre du centre ; ce qui n'est pas
 * mesuré est « non mesuré », ce qui n'est pas établi est « à vérifier ».
 */
import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { CarteModeReel } from "./ModeReel";
import { Aiguille, Carte, ETAT_INVENTAIRE, Pastille, Vide, bouton, boutonDanger, date, heure, useConfirmation } from "./commun";

type Props = { onMessage: (m: string) => void; onOuvrirMoteur: (code: string) => void };

// ───────────────────────── Accueil ─────────────────────────
export function SalleAccueil({ onMessage }: Pick<Props, "onMessage">) {
  const utils = trpc.useUtils();
  const a = trpc.frontierOs.accueil.useQuery(undefined, { refetchInterval: 20000 });
  const sante = trpc.frontierOs.sante.useMutation({ onSuccess: async (r) => { onMessage(`Santé des moteurs internes : ${r.filter((x) => x.sante === "ok").length}/${r.length} répondent.`); await utils.frontierOs.accueil.invalidate(); }, onError: (e) => onMessage(e.message) });
  const mesurer = trpc.frontierOs.mesurer.useMutation({ onSuccess: async (r) => { onMessage(`Banc d'essai : ${r.seul} sondes/min seule, ${r.parallele} à deux en parallèle (facteur ${r.facteur}). ${r.note}`); await Promise.all([utils.frontierOs.accueil.invalidate(), utils.frontierOs.mesures.invalidate()]); }, onError: (e) => onMessage(e.message) });
  const d = a.data;
  if (a.isLoading) return <p className="text-sm">Préparation de la base du centre…</p>;
  if (a.error) return <p role="alert" className="text-sm text-red-300">{a.error.message}</p>;
  if (!d) return null;
  const c = d.commandes24h as Record<string, number>;
  return (
    <section aria-label="Accueil" className="space-y-3">
      <Carte titre="Aiguilles : uniquement des mesures">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{d.jauges.map((j) => <Aiguille key={j.cle} j={j} />)}</div>
        <p className="mt-2 text-[11px] text-slate-400">Une aiguille n'est verte que si une vérification a réussi. Une valeur absente est « non mesurée », jamais un zéro. Il n'existe aucune source de température : elle reste « non mesurée ».</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={bouton} disabled={sante.isPending} onClick={() => sante.mutate()}>Vérifier la santé des moteurs</button>
          <button type="button" className={bouton} disabled={mesurer.isPending} onClick={() => mesurer.mutate()}>Banc d'essai des capacités</button>
        </div>
      </Carte>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Carte titre="Base indépendante du centre">
          <p className="text-xs text-slate-200">Schéma <b>{d.base.schema}</b> · migrateur et journal propres · {d.base.migrationsConnues} migration(s) appliquée(s).</p>
          <p className={`mt-1 text-xs font-bold ${d.base.separee ? "text-emerald-300" : "text-amber-200"}`} data-testid="separation-resume" data-niveau={d.base.separation.niveau}>{d.base.separation.libelle}. <span className="font-normal">{d.base.separation.detail}</span></p>
        </Carte>
        <Carte titre="Lignes">
          <p className="text-xs text-slate-200"><b>{d.lignes.reelles}</b> réelles ({d.lignes.valides} validées) · <b>{d.lignes.reserves}</b> réserves « À venir ».</p>
          <p className="text-xs text-slate-200">Connectées (3 coupures confirmées) : <b>{d.lignes.connectees}</b> · partielles : {d.lignes.partielles} · en erreur : {d.lignes.enErreur}</p>
        </Carte>
        <Carte titre="Moteurs">
          <p className="text-xs text-slate-200">Internes : <b>{d.moteursInternes.enMarche}/{d.moteursInternes.total}</b> en marche{d.moteursInternes.enPanne ? ` · ${d.moteursInternes.enPanne} en panne` : ""}{d.moteursInternes.arretes ? ` · ${d.moteursInternes.arretes} arrêté(s)` : ""}.</p>
          {Object.entries(d.moteursInventories).map(([p, m]) => <p key={p} className="text-[11px] text-slate-300">{p === "shop" ? "Boutique" : p === "main" ? "Plateforme principale" : p} : {Object.entries(m).map(([e, n]) => `${ETAT_INVENTAIRE[e]?.libelle ?? e} ${n}`).join(" · ")}</p>)}
        </Carte>
        <Carte titre="Activité et incidents">
          <p className="text-xs text-slate-200">Incidents ouverts : <b className={d.incidentsOuverts ? "text-amber-300" : ""}>{d.incidentsOuverts}</b> (critiques : {d.incidentsCritiques}).</p>
          <p className="text-xs text-slate-200">Commandes 24 h : {Object.keys(c).length === 0 ? "aucune" : Object.entries(c).map(([k, v]) => `${k} ${v}`).join(" · ")}</p>
          <p className="text-xs text-slate-200">Paiements suivis : {d.echangesSuivis} · sessions de test réussies : {d.sessionsReussies}</p>
          <p className="text-xs text-slate-200">Gouvernance du câble réel : <b>{d.gouvernanceArmee ? "ARMÉE" : "non armée"}</b></p>
        </Carte>
      </div>

      <Carte titre="Plateformes et noms exacts">
        <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-400"><tr><th>Plateforme</th><th>Dépôt</th><th>Noms trouvés</th><th>Identité</th></tr></thead><tbody>
          {d.plateformes.map((p) => (
            <tr key={p.code} className="align-top border-t border-slate-800"><td className="py-1 font-bold text-white">{p.name}</td><td className="text-slate-300">{p.repository ? p.repository.split("/").pop() : "—"}</td><td className="text-slate-300">{p.exactNames.length ? p.exactNames.join(" · ") : "aucun"}</td>
              <td className={p.identityStatus === "verified" ? "text-emerald-300" : "text-violet-300"}>{p.identityStatus === "verified" ? "vérifiée" : "À VÉRIFIER"} — <span className="text-slate-400">{p.identityNote}</span></td></tr>
          ))}
        </tbody></table></div>
        <div className="mt-2 rounded-lg border border-violet-500/40 bg-violet-950/20 p-2">
          <p className="text-xs font-black text-violet-200">Noms demandés : aucune fusion tant que l'identité n'est pas vérifiée</p>
          <ul className="text-[11px] text-slate-200">{d.alias.map((x) => <li key={x.name}>« {x.name} » — {x.statut === "found" ? `trouvé (${x.plateforme})` : x.statut === "not_found" ? "NON TROUVÉ dans le code" : "à vérifier"}. {x.note || x.preuve}</li>)}</ul>
        </div>
      </Carte>

      <Carte titre="Dernière activité (journal en ajout seul)">
        {d.derniereActivite.length === 0 ? <Vide>Aucune activité.</Vide> : <ul className="text-xs text-slate-200">{d.derniereActivite.map((x) => <li key={x.id}>{heure(x.at)} · {x.action} · {x.cible} → <b className={x.resultat === "ok" ? "text-emerald-300" : "text-amber-300"}>{x.resultat}</b>{x.erreur ? ` (${x.erreur})` : ""}</li>)}</ul>}
      </Carte>
    </section>
  );
}

// ───────────────────────── Salle d'une plateforme (principale ou boutique) ─────────────────────────
const ETATS = ["", "incomplet", "prepare", "installe", "teste", "connecte", "a_verifier"] as const;
export function SallePlateforme({ code, titre, onOuvrirMoteur }: { code: string; titre: string; onOuvrirMoteur: (c: string) => void }) {
  const s = trpc.frontierOs.salleBoutique.useQuery({ plateforme: code });
  const [etat, setEtat] = useState("");
  const [q, setQ] = useState("");
  const [declare, setDeclare] = useState(false);
  const liste = trpc.frontierOs.moteurs.useQuery({ plateforme: code, kind: "real", etat: etat || undefined, q: q || undefined, declareSeulement: declare ? true : undefined, limite: 300 });
  const d = s.data;
  if (s.isLoading) return <p className="text-sm">Lecture de la salle…</p>;
  if (s.error) return <p role="alert" className="text-sm text-red-300">{s.error.message}</p>;
  if (!d) return <Vide>Plateforme inconnue.</Vide>;
  const reels = d.moteursParEtat.filter((x) => x.kind === "real");
  const total = reels.reduce((n, x) => n + x.k, 0);
  return (
    <section aria-label={titre} className="space-y-3" data-salle={code}>
      <Carte>
        <h2 className="text-base font-black text-white">{titre}</h2>
        <p className="text-xs text-slate-300">{d.plateforme.name} · statut {d.plateforme.status}{d.plateforme.identityStatus === "to_verify" ? " · identité À VÉRIFIER" : ""}</p>
        <p className="text-[11px] text-slate-400">{d.plateforme.identityNote}</p>
        {d.inventaire ? <p className="mt-1 text-[11px] text-slate-400">Inventaire relevé en lecture seule dans {d.inventaire.depot.split("/").pop()} au commit <code>{d.inventaire.commit.slice(0, 10)}</code> ({date(d.inventaire.dateCommit)}).</p> : <p className="mt-1 text-[11px] text-violet-300">Aucun inventaire : cette plateforme n'est pas inventoriée dans ce lot (à vérifier).</p>}
        <div className="mt-2 flex flex-wrap gap-2" data-testid="repartition">
          {total === 0 ? <span className="text-xs text-slate-400">Aucun moteur inventorié.</span> : reels.map((x) => <span key={x.etat} className="rounded border px-2 py-0.5 text-xs" style={{ borderColor: `${ETAT_INVENTAIRE[x.etat ?? ""]?.couleur ?? "#64748b"}88`, color: ETAT_INVENTAIRE[x.etat ?? ""]?.couleur ?? "#cbd5e1" }}>{ETAT_INVENTAIRE[x.etat ?? ""]?.libelle ?? x.etat} : <b>{x.k}</b></span>)}
          {total > 0 && <span className="rounded border border-slate-500 px-2 py-0.5 text-xs text-slate-200">déclarés seulement : <b>{d.declaresSeulement}</b> / {total}</span>}
        </div>
        <p className="mt-1 text-[11px] text-slate-400">« Connecté » n'est attribué que lorsque le centre a observé la liaison : aucun moteur ne l'est à ce jour.</p>
      </Carte>

      {d.audit && (
        <Carte titre="Audit propre de la Boutique (plan d'ensemble)">
          <p className="text-xs text-slate-200">{d.audit.exigences} exigences · critères partiels {d.audit.criteres["PARTIAL"] ?? 0} · manquants {d.audit.criteres["MISSING"] ?? 0} · complets {d.audit.criteres["COMPLETE"] ?? 0} · plan complet dans le dépôt : <b>{d.audit.planComplet ? "oui" : "non"}</b>.</p>
          <details className="mt-1 text-[11px] text-slate-300"><summary className="cursor-pointer">{d.audit.exigencesSansMoteur.length} exigences sans aucun moteur dans le registre de la Boutique</summary><p>{d.audit.exigencesSansMoteur.join(" · ")}</p></details>
        </Carte>
      )}

      {d.intermediaires.length > 0 && (
        <Carte titre={`Moteurs intermédiaires (${d.intermediaires.length})`}>
          <div className="grid gap-2 md:grid-cols-2">
            {d.intermediaires.map((i) => (
              <button key={i.code} type="button" onClick={() => onOuvrirMoteur(i.code)} className="rounded-lg border border-slate-700 bg-[#0b1220] p-2 text-left hover:bg-[#13203a]" data-intermediaire={i.code}>
                <p className="text-xs font-black text-white">{i.name}</p>
                <Pastille etat={i.etat} />
                {i.manques.length > 0 && <p className="mt-1 text-[11px] text-amber-200">{i.manques[0]}</p>}
                {i.aVerifier.length > 0 && <p className="text-[11px] text-violet-300">À vérifier : {i.aVerifier[0]}</p>}
              </button>
            ))}
          </div>
        </Carte>
      )}

      {d.stock && (
        <Carte titre="Moteur de stock propre de la Boutique (famille séparée du registre)">
          <p className="text-xs text-slate-200" data-testid="stock-propre-resume">
            Compte « {d.stock.comptePropre.nom} » · canal {d.stock.comptePropre.canal} · {d.stock.modeles.length} modèles de comptes et {d.stock.canaux.length} canaux préparés ·{" "}
            <b className={d.stock.desactiveParLaBase ? "text-amber-200" : "text-red-300"}>{d.stock.desactiveParLaBase ? "désactivé par la base elle-même" : "désactivation non retrouvée dans la migration"}</b>. Aucune quantité réelle n'est connectée.
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {d.stock.moteurs.map((m) => (
              <button key={m.code} type="button" onClick={() => onOuvrirMoteur(m.code)} className="rounded-lg border border-slate-700 bg-[#0b1220] p-2 text-left hover:bg-[#13203a]" data-moteur-stock={m.code}>
                <p className="text-xs font-black text-white">{m.name}</p>
                <Pastille etat={m.etat} />
                {m.manques.length > 0 && <p className="mt-1 text-[11px] text-amber-200">{m.manques[0]}</p>}
                {m.doublons.length > 0 && <p className="text-[11px] text-slate-400">Recouvrement signalé, rien de fusionné : {m.doublons[0]}</p>}
              </button>
            ))}
          </div>
          <details className="mt-1 text-[11px] text-slate-300"><summary className="cursor-pointer">Contrôles de non-duplication ({d.stock.controlesDoublons.length}) · modèles et canaux préparés</summary>
            <ul className="list-disc pl-4">{d.stock.controlesDoublons.map((c) => <li key={c}>{c}</li>)}</ul>
            <p className="mt-1">Modèles : {d.stock.modeles.map((m) => m.libelle).join(" · ")}.</p>
            <p>Canaux : {d.stock.canaux.map((c) => c.libelle + (c.apiValidee === false ? " (API non validée)" : "")).join(" · ")}.</p>
            <p className="text-slate-400">Relevé dans {d.stock.migration} de la Boutique.</p>
          </details>
        </Carte>
      )}

      <Carte titre="Lignes de cette plateforme vers la plateforme principale">
        {d.lignes.filter((l) => l.kind === "real").length === 0 ? <Vide>Aucune ligne réelle.</Vide> : (
          <ul className="text-xs text-slate-200">{d.lignes.filter((l) => l.kind === "real").map((l) => <li key={l.id}>{l.label} — {l.kind === "real" && l.validity === "valid" ? "validée" : "non valide"} — état {l.kind === "real" ? l.etat : ""}</li>)}</ul>
        )}
        <p className="mt-1 text-[11px] text-slate-400">{d.lignes.filter((l) => l.kind === "reserve").length} lignes « À venir » en réserve. Les commandes se font dans la salle des connexions.</p>
      </Carte>

      <Carte titre="Moteurs inventoriés">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-300">État <select aria-label="Filtrer par état" value={etat} onChange={(e) => setEtat(e.target.value)} className="ml-1 rounded border border-slate-600 bg-[#0b1220] px-1 py-0.5 text-xs">{ETATS.map((e) => <option key={e} value={e}>{e ? ETAT_INVENTAIRE[e]?.libelle : "tous"}</option>)}</select></label>
          <input aria-label="Rechercher un moteur" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} className="rounded border border-slate-600 bg-[#0b1220] px-2 py-1 text-xs" />
          <label className="text-xs text-slate-300"><input type="checkbox" checked={declare} onChange={(e) => setDeclare(e.target.checked)} /> déclarés seulement</label>
          <span className="text-[11px] text-slate-400">{liste.data?.length ?? 0} moteur(s)</span>
        </div>
        <div className="max-h-[420px] overflow-auto"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-[#0b1220] text-slate-400"><tr><th>Moteur</th><th>État</th><th>Preuve</th><th>Intermédiaire prévu</th></tr></thead><tbody>
          {(liste.data ?? []).map((m) => (
            <tr key={m.code} className="cursor-pointer border-t border-slate-800 hover:bg-[#13203a]" onClick={() => onOuvrirMoteur(m.code)} data-moteur={m.code}><td className="py-0.5"><span className="font-bold text-white">{m.name}</span> <span className="text-slate-500">{m.code}</span></td><td><Pastille etat={m.etat} declareSeulement={m.declareSeulement} /></td><td className="text-slate-300">{m.preuve}</td><td className="text-slate-300">{m.intermediaire ?? "—"}</td></tr>
          ))}
        </tbody></table></div>
      </Carte>
    </section>
  );
}

export function SalleBoutiques({ onOuvrirMoteur }: Pick<Props, "onOuvrirMoteur">) {
  const a = trpc.frontierOs.accueil.useQuery();
  const boutiques = (a.data?.plateformes ?? []).filter((p) => p.kind === "shop" || p.kind === "jewelry");
  const [choix, setChoix] = useState("shop");
  return (
    <section aria-label="Salles de contrôle des boutiques" className="space-y-3">
      <div role="tablist" aria-label="Boutiques" className="flex flex-wrap gap-2">
        {boutiques.map((b) => <button key={b.code} role="tab" aria-selected={choix === b.code} type="button" onClick={() => setChoix(b.code)} className={`${bouton} ${choix === b.code ? "ring-2 ring-cyan-400" : ""}`}>{b.name}{b.status === "future" ? " (à venir)" : ""}</button>)}
      </div>
      <SallePlateforme code={choix} titre={`Salle de contrôle — ${boutiques.find((b) => b.code === choix)?.name ?? choix}`} onOuvrirMoteur={onOuvrirMoteur} />
    </section>
  );
}

// ───────────────────────── Cybersécurité ─────────────────────────
export function SalleSecurite({ onMessage, onOuvrirMoteur }: Props) {
  const utils = trpc.useUtils();
  const s = trpc.frontierOs.securite.useQuery(undefined, { refetchInterval: 20000 });
  const { demander, dialogue } = useConfirmation();
  const rafraichir = () => Promise.all([utils.frontierOs.securite.invalidate(), utils.frontierOs.accueil.invalidate(), utils.frontierOs.groupes.invalidate(), utils.frontierOs.lignes.invalidate()]);
  const gouv = trpc.frontierOs.gouvernance.useMutation({ onSuccess: async (r) => { onMessage(r.detail); await rafraichir(); }, onError: (e) => onMessage(e.message) });
  const arret = trpc.frontierOs.moteurArreter.useMutation({ onSuccess: async (r) => { onMessage(r.detail); await rafraichir(); }, onError: (e) => onMessage(e.message) });
  const demarre = trpc.frontierOs.moteurDemarrer.useMutation({ onSuccess: async (r) => { onMessage(r.detail); await rafraichir(); }, onError: (e) => onMessage(e.message) });
  const sante = trpc.frontierOs.sante.useMutation({ onSuccess: async (r) => { onMessage(`Santé : ${r.filter((x) => x.sante === "ok").length}/${r.length} moteurs répondent.`); await rafraichir(); }, onError: (e) => onMessage(e.message) });
  const d = s.data;
  if (s.isLoading) return <p className="text-sm">Lecture…</p>;
  if (s.error) return <p role="alert" className="text-sm text-red-300">{s.error.message}</p>;
  if (!d) return null;
  return (
    <section aria-label="Cybersécurité" className="space-y-3">
      {dialogue}
      <Carte titre="Mode et gouvernance du câble réel">
        <p className="text-xs text-slate-200">Mode <b>SIMULATION</b> : le centre ne branche ni ne débranche rien de réel. Aucune clé d'accès, aucune API externe pour le moment : tous les moteurs sont internes.</p>
        <p className="mt-1 text-xs text-slate-200">Gouvernance du câble réel de la Boutique : <b className={d.gouvernanceArmee ? "text-red-300" : "text-slate-300"}>{d.gouvernanceArmee ? "ARMÉE" : "non armée (état par défaut)"}</b>. Armée, une voie vers la Boutique ne passe que si le câble l'autorise ET si la ligne correspondante est connectée dans le centre ; le centre ne peut que restreindre.</p>
        <div className="mt-2 flex gap-2">
          <button type="button" className={boutonDanger} disabled={d.gouvernanceArmee || gouv.isPending} onClick={() => demander({ titre: "Armer la gouvernance du câble réel", detail: "Toute voie vers la Boutique (outils de l'IA, canaux du moteur intermédiaire) sera refusée tant que sa ligne n'est pas connectée sur ses trois coupures dans le centre. Les lignes sont coupées par défaut.", executer: () => gouv.mutate({ armer: true, confirme: true }) })}>Armer</button>
          <button type="button" className={bouton} disabled={!d.gouvernanceArmee || gouv.isPending} onClick={() => demander({ titre: "Désarmer la gouvernance", detail: "Le câble réel de la Boutique suit de nouveau ses propres règles.", executer: () => gouv.mutate({ armer: false, confirme: true }) })}>Désarmer</button>
        </div>
      </Carte>

      <CarteModeReel onMessage={onMessage} />

      <Carte titre="Séparation physique de la base du centre (niveau mesuré)">
        <p className={`text-sm font-black ${d.separation.separeeMateriellement ? "text-emerald-300" : "text-amber-200"}`} data-testid="separation-niveau" data-niveau={d.separation.niveau}>{d.separation.libelle}</p>
        <p className="mt-1 text-xs text-slate-200">{d.separation.detail}</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Mesure : base du centre « {d.separation.centre?.base ?? "—"} » · base de la plateforme « {d.separation.plateforme?.base ?? "non mesurée"} » · même serveur : {d.separation.memeServeur === null ? "non établi" : d.separation.memeServeur ? "oui" : "non"} · variable FRONTIER_DATABASE_URL : {d.separation.variableFournie ? "posée" : "absente"}. Aucune adresse ni aucun identifiant n'est lu ou affiché.
        </p>
        <p className="mt-1 text-xs text-slate-200" data-testid="derniere-sauvegarde">
          Dernière sauvegarde : {d.separation.derniereSauvegarde ? `${date(d.separation.derniereSauvegarde.le)} — ${d.separation.derniereSauvegarde.tables} tables, ${d.separation.derniereSauvegarde.lignes} lignes, empreinte ${d.separation.derniereSauvegarde.empreinte}…` : "aucune consignée (la sauvegarde se fait par le script ci-dessous ; ce centre n'en lance aucune tout seul)"}.
        </p>
        <details className="mt-1 text-[11px] text-slate-300"><summary className="cursor-pointer">Marche à suivre pour passer à un serveur distinct (6 étapes) et outils</summary>
          <ol className="list-decimal pl-5">{d.separation.etapes.map((e) => <li key={e}>{e}</li>)}</ol>
          <ul className="mt-1 list-disc pl-5 font-mono">{d.separation.outils.map((o) => <li key={o}>{o}</li>)}</ul>
          <p className="mt-1 text-slate-400">La restauration n'écrit que dans une base vide et ne valide qu&apos;après avoir relu, table par table, la même empreinte que la sauvegarde. Elle ne rebranche aucune connexion.</p>
        </details>
      </Carte>

      <Carte titre="Voies de DONNÉES entre la plateforme et la Boutique (échanges)">
        <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-400"><tr><th>Voie</th><th>Code</th><th>Consultée par le portier du centre</th></tr></thead><tbody>
          {d.voies.filter((v) => v.type === "echange").map((v) => <tr key={v.voie} className="align-top border-t border-slate-800" data-gouvernee={v.gouvernee} data-type="echange"><td className="py-1 text-slate-100">{v.voie}</td><td className="text-slate-400">{v.fichier}</td><td className={v.gouvernee ? "text-emerald-300" : "text-amber-300"}>{v.gouvernee ? "oui (si la gouvernance est armée)" : "NON"} — <span className="text-slate-300">{v.note}</span></td></tr>)}
        </tbody></table></div>
      </Carte>

      <Carte titre="Navigation (pas un échange de données)">
        <ul className="text-xs text-slate-200">{d.voies.filter((v) => v.type === "navigation").map((v) => <li key={v.voie} data-type="navigation" data-gouvernee={v.gouvernee}><b>{v.voie}</b> — <span className="text-slate-300">{v.note}</span></li>)}</ul>
      </Carte>

      <Carte titre="Moteurs internes : fonction, entrées, sorties, santé, arrêt">
        <div className="mb-2"><button type="button" className={bouton} disabled={sante.isPending} onClick={() => sante.mutate()}>Vérifier la santé maintenant</button></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-slate-400"><tr><th>Moteur</th><th>Rôle</th><th>État</th><th>Dernière vérification</th><th></th></tr></thead><tbody>
          {d.moteursInternes.map((m) => (
            <tr key={m.code} className="align-top border-t border-slate-800" data-moteur-interne={m.code}>
              <td className="py-1"><button type="button" onClick={() => onOuvrirMoteur(m.code)} className="text-left font-bold text-cyan-200 hover:underline">{m.nom}</button><div className="text-[10px] text-slate-500">{m.code}</div></td>
              <td className="text-slate-300">{m.kind === "command" ? "commande" : m.kind === "verification" ? "vérification" : m.kind === "transport" ? "transport" : "mesures"}</td>
              <td className={m.enMarche ? (m.sante === "ok" ? "text-emerald-300" : "text-amber-300") : "text-red-300"}>{m.enMarche ? `en marche · ${m.sante}` : "ARRÊTÉ"}</td>
              <td className="text-slate-300">{m.verifieLe ? heure(m.verifieLe) : "jamais"}</td>
              <td>{m.enMarche ? <button type="button" className={boutonDanger} onClick={() => demander({ titre: `Arrêter le moteur ${m.nom}`, detail: m.arret, executer: () => arret.mutate({ code: m.code, confirme: true }) })}>Arrêter</button> : <button type="button" className={bouton} onClick={() => demander({ titre: `Démarrer le moteur ${m.nom}`, detail: "Le moteur est redémarré puis sa santé est mesurée.", executer: () => demarre.mutate({ code: m.code, confirme: true }) })}>Démarrer</button>}</td>
            </tr>
          ))}
        </tbody></table></div>
      </Carte>

      <Carte titre="Secrets : références seulement">
        <p className="text-[11px] text-slate-400">Les secrets restent dans un stockage protégé (variables d'environnement Railway, coffre de la plateforme). Le centre, ses journaux et cette vitrine ne montrent que la référence, jamais une valeur.</p>
        <table className="mt-1 w-full text-left text-xs"><thead className="text-slate-400"><tr><th>Nom</th><th>Où</th><th>Référence</th><th>État</th></tr></thead><tbody>
          {d.secrets.map((x) => <tr key={x.name} className="border-t border-slate-800"><td className="py-0.5 text-white">{x.name}</td><td className="text-slate-300">{x.store}</td><td><code>{x.ref}</code></td><td className={x.status === "missing" ? "text-amber-300" : "text-slate-300"}>{x.status === "missing" ? "absent (attente externe)" : "déclaré"}</td></tr>)}
        </tbody></table>
      </Carte>

      <Carte titre="Emplacements d'API (préparés, inactifs)">
        <ul className="text-xs text-slate-200">{d.api.map((x) => <li key={x.code}>{x.name} — <b>inactif</b> · {x.scope}</li>)}</ul>
      </Carte>
    </section>
  );
}

// ───────────────────────── Atelier de réparation ─────────────────────────
export function SalleAtelier({ onMessage }: Pick<Props, "onMessage">) {
  const utils = trpc.useUtils();
  const a = trpc.frontierOs.atelier.useQuery(undefined, { refetchInterval: 15000 });
  const { demander, dialogue } = useConfirmation();
  const rafraichir = () => Promise.all([utils.frontierOs.atelier.invalidate(), utils.frontierOs.incidents.invalidate(), utils.frontierOs.accueil.invalidate(), utils.frontierOs.lignes.invalidate(), utils.frontierOs.audit.invalidate()]);
  const ok = (r: { detail: string }) => rafraichir().then(() => onMessage(r.detail));
  const diag = trpc.frontierOs.diagnostic.useMutation({ onSuccess: async (r) => { onMessage(`${r.anomalies.length} anomalie(s) constatée(s) ; invariants ${r.invariants.ok ? "respectés" : `VIOLÉS (${r.invariants.violations.length})`}.`); await rafraichir(); }, onError: (e) => onMessage(e.message) });
  const proposer = trpc.frontierOs.proposer.useMutation({ onSuccess: ok, onError: (e) => onMessage(e.message) });
  const tester = trpc.frontierOs.tester.useMutation({ onSuccess: ok, onError: (e) => onMessage(e.message) });
  const appliquer = trpc.frontierOs.appliquer.useMutation({ onSuccess: ok, onError: (e) => onMessage(e.message) });
  const annuler = trpc.frontierOs.annuler.useMutation({ onSuccess: ok, onError: (e) => onMessage(e.message) });
  const clore = trpc.frontierOs.cloreIncident.useMutation({ onSuccess: ok, onError: (e) => onMessage(e.message) });
  const resoudreLacune = trpc.frontierOs.resoudreLacune.useMutation({ onSuccess: ok, onError: (e) => onMessage(e.message) });
  const [notesLacunes, setNotesLacunes] = useState<Record<string, string>>({});
  const d = a.data;
  if (a.isLoading) return <p className="text-sm">Lecture de l'atelier…</p>;
  if (a.error) return <p role="alert" className="text-sm text-red-300">{a.error.message}</p>;
  if (!d) return null;
  return (
    <section aria-label="Atelier de réparation" className="space-y-3">
      {dialogue}
      <Carte>
        <h2 className="text-base font-black text-white">Atelier de réparation</h2>
        <p className="text-xs text-slate-300">Enregistrer un incident, diagnostiquer, proposer une réparation, la tester dans un environnement isolé (une transaction toujours annulée), préparer le retour arrière, l'appliquer sur confirmation. Premier lot : circuit complet en simulation, sur les données du centre ; une plateforme réelle exigerait un droit accordé.</p>
        <button type="button" className={`${bouton} mt-2`} disabled={diag.isPending} onClick={() => diag.mutate()}>Lancer le diagnostic</button>
        <p className={`mt-2 text-xs font-bold ${d.invariants.ok ? "text-emerald-300" : "text-red-300"}`}>Invariants du centre : {d.invariants.ok ? "tous respectés" : d.invariants.violations.join(" ; ")}</p>
      </Carte>
      <Carte titre={`Anomalies constatées (${d.anomalies.length})`}>
        {d.anomalies.length === 0 ? <Vide>Aucune anomalie.</Vide> : <ul className="text-xs text-slate-200">{d.anomalies.map((x, i) => <li key={i} className="border-t border-slate-800 py-1"><b className={x.severite === "critical" ? "text-red-300" : x.severite === "warning" ? "text-amber-300" : "text-slate-300"}>{x.severite}</b> · {x.kind} — {x.resume} {x.operation ? <span className="text-cyan-300">→ réparation possible : {x.operation.op}</span> : <span className="text-slate-400">→ intervention humaine</span>}</li>)}</ul>}
      </Carte>
      <Carte titre={`Incidents ouverts (${d.incidentsOuverts.length})`}>
        {d.incidentsOuverts.length === 0 ? <Vide>Aucun incident ouvert.</Vide> : (
          <ul className="text-xs text-slate-200">{d.incidentsOuverts.map((i) => (
            <li key={i.id} className="border-t border-slate-800 py-1" data-incident={i.id}>
              <b className={i.severity === "critical" ? "text-red-300" : "text-amber-300"}>#{i.id} {i.severity}</b> · {i.kind} · {i.status} — {i.summary}
              <div className="mt-1 flex gap-2">
                {Boolean((i.detail as { operation?: unknown }).operation) && <button type="button" className={bouton} onClick={() => proposer.mutate({ incidentId: i.id })}>Proposer une réparation</button>}
                <button type="button" className={bouton} onClick={() => clore.mutate({ incidentId: i.id, raison: "Constaté et traité par le PDG" })}>Clore</button>
              </div>
            </li>
          ))}</ul>
        )}
      </Carte>
      <Carte titre={`Réparations (${d.reparations.length})`}>
        {d.reparations.length === 0 ? <Vide>Aucune réparation.</Vide> : (
          <ul className="text-xs text-slate-200">{d.reparations.map((r) => (
            <li key={r.id} className="border-t border-slate-800 py-1" data-reparation={r.id} data-statut={r.status}>
              <b>#{r.id}</b> · incident {r.incidentId} · <b className={r.status === "applied" ? "text-emerald-300" : r.status === "failed" ? "text-red-300" : "text-cyan-200"}>{r.status}</b> · {String((r.proposedChange as { op?: string }).op)} · {date(r.createdAt)}
              <div className="text-[11px] text-slate-400">Version avant : <code>{JSON.stringify(r.versionBefore).slice(0, 160)}</code></div>
              {r.testResult && <div className="text-[11px] text-slate-300">Test isolé : {(r.testResult as { ok?: boolean }).ok ? "réussi" : "ÉCHEC"} — {JSON.stringify((r.testResult as { invariants?: string[] }).invariants ?? [])}</div>}
              {r.rightsNote && <div className="text-[11px] text-slate-500">Droit : {r.rightsNote}</div>}
              <div className="mt-1 flex flex-wrap gap-2">
                {["proposed", "failed", "tested"].includes(r.status) && <button type="button" className={bouton} onClick={() => tester.mutate({ reparationId: r.id })}>Tester (isolé)</button>}
                {r.status === "tested" && <button type="button" className={boutonDanger} onClick={() => demander({ titre: `Appliquer la réparation #${r.id}`, detail: "Un invariant cassé annule tout. Le retour arrière reste possible.", executer: () => appliquer.mutate({ reparationId: r.id, confirme: true }) })}>Appliquer</button>}
                {r.status === "applied" && <button type="button" className={boutonDanger} onClick={() => demander({ titre: `Retour arrière de la réparation #${r.id}`, detail: "Restaure la version avant l'intervention (une porte n'est jamais rouverte).", executer: () => annuler.mutate({ reparationId: r.id, confirme: true }) })}>Retour arrière</button>}
              </div>
            </li>
          ))}</ul>
        )}
      </Carte>
      <Carte titre={`Lacunes de développement (${d.lacunes.declarees} déclarée(s), ${d.lacunes.resolues} résolue(s))`}>
        <p className="text-xs text-slate-300">Ce que le centre ne sait pas encore faire, dit honnêtement, avec le développement nécessaire — jamais un échec silencieux ni une réussite inventée. Une lacune constatée par le centre lui-même (preuve observée) se résout seule ; les autres attendent votre décision.</p>
        {d.lacunes.lacunes.length === 0 ? <Vide>Aucune lacune relevée pour l'instant.</Vide> : (
          <ul className="mt-2 text-xs text-slate-200">{d.lacunes.lacunes.map((l) => (
            <li key={l.code} className="border-t border-slate-800 py-1.5" data-lacune={l.code} data-statut={l.status}>
              <b className={l.status === "resolved" ? "text-emerald-300" : "text-amber-300"}>{l.status === "resolved" ? "résolue" : "déclarée"}</b> · <span className="text-white">{l.title}</span>
              {l.engineCode && <span className="text-slate-500"> ({l.engineCode})</span>}
              <div className="text-[11px] text-slate-400">{l.detail}</div>
              <div className="text-[11px] text-cyan-200">Développement nécessaire : {l.developmentNeeded}</div>
              {l.status === "resolved" ? (
                <div className="text-[11px] text-slate-500">Résolue par {l.resolvedBy} le {date(l.resolvedAt)} — {l.resolvedNote}</div>
              ) : (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <input aria-label={`Note de résolution pour ${l.code}`} value={notesLacunes[l.code] ?? ""} onChange={(e) => setNotesLacunes((s) => ({ ...s, [l.code]: e.target.value }))} placeholder="Comment la lacune a été comblée…" className="w-72 rounded border border-slate-600 bg-[#0b1220] px-2 py-1 text-[11px] text-white" />
                  <button type="button" className={bouton} disabled={resoudreLacune.isPending || (notesLacunes[l.code] ?? "").trim().length < 3} onClick={() => demander({ titre: `Marquer la lacune « ${l.code} » résolue`, detail: "Indique que le développement nécessaire a été fait (ailleurs, dans une autre session).", executer: () => resoudreLacune.mutate({ code: l.code, note: notesLacunes[l.code]!.trim(), confirme: true }) })}>Marquer résolue</button>
                </div>
              )}
            </li>
          ))}</ul>
        )}
      </Carte>
    </section>
  );
}

// ───────────────────────── Mémoire ─────────────────────────
export function SalleMemoire() {
  const m = trpc.frontierOs.memoire.useQuery();
  if (m.isLoading) return <p className="text-sm">Lecture…</p>;
  if (m.error) return <p role="alert" className="text-sm text-red-300">{m.error.message}</p>;
  return (
    <section aria-label="Mémoire" className="space-y-3">
      <Carte titre="Mémoire du centre (extensible, sans secret)">
        <ul className="text-xs text-slate-200">{(m.data?.blocs ?? []).map((b) => <li key={b.id} className="border-t border-slate-800 py-1"><b className="text-cyan-200">{b.key}</b> <span className="text-slate-500">({b.kind}, importance {b.importance}, appartient à {b.ownerKind}:{b.ownerCode})</span><br />{String((b.content as { texte?: string }).texte ?? JSON.stringify(b.content))}</li>)}</ul>
      </Carte>
      <Carte titre="Historique des changements de configuration">
        <table className="w-full text-left text-xs"><thead className="text-slate-400"><tr><th>Quand</th><th>Quoi</th><th>Avant</th><th>Après</th><th>Qui</th></tr></thead><tbody>
          {(m.data?.historique ?? []).map((h) => <tr key={h.id} className="border-t border-slate-800"><td className="py-0.5">{date(h.at)}</td><td>{h.entity} {h.entityId}</td><td>{JSON.stringify(h.oldValue)}</td><td>{JSON.stringify(h.newValue)}</td><td>{h.actor}</td></tr>)}
        </tbody></table>
      </Carte>
    </section>
  );
}

// ───────────────────────── Incidents et audit ─────────────────────────
export function SalleIncidentsAudit() {
  const [resultat, setResultat] = useState<"" | "ok" | "refused" | "error">("");
  const incidents = trpc.frontierOs.incidents.useQuery({ limite: 60 });
  const audit = trpc.frontierOs.audit.useQuery({ limite: 100, resultat: resultat || undefined });
  const commandes = trpc.frontierOs.commandes.useQuery();
  const sessions = trpc.frontierOs.sessions.useQuery();
  const [ouverte, setOuverte] = useState<number | null>(null);
  const detail = trpc.frontierOs.commande.useQuery({ id: ouverte ?? 1 }, { enabled: ouverte !== null });
  return (
    <section aria-label="Incidents et audit" className="space-y-3">
      <Carte titre="Incidents">
        {(incidents.data ?? []).length === 0 ? <Vide>Aucun incident enregistré.</Vide> : <table className="w-full text-left text-xs"><thead className="text-slate-400"><tr><th>#</th><th>Gravité</th><th>Nature</th><th>État</th><th>Résumé</th><th>Ouvert</th></tr></thead><tbody>
          {(incidents.data ?? []).map((i) => <tr key={i.id} className="align-top border-t border-slate-800"><td className="py-0.5">{i.id}</td><td className={i.severity === "critical" ? "text-red-300" : i.severity === "warning" ? "text-amber-300" : ""}>{i.severity}</td><td>{i.kind}</td><td>{i.status}</td><td>{i.summary}</td><td>{date(i.openedAt)}</td></tr>)}
        </tbody></table>}
      </Carte>
      <Carte titre="Commandes (ordre demandé, résultat confirmé, accusés des deux moteurs)">
        <table className="w-full text-left text-xs"><thead className="text-slate-400"><tr><th>#</th><th>Quand</th><th>Nature</th><th>Cible</th><th>Demandé</th><th>Résultat</th><th>Moteurs</th></tr></thead><tbody>
          {(commandes.data ?? []).map((c) => (
            <tr key={c.id} className="cursor-pointer border-t border-slate-800 hover:bg-[#13203a]" onClick={() => setOuverte(ouverte === c.id ? null : c.id)}><td className="py-0.5">{c.id}</td><td>{heure(c.createdAt)}</td><td>{c.kind}</td><td>{c.targetKind} {c.targetId}</td><td>{c.requested === "activate" ? "activer" : "couper"}</td><td className={c.status === "confirmed" ? "text-emerald-300" : c.status === "partial" ? "text-amber-300" : "text-red-300"}>{c.status}</td><td className="text-slate-400">{c.commandEngine?.replace("center:", "")} / {c.verificationEngine?.replace("center:", "")}</td></tr>
          ))}
        </tbody></table>
        {ouverte !== null && detail.data && (
          <div className="mt-2 rounded-lg border border-slate-700 bg-[#070b12] p-2 text-[11px] text-slate-200" data-testid="detail-commande">
            <p className="font-bold">Commande {detail.data.commande.id} — {JSON.stringify((detail.data.commande.result as { detail?: string }).detail ?? "")}</p>
            <ul>{detail.data.recus.map((r) => <li key={r.id}>{heure(r.at)} · {r.phase}/{r.role} · {r.engineCode} → <b className={r.outcome === "ok" ? "text-emerald-300" : "text-red-300"}>{r.outcome}</b> · {r.detail} · {r.durationMs ?? 0} ms</li>)}</ul>
            {detail.data.enfants.length > 0 && <p className="mt-1">{detail.data.enfants.length} commande(s) enfant(s) : {detail.data.enfants.map((e) => `${e.id}:${e.status}`).join(" · ")}</p>}
          </div>
        )}
      </Carte>
      <Carte titre="Sessions de test (environnement isolé)">
        {(sessions.data ?? []).length === 0 ? <Vide>Aucune session de test jouée.</Vide> : (sessions.data ?? []).map((s) => (
          <details key={s.id} className="border-t border-slate-800 py-1 text-xs text-slate-200">
            <summary className="cursor-pointer"><b className={s.status === "passed" ? "text-emerald-300" : s.status === "failed" ? "text-red-300" : ""}>{s.status}</b> · {s.label} · {s.protocol} · {date(s.startedAt)} · {s.etapes.filter((e) => e.passed).length}/{s.etapes.length} étapes</summary>
            <ul className="ml-4 text-[11px]">{s.etapes.map((e) => <li key={e.id}>{e.passed ? "✔" : "✘"} {e.name} — attendu : {e.expectation} — observé : {e.observation}</li>)}</ul>
          </details>
        ))}
      </Carte>
      <Carte titre="Journal d'audit (en ajout seul)">
        <label className="text-xs text-slate-300">Résultat <select aria-label="Filtrer le journal" value={resultat} onChange={(e) => setResultat(e.target.value as typeof resultat)} className="ml-1 rounded border border-slate-600 bg-[#0b1220] px-1 py-0.5 text-xs"><option value="">tous</option><option value="ok">ok</option><option value="refused">refusé</option><option value="error">erreur</option></select></label>
        <div className="mt-1 max-h-[360px] overflow-auto"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-[#0b1220] text-slate-400"><tr><th>Quand</th><th>Qui</th><th>Action</th><th>Cible</th><th>Résultat</th></tr></thead><tbody>
          {(audit.data ?? []).map((a) => <tr key={a.id} className="border-t border-slate-800"><td className="py-0.5">{date(a.at)}</td><td>{a.actorType}{a.actorId ? `:${a.actorId}` : ""}</td><td>{a.action}</td><td>{a.targetKind} {a.targetId}</td><td className={a.result === "ok" ? "text-emerald-300" : a.result === "refused" ? "text-amber-300" : "text-red-300"}>{a.result}{a.error ? ` (${a.error})` : ""}</td></tr>)}
        </tbody></table></div>
      </Carte>
    </section>
  );
}

// ───────────────────────── Employés et permissions ─────────────────────────
export function SalleEmployes() {
  const e = trpc.frontierOs.employes.useQuery();
  return (
    <section aria-label="Employés et permissions" className="space-y-3">
      <Carte titre="Accès au centre">
        <p className="text-xs text-slate-200">{e.data?.note}</p>
        <table className="mt-2 w-full text-left text-xs"><thead className="text-slate-400"><tr><th>Qui</th><th>Portée</th><th>Niveau</th><th>État</th><th>Accordé par</th></tr></thead><tbody>
          {(e.data?.acces ?? []).map((a) => <tr key={a.id} className="border-t border-slate-800"><td className="py-0.5">{a.subjectKind} {a.subjectRef}</td><td>{a.scope}</td><td>{a.level}</td><td className={a.status === "active" ? "text-emerald-300" : "text-slate-400"}>{a.status === "active" ? "actif" : a.status === "prepared" ? "préparé, non accordé" : a.status}</td><td className="text-slate-400">{a.grantedBy}</td></tr>)}
        </tbody></table>
      </Carte>
    </section>
  );
}

// ───────────────────────── Futures plateformes ─────────────────────────
export function SalleFutures({ onMessage }: Pick<Props, "onMessage">) {
  const utils = trpc.useUtils();
  const f = trpc.frontierOs.futures.useQuery();
  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const ajout = trpc.frontierOs.ajouterGroupe.useMutation({ onSuccess: async (r) => { onMessage(r.detail); if (r.ok) { setCode(""); setNom(""); } await Promise.all([utils.frontierOs.futures.invalidate(), utils.frontierOs.groupes.invalidate(), utils.frontierOs.lignes.invalidate()]); }, onError: (e) => onMessage(e.message) });
  const d = f.data;
  return (
    <section aria-label="Futures plateformes" className="space-y-3">
      <Carte titre="Groupes à venir">
        <table className="w-full text-left text-xs"><thead className="text-slate-400"><tr><th>Groupe</th><th>Plateforme</th><th>Lignes réelles</th><th>Réserves « À venir »</th></tr></thead><tbody>
          {(d?.groupes ?? []).map((g) => <tr key={g.code} className="border-t border-slate-800"><td className="py-0.5 font-bold text-white">{g.name}</td><td>{g.plateforme ? `${g.plateforme.name}${g.plateforme.identityStatus === "to_verify" ? " (à vérifier)" : ""}` : "—"}</td><td>{g.reelles}</td><td>{g.reserves}</td></tr>)}
        </tbody></table>
        <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); ajout.mutate({ code, nom, plateforme: null }); }}>
          <label className="text-xs text-slate-300">Code du groupe<input aria-label="Code du nouveau groupe" value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} className="ml-1 rounded border border-slate-600 bg-[#0b1220] px-2 py-1 text-xs" placeholder="ex. joaillerie-2" /></label>
          <label className="text-xs text-slate-300">Nom<input aria-label="Nom du nouveau groupe" value={nom} onChange={(e) => setNom(e.target.value)} className="ml-1 rounded border border-slate-600 bg-[#0b1220] px-2 py-1 text-xs" /></label>
          <button type="submit" className={bouton} disabled={ajout.isPending || code.length < 2 || nom.length < 2}>Ajouter un groupe (5 lignes « À venir »)</button>
        </form>
        <p className="mt-1 text-[11px] text-slate-400">Les groupes s'ajoutent sans limite fixe ; chacun naît avec cinq lignes « À venir » vides et désactivées.</p>
      </Carte>
      <Carte titre="Entreprises, souscriptions et API (préparées, non actives)">
        <ul className="text-xs text-slate-200">{(d?.entreprises ?? []).map((c) => <li key={c.code}>{c.name} — {c.role} — {c.status}</li>)}</ul>
        <ul className="mt-1 text-xs text-slate-200">{(d?.souscriptions ?? []).map((s) => <li key={s.id}>Souscription « {s.plan} » ({s.companyCode}) : <b>{s.status === "prepared" ? "modèle préparé" : s.status}</b> — {s.note}</li>)}</ul>
        <ul className="mt-1 text-xs text-slate-200">{(d?.api ?? []).map((a) => <li key={a.code}>{a.name} : <b>inactif</b></li>)}</ul>
      </Carte>
    </section>
  );
}
