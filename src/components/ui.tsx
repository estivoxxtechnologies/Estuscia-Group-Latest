import { ReactNode, useEffect, useState } from 'react';

/** Masked word-by-word headline. *text* = gold italic, \n = line break. Reveal is CSS-driven when its panel is .on */
export function Split({ text, as: Tag = 'h2' }: { text: string; as?: 'h1' | 'h2' }) {
  let k = 0;
  return (
    <Tag className="split">
      {text.split('*').map((seg, pi) => {
        const inner = seg.split('\n').map((line, li) => (
          <span key={li}>{li > 0 && <br />}
            {line.split(/\s+/).filter(Boolean).map((w, wi) => (<span key={wi}><span className="w"><i style={{ ['--i' as string]: k++ }}>{w}</i></span>{' '}</span>))}
          </span>));
        return pi % 2 ? <span key={pi} className="gold">{inner}</span> : <span key={pi}>{inner}</span>;
      })}
    </Tag>
  );
}
export const Panel = ({ id, label, children }: { id: string; label: string; children: ReactNode }) =>
  <section className="panel" id={id} aria-label={label}>{children}</section>;
export const R = ({ d = 0, className = '', children, as: T = 'div' }: { d?: number; className?: string; children: ReactNode; as?: 'div' | 'p' | 'span' | 'ul' }) =>
  <T className={className} data-r style={{ ['--d' as string]: d + 's' }}>{children}</T>;
export const Tbc = ({ children }: { children: ReactNode }) => <span className="tbc">{children}</span>;
export const Head = ({ n, eyebrow, title }: { n?: string; eyebrow: string; title: string }) => <><R className="eyebrow">{n ? n + ' — ' : ''}{eyebrow}</R><Split text={title} /></>;

export interface Step { label: string; kicker: string; title: string; text: string; list: string[] }
/** Tabbed phase/step rail with a numbered body. */
export function Tabs({ items, listTitle }: { items: Step[]; listTitle: string }) {
  const [i, setI] = useState(0), m = items[i];
  return (
    <div className="arc">
      <div className="rail" role="tablist">{items.map((x, k) => <button key={k} role="tab" aria-selected={k === i} className={k === i ? 'on' : ''} onClick={() => setI(k)}><small>{x.label}</small><span>{x.kicker}</span></button>)}</div>
      <div className="arcbody" aria-live="polite"><h3>{m.title}</h3><p>{m.text}</p>
        <span className="eyebrow">{listTitle}</span><ul className="checks">{m.list.map(l => <li key={l}>{l}</li>)}</ul></div>
    </div>);
}

export const goTab = (panel: string, tab: string) => dispatchEvent(new CustomEvent('estuscia:tab', { detail: panel + ':' + tab }));
/** Segmented sub-tabs: lets one panel hold several sections without extra scrolling. */
export function SubTabs({ id, tabs }: { id: string; tabs: { id: string; label: string; node: ReactNode }[] }) {
  const [t, setT] = useState(tabs[0].id);
  useEffect(() => { const h = (e: Event) => { const [p, x] = (e as CustomEvent<string>).detail.split(':'); if (p === id) setT(x); }; addEventListener('estuscia:tab', h); return () => removeEventListener('estuscia:tab', h); }, [id]);
  return (<div className="subtabs"><div className="seg" role="tablist">{tabs.map(k => <button key={k.id} role="tab" aria-selected={k.id === t} className={k.id === t ? 'on' : ''} onClick={() => setT(k.id)}>{k.label}</button>)}</div>
    <div role="tabpanel">{(tabs.find(k => k.id === t) ?? tabs[0]).node}</div></div>);
}
