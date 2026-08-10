import { useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ChevronLeft, MessageSquare, Sparkles, Star } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

/**
 * Espace réponse du professionnel (point 50).
 *
 * La proposition du Système Intelligent est affichée comme un brouillon
 * identifié : elle n'est jamais publiée sans que le professionnel clique
 * « Publier ma réponse ». Le texte reste modifiable avant publication.
 */
const LIBELLES_CIBLE: Record<string, string> = {
  garage: "Garage",
  boutique_pieces: "Boutique de pièces",
  transporteur: "Transport / Livraison",
  depanneur: "Dépannage",
  user: "Mon compte professionnel",
};

function Etoiles({ note }: { note: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={n <= note ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-300"}
        />
      ))}
    </span>
  );
}

export default function AvisPro() {
  const { user } = useAuth();
  const donnees = trpc.reputationEngine.avisDeMesCibles.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();
  const repondre = trpc.reviewsV2.respond.useMutation({
    onSuccess: () => {
      setBrouillons({});
      setSuggestionDe(null);
      utils.reputationEngine.avisDeMesCibles.invalidate();
    },
  });

  const [brouillons, setBrouillons] = useState<Record<number, string>>({});
  const [suggestionDe, setSuggestionDe] = useState<number | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const suggestion = trpc.reputationEngine.suggestionReponse.useQuery(
    { reviewId: suggestionDe ?? 0 },
    { enabled: suggestionDe !== null },
  );

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-black text-[#111]">Avis reçus</h1>
        <p className="mb-6 text-gray-600">Connectez-vous avec votre compte professionnel.</p>
        <Link to="/connexion" className="rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white">
          Se connecter
        </Link>
      </div>
    );
  }

  const avis = donnees.data?.avis ?? [];
  const cibles = donnees.data?.cibles ?? [];
  const sansReponse = avis.filter((a) => !a.responseText).length;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 py-5">
        <Link to="/compte" className="mb-2 inline-flex items-center gap-1 text-xs text-white/70">
          <ChevronLeft size={14} /> Mon compte
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-black text-white">
          <MessageSquare size={20} className="text-[#D4AF37]" /> Avis reçus
        </h1>
        <p className="mt-1 text-sm text-white/70">
          {avis.length} avis sur {cibles.length} fiche(s) — {sansReponse} sans réponse.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-5">
        {donnees.isLoading && <p className="text-sm text-gray-600">Chargement…</p>}

        {!donnees.isLoading && avis.length === 0 && (
          <p className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-sm text-gray-600">
            Aucun avis ne concerne encore vos fiches professionnelles.
          </p>
        )}

        {erreur && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erreur}</p>
        )}

        <div className="grid gap-4">
          {avis.map((a) => {
            const brouillon = brouillons[a.id] ?? "";
            const propositionAffichee =
              suggestionDe === a.id && suggestion.data?.reviewId === a.id ? suggestion.data : null;

            return (
              <div key={a.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#111] px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {LIBELLES_CIBLE[a.targetType] ?? a.targetType}
                  </span>
                  <Etoiles note={a.ratingGlobal} />
                  <span className="text-[11px] font-bold text-[#111]">{a.ratingGlobal}/5</span>
                  {a.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                      <BadgeCheck size={11} /> Expérience vérifiée
                    </span>
                  )}
                  {a.status !== "publie" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      {a.status === "en_moderation" ? "En vérification" : a.status}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-500">
                    {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>

                {a.comment && <p className="mb-2 text-sm text-[#111]">« {a.comment} »</p>}
                {a.prosText && <p className="text-xs text-green-700">+ {a.prosText}</p>}
                {a.consText && <p className="text-xs text-red-700">− {a.consText}</p>}

                {a.responseText ? (
                  <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] p-3">
                    <p className="mb-1 text-[11px] font-bold uppercase text-gray-500">
                      Votre réponse publiée
                      {a.responseAt ? ` le ${new Date(a.responseAt).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                    <p className="text-sm text-[#111]">{a.responseText}</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    {propositionAffichee && (
                      <div className="mb-2 rounded-xl border border-[#D4AF37]/50 bg-[#FFFBEB] p-3">
                        <p className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-[#8A6D1F]">
                          <Sparkles size={12} /> Proposition du Système Intelligent — à vérifier avant
                          publication
                        </p>
                        <p className="mb-2 text-sm text-[#111]">{propositionAffichee.suggestion}</p>
                        <ul className="mb-2 list-inside list-disc text-[11px] text-gray-600">
                          {propositionAffichee.bases.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          onClick={() =>
                            setBrouillons((p) => ({ ...p, [a.id]: propositionAffichee.suggestion }))
                          }
                          className="rounded-lg border border-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#8A6D1F]"
                        >
                          Reprendre ce texte pour le modifier
                        </button>
                      </div>
                    )}

                    <textarea
                      value={brouillon}
                      onChange={(e) => setBrouillons((p) => ({ ...p, [a.id]: e.target.value }))}
                      rows={3}
                      maxLength={1000}
                      placeholder="Votre réponse publique…"
                      className="w-full rounded-xl border border-[#E5E7EB] p-3 text-sm"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setErreur(null);
                          setSuggestionDe(a.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-[#111] px-3 py-2 text-xs font-bold text-[#111]"
                      >
                        <Sparkles size={13} />
                        {suggestionDe === a.id && suggestion.isLoading
                          ? "Préparation…"
                          : "Proposer une réponse"}
                      </button>
                      <button
                        type="button"
                        disabled={brouillon.trim().length < 3 || repondre.isPending}
                        onClick={() => {
                          setErreur(null);
                          repondre.mutate(
                            { reviewId: a.id, responseText: brouillon.trim() },
                            { onError: (e) => setErreur(e.message) },
                          );
                        }}
                        className="rounded-xl bg-[#111] px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                      >
                        Publier ma réponse
                      </button>
                    </div>
                  </div>
                )}

                {a.officialResponseText && (
                  <div className="mt-3 rounded-xl border border-[#111]/20 bg-[#111]/[0.04] p-3">
                    <p className="mb-1 text-[11px] font-bold uppercase text-[#111]">
                      Réponse officielle MKA.P-MS
                    </p>
                    <p className="text-sm text-[#111]">{a.officialResponseText}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
