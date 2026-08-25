import { syncEngine } from './lib/localSync.js';
import { renderLiveStage } from './sections/liveStage.js';
import { renderHero } from './sections/hero.js';
import { renderAbout } from './sections/about.js';
import { renderGallery } from './sections/gallery.js';
import { renderWork } from './sections/work.js';
import { renderNotice } from './sections/notice.js';
import { renderDonations } from './sections/donations.js';

// App State
let state = {
  user: JSON.parse(localStorage.getItem('kns_user')) || null,
  role: localStorage.getItem('kns_role') || null,
  view: localStorage.getItem('kns_view') || 'public',
  donation: { step: 1, amount: 0 },
  liveStage: { active: false },
  leaderboard: [],
  publicRegs: []
};

let appData = syncEngine.getData();

// Sync with Local Engine
syncEngine.onUpdate((data) => {
  appData = data;
  renderApp(true);
});

// ============================================================
// Core Rendering
// ============================================================
const renderApp = (isUpdate = false) => {
  // Update Navbar
  updateNavbar();

  // Dashboard logic
  if (state.view === 'dashboard' && state.role) {
    // If we're in dashboard, we need to handle the whole page differently
    // For now, let's just use the portal.html for dashboards or a dedicated overlay
    console.log("Dashboard view requested for role:", state.role);
    const portalMap = {
      'admin': 'KNSDC-Admin.html',
      'finance': 'KNSDC-Finance.html',
      'host': 'KNSDC-Host.html',
      'judge': 'KNSDC-Judge.html',
      'monitor': 'KNSDC-Monitor.html',
      'sportsmanager': 'KNSDC-umpior.html',
      'umpire': 'KNSDC-umpior.html',
      'referee': 'KNSDC-Referee.html',
      'food_partner': 'KNSDC-Services.html',
      'transport_partner': 'KNSDC-Services.html'
    };
    window.location.href = portalMap[state.role] || `KNSDC-${state.role.charAt(0).toUpperCase() + state.role.slice(1)}.html`;
    return;
  }

  // Populate Sections if they exist
  const liveRoot = document.getElementById('live-stage-root');
  if (liveRoot) liveRoot.innerHTML = renderLiveStage(appData);

  const noticeTrack = document.getElementById('marqueeTrack');
  if (noticeTrack) {
     const events = appData.upcomingEvents || [];
     noticeTrack.innerHTML = [...events, ...events].map(e => `
        <span style="display:inline-flex; align-items:center; gap:8px; color:#fff; font-weight:800; font-size:0.9rem">
          <span>📢</span> ${e.name} — ${e.date} <span style="opacity:0.4; margin:0 14px">◆</span>
        </span>
     `).join('');
  }

  const eventsGrid = document.getElementById('eventsGrid');
  if (eventsGrid && !isUpdate) {
     eventsGrid.innerHTML = renderNotice(appData);
  }

  const donationsGrid = document.getElementById('donationsGrid');
  if (donationsGrid && !isUpdate) {
     donationsGrid.innerHTML = renderDonations(appData);
  }

  // Gallery and Work
  const galleryGrid = document.getElementById('galleryGrid');
  if (galleryGrid && !isUpdate) {
      galleryGrid.innerHTML = renderGallery(appData);
  }

  const prevEventsGrid = document.getElementById('prevEventsGrid');
  if (prevEventsGrid && !isUpdate) {
      prevEventsGrid.innerHTML = renderWork(appData);
  }
};

const updateNavbar = () => {
  const navItems = document.getElementById('navItems');
  if (!navItems) return;

  if (state.user) {
    navItems.innerHTML = `
      <button class="nl" onclick="scrollTo('home')">🏠 Home</button>
      <button class="nl" onclick="scrollTo('live')">🔴 Live</button>
      <button class="nl" onclick="scrollTo('donate')">💝 Donate</button>
      <div style="display:flex; align-items:center; gap:12px; margin-left:12px; background:rgba(255,107,53,0.1); padding:5px 15px; border-radius:20px; border:1px solid rgba(255,107,53,0.2);">
        <span style="font-weight:800; font-size:0.8rem; color:#FF6B35;">${state.user.name} (${state.role})</span>
        <button class="nl" style="padding:2px 8px; font-size:0.7rem; background:#FF6B35; color:#fff;" onclick="window.KNS.logout()">Logout</button>
      </div>
    `;
  }
};

// ============================================================
// Global API
// ============================================================
window.KNS = {
  openAuth: (type) => {
    // Show the modal already present in index.html
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('hidden');
    if (type === 'signup') {
        const card = document.getElementById('flipCard');
        if (card) card.classList.add('flipped');
    }
  },

  logout: () => {
    state.user = null;
    state.role = null;
    localStorage.removeItem('kns_user');
    localStorage.removeItem('kns_role');
    window.location.reload();
  },

  submitPublicReg: (eventId) => {
    alert("Registration submitted for event: " + eventId);
    // Logic to update sync engine or Supabase
  },

  nextDonationStep: () => {
     alert("Redirecting to payment gateway...");
  }
};

// Initialize
const initApp = () => {
  appData = syncEngine.getData();
  renderApp();
  
  // Particle Init (if function exists in global scope)
  if (typeof initParticles === 'function') initParticles();
};

document.addEventListener('DOMContentLoaded', initApp);
