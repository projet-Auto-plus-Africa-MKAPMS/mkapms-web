/**
 * Étape 12 du parcours VO — attestation de cession et attestation de vente.
 *
 * Le parcours s'arrêtait à la vente : le vendeur n'avait aucune pièce écrite à
 * remettre au client. L'écran produit le document depuis le serveur (données
 * du véhicule et du vendeur réellement enregistrées), l'archive avec une
 * référence vérifiable, puis permet de l'imprimer ou de l'enregistrer en PDF.
 *
 * Aucune signature électronique à distance n'est annoncée : aucun prestataire
 * de signature n'est raccordé. Le document est signé sur place (nom du
 * signataire enregistré et horodaté) ou imprimé pour signature manuscrite.
 */
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, FileSignature, Printer, Loader2, ShieldCheck, PenLine } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { imprimerFeuille } from "../../lib/documents";

type TypeAttestation = "cession" | "vente";

const TITRES: Record<TypeAttestation, string> = {
  cession: "Attestation de cession",
  vente: "Attestation de vente complète",
};

export default function AttestationVente() {
  const params = useParams();
  const annonceId = Number(params.id);

  const [type, setType] = useState<TypeAttestation>("cession");
  const [immatriculation, setImmatriculation] = useState("");
  const [vin, setVin] = useState("");
  const [acheteurNom, setAcheteurNom] = useState("");
  const [acheteurAdresse, setAcheteurAdresse] = useState("");
  const [acheteurContact, setAcheteurContact] = useState("");
  const [prix, setPrix] = useState("");
  const [kilometrage, setKilometrage] = useState("");
  const [lieu, setLieu] = useState("");
  const [signataire, setSignataire] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const valide = Number.isFinite(annonceId) && annonceId > 0;

  const archive = trpc.voEspaces.attestations.liste.useQuery(
    { annonceId },
    { enabled: valide },
  );

  const generer = trpc.voEspaces.attestations.generer.useMutation({
    onSuccess: (doc) => {
      setMessage(null);
      archive.refetch();
      const ouvert = imprimerFeuille({
        titre: doc.titre,
        sousTitre: "MKA.P-MS — Auto Plus Africa",
        reference: doc.reference,
        informations: doc.champs.map((c) => ({ libelle: c.libelle, valeur: c.valeur })),
        mentions: [
          ...doc.mentions,
          doc.verification ? `Vérification du document : ${doc.verification}` : "",
        ].filter(Boolean),
        typeDocument: "attestation",
      });
      if (!ouvert) {
        setMessage(
          `Document ${doc.reference} enregistré et archivé, mais la fenêtre d'impression a été bloquée par le navigateur. Autorisez les fenêtres pour ce site, puis rouvrez le document depuis l'archive ci-dessous.`,
        );
      }
    },
    onError: (e) => setMessage(e.message.split("|")[0]),
  });

  const signer = trpc.voEspaces.attestations.signer.useMutation({
    onSuccess: () => {
      setMessage(null);
      setSignataire("");
      archive.refetch();
    },
    onError: (e) => setMessage(e.message.split("|")[0]),
  });

  const soumettre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valide) return;
    const contactEmail = acheteurContact.includes("@") ? acheteurContact.trim() : undefined;
    generer.mutate({
      annonceId,
      type,
      immatriculation: immatriculation.trim() || undefined,
      vin: vin.trim() || undefined,
      acheteurNom: acheteurNom.trim(),
      acheteurAdresse: acheteurAdresse.trim() || undefined,
      acheteurEmail: contactEmail,
      acheteurTelephone: contactEmail ? undefined : acheteurContact.trim() || undefined,
      prix: prix.trim() ? Number(prix.replace(",", ".")) : undefined,
      kilometrage: kilometrage.trim() ? Number(kilometrage) : undefined,
      lieu: lieu.trim() || undefined,
    });
  };

  if (!valide) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] p-6">
        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 text-center">
          <p className="text-sm text-[#6B7280]">
            Choisissez d'abord un véhicule dans votre stock pour éditer son attestation.
          </p>
          <Link to="/vente/stock" className="btn-primary mt-4 inline-flex">
            Mon stock VO
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/vente/stock" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Mon stock VO
        </Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <FileSignature size={20} /> Documents de vente
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Étape 12 : attestation de cession et attestation de vente complète, imprimables et
          archivées avec une référence vérifiable.
        </p>
      </div>

      {message && (
        <div className="mx-4 mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900">
          {message}
        </div>
      )}

      <form onSubmit={soumettre} className="px-4 mt-4 space-y-3">
        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF]">
            Type de document
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.keys(TITRES) as TypeAttestation[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-xl px-3 py-2 text-[11px] font-bold border transition ${
                  type === t
                    ? "bg-blue-800 text-white border-blue-800"
                    : "bg-white text-[#6B7280] border-[#E5E7EB]"
                }`}
              >
                {TITRES[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-[#111] border-b border-[#E5E7EB] pb-2">
            Acheteur
          </h2>
          <label className="block">
            <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">Nom et prénom</span>
            <input
              value={acheteurNom}
              onChange={(e) => setAcheteurNom(e.target.value)}
              required
              minLength={2}
              className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-sm outline-none focus:border-blue-800"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">Adresse</span>
            <input
              value={acheteurAdresse}
              onChange={(e) => setAcheteurAdresse(e.target.value)}
              className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-sm outline-none focus:border-blue-800"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">
              E-mail ou téléphone
            </span>
            <input
              value={acheteurContact}
              onChange={(e) => setAcheteurContact(e.target.value)}
              className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-sm outline-none focus:border-blue-800"
            />
          </label>
        </div>

        <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-[#111] border-b border-[#E5E7EB] pb-2">
            Véhicule et vente
          </h2>
          <p className="text-[10px] text-[#6B7280]">
            Marque, modèle, année et coordonnées du vendeur sont reprises du dossier enregistré.
            Complétez ici ce qui n'y figure pas.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">
                Immatriculation
              </span>
              <input
                value={immatriculation}
                onChange={(e) => setImmatriculation(e.target.value)}
                className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm outline-none focus:border-blue-800"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">N° de série</span>
              <input
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm outline-none focus:border-blue-800"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">
                Kilométrage relevé
              </span>
              <input
                value={kilometrage}
                onChange={(e) => setKilometrage(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm outline-none focus:border-blue-800"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">Prix convenu</span>
              <input
                value={prix}
                onChange={(e) => setPrix(e.target.value.replace(/[^0-9.,]/g, ""))}
                inputMode="decimal"
                className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm outline-none focus:border-blue-800"
              />
            </label>
            <label className="block col-span-2">
              <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">
                Lieu de la vente
              </span>
              <input
                value={lieu}
                onChange={(e) => setLieu(e.target.value)}
                className="w-full mt-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm outline-none focus:border-blue-800"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={generer.isPending}
          className="w-full rounded-xl bg-blue-800 py-4 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {generer.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Printer size={18} />
          )}
          {generer.isPending ? "Édition du document…" : `Générer et imprimer — ${TITRES[type]}`}
        </button>
        <p className="text-[10px] text-[#6B7280] text-center px-4">
          La fenêtre d'impression permet aussi d'enregistrer le document en PDF pour l'envoyer au
          client. Aucune signature électronique à distance n'est proposée aujourd'hui.
        </p>
      </form>

      <div className="px-4 mt-5">
        <h2 className="text-sm font-bold text-[#111] flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#D4AF37]" /> Documents archivés
        </h2>
        <div className="mt-2 space-y-2">
          {archive.isLoading && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center text-sm text-[#6B7280]">
              Chargement de l'archive…
            </div>
          )}
          {!archive.isLoading && (archive.data?.length ?? 0) === 0 && (
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center text-[11px] text-[#6B7280]">
              Aucune attestation encore éditée pour ce véhicule.
            </div>
          )}
          {(archive.data ?? []).map((d) => (
            <div key={d.documentId} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">
                    {TITRES[(d.type as TypeAttestation) ?? "cession"] ?? d.type}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">
                    Réf. {d.reference}
                    {d.emiseLe
                      ? ` · émis le ${new Date(d.emiseLe).toLocaleDateString("fr-FR")}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold text-white ${
                    d.signeeLe ? "bg-green-700" : "bg-amber-500"
                  }`}
                >
                  {d.signeeLe ? "Signé" : "Non signé"}
                </span>
              </div>
              {d.signeeLe ? (
                <p className="mt-2 text-[10px] text-[#6B7280]">
                  Signé sur place par {d.signataire} le{" "}
                  {new Date(d.signeeLe).toLocaleString("fr-FR")}.
                </p>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    value={signataire}
                    onChange={(e) => setSignataire(e.target.value)}
                    placeholder="Nom du signataire présent"
                    className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[11px] outline-none focus:border-blue-800"
                  />
                  <button
                    type="button"
                    disabled={signataire.trim().length < 2 || signer.isPending}
                    onClick={() =>
                      signer.mutate({ documentId: d.documentId, signataire: signataire.trim() })
                    }
                    className="rounded-xl bg-[#111] px-3 py-2 text-[11px] font-bold text-white flex items-center gap-1 disabled:opacity-40"
                  >
                    <PenLine size={13} /> Signer
                  </button>
                </div>
              )}
              {d.verification && (
                <p className="mt-2 text-[9px] text-[#9CA3AF] break-all">
                  Vérification : {d.verification}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
