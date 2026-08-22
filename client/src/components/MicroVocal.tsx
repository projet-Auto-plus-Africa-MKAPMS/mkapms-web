import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { speechRecognitionConstructor, startDictation } from "../lib/speech";

/**
 * Micro de dictée réutilisable (barres de recherche, assistant).
 * Si le navigateur ne sait pas dicter, le bouton le dit au lieu de rester
 * inerte : un micro qui ne réagit pas passe pour une panne de la plateforme.
 */
interface Props {
  onTexte: (texte: string, final: boolean) => void;
  langue?: string;
  taille?: number;
  titre?: string;
  className?: string;
}

export default function MicroVocal({
  onTexte,
  langue = "fr-FR",
  taille = 16,
  titre = "Dicter ma recherche",
  className = "",
}: Props) {
  const [ecoute, setEcoute] = useState(false);
  const [erreur, setErreur] = useState("");
  const supporte = speechRecognitionConstructor() !== null;
  const sessionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => () => sessionRef.current?.stop(), []);

  function basculer(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (ecoute) {
      sessionRef.current?.stop();
      sessionRef.current = null;
      setEcoute(false);
      return;
    }
    setErreur("");
    const session = startDictation(langue, {
      onText: (texte, final) => onTexte(texte, final),
      onError: (message) => {
        setErreur(message);
        setEcoute(false);
      },
      onEnd: () => {
        sessionRef.current = null;
        setEcoute(false);
      },
    });
    if (!session) {
      setErreur("Ce navigateur ne sait pas dicter : saisissez votre recherche au clavier.");
      return;
    }
    sessionRef.current = session;
    setEcoute(true);
  }

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={basculer}
        title={supporte ? titre : "Dictée non disponible sur ce navigateur"}
        aria-label={titre}
        aria-pressed={ecoute}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
          ecoute
            ? "border-red-500 bg-red-50 text-red-600 animate-pulse"
            : supporte
              ? "border-[#D4AF37]/40 bg-white text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5"
              : "border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF]"
        }`}
      >
        {ecoute ? <Square size={taille - 4} /> : supporte ? <Mic size={taille} /> : <MicOff size={taille} />}
      </button>
      {erreur && (
        <span className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-red-200 bg-white px-2 py-1.5 text-[10px] leading-snug text-red-700 shadow-md">
          {erreur}
        </span>
      )}
    </span>
  );
}
