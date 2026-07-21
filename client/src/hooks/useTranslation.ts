/**
 * useTranslation — Hook React branché sur Language OS (règle MOS #15).
 *
 * Usage :
 *   const { t, lang, ready } = useTranslation("ui");
 *   return <h1>{t("home.title")}</h1>;
 *
 *   const { t } = useTranslation("annonce", "en"); // langue forcée
 *
 * Comportement :
 *  - Charge le bundle namespace + langue via tRPC `language.bundle`.
 *  - Mise en cache localStorage (TTL 1 h) pour affichage instantané.
 *  - Fallback fr automatique côté serveur si une clé manque.
 *  - Détection langue : préférence utilisateur (`language.preferences.me`)
 *    → cookie `mkapms_lang` → `navigator.language` → 'fr'.
 *  - Retourne la clé elle-même si la traduction n'existe pas (compatibilité
 *    UI progressive — l'UI reste fonctionnelle sans traductions).
 */
import { useEffect, useMemo, useState } from "react";
import { trpc } from "../lib/trpc";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 h
const CACHE_PREFIX = "mos_lang_";
const COOKIE_NAME = "mkapms_lang";

type Bundle = Record<string, string>;

function readCache(namespace: string, lang: string): Bundle | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${namespace}_${lang}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: Bundle };
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(namespace: string, lang: string, data: Bundle) {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${namespace}_${lang}`,
      JSON.stringify({ at: Date.now(), data }),
    );
  } catch {
    // localStorage plein / désactivé — silencieux.
  }
}

function detectClientLanguage(): string {
  // 1. Cookie explicite
  if (typeof document !== "undefined") {
    const m = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (m) return decodeURIComponent(m[1]);
  }
  // 2. navigator.language
  if (typeof navigator !== "undefined") {
    const nav = navigator.language?.split("-")[0]?.toLowerCase();
    if (nav) return nav;
  }
  // 3. Défaut
  return "fr";
}

export function useTranslation(namespace: string, forceLang?: string) {
  const [lang, setLang] = useState<string>(() => forceLang ?? detectClientLanguage());

  // Charge la préférence serveur si l'utilisateur est connecté.
  const prefQ = trpc.language.preferences.me.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !forceLang,
  });
  useEffect(() => {
    if (!forceLang && prefQ.data?.preferredLanguage) {
      setLang(prefQ.data.preferredLanguage);
    }
  }, [forceLang, prefQ.data?.preferredLanguage]);

  // Cache immédiat pour affichage sans blanc.
  const cached = useMemo(() => readCache(namespace, lang) ?? {}, [namespace, lang]);
  const [bundle, setBundle] = useState<Bundle>(cached);

  const bundleQ = trpc.language.bundle.useQuery(
    { namespace, language: lang },
    { staleTime: 5 * 60 * 1000 },
  );
  useEffect(() => {
    if (bundleQ.data) {
      setBundle(bundleQ.data);
      writeCache(namespace, lang, bundleQ.data);
    }
  }, [bundleQ.data, namespace, lang]);

  const t = (key: string, fallback?: string): string => {
    if (bundle[key]) return bundle[key];
    return fallback ?? key;
  };

  const changeLanguage = (next: string) => {
    setLang(next);
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(next)};path=/;max-age=${60 * 60 * 24 * 365}`;
    }
  };

  return {
    t,
    lang,
    ready: !!bundle && Object.keys(bundle).length > 0,
    loading: bundleQ.isLoading,
    changeLanguage,
  };
}
