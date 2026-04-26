import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PivotHireLogo } from '../components/Logo';

/* ── Design tokens (matching landing page) ── */
const T = {
  dark:    '#0A0F08',
  dark2:   '#0E1509',
  dark3:   '#141D0E',
  primary: '#FF6600',
  primaryHover: '#E85C00',
  green:   '#1C3C0A',
  greenLight: 'rgba(28,60,10,0.15)',
  white:   '#F8F5F0',
  muted:   'rgba(248,245,240,0.52)',
  border:  'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.2)',
  glow:    'rgba(255,102,0,0.3)',
  lightBg: '#F5F4F0',
  cardBg:  '#FFFFFF',
  textDark:'#0E160A',
  textMuted:'#6B7060',
};

/* ── Hooks ── */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
};

const useReveal = (threshold = 0.12) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
};

const useCounter = (target, dur = 1400, active) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(step);
      else setVal(target);
    };
    requestAnimationFrame(step);
  }, [active, target, dur]);
  return val;
};

/* ── Small components ── */
const Reveal = ({ children, delay = 0, style = {}, className = '' }) => {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.65s ${delay}s cubic-bezier(0.16,1,0.3,1), transform 0.65s ${delay}s cubic-bezier(0.16,1,0.3,1)`,
      ...style
    }}>{children}</div>
  );
};

const Orb = ({ size, x, y, color, anim, dur, delay = 0 }) => (
  <div style={{
    position:'absolute', width:size, height:size, borderRadius:'50%',
    background:color, filter:'blur(72px)', left:`${x}%`, top:`${y}%`,
    animation:`${anim} ${dur}s ${delay}s ease-in-out infinite`,
    pointerEvents:'none', willChange:'transform'
  }} />
);

const AnimatedStat = ({ num, suffix, label, delay = 0 }) => {
  const [ref, vis] = useReveal();
  const count = useCounter(num, 1600, vis);
  return (
    <div ref={ref} style={{ textAlign:'center', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(16px)', transition:`opacity 0.5s ${delay/1000}s ease, transform 0.5s ${delay/1000}s ease` }}>
      <div style={{ fontFamily:'Syne, sans-serif', fontSize:26, fontWeight:700, color:T.white }}>
        {num === 0 ? '0' : count}{suffix}
      </div>
      <div style={{ fontSize:13, color:T.muted, marginTop:3 }}>{label}</div>
    </div>
  );
};

const BtnPrimary = ({ children, onClick, style={}, size='md' }) => {
  const [hov, setHov] = useState(false);
  const pad = size === 'lg' ? '14px 28px' : '9px 20px';
  const fs = size === 'lg' ? 15 : 14;
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? T.primaryHover : T.primary, color:'#fff', border:'none', padding:pad, borderRadius:10, fontFamily:'DM Sans, sans-serif', fontSize:fs, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, transition:'all 0.2s', transform: hov ? 'translateY(-1px)' : 'none', boxShadow: hov ? `0 12px 32px ${T.glow}` : 'none', ...style }}>
      {children}
    </button>
  );
};

const BtnGhost = ({ children, onClick, style={} }) => {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? 'rgba(255,255,255,0.07)' : 'transparent', color:T.white, border:`1px solid ${hov ? T.borderHover : T.border}`, padding:'9px 20px', borderRadius:10, fontFamily:'DM Sans, sans-serif', fontSize:14, fontWeight:500, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, transition:'all 0.2s', ...style }}>
      {children}
    </button>
  );
};

const Icon = ({ d, size=20, stroke=T.white, strokeWidth=1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d={d} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Sub-sections ── */
const WhyCard = ({ icon, old, new_, desc }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:'#F9F7F4', border:`1px solid ${hov?'rgba(255,102,0,0.28)':'rgba(255,102,0,0.1)'}`, borderRadius:16, padding:32, transition:'all 0.22s', transform: hov?'translateY(-2px)':'none', boxShadow: hov?'0 8px 32px rgba(0,0,0,0.06)':'none' }}>
      <div style={{ width:42, height:42, borderRadius:11, background:T.primary, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
        <Icon d={icon} size={20} />
      </div>
      <span style={{ fontSize:13, color:T.textMuted, textDecoration:'line-through', display:'block', marginBottom:6 }}>{old}</span>
      <span style={{ fontFamily:'Syne, sans-serif', fontSize:20, fontWeight:700, color:T.textDark, display:'block', marginBottom:10 }}>{new_}</span>
      <p style={{ fontSize:14, color:T.textMuted, lineHeight:1.65 }}>{desc}</p>
    </div>
  );
};

const RegistryCard = ({ onNavigate }) => {
  const isMobile = useIsMobile();
  return (
    <div className="grid-r2" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 36 : 64, alignItems:'center', background:`linear-gradient(135deg, ${T.dark3} 0%, rgba(28,60,10,0.4) 100%)`, border:'1px solid rgba(28,60,10,0.4)', borderRadius:24, padding: isMobile ? '36px 24px' : 64, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-60, right:-60, width:300, height:300, borderRadius:'50%', background:'rgba(255,102,0,0.1)', filter:'blur(80px)', pointerEvents:'none' }} />
      <div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,102,0,0.12)', border:'1px solid rgba(255,102,0,0.3)', borderRadius:100, padding:'5px 16px', fontSize:12, fontWeight:700, color:T.primary, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:24 }}>
          <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill={T.primary} opacity="0.8"/></svg>
          By invitation only
        </div>
        <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(30px,4vw,44px)', fontWeight:800, letterSpacing:'-1.5px', lineHeight:1.12, marginBottom:16, color:T.white }}>The Relentless<br />Registry</h2>
        <p style={{ color:T.muted, fontSize:16, lineHeight:1.7, marginBottom:32 }}>An exclusive, curated list of top ex-founders in our network. You can't apply to join—only peers can nominate you. Companies must request access to view any profile.</p>
        <BtnPrimary size="lg" onClick={onNavigate}>Request access →</BtnPrimary>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {[['147','Registry members'],['$2.4M','Avg. funding raised'],['6+','Sectors covered'],['94%','Placement rate'],['11 days','Avg. to hire'],['100%','Referral entry']].map(([n,l]) => (
          <div key={l} style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${T.border}`, borderRadius:12, padding: isMobile ? 14 : 20, textAlign:'center' }}>
            <div style={{ fontFamily:'Syne, sans-serif', fontSize: isMobile ? 20 : 26, fontWeight:700, color:T.white }}>{n}</div>
            <div style={{ fontSize:12, color:T.muted, marginTop:5, lineHeight:1.4 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CommunityCard = ({ icon, title, desc }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:T.cardBg, border:`1px solid ${hov?'rgba(255,102,0,0.2)':T.border}`, borderRadius:16, padding:32, transition:'all 0.22s', boxShadow: hov?'0 4px 24px rgba(0,0,0,0.06)':'none' }}>
      <div style={{ width:44, height:44, borderRadius:11, background:'#FFF3EC', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
        <Icon d={icon} size={22} stroke={T.primary} />
      </div>
      <div style={{ fontFamily:'Syne, sans-serif', fontSize:18, fontWeight:700, color:T.textDark, marginBottom:8 }}>{title}</div>
      <p style={{ fontSize:14, color:T.textMuted, lineHeight:1.65 }}>{desc}</p>
    </div>
  );
};

/* ── Scroll progress bar ── */
const ScrollProgress = () => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const h = () => {
      const el = document.documentElement;
      setP((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, height:2.5, zIndex:500, background:'rgba(255,102,0,0.12)' }}>
      <div style={{ height:'100%', width:`${p}%`, background:`linear-gradient(90deg, ${T.primary}, #FF9933)`, transition:'width 0.08s', boxShadow:'0 0 8px rgba(255,102,0,0.6)' }} />
    </div>
  );
};

/* ══════════════════════════════════════
   LANDING PAGE COMPONENT
══════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('founders');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const goLogin = () => navigate('/login');
  const goRegister = () => navigate('/register');

  const founderSteps = [
    { n:'01', title:'Build your proof profile', desc:'No CV. Tell us what you built, broke, and fixed. Show how you operate under fire—not what your title was.' },
    { n:'02', title:'Get curated matches', desc:'We surface opportunities where your specific chaos-handling experience is exactly what’s needed. You pick who to engage.' },
    { n:'03', title:'Founder-to-founder call', desc:'A casual 30-min call. No HR. No scripted interview. Two founders talking about the real problem.' },
    { n:'04', title:'Sprint or commit', desc:'Start with a paid 2-week sprint. Validate fit both ways before making any long-term call.' },
  ];
  const companySteps = [
    { n:'01', title:'Post the real problem', desc:'Describe what needs building—not a job description. What does high-impact look like in your specific chaos?' },
    { n:'02', title:'Access vetted builders', desc:'Browse verified ex-founders in the Relentless Registry. Filter by domain and execution style, not years of experience.' },
    { n:'03', title:'Direct founder call', desc:'You speak directly with candidates. No recruiters. No intermediaries. Just two founders sizing each other up.' },
    { n:'04', title:'Hire in days, not months', desc:'Start with a sprint. See real output before committing. Our median time-to-hire is 11 days.' },
  ];
  const steps = activeTab === 'founders' ? founderSteps : companySteps;

  const links = [
    { label: 'Why PivotHire', href: '#why' },
    { label: 'How it works', href: '#how' },
    { label: 'The Registry', href: '#registry' },
    { label: 'Community', href: '#community' },
  ];

  return (
    <div style={{ background: T.dark, color: T.white, fontFamily: 'DM Sans, sans-serif' }}>
      {/* CSS animations */}
      <style>{`
        @keyframes floatA { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-28px) scale(1.04); } }
        @keyframes floatB { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(24px) scale(0.97); } }
        @keyframes floatC { 0%,100% { transform:translate(0,0); } 33% { transform:translate(14px,-18px); } 66% { transform:translate(-10px,12px); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.6s 0.1s ease both; }
        .fade-up-3 { animation: fadeUp 0.6s 0.2s ease both; }
        .fade-up-4 { animation: fadeUp 0.6s 0.3s ease both; }
      `}</style>

      <ScrollProgress />

      {/* ── NAV ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'space-between', padding: isMobile ? '0 20px' : '0 48px', height:64, background: scrolled ? 'rgba(10,15,8,0.96)' : 'transparent', borderBottom: scrolled ? `1px solid ${T.border}` : '1px solid transparent', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', transition:'all 0.3s' }}>
        <PivotHireLogo size={isMobile ? 24 : 28} />

        {!isMobile && (
          <ul style={{ display:'flex', alignItems:'center', gap:28, listStyle:'none' }}>
            {links.map(l => (
              <li key={l.label}>
                <a href={l.href} style={{ color:T.muted, textDecoration:'none', fontSize:14, fontWeight:500, transition:'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = T.white}
                  onMouseLeave={e => e.target.style.color = T.muted}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isMobile ? (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background:'transparent', border:`1px solid ${T.border}`, borderRadius:8, padding:'7px 10px', cursor:'pointer', color:T.white, display:'flex', alignItems:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          ) : (
            <>
              <BtnGhost onClick={goLogin}>Sign in</BtnGhost>
              <BtnPrimary onClick={goRegister}>Get started →</BtnPrimary>
            </>
          )}
        </div>
      </nav>

      {/* Mobile drawer */}
      {isMobile && menuOpen && (
        <div style={{ position:'fixed', top:64, left:0, right:0, zIndex:199, background:'rgba(10,15,8,0.98)', borderBottom:`1px solid ${T.border}`, backdropFilter:'blur(24px)', padding:'20px' }}>
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ display:'block', color:T.white, textDecoration:'none', fontSize:16, fontWeight:500, padding:'12px 0', borderBottom:`1px solid ${T.border}` }}>
              {l.label}
            </a>
          ))}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
            <BtnPrimary onClick={() => { goRegister(); setMenuOpen(false); }} style={{ width:'100%', justifyContent:'center', padding:'13px' }}>Get started →</BtnPrimary>
            <BtnGhost onClick={() => { goLogin(); setMenuOpen(false); }} style={{ width:'100%', justifyContent:'center', padding:'13px' }}>Sign in</BtnGhost>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: isMobile ? '120px 20px 60px' : '140px 48px 100px', position:'relative', textAlign:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 90% 60% at 50% -5%, rgba(255,102,0,0.18) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 85% 85%, rgba(28,60,10,0.35) 0%, transparent 50%), ${T.dark}`, zIndex:0 }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)', backgroundSize:'72px 72px', maskImage:'radial-gradient(ellipse 75% 65% at 50% 25%, black 0%, transparent 68%)', WebkitMaskImage:'radial-gradient(ellipse 75% 65% at 50% 25%, black 0%, transparent 68%)', zIndex:0 }} />
        <Orb size={420} x={-8} y={10} color="rgba(255,102,0,0.07)" anim="floatA" dur={9} delay={0} />
        <Orb size={360} x={70} y={-15} color="rgba(28,60,10,0.25)" anim="floatB" dur={11} delay={2} />
        <Orb size={280} x={80} y={55} color="rgba(255,102,0,0.06)" anim="floatC" dur={14} delay={1} />
        <Orb size={200} x={10} y={60} color="rgba(28,60,10,0.18)" anim="floatB" dur={8} delay={3} />

        <div style={{ position:'relative', zIndex:1, maxWidth:900 }}>
          <div className="fade-up" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,102,0,0.1)', border:'1px solid rgba(255,102,0,0.3)', borderRadius:100, padding:'6px 18px', fontSize:13, fontWeight:500, color:'rgba(255,140,60,1)', marginBottom:36 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:T.primary, animation:'pulse 2s infinite', display:'inline-block' }} />
            Now onboarding ex-founders to the Registry
          </div>

          <h1 className="fade-up-2" style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(46px,7.5vw,84px)', fontWeight:800, lineHeight:1.07, letterSpacing:'-2.5px', color:T.white, marginBottom:28 }}>
            Startups don't just need<br />
            employees. They need{' '}
            <span style={{ background:'linear-gradient(120deg, #4A7A1A 0%, #FF6600 60%, #FF8C33 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>believers.</span>
          </h1>

          <p className="fade-up-3" style={{ fontSize:'clamp(16px,2vw,20px)', color:T.muted, maxWidth:580, margin:'0 auto 48px', lineHeight:1.65 }}>
            PivotHire connects ex-founders with early-stage startups that need high-agency, execution-driven talent. No resumes. No keywords. Just proof of work.
          </p>

          <div className="fade-up-4" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, flexWrap:'wrap', marginBottom: isMobile ? 48 : 72 }}>
            <BtnPrimary size="lg" onClick={goRegister}>
              I'm an ex-founder →
            </BtnPrimary>
            <BtnGhost onClick={goRegister} style={{ padding:'14px 28px', fontSize:15 }}>
              I'm hiring builders
            </BtnGhost>
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap: isMobile ? 20 : 40, flexWrap:'wrap' }}>
            {[
              { num:347, suffix:'+', label:'Ex-founders in network' },
              { num:89,  suffix:'',  label:'Startups hiring now' },
              { num:0,   suffix:'',  label:'Resumes required' },
              { num:11,  suffix:' days', label:'Avg. time to hire' },
            ].map(({ num, suffix, label }, i) => (
              <span key={label} style={{ display:'contents' }}>
                {i > 0 && <div style={{ width:1, height:36, background:T.border }} />}
                <AnimatedStat num={num} suffix={suffix} label={label} delay={i * 200} />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ── */}
      <section id="why" style={{ background:T.cardBg, padding: isMobile ? '72px 20px' : '108px 48px', color:T.textDark }}>
        <div style={{ maxWidth:1120, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:32, marginBottom:48, flexWrap:'wrap' }}>
            <Reveal>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:T.primary, marginBottom:14 }}>Why PivotHire</div>
              <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(34px,4vw,52px)', fontWeight:800, letterSpacing:'-1.5px', lineHeight:1.12 }}>Not your typical<br />job board.</h2>
            </Reveal>
            <Reveal delay={0.1}><p style={{ fontSize:17, color:T.textMuted, maxWidth:480, lineHeight:1.65 }}>Traditional hiring is broken for ex-founders. Keywords miss mindset. Resumes hide what matters most—how someone operates when everything's on fire.</p></Reveal>
          </div>

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap:20 }}>
            {[
              { icon:'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', old:'Resume screening', new_:'Proof-of-work profiles', desc:'Founders show real problem-solving through recorded challenges—not polished CVs that mask actual operating style.' },
              { icon:'M13 10V3L4 14h7v7l9-11h-7z', old:'Mass applications', new_:'Curated, warm matching', desc:'We match on ambition, values, and execution style—not keywords. Every intro is intentional and mutual.' },
              { icon:'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', old:'3-month hiring cycles', new_:'2-week sprint option', desc:'Try before you commit. Start with a paid sprint to evaluate fit—both ways—before long-term offers.' },
              { icon:'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064', old:'Keyword filtering', new_:'Mindset-based matching', desc:'We match on how founders think about chaos, ownership, and execution—the attributes startups actually need.' },
            ].map((card, i) => (
              <Reveal key={i} delay={i * 0.08}><WhyCard {...card} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ background:T.dark2, padding: isMobile ? '72px 20px' : '108px 48px' }}>
        <div style={{ maxWidth:1120, margin:'0 auto' }}>
          <Reveal><div style={{ fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(255,140,60,1)', marginBottom:14 }}>How it works</div></Reveal>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', gap:24, marginBottom:40, flexWrap:'wrap' }}>
            <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(34px,4vw,52px)', fontWeight:800, letterSpacing:'-1.5px', lineHeight:1.12, color:T.white }}>From shutdown to<br />your next chapter.</h2>
            <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.06)', borderRadius:10, padding:4 }}>
              {['founders', 'companies'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding:'10px 22px', borderRadius:7, fontSize:14, fontWeight:500, cursor:'pointer', border:'none', fontFamily:'DM Sans, sans-serif', background: activeTab===tab ? T.primary : 'transparent', color: activeTab===tab ? '#fff' : T.muted, transition:'all 0.2s' }}>
                  {tab === 'founders' ? 'For Ex-Founders' : 'For Companies'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap:2 }}>
            {steps.map((s, i) => (
              <Reveal key={s.n + activeTab} delay={i * 0.09}>
                <div style={{ background:T.dark3, padding: isMobile ? '24px 20px' : '36px 28px', borderRadius: isMobile ? 12 : (i===0?'16px 0 0 16px':i===steps.length-1?'0 16px 16px 0':0), position:'relative' }}>
                  {!isMobile && i < steps.length-1 && (
                    <div style={{ position:'absolute', right:-10, top:36, color:'rgba(255,102,0,0.5)', fontSize:18, zIndex:1 }}>→</div>
                  )}
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2px', color:T.primary, textTransform:'uppercase', marginBottom:20 }}>{s.n}</div>
                  <div style={{ fontFamily:'Syne, sans-serif', fontSize:17, fontWeight:700, color:T.white, marginBottom:10, lineHeight:1.3 }}>{s.title}</div>
                  <p style={{ fontSize:14, color:T.muted, lineHeight:1.65 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGISTRY ── */}
      <section id="registry" style={{ background:T.dark, padding: isMobile ? '72px 20px' : '108px 48px' }}>
        <div style={{ maxWidth:1120, margin:'0 auto' }}>
          <RegistryCard onNavigate={goRegister} />
        </div>
      </section>

      {/* ── COMMUNITY ── */}
      <section id="community" style={{ background:T.lightBg, padding: isMobile ? '72px 20px' : '108px 48px', color:T.textDark }}>
        <div style={{ maxWidth:1120, margin:'0 auto' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:T.primary, marginBottom:14 }}>Community</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:32, marginBottom:56, flexWrap:'wrap' }}>
            <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(34px,4vw,52px)', fontWeight:800, letterSpacing:'-1.5px', lineHeight:1.12 }}>More than<br />a marketplace.</h2>
            <p style={{ fontSize:17, color:T.textMuted, maxWidth:460, lineHeight:1.65 }}>PivotHire is a trust network. When great founders know each other, hiring becomes a warm referral—not a cold search.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap:20, marginTop: isMobile ? 36 : 56 }}>
            {[
              { icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title:'Founder Dinners', desc:'Intimate curated dinners across Delhi, Bangalore, and Mumbai. No pitch decks. No name badges. Just founders talking honestly.' },
              { icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title:'VC Partnerships', desc:"We work directly with VCs to surface talent for portfolio companies. PivotHire is talent insurance for your cap table." },
              { icon:'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', title:'Referral-Only Network', desc:'Every member nominates just 2–3 others. Quality stays high because reputations are on the line—not just profiles.' },
            ].map((c, i) => (
              <Reveal key={i} delay={i * 0.1}><CommunityCard {...c} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background:T.dark, padding: isMobile ? '72px 20px' : '120px 48px', textAlign:'center' }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(36px,5vw,60px)', fontWeight:800, letterSpacing:'-2px', lineHeight:1.1, color:T.white, marginBottom:20 }}>
            Your next chapter starts<br />with people who've been there.
          </h2>
          <p style={{ color:T.muted, fontSize:18, marginBottom:44, lineHeight:1.65 }}>Join 347 ex-founders who've found their next mission, or connect with builders who don't need hand-holding.</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, flexWrap:'wrap' }}>
            <BtnPrimary size="lg" onClick={goRegister}>Apply to the Registry →</BtnPrimary>
            <BtnGhost onClick={goRegister} style={{ padding:'14px 28px', fontSize:15 }}>Start hiring builders</BtnGhost>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:T.dark2, borderTop:`1px solid ${T.border}`, padding: isMobile ? '36px 20px' : '36px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
        <PivotHireLogo size={28} />
        <p style={{ fontSize:13, color:T.muted }}>© 2026 PivotHire. All rights reserved.</p>
        <div style={{ display:'flex', gap:24 }}>
          {['Privacy','Terms','Contact','X (Twitter)'].map(l => (
            <a key={l} href="#" onClick={e=>e.preventDefault()} style={{ fontSize:13, color:T.muted, textDecoration:'none' }}
              onMouseEnter={e=>e.target.style.color=T.white}
              onMouseLeave={e=>e.target.style.color=T.muted}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
