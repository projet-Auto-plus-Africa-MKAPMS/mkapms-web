import { useRef, useState } from "react";
import { ImagePlus, Sparkles, Upload } from "lucide-react";
import { trpc } from "../../../lib/trpc";

type NiveauImage = "normal" | "premium" | "pro";

const NIVEAUX: Record<NiveauImage, { titre: string; detail: string; directive: string }> = {
  normal: { titre: "Normal", detail: "Une création claire, fidèle à votre demande.", directive: "Créer une image claire, équilibrée et fidèle à la demande. Respecter exactement les couleurs, le texte et les détails fournis." },
  premium: { titre: "Premium", detail: "Une direction artistique plus soignée.", directive: "Créer une image premium : composition soignée, contraste maîtrisé, lumière élégante, hiérarchie visuelle nette et rendu crédible. Préserver fidèlement tous les détails demandés." },
  pro: { titre: "Pro", detail: "Pour une identité, une campagne ou un visuel de marque.", directive: "Créer une proposition professionnelle prête à être revue : direction artistique cohérente, lisibilité irréprochable, composition éditoriale, couleurs précises et finitions haut de gamme. Ne pas inventer de logo, texte, marque, chiffre ou promesse non demandés." },
};

function consigneImage(texte: string, niveau: NiveauImage): string {
  return `${NIVEAUX[niveau].directive}\n\nDemande du Fondateur :\n${texte.trim()}\n\nContraintes : si des photos sont jointes, elles sont des références visuelles et ne doivent être ni publiées ni présentées comme une preuve. Aucun watermark, aucun texte ajouté, aucun logo ajouté sans instruction explicite.`;
}

/** Espace privé : résultat réel, historique individuel et téléchargement explicite. */
export function ProductionMedia({ operation }: { operation: "image" | "voix" }) {
  const [texte, setTexte] = useState("");
  const [niveau, setNiveau] = useState<NiveauImage>("premium");
  const [droits, setDroits] = useState(false);
  const [selection, setSelection] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [nomsReferences, setNomsReferences] = useState<string[]>([]);
  const demande = useRef<{ signature: string; id: string } | null>(null);
  const image = operation === "image";
  const liste = trpc.intelligences.mediaListe.useQuery(undefined, { refetchInterval: 5000 });
  const fichier = trpc.intelligences.mediaLire.useQuery({ id: selection ?? "" }, { enabled: !!selection, refetchInterval: (q) => (q.state.data?.statut === "PROCESSING" ? 5000 : false) });
  const memoriserPreference = trpc.intelligences.memoireUtilisateurEcrire.useMutation();
  const production = trpc.intelligences.mediaProduire.useMutation({
    onSuccess(r) { setSelection(r.id); void liste.refetch(); void fichier.refetch(); if (r.statut === "FAILED") demande.current = null; },
    onError() { setErreur("La réponse du service est indisponible. Votre texte est conservé. Réessayez : une demande déjà reçue ne sera pas facturée une seconde fois par cette interface."); },
  });

  function produire() {
    if (!droits || !texte.trim() || production.isPending) return;
    setErreur("");
    const texteProduit = image ? consigneImage(texte, niveau) : texte.trim();
    const signature = `${operation}\n${niveau}\n${texteProduit}\n${references.join("|")}`;
    if (demande.current?.signature !== signature) demande.current = { signature, id: crypto.randomUUID() };
    if (image) void memoriserPreference.mutateAsync({ categorie: "preference", cle: "creation_image_preference", contenu: `Créations visuelles : niveau ${NIVEAUX[niveau].titre}. Préférence enregistrée lors d'une demande du Fondateur ; les détails créatifs restent ceux de chaque nouvelle demande.`, source: "utilisateur", confiance: "haute", visibilite: "prive" }).catch(() => undefined);
    production.mutate({ operation, requestId: demande.current.id, texte: texteProduit, droitsConfirmes: true, ...(image && references.length ? { references } : {}) });
  }

  async function choisirReferences(files: FileList | null) {
    if (!files) return;
    const choisis = Array.from(files).slice(0, 4);
    if (choisis.some((f) => f.size > 6 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(f.type))) { setErreur("Ajoutez jusqu’à 4 images PNG, JPEG ou WebP de 6 Mo maximum chacune."); return; }
    const lus = await Promise.all(choisis.map((f) => new Promise<string>((resolve, reject) => { const lecteur = new FileReader(); lecteur.onload = () => resolve(String(lecteur.result)); lecteur.onerror = () => reject(lecteur.error); lecteur.readAsDataURL(f); })));
    setReferences(lus); setNomsReferences(choisis.map((f) => f.name)); demande.current = null; setErreur("");
  }

  const media = fichier.data;
  const src = media?.statut === "READY" && media.donnees && (media.mime === "image/png" || media.mime === "audio/mpeg") ? `data:${media.mime};base64,${media.donnees}` : null;

  return <section className="mx-auto max-w-5xl space-y-6 px-3 py-4 sm:px-6">
    <header className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.18em] text-[#1683ef]">Studio privé</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#111]">{image ? "Créer une image" : "Créer une voix"}</h1><p className="mt-2 text-base leading-7 text-black/60">{image ? "Décrivez ce que vous voulez, joignez des photos si nécessaire, puis choisissez le niveau de finition." : "Transformez un texte en fichier audio privé, à contrôler avant toute utilisation."}</p></header>

    {image && <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Niveau de finition">{(Object.keys(NIVEAUX) as NiveauImage[]).map((cle) => { const actif = niveau === cle; return <button key={cle} type="button" role="radio" aria-checked={actif} onClick={() => { setNiveau(cle); demande.current = null; }} className={`min-h-24 rounded-2xl border p-4 text-left transition ${actif ? "border-[#1683ef] bg-[#eaf4ff] shadow-sm" : "border-black/10 bg-white hover:border-[#1683ef]/40"}`}><span className="block font-black text-[#111]">{NIVEAUX[cle].titre}</span><span className="mt-1 block text-sm leading-5 text-black/55">{NIVEAUX[cle].detail}</span></button>; })}</div>}

    <div><label className="block text-sm font-black text-[#111]" htmlFor="media-texte">{image ? "Votre brief créatif" : "Texte à lire"}</label><textarea id="media-texte" className="mt-2 min-h-44 w-full resize-y rounded-2xl border border-black/10 bg-white p-4 text-base leading-7 outline-none transition focus:border-[#1683ef] focus:ring-4 focus:ring-[#1683ef]/10" maxLength={4000} value={texte} onChange={(e) => { setTexte(e.target.value); demande.current = null; }} disabled={production.isPending} placeholder={image ? "Ex. Crée un logo minimaliste bleu lumineux et or pour… Précise les couleurs, le style, le texte éventuel et le format." : "Saisissez le texte à lire…"} />{image && <p className="mt-2 text-sm text-black/50">Vous pouvez demander un logo, une affiche, une image produit ou une création sur mesure. Les créations restent des brouillons privés jusqu’à votre décision.</p>}</div>

    {image && <div className="rounded-2xl border border-black/10 bg-[#fbfdff] p-4 sm:p-5"><label className="flex cursor-pointer items-center gap-3 text-sm font-black text-[#111]" htmlFor="media-references"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf4ff] text-[#1683ef]"><Upload className="h-5 w-5" /></span>Ajouter jusqu’à 4 photos de référence</label><input id="media-references" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => void choisirReferences(e.target.files)} disabled={production.isPending} /><p className="mt-2 text-sm leading-6 text-black/55">PNG, JPEG ou WebP, 6 Mo maximum par image. Elles servent seulement à cette production et ne sont jamais publiées automatiquement.</p>{nomsReferences.length > 0 && <p className="mt-3 break-words text-sm font-bold text-[#111]"><ImagePlus className="mr-1 inline h-4 w-4 text-[#1683ef]" />{nomsReferences.join(" · ")}</p>}</div>}

    <label className="flex items-start gap-3 rounded-xl bg-[#fff8e1] p-4 text-sm leading-6 text-black/70"><input className="mt-1 h-4 w-4" type="checkbox" checked={droits} onChange={(e) => setDroits(e.target.checked)} />Je confirme avoir les droits nécessaires sur les photos et contenus envoyés au service de création.</label>
    <div className="flex flex-wrap items-center gap-3"><button type="button" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#1683ef] px-5 py-3 font-black text-white shadow-sm transition hover:bg-[#0b63c7] disabled:cursor-not-allowed disabled:opacity-50" disabled={!droits || texte.trim().length < 2 || production.isPending} onClick={produire}><Sparkles className="h-4 w-4" />{production.isPending ? "Production en cours…" : image ? "Générer le visuel" : "Générer la voix"}</button><button type="button" className="min-h-12 rounded-xl border border-black/10 px-4 py-3 text-sm font-bold text-black/65" disabled={production.isPending} onClick={() => { demande.current = null; setSelection(null); setReferences([]); setNomsReferences([]); setTexte(""); setErreur(""); }}>Nouvelle création</button><p className="text-xs text-black/45">20 productions maximum par 24 heures. Une génération peut prendre quelques minutes.</p></div>

    {erreur && <p role="alert" className="text-sm font-bold text-red-700">{erreur}</p>}{liste.isError && <p role="alert" className="text-sm text-red-700">Historique temporairement indisponible.</p>}{fichier.isError && <p role="alert" className="text-sm text-red-700">Impossible de charger cette production.</p>}{media?.statut === "PROCESSING" && <p role="status" className="text-sm font-bold text-[#1683ef]">Production en cours. Son résultat apparaîtra ici.</p>}{media?.statut === "FAILED" && <p role="alert" className="text-sm font-bold text-red-700">{media.motif}</p>}
    {src && <div className="space-y-3 border-y border-black/10 py-5"><p className="font-black text-[#111]">{media?.mime === "image/png" ? "Création prête à contrôler" : "Voix prête à écouter"}</p>{media?.mime === "image/png" ? <img src={src} alt="Création générée" className="max-h-[34rem] max-w-full rounded-2xl object-contain" /> : <audio src={src} controls className="max-w-full" />}<a href={src} download={`mkapms-${image ? "creation" : "voix"}-${selection}.${media?.mime === "image/png" ? "png" : "mp3"}`} className="inline-block rounded-xl border border-black/10 px-4 py-2 text-sm font-black text-[#111]">Télécharger</a></div>}
    <div><h2 className="text-xl font-black text-[#111]">Mes créations</h2><ul className="mt-3 space-y-2">{liste.data?.filter((r) => r.operation === operation).map((r) => <li key={r.id} className="border-b border-black/10 py-3"><button type="button" className="w-full break-words text-left" onClick={() => { setSelection(r.id); setReferences([]); setNomsReferences([]); demande.current = null; }}><span className="block text-sm font-bold text-[#111]">{r.texte.slice(0, 180)}</span><span className="mt-1 block text-xs text-black/45">{r.statut === "READY" ? "Prêt" : r.statut === "FAILED" ? "Échec" : "En cours"}</span></button></li>)}</ul></div>
  </section>;
}
