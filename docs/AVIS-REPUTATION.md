# Reviews & Reputation Engine — règle finale (point 58)

Un avis n'est jamais « des étoiles + un texte ». Il appartient à une chaîne
complète, et chaque maillon est implémenté dans le dépôt :

```
Compte → transaction/service → avis → vérification → professionnel → réponse
      → réputation → pays → SEO/GEO → Audience → recherche → analytics
      → système intelligent
```

| Maillon | Où c'est implémenté | Ce qui est garanti |
| --- | --- | --- |
| Compte | `server/modules/reviews.ts` (`reviewsV2.authorId`) | un avis a toujours un auteur identifié |
| Transaction / service | `server/reputation-engine/service.ts` → `requestReviewAfterCompletion()` | la demande d'avis part après une prestation réellement terminée |
| Avis | `reviewsV2` | note, commentaire, univers, pays, cible, date |
| Vérification | `verifiedExperience()` | « Expérience vérifiée » exige une `reviewRequest` créée par le serveur — jamais un champ envoyé par le client |
| Faux avis | `server/reputation-engine/fraud.ts` | signaux tracés, décision humaine ; aucune suppression automatique d'un avis parce qu'il est négatif |
| Professionnel | `server/reputation-engine/ownership.ts` | un professionnel ne voit et ne répond que sur ses propres fiches |
| Réponse | `server/reputation-engine/responses.ts` | la suggestion du Smart Engine reste un brouillon : publication explicite |
| Réputation | `server/reputation-engine/ranking.ts` | note visible = vraie moyenne ; note de classement lissée vers la moyenne plateforme (`CONFIDENCE_VOLUME = 20`) |
| Pays | `reviewsV2.countryCode`, `center.ts` → `byCountry()` | réputation lisible pays par pays |
| SEO | `server/reputation-engine/seo.ts`, `server/seo.ts` | `AggregateRating` seulement si des avis existent ; contenu visible == données structurées |
| GEO / moteurs IA | `server/reputation-engine/public-pages.ts`, `/avis/:univers`, `sitemap-avis.xml` | pages publiques à données réelles, aucune promesse de sélection par Google ou une IA |
| Google Business Profile | `server/connectors/google-business/*` | relevés séparés ; avis MKA.P-MS ≠ avis Google, aucune moyenne commune |
| Audience | `server/reputation-engine/audience.ts` | recommandation de mise en avant OU mise en garde ; jamais de promotion automatique |
| Recherche | `server/search-os/index.ts`, `server/proximity-engine/service.ts` | la réputation est un signal parmi pertinence, distance, disponibilité, volume, avis vérifiés |
| Analytics / tendances | `server/reputation-engine/trends.ts` | pas de tendance en dessous de 3 avis sur la période ; chaque constat porte ses chiffres |
| Système intelligent | `server/smart-engine/services/review-analysis.ts`, `alert-engine.ts` | alertes dédupliquées par signature, explication + preuve, action humaine requise |

## Supervision

Le moteur est déclaré dans le registre central :

- catalogue : `server/engine-registry/catalog.ts` → `avis_reputation`
  (dépendances `core`, `country`, `notification`) ;
- connecteur séparé : `connecteur_google_business` (dépend de `avis_reputation`) ;
- sonde de santé : `server/engine-registry/probes.ts` → tables `reviews_v2`,
  `review_requests`, `review_aggregates` ;
- santé détaillée : `reputationEngineHealth()`, exposée à la direction.

## Ce que le module refuse de faire

- publier une note quand il n'y a aucun avis (`averageRating: null`, jamais `0`) ;
- présenter une moyenne mélangeant plusieurs professionnels comme la note d'un
  professionnel ;
- additionner les avis MKA.P-MS et les avis Google ;
- déclarer le connecteur Google actif sans un relevé réellement obtenu de
  l'API ;
- supprimer, masquer ou refuser un avis sans motif écrit et traçable ;
- publier une réponse ou une mise en avant sans décision humaine.
