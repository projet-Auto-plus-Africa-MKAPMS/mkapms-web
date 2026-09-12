/**
 * MKA.P-MS Intelligence — module Intégrations & API (LOT IA02B).
 *
 * Plateforme développeur réelle (server/intelligences/developpeur.ts) :
 * contrat public /api/v1, clés existantes (secret jamais réaffiché après sa
 * création), création d'une nouvelle clé fermée par défaut, révocation. Même
 * moteur que celui déjà exposé côté direction historique — aucun second
 * système de clés créé ici.
 */
import { useState } from "react";
import { Plug, KeyRound, Trash2 } from "lucide-react";
import { trpc } from "../../../lib/trpc";

const ROLES_CLE = ["user", "pro", "garage", "society", "employee"] as const;

export function IntegrationsApi() {
  const utils = trpc.useUtils();
  const developpeur = trpc.intelligences.developpeur.useQuery();

  const [nom, setNom] = useState("");
  const [role, setRole] = useState<(typeof ROLES_CLE)[number]>("pro");
  const [portee, setPortee] = useState<string[]>([]);
  const [motif, setMotif] = useState("");
  const [secretCree, setSecretCree] = useState<{ secret: string; prefixe: string } | null>(null);

  const creer = trpc.intelligences.creerCleDeveloppeur.useMutation({
    onSuccess: (r) => {
      if (r.ok && r.secret && r.prefixe) setSecretCree({ secret: r.secret, prefixe: r.prefixe });
      void utils.intelligences.developpeur.invalidate();
      setNom("");
      setPortee([]);
      setMotif("");
    },
  });

  const revoquer = trpc.intelligences.revoquerCleDeveloppeur.useMutation({
    onSuccess: () => void utils.intelligences.developpeur.invalidate(),
  });

  function togglePortee(code: string) {
    setPortee((p) => (p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));
  }

  if (developpeur.isLoading) return <p className="text-sm text-black/40">Chargement…</p>;
  if (!developpeur.data) return <p className="text-sm text-red-600">Plateforme développeur indisponible.</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Plug className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Contrat public {developpeur.data.contrat.base}</h2>
        </div>
        <p className="text-xs text-black/50">{developpeur.data.contrat.authentification}</p>
      </div>

      <div className="rounded-xl border border-black/10 p-4">
        <h2 className="mb-3 text-base font-black text-[#111]">Clés existantes</h2>
        {developpeur.data.cles.length === 0 && (
          <p className="text-sm text-black/40">Aucune clé développeur créée pour l'instant.</p>
        )}
        <ul className="divide-y divide-black/5">
          {developpeur.data.cles.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-bold text-[#111]">{c.nom}</span>
                  <span className="text-[11px] text-black/30">{c.prefixe}…</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${c.active ? "bg-[#E9F7EF] text-[#1a7f37]" : "bg-black/5 text-black/40"}`}
                  >
                    {c.active ? "active" : "inactive"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-black/50">
                  {c.role} — quota {c.quotaJour}/j — {c.appels24h} appel(s) et {c.refus24h} refus sur 24h
                </p>
                <p className="mt-0.5 text-[11px] text-black/30">portée : {c.portee.join(", ") || "aucune"}</p>
              </div>
              {c.active && (
                <button
                  type="button"
                  onClick={() => revoquer.mutate({ id: c.id, motif: "Révoquée depuis /intelligence." })}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Révoquer
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Nouvelle clé</h2>
        </div>

        {secretCree && (
          <div className="mb-3 rounded-lg border border-[#8B7500]/30 bg-[#FFFBEA] p-3 text-sm">
            <p className="font-bold text-[#111]">
              Secret affiché une seule fois — copiez-le maintenant : {secretCree.secret}
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (nom.trim().length < 3 || portee.length === 0 || motif.trim().length < 3) return;
            setSecretCree(null);
            creer.mutate({ nom: nom.trim(), role, portee, quotaJour: 0, motif: motif.trim() });
          }}
          className="space-y-2"
        >
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom de la clé"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#8B7500]"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES_CLE)[number])}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          >
            {ROLES_CLE.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1.5">
            {developpeur.data.contrat.capacites.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => togglePortee(c.code)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  portee.includes(c.code) ? "bg-[#111] text-white" : "bg-black/5 text-black/50"
                }`}
              >
                {c.code}
              </button>
            ))}
          </div>
          <input
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Motif (obligatoire)"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#8B7500]"
          />
          <button
            type="submit"
            disabled={creer.isPending}
            className="rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            Créer (fermée par défaut, quota 0)
          </button>
          {creer.data && !creer.data.ok && (
            <p className="text-sm text-red-600">{creer.data.detail}</p>
          )}
        </form>
      </div>
    </div>
  );
}
