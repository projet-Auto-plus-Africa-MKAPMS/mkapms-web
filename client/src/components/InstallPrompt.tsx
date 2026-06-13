import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Déjà installé en mode standalone ?
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Déjà refusé ?
    const dismissedAt = localStorage.getItem("mkapms_install_dismissed");
    if (dismissedAt) {
      // Re-montrer après 7 jours
      const days = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (days < 7) return;
    }

    // Détecte iOS (pas de beforeinstallprompt sur Safari)
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
    setIsIOS(ios);

    if (ios) {
      // Sur iOS, montrer directement le guide
      setTimeout(() => setShow(true), 2000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 1500);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show || dismissed || isStandalone) return null;

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("mkapms_install_dismissed", String(Date.now()));
  };

  return (
    <>
      {/* ═══ Bannière haut de page — pleine largeur ═══ */}
      <div className="fixed inset-x-0 top-0 z-[10000] bg-[#111] shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]">
              <span className="text-lg font-extrabold text-white">M</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Téléchargez l'application MKA.P-MS
              </p>
              <p className="text-[11px] text-white/50">
                {isIOS
                  ? "Appuyez sur Partager puis « Sur l'écran d'accueil »"
                  : "Accès rapide depuis votre écran d'accueil — gratuit"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isIOS && deferredPrompt && (
              <button
                onClick={install}
                className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#C5A028]"
              >
                Installer
              </button>
            )}
            <button
              onClick={dismiss}
              className="rounded-lg px-3 py-2 text-xs font-medium text-white/50 transition hover:text-white"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Spacer pour ne pas cacher le contenu sous la bannière */}
      <div className="h-14" />
    </>
  );
}
