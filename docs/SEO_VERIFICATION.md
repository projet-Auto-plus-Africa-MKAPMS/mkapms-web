# Vérification de propriété du site — Guide MKA.P-MS

Ce guide te dit **exactement** où coller chaque code fourni par Google, Bing, Yandex, Facebook, Pinterest pour prouver que tu es propriétaire du site.

Tout est piloté par des **variables d'environnement Railway** — pas de code à modifier.
Tu ajoutes une variable → Railway redéploie automatiquement (~2 min) → la vérification est active partout sur le site.

Au démarrage, tu verras dans les logs Railway :

```
[MKA.P-MS] Vérification propriété active (2) : Google (meta + fichier) · Bing
```

---

## 1️⃣ Google Search Console

**Deux méthodes acceptées — les deux marchent, tu peux même utiliser les deux en même temps :**

### 🅰️ Méthode « Balise HTML meta » (recommandée)

Google Search Console te donne un truc du style :
```html
<meta name="google-site-verification" content="aDRdt_DayR7oAuQsy8jb9DpiG2are6jt_yq4Y7C9iqA" />
```

Sur Railway → onglet **Variables** → ajoute :
```
GOOGLE_SITE_VERIFICATION=aDRdt_DayR7oAuQsy8jb9DpiG2are6jt_yq4Y7C9iqA
```
(coller SEULEMENT la valeur du `content`, pas la balise entière)

### 🅱️ Méthode « Fichier HTML »

Google te propose de télécharger un fichier `google337eced33e02e5ba.html`.
Note juste **le nom exact du fichier**.

Railway → Variables → ajoute :
```
GOOGLE_SITE_VERIFICATION=337eced33e02e5ba
```

### 💡 Tu as PLUSIEURS jetons ?

Sépare-les par une virgule :
```
GOOGLE_SITE_VERIFICATION=aDRdt_DayR7oAuQsy8jb9DpiG2are6jt_yq4Y7C9iqA,337eced33e02e5ba
```

Chaque jeton est publié à la fois comme méta ET comme fichier `/google<jeton>.html`
(quand le jeton contient uniquement des lettres/chiffres, sans underscore).

---

## 2️⃣ Bing Webmaster Tools

Bing te donne :
```html
<meta name="msvalidate.01" content="ABC123XYZ789" />
```

Railway → Variables :
```
BING_SITE_VERIFICATION=ABC123XYZ789
```

---

## 3️⃣ Yandex Webmaster

Yandex te donne :
```html
<meta name="yandex-verification" content="1234abcd5678efgh" />
```

Railway → Variables :
```
YANDEX_VERIFICATION=1234abcd5678efgh
```

---

## 4️⃣ Facebook / Meta Business (pour publicités FB & Instagram)

Meta Business Suite → Sécurité de la marque → Domaines → Meta tag :
```html
<meta name="facebook-domain-verification" content="xyz789abc123" />
```

Railway → Variables :
```
FACEBOOK_DOMAIN_VERIFICATION=xyz789abc123
```

---

## 5️⃣ Pinterest

Pinterest Business → Paramètres → Sites revendiqués → Ajouter → Balise HTML :
```html
<meta name="p:domain_verify" content="a1b2c3d4e5f6g7h8" />
```

Railway → Variables :
```
PINTEREST_SITE_VERIFICATION=a1b2c3d4e5f6g7h8
```

---

## 🧪 Comment vérifier que ça marche (avant même que Google confirme)

1. Ouvre ton site en production (`https://mkapms.site` ou tes autres domaines)
2. **Clic droit → Afficher le code source** (ou `Ctrl+U`)
3. Cherche `google-site-verification` — tu dois voir ta valeur dans une balise `<meta>`
4. Reviens sur Google Search Console → clique **"Vérifier"** → ✅

Pour la méthode fichier, tu peux aussi ouvrir directement :
`https://mkapms.site/google[TON_HASH].html`
→ ça doit afficher : `google-site-verification: google[TON_HASH].html`

---

## 🌍 Multi-domaines

Tu as plusieurs domaines (`.fr`, `.pro`, `.ci`, `.site`) ? Les balises sont injectées **sur tous les domaines automatiquement**. Une seule variable, tous les domaines validés.

Pour la méthode DNS (recommandée quand tu as plusieurs domaines), ça passe côté fournisseur DNS (OVH, Cloudflare) — pas dans le code. Tu ajoutes juste un enregistrement TXT à ta zone.

---

## ❓ Ma vérification échoue toujours ?

1. Vérifie que Railway a bien redéployé : logs doivent afficher
   `[MKA.P-MS] Vérification propriété active (N) : ...`
2. Vérifie avec Ctrl+U sur la page d'accueil que la balise est bien présente
3. Vérifie que tu as collé **UNIQUEMENT la valeur `content`**, pas la balise HTML entière
4. Pour Google, attends 24-48h max — parfois l'indexation initiale prend du temps
