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

    if (ios) {
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

  // Mode replié — juste un petit bouton en bas
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-20 right-4 z-[10000] flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37] shadow-lg transition hover:scale-110"
        aria-label="Installer l'application"
      >
        <span className="text-lg font-extrabold text-white">M</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-16 z-[10000] px-3 sm:bottom-4 sm:px-0">
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#111] shadow-2xl">
        {/* Contenu */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]">
            <span className="text-lg font-extrabold text-white">M</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Téléchargez MKA.P-MS</p>
            <p className="text-[11px] text-white/50 truncate">
              {isIOS
                ? "Partager → Sur l'écran d'accueil"
                : "Accès rapide depuis votre écran — gratuit"}
            </p>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex border-t border-white/10">
          <button
            onClick={!isIOS && deferredPrompt ? install : dismiss}
            className="flex-1 bg-[#D4AF37] py-2.5 text-xs font-bold text-white transition hover:bg-[#C5A028]"
          >
            {!isIOS && deferredPrompt ? "Installer l'application" : isIOS ? "J'ai compris" : "Installer"}
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="border-l border-white/10 px-4 py-2.5 text-xs font-medium text-white/50 transition hover:text-white"
          >
            Réduire
          </button>
          <button
            onClick={dismiss}
            className="border-l border-white/10 px-3 py-2.5 text-xs font-medium text-white/30 transition hover:text-white"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
