/**
 * Coffre secret — l'emplacement privé du PDG pour les identifiants, clés et
 * fichiers que le moteur peut UTILISER sans jamais les voir.
 *
 * Les valeurs sont en écriture seule : une fois déposées, elles ne sont plus
 * jamais affichées (ni ici, ni au moteur). On ne peut que les remplacer ou les
 * supprimer. Le contenu est chiffré côté serveur ; cet écran ne stocke rien
 * dans le navigateur.
 */
import { useState } from "react";
import { KeyRound, RefreshCw, Trash2, Copy } from "lucide-react";
import { trpc } from "../../../lib/trpc";

type TypeSecret = "identifiants" | "cle_api" | "fichier";

const LIBELLE_TYPE: Record<TypeSecret, string> = {
  identifiants: "E-mail et mot de passe",
  cle_api: "Clé ou jeton",
  fichier: "Fichier (trousseau, compte de service…)",
};

const LIBELLE_ACTION: Record<string, string> = {
  creer: "Ajouté",
  remplacer: "Remplacé",
  supprimer: "Supprimé",
  utiliser: "Utilisé par le moteur",
};

const TAILLE_MAX_FICHIER = 500 * 1024;

interface Valeur {
  identifiant: string;
  motDePasse: string;
  adresse: string;
  note: string;
  cle: string;
  nomFichier: string;
  contenuBase64: string;
}

const VALEUR_VIDE: Valeur = { identifiant: "", motDePasse: "", adresse: "", note: "", cle: "", nomFichier: "", contenuBase64: "" };

/** Construit le contenu attendu par le serveur, ou explique ce qui manque. */
function contenuDepuis(type: TypeSecret, v: Valeur):
  | { ok: true; contenu:
      | { type: "identifiants"; identifiant: string; motDePasse: string; adresse?: string; note?: string }
      | { type: "cle_api"; valeur: string }
      | { type: "fichier"; nomFichier: string; contenuBase64: string } }
  | { ok: false; raison: string } {
  if (type === "identifiants") {
    if (!v.identifiant.trim() || !v.motDePasse) return { ok: false, raison: "Renseignez l'adresse e-mail (ou l'identifiant) et le mot de passe." };
    return {
      ok: true,
      contenu: {
        type,
        identifiant: v.identifiant.trim(),
        motDePasse: v.motDePasse,
        ...(v.adresse.trim() ? { adresse: v.adresse.trim() } : {}),
        ...(v.note.trim() ? { note: v.note.trim() } : {}),
      },
    };
  }
  if (type === "cle_api") {
    if (v.cle.trim().length < 8) return { ok: false, raison: "La clé ou le jeton semble trop court." };
    return { ok: true, contenu: { type, valeur: v.cle.trim() } };
  }
  if (!v.contenuBase64) return { ok: false, raison: "Choisissez un fichier." };
  return { ok: true, contenu: { type, nomFichier: v.nomFichier, contenuBase64: v.contenuBase64 } };
}

function ChampsValeur({ type, valeur, onChange, desactive }: { type: TypeSecret; valeur: Valeur; onChange: (v: Valeur) => void; desactive: boolean }) {
  const maj = (partiel: Partial<Valeur>) => onChange({ ...valeur, ...partiel });
  const [erreurFichier, setErreurFichier] = useState("");

  if (type === "identifiants") {
    return (
      <div className="space-y-2">
        <label className="block text-xs">
          Adresse e-mail ou identifiant
          <input value={valeur.identifiant} onChange={(e) => maj({ identifiant: e.target.value })} disabled={desactive}
            autoComplete="off" spellCheck={false} maxLength={200} className="mt-1 w-full rounded-lg border p-2 text-sm" />
        </label>
        <label className="block text-xs">
          Mot de passe
          <input type="password" value={valeur.motDePasse} onChange={(e) => maj({ motDePasse: e.target.value })} disabled={desactive}
            autoComplete="new-password" spellCheck={false} maxLength={500} className="mt-1 w-full rounded-lg border p-2 text-sm" />
        </label>
        <label className="block text-xs">
          Adresse de connexion (facultatif)
          <input value={valeur.adresse} onChange={(e) => maj({ adresse: e.target.value })} disabled={desactive}
            autoComplete="off" spellCheck={false} maxLength={300} placeholder="https://…" className="mt-1 w-full rounded-lg border p-2 text-sm" />
        </label>
        <label className="block text-xs">
          Note pour le moteur (facultatif — jamais le mot de passe)
          <input value={valeur.note} onChange={(e) => maj({ note: e.target.value })} disabled={desactive}
            autoComplete="off" maxLength={500} className="mt-1 w-full rounded-lg border p-2 text-sm" />
        </label>
        <p className="text-[11px] text-black/50">
          Un compte Google protégé par la double authentification ne peut pas être ouvert automatiquement avec un mot de passe : pour Google Play,
          déposez plutôt le fichier JSON d'un compte de service (type « Fichier »).
        </p>
      </div>
    );
  }
  if (type === "cle_api") {
    return (
      <label className="block text-xs">
        Clé ou jeton
        <input type="password" value={valeur.cle} onChange={(e) => maj({ cle: e.target.value })} disabled={desactive}
          autoComplete="new-password" spellCheck={false} maxLength={8000} className="mt-1 w-full rounded-lg border p-2 text-sm" />
      </label>
    );
  }
  return (
    <div className="space-y-1">
      <label className="block text-xs">
        Fichier (500 Ko maximum)
        <input type="file" disabled={desactive} className="mt-1 block w-full text-sm"
          onChange={(e) => {
            setErreurFichier("");
            const fichier = e.target.files?.[0];
            if (!fichier) return maj({ nomFichier: "", contenuBase64: "" });
            if (fichier.size > TAILLE_MAX_FICHIER) {
              e.target.value = "";
              setErreurFichier("Ce fichier dépasse 500 Ko.");
              return maj({ nomFichier: "", contenuBase64: "" });
            }
            const lecteur = new FileReader();
            lecteur.onload = () => {
              const resultat = typeof lecteur.result === "string" ? lecteur.result : "";
              maj({ nomFichier: fichier.name, contenuBase64: resultat.slice(resultat.indexOf(",") + 1) });
            };
            lecteur.onerror = () => setErreurFichier("Lecture du fichier impossible.");
            lecteur.readAsDataURL(fichier);
          }} />
      </label>
      {valeur.nomFichier ? <p className="text-xs text-black/60">Prêt à déposer : {valeur.nomFichier}</p> : null}
      {erreurFichier ? <p role="alert" className="text-xs text-red-700">{erreurFichier}</p> : null}
    </div>
  );
}

function genererCleMaitre(): string {
  const octets = new Uint8Array(32);
  crypto.getRandomValues(octets);
  return Array.from(octets, (o) => o.toString(16).padStart(2, "0")).join("");
}

export function Coffre() {
  const utils = trpc.useUtils();
  const etat = trpc.intelligences.coffreEtat.useQuery(undefined, { refetchOnWindowFocus: false });
  const secrets = trpc.intelligences.coffreSecrets.useQuery(undefined, { refetchOnWindowFocus: false });
  const journal = trpc.intelligences.coffreJournal.useQuery(undefined, { refetchOnWindowFocus: false });

  const [nom, setNom] = useState("");
  const [service, setService] = useState("");
  const [type, setType] = useState<TypeSecret>("identifiants");
  const [valeur, setValeur] = useState<Valeur>(VALEUR_VIDE);
  const [message, setMessage] = useState("");
  const [remplacementId, setRemplacementId] = useState<number | null>(null);
  const [valeurRemplacement, setValeurRemplacement] = useState<Valeur>(VALEUR_VIDE);
  const [cleGeneree, setCleGeneree] = useState("");

  const rafraichir = async () => {
    await Promise.all([utils.intelligences.coffreEtat.invalidate(), utils.intelligences.coffreSecrets.invalidate(), utils.intelligences.coffreJournal.invalidate()]);
  };

  const ajouter = trpc.intelligences.coffreAjouter.useMutation({
    onSuccess: async (r) => {
      setMessage(r.detail);
      if (r.ok) {
        setNom(""); setService(""); setValeur(VALEUR_VIDE);
        await rafraichir();
      }
    },
    onError: (e) => setMessage(e.message),
  });
  const remplacer = trpc.intelligences.coffreRemplacer.useMutation({
    onSuccess: async (r) => {
      setMessage(r.detail);
      if (r.ok) {
        setRemplacementId(null); setValeurRemplacement(VALEUR_VIDE);
        await rafraichir();
      }
    },
    onError: (e) => setMessage(e.message),
  });
  const supprimer = trpc.intelligences.coffreSupprimer.useMutation({
    onSuccess: async (r) => { setMessage(r.detail); await rafraichir(); },
    onError: (e) => setMessage(e.message),
  });

  const disponible = etat.data?.disponible === true;

  function deposer() {
    if (nom.trim().length < 2) { setMessage("Donnez un nom au secret (2 caractères minimum)."); return; }
    const analyse = contenuDepuis(type, valeur);
    if (!analyse.ok) { setMessage(analyse.raison); return; }
    setMessage("");
    ajouter.mutate({ nom: nom.trim(), service: service.trim(), contenu: analyse.contenu });
  }

  function remplacerValeur(id: number, typeSecret: TypeSecret) {
    const analyse = contenuDepuis(typeSecret, valeurRemplacement);
    if (!analyse.ok) { setMessage(analyse.raison); return; }
    setMessage("");
    remplacer.mutate({ id, contenu: analyse.contenu });
  }

  return (
    <section className="space-y-4" aria-label="Coffre secret">
      <div className="rounded-xl border border-black/10 p-4 space-y-2">
        <h2 className="flex items-center gap-2 text-base font-black"><KeyRound className="h-4 w-4" /> Coffre secret</h2>
        <p className="text-sm">
          Vos identifiants, clés et fichiers, chiffrés. Le moteur peut s'en servir pour agir à votre place, mais il ne les voit jamais, et vous
          non plus une fois déposés : on ne peut que les remplacer ou les supprimer. Réservé à votre compte.
        </p>
        <p className="text-xs text-black/60">
          La Boutique garde son propre coffre : rien n'est partagé automatiquement entre les deux plateformes.
        </p>
      </div>

      {etat.isLoading ? <p className="text-xs" role="status">Vérification du coffre…</p> : null}
      {etat.data && !disponible ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50/40 p-4 space-y-2 text-sm">
          <p className="font-bold text-red-700">Coffre pas encore activé</p>
          <p>{etat.data.motif}</p>
          <p className="text-xs text-black/70">
            Générez une clé ci-dessous, collez-la dans Railway (variable <code>COFFRE_CLE_MAITRE</code>), redéployez, puis revenez ici.
            Conservez aussi cette clé ailleurs : sans elle, les secrets déposés deviennent illisibles.
          </p>
          <button type="button" onClick={() => setCleGeneree(genererCleMaitre())} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-bold">
            <RefreshCw className="h-3 w-3" /> Générer une clé maître
          </button>
          {cleGeneree ? (
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded bg-white p-2 text-[11px]">{cleGeneree}</code>
              <button type="button" onClick={() => void navigator.clipboard?.writeText(cleGeneree)} className="inline-flex shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs font-bold">
                <Copy className="h-3 w-3" /> Copier
              </button>
            </div>
          ) : null}
          {cleGeneree ? <p className="text-[11px] text-black/60">Cette clé est fabriquée dans votre navigateur : elle n'est envoyée à aucun serveur et ne s'affichera plus si vous quittez cet écran.</p> : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-black/10 p-4 space-y-3">
        <h3 className="text-sm font-black">Ajouter une clé secrète</h3>
        <label className="block text-xs">
          Nom
          <input value={nom} onChange={(e) => setNom(e.target.value)} disabled={!disponible || ajouter.isPending} maxLength={120}
            autoComplete="off" placeholder="ex. Google Play — compte de service" className="mt-1 w-full rounded-lg border p-2 text-sm" />
        </label>
        <label className="block text-xs">
          Service visé (facultatif)
          <input value={service} onChange={(e) => setService(e.target.value)} disabled={!disponible || ajouter.isPending} maxLength={120}
            autoComplete="off" placeholder="ex. Google Play Console" className="mt-1 w-full rounded-lg border p-2 text-sm" />
        </label>
        <label className="block text-xs">
          Mode
          <select value={type} onChange={(e) => { setType(e.target.value as TypeSecret); setValeur(VALEUR_VIDE); }} disabled={!disponible || ajouter.isPending}
            className="mt-1 w-full rounded-lg border p-2 text-sm">
            {(Object.keys(LIBELLE_TYPE) as TypeSecret[]).map((t) => <option key={t} value={t}>{LIBELLE_TYPE[t]}</option>)}
          </select>
        </label>
        <ChampsValeur type={type} valeur={valeur} onChange={setValeur} desactive={!disponible || ajouter.isPending} />
        <button type="button" onClick={deposer} disabled={!disponible || ajouter.isPending}
          className="rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">
          {ajouter.isPending ? "Chiffrement…" : "Enregistrer dans le coffre"}
        </button>
      </div>

      {message ? <p role="status" className="text-sm">{message}</p> : null}

      <div className="rounded-xl border border-black/10 p-4 space-y-2">
        <h3 className="text-sm font-black">Secrets déposés</h3>
        {secrets.isLoading ? <p className="text-xs">Chargement…</p> : null}
        {secrets.isError ? <p role="alert" className="text-xs text-red-700">Liste indisponible : {secrets.error.message}</p> : null}
        {!secrets.isLoading && (secrets.data ?? []).length === 0 ? <p className="text-xs text-black/60">Aucun secret déposé.</p> : null}
        <ul className="divide-y divide-black/5">
          {(secrets.data ?? []).map((s) => (
            <li key={s.id} className="space-y-2 py-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <strong>{s.nom}</strong>{s.service ? <span className="text-black/50"> — {s.service}</span> : null}
                  <span className="block text-xs text-black/60">
                    {LIBELLE_TYPE[s.type as TypeSecret] ?? s.type} · {s.apercu}
                    {s.dernierUsageAt ? ` · utilisé le ${new Date(s.dernierUsageAt).toLocaleString("fr-FR")}` : " · jamais utilisé"}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1">
                  <button type="button" disabled={!disponible || remplacer.isPending}
                    onClick={() => { setRemplacementId(remplacementId === s.id ? null : s.id); setValeurRemplacement(VALEUR_VIDE); }}
                    className="whitespace-nowrap rounded border px-2 py-1 text-xs font-bold">Remplacer</button>
                  <button type="button" disabled={supprimer.isPending}
                    onClick={() => { if (window.confirm(`Supprimer définitivement « ${s.nom} » ?`)) supprimer.mutate({ id: s.id }); }}
                    aria-label={`Supprimer ${s.nom}`} className="rounded border px-2 py-1 text-xs font-bold text-red-700"><Trash2 className="h-3 w-3" /></button>
                </span>
              </div>
              {remplacementId === s.id ? (
                <div className="space-y-2 rounded-lg border p-3">
                  <ChampsValeur type={s.type as TypeSecret} valeur={valeurRemplacement} onChange={setValeurRemplacement} desactive={remplacer.isPending} />
                  <button type="button" disabled={remplacer.isPending} onClick={() => remplacerValeur(s.id, s.type as TypeSecret)}
                    className="rounded-lg bg-[#111] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">
                    {remplacer.isPending ? "Chiffrement…" : "Remplacer la valeur"}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-black/10 p-4 space-y-2">
        <h3 className="text-sm font-black">Journal d'utilisation</h3>
        <p className="text-xs text-black/60">Chaque dépôt, remplacement, suppression et usage par le moteur est inscrit ici — jamais la valeur elle-même.</p>
        {journal.isLoading ? <p className="text-xs">Chargement…</p> : null}
        {!journal.isLoading && (journal.data ?? []).length === 0 ? <p className="text-xs text-black/60">Aucune activité.</p> : null}
        <ul className="divide-y divide-black/5">
          {(journal.data ?? []).slice(0, 15).map((j) => (
            <li key={j.id} className="py-1.5 text-xs">
              <span className={j.ok ? "" : "text-red-700"}>
                {LIBELLE_ACTION[j.action] ?? j.action} — <strong>{j.nomSecret}</strong>{j.ok ? "" : " (refusé)"}
              </span>
              <span className="block text-black/50">
                {new Date(j.createdAt).toLocaleString("fr-FR")}{j.outil ? ` · ${j.outil}` : ""}{j.motif ? ` · ${j.motif}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
