import { MessageCircle } from "lucide-react";
import { ModulePlaceholder } from "./ModulePlaceholder";

export function Conversation() {
  return (
    <ModulePlaceholder
      icone={MessageCircle}
      titre="Conversation"
      description="Échange texte avec MKA.P-MS Intelligence — même moteur que l'assistant intégré, avec l'expérience complète du produit dédié."
    />
  );
}
