import { useEffect, useRef, useState } from "react";
import { Menu, Plus, Search, X } from "lucide-react";
import { trpc } from "../../lib/trpc";
import "./workspace.css";

export const ASSISTANT_PUBLIC_NAME = "AL-HUDHUD·M";

/** No substitute artwork: a logo is rendered only after an approved local asset is configured. */
export function AssistantBrand({ compact = false }: { compact?: boolean }) {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/ai-identity.json", { signal: controller.signal, credentials: "same-origin" })
      .then(r => r.ok ? r.json() : null)
      .then((identity: { logo?: unknown; assetStatus?: unknown } | null) => {
        if (identity?.assetStatus === "APPROVED" && typeof identity.logo === "string" && /^\/assets\/[a-zA-Z0-9_./-]+\.(png|webp|svg|jpg)$/.test(identity.logo) && !identity.logo.includes("..")) setLogo(identity.logo);
      })
      .catch(() => { /* Keep the truthful text identity; never invent or redraw a logo. */ });
    return () => controller.abort();
  }, []);
  if (compact && !logo) return null;
  return <span className="alhud-brand">
    {logo ? <img src={logo} alt={compact ? ASSISTANT_PUBLIC_NAME : ""} className="alhud-brand-logo" onError={() => setLogo(null)} /> : null}
    {!compact ? <span>{ASSISTANT_PUBLIC_NAME}</span> : null}
  </span>;
}

export interface WorkspaceRailProps {
  tabs: readonly { cle: string; label: string }[];
  groups: readonly { titre: string; onglets: readonly string[] }[];
  active: string;
  sessionId: number | null;
  busy: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onChoose: (key: string) => void;
  onNew: () => void;
  onConversation: (id: number) => void;
}

/** Uses the existing owner-filtered conversation API, never a second history store. */
export function WorkspaceRail(props: WorkspaceRailProps) {
  const [query, setQuery] = useState("");
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
  const drawer = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const conversations = trpc.intelligences.conversations.useQuery({ cote: "direction" }, { refetchOnWindowFocus: false });
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const change = () => setDesktop(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const dialog = drawer.current;
    if (!dialog || desktop) return;
    if (props.mobileOpen && !dialog.open) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      search.current?.focus();
    } else if (!props.mobileOpen && dialog.open) {
      dialog.close();
      returnFocus.current?.focus();
    }
    return () => { if (dialog.open) dialog.close(); };
  }, [props.mobileOpen, desktop]);
  const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const matches = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().includes(normalized);
  const choose = (key: string) => { props.onChoose(key); props.onClose(); };
  const body = <>
    <div className="alhud-rail-heading"><AssistantBrand />
      {!desktop ? <button type="button" onClick={props.onClose} aria-label="Fermer le panneau" className="alhud-icon-control"><X size={18} /></button> : null}
    </div>
    <p className="alhud-caption">Plateforme principale · espace privé</p>
    <button type="button" className="alhud-new-chat" disabled={props.busy} onClick={() => { props.onNew(); props.onClose(); }}><Plus size={17} /> Nouvelle conversation</button>
    <label className="alhud-search"><Search size={16} aria-hidden="true" /><input ref={search} type="search" value={query} onChange={e => setQuery(e.target.value)} aria-label="Rechercher un outil ou une conversation" placeholder="Rechercher…" /></label>
    <div className="alhud-rail-scroll">
      <nav aria-label="Outils AL-HUDHUD·M" className="alhud-tools">
        <button type="button" aria-current={props.active === "echange" ? "page" : undefined} onClick={() => choose("echange")}>Conversation en cours</button>
        {props.groups.map(group => {
          const items = props.tabs.filter(tab => group.onglets.includes(tab.cle) && (matches(tab.label) || matches(group.titre)));
          return items.length ? <section key={group.titre}><h2>{group.titre}</h2>{items.map(tab => <button key={tab.cle} type="button" aria-current={props.active === tab.cle ? "page" : undefined} onClick={() => choose(tab.cle)}>{tab.label}</button>)}</section> : null;
        })}
      </nav>
      <section className="alhud-history" aria-label="Conversations enregistrées">
        <h2>Conversations</h2>
        {conversations.isLoading ? <p role="status">Chargement de l’historique…</p> : null}
        {conversations.isError ? <><p role="alert">L’historique n’a pas pu être chargé. Aucune conversation n’a été supprimée.</p><button type="button" onClick={() => void conversations.refetch()}>Réessayer</button></> : null}
        {(conversations.data ?? []).filter(c => matches(c.titre || "Sans titre")).map(c => <button key={c.id} type="button" disabled={props.busy} aria-current={props.sessionId === c.id ? "page" : undefined} title={c.titre || "Sans titre"} onClick={() => { props.onConversation(c.id); props.onClose(); }}>{c.titre || "Sans titre"}</button>)}
        {!conversations.isLoading && !conversations.isError && !(conversations.data ?? []).some(c => matches(c.titre || "Sans titre")) ? <p>{query ? "Aucune conversation ne correspond à cette recherche." : "Vos conversations enregistrées apparaîtront ici."}</p> : null}
      </section>
    </div>
    <p className="alhud-caption">Les outils existants sont conservés. Aucun changement d’autorisation à l’ouverture.</p>
  </>;
  return desktop ? <aside className="alhud-rail">{body}</aside> : <dialog ref={drawer} onClose={() => returnFocus.current?.focus()} className="alhud-drawer" aria-label="Conversations et outils AL-HUDHUD·M" onCancel={e => { e.preventDefault(); props.onClose(); }} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) props.onClose(); } }}>{body}</dialog>;
}

export function WorkspaceMenuButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return <button type="button" className="alhud-menu-button" aria-haspopup="dialog" aria-expanded={open} onClick={onClick}><Menu size={18} /><span>Conversations et outils</span></button>;
}
