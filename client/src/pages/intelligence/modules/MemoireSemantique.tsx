/** Mémoire par le sens : état de l'indexation et reprise de l'existant (réservé au PDG). */
import { useState } from "react";
import { trpc } from "../../../lib/trpc";

export function MemoireSemantique() {
  const utils = trpc.useUtils();
  const etat = trpc.intelligences.empreintesEtat.useQuery();
  const [message, setMessage] = useState("");
  const [enCours, setEnCours] = useState(false);
  const reindexer = trpc.intelligences.empreintesReindexer.useMutation();

  async function reprendre() {
    setEnCours(true);
    setMessage("");
    try {
      let total = 0;
      // Lots successifs jusqu'à épuisement, échec ou absence de progrès (jamais de boucle infinie).
      for (let i = 0; i < 40; i++) {
        const r = await reindexer.mutateAsync();
        total += r.indexees;
        if (r.echec) { setMessage(`Arrêté après ${total} élément(s) : ${r.echec}`); break; }
        if (r.restantes === 0) { setMessage(`Terminé : ${total} élément(s) indexé(s).`); break; }
        if (r.indexees === 0) { setMessage(`Aucun progrès : il reste ${r.restantes} élément(s) sans empreinte.`); break; }
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Reprise impossible.");
    } finally {
      setEnCours(false);
      await utils.intelligences.empreintesEtat.invalidate();
    }
  }

  const d = etat.data;
  return (
    <section className="rounded-xl border border-black/10 p-4 space-y-2">
      <h2 className="text-base font-black">Mémoire par le sens</h2>
      <p className="text-sm">
        Retrouver un souvenir ou une connaissance par son sens, même sans les mêmes mots. Éteinte tant que « Recherche par le
        sens » n'est pas activée ci-dessus ; si le fournisseur échoue, la recherche par les mots continue seule. Elle n'est
        « fonctionnelle » qu'après un test réel : lancez les tests des capacités.
      </p>
      {etat.isLoading && <p>Chargement…</p>}
      {d && (
        <ul className="text-sm">
          <li>Fonctionnalité : {d.active ? "activée" : "éteinte"}</li>
          <li>Mémoire de l'IA : {d.memoire.indexees} / {d.memoire.total} avec empreinte</li>
          <li>Connaissances : {d.connaissances.indexees} / {d.connaissances.total} avec empreinte</li>
        </ul>
      )}
      <button type="button" disabled={enCours || !d?.active} onClick={() => void reprendre()} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40">
        {enCours ? "Indexation en cours…" : "Reprendre l'existant"}
      </button>
      <p role="status" className="text-sm">{message}</p>
    </section>
  );
}
