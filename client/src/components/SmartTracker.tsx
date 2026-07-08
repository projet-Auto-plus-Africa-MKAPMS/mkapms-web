/**
 * SmartTracker — Suivi comportemental automatique
 * Enregistre chaque visite de page et action utilisateur
 * en temps réel dans le Système Intelligent MKA.P-MS.
 * Silencieux, non-bloquant, invisible pour l'utilisateur.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trpc } from "../lib/trpc";

export default function SmartTracker() {
  const location = useLocation();
  const trackPage = trpc.smartEngine.trackPage.useMutation();
  const prevPath = useRef<string>("");
  const enteredAt = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const duration = prevPath.current ? Math.round((now - enteredAt.current) / 1000) : 0;

    if (prevPath.current && prevPath.current !== location.pathname && duration > 0) {
      trackPage.mutate({
        page: prevPath.current,
        referrer: document.referrer || undefined,
        duration,
        device: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
      });
    }

    prevPath.current = location.pathname;
    enteredAt.current = now;

    trackPage.mutate({
      page: location.pathname,
      referrer: prevPath.current || document.referrer || undefined,
      device: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    });
  }, [location.pathname]);

  return null;
}
