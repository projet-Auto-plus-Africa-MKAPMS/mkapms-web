# Country + Language Operating Systems (Country OS · Language OS)

**Statut** : Sprint 3 — Complets ✅ · **Version** : 0.3.0 (chacun)
**Maturité** : `sprint_3_automation` (règle MOS #14)
**Livraison** : moteurs A → Z, additifs purs (règle MOS #15).

Deux moteurs jumeaux, livrés ensemble parce qu'ils partagent la même
mécanique doctrinale (registre + config + Health/Feed/Dashboard) et se
complètent (chaque pays référence ses langues par défaut).

---

## 🌍 Country OS — Registre mondial des pays

**Consolide** `shared/currency.ts` (map country→currency) dans une table
interrogeable et enrichie. Le fichier `shared/currency.ts` reste actif
pour la conversion runtime — aucune suppression.

**Table `country_countries`** — 20 pays seedés (FR, BE, LU, CH, DE, ES, IT, PT, GB, CA, US, CI, SN, CM, ML, BF, MA, DZ, TN, AE). Ajouter un pays = 1 seule ligne `INSERT` (aucune modification de code métier).

**Colonnes disponibles** : `code`, `code3`, `nameFr/nameEn`, `defaultLanguage`, `availableLanguages[]`, `defaultCurrency`, `tvaRate`, `phonePrefix`, `timezone`, `paymentMethods[]`, `requiredDocs[]`, `universesEnabled[]`, `regulations{}`, `active`.

**Endpoints tRPC (`country.*` — 9 procédures)**
```
country.meta / healthStatus / controlCenterFeed / dashboard
country.list ({activeOnly})     → tous les pays
country.get  ({code: 'FR'})     → un pays complet
country.currencies              → référentiel devises + taux
country.upsert (admin)          → ajout/modification par pure config
country.disable ({code})        → soft-delete (jamais supprimé — doctrine #8)
```

**Table `country_currencies`** — 11 devises seedées (EUR, USD, GBP, CAD, XOF, XAF, MAD, DZD, TND, GNF, AED) avec taux, symbole, locale.

---

## 🗣️ Language OS — Registre multilingue + traductions

**Fondations complètes** — aucune i18n structurée n'existait avant. Ce moteur est utilisable immédiatement pour interface, annonces, messagerie, notifications, documents (factures/contrats/devis), SEO, recherche, IA.

**Table `language_languages`** — 9 langues seedées (fr, en, es, it, de, pt, nl, ar RTL, zh).

**Table `language_translations`** — namespace + clé + langue → valeur. Fallback automatique vers `fr` si une clé manque. Contrainte UNIQUE `(namespace,key,language)`.

**Table `language_user_preferences`** — préférence par utilisateur (langue préférée, niveau de traduction auto/human_only/mixed, auto-traduction messagerie/annonces).

**Endpoints tRPC (`language.*` — 12 procédures)**
```
language.meta / healthStatus / controlCenterFeed / dashboard
language.list ({activeOnly})              → langues actives
language.bundle ({namespace, language})   → toutes les clés d'un namespace (avec fallback fr)
language.t ({namespace, key, language})   → traduction ponctuelle
language.detect ({userPref, acceptLanguage, countryLanguages})
  → langue à utiliser : préférence explicite → header Accept-Language → pays → 'fr'
language.upsert (admin)                    → une trad
language.bulkUpsert (admin)                → jusqu'à 1000 trads d'un coup
language.preferences.me / update           → préférences utilisateur
```

---

## 🗄️ Migration `drizzle/0038_country_and_language_os.sql`

100 % additive et idempotente. Aucune table existante n'est modifiée. Toutes les tables préfixées `country_*` et `language_*`. Seed initial de 20 pays, 11 devises, 9 langues.

## 📅 Sprints (règle MOS #14)

- **Sprint 3** ✅ (livré ensemble) — Schémas, seed initial, 21 procédures, Health/Feed/Dashboard, préférences utilisateur, détection auto langue
- **Sprint 4** — Intelligence : auto-traduction via LLM (namespace + langue à la demande), cache LRU, glossaire par domaine
- **Sprint 5** — Optimisation continue : préchargement bundles côté client, traductions déléguées à un fournisseur externe

## 🧪 Tests

`server/country-os/__tests__/country-language-app-router.test.ts` — vérifie la surface des deux moteurs branchés + non-régression `auth.*` + `identity.*`.
