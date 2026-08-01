import React, { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

// Per-theme accent colors for canvas
const THEME_PALETTE: Record<string, { a: string; b: string; bg: string; light: boolean }> = {
  midnight: { a: '34,211,238',  b: '99,102,241',  bg: '#03050d', light: false },
  aurora:   { a: '192,132,252', b: '236,72,153',  bg: '#06010f', light: false },
  daylight: { a: '99,102,241',  b: '59,130,246',  bg: '#f8fafc', light: true  },
  ember:    { a: '245,158,11',  b: '239,68,68',   bg: '#0d0801', light: false },
};

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  baseX: number; baseY: number;
  size: number;
  phase: number;
  type: 'dot' | 'ring' | 'cross';
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

const N = 120;           // increased particle count
const MAX_DIST = 190;   // connection distance
const Z_SPREAD = 450;   // depth range

function makeParticles(w: number, h: number): Particle[] {
  return Array.from({ length: N }, () => {
    const x = (Math.random() - 0.5) * w * 1.5;
    const y = (Math.random() - 0.5) * h * 1.5;
    return {
      x, y,
      z: Math.random() * Z_SPREAD - Z_SPREAD / 2,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      vz: (Math.random() - 0.5) * 0.4,
      baseX: x, baseY: y,
      size: Math.random() * 2.8 + 1,
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
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const rafRef = useRef<number>(0);
  const { theme } = useTheme();
  const themeRef = useRef(theme);

  useEffect(() => { themeRef.current = theme; }, [theme]);

  // Track mouse position and click shockwaves
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleClick = (e: MouseEvent) => {
      // Add shockwave on click
      shockwavesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 10,
        maxRadius: 280,
        alpha: 1.0,
      });

      // Apply explosive impulse to nearby particles
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;
      const clickX = e.clientX;
      const clickY = e.clientY;

      for (const p of particlesRef.current) {
        const { px, py } = project(p.x, p.y, p.z, cx, cy);
        const dx = px - clickX;
        const dy = py - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 280 && dist > 1) {
          const force = ((280 - dist) / 280) * 8;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let w = 0, h = 0;

    function resize() {
      w = canvas!.width  = window.innerWidth;
      h = canvas!.height = window.innerHeight;
      particlesRef.current = makeParticles(w, h);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);

    function draw() {
      const pal = THEME_PALETTE[themeRef.current] || THEME_PALETTE.midnight;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, w, h);

      // Radial glowing spotlight following mouse
      if (mouseRef.current.active) {
        const grd = ctx.createRadialGradient(mx, my, 0, mx, my, 350);
        grd.addColorStop(0, `rgba(${pal.a},${pal.light ? 0.12 : 0.16})`);
        grd.addColorStop(0.5, `rgba(${pal.b},${pal.light ? 0.05 : 0.08})`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      }

      // Draw active click shockwaves
      const activeShockwaves = shockwavesRef.current;
      for (let s = activeShockwaves.length - 1; s >= 0; s--) {
        const sw = activeShockwaves[s];
        sw.radius += 8;
        sw.alpha *= 0.94;

        if (sw.alpha > 0.01 && sw.radius < sw.maxRadius) {
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${pal.a},${(sw.alpha * 0.7).toFixed(3)})`;
          ctx.lineWidth = 2.5 * (1 - sw.radius / sw.maxRadius);
          ctx.stroke();

          // Outer secondary ring
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius * 0.7, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${pal.b},${(sw.alpha * 0.4).toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else {
          activeShockwaves.splice(s, 1);
        }
      }

      // Update + draw 3D particles
      const particles = particlesRef.current;
      const projected: { px: number; py: number; scale: number; i: number }[] = [];

      const camX = ((mx / w) - 0.5) * 40;
      const camY = ((my / h) - 0.5) * 40;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.phase += 0.01;

        p.x += Math.sin(p.phase) * 0.15;
        p.y += Math.cos(p.phase * 0.7) * 0.15;

        // Interactive mouse repulsion/attraction
        const { px: ppx, py: ppy } = project(p.x, p.y, p.z, cx, cy);
        const mdx = ppx - mx;
        const mdy = ppy - my;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);

        if (md < 160 && md > 0) {
          const force = (160 - md) / 160 * 0.6;
          p.vx += (mdx / md) * force * 0.25;
          p.vy += (mdy / md) * force * 0.25;
        }

        // Friction / drag
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.vz *= 0.985;

        // Boundaries
        if (p.z > Z_SPREAD / 2) p.vz = -Math.abs(p.vz);
        if (p.z < -Z_SPREAD / 2) p.vz = Math.abs(p.vz);
        if (Math.abs(p.x) > w * 0.9) p.vx *= -0.7;
        if (Math.abs(p.y) > h * 0.9) p.vy *= -0.7;

        const { px, py, scale } = project(p.x - camX, p.y - camY, p.z, cx, cy);
        projected.push({ px, py, scale, i });
      }

      // Draw particle connections
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.px - b.px;
          const dy = a.py - b.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.45 * Math.min(a.scale, b.scale);
            ctx.beginPath();
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.strokeStyle = `rgba(${pal.a},${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.9 * Math.min(a.scale, b.scale);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const { px, py, scale, i } of projected) {
        const p = particles[i];
        const alpha = (0.55 + 0.45 * scale) * 0.95;
        const r = p.size * scale;
        const useB = i % 3 === 0;
        const col = useB ? pal.b : pal.a;

        if (p.type === 'ring') {
          ctx.beginPath();
          ctx.arc(px, py, r * 1.8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${col},${(alpha * 0.65).toFixed(3)})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(px, py, r * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${col},${alpha.toFixed(3)})`;
          ctx.fill();
        } else if (p.type === 'cross') {
          const cr = r * 1.5;
          ctx.strokeStyle = `rgba(${col},${(alpha * 0.8).toFixed(3)})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(px - cr, py); ctx.lineTo(px + cr, py);
          ctx.moveTo(px, py - cr); ctx.lineTo(px, py + cr);
          ctx.stroke();
        } else {
          const gd = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
          gd.addColorStop(0, `rgba(${col},${alpha.toFixed(3)})`);
          gd.addColorStop(0.4, `rgba(${col},${(alpha * 0.45).toFixed(3)})`);
          gd.addColorStop(1, `rgba(${col},0)`);
          ctx.beginPath();
          ctx.arc(px, py, r * 3, 0, Math.PI * 2);
          ctx.fillStyle = gd;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

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
