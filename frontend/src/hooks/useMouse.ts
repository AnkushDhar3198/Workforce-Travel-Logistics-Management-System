import { useState, useEffect, useRef } from 'react';

export interface MouseState {
  x: number;       // raw px
  y: number;       // raw px
  nx: number;      // normalized -1..1
  ny: number;      // normalized -1..1
  vx: number;      // velocity
  vy: number;
}

/**
 * Global mouse position tracker — updates at native mousemove rate.
 * Returns normalized coords (nx/ny from -1 to +1) and raw px.
 */
export function useMouse(): MouseState {
  const [mouse, setMouse] = useState<MouseState>({ x: 0, y: 0, nx: 0, ny: 0, vx: 0, vy: 0 });
  const prev = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const vx = e.clientX - prev.current.x;
      const vy = e.clientY - prev.current.y;
      prev.current = { x: e.clientX, y: e.clientY };
      setMouse({
        x: e.clientX,
        y: e.clientY,
        nx: (e.clientX / window.innerWidth) * 2 - 1,
        ny: (e.clientY / window.innerHeight) * 2 - 1,
        vx,
        vy,
      });
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return mouse;
}
