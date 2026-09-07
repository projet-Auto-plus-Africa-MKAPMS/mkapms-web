/**
 * Bouton rond noir d'ouverture de MKA.P-MS Intelligences, même gabarit que le
 * micro de dictée (h-8 w-8) pour se poser à côté de lui dans une barre de
 * recherche. L'action est demandée au Moteur de boutons : il connaît ce bouton,
 * son écran et trace chaque clic.
 */
import { Sparkles } from "lucide-react";
import { BoutonMoteur } from "../lib/boutonMoteur";
import { ouvrirIntelligences } from "../lib/assistantIntelligences";

interface Props {
  code: string;
  className?: string;
}

export default function BoutonIntelligences({ code, className = "" }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <BoutonMoteur
        code={code}
        onExecuter={ouvrirIntelligences}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#111] text-[#D4AF37] shadow-sm transition hover:bg-black hover:shadow-md"
      >
        <Sparkles size={16} aria-label="Ouvrir MKA.P-MS Intelligences" />
      </BoutonMoteur>
    </span>
  );
}
