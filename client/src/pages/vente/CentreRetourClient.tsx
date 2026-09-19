import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Star, Send } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   SATISFACTION ACHAT (/vente/retour-client/:id)
   Données réelles : trpc.reviewsV2.getCriteria / create (server/routers/
   reviewsV2.ts, moteur d'avis multi-critères déjà complet — modération,
   anti-doublon, anti-auto-évaluation, badges, scores de confiance). Les 4
   critères ne sont jamais fabriqués : ils viennent des modèles réellement
   semés pour l'univers "vente" (server/seed.ts), différents selon que le
   vendeur est un particulier ou un professionnel. Réservé aux acheteurs
   connectés (porte d'accès générale U, pas la porte VO professionnelle —
   cet écran ne concerne pas un vendeur).
   ══════════════════════════════════════════════════════════════════════════ */

export default function CentreRetourClient() {
  const { id } = useParams();
  const annonceId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: annonce, isLoading } = trpc.annonces.get.useQuery({ id: annonceId }, { enabled: Number.isFinite(annonceId) });
  const targetType = annonce?.vendeurType === "particulier" ? "particulier" : "user";
  const { data: criteresBruts } = trpc.reviewsV2.getCriteria.useQuery({ univers: "vente", targetType }, { enabled: !!annonce });
  // Dédoublonne par clé : le semis (seed.ts) peut réinsérer les mêmes modèles
  // sans contrainte d'unicité côté base — jamais montrer deux fois le même critère.
  const criteres = Array.from(new Map((criteresBruts ?? []).map((c) => [c.criteriaKey, c])).values());

  const [notes, setNotes] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");

  const create = trpc.reviewsV2.create.useMutation({
    onSuccess: () => navigate(`/vehicule/${annonceId}?avis=1`),
  });

  if (!Number.isFinite(annonceId) || (!isLoading && !annonce)) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] p-4">
        <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">Véhicule introuvable — revenez depuis sa fiche.</p>
      </div>
    );
  }

  const isOwner = user && annonce && user.id === annonce.ownerId;
  const complet = criteres.length > 0 && criteres.every((c) => notes[c.criteriaKey]);
  const ratingGlobal = complet ? Math.round(criteres.reduce((s, c) => s + (notes[c.criteriaKey] || 0), 0) / criteres.length) : 0;

  const envoyer = () => {
    if (!complet || !annonce) return;
    create.mutate({
      targetType,
      targetId: annonce.ownerId,
      univers: "vente",
      ratingGlobal,
      criterias: notes,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to={`/vehicule/${annonceId}`} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Star size={20} className="text-[#D4AF37]" /> Satisfaction achat</h1>
        {annonce && <p className="mt-1 text-sm text-white/60">{annonce.titre || `${annonce.marque ?? ""} ${annonce.modele ?? ""}`.trim()}</p>}
      </div>

      {!user ? (
        <div className="px-4 mt-6">
          <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">Connectez-vous pour laisser votre avis.</p>
          <Link to="/connexion" className="mt-3 block w-full rounded-xl bg-[#D4AF37] py-3 text-center text-sm font-bold text-white">Se connecter</Link>
        </div>
      ) : isOwner ? (
        <p className="mx-4 mt-6 rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">Vous êtes le vendeur de cette annonce.</p>
      ) : (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-4">
          {criteres.map((c) => (
            <div key={c.criteriaKey}>
              <p className="text-sm font-bold text-[#111] mb-1">{c.criteriaLabel}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setNotes({ ...notes, [c.criteriaKey]: n })}>
                    <Star size={22} className="transition" fill={(notes[c.criteriaKey] || 0) >= n ? "#D4AF37" : "none"} color={(notes[c.criteriaKey] || 0) >= n ? "#D4AF37" : "#E5E7EB"} />
                  </button>
                ))}
              </div>
            </div>
          ))}
          <textarea
            placeholder="Commentaire (optionnel)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm h-20"
          />
          {create.error && <p className="text-xs text-red-600">{create.error.message}</p>}
          <button
            onClick={envoyer}
            disabled={!complet || create.isPending}
            className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            <Send size={14} /> {create.isPending ? "Envoi…" : "Envoyer mon avis"}
          </button>
        </div>
      )}
    </div>
  );
}
