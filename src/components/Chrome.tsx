
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { LABELS } from '../hooks/usePanels';
import { SITE } from '../site';

export const Mark = () => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    stroke="#d8bd85"
    strokeWidth="1.4"
    width="22"
    height="22"
  >
    <circle cx="20" cy="20" r="17" />
    <path d="M12 14h16M12 20h12M12 26h16" />
  </svg>
);

/** Brand logo from /public (falls back to the text mark if the file is missing). */
export function Logo({ h = 30 }: { h?: number }) {
  const [bad, setBad] = useState(false);

  return bad ? (
    <>
      <Mark />
      ESTUSCIA
    </>
  ) : (
    <img
      className="logoimg"
      src={SITE.logo}
      alt="Estuscia Group"
      height={h}
      onError={() => setBad(true)}
    />
  );
}

/** The pull-down handle: drag it down (or click / press Enter) to move to the next panel. */
export function Handle({
  onPull,
  last,
}: {
  onPull: () => void;
  last: boolean;
}) {
  const el = useRef<HTMLButtonElement>(null);
  const st = useRef({
    y0: 0,
    dy: 0,
    drag: false,
    moved: false,
  });

  const set = (dy: number) =>
    el.current?.style.setProperty('--dy', dy + 'px');

  const down = (e: React.PointerEvent) => {
    el.current!.setPointerCapture(e.pointerId);

    st.current = {
      y0: e.clientY,
      dy: 0,
      drag: true,
      moved: false,
    };

    gsap.killTweensOf(st.current);
  };

  const move = (e: React.PointerEvent) => {
    const s = st.current;

    if (!s.drag) return;

    const raw = Math.max(0, e.clientY - s.y0);

    s.dy = 150 * (1 - Math.exp(-raw / 150));

    if (raw > 6) s.moved = true;

    set(s.dy);
  };

  const up = () => {
    const s = st.current;

    if (!s.drag) return;

    s.drag = false;

    const fire = s.dy > 70;

    gsap.to(s, {
      dy: 0,
      duration: 0.9,
      ease: 'elastic.out(1,.45)',
      onUpdate: () => set(s.dy),
    });

    if (fire) onPull();
  };

  const click = (e: React.MouseEvent) => {
    if (e.detail === 0 || !st.current.moved) {
      onPull();
    }
  };

  return (
    <button
      ref={el}
      className="handle"
      aria-label={last ? 'Back to the start' : 'Pull down to continue'}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClick={click}
    >
      <span className="cord" />
      <span className="knob" />
      <small>{last ? 'Back to start' : 'Pull down'}</small>
    </button>
  );
}

export function Nav({
  active,
  go,
}: {
  active: number;
  go: (i: number) => void;
}) {
  const [open, setOpen] = useState(false);

  const quick: [string, number][] = LABELS.map(([, l], i) => [l, i]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    addEventListener('keydown', k);

    return () => removeEventListener('keydown', k);
  }, []);

  const pick = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    setOpen(false);
    go(i);
  };

  return (
    <>
      <nav aria-label="Primary">
        <a
          className="navlogo"
          href="#home"
          aria-label="Estuscia Group home"
          onClick={(e) => pick(e, 0)}
        >
          <Logo h={30} />
        </a>

        <ul className="quick">
          {quick.map(([l, i]) => (
            <li key={l}>
              <a
                href={'#' + LABELS[i][0]}
                className={active === i ? 'on' : ''}
                onClick={(e) => pick(e, i)}
              >
                {l}
              </a>
            </li>
          ))}
        </ul>

        <button
          className="menubtn"
          aria-expanded={open}
          aria-controls="index"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </nav>

      <div
        id="index"
        className={'index' + (open ? ' open' : '')}
        aria-hidden={!open}
      >
        <ol>
          {LABELS.map(([id, l], i) => (
            <li key={id}>
              <a
                href={'#' + id}
                tabIndex={open ? 0 : -1}
                className={active === i ? 'on' : ''}
                onClick={(e) => pick(e, i)}
              >
                <small>{String(i + 1).padStart(2, '0')}</small>
                {l}
              </a>
            </li>
          ))}
        </ol>
      </div>

      <div className="count" aria-hidden="true">
        <b>{String(active + 1).padStart(2, '0')}</b> / {LABELS.length}
      </div>
    </>
  );
}

/** Welcome screen: tracks readiness, shows progress, then fades out. */
export function Loader({
  ready,
  onDone,
}: {
  ready: Promise<unknown>;
  onDone: () => void;
}) {
  const [n, setN] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const o = { v: 0 };

    const tick = () => setN(Math.round(o.v));

    const t = gsap.to(o, {
      v: 90,
      duration: 1.3,
      ease: 'power1.out',
      onUpdate: tick,
    });

    let cancelled = false;
    let finishTween: gsap.core.Tween | undefined;

    Promise.race([
      ready,
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 4000);
      }),
    ]).then(() => {
      if (cancelled) return;

      t.kill();

      finishTween = gsap.to(o, {
        v: 100,
        duration: 0.5,
        ease: 'none',
        onUpdate: tick,
        onComplete: () => {
          if (cancelled) return;

          gsap.to(box.current, {
            opacity: 0,
            duration: 0.7,
            delay: 0.2,
            onComplete: () => {
              if (!cancelled) onDone();
            },
          });
        },
      });
    });

    return () => {
      cancelled = true;
      t.kill();
      finishTween?.kill();
      gsap.killTweensOf(box.current);
    };
  }, [ready, onDone]);

  return (
    <div
      className="loader"
      ref={box}
      role="status"
      aria-live="polite"
    >
      <span className="eyebrow">Welcome</span>

      <div className="pct">
        {String(n).padStart(2, '0')}
        <i>%</i>
      </div>

      <p>Estuscia Group — a business &amp; investment platform</p>
    </div>
  );
}
