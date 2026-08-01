import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';

// Per-theme accent colors for canvas
const THEME_PALETTE: Record<string, { a: string; b: string; bg: string; light: boolean }> = {
  midnight: { a: '34,211,238',  b: '99,102,241',  bg: 'rgba(3,5,13,1)',     light: false },
  aurora:   { a: '192,132,252', b: '236,72,153',  bg: 'rgba(6,1,15,1)',     light: false },
  daylight: { a: '99,102,241',  b: '59,130,246',  bg: 'rgba(248,250,252,1)', light: true  },
  ember:    { a: '245,158,11',  b: '239,68,68',   bg: 'rgba(13,8,1,1)',     light: false  },
};

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  baseX: number; baseY: number;
  size: number;
  phase: number;       // sine wave phase for wobble
  type: 'dot' | 'ring' | 'cross';
}

const N = 90;           // particle count
const MAX_DIST = 180;   // connection distance
const Z_SPREAD = 400;   // depth range

function makeParticles(w: number, h: number): Particle[] {
  return Array.from({ length: N }, () => {
    const x = (Math.random() - 0.5) * w * 1.4;
    const y = (Math.random() - 0.5) * h * 1.4;
    return {
      x, y,
      z: Math.random() * Z_SPREAD - Z_SPREAD / 2,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      vz: (Math.random() - 0.5) * 0.3,
      baseX: x, baseY: y,
      size: Math.random() * 2.5 + 1,
      phase: Math.random() * Math.PI * 2,
      type: (['dot', 'ring', 'dot', 'dot', 'cross'] as const)[Math.floor(Math.random() * 5)],
    };
  });
}

function project(x: number, y: number, z: number, cx: number, cy: number) {
  const fov = 500;
  const scale = fov / (fov + z + Z_SPREAD / 2);
  return { px: cx + x * scale, py: cy + y * scale, scale };
}

export default function Canvas3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const { theme } = useTheme();
  const themeRef = useRef(theme);

  // Keep themeRef current without re-running the animation effect
  useEffect(() => { themeRef.current = theme; }, [theme]);

  // Mouse tracking — use ref so animation loop reads latest without re-subscriptions
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let w = 0, h = 0;

    function resize() {
      w = canvas!.width  = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      // Re-center existing particles
      particlesRef.current = makeParticles(w, h);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

    let t = 0;

    function draw() {
      const pal = THEME_PALETTE[themeRef.current] || THEME_PALETTE.midnight;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const cx = w / 2;
      const cy = h / 2;

      // Clear with bg color
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle radial glow at mouse position
      const grd = ctx.createRadialGradient(mx, my, 0, mx, my, 300);
      grd.addColorStop(0, `rgba(${pal.a},${pal.light ? 0.06 : 0.08})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // Large ambient glow
      const grd2 = ctx.createRadialGradient(cx * 0.6, cy * 0.6, 0, cx * 0.6, cy * 0.6, Math.max(w, h) * 0.7);
      grd2.addColorStop(0, `rgba(${pal.a},${pal.light ? 0.04 : 0.07})`);
      grd2.addColorStop(0.5, `rgba(${pal.b},${pal.light ? 0.03 : 0.04})`);
      grd2.addColorStop(1, 'transparent');
      ctx.fillStyle = grd2;
      ctx.fillRect(0, 0, w, h);

      // Update + draw particles
      const particles = particlesRef.current;
      const projected: { px: number; py: number; scale: number; i: number }[] = [];

      // Camera drift with mouse parallax
      const camX = ((mx / w) - 0.5) * 30;
      const camY = ((my / h) - 0.5) * 30;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Drift
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.phase += 0.008;

        // Wobble
        p.x += Math.sin(p.phase) * 0.12;
        p.y += Math.cos(p.phase * 0.7) * 0.12;

        // Mouse repulsion / attraction
        const { px: ppx, py: ppy } = project(p.x, p.y, p.z, cx, cy);
        const mdx = ppx - mx;
        const mdy = ppy - my;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 120) {
          const force = (120 - md) / 120 * 0.4;
          p.vx += (mdx / md) * force * 0.15;
          p.vy += (mdy / md) * force * 0.15;
        }

        // Friction
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.vz *= 0.988;

        // Boundary — wrap z, bounce xy softly
        if (p.z > Z_SPREAD / 2) p.vz = -Math.abs(p.vz);
        if (p.z < -Z_SPREAD / 2) p.vz = Math.abs(p.vz);
        if (Math.abs(p.x) > w * 0.9) p.vx *= -0.6;
        if (Math.abs(p.y) > h * 0.9) p.vy *= -0.6;

        // Project with camera parallax
        const { px, py, scale } = project(p.x - camX, p.y - camY, p.z, cx, cy);
        projected.push({ px, py, scale, i });
      }

      // Draw connections first
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.px - b.px;
          const dy = a.py - b.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.35 * Math.min(a.scale, b.scale);
            ctx.beginPath();
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.strokeStyle = `rgba(${pal.a},${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.7 * Math.min(a.scale, b.scale);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const { px, py, scale, i } of projected) {
        const p = particles[i];
        const alpha = (0.5 + 0.5 * scale) * 0.9;
        const r = p.size * scale;
        const useB = i % 3 === 0;
        const col = useB ? pal.b : pal.a;

        if (p.type === 'ring') {
          ctx.beginPath();
          ctx.arc(px, py, r * 1.6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${col},${(alpha * 0.55).toFixed(3)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          // inner dot
          ctx.beginPath();
          ctx.arc(px, py, r * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${col},${alpha.toFixed(3)})`;
          ctx.fill();
        } else if (p.type === 'cross') {
          const cr = r * 1.4;
          ctx.strokeStyle = `rgba(${col},${(alpha * 0.7).toFixed(3)})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(px - cr, py); ctx.lineTo(px + cr, py);
          ctx.moveTo(px, py - cr); ctx.lineTo(px, py + cr);
          ctx.stroke();
        } else {
          // Glowing dot
          const gd = ctx.createRadialGradient(px, py, 0, px, py, r * 2.5);
          gd.addColorStop(0, `rgba(${col},${alpha.toFixed(3)})`);
          gd.addColorStop(0.4, `rgba(${col},${(alpha * 0.4).toFixed(3)})`);
          gd.addColorStop(1, `rgba(${col},0)`);
          ctx.beginPath();
          ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = gd;
          ctx.fill();
        }
      }

      t++;
      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);  // Only run once — themeRef handles theme changes without restart

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        display: 'block',
        pointerEvents: 'none',
      }}
      aria-hidden
    />
  );
}
