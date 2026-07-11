# Smart Engine — Hardening (renforcement) 100% MKA.P-MS

**Branche** : `smart-engine-hardening`
**Auteur** : E1 (Emergent)
**Nature** : additive uniquement — aucun fichier existant modifié — aucune dépendance externe.

## 🎯 Objectif

Renforcer le **Système Intelligent MKA.P-MS** sans jamais dépendre d'un service tiers
(pas d'OpenAI, pas de Claude, pas de Gemini). Chaque amélioration est écrite en pur
TypeScript, propriété intégrale MKA.P-MS.

Cinq points de l'audit sont couverts : **P1** (hash perceptuel photos),
**P4** (score de risque anti-fraude), **P7** (rétention automatique),
**P8** (seuils de confirmation dynamiques), **P9** (rate-limiting du chat PDG).

## 📁 Fichiers ajoutés (aucun fichier existant modifié)

```
server/smart-engine/services/
├── photo-perceptual.ts         ← P1 : dHash 8×8 (robuste à la recompression)
├── risk-scoring.ts             ← P4 : normalisation email/tel + risk score
├── retention.ts                ← P7 : purge configurable des logs
├── domain-thresholds.ts        ← P8 : seuils de confirmation par domaine
├── rate-limiter.ts             ← P9 : limiteur en mémoire pour le chat PDG
└── __tests__/
    ├── hardening.test.ts       ← tests unitaires (100% verts)
    └── perceptual.test.ts      ← test d'intégration sharp + dHash
```

## ✅ Tests passés

```bash
npx tsx server/smart-engine/services/__tests__/hardening.test.ts
# ✅ Tous les tests Smart Engine hardening passent.

npx tsx server/smart-engine/services/__tests__/perceptual.test.ts
# ✅ dHash perceptuel OK — recompression: d=0, photo différente: d=31
```

- Photo recompressée en JPEG qualité 30 → **distance 0** (parfaitement détectée)
- Photo totalement différente → **distance 31** (clairement distinguée)

## 🔌 Intégration (facultative — chaque point est indépendant)

Ces services sont écrits pour être plug-and-play. Rien n'oblige à les brancher tous
en même temps. Les patchs ci-dessous sont **minimaux** (2 à 4 lignes chacun) et ne
suppriment jamais rien.

### 1. Photo perceptuelle (P1)

Dans `services/photo-analysis.ts`, à côté de l'appel existant `indexPhoto` /
`findDuplicatePhotos`, ajouter en parallèle un appel perceptuel :

```ts
// server/smart-engine/services/photo-analysis.ts (près de indexAllPhotos)
import { indexPerceptualPhoto, findPerceptualMatches } from "./photo-perceptual.js";

// Ajouter, sans rien retirer :
export async function indexAndCheckPerceptual(annonceId: number, photos: string[]) {
  const matches: any[] = [];
  for (let i = 0; i < photos.length; i++) {
    const m = await findPerceptualMatches(annonceId, photos[i]);
    matches.push(...m);
    await indexPerceptualPhoto(annonceId, i, photos[i]);
  }
  return matches;
}
```

Puis exposer une route additive dans `router.ts` (procédure `checkPhotoPerceptualDuplicates`),
appelée depuis le workflow de dépôt d'annonce **en plus** de l'existant. L'ancien SHA-256
reste actif : les deux couches se complètent.

### 2. Risk scoring (P4)

Dans `services/fraud-detection.ts`, importer et appeler :

```ts
import {
  normalizeEmail, normalizePhone, computeDeviceFingerprint,
  computeRiskScore, isDisposableEmail,
} from "./risk-scoring.js";

// Avant l'insertion dans smartSuspectAccounts, calculer :
const { score, severity, reasons } = computeRiskScore({
  duplicateNormalizedEmail: /* ta requête existante avec normalizeEmail(email) */,
  duplicateNormalizedPhone: /* ta requête avec normalizePhone(tel) */,
  disposableEmailDomain: isDisposableEmail(email),
  freshAccount: /* createdAt > now-24h */,
  // …
});
// Utiliser `severity` pour remplir le champ existant `smartSuspectAccounts.severity`.
```

### 3. Rétention (P7)

Ajouter une mutation `directionProcedure` dans `router.ts` :

```ts
import { runRetention, retentionCounters, DEFAULT_RETENTION } from "./services/retention.js";

retentionCounters: directionProcedure.query(() => retentionCounters()),
retentionRun: directionProcedure
  .input(z.object({
    searchLogsDays: z.number().int().min(30).optional(),
    activityLogDays: z.number().int().min(30).optional(),
    photoFingerprintsDays: z.number().int().min(30).optional(),
  }).optional())
  .mutation(({ input }) => runRetention(input ?? {})),
```

Et un onglet dans `ControlCenter.tsx` (facultatif — bouton "Purger anciens logs").

### 4. Seuils dynamiques (P8)

Dans `services/knowledge-base.ts`, remplacer **la seule ligne** qui utilise le seuil :

```ts
// AVANT :
const promote = existing.status === "proposed" && newCount >= KB_CONFIRM_THRESHOLD;

// APRÈS (2 lignes, la constante d'origine reste pour compatibilité) :
import { getConfirmThreshold } from "./domain-thresholds.js";
const threshold = getConfirmThreshold(existing.domain);
const promote = existing.status === "proposed" && newCount >= threshold;
```

### 5. Rate limiting chat PDG (P9)

Dans `router.ts`, procédure `teach` :

```ts
import { assertRate, sanitizeTeachMessage } from "./services/rate-limiter.js";

teach: directionProcedure
  .input(z.object({ message: z.string() }))
  .mutation(async ({ input, ctx }) => {
    assertRate(`teach:${ctx.user.id}`, { max: 30, windowMs: 60_000 });
    const msg = sanitizeTeachMessage(input.message);
    if (!msg) return { ok: false };
    // …reste inchangé
  }),
```

## 🔒 Garanties

- ✅ **Aucun fichier existant modifié** — les autres agents peuvent continuer sans conflit
- ✅ **Zéro nouvelle dépendance npm** (utilise `sharp` et `crypto` déjà présents)
- ✅ **100% propriété MKA.P-MS** — pas d'API externe, pas de LLM tiers
- ✅ **Best-effort** — chaque fonction retourne `null` / ignore silencieusement en cas d'erreur
- ✅ **Tests unitaires verts** — logique pure vérifiable sans base de données
- ✅ **Le PDG reste maître** — le service `retention.ts` est le seul qui supprime, et
  uniquement sur action explicite via mutation `directionProcedure`

## 📊 Impact attendu

| Point | Avant | Après |
|---|---|---|
| Détection photos identiques | Cassée en pratique (SHA-256 sur JPEG recompressé) | **Distance 0** sur recompression forte |
| Détection compte dupliqué | Email/tel exact | + normalisation gmail, +alias, E.164, device fingerprint |
| Croissance table logs | Illimitée | Purge contrôlée par le PDG |
| Confirmation KB | Seuil unique = 3 | Seuil adapté (marque : 2 · mot-clé : 8) |
| Spam chat PDG | Non-limité | 30 messages / minute + longueur ≤ 4000 |

## 🚀 Prochaines étapes

1. **Toi** : review de la branche `smart-engine-hardening`
2. **Toi** : merger dans `main` (ou brancher progressivement selon la section "Intégration" ci-dessus)
3. **Autres agents** : les nouveaux services sont importables via `./services/*.js` — aucune coordination requise
