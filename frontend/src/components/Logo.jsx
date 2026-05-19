/**
 * PivotHire stacked logo — PIVOT over HIRE with arrow icon.
 * Matches the landing page design.
 *
 * @param {number}  size  - Base font height multiplier (default 32)
 * @param {boolean} dark  - If true, PIVOT text is dark green (for light backgrounds)
 */
export function PivotHireLogo({ size = 32, dark = false }) {
  const pivotColor = dark ? '#1C3C0A' : '#FFFFFF';
  const hireColor  = '#FF6600';
  const lineH = size * 0.55;
  return (
    <a href="/" style={{ display:'flex', alignItems:'center', textDecoration:'none', lineHeight:1 }}>
      <div style={{ display:'flex', flexDirection:'column', gap: size * 0.04 }}>
        <span style={{ fontFamily:"Georgia, 'Times New Roman', serif", fontWeight:800, fontSize: lineH, color: pivotColor, letterSpacing:'0.5px', lineHeight:1, display:'block' }}>PIVOT</span>
        <span style={{ fontFamily:"Georgia, 'Times New Roman', serif", fontWeight:800, fontSize: lineH, color: hireColor, letterSpacing:'0.5px', lineHeight:1, display:'flex', alignItems:'center', gap: lineH * 0.2 }}>
          HIRE
          <svg width={lineH * 0.7} height={lineH * 0.7} viewBox="0 0 20 20" fill="none" style={{ marginBottom: lineH * 0.05 }}>
            <path d="M4 16L16 4M16 4H8M16 4V12" stroke={hireColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </a>
  );
}

/**
 * Compact inline logo for tight spaces (sidebar, mobile topbar).
 * Shows "PIVOT HIRE" on one line with the arrow.
 */
export function PivotHireLogoInline({ size = 14, dark = false }) {
  const pivotColor = dark ? '#1C3C0A' : '#FFFFFF';
  const hireColor  = '#FF6600';
  return (
    <a href="/dashboard" style={{ display:'flex', alignItems:'center', textDecoration:'none', lineHeight:1, gap: size * 0.25 }}>
      <span style={{ fontFamily:"Georgia, 'Times New Roman', serif", fontWeight:800, fontSize: size, color: pivotColor, letterSpacing:'0.5px' }}>PIVOT</span>
      <span style={{ fontFamily:"Georgia, 'Times New Roman', serif", fontWeight:800, fontSize: size, color: hireColor, letterSpacing:'0.5px', display:'flex', alignItems:'center', gap: size * 0.15 }}>
        HIRE
        <svg width={size * 0.75} height={size * 0.75} viewBox="0 0 20 20" fill="none">
          <path d="M4 16L16 4M16 4H8M16 4V12" stroke={hireColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </a>
  );
}
