import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("mkapms_install_dismissed")) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show || dismissed) return null;

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("mkapms_install_dismissed", "1");
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[9999] mx-auto max-w-md animate-[slideUp_0.3s_ease] rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-xl sm:left-auto sm:right-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#111]">
          <span className="text-lg font-bold text-[#D4AF37]">M</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[#111]">Installer MKA.P-MS</h3>
          <p className="mt-0.5 text-xs text-[#6B7280]">Ajoutez l'application sur votre écran d'accueil pour un accès rapide.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={install} className="rounded-lg bg-[#D4AF37] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#C5A028]">
              Installer
            </button>
            <button onClick={dismiss} className="rounded-lg px-4 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-[#F3F4F6]">
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
