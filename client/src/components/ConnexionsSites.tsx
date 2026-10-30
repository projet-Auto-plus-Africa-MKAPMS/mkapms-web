/**
 * Coffre personnel de connexions aux sites internet — un par compte (ownerId = soi-même,
 * jamais le coffre d'entreprise du PDG). Chaque utilisateur peut y déposer les identifiants
 * d'un site tiers (ex. Le Bon Coin) pour qu'AL-HOUDOUD·M puisse s'en servir plus tard, sans
 * jamais les afficher en clair une fois déposés : on ne peut que les remplacer ou les
 * supprimer, exactement comme le coffre PDG (server/intelligences/coffre.ts).
 */
import { useRef, useState } from "react";
import { KeyRound, Plus, RefreshCw, Trash2 } from "lucide-react";
import { trpc } from "../lib/trpc";

interface Valeur {
  identifiant: string;
  motDePasse: string;
  adresse: string;
}
const VALEUR_VIDE: Valeur = { identifiant: "", motDePasse: "", adresse: "" };

export default function ConnexionsSites() {
  const utils = trpc.useUtils();
  const etat = trpc.intelligences.connexionsEtat.useQuery(undefined, { refetchOnWindowFocus: false });
  const secrets = trpc.intelligences.connexionsListe.useQuery(undefined, { refetchOnWindowFocus: false });
  const codeEtat = trpc.intelligences.connexionsCodeEtat.useQuery(undefined, { refetchOnWindowFocus: false });

  const [codeSecret, setCodeSecret] = useState("");
  const [nouveauCode, setNouveauCode] = useState("");
  const [nomSite, setNomSite] = useState("");
  const [valeur, setValeur] = useState<Valeur>(VALEUR_VIDE);
  const [message, setMessage] = useState("");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [remplacementId, setRemplacementId] = useState<number | null>(null);
  const [valeurRemplacement, setValeurRemplacement] = useState<Valeur>(VALEUR_VIDE);
  const formulaire = useRef<HTMLDivElement>(null);

  const rafraichir = async () => {
    await Promise.all([utils.intelligences.connexionsEtat.invalidate(), utils.intelligences.connexionsListe.invalidate()]);
  };

  const ajouter = trpc.intelligences.connexionsAjouter.useMutation({
    onSuccess: async (r) => {
      setMessage(r.detail);
      if (r.ok) { setNomSite(""); setValeur(VALEUR_VIDE); setFormulaireOuvert(false); await rafraichir(); }
    },
    onError: (e) => setMessage(e.message),
  });
  const remplacer = trpc.intelligences.connexionsRemplacer.useMutation({
    onSuccess: async (r) => {
      setMessage(r.detail);
      if (r.ok) { setRemplacementId(null); setValeurRemplacement(VALEUR_VIDE); await rafraichir(); }
    },
    onError: (e) => setMessage(e.message),
  });
  const supprimer = trpc.intelligences.connexionsSupprimer.useMutation({
    onSuccess: async (r) => { setMessage(r.detail); await rafraichir(); },
    onError: (e) => setMessage(e.message),
  });
  const definirCode = trpc.intelligences.connexionsCodeDefinir.useMutation({
    onSuccess: async () => { setMessage("Code secret enregistré."); setNouveauCode(""); await utils.intelligences.connexionsCodeEtat.invalidate(); },
    onError: (e) => setMessage(e.message),
  });

  const disponible = etat.data?.disponible === true;
  const codeConfigure = codeEtat.data?.configure === true;
  const longueurCode = codeEtat.data?.longueurRequise ?? 6;

  function ouvrirFormulaire() {
    setMessage("");
    setNomSite(""); setValeur(VALEUR_VIDE);
    setFormulaireOuvert(true);
    window.setTimeout(() => formulaire.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function enregistrerConnexion() {
    if (nomSite.trim().length < 2) { setMessage("Donnez un nom au site (ex. Le Bon Coin)."); return; }
    if (!valeur.identifiant.trim() || !valeur.motDePasse) { setMessage("Renseignez l'identifiant (ou e-mail) et le mot de passe."); return; }
    setMessage("");
    ajouter.mutate({
      nom: nomSite.trim(),
      contenu: { type: "identifiants", identifiant: valeur.identifiant.trim(), motDePasse: valeur.motDePasse, ...(valeur.adresse.trim() ? { adresse: valeur.adresse.trim() } : {}) },
      codeSecret,
    });
  }

  function enregistrerRemplacement(id: number) {
    if (!valeurRemplacement.identifiant.trim() || !valeurRemplacement.motDePasse) { setMessage("Renseignez l'identifiant et le mot de passe."); return; }
    setMessage("");
    remplacer.mutate({
      id,
      contenu: { type: "identifiants", identifiant: valeurRemplacement.identifiant.trim(), motDePasse: valeurRemplacement.motDePasse, ...(valeurRemplacement.adresse.trim() ? { adresse: valeurRemplacement.adresse.trim() } : {}) },
      codeSecret,
    });
  }

  const retirer = (id: number, nom: string) => {
    if (window.confirm(`Supprimer définitivement la connexion « ${nom} » ?`)) supprimer.mutate({ id, codeSecret });
  };

  return (
    <section className="space-y-4" aria-label="Connexions aux sites internet">
      <div className="rounded-xl border border-black/10 p-4 space-y-2">
        <h2 className="flex items-center gap-2 text-base font-black"><KeyRound className="h-4 w-4" /> Connexions aux sites internet</h2>
        <p className="text-sm text-black/70">
          Enregistrez ici les identifiants des sites que vous voulez utiliser avec votre assistant IA (Le Bon Coin, une autre
          plateforme de petites annonces, un site professionnel…). Une fois déposés, vos mots de passe sont chiffrés et ne sont
          plus jamais affichés nulle part — ni ici, ni dans les conversations, ni dans un espace d'administration : on ne peut
          que les remplacer ou les supprimer.
        </p>
        <p className="text-xs text-black/60">Votre coffre est strictement personnel : personne d'autre, y compris la Direction, ne peut consulter vos connexions.</p>
        <button type="button" onClick={ouvrirFormulaire} className="inline-flex items-center gap-1 rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white">
          <Plus className="h-4 w-4" /> Ajouter une connexion
        </button>
      </div>

      <div className="rounded-xl border border-black/10 p-4 space-y-2" aria-label="Code secret">
        <h3 className="text-sm font-black">Votre code secret · {longueurCode} chiffres</h3>
        <p className="text-xs text-black/60">Demandé avant chaque dépôt, remplacement ou suppression, pour confirmer que c'est bien vous.</p>
        <label className="block text-xs">
          {codeConfigure ? "Nouveau code" : "Choisissez votre code"}
          <input type="password" inputMode="numeric" pattern={`[0-9]{${longueurCode}}`} maxLength={longueurCode} value={nouveauCode}
            onChange={(e) => setNouveauCode(e.target.value.replace(/\D/g, "").slice(0, longueurCode))} autoComplete="off"
            className="mt-1 w-full max-w-[160px] rounded-lg border p-2 text-sm" />
        </label>
        <button type="button" disabled={definirCode.isPending || nouveauCode.length !== longueurCode} onClick={() => definirCode.mutate({ code: nouveauCode })}
          className="rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">
          {definirCode.isPending ? "Enregistrement…" : codeConfigure ? "Changer mon code" : "Activer mon code"}
        </button>
        <label className="block pt-2 text-xs font-bold">
          Code à fournir pour les actions ci-dessous
          <input type="password" inputMode="numeric" value={codeSecret} onChange={(e) => setCodeSecret(e.target.value.replace(/\D/g, ""))}
            autoComplete="off" placeholder={codeConfigure ? "Votre code" : "Configurez d'abord votre code ci-dessus"}
            className="mt-1 w-full max-w-[160px] rounded-lg border p-2 text-sm font-normal" />
        </label>
      </div>

      {etat.isLoading ? <p className="text-xs" role="status">Vérification…</p> : null}
      {etat.data && !disponible ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50/40 p-4 text-sm text-red-700">
          Coffre indisponible pour le moment : {etat.data.motif}
        </p>
      ) : null}

      {message ? <p role="status" className="rounded-lg border border-black/10 bg-black/[0.03] p-3 text-sm">{message}</p> : null}

      {formulaireOuvert ? (
        <div ref={formulaire} className="rounded-xl border border-black/10 p-4 space-y-3" aria-label="Ajouter une connexion">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black">Nouvelle connexion</h3>
            <button type="button" onClick={() => { setFormulaireOuvert(false); setMessage(""); }} className="rounded border px-2 py-1 text-xs font-bold">Annuler</button>
          </div>
          <label className="block text-xs">
            Nom du site
            <input value={nomSite} onChange={(e) => setNomSite(e.target.value)} disabled={!disponible || ajouter.isPending} maxLength={120}
              autoComplete="off" placeholder="ex. Le Bon Coin" className="mt-1 w-full rounded-lg border p-2 text-sm" />
          </label>
          <label className="block text-xs">
            Adresse du site internet (facultatif)
            <input value={valeur.adresse} onChange={(e) => setValeur({ ...valeur, adresse: e.target.value })} disabled={!disponible || ajouter.isPending} maxLength={300}
              autoComplete="off" placeholder="https://www.leboncoin.fr" className="mt-1 w-full rounded-lg border p-2 text-sm" />
          </label>
          <label className="block text-xs">
            Identifiant ou adresse e-mail
            <input value={valeur.identifiant} onChange={(e) => setValeur({ ...valeur, identifiant: e.target.value })} disabled={!disponible || ajouter.isPending} maxLength={200}
              autoComplete="off" spellCheck={false} className="mt-1 w-full rounded-lg border p-2 text-sm" />
          </label>
          <label className="block text-xs">
            Mot de passe
            <input type="password" value={valeur.motDePasse} onChange={(e) => setValeur({ ...valeur, motDePasse: e.target.value })} disabled={!disponible || ajouter.isPending} maxLength={500}
              autoComplete="new-password" spellCheck={false} className="mt-1 w-full rounded-lg border p-2 text-sm" />
          </label>
          <button type="button" onClick={enregistrerConnexion} disabled={!disponible || !codeConfigure || ajouter.isPending}
            className="rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">
            {ajouter.isPending ? "Chiffrement…" : "Enregistrer cette connexion"}
          </button>
        </div>
      ) : null}

      <div className="rounded-xl border border-black/10 p-4 space-y-2">
        <h3 className="text-sm font-black">Vos connexions enregistrées</h3>
        {secrets.isLoading ? <p className="text-xs">Chargement…</p> : null}
        {!secrets.isLoading && (secrets.data ?? []).length === 0 ? <p className="text-xs text-black/60">Aucune connexion enregistrée pour le moment.</p> : null}
        <ul className="divide-y divide-black/5">
          {(secrets.data ?? []).map((s) => (
            <li key={s.id} className="space-y-2 py-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <strong>{s.nom}</strong>
                  <span className="block text-xs text-black/60">{s.apercu}{s.dernierUsageAt ? ` · utilisée le ${new Date(s.dernierUsageAt).toLocaleString("fr-FR")}` : " · jamais utilisée"}</span>
                </span>
                <span className="flex shrink-0 gap-1">
                  <button type="button" disabled={remplacer.isPending}
                    onClick={() => { setRemplacementId(remplacementId === s.id ? null : s.id); setValeurRemplacement(VALEUR_VIDE); setMessage(""); }}
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded border px-2 py-1 text-xs font-bold"><RefreshCw className="h-3 w-3" /> Remplacer</button>
                  <button type="button" disabled={supprimer.isPending || !codeConfigure} onClick={() => retirer(s.id, s.nom)}
                    aria-label={`Supprimer ${s.nom}`} className="rounded border px-2 py-1 text-xs font-bold text-red-700"><Trash2 className="h-3 w-3" /></button>
                </span>
              </div>
              {remplacementId === s.id ? (
                <div className="space-y-2 rounded-lg border p-3">
                  <label className="block text-xs">
                    Adresse du site (facultatif)
                    <input value={valeurRemplacement.adresse} onChange={(e) => setValeurRemplacement({ ...valeurRemplacement, adresse: e.target.value })} disabled={remplacer.isPending} maxLength={300}
                      autoComplete="off" className="mt-1 w-full rounded-lg border p-2 text-sm" />
                  </label>
                  <label className="block text-xs">
                    Identifiant ou e-mail
                    <input value={valeurRemplacement.identifiant} onChange={(e) => setValeurRemplacement({ ...valeurRemplacement, identifiant: e.target.value })} disabled={remplacer.isPending} maxLength={200}
                      autoComplete="off" spellCheck={false} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                  </label>
                  <label className="block text-xs">
                    Nouveau mot de passe
                    <input type="password" value={valeurRemplacement.motDePasse} onChange={(e) => setValeurRemplacement({ ...valeurRemplacement, motDePasse: e.target.value })} disabled={remplacer.isPending} maxLength={500}
                      autoComplete="new-password" spellCheck={false} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                  </label>
                  <button type="button" disabled={remplacer.isPending || !codeConfigure} onClick={() => enregistrerRemplacement(s.id)}
                    className="rounded-lg bg-[#111] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">
                    {remplacer.isPending ? "Chiffrement…" : "Remplacer la valeur"}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
