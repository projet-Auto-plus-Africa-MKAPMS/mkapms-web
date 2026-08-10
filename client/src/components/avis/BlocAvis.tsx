import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, MessageSquare, Star } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

/**
 * Bloc « Voir les avis / Déposer un avis » (point 47).
 *
 * Réutilisable par tous les univers : la cible est décrite par son couple
 * (targetType, targetId) et son univers, exactement comme le moteur d'avis.
 * Le bloc reste sur la charte MKA.P-MS (noir / or) pour ne pas dénaturer la
 * page de l'univers qui l'accueille.
 *
 * Rien n'est inventé : sans avis publié, le bloc le dit au lieu d'afficher
 * une note à zéro qui ressemblerait à une mauvaise réputation.
 */
export interface BlocAvisProps {
  targetType: string;
  targetId: number;
  univers: string;
  /** Nom affiché de la cible — utilisé dans les libellés. */
  nomCible?: string;
  /** Restreint la lecture à un pays (réputation par pays activé). */
  countryCode?: string | null;
  /** Titre de section, si l'univers utilise un autre libellé. */
  titre?: string;
}

const NOTE_LABELS = ["", "Très insatisfait", "Insatisfait", "Correct", "Satisfait", "Excellent"];

/** Motifs acceptés par le moteur — un signalement sans motif n'est pas exploitable. */
const MOTIFS_SIGNALEMENT = [
  ["faux_avis", "Faux avis"],
  ["insulte", "Insulte"],
  ["spam", "Spam"],
  ["doublon", "Doublon"],
  ["conflit_interet", "Conflit d'intérêt"],
  ["hors_sujet", "Hors sujet"],
  ["contenu_inapproprie", "Contenu inapproprié"],
] as const;

type MotifSignalement = (typeof MOTIFS_SIGNALEMENT)[number][0];

function Etoiles({ note, taille = 14 }: { note: number; taille?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={taille}
          className={i <= Math.round(note) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-300"}
        />
      ))}
    </span>
  );
}

export default function BlocAvis({
  targetType,
  targetId,
  univers,
  nomCible,
  countryCode,
  titre = "Avis et réputation",
}: BlocAvisProps) {
  const { user } = useAuth();
  const [tri, setTri] = useState<"recent" | "best" | "worst" | "helpful">("recent");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [note, setNote] = useState(0);
  const [criteres, setCriteres] = useState<Record<string, number>>({});
  const [commentaire, setCommentaire] = useState("");
  const [positif, setPositif] = useState("");
  const [negatif, setNegatif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);
  const [signalementOuvert, setSignalementOuvert] = useState<number | null>(null);

  const cible = { targetType, targetId };

  const reputation = trpc.reputationEngine.reputation.useQuery(
    { ...cible, univers, countryCode: countryCode ?? undefined },
    { enabled: targetId > 0 },
  );
  const avis = trpc.reviewsV2.list.useQuery(
    { ...cible, univers, sortBy: tri, limit: 20 },
    { enabled: targetId > 0 },
  );
  const criteresUnivers = trpc.reviewsV2.getCriteria.useQuery(
    { univers, targetType },
    { enabled: formulaireOuvert },
  );
  const mesDemandes = trpc.reputationEngine.mesDemandes.useQuery(undefined, { enabled: !!user });

  const demandeOuverte = useMemo(
    () =>
      (mesDemandes.data ?? []).find(
        (d) => d.targetType === targetType && d.targetId === targetId,
      ) ?? null,
    [mesDemandes.data, targetType, targetId],
  );

  const creer = trpc.reviewsV2.create.useMutation({
    onSuccess: () => {
      setEnvoye(true);
      setFormulaireOuvert(false);
      setErreur(null);
      avis.refetch();
      reputation.refetch();
      mesDemandes.refetch();
    },
    onError: (e) => setErreur(e.message),
  });

  const utile = trpc.reviewsV2.markHelpful.useMutation({ onSuccess: () => avis.refetch() });
  const signaler = trpc.reviewsV2.report.useMutation({
    onSuccess: () => setSignalementOuvert(null),
  });

  const rep = reputation.data;
  const total = rep?.totalReviews ?? 0;
  const moyenne = rep?.averageRating ?? null;

  const soumettre = () => {
    if (note < 1) {
      setErreur("Choisissez une note de 1 à 5.");
      return;
    }
    setErreur(null);
    creer.mutate({
      targetType,
      targetId,
      univers,
      ratingGlobal: note,
      criterias: Object.keys(criteres).length > 0 ? criteres : undefined,
      comment: commentaire.trim() || undefined,
      prosText: positif.trim() || undefined,
      consText: negatif.trim() || undefined,
      transactionType: demandeOuverte?.transactionType ?? undefined,
      transactionId: demandeOuverte?.transactionId ?? undefined,
      requestId: demandeOuverte?.id ?? undefined,
      countryCode: countryCode ?? undefined,
    });
  };

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4" id="avis">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-black text-[#111]">
          <MessageSquare size={16} className="text-[#D4AF37]" /> {titre}
        </h2>
        {user ? (
          <button
            type="button"
            onClick={() => setFormulaireOuvert((v) => !v)}
            className="rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white"
          >
            {formulaireOuvert ? "Fermer" : "Déposer un avis"}
          </button>
        ) : (
          <Link
            to="/connexion"
            className="rounded-xl border border-[#111] px-4 py-2 text-sm font-bold text-[#111]"
          >
            Se connecter pour déposer un avis
          </Link>
        )}
      </div>

      {/* Résumé */}
      {total > 0 && moyenne !== null ? (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl bg-[#F5F3EF] p-3">
          <div>
            <p className="text-2xl font-black text-[#111]">{moyenne.toFixed(1)}<span className="text-sm font-bold text-gray-500">/5</span></p>
            <Etoiles note={moyenne} />
          </div>
          <div className="text-xs text-gray-600">
            <p>{total} avis publié{total > 1 ? "s" : ""}</p>
            <p>
              {rep?.verifiedCount ?? 0} expérience{(rep?.verifiedCount ?? 0) > 1 ? "s" : ""} vérifiée
              {(rep?.verifiedCount ?? 0) > 1 ? "s" : ""}
            </p>
            <p>{rep?.responseRatePct ?? 0} % d'avis avec réponse du professionnel</p>
          </div>
          <div className="ml-auto grid gap-0.5 text-[11px] text-gray-600">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="flex items-center gap-1">
                <span className="w-3 text-right">{n}</span>
                <Star size={9} className="fill-[#D4AF37] text-[#D4AF37]" />
                <span className="h-1.5 w-24 overflow-hidden rounded bg-gray-200">
                  <span
                    className="block h-full bg-[#D4AF37]"
                    style={{ width: `${total > 0 ? ((rep?.distribution?.[String(n)] ?? 0) / total) * 100 : 0}%` }}
                  />
                </span>
                <span>{rep?.distribution?.[String(n)] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mb-4 rounded-xl bg-[#F5F3EF] p-3 text-sm text-gray-600">
          {reputation.isLoading
            ? "Chargement de la réputation…"
            : rep?.raison ?? "Aucun avis publié pour l'instant."}
        </p>
      )}

      {/* Demande d'avis ouverte après une prestation réellement terminée */}
      {demandeOuverte && !envoye && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#D4AF37]/40 bg-[#FFFBEB] p-3 text-sm text-[#111]">
          <BadgeCheck size={16} className="mt-0.5 shrink-0 text-[#D4AF37]" />
          <p>
            Votre prestation {nomCible ? `chez ${nomCible} ` : ""}est terminée : votre avis portera la
            mention <strong>« ✓ Expérience vérifiée »</strong>.
          </p>
        </div>
      )}

      {envoye && (
        <p className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Merci, votre avis est enregistré. S'il contient des termes à vérifier, il passe d'abord en
          vérification avant publication.
        </p>
      )}

      {/* Formulaire */}
      {formulaireOuvert && user && (
        <div className="mb-4 rounded-xl border border-[#E5E7EB] p-3">
          <p className="mb-2 text-sm font-bold text-[#111]">Votre note</p>
          <div className="mb-3 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNote(n)}
                aria-label={`${n} sur 5`}
                className="p-0.5"
              >
                <Star
                  size={26}
                  className={n <= note ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-300"}
                />
              </button>
            ))}
            {note > 0 && <span className="text-xs font-bold text-gray-600">{NOTE_LABELS[note]}</span>}
          </div>

          {(criteresUnivers.data ?? []).length > 0 && (
            <div className="mb-3 grid gap-2">
              <p className="text-sm font-bold text-[#111]">Détail par critère</p>
              {(criteresUnivers.data ?? []).map((c) => (
                <div key={c.criteriaKey} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-700">{c.criteriaLabel}</span>
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-label={`${c.criteriaLabel} : ${n} sur 5`}
                        onClick={() => setCriteres((prev) => ({ ...prev, [c.criteriaKey]: n }))}
                      >
                        <Star
                          size={14}
                          className={
                            n <= (criteres[c.criteriaKey] ?? 0)
                              ? "fill-[#D4AF37] text-[#D4AF37]"
                              : "text-gray-300"
                          }
                        />
                      </button>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Votre expérience (facultatif)"
            className="mb-2 w-full rounded-xl border border-[#E5E7EB] p-2 text-sm"
          />
          <div className="mb-2 grid gap-2 sm:grid-cols-2">
            <input
              value={positif}
              onChange={(e) => setPositif(e.target.value)}
              maxLength={500}
              placeholder="Points positifs"
              className="w-full rounded-xl border border-[#E5E7EB] p-2 text-sm"
            />
            <input
              value={negatif}
              onChange={(e) => setNegatif(e.target.value)}
              maxLength={500}
              placeholder="Points à améliorer"
              className="w-full rounded-xl border border-[#E5E7EB] p-2 text-sm"
            />
          </div>

          {erreur && <p className="mb-2 text-sm text-red-600">{erreur}</p>}

          <button
            type="button"
            onClick={soumettre}
            disabled={creer.isPending}
            className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] disabled:opacity-60"
          >
            {creer.isPending ? "Envoi…" : "Publier mon avis"}
          </button>
        </div>
      )}

      {/* Liste */}
      {(avis.data ?? []).length > 0 && (
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className="text-gray-500">Trier :</span>
          {(
            [
              ["recent", "Plus récents"],
              ["best", "Meilleures notes"],
              ["worst", "Notes les plus basses"],
              ["helpful", "Les plus utiles"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setTri(v)}
              className={`rounded-full px-2.5 py-1 ${
                tri === v ? "bg-[#111] text-white" : "border border-[#E5E7EB] text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {(avis.data ?? []).map((a) => (
          <article key={a.id} className="rounded-xl border border-[#E5E7EB] p-3">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Etoiles note={a.ratingGlobal} />
              {a.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                  <BadgeCheck size={11} /> Expérience vérifiée
                </span>
              )}
              <span className="text-[11px] text-gray-500">
                {new Date(a.createdAt).toLocaleDateString("fr-FR")}
              </span>
              <span className="ml-auto text-[11px] font-medium text-gray-600">
                {a.authorDisplayMode === "anonyme"
                  ? "Client MKA.P-MS"
                  : a.authorDisplayMode === "initiales"
                    ? (a.authorName ?? "?").slice(0, 1) + "."
                    : a.authorFirstName ?? a.authorName ?? "Client"}
              </span>
            </div>

            {a.comment && <p className="text-sm text-gray-800">{a.comment}</p>}
            {a.prosText && <p className="mt-1 text-xs text-green-700">+ {a.prosText}</p>}
            {a.consText && <p className="mt-0.5 text-xs text-orange-700">− {a.consText}</p>}

            {a.responseText && (
              <div className="mt-2 rounded-lg bg-[#F5F3EF] p-2">
                <p className="text-[11px] font-bold text-[#111]">
                  Réponse du professionnel
                  {a.responseAt ? ` — ${new Date(a.responseAt).toLocaleDateString("fr-FR")}` : ""}
                </p>
                <p className="text-xs text-gray-700">{a.responseText}</p>
              </div>
            )}
            {a.officialResponseText && (
              <div className="mt-2 rounded-lg border border-[#D4AF37]/40 bg-[#FFFBEB] p-2">
                <p className="text-[11px] font-bold text-[#111]">Réponse MKA.P-MS</p>
                <p className="text-xs text-gray-700">{a.officialResponseText}</p>
              </div>
            )}

            <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
              <button
                type="button"
                disabled={!user || utile.isPending}
                onClick={() => utile.mutate({ reviewId: a.id })}
                className="hover:text-[#111] disabled:opacity-50"
              >
                Utile ({a.helpfulCount})
              </button>
              {signalementOuvert === a.id ? (
                <select
                  aria-label="Motif du signalement"
                  defaultValue=""
                  disabled={signaler.isPending}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    signaler.mutate({ reviewId: a.id, reason: e.target.value as MotifSignalement });
                  }}
                  className="rounded border border-[#E5E7EB] px-1 py-0.5"
                >
                  <option value="">Motif du signalement…</option>
                  {MOTIFS_SIGNALEMENT.map(([valeur, label]) => (
                    <option key={valeur} value={valeur}>{label}</option>
                  ))}
                </select>
              ) : (
                <button
                  type="button"
                  disabled={!user}
                  onClick={() => setSignalementOuvert(a.id)}
                  className="hover:text-[#111] disabled:opacity-50"
                >
                  Signaler
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
