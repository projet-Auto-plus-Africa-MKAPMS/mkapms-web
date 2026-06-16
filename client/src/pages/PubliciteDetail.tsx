import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, Trash2, Pause, Play, CheckCircle, XCircle, ExternalLink } from "lucide-react";

const DEMO_DEMANDES = [
  { id: "PUB-001", entreprise: "AutoPièces Express", type: "Vendeur de pièces", emplacement: "Page produit — Carrousel #4", status: "en_attente", tel: "06 12 34 56 78", email: "contact@autopieces-express.fr", desc: "Ouverture magasin Sarcelles — pièces neuves toutes marques. Publicité image + lien vers notre site.", lien: "https://autopieces-express.fr", duree: "1 semaine", adresse: "12 Rue de la Gare, 95200 Sarcelles", siret: "123 456 789 00012", dateDepot: "05/06/2024", contact: "M. Diallo Moussa", typeContenu: "photo", photoUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop", tarif: "180€" },
  { id: "PUB-002", entreprise: "Garage Saint-Denis", type: "Réparateur / Garage", emplacement: "Page accueil — Carrousel #1", status: "en_attente", tel: "01 49 33 22 11", email: "info@garage-stdenis.fr", desc: "Vidange + contrôle technique à 59€. Promo été 2024.", lien: "https://garage-stdenis.fr", duree: "1 mois", adresse: "45 Avenue du Président Wilson, 93200 Saint-Denis", siret: "987 654 321 00034", dateDepot: "03/06/2024", contact: "M. Traoré Ibrahim", typeContenu: "lien", photoUrl: "", tarif: "500€" },
  { id: "PUB-003", entreprise: "CleanCar 95", type: "Service lavage", emplacement: "Page produit — Carrousel #4", status: "approuvée", tel: "07 88 99 00 11", email: "cleancar95@gmail.com", desc: "Nettoyage complet intérieur/extérieur 49€ — Belloy-en-France", lien: "https://cleancar95.fr", duree: "3 jours", adresse: "8 Zone Industrielle, 95270 Belloy-en-France", siret: "456 789 123 00056", dateDepot: "01/06/2024", contact: "Mme Camara Aïssatou", typeContenu: "photo", photoUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&h=400&fit=crop", tarif: "90€" },
];

export default function PubliciteDetail() {
  const { id } = useParams();
  const demande = DEMO_DEMANDES.find((d) => d.id === id) || DEMO_DEMANDES[0];
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(demande);

  return (
    <div className="container-page py-6">
      <Link to="/compte" className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-[#D4AF37]">
        <ArrowLeft size={16} /> Retour aux publicités
      </Link>

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111]">{demande.entreprise}</h1>
          <p className="text-sm text-slate-500">{demande.id} · Déposée le {demande.dateDepot}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${demande.status === "approuvée" ? "bg-green-100 text-green-700" : demande.status === "en_attente" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
          {demande.status === "approuvée" ? "Approuvée" : demande.status === "en_attente" ? "En attente" : "Refusée"}
        </span>
      </div>

      {/* Actions PDG */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setEditing(!editing)} className="flex items-center gap-1 rounded-lg bg-[#111] px-4 py-2 text-xs font-bold text-white hover:bg-[#333]">
          <Edit3 size={14} /> Modifier
        </button>
        {demande.status === "en_attente" && (
          <>
            <button className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700">
              <CheckCircle size={14} /> Approuver
            </button>
            <button className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">
              <XCircle size={14} /> Refuser
            </button>
          </>
        )}
        {demande.status === "approuvée" && (
          <button className="flex items-center gap-1 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600">
            <Pause size={14} /> Mettre en pause
          </button>
        )}
        <button className="flex items-center gap-1 rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-300">
          <Play size={14} /> Remettre en ligne
        </button>
        <button className="flex items-center gap-1 rounded-lg bg-red-100 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-200">
          <Trash2 size={14} /> Supprimer
        </button>
      </div>

      {/* Contenu visuel */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-slate-700">Visuel de la publicité</h2>
        {demande.typeContenu === "photo" && demande.photoUrl ? (
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
            <img src={demande.photoUrl} alt={demande.entreprise} className="h-48 w-full object-cover" />
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <ExternalLink size={16} className="text-[#D4AF37]" />
            <a href={demande.lien} target="_blank" rel="noopener noreferrer" className="text-sm text-[#D4AF37] underline">{demande.lien}</a>
          </div>
        )}
        <p className="mt-1 text-[10px] text-slate-400">Type de contenu : {demande.typeContenu === "photo" ? "Image/Photo" : "Lien externe"}</p>
      </div>

      {/* Informations complètes */}
      <div className="mt-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-700">Informations de l'annonceur</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: "Entreprise", value: editData.entreprise },
            { label: "Contact", value: editData.contact },
            { label: "Type d'activité", value: editData.type },
            { label: "Téléphone", value: editData.tel },
            { label: "Email", value: editData.email },
            { label: "Adresse complète", value: editData.adresse },
            { label: "SIRET", value: editData.siret },
            { label: "Lien du site", value: editData.lien },
          ].map((field) => (
            <div key={field.label} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">{field.label}</p>
              {editing ? (
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={field.value}
                  onChange={(e) => setEditData({ ...editData, [field.label.toLowerCase().replace(/ /g, "_")]: e.target.value })}
                />
              ) : (
                <p className="mt-0.5 text-sm text-slate-800">{field.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Détails de la publicité */}
      <div className="mt-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-700">Détails de la publicité</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: "Emplacement choisi", value: editData.emplacement },
            { label: "Durée demandée", value: editData.duree },
            { label: "Tarif", value: editData.tarif },
            { label: "Date de dépôt", value: editData.dateDepot },
          ].map((field) => (
            <div key={field.label} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">{field.label}</p>
              {editing ? (
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={field.value}
                  onChange={() => {}}
                />
              ) : (
                <p className="mt-0.5 text-sm text-slate-800">{field.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-slate-700">Description de l'annonce</h2>
        {editing ? (
          <textarea className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm" rows={3} value={editData.desc} onChange={(e) => setEditData({ ...editData, desc: e.target.value })} />
        ) : (
          <p className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">{demande.desc}</p>
        )}
      </div>

      {editing && (
        <div className="mt-6 flex gap-2">
          <button onClick={() => setEditing(false)} className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028]">Enregistrer les modifications</button>
          <button onClick={() => { setEditing(false); setEditData(demande); }} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600">Annuler</button>
        </div>
      )}
    </div>
  );
}
