import { useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { S } from '../scene/state';

export const LABELS: [string, string][] = [['home','Home'],['about','About'],['ecosystem','Ecosystem'],['solutions','Solutions'],['leadership','Leadership'],['insights','Insights'],['contact','Contact']];
export const IDS = LABELS.map(l => l[0]);
const SP: Record<string, Partial<Record<string, number>>> = { home: { z: 5.6, grow: 0.5, logo: 1 }, ecosystem: { wire: 1, z: 11 }, solutions: { grow: 1, spread: 0.5, z: 11 }, leadership: { glow: 1.2, z: 10 }, insights: { wire: 0.5, z: 10 }, contact: { glow: 1.6, z: 6 } };
const PRESETS = IDS.map((id, i) => ({ rot: i * 0.2, x: id === 'home' || id === 'contact' ? 0 : i % 2 ? 2.6 : -2.6, z: 9, wire: 0, spread: 0, grow: 0, glow: 0.8, logo: 0.4, ...SP[id] }));

/** Panel engine: one full-screen panel at a time. Moving between panels zooms INTO the background, then back OUT onto the new panel. */
export function usePanels(onChange: (i: number) => void, reduce: boolean) {
  const cur = useRef(-1), busy = useRef(false);
  const go = useCallback((to: number) => {
    const ps = Array.from(document.querySelectorAll<HTMLElement>('.panel'));
    if (busy.current || to === cur.current || to < 0 || to >= ps.length) return;
    busy.current = true;
    const from = cur.current, inn = ps[to], out = from >= 0 ? ps[from] : null, dir = to > from ? 1 : -1;
    const show = () => { inn.classList.add('on'); inn.scrollTop = 0; onChange(to); };
    cur.current = to;
    if (reduce) {
      out?.classList.remove('on'); show(); gsap.set(inn, { opacity: 1, scale: 1 }); gsap.set(S, PRESETS[to]); busy.current = false; return;
    }
    const tl = gsap.timeline({ onComplete: () => { busy.current = false; } });
    const t = out ? 0.7 : 0;
    if (out) tl.to(out, { scale: dir > 0 ? 1.7 : 0.6, opacity: 0, duration: 0.7, ease: 'power2.in' }, 0)
      .add(() => { out.classList.remove('on'); gsap.set(out, { clearProps: 'all' }); }, 0.7);
    tl.to(S, { pulse: 1, duration: 0.7, ease: 'power2.in' }, 0)                    // camera dives into the background
      .to(S, { ...PRESETS[to], duration: 1.7, ease: 'power2.inOut' }, 0)
      .add(show, t)
      .fromTo(inn, { scale: dir > 0 ? 0.6 : 1.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.95, ease: 'power3.out' }, t)
      .to(S, { pulse: 0, duration: 0.95, ease: 'power2.out' }, t)                  // ...and pulls back out;
  }, [onChange, reduce]);

  useEffect(() => {
    const room = (d: number) => { const p = document.querySelector<HTMLElement>('.panel.on'); if (!p) return false; const max = p.scrollHeight - p.clientHeight; return max > 4 && (d > 0 ? p.scrollTop < max - 2 : p.scrollTop > 2); };
    const step = (d: number) => { if (!busy.current && !room(d)) go(cur.current + d); };
    let acc = 0, tmr = 0, ty = 0;
    const wheel = (e: WheelEvent) => { const d = Math.sign(e.deltaY); if (!d) return; if (!room(d)) e.preventDefault(); acc += e.deltaY; clearTimeout(tmr); tmr = window.setTimeout(() => (acc = 0), 160); if (Math.abs(acc) > 50) { acc = 0; step(d); } };
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName; if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && tag === 'BODY')) { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
      else if (e.key === 'Home') go(0); else if (e.key === 'End') go(IDS.length - 1);
    };
    const ts = (e: TouchEvent) => { ty = e.touches[0].clientY; };
    const te = (e: TouchEvent) => { const dy = ty - e.changedTouches[0].clientY; if (Math.abs(dy) > 70) step(Math.sign(dy)); };
    addEventListener('wheel', wheel, { passive: false }); addEventListener('keydown', key); addEventListener('touchstart', ts, { passive: true }); addEventListener('touchend', te, { passive: true });
    return () => { removeEventListener('wheel', wheel); removeEventListener('keydown', key); removeEventListener('touchstart', ts); removeEventListener('touchend', te); };
  }, [go]);
  return { go, cur };
}
