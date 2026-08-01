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

  // === Interactive card border glow — track mouse for radial gradient ===
  const cards = document.elementsFromPoint(e.clientX, e.clientY);
  for (const el of cards) {
    if (el instanceof HTMLElement && (
      el.classList.contains('v-card') ||
      el.classList.contains('v-stat') ||
      el.classList.contains('v-doc-card')
    )) {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mouse-x', `${x}%`);
      el.style.setProperty('--mouse-y', `${y}%`);
      el.style.borderImage = `radial-gradient(circle at ${x}% ${y}%, var(--border-active), var(--card-border) 60%) 1`;
      el.style.borderImageSlice = '1';
    }
  }
}, { passive: true });

// Reset border glow when mouse leaves a card
window.addEventListener('mouseout', (e) => {
  const target = e.target;
  if (target instanceof HTMLElement && (
    target.classList.contains('v-card') ||
    target.classList.contains('v-stat') ||
    target.classList.contains('v-doc-card')
  )) {
    target.style.borderImage = '';
    target.style.borderImageSlice = '';
  }
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
