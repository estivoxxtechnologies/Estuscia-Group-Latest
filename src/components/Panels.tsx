import { memo, useEffect, useMemo, useState } from 'react';
import { SITE } from '../site';
import * as D from '../data';
import { Panel, Split, R, Tbc, Head, Tabs, SubTabs, goTab } from './ui';
import { Logo } from './Chrome';
import { LABELS } from '../hooks/usePanels';
import emailjs from "@emailjs/browser";

const OPTIONS = [...D.SERVICES.map(s => s.interest), 'Global Trade (Estuscia Global)', 'Partnership / Investor Relations', 'Other'];
const prefill = (v: string) => dispatchEvent(new CustomEvent('estuscia:prefill', { detail: v }));
const Chev = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6" /></svg>;

function Ecosystem() {
  const [a, setA] = useState(0), c = D.ECOSYSTEM[a];
  return (
    <div className="split2">
      <ul className="list" aria-label="Ecosystem brands">{D.ECOSYSTEM.map((x, i) => (
        <li key={x.name}><button className={i === a ? 'row on' : 'row'} onMouseEnter={() => setA(i)} onFocus={() => setA(i)} onClick={() => setA(i)}>
          <span className="num">{String(i + 1).padStart(2, '0')}</span><span className="nm">{x.name}</span></button></li>))}</ul>
      <div className="detail" aria-live="polite"><span className="eyebrow">{c.tag}</span><h3>{c.name}</h3><p>{c.desc}</p>
        <ul className="checks">{c.caps.map(k => <li key={k}>{k}</li>)}</ul></div>
    </div>);
}
function Services({ go }: { go: (i: number) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  return (<div className="cards four">{D.SERVICES.map((s, i) => (
    <article className="c" key={s.title}><span className="eyebrow">{s.cat}</span><h3>{s.title}</h3><p>{s.desc}</p>
      {open === i && <ul className="checks">{s.hl.map(h => <li key={h}>{h}</li>)}</ul>}
      <div className="row2"><button className="btn" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>{open === i ? 'Hide Details' : 'View Details'}</button>
        <button className="btn p" onClick={() => { prefill(s.interest); go(6); }}>Consult Now</button></div></article>))}</div>);
}
function Faq() {
  const [q, setQ] = useState(''), [cat, setCat] = useState('All'), [open, setOpen] = useState<number | null>(0);
  const list = useMemo(() => D.FAQS.filter(f => (cat === 'All' || f.cat === cat) && (f.q + ' ' + f.a).toLowerCase().includes(q.trim().toLowerCase())), [q, cat]);
  return (<div className="faq">
    <div className="faqbar"><label className="sr" htmlFor="faqs">Search questions</label><input id="faqs" type="search" placeholder="Search questions or keywords" value={q} onChange={e => setQ(e.target.value)} />
      <div className="chips" role="group" aria-label="Filter by category">{D.FAQ_CATS.map(c => <button key={c} className={'chip' + (c === cat ? ' on' : '')} aria-pressed={c === cat} onClick={() => { setCat(c); setOpen(null); }}>{c}</button>)}</div></div>
    {list.length === 0 ? <p className="empty" role="status">No questions match your search. <button className="link" onClick={() => { setQ(''); setCat('All'); }}>Reset filters</button></p> :
      list.map((f, i) => (<div className={'qa' + (open === i ? ' open' : '')} key={f.q}>
        <h3><button aria-expanded={open === i} aria-controls={'a' + i} onClick={() => setOpen(open === i ? null : i)}><span>{f.q}</span><Chev /></button></h3>
        <div id={'a' + i} className="ans" role="region"><p>{f.a}</p></div></div>))}
  </div>);
}
function Field({ k, label, req, children, err }: { k: string; label: string; req?: boolean; children: React.ReactNode; err: Record<string, string> }) {
  return <div className={'f' + (err[k] ? ' bad' : '')}><label htmlFor={'f-' + k}>{label}{req && <b aria-hidden="true"> *</b>}</label>{children}{err[k] && <em id={'e-' + k} role="alert">{err[k]}</em>}</div>;
}
type St = 'idle' | 'sending' | 'ok' | 'fail' | 'unconfigured';
function Form() {
  const empty = { name: '', email: '', phone: '', org: '', interest: '', message: '', hp: '' };
  const [v, setV] = useState(empty), [err, setErr] = useState<Record<string, string>>({}), [st, setSt] = useState<St>('idle');
  useEffect(() => { const h = (e: Event) => setV(p => ({ ...p, interest: (e as CustomEvent<string>).detail })); addEventListener('estuscia:prefill', h); return () => removeEventListener('estuscia:prefill', h); }, []);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV(p => ({ ...p, [k]: e.target.value }));
  const validate = () => {
    const e: Record<string, string> = {};
    if (!v.name.trim()) e.name = 'Please enter your full name.';
    if (!v.email.trim()) e.email = 'Please enter your corporate email.'; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) e.email = 'Enter a valid email address.';
    if (v.phone && !/^\+?[\d\s()-]{7,18}$/.test(v.phone)) e.phone = 'Enter a valid phone number.';
    if (!v.interest) e.interest = 'Choose an area of interest.'; if (v.message.trim().length < 10) e.message = 'Please add a few details (at least 10 characters).'; return e;
  };
  const mail = `mailto:${SITE.email}?subject=${encodeURIComponent('Enquiry: ' + (v.interest || 'General'))}&body=${encodeURIComponent(`${v.message}\n\n${v.name}${v.org ? ', ' + v.org : ''}\n${v.email}${v.phone ? '\n' + v.phone : ''}`)}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (st === "sending") return;

    const er = validate();
    setErr(er);

    if (Object.keys(er).length || v.hp) return;

    setSt("sending");

    try {
      await emailjs.send(
        "support_estuscia_2026",
        "template_estuscia_new",
        {
          full_name: v.name,
          email: v.email,
          phone: v.phone || "Not Provided",
          organization: v.org || "Not Provided",
          inquiry_type: v.interest || "General Inquiry",
          message: v.message,
          date: new Date().toLocaleString(),
        },
        "8sMHg-Kgo0C5ooSg-"
      );

      setSt("ok");
      setV(empty);
      setErr({});
    } catch (error) {
      console.error("EmailJS Error:", error);
      setSt("fail");
    }
  };
  const a = (k: string) => ({ id: 'f-' + k, 'aria-invalid': !!err[k], 'aria-describedby': err[k] ? 'e-' + k : undefined });
  return (
    <form className="form" onSubmit={submit} noValidate><h3>Send Us a Message</h3>
      <Field err={err} k="name" label="Full Name" req><input {...a('name')} value={v.name} onChange={set('name')} autoComplete="name" placeholder="Your full name" /></Field>
      <Field err={err} k="email" label="Corporate Email" req><input {...a('email')} type="email" value={v.email} onChange={set('email')} autoComplete="email" placeholder="you@company.com" /></Field>
      <div className="two"><Field err={err} k="phone" label="Phone Number"><input {...a('phone')} type="tel" value={v.phone} onChange={set('phone')} autoComplete="tel" placeholder="+91 …" /></Field>
        <Field err={err} k="org" label="Organization / Company"><input {...a('org')} value={v.org} onChange={set('org')} autoComplete="organization" placeholder="Company name" /></Field></div>
      <Field err={err} k="interest" label="Area of Interest / Vertical" req><select {...a('interest')} value={v.interest} onChange={set('interest')}><option value="">Select an area…</option>{OPTIONS.map(o => <option key={o}>{o}</option>)}</select></Field>
      <Field err={err} k="message" label="Message / Project Details" req><textarea {...a('message')} rows={4} value={v.message} onChange={set('message')} placeholder="Tell us about your project" /></Field>
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={v.hp} onChange={set('hp')} />
      <button className="btn p" disabled={st === 'sending'}>{st === 'sending' ? 'Sending…' : 'Send Message'}</button>
      <div className="status" role="status" aria-live="polite">
        {st === 'ok' && <p className="okk">Thank you — your message was delivered.</p>}
        {st === 'fail' && <p className="bad">We couldn’t send your message. Please try again or email <a href={mail}>{SITE.email}</a>.</p>}
        {st === 'unconfigured' && <p className="bad">Nothing was sent: this form isn’t connected to a server yet. <a href={mail}>Open your email app with this message ready</a>.</p>}
      </div>
    </form>);
}
function Photo({ name, src }: { name: string; src: string }) {
  const [bad, setBad] = useState(!src);
  return bad ? <div className="avatar" aria-hidden="true">{name.split(' ').map(x => x[0]).slice(0, 2).join('')}</div> : <img src={src} alt={name} loading="lazy" onError={() => setBad(true)} />;
}
function Footer({ go }: { go: (i: number) => void }) {
  const nav: [string, number, string?][] = [['About Estuscia', 1, 'about'], ['Our Ecosystem', 2], ['Services Offered', 3, 'services'], ['Financial Pipeline', 3, 'pipeline'], ['Why Choose Us', 1, 'why'], ['Leadership Team', 4], ['Insights & News', 5, 'insights'], ['FAQ', 5, 'faq']];
  const to = (i: number, tab?: string) => (e: React.MouseEvent) => { e.preventDefault(); if (tab) goTab(LABELS[i][0], tab); go(i); };
  return (<footer className="fgrid">
    <div><span className="logo"><Logo h={38} /></span><p>A multi-business ecosystem driving sustainable growth across finance, consulting, technology, trade, and venture incubation.</p>
      {SITE.social.map(s => <a key={s.label} className="flink" href={s.href} rel="noopener">{s.label}</a>)}</div>
    <div><h3>Navigate</h3><ul className="two-col">{nav.map(([l, i, t]) => <li key={l}><a href={'#' + LABELS[i][0]} onClick={to(i, t)}>{l}</a></li>)}</ul></div>
    <div><h3>Ecosystem</h3><ul className="two-col">{D.ECOSYSTEM.map(x => <li key={x.name}><a href="#ecosystem" onClick={to(2)}>{x.name}</a></li>)}</ul></div>
    <p className="copy">© {new Date().getFullYear()} Estuscia Group. All rights reserved.{SITE.legal.map(l => <a key={l.label} href={l.href}> · {l.label}</a>)}</p>
  </footer>);
}

const Panels = memo(function Panels({ go }: { go: (i: number) => void }) {
  const toEco = (e: React.MouseEvent) => { e.preventDefault(); go(2); };
  return (<div className="stage">
    {/* 1 — HOME: hero + Sustainable Growth Engine */}
    <Panel id="home" label="Home"><div className="in end">
      <R className="eyebrow">Estuscia Group · Diversified Business Ecosystem</R>
      <Split as="h1" text={'Building Businesses.\nCreating Opportunities.\n*Empowering the Future.*'} />
      <R as="p" className="lead" d={0.1}>A diversified business ecosystem spanning financial services, business consulting, technology, media, trade, and startup development.</R>
      <R className="row2" d={0.2}><a className="btn p" href="#ecosystem" onClick={toEco}>Explore Our Ecosystem</a></R>
      <R className="stats" d={0.3}>{[['6 Core', 'Business Pillars'], ['Global', 'Ecosystem Reach'], ['$50M+', 'Strategic Value']].map(([b, l]) => <div key={l}><b>{b}</b><span>{l}</span></div>)}</R>
      <R className="chartwrap" d={0.35}><svg className="chart" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 55 C80 50 120 44 190 38 S300 30 360 20 S520 8 600 2" /></svg>
        <div className="engine"><span className="eyebrow">Sustainable Growth Engine</span><ul className="pills">{D.GROWTH.map((g, i) => <li key={g}><small>{String(i + 1).padStart(2, '0')}</small>{g}</li>)}</ul></div></R>
      <R as="p" className="fine" d={0.4}>Figures as stated by Estuscia Group.</R>
    </div></Panel>

    {/* 2 — ABOUT + WHY CHOOSE US */}
    <Panel id="about" label="About and Why Choose Estuscia Group"><div className="in wide"><R d={0.05}>
      <SubTabs id="about" tabs={[
        {
          id: 'about', label: 'About Estuscia', node: (<><Head eyebrow="About Estuscia Group" title="Building Innovative *Companies Across Industries*" />
            <div className="cols">
              <div><h3>Our Mission</h3><p>Creating businesses that solve real-world challenges while empowering entrepreneurs, startups and organizations through strategic financial, legal and operational support.</p>
                <ul className="checks"><li>Empower early-stage and growth startups with capital and guidance</li><li>Optimize operational, legal, and regulatory compliance</li><li>Foster cross-border trade and technological advancement</li></ul></div>
              <div><h3>Our Vision</h3><p>To build a trusted global business ecosystem that drives sustainable innovation and long-term value creation.</p>
                <ul className="checks"><li>Global benchmark in diversified business incubation</li><li>Commitment to institutional transparency</li><li>Long-term value creation for partners and investors</li></ul></div>
              <div className="quote"><h3>Core Belief</h3><blockquote>“Sustainable growth is achieved through transparency, innovation, and strong business foundations.”</blockquote>
                <p>Built on institutional governance, scalable technology and risk-managed capital structuring.</p><a className="btn" href="#ecosystem" onClick={toEco}>Learn Our Pillars</a></div></div></>)
        },
        {
          id: 'why', label: 'Why Choose Us', node: (<><Head eyebrow="Competitive Advantages" title="Why Choose *Estuscia Group*" />
            <div className="cards five">{D.WHY.map((w, i) => <article className="c" key={w.t}><span className="num">{String(i + 1).padStart(2, '0')}</span><h3>{w.t}</h3><p>{w.d}</p></article>)}</div></>)
        },
      ]} /></R></div></Panel>

    {/* 3 — ECOSYSTEM (9 brands) + PARTNER CTA */}
    <Panel id="ecosystem" label="Our Business Ecosystem"><div className="in wide">
      <Head eyebrow="Our Business Ecosystem · Nine Brands" title="Diversified Verticals Driving *Synergy & Scale*" /><R d={0.15}><Ecosystem /></R>
      <R className="banner" d={0.25}><div><h3>Partner with Estuscia Ecosystem</h3><p>Startup founders, corporate enterprises and investors are invited to build with us.</p></div><button className="btn p" onClick={() => go(6)}>Get In Touch</button></R></div></Panel>

    {/* 4 — SOLUTIONS: services, pipeline, process, industries */}
    <Panel id="solutions" label="Solutions"><div className="in wide"><R d={0.05}>
      <SubTabs id="solutions" tabs={[
        { id: 'services', label: 'Services', node: (<><Head eyebrow="Comprehensive Solutions" title="Strategic *Corporate Services*" /><Services go={go} /></>) },
        {
          id: 'pipeline', label: 'Financial Pipeline', node: (<><Head eyebrow="Five Phases" title="Startup Financial *Planning Pipeline*" /><Tabs items={D.PIPELINE} listTitle="Deliverables" />
            <div className="row2"><button className="btn p" onClick={() => { prefill('Startup Incubation & Venture Growth'); go(6); }}>Submit Venture for Pipeline Evaluation</button></div></>)
        },
        { id: 'process', label: 'Our Process', node: (<><Head eyebrow="Four Steps" title="Our Proven *Process*" /><Tabs items={D.PROCESS} listTitle="Deliverable" /></>) },
        {
          id: 'industries', label: 'Industries', node: (<><Head eyebrow="Sectors" title="Industries We Serve *& Transform*" />
            <div className="cards five">{D.INDUSTRIES.map(x => <article className="c" key={x.t}><h3>{x.t}</h3><p>{x.d}</p><div className="tags">{x.f.map(t => <span key={t}>{t}</span>)}</div></article>)}</div></>)
        },
      ]} /></R></div></Panel>

    {/* 5 — LEADERSHIP + CORE VALUES */}
    <Panel id="leadership" label="Leadership and Core Values"><div className="in wide">
      <Head eyebrow="Leadership & Executive Team" title="The People *Behind the Ecosystem*" />
      <R className="cards four compact" d={0.15}>{D.LEADERS.map(p => (<article className="c person" key={p.name}>
        <div className="phead"><Photo name={p.name} src={p.photo} />
          <div><h3>{p.name}</h3><span className="eyebrow">{p.role}</span></div></div><p>{p.d}</p><div className="tags">{p.tags.map(t => <span key={t}>{t}</span>)}</div></article>))}</R>
      <R className="values" d={0.25}><span className="eyebrow">Our Corporate Core Values</span><ul>{D.VALUES.map((v, i) => <li key={v.t}><small>{String(i + 1).padStart(2, '0')}</small><b>{v.t}</b><span>{v.d}</span></li>)}</ul></R></div></Panel>

    {/* 6 — INSIGHTS + FAQ */}
    <Panel id="insights" label="Insights and FAQ"><div className="in wide"><R d={0.05}>
      <SubTabs id="insights" tabs={[
        {
          id: 'insights', label: 'Insights & News', node: (<><Head eyebrow="Corporate Insights" title="Thought Leadership *& Market Analysis*" />
            <div className="cards three">{D.INSIGHTS.map(a => (<article className="c art" key={a.title}>
              <div className="thumb" aria-hidden="true"><svg viewBox="0 0 200 80" preserveAspectRatio="none"><path d="M0 70 L30 55 L60 62 L100 35 L140 40 L200 8" /></svg></div>
              <span className="eyebrow">{a.cat}</span><small className="meta">{a.date}{a.mins && ` · ${a.mins}`}</small><h3>{a.title}</h3><p>{a.sum}</p><small className="meta">By {a.by}</small>
              {/* <a className="btn" href={a.url || SITE.url} rel="noopener">Read Article</a> */}
            </article>))}</div></>)
        },
        { id: 'faq', label: 'FAQ', node: (<><Head eyebrow="Frequently Asked Questions" title="Questions, *Answered*" /><Faq /></>) },
      ]} /></R></div></Panel>

    {/* 7 — CONTACT + FOOTER */}
    <Panel id="contact" label="Contact"><div className="in wide">
      <Head eyebrow="Contact" title="Start the *Conversation*" />
      <R className="split2 contact" d={0.15}>
        <div className="cinfo">
          <div><h3>Headquarters</h3><p>Estuscia Group — a multi-business ecosystem driving sustainable growth across finance, consulting, technology, trade, and venture incubation.</p></div>
          <div><h3>Registered Office</h3><p>{SITE.office.map(l => <span key={l}>{l}<br /></span>)}</p></div>
          <div><h3>Email Communications</h3><p><a href={'mailto:' + SITE.email}>{SITE.email}</a></p></div>
          <div><h3>Corporate Hotline</h3><p>{SITE.phones.map(p => <span key={p.tel}><a href={'tel:' + p.tel}>{p.label}</a><br /></span>)}</p></div>
          <div><h3>Business Hours</h3><p>{SITE.hours || <Tbc>09.00 AM - 05.30 PM (Indian Standard Time)</Tbc>}</p></div>
        </div><Form /></R>
      <R d={0.25}><Footer go={go} /></R></div></Panel>
  </div>);
});
export default Panels;
