import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    const dismissedAt = localStorage.getItem("mkapms_install_dismissed");
    if (dismissedAt) {
      const days = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (days < 7) return;
    }

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Toujours afficher la bannière après 1.5s
    const timer = setTimeout(() => setShow(true), 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  if (!show || dismissed || isStandalone) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("mkapms_install_dismissed", String(Date.now()));
  };

  const handleCollapse = () => {
    setCollapsed(true);
    setShowGuide(false);
  };

  // Mode replié — petit bouton rond or en bas à droite
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-20 right-4 z-[10000] flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#D4AF37] shadow-lg transition-transform hover:scale-110 active:scale-95"
        style={{ pointerEvents: "auto" }}
        aria-label="Installer l'application"
      >
        <span className="text-lg font-extrabold text-white">M</span>
      </button>
    );
  }

  return (
    <>
      {/* ═══ Bannière bas de page ═══ */}
      <div
        className="fixed inset-x-0 bottom-16 z-[10000] px-3 sm:bottom-4 sm:px-0"
        style={{ pointerEvents: "auto" }}
      >
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-white/20 bg-[#111] shadow-2xl">
          {/* Contenu principal */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]">
              <span className="text-lg font-extrabold text-white">M</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">Téléchargez MKA.P-MS</p>
              <p className="truncate text-[11px] text-white/50">
                Accès rapide depuis votre écran — gratuit
              </p>
            </div>
          </div>

          {/* Guide d'installation (quand pas de prompt natif) */}
          {showGuide && (
            <div className="border-t border-white/10 bg-[#1A1A1A] px-4 py-3">
              <p className="mb-2 text-xs font-bold text-[#D4AF37]">Comment installer :</p>
              {isIOS ? (
                <ol className="space-y-1.5 text-[11px] text-white/70">
                  <li>1. Appuyez sur le bouton <strong className="text-white">Partager</strong> (carré avec flèche)</li>
                  <li>2. Faites défiler et appuyez sur <strong className="text-white">Sur l'écran d'accueil</strong></li>
                  <li>3. Confirmez en appuyant sur <strong className="text-white">Ajouter</strong></li>
                </ol>
              ) : (
                <ol className="space-y-1.5 text-[11px] text-white/70">
                  <li>1. Cliquez sur les <strong className="text-white">3 points</strong> (⋮) en haut à droite du navigateur</li>
                  <li>2. Sélectionnez <strong className="text-white">Installer l'application</strong> ou <strong className="text-white">Ajouter à l'écran d'accueil</strong></li>
                  <li>3. Confirmez l'installation</li>
                </ol>
              )}
            </div>
          )}

          {/* Boutons */}
          <div className="flex border-t border-white/10">
            <button
              type="button"
              onClick={handleInstall}
              className="flex-1 cursor-pointer bg-[#D4AF37] py-3 text-xs font-bold text-white transition hover:bg-[#C5A028] active:bg-[#B8941F]"
              style={{ pointerEvents: "auto" }}
            >
              {deferredPrompt ? "Installer l'application" : showGuide ? "Fermer le guide" : "Installer"}
            </button>
            <button
              type="button"
              onClick={handleCollapse}
              className="cursor-pointer border-l border-white/10 px-4 py-3 text-xs font-medium text-white/50 transition hover:bg-white/5 hover:text-white active:bg-white/10"
              style={{ pointerEvents: "auto" }}
            >
              Réduire
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="cursor-pointer border-l border-white/10 px-3 py-3 text-xs font-medium text-white/30 transition hover:bg-white/5 hover:text-white active:bg-white/10"
              style={{ pointerEvents: "auto" }}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
