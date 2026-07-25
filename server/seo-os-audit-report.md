# Rapport d'audit — SEO OS

**Périmètre :** `server/seo.ts` (329 lignes) + branchement dans `server/index.ts` (lignes 20, 147, 148, 158).
**Mode :** lecture seule — **aucune modification effectuée** (conformément à la demande).
**Date :** 2026-02

---

## ✅ Ce qui est en place et fonctionne

### 1. SEO multi-domaine (Règle 6 respectée)
Trois domaines totalement indépendants (`fr`, `pro`, `site`) avec leurs propres :
- `siteName`, `defaultTitle`, `defaultDescription`, `keywords`
- `lang` (fr/fr/en), `ogLocale` (fr_FR/fr_FR/en_US)
- `staticPaths` propres (18 pour `mkapms.fr`, 14 pour `mkapms.pro`, 13 pour `mkapms.site`)

### 2. Endpoints publics
| Route | Fonction | Statut |
|---|---|---|
| `GET /robots.txt` | `robotsTxt()` — adapté par domaine, bloque `/acheter/particulier` sur .pro | ✅ |
| `GET /sitemap.xml` | `sitemapXml()` — statiques + toutes les annonces `publiee` (max 50 000), avec `lastmod`, `changefreq`, `priority` | ✅ |

### 3. SSR de l'index.html pour SEO dynamique
`injectAnnonceSeo(req, html)` remplace le marqueur `<!--SEO-->` avec :
- Balises par défaut du domaine (keywords, og:site_name, og:locale)
- Sur les URLs `/vehicule/:id`, un bloc SEO produit complet :
  - `<title>` dynamique (titre — marque modèle (année) | siteName)
  - `<meta description>` construite depuis les attributs
  - `<link rel="canonical">`
  - **hreflang** (fr, fr, x-default) — cross-domain
  - **Open Graph** (og:type=product, og:site_name, og:title, og:description, og:image, og:url, og:locale)
  - **Twitter Cards** (summary_large_image + title + description + image)
  - **JSON-LD Schema.org** : `@type` Vehicle/Product, brand, model, vehicleModelDate, mileageFromOdometer, fuelType, images, sku, offers (price, priceCurrency, availability)

### 4. Sécurité
- `escapeHtml()` appliqué à toutes les entrées dynamiques (XSS protection)
- Erreurs silencieuses avec fallback (`try/catch` autour de la DB → retourne les meta domaine par défaut)
- Type-safe : `DomainKey` type strict, `resolveDomain()` centralisé

---

## ⚠️ Bugs mineurs et angles morts identifiés (non corrigés)

### Bugs à corriger
1. **Ligne 177 : fallback `image = /favicon.svg`** — le fichier `favicon.svg` n'existe pas. Devrait référencer `/logo-open.png` ou `/icon-512.png` (que j'ai créés pour l'intégration du logo).
2. **Ligne 151 : `if (isProd)`** — l'injection SSR SEO n'est active qu'en production. En dev, les crawlers voient un HTML sans balises dynamiques.

### Angles morts fonctionnels
3. **hreflang incomplet** — seulement `fr` et `x-default`. Manque `en` pour `mkapms.site`, et pas d'entrées pour futures langues (pt, ar, sw).
4. **`meta.lang === "en"` pour `site`** mais `hreflang="x-default"` seul → cohérence linguistique à revoir.
5. **Pas de sitemap-index** — plafonné à 50 000 annonces. Une base >50k perd sa longue traîne.
6. **SEO SSR uniquement pour `/vehicule/:id`** — les pages catégories, pages garages, pages pièces ne reçoivent pas de meta dynamique côté serveur (juste les meta domaine par défaut).
7. **Pas de `<meta name="robots">` dynamique** — annonces expirées ou en brouillon retournent `null` (donc HTML sans balises produit) mais pas de `noindex` explicite.
8. **Pas de JSON-LD `Organization`, `WebSite` (SearchAction), `BreadcrumbList`, `FAQPage`** sur les pages statiques (home, aide, à propos).
9. **Pas de `og:image:width/height/alt`** — CTR sub-optimal sur partages sociaux (Facebook, LinkedIn).
10. **`priceCurrency` = `a.devise || "EUR"`** — fallback correct mais la relation devise ↔ domaine (fr=EUR, site=multi-devises) pourrait être renforcée.

---

## 🏁 Verdict global

Le **SEO OS est fonctionnel** et déjà bien plus avancé que la moyenne du marché. Le socle couvre :
- ✅ Multi-domaine (Règle 6)
- ✅ Sitemap dynamique + Robots.txt
- ✅ SSR d'index.html pour les fiches produits
- ✅ Open Graph + Twitter Cards
- ✅ JSON-LD Schema.org Vehicle/Product
- ✅ hreflang cross-domain

**Recommandation :** l'engine peut être marqué "opérationnel" pour la production. Les 10 angles morts ci-dessus sont à traiter dans un prochain sprint "SEO OS v2" — sans urgence, mais nécessaires pour un référencement mondial optimal (Google, Bing, Baidu, Yandex).
