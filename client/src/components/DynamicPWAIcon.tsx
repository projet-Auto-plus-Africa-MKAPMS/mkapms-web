/**
 * <DynamicPWAIcon /> — bascule dynamique de l'icône PWA / favicon
 * selon l'état d'authentification.
 *
 * - Visiteur non connecté  → /icon-192-open.png   (Version 2 – Lune / Expansion)
 * - Utilisateur connecté   → /icon-192-closed.png (Version 1 – Terre / Unité)
 *
 * ⚠️ Limitation iOS Safari : une fois qu'une PWA est ajoutée à l'écran
 * d'accueil iPhone, iOS ne re-télécharge JAMAIS l'icône, quel que soit
 * ce qu'on fait côté client. Cette bascule dynamique est donc effective :
 *   ✅ dans l'onglet Safari (favicon)
 *   ✅ dans la barre d'onglets Chrome/Firefox (favicon)
 *   ✅ dans les PWA Android nouvellement installées après connexion
 *   ❌ pour les PWA iOS déjà installées (limitation Apple)
 */
import { useEffect } from "react";
import { useAuth } from "../lib/auth";

function setIconHref(rel: string, href: string, sizes?: string) {
  // Récupère ou crée la balise <link rel="..." sizes="...">
  const selector = sizes ? `link[rel='${rel}'][sizes='${sizes}']` : `link[rel='${rel}']`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    if (sizes) el.sizes = sizes;
    document.head.appendChild(el);
  }
  // Cache-buster léger pour forcer le refetch au changement d'état
  el.href = `${href}?v=${Date.now()}`;
}

export function DynamicPWAIcon() {
  const { user } = useAuth();
  useEffect(() => {
    const suffix = user ? "closed" : "open";
    setIconHref("icon", `/favicon.png`);
    setIconHref("icon", `/icon-192-${suffix}.png`, "192x192");
    setIconHref("apple-touch-icon", `/icon-192-${suffix}.png`);
    // Note : le manifest reste statique (contrainte navigateur), voir /manifest.webmanifest
  }, [user?.id]);
  return null;
}

export default DynamicPWAIcon;
