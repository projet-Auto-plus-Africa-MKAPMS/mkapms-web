/**
 * Centre d'auto-branchement (PDG).
 *
 * Ce que le module a réellement relevé sur les 700 écrans : ce qui passe par le
 * Moteur de boutons, ce qui ne déclenche rien, et les destinations citées qui
 * n'existent pas. Chaque défaut porte une proposition à décider — rien n'est
 * corrigé automatiquement dans le code de production.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronLeft,
  FileWarning,
  MousePointerClick,
  RefreshCw,
  Route as RouteIcon,
  ShieldCheck,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

function Carte({ titre, valeur, detail }: { titre: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-black/40">{titre}</p>
      <p className="mt-1 text-lg font-black text-[#111]">{valeur}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-black/50">{detail}</p> : null}
    </div>
  );
}

const LIBELLE_TRAITEMENT: Record<string, string> = {
  creer_page: "Créer la page",
  regle_redirection: "Déclarer une redirection",
  declarer_au_moteur: "Déclarer au Moteur de boutons",
  retirer_element: "Retirer l'élément",
  livrer_module: "Livrer le contenu de l'écran",
};

export default function CentreAutoBranchement() {
  const { user } = useAuth();
  const isPdg = user?.role === "super_admin";
  const [message, setMessage] = useState<string | null>(null);

  const synthese = trpc.autoBranchement.synthese.useQuery(undefined, {
    enabled: !!isPdg,
    refetchOnWindowFocus: false,
  });
  const destinations = trpc.autoBranchement.destinations.useQuery(undefined, {
    enabled: !!isPdg,
    refetchOnWindowFocus: false,
  });
  const sectionsVides = trpc.autoBranchement.sectionsVides.useQuery(undefined, {
    enabled: !!isPdg,
    refetchOnWindowFocus: false,
  });
  const propositions = trpc.autoBranchement.propositions.useQuery(
    { limit: 60 },
    { enabled: !!isPdg, refetchOnWindowFocus: false },
  );

  const analyser = trpc.autoBranchement.analyser.useMutation({
    onSuccess: (r) => {
      const vivantes = r.destinationsMortes.length - r.destinationsRattrapees;
      setMessage(
        `${r.synthese.total} cliquable(s) sur ${r.synthese.ecrans} écran(s) — ${r.synthese.parMotif.sans_action} sans action, ${vivantes} destination(s) inexistante(s), ${r.publies.length} événement(s) publié(s) au bus.`,
      );
      synthese.refetch();
      destinations.refetch();
      sectionsVides.refetch();
      propositions.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  if (!user || !isPdg) return <Navigate to="/" replace />;

  const s = synthese.data ?? null;
  const mortes = (destinations.data ?? []).filter((d) => !d.rattrapeeParRedirection);
  const rattrapees = (destinations.data ?? []).filter((d) => d.rattrapeeParRedirection);

  return (
    <div className="min-h-screen bg-[#f6f6f7] pb-20">
      <div className="mx-auto max-w-5xl px-4 py-5">
        <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-sm text-black/60">
          <ChevronLeft size={16} /> Retour
        </Link>

        <header className="rounded-2xl bg-[#111] p-5 text-white">
          <h1 className="flex items-center gap-2 text-xl font-black">
            <MousePointerClick size={20} className="text-[#d4af37]" />
            Auto-branchement — tous les cliquables de la plateforme
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Le module relit chaque élément cliquable, revérifie chaque destination auprès du Moteur
            de Redirection, et remet chaque défaut à l&apos;Event Bus, au Système Intelligent et à
            MKA.P-MS Intelligences. Il constate et propose : il ne modifie pas le code.
          </p>
          <button
            type="button"
            onClick={() => analyser.mutate()}
            disabled={analyser.isPending}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#d4af37] px-4 py-2 text-sm font-bold text-[#111] disabled:opacity-60"
          >
            <RefreshCw size={16} className={analyser.isPending ? "animate-spin" : undefined} />
            {analyser.isPending ? "Analyse en cours…" : "Lancer une passe maintenant"}
          </button>
          {message ? <p className="mt-3 text-xs text-[#d4af37]">{message}</p> : null}
        </header>

        {s ? (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Carte titre="Cliquables" valeur={String(s.total)} detail={`${s.ecrans} écran(s)`} />
            <Carte
              titre="Pilotés par le moteur"
              valeur={`${s.couvertureMoteur} %`}
              detail={`${s.moteur} élément(s)`}
            />
            <Carte
              titre="Sans action"
              valeur={String(s.parMotif.sans_action)}
              detail="appuyer ne produit rien"
            />
            <Carte
              titre="Destinations inexistantes"
              valeur={String(mortes.length)}
              detail={`${rattrapees.length} rattrapée(s) par redirection`}
            />
          </div>
        ) : null}

        <section className="mt-6 rounded-2xl border border-black/5 bg-white p-4">
          <h2 className="flex items-center gap-2 text-sm font-black text-[#111]">
            <RouteIcon size={16} className="text-red-600" />
            Destinations citées qui n&apos;existent pas
          </h2>
          {mortes.length === 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
              <ShieldCheck size={16} /> Toutes les destinations écrites dans les écrans mènent à une
              page réelle.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-black/5">
              {mortes.slice(0, 40).map((d) => (
                <li key={d.destination} className="py-2">
                  <p className="text-sm font-bold text-[#111]">
                    {d.destination}{" "}
                    <span className="font-normal text-black/50">— {d.occurrences} lien(s)</span>
                  </p>
                  <p className="text-[11px] text-black/50">{d.ecrans.join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
          <h2 className="flex items-center gap-2 text-sm font-black text-[#111]">
            <FileWarning size={16} className="text-amber-600" />
            Écrans annoncés au visiteur sans contenu
          </h2>
          <p className="mt-1 text-[11px] text-black/50">
            Ces écrans existent, sont atteignables depuis le sommaire de leur section, mais
            n&apos;affichent qu&apos;un gabarit. Ils sont présentés « en préparation » au visiteur
            tant que le contenu n&apos;est pas livré.
          </p>
          {(sectionsVides.data ?? []).length === 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
              <ShieldCheck size={16} /> Aucun écran vide annoncé au visiteur.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-black/5">
              {(sectionsVides.data ?? []).map((sv) => (
                <li key={sv.prefixe} className="py-2">
                  <p className="text-sm font-bold text-[#111]">
                    {sv.titre}{" "}
                    <span className="font-normal text-black/50">
                      — {sv.vides} vide(s) sur {sv.ecrans} écran(s)
                    </span>
                  </p>
                  <p className="text-[11px] text-black/50">{sv.exemples.join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-black/5 bg-white p-4">
          <h2 className="flex items-center gap-2 text-sm font-black text-[#111]">
            <AlertTriangle size={16} className="text-amber-600" />
            Propositions à décider
          </h2>
          <p className="mt-1 text-[11px] text-black/50">
            Classées par le nombre d&apos;endroits concernés. Aucune n&apos;est appliquée sans
            décision.
          </p>
          <ul className="mt-3 divide-y divide-black/5">
            {(propositions.data ?? []).map((p) => (
              <li key={p.cle} className="py-2">
                <p className="text-sm font-bold text-[#111]">
                  {p.sujet}{" "}
                  <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-bold uppercase text-black/60">
                    {LIBELLE_TRAITEMENT[p.traitement] ?? p.traitement}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-black/60">{p.action}</p>
              </li>
            ))}
          </ul>
          {(propositions.data ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-black/50">Aucune proposition en attente.</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
