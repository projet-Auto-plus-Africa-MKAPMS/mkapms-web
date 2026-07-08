import { useState } from "react";
import {
  MessageSquare, Search, Send, Paperclip, Image, FileText,
  Mic, ChevronLeft, Check, CheckCheck, Phone, MoreVertical
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   MESSAGERIE INTERNE UNIQUE
   Aucune information importante par WhatsApp. Tout passe dans MKA.P-MS.
   Photos, PDF, Factures, Contrats, Messages vocaux, Historique complet.
   ══════════════════════════════════════════════════════════════════════════ */

type Conversation = { id: number; nom: string; avatar: string; dernier: string; date: string; nonLu: number; type: string };
type Msg = { id: number; envoyeur: string; contenu: string; heure: string; type: string };

// Aucune conversation fictive : la messagerie reste vide tant qu'il n'y a pas de vrais messages.
const CONVERSATIONS: Conversation[] = [];

export default function Messagerie() {
  const [view, setView] = useState<"list" | "chat">("list");
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<Msg[]>([]);

  function sendMessage() {
    if (!message.trim()) return;
    setLocalMessages((prev) => [
      ...prev,
      { id: prev.length + 1, envoyeur: "moi", contenu: message.trim(), heure: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), type: "texte" },
    ]);
    setMessage("");
  }

  function handleDownloadPdf(filename: string) {
    const blob = new Blob([`Document ${filename} — MKA.P-MS`], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredConvs = CONVERSATIONS.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  const openChat = (conv: Conversation) => {
    setActiveConv(conv);
    setView("chat");
  };

  if (view === "chat" && activeConv) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex flex-col">
        {/* Header chat */}
        <div className="bg-[#111] px-4 py-3 flex items-center gap-3">
          <button onClick={() => setView("list")} className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-white">{activeConv.nom}</h2>
            <p className="text-[10px] text-white/50">En ligne</p>
          </div>
          <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Phone size={14} className="text-white" />
          </button>
          <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <MoreVertical size={14} className="text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {localMessages.map((m) => {
            const isMoi = m.envoyeur === "moi";
            return (
              <div key={m.id} className={`flex ${isMoi ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMoi ? "bg-[#D4AF37] text-white rounded-br-sm" : "bg-white text-[#111] border border-[#E5E7EB] rounded-bl-sm"}`}>
                  {m.type === "pdf" ? (
                    <button onClick={() => handleDownloadPdf(m.contenu)} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isMoi ? "bg-white/20" : "bg-red-50"}`}>
                        <FileText size={14} className={isMoi ? "text-white" : "text-red-500"} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold">{m.contenu}</p>
                        <p className={`text-[10px] ${isMoi ? "text-white/70" : "text-[#6B7280]"}`}>PDF · Télécharger</p>
                      </div>
                    </button>
                  ) : (
                    <p className="text-sm leading-relaxed">{m.contenu}</p>
                  )}
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isMoi ? "text-white/60" : "text-[#9CA3AF]"}`}>
                    <span className="text-[9px]">{m.heure}</span>
                    {isMoi && <CheckCheck size={10} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-[#E5E7EB] px-4 py-3 flex items-center gap-2" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F3EF]">
            <Paperclip size={16} className="text-[#6B7280]" />
          </button>
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F3EF]">
            <Image size={16} className="text-[#6B7280]" />
          </button>
          <div className="flex-1 flex items-center rounded-full bg-[#F5F3EF] px-3 py-2">
            <input type="text" placeholder="Écrire un message…" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} className="w-full bg-transparent text-sm outline-none" />
          </div>
          {message ? (
            <button onClick={sendMessage} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] hover:bg-[#C4A030] active:scale-95 transition">
              <Send size={14} className="text-white" />
            </button>
          ) : (
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]">
              <Mic size={14} className="text-white" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white">Messagerie</h1>
        <p className="mt-0.5 text-sm text-white/60">Toutes vos conversations MKA.P-MS</p>
      </div>

      {/* Search */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input type="text" placeholder="Rechercher une conversation…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      {/* Info banner */}
      <div className="mx-4 mt-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-3">
        <p className="text-xs text-[#111] font-semibold text-center">
          Toutes les communications passent par MKA.P-MS. Aucune information par WhatsApp.
        </p>
      </div>

      {/* Conversations */}
      <div className="px-4 mt-4 space-y-2">
        {filteredConvs.map((c) => (
          <button key={c.id} onClick={() => openChat(c)} className="w-full flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 text-left active:scale-[0.99] transition">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F5F3EF] text-xl">{c.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111] truncate">{c.nom}</h3>
                <span className="text-[10px] text-[#9CA3AF] shrink-0">{c.date}</span>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5 truncate">{c.dernier}</p>
            </div>
            {c.nonLu > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] font-bold text-white">{c.nonLu}</span>
            )}
          </button>
        ))}
      </div>

      {filteredConvs.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <MessageSquare size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune conversation</p>
        </div>
      )}
    </div>
  );
}
