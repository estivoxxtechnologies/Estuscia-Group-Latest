import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import Scene from './scene/Scene';
import Cursor from './components/Cursor';
import Panels from './components/Panels';
import { Handle, Nav, Loader } from './components/Chrome';
import { usePanels, IDS } from './hooks/usePanels';

export default function App() {
  const [reduce] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [active, setActive] = useState(0), [glFail, setGlFail] = useState(false), [loaded, setLoaded] = useState(false);
  const onFail = useCallback(() => setGlFail(true), []);
  const { go, cur } = usePanels(setActive, reduce);
  const ready = useMemo(() => Promise.resolve(document.fonts?.ready), []);
  useLayoutEffect(() => { document.documentElement.classList.toggle('rm', reduce); document.documentElement.classList.toggle('nogl', glFail); }, [reduce, glFail]);
  const done = useCallback(() => { setLoaded(true); if (location.hash) history.replaceState(null, '', location.pathname + location.search); go(0); }, [go]);
  const last = active === IDS.length - 1;
  return (<>
    {!glFail && <Scene reduce={reduce} onFail={onFail} />}
    <div className="shade" aria-hidden="true" /><div className="flash" aria-hidden="true" />
    {!reduce && <Cursor />}
    <Panels go={go} />
    <Nav active={active} go={go} />
    <Handle last={last} onPull={() => go(last ? 0 : cur.current + 1)} />
    {!loaded && <Loader ready={ready} onDone={done} />}
  </>);
}
