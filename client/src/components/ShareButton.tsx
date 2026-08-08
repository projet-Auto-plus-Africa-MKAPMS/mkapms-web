import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { shareLink, type ShareLinkInput } from "../lib/share";

interface ShareButtonProps extends ShareLinkInput {
  /** "icon" = pastille ronde des overlays photo ; "inline" = bouton texte. */
  variant?: "icon" | "inline";
  className?: string;
  label?: string;
}

/**
 * Bouton « Partager » unique de la plateforme : partage natif si disponible,
 * sinon copie du lien — et, dans tous les cas, un retour visuel. Sans ce retour,
 * la copie silencieuse donnait l'impression que le bouton ne marchait pas.
 */
export default function ShareButton({
  variant = "inline",
  className,
  label = "Partager",
  ...link
}: ShareButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function onShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const outcome = await shareLink(link);
    if (outcome === "shared") return;
    setState(outcome === "copied" ? "copied" : "failed");
    setTimeout(() => setState("idle"), 2000);
  }

  const message = state === "copied" ? "Lien copié" : state === "failed" ? "Copie impossible" : null;

  if (variant === "icon") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={onShare}
          title={label}
          aria-label={label}
          className={
            className ??
            "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
          }
          style={{ border: "1.5px solid #111", boxShadow: "0 0 8px rgba(212,175,55,0.3)" }}
        >
          {state === "copied" ? (
            <Check size={18} className="text-emerald-600" />
          ) : (
            <Share2 size={18} className="text-[#111]" />
          )}
        </button>
        {message && (
          <span className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111] px-2 py-1 text-[11px] font-semibold text-white">
            {message}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className={
        className ??
        "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-noir"
      }
    >
      {state === "copied" ? (
        <Check size={18} className="text-emerald-600" />
      ) : (
        <Share2 size={18} />
      )}
      {message ?? label}
    </button>
  );
}
