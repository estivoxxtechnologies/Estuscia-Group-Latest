import { useEffect, useRef } from 'react';
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia('(hover:none)').matches) return;
    const c = ref.current!; let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const mv = (e: PointerEvent) => { x = e.clientX; y = e.clientY; c.style.opacity = '1'; c.classList.toggle('big', !!(e.target as Element).closest('a,button')); };
    const loop = () => { cx += (x - cx) * 0.18; cy += (y - cy) * 0.18; c.style.transform = `translate(${cx}px,${cy}px)`; raf = requestAnimationFrame(loop); };
    addEventListener('pointermove', mv); loop();
    return () => { removeEventListener('pointermove', mv); cancelAnimationFrame(raf); };
  }, []);
  return <div id="cur" ref={ref} aria-hidden="true" />;
}
