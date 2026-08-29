/**
 * MKA.P-MS — Vérification de propriété du site (Google, Bing, Yandex, Meta, Pinterest).
 *
 * Le jeton de vérification était uniquement lisible dans une variable
 * d'environnement : sans accès à l'hébergeur, la propriété du domaine ne
 * pouvait pas être validée, et la publication de l'application restait bloquée.
 *
 * Ce module permet au PDG de coller le jeton depuis la plateforme. Le jeton est
 * conservé dans `platform_settings` (aucune table nouvelle), fusionné avec la
 * variable d'environnement si elle existe, et servi dans le <head> de toutes
 * les pages ainsi que par la méthode fichier de Google.
 *
 * Règle : la plateforme ne prétend jamais que la propriété est vérifiée. Elle
 * vérifie que la balise est réellement rendue par le serveur public, puis c'est
 * au moteur de recherche de valider.
 */
import { eq, inArray } from "drizzle-orm";
import { db } from "../db.js";
import { env } from "../env.js";
import { platformSettings } from "../schema.js";

export const VERIFICATION_PROVIDERS = [
  "google",
  "bing",
  "yandex",
  "facebook",
  "pinterest",
] as const;

export type VerificationProvider = (typeof VERIFICATION_PROVIDERS)[number];

export const PROVIDER_LABELS: Record<VerificationProvider, string> = {
  google: "Google Search Console",
  bing: "Bing Webmaster Tools",
  yandex: "Yandex Webmaster",
  facebook: "Meta (Facebook) Business",
  pinterest: "Pinterest",
};

/** Nom de la balise <meta> attendue par chaque plateforme. */
export const PROVIDER_META_NAME: Record<VerificationProvider, string> = {
  google: "google-site-verification",
  bing: "msvalidate.01",
  yandex: "yandex-verification",
  facebook: "facebook-domain-verification",
  pinterest: "p:domain_verify",
};

const SETTING_PREFIX = "site_verification_";

function settingKey(provider: VerificationProvider): string {
  return `${SETTING_PREFIX}${provider}`;
}

/** Jeton fourni par variable d'environnement, s'il existe. */
function fromEnv(provider: VerificationProvider): string {
  switch (provider) {
    case "google":
      return env.GOOGLE_SITE_VERIFICATION;
    case "bing":
      return env.BING_SITE_VERIFICATION;
    case "yandex":
      return env.YANDEX_VERIFICATION;
    case "facebook":
      return env.FACEBOOK_DOMAIN_VERIFICATION;
    case "pinterest":
      return env.PINTEREST_SITE_VERIFICATION;
  }
}

/**
 * Cache mémoire des jetons enregistrés en base. Les balises sont rendues à
 * chaque requête HTTP : lire la base à chaque page serait une régression de
 * performance. Le cache est rafraîchi à l'enregistrement et toutes les minutes.
 */
const CACHE_TTL_MS = 60_000;
let cache: Record<VerificationProvider, string> = {
  google: "",
  bing: "",
  yandex: "",
  facebook: "",
  pinterest: "",
};
let cacheAt = 0;

/** Jetons enregistrés par le PDG (lecture du cache, sans appel base). */
export function storedTokens(): Record<VerificationProvider, string> {
  return cache;
}

/** Recharge le cache depuis la base. Ne lève jamais : à défaut, l'env suffit. */
export async function refreshVerificationTokens(): Promise<void> {
  try {
    const keys = VERIFICATION_PROVIDERS.map(settingKey);
    const rows = await db
      .select()
      .from(platformSettings)
      .where(inArray(platformSettings.key, keys));
    const next: Record<VerificationProvider, string> = {
      google: "",
      bing: "",
      yandex: "",
      facebook: "",
      pinterest: "",
    };
    for (const provider of VERIFICATION_PROVIDERS) {
      const row = rows.find((r) => r.key === settingKey(provider));
      next[provider] = row?.value.trim() ?? "";
    }
    cache = next;
    cacheAt = Date.now();
  } catch {
    /* la base peut être indisponible au démarrage : l'env reste servi */
  }
}

/** Rafraîchit le cache si sa durée de vie est dépassée (appel non bloquant). */
export function scheduleVerificationRefresh(): void {
  if (Date.now() - cacheAt < CACHE_TTL_MS) return;
  cacheAt = Date.now();
  void refreshVerificationTokens();
}

/**
 * Jetons effectivement servis pour une plateforme : variable d'environnement et
 * jeton saisi par le PDG sont cumulés (Google accepte plusieurs propriétés).
 */
export function tokensFor(provider: VerificationProvider): string[] {
  const brut = [fromEnv(provider), storedTokens()[provider]].filter((v) => v.length > 0);
  const out: string[] = [];
  for (const valeur of brut) {
    for (const part of valeur.split(",")) {
      const jeton = nettoyerJeton(provider, part);
      if (jeton && !out.includes(jeton)) out.push(jeton);
    }
  }
  return out;
}

/**
 * Normalise un jeton collé par l'utilisateur : accepte la balise complète, le
 * `content="…"` seul, ou le nom de fichier `google<jeton>.html` pour Google.
 */
export function nettoyerJeton(provider: VerificationProvider, saisie: string): string {
  let valeur = saisie.trim();
  if (!valeur) return "";

  const metaContent = valeur.match(/content\s*=\s*["']([^"']+)["']/i);
  if (metaContent) valeur = metaContent[1];

  valeur = valeur.replace(/^["']|["']$/g, "").trim();

  if (provider === "google") {
    valeur = valeur
      .replace(/^google-site-verification[=:]\s*/i, "")
      .replace(/\.html$/i, "")
      .replace(/^google/i, "");
  }
  return valeur.slice(0, 200);
}

/** Jetons Google utilisables par la méthode fichier (`/google<jeton>.html`). */
export function googleFileTokens(): string[] {
  return tokensFor("google").filter((j) => /^[a-z0-9]+$/i.test(j));
}

export interface ProviderStatus {
  provider: VerificationProvider;
  label: string;
  metaName: string;
  /** Le jeton vient-il d'une variable d'hébergeur ? */
  depuisEnvironnement: boolean;
  /** Un jeton a-t-il été saisi depuis la plateforme ? */
  depuisPlateforme: boolean;
  /** Jetons masqués (les 6 derniers caractères) — jamais la valeur complète. */
  jetonsMasques: string[];
}

/** État de configuration réel, sans jamais affirmer que la propriété est validée. */
export function verificationStatus(): ProviderStatus[] {
  return VERIFICATION_PROVIDERS.map((provider) => {
    const jetons = tokensFor(provider);
    return {
      provider,
      label: PROVIDER_LABELS[provider],
      metaName: PROVIDER_META_NAME[provider],
      depuisEnvironnement: fromEnv(provider).trim().length > 0,
      depuisPlateforme: storedTokens()[provider].length > 0,
      jetonsMasques: jetons.map((j) => `…${j.slice(-6)}`),
    };
  });
}

/** Enregistre (ou efface) le jeton d'une plateforme. Décision tracée par l'appelant. */
export async function saveToken(input: {
  provider: VerificationProvider;
  saisie: string;
  userId: number;
}): Promise<{ ok: boolean; jetons: number }> {
  const key = settingKey(input.provider);
  const valeur = input.saisie
    .split(",")
    .map((part) => nettoyerJeton(input.provider, part))
    .filter((j) => j.length > 0)
    .join(",");

  if (valeur.length === 0) {
    await db.delete(platformSettings).where(eq(platformSettings.key, key));
  } else {
    await db
      .insert(platformSettings)
      .values({ key, value: valeur, updatedBy: input.userId })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value: valeur, updatedBy: input.userId, updatedAt: new Date() },
      });
  }

  await refreshVerificationTokens();
  // Un jeton n'est jamais renvoyé au navigateur : seul son nombre est utile.
  return { ok: true, jetons: tokensFor(input.provider).length };
}

export interface RenderCheck {
  url: string;
  joignable: boolean;
  /** Nombre de balises attendues réellement trouvées dans le HTML servi. */
  balisesTrouvees: number;
  balisesAttendues: number;
  /** Plateformes dont la balise n'est pas rendue par le site public. */
  manquantes: string[];
  /** Pour Google, le fichier de vérification répond-il ? */
  fichierGoogle: { url: string; servi: boolean } | null;
  motif: string;
}

/**
 * Vérifie sur le site public que les balises sont réellement rendues.
 * C'est la seule preuve honnête : le PDG n'a pas à croire une notification.
 */
export async function checkRendered(baseUrl: string): Promise<RenderCheck> {
  const url = baseUrl.replace(/\/+$/, "") + "/";
  const attendues = VERIFICATION_PROVIDERS.flatMap((p) =>
    tokensFor(p).map((jeton) => ({ provider: p, jeton })),
  );

  const result: RenderCheck = {
    url,
    joignable: false,
    balisesTrouvees: 0,
    balisesAttendues: attendues.length,
    manquantes: [],
    fichierGoogle: null,
    motif: "",
  };

  if (attendues.length === 0) {
    result.motif = "Aucun jeton enregistré : il n'y a rien à vérifier.";
    return result;
  }

  try {
    const res = await fetch(url, { headers: { accept: "text/html" } });
    result.joignable = res.ok;
    if (!res.ok) {
      result.motif = `Le site a répondu ${res.status} : la page publique n'a pas pu être lue.`;
      return result;
    }
    const html = await res.text();
    for (const attendue of attendues) {
      const nom = PROVIDER_META_NAME[attendue.provider];
      if (html.includes(attendue.jeton) && html.includes(nom)) {
        result.balisesTrouvees += 1;
      } else {
        const label = PROVIDER_LABELS[attendue.provider];
        if (!result.manquantes.includes(label)) result.manquantes.push(label);
      }
    }
  } catch (err) {
    result.motif = `Site injoignable depuis le serveur : ${(err as Error).message}`;
    return result;
  }

  const fichiers = googleFileTokens();
  if (fichiers.length > 0) {
    const fichierUrl = `${baseUrl.replace(/\/+$/, "")}/google${fichiers[0]}.html`;
    try {
      const res = await fetch(fichierUrl);
      result.fichierGoogle = { url: fichierUrl, servi: res.ok };
    } catch {
      result.fichierGoogle = { url: fichierUrl, servi: false };
    }
  }

  const manquantes = attendues.length - result.balisesTrouvees;
  result.motif =
    manquantes === 0
      ? "Toutes les balises enregistrées sont réellement rendues par le serveur : la vérification peut être lancée chez le moteur de recherche."
      : `${manquantes} balise(s) non rendue(s) par le site public (${result.manquantes.join(", ")}) — le déploiement en cours ne les contient pas encore.`;
  return result;
}
