import { Mic } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function VoixTempsReel() {
  return (
    <ModulePlaceholder
      icone={Mic}
      titre="Voix & temps réel"
      description="Conversation vocale continue avec MKA.P-MS Intelligence — dictée, réponse parlée, échange en temps réel."
    />
  );
}
