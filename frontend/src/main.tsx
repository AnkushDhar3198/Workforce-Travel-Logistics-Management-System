import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// === Global cursor glow follower ===
const glowEl = document.createElement('div');
glowEl.className = 'cursor-glow';
document.body.appendChild(glowEl);

let glowX = window.innerWidth / 2;
let glowY = window.innerHeight / 2;
let currentX = glowX;
let currentY = glowY;

window.addEventListener('mousemove', (e) => {
  glowX = e.clientX;
  glowY = e.clientY;
}, { passive: true });

// Smooth lerp the glow toward cursor
function animateGlow() {
  currentX += (glowX - currentX) * 0.08;
  currentY += (glowY - currentY) * 0.08;
  glowEl.style.left = currentX + 'px';
  glowEl.style.top = currentY + 'px';
  requestAnimationFrame(animateGlow);
}
animateGlow();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
