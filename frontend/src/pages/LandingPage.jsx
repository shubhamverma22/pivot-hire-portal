import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PivotHireLogo } from '../components/Logo';

/* ── Design tokens ── */
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

const HEAD = 'Georgia, "Times New Roman", serif';
const SUB  = 'Georgia, "Times New Roman", serif';
const BODY = 'DM Sans, sans-serif';

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

const BtnPrimary = ({ children, onClick, style={}, size='md' }) => {
  const [hov, setHov] = useState(false);
  const pad = size === 'lg' ? '14px 28px' : '9px 20px';
  const fs = size === 'lg' ? 15 : 14;
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? T.primaryHover : T.primary, color:'#fff', border:'none', padding:pad, borderRadius:10, fontFamily:BODY, fontSize:fs, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, transition:'all 0.2s', transform: hov ? 'translateY(-1px)' : 'none', boxShadow: hov ? `0 12px 32px ${T.glow}` : 'none', ...style }}>
      {children}
    </button>
  );
};

const BtnGhost = ({ children, onClick, style={}, dark=true }) => {
  const [hov, setHov] = useState(false);
  const baseColor = dark ? T.white : T.textDark;
  const baseBorder = dark ? T.border : 'rgba(14,22,10,0.18)';
  const hoverBorder = dark ? T.borderHover : 'rgba(14,22,10,0.36)';
  const hoverBg = dark ? 'rgba(255,255,255,0.07)' : 'rgba(14,22,10,0.04)';
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? hoverBg : 'transparent', color:baseColor, border:`1px solid ${hov ? hoverBorder : baseBorder}`, padding:'9px 20px', borderRadius:10, fontFamily:BODY, fontSize:14, fontWeight:500, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, transition:'all 0.2s', ...style }}>
      {children}
    </button>
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
   LANDING PAGE
══════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('employpreneur');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const goLogin = () => navigate('/login');
  const goRegister = () => navigate('/register');

  const employpreneurSteps = [
    { n:'01', title:'Build your founder profile', desc:"Tell us what you've built, what broke, what you learned, and what kind of environment you do your best work in. No résumé. No cover letter." },
    { n:'02', title:'We match you on mindset', desc:'Our algorithm surfaces startups whose stage, culture, and leadership style align with how you operate — not just who has an open role.' },
    { n:'03', title:'Meet the founder with full context', desc:"You go into every intro knowing the company's stage, what they're solving, and why they think you're the right fit. No blind applications, no wasted conversations." },
    { n:'04', title:'Build something worth building', desc:"Accept the role, align on ownership, and get back to doing what you're built for." },
  ];

  const entrepreneurSteps = [
    { n:'01', title:"Tell us what you're building and who you need", desc:"Not just the role — the gaps, the stage, the kind of person who'll thrive in your specific environment. Be honest about the chaos." },
    { n:'02', title:'We match you with employpreneurs', desc:'Profiles surfaced based on mindset alignment, stage readiness, and operating style — not résumé keywords.' },
    { n:'03', title:'Review profiles with real context', desc:"Every profile tells you what someone built, what didn't work, and how they think. You're assessing fit before the first conversation." },
    { n:'04', title:'Make the intro count', desc:'A warm, context-rich introduction on both sides. Faster decisions, less wasted time, higher signal from the first meeting.' },
  ];

  const steps = activeTab === 'employpreneur' ? employpreneurSteps : entrepreneurSteps;

  const links = [
    { label: 'Why PivotHire', href: '#why' },
    { label: 'How it works', href: '#how' },
    { label: "Who it's for", href: '#who' },
  ];

  return (
    <div style={{ background: T.dark, color: T.white, fontFamily: BODY }}>
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

      {/* ── SECTION 1 — HERO ── */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: isMobile ? '120px 20px 80px' : '140px 48px 120px', position:'relative', textAlign:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 90% 60% at 50% -5%, rgba(255,102,0,0.18) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 85% 85%, rgba(28,60,10,0.35) 0%, transparent 50%), ${T.dark}`, zIndex:0 }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)', backgroundSize:'72px 72px', maskImage:'radial-gradient(ellipse 75% 65% at 50% 25%, black 0%, transparent 68%)', WebkitMaskImage:'radial-gradient(ellipse 75% 65% at 50% 25%, black 0%, transparent 68%)', zIndex:0 }} />
        <Orb size={420} x={-8} y={10} color="rgba(255,102,0,0.07)" anim="floatA" dur={9} delay={0} />
        <Orb size={360} x={70} y={-15} color="rgba(28,60,10,0.25)" anim="floatB" dur={11} delay={2} />
        <Orb size={280} x={80} y={55} color="rgba(255,102,0,0.06)" anim="floatC" dur={14} delay={1} />
        <Orb size={200} x={10} y={60} color="rgba(28,60,10,0.18)" anim="floatB" dur={8} delay={3} />

        <div style={{ position:'relative', zIndex:1, maxWidth:920 }}>
          <div className="fade-up" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,102,0,0.1)', border:'1px solid rgba(255,102,0,0.3)', borderRadius:100, padding:'6px 18px', fontSize:13, fontWeight:500, color:'rgba(255,140,60,1)', marginBottom:36 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:T.primary, animation:'pulse 2s infinite', display:'inline-block' }} />
            Invite-only · Now onboarding employpreneurs
          </div>

          <h1 className="fade-up-2" style={{ fontFamily:HEAD, fontSize:'clamp(40px,6.5vw,76px)', fontWeight:700, lineHeight:1.1, letterSpacing:'-1.5px', color:T.white, marginBottom:28 }}>
            You've already built.<br />
            Now build with{' '}
            <span style={{ background:'linear-gradient(120deg, #4A7A1A 0%, #FF6600 60%, #FF8C33 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontStyle:'italic' }}>someone who gets it.</span>
          </h1>

          <p className="fade-up-3" style={{ fontSize:'clamp(16px,2vw,20px)', color:T.muted, maxWidth:640, margin:'0 auto 48px', lineHeight:1.7, fontFamily:BODY }}>
            PivotHire connects entrepreneurs who need their first real hires with <em>employpreneurs</em> — people who've founded, pivoted, and are ready to build again inside a startup that deserves their experience.
          </p>

          <div className="fade-up-4" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
            <BtnPrimary size="lg" onClick={goRegister}>
              I've built before, I want back in →
            </BtnPrimary>
            <BtnGhost onClick={goRegister} style={{ padding:'14px 28px', fontSize:15 }}>
              I'm a founder, I need builders →
            </BtnGhost>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — THE PROBLEM WE'RE SOLVING ── */}
      <section id="problem" style={{ background:T.dark2, padding: isMobile ? '88px 20px' : '128px 48px', position:'relative' }}>
        <div style={{ maxWidth:880, margin:'0 auto' }}>
          <Reveal>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:T.primary, marginBottom:18 }}>The Problem We're Solving</div>
            <h2 style={{ fontFamily:HEAD, fontSize:'clamp(30px,3.6vw,46px)', fontWeight:700, letterSpacing:'-1px', lineHeight:1.2, color:T.white, marginBottom:36 }}>
              Most hiring platforms were built for corporate careers.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ fontSize:'clamp(16px,1.6vw,19px)', color:T.muted, lineHeight:1.8, marginBottom:24, fontFamily:BODY }}>
              Early-stage startups don't have corporate problems — they have <span style={{ color:T.white }}>founder problems</span>. Speed, ambiguity, ownership, trust. The people who understand that best are the ones who've already lived it.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <p style={{ fontSize:'clamp(16px,1.6vw,19px)', color:T.muted, lineHeight:1.8, marginBottom:24, fontFamily:BODY }}>
              <span style={{ color:T.white, fontWeight:500 }}>Employpreneurs</span> — former founders who've pivoted, paused, or closed — carry something no job board can surface: the experience of building from nothing. They're not looking for a job. They're looking for a mission worth joining.
            </p>
          </Reveal>
          <Reveal delay={0.26}>
            <p style={{ fontSize:'clamp(17px,1.7vw,20px)', color:T.white, lineHeight:1.8, fontStyle:'italic', fontFamily:HEAD, marginTop:32 }}>
              PivotHire exists for both sides of that equation.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── SECTION 3 — WHY PIVOTHIRE ── */}
      <section id="why" style={{ background:T.cardBg, padding: isMobile ? '88px 20px' : '128px 48px', color:T.textDark }}>
        <div style={{ maxWidth:1120, margin:'0 auto' }}>
          <Reveal>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:T.primary, marginBottom:14, textAlign:'center' }}>Why PivotHire</div>
            <h2 style={{ fontFamily:HEAD, fontSize:'clamp(30px,3.8vw,48px)', fontWeight:700, letterSpacing:'-1px', lineHeight:1.2, textAlign:'center', marginBottom: isMobile ? 56 : 80 }}>
              Built for both sides of the table.
            </h2>
          </Reveal>

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 56 : 64 }}>
            {/* For Employpreneurs */}
            <Reveal delay={0.05}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:T.primary, marginBottom:14 }}>For Employpreneurs</div>
                <h3 style={{ fontFamily:HEAD, fontSize:'clamp(24px,2.6vw,32px)', fontWeight:700, letterSpacing:'-0.5px', lineHeight:1.25, marginBottom:32 }}>
                  Your pivot is your edge. We help you use it.
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
                  {[
                    { t:'Matched on mindset, not credentials', d:"We don't filter by job title or years of experience. We match on how you operate — your risk appetite, ownership style, and the kind of stage you thrive in." },
                    { t:'Founders who actually value what you bring', d:"Every entrepreneur on PivotHire knows they're hiring someone who's been in the room where decisions get made with no playbook. That context changes how they hire." },
                    { t:'Back in the game — on your terms', d:'No contract gigs. No advisory roles. Real, embedded positions with early-stage startups building something that matters.' },
                  ].map((p, i) => (
                    <div key={i} style={{ display:'flex', gap:16 }}>
                      <div style={{ flexShrink:0, width:6, height:6, borderRadius:'50%', background:T.primary, marginTop:11 }} />
                      <div>
                        <div style={{ fontFamily:SUB, fontSize:17, fontWeight:700, color:T.textDark, marginBottom:6, lineHeight:1.35 }}>{p.t}</div>
                        <p style={{ fontSize:15, color:T.textMuted, lineHeight:1.7, fontFamily:BODY }}>{p.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* For Entrepreneurs */}
            <Reveal delay={0.12}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:T.primary, marginBottom:14 }}>For Entrepreneurs</div>
                <h3 style={{ fontFamily:HEAD, fontSize:'clamp(24px,2.6vw,32px)', fontWeight:700, letterSpacing:'-0.5px', lineHeight:1.25, marginBottom:32 }}>
                  Your first hires will define the next three years. Get them right.
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
                  {[
                    { t:"Talent that doesn't need hand-holding", d:'Employpreneurs have shipped products, managed teams, and made hard calls under pressure. They come ready — not just capable.' },
                    { t:'Matched beyond role fit', d:'Our algorithm aligns on ownership mindset, stage readiness, and working style — not just who has the right keywords on their profile.' },
                    { t:'Trust before the first meeting', d:"Every employpreneur on PivotHire has been through our profiling process. You're not starting from zero on culture fit." },
                  ].map((p, i) => (
                    <div key={i} style={{ display:'flex', gap:16 }}>
                      <div style={{ flexShrink:0, width:6, height:6, borderRadius:'50%', background:T.primary, marginTop:11 }} />
                      <div>
                        <div style={{ fontFamily:SUB, fontSize:17, fontWeight:700, color:T.textDark, marginBottom:6, lineHeight:1.35 }}>{p.t}</div>
                        <p style={{ fontSize:15, color:T.textMuted, lineHeight:1.7, fontFamily:BODY }}>{p.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — HOW IT WORKS ── */}
      <section id="how" style={{ background:T.dark2, padding: isMobile ? '88px 20px' : '128px 48px' }}>
        <div style={{ maxWidth:1120, margin:'0 auto' }}>
          <Reveal>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(255,140,60,1)', marginBottom:14, textAlign:'center' }}>How it works</div>
            <h2 style={{ fontFamily:HEAD, fontSize:'clamp(30px,3.8vw,48px)', fontWeight:700, letterSpacing:'-1px', lineHeight:1.2, color:T.white, textAlign:'center', marginBottom:36 }}>
              Four steps. No noise.
            </h2>
          </Reveal>

          <div style={{ display:'flex', justifyContent:'center', marginBottom:48 }}>
            <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.06)', borderRadius:10, padding:4 }}>
              {[
                { id:'employpreneur', label:"I'm an Employpreneur" },
                { id:'entrepreneur',  label:"I'm an Entrepreneur" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ padding: isMobile ? '10px 14px' : '10px 22px', borderRadius:7, fontSize: isMobile ? 13 : 14, fontWeight:500, cursor:'pointer', border:'none', fontFamily:BODY, background: activeTab===tab.id ? T.primary : 'transparent', color: activeTab===tab.id ? '#fff' : T.muted, transition:'all 0.2s' }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap:2 }}>
            {steps.map((s, i) => (
              <Reveal key={s.n + activeTab} delay={i * 0.09}>
                <div style={{ background:T.dark3, padding: isMobile ? '24px 20px' : '36px 28px', borderRadius: isMobile ? 12 : (i===0?'16px 0 0 16px':i===steps.length-1?'0 16px 16px 0':0), position:'relative', height:'100%' }}>
                  {!isMobile && i < steps.length-1 && (
                    <div style={{ position:'absolute', right:-10, top:36, color:'rgba(255,102,0,0.5)', fontSize:18, zIndex:1 }}>→</div>
                  )}
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2px', color:T.primary, textTransform:'uppercase', marginBottom:20 }}>{s.n}</div>
                  <div style={{ fontFamily:SUB, fontSize:17, fontWeight:700, color:T.white, marginBottom:12, lineHeight:1.3 }}>{s.title}</div>
                  <p style={{ fontSize:14, color:T.muted, lineHeight:1.7, fontFamily:BODY }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — WHO IT'S FOR ── */}
      <section id="who" style={{ background:T.lightBg, padding: isMobile ? '88px 20px' : '128px 48px', color:T.textDark }}>
        <div style={{ maxWidth:1120, margin:'0 auto' }}>
          <Reveal>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:T.primary, marginBottom:14, textAlign:'center' }}>Who it's for</div>
            <h2 style={{ fontFamily:HEAD, fontSize:'clamp(30px,3.8vw,48px)', fontWeight:700, letterSpacing:'-1px', lineHeight:1.2, textAlign:'center', marginBottom: isMobile ? 56 : 72 }}>
              Self-select honestly. We do.
            </h2>
          </Reveal>

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 28 }}>
            {/* Employpreneurs */}
            <Reveal delay={0.05}>
              <div style={{ background:T.cardBg, borderRadius:20, padding: isMobile ? '32px 24px' : '44px 40px', border:`1px solid ${T.border}`, height:'100%' }}>
                <h3 style={{ fontFamily:HEAD, fontSize:'clamp(22px,2.4vw,28px)', fontWeight:700, letterSpacing:'-0.5px', marginBottom:18, color:T.textDark }}>
                  Employpreneurs
                </h3>
                <p style={{ fontSize:15.5, color:T.textMuted, lineHeight:1.75, marginBottom:14, fontFamily:BODY }}>
                  You've founded something. It didn't go the way you planned — or it did, and you're ready for what's next.
                </p>
                <p style={{ fontSize:15.5, color:T.textMuted, lineHeight:1.75, marginBottom:28, fontFamily:BODY }}>
                  You're not looking for a safe job. You're looking for a startup where your instincts are an asset, not a liability.
                </p>
                <div style={{ fontFamily:SUB, fontSize:16, fontWeight:700, color:T.textDark, marginBottom:14 }}>You're the right fit if:</div>
                <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:12 }}>
                  {[
                    'You founded, co-founded, or led a founding team at a startup',
                    'You\'ve pivoted, paused, or wound down in the last 1–3 years',
                    'You want to be embedded in an early team — not consulting from the outside',
                    'You\'re driven by ownership and impact, not title or stability',
                  ].map((item, i) => (
                    <li key={i} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                      <span style={{ flexShrink:0, width:6, height:6, borderRadius:'50%', background:T.primary, marginTop:9 }} />
                      <span style={{ fontSize:15, color:T.textMuted, lineHeight:1.65, fontFamily:BODY }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Entrepreneurs */}
            <Reveal delay={0.12}>
              <div style={{ background:T.cardBg, borderRadius:20, padding: isMobile ? '32px 24px' : '44px 40px', border:`1px solid ${T.border}`, height:'100%' }}>
                <h3 style={{ fontFamily:HEAD, fontSize:'clamp(22px,2.4vw,28px)', fontWeight:700, letterSpacing:'-0.5px', marginBottom:18, color:T.textDark }}>
                  Entrepreneurs
                </h3>
                <p style={{ fontSize:15.5, color:T.textMuted, lineHeight:1.75, marginBottom:14, fontFamily:BODY }}>
                  You're building something real. You've got conviction, some capital, and a clear problem to solve.
                </p>
                <p style={{ fontSize:15.5, color:T.textMuted, lineHeight:1.75, marginBottom:28, fontFamily:BODY }}>
                  What you don't have is time to hire wrong. Your first 5–10 people will either multiply your speed or kill your momentum.
                </p>
                <div style={{ fontFamily:SUB, fontSize:16, fontWeight:700, color:T.textDark, marginBottom:14 }}>You're the right fit if:</div>
                <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:12 }}>
                  {[
                    "You're at pre-seed, seed, or Series A/B stage",
                    "You're making foundational hires that need to stick",
                    "You want people who've felt the weight of early-stage decisions",
                    "You value how someone thinks over where they've worked",
                  ].map((item, i) => (
                    <li key={i} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                      <span style={{ flexShrink:0, width:6, height:6, borderRadius:'50%', background:T.primary, marginTop:9 }} />
                      <span style={{ fontSize:15, color:T.textMuted, lineHeight:1.65, fontFamily:BODY }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — FOUNDER NOTE ── */}
      <section style={{ background:T.dark, padding: isMobile ? '96px 24px' : '144px 48px', textAlign:'center' }}>
        <div style={{ maxWidth:720, margin:'0 auto' }}>
          <Reveal>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:T.primary, marginBottom:28 }}>A note from the team</div>
          </Reveal>
          <Reveal delay={0.08}>
            <p style={{ fontFamily:HEAD, fontSize:'clamp(20px,2vw,24px)', fontStyle:'italic', color:T.white, lineHeight:1.7, marginBottom:20 }}>
              PivotHire was built because we kept watching the same mismatch happen.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <p style={{ fontFamily:HEAD, fontSize:'clamp(18px,1.8vw,21px)', fontStyle:'italic', color:T.muted, lineHeight:1.75, marginBottom:20 }}>
              Founders with battle-tested instincts sitting on the sidelines. Early-stage startups hiring for credentials and losing months to the wrong people.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <p style={{ fontFamily:HEAD, fontSize:'clamp(18px,1.8vw,21px)', fontStyle:'italic', color:T.muted, lineHeight:1.75, marginBottom:36 }}>
              The gap isn't talent. It's signal. We're building the infrastructure to close it.
            </p>
          </Reveal>
          <Reveal delay={0.32}>
            <p style={{ fontFamily:BODY, fontSize:14, fontWeight:500, color:T.primary, letterSpacing:'1px', textTransform:'uppercase' }}>
              — The PivotHire Team
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── SECTION 7 — FINAL CTA ── */}
      <section style={{ background:`linear-gradient(135deg, ${T.dark3} 0%, rgba(28,60,10,0.4) 100%)`, padding: isMobile ? '88px 20px' : '120px 48px', textAlign:'center', position:'relative', overflow:'hidden', borderTop:`1px solid ${T.border}` }}>
        <div style={{ position:'absolute', top:-80, left:'50%', transform:'translateX(-50%)', width:520, height:520, borderRadius:'50%', background:'rgba(255,102,0,0.1)', filter:'blur(100px)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1, maxWidth:780, margin:'0 auto' }}>
          <Reveal>
            <h2 style={{ fontFamily:HEAD, fontSize:'clamp(32px,4.5vw,56px)', fontWeight:700, letterSpacing:'-1.2px', lineHeight:1.15, color:T.white, marginBottom:36 }}>
              The right hire changes everything.<br />
              <span style={{ fontStyle:'italic', background:'linear-gradient(120deg, #4A7A1A 0%, #FF6600 60%, #FF8C33 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>So does the right next move.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, flexWrap:'wrap', marginBottom:24 }}>
              <BtnPrimary size="lg" onClick={goRegister}>Apply as an Employpreneur →</BtnPrimary>
              <BtnGhost onClick={goRegister} style={{ padding:'14px 28px', fontSize:15 }}>Hire an Employpreneur →</BtnGhost>
            </div>
          </Reveal>
          <Reveal delay={0.18}>
            <p style={{ fontFamily:HEAD, fontStyle:'italic', fontSize:14, color:T.muted, marginTop:8 }}>
              Invite-only access. No spam. No job board noise.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:T.dark2, borderTop:`1px solid ${T.border}`, padding: isMobile ? '32px 20px' : '36px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <PivotHireLogo size={28} />
          <p style={{ fontSize:13, color:T.muted, fontFamily:BODY }}>
            © 2025 PivotHire · <span style={{ fontStyle:'italic', fontFamily:HEAD }}>Built for founders, by people who've been there.</span>
          </p>
        </div>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
          {[
            { label:'For Employpreneurs', onClick:goRegister },
            { label:'For Entrepreneurs',  onClick:goRegister },
            { label:'Sign In',            onClick:goLogin },
            { label:'Privacy',            onClick:()=>{} },
          ].map(l => (
            <a key={l.label} href="#" onClick={e=>{ e.preventDefault(); l.onClick(); }} style={{ fontSize:13, color:T.muted, textDecoration:'none', fontFamily:BODY }}
              onMouseEnter={e=>e.target.style.color=T.white}
              onMouseLeave={e=>e.target.style.color=T.muted}>{l.label}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
