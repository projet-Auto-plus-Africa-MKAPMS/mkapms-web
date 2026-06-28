import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users, Search, Plus, UserPlus, Mail, Phone, Briefcase, Edit2, Trash2, CheckCircle, X } from "lucide-react";

const INITIAL_EMPLOYES = [
  { id: 1, nom: "Jean Dupont", email: "j.dupont@mkapms.com", poste: "Mécanicien Senior", tel: "01 23 45 67 89", statut: "actif", dateArrivee: "12/05/2023" },
  { id: 2, nom: "Marie Laurent", email: "m.laurent@mkapms.com", poste: "Réceptionniste", tel: "01 98 76 54 32", statut: "actif", dateArrivee: "01/02/2024" },
  { id: 3, nom: "Kevin Martin", email: "k.martin@mkapms.com", poste: "Apprenti", tel: "06 12 34 56 78", statut: "conges", dateArrivee: "15/09/2023" },
];

export default function EmployesUtilisateur() {
  const [employes, setEmployes] = useState(INITIAL_EMPLOYES);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = employes.filter(e => 
    e.nom.toLowerCase().includes(search.toLowerCase()) || 
    e.poste.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (emp: any) => {
    setEditingId(emp.id);
    setEditForm({ ...emp });
  };

  const saveEdit = () => {
    setEmployes(prev => prev.map(e => e.id === editingId ? editForm : e));
    setEditingId(null);
    setToast("Employé mis à jour avec succès");
    setTimeout(() => setToast(null), 3000);
  };

  const deleteEmp = (id: number) => {
    if (confirm("Supprimer cet employé ?")) {
      setEmployes(prev => prev.filter(e => e.id !== id));
      setToast("Employé supprimé");
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 text-white">
      {/* Header */}
      <div className="bg-[#111] px-4 pt-6 pb-5 border-b border-white/5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 hover:text-[#D4AF37] transition-colors">
          <ChevronLeft size={12} /> Mon compte
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 tracking-tighter italic uppercase">ÉQUIPE</h1>
            <p className="mt-1 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest opacity-80">
              {employes.length} collaborateurs enregistrés
            </p>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="h-12 w-12 rounded-2xl bg-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 active:scale-90 transition-all"
          >
            <UserPlus size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-2xl bg-green-600 text-white px-6 py-3 text-sm font-black shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {/* Search */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5 focus-within:border-[#D4AF37]/50 transition-all">
          <Search size={16} className="text-white/30" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Rechercher un collaborateur..." 
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20 font-medium" 
          />
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-6 space-y-3">
        {filtered.map((emp) => (
          <div key={emp.id} className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden transition-all hover:border-[#D4AF37]/30">
            <div className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20 text-[#D4AF37]">
                <Users size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white tracking-tight">{emp.nom}</p>
                <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mt-0.5">{emp.poste}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEdit(emp)}
                  className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => deleteEmp(emp.id)}
                  className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                <Mail size={12} className="text-[#D4AF37]" /> {emp.email}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                <Phone size={12} className="text-[#D4AF37]" /> {emp.tel}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Users size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Aucun collaborateur trouvé</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111] rounded-3xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-10">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-black italic tracking-tighter uppercase">Modifier le profil</h2>
              <button onClick={() => setEditingId(null)} className="text-white/20 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1 block">Nom complet</label>
                <input 
                  value={editForm.nom} 
                  onChange={e => setEditForm({...editForm, nom: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1 block">Poste / Fonction</label>
                <input 
                  value={editForm.poste} 
                  onChange={e => setEditForm({...editForm, poste: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1 block">Email professionnel</label>
                <input 
                  value={editForm.email} 
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1 block">Téléphone</label>
                <input 
                  value={editForm.tel} 
                  onChange={e => setEditForm({...editForm, tel: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <button 
                onClick={saveEdit}
                className="w-full bg-[#D4AF37] py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl shadow-[#D4AF37]/20 active:scale-95 transition-all mt-4"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal Placeholder (same as Edit but with empty form) */}
      {showAdd && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111] rounded-3xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-10">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-black italic tracking-tighter uppercase">Ajouter un collaborateur</h2>
              <button onClick={() => setShowAdd(false)} className="text-white/20 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-white/40 text-xs text-center mb-4">Complétez les informations pour inviter un nouveau membre dans votre équipe.</p>
              <input placeholder="Nom complet" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50" />
              <input placeholder="Poste" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50" />
              <input placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#D4AF37]/50" />
              <button 
                onClick={() => { setShowAdd(false); setToast("Invitation envoyée"); setTimeout(() => setToast(null), 3000); }}
                className="w-full bg-[#D4AF37] py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl shadow-[#D4AF37]/20 active:scale-95 transition-all mt-4"
              >
                Envoyer l'invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
