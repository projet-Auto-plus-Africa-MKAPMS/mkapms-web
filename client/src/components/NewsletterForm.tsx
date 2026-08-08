import { useState } from "react";
import { Check } from "lucide-react";
import { trpc } from "../lib/trpc";

interface Props {
  /** Où le formulaire est affiché — utile pour savoir d'où viennent les inscrits. */
  source?: string;
  inputClassName: string;
  buttonClassName: string;
  placeholder?: string;
}

/**
 * Formulaire d'inscription à la lettre d'information du pied de page.
 * Le bouton « S'abonner » n'enregistrait rien auparavant.
 */
export default function NewsletterForm({
  source = "footer",
  inputClassName,
  buttonClassName,
  placeholder = "Votre adresse email",
}: Props) {
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const abonner = trpc.marketing.subscribeNewsletter.useMutation({
    onError: (e) => setErreur(e.message || "Inscription impossible pour le moment."),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!email.trim()) {
      setErreur("Indiquez votre adresse email.");
      return;
    }
    abonner.mutate({ email: email.trim(), source });
  }

  if (abonner.isSuccess) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
        <Check size={14} /> Inscription confirmée
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex gap-1">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className={inputClassName}
        />
        <button type="submit" disabled={abonner.isPending} className={buttonClassName}>
          {abonner.isPending ? "…" : "S'abonner"}
        </button>
      </div>
      {erreur && <p className="mt-1 text-[11px] font-semibold text-red-400">{erreur}</p>}
    </form>
  );
}
