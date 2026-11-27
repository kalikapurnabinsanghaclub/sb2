import re

print("Starting Judge Portal Navbar Beautification with beautiful-skill...")

with open('KNSDC-Judge.html', 'r', encoding='utf-8') as f:
    code = f.read()

# ==============================================================================
# 1. ENHANCE CSS FOR TOPBAR, SIDEBAR & MOBILE BOTTOM DOCK
# ==============================================================================

nav_beauty_css = """
  /* ==========================================================================
     BEAUTIFUL-SKILL: VIP JURY NAVIGATION BAR & DOCK (LUXURY NEON NOIR GLASS)
     ========================================================================== */
  
  :root {
    --nav-glass-bg: rgba(15, 23, 42, 0.78);
    --nav-glass-border: rgba(255, 255, 255, 0.12);
    --nav-glass-border-gold: rgba(245, 158, 11, 0.4);
    --nav-glow-gold: rgba(245, 158, 11, 0.28);
    --nav-glow-emerald: rgba(16, 185, 129, 0.35);
  }

  /* Ultra-Premium Glass Topbar */
  .topbar {
    height: 74px !important;
    background: var(--surface) !important;
    background: linear-gradient(180deg, var(--surface) 0%, rgba(var(--surface-rgb, 15, 23, 42), 0.88) 100%) !important;
    backdrop-filter: blur(28px) saturate(190%) !important;
    -webkit-backdrop-filter: blur(28px) saturate(190%) !important;
    border-bottom: 1.5px solid var(--border) !important;
    display: flex !important;
    align-items: center !important;
    padding: 0 28px !important;
    gap: 16px !important;
    z-index: 1000 !important;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.06) inset !important;
    position: sticky !important;
    top: 0 !important;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  /* Left Brand & Menu Capsule */
  .topbar-brand-capsule {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--surface2);
    border: 1px solid var(--border);
    padding: 7px 16px 7px 10px;
    border-radius: 20px;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    user-select: none;
    position: relative;
    overflow: hidden;
  }
  .topbar-brand-capsule::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent 20%, rgba(255, 255, 255, 0.15) 50%, transparent 80%);
    transform: translateX(-150%);
    transition: transform 0.6s ease;
  }
  .topbar-brand-capsule:hover {
    transform: translateY(-2px);
    border-color: var(--amber2);
    box-shadow: 0 6px 20px var(--nav-glow-gold);
  }
  .topbar-brand-capsule:hover::after {
    transform: translateX(150%);
  }
  .topbar-brand-capsule:active {
    transform: scale(0.96);
  }
  .brand-logo-glow {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(245, 158, 11, 0.6);
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.35);
    transition: transform 0.4s ease;
  }
  .topbar-brand-capsule:hover .brand-logo-glow {
    transform: rotate(15deg) scale(1.08);
  }
  .brand-title-wrap {
    display: flex;
    flex-direction: column;
    text-align: left;
    line-height: 1;
  }
  .brand-title-main {
    font-family: var(--fh);
    font-weight: 900;
    font-size: 14px;
    letter-spacing: 0.8px;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #f43f5e 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .brand-title-sub {
    font-family: var(--fm);
    font-size: 8px;
    letter-spacing: 1.5px;
    color: var(--text-muted);
    font-weight: 800;
    text-transform: uppercase;
    margin-top: 3px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Current Page Active Breadcrumb Chip */
  .topbar-page-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 12px;
    font-family: var(--fh);
    font-weight: 800;
    font-size: 14px;
    color: var(--text);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.08);
    transition: all 0.2s ease;
  }
  .topbar-page-chip-icon {
    font-size: 14px;
    filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.5));
  }

  /* Quick Nav Segmented Deck in Topbar (Desktop & Tablet) */
  .topbar-nav-deck {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--surface2);
    border: 1px solid var(--border);
    padding: 4px;
    border-radius: 18px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .topbar-nav-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 15px;
    border-radius: 14px;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-dim);
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    user-select: none;
    position: relative;
    white-space: nowrap;
  }
  .topbar-nav-pill:hover {
    color: var(--text);
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
  .topbar-nav-pill.active {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(244, 63, 94, 0.12) 100%) !important;
    color: var(--text) !important;
    font-weight: 800;
    border: 1px solid rgba(245, 158, 11, 0.4) !important;
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
  }
  .topbar-nav-pill.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 20%;
    right: 20%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #fbbf24, #f43f5e, transparent);
    border-radius: 2px;
    box-shadow: 0 0 8px #fbbf24;
  }
  .topbar-nav-pill:active {
    transform: scale(0.95);
  }
  .nav-pill-badge {
    background: linear-gradient(135deg, #f43f5e, #e11d48);
    color: #fff;
    font-size: 9.5px;
    font-weight: 900;
    padding: 2px 7px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(244, 63, 94, 0.45);
    line-height: 1.1;
  }
  .nav-pill-badge.gold {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1e1b4b;
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.45);
  }
  .nav-pill-badge.chat {
    background: linear-gradient(135deg, #06b6d4, #0284c7);
    color: #fff;
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.45);
  }

  /* VIP Judge Profile Quick Pill in Topbar */
  .topbar-jury-profile-pill {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 5px 12px 5px 6px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  }
  .topbar-jury-profile-pill:hover {
    transform: translateY(-2px);
    border-color: var(--amber2);
    box-shadow: 0 4px 16px var(--nav-glow-gold);
  }
  .topbar-jury-profile-pill:active {
    transform: scale(0.96);
  }
  .topbar-jury-avatar-wrap {
    position: relative;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }
  .topbar-jury-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    color: #fff;
    font-size: 11px;
    border: 1.5px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
    overflow: hidden;
    background-size: cover;
    background-position: center;
  }
  .topbar-jury-status-dot {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    border: 1.5px solid var(--surface);
    box-shadow: 0 0 6px #10b981;
  }
  .topbar-jury-name {
    font-size: 12px;
    font-weight: 800;
    color: var(--text);
    white-space: nowrap;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .topbar-jury-badge {
    font-size: 8px;
    font-weight: 900;
    padding: 1px 5px;
    border-radius: 4px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #fff;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* Live Radar Pulse Indicator */
  .live-beacon-wrap {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px;
    border-radius: 20px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);
  }
  .live-beacon-radar {
    position: relative;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
  }
  .live-beacon-radar::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.4);
    animation: beaconPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  @keyframes beaconPing {
    0% { transform: scale(0.6); opacity: 1; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  .live-beacon-label {
    font-size: 11px;
    font-weight: 800;
    color: #10b981;
    font-family: var(--fm);
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* Tactile Refresh Action Button */
  .topbar-refresh-btn {
    background: var(--surface2) !important;
    border: 1px solid var(--border) !important;
    color: var(--text) !important;
    border-radius: 12px !important;
    padding: 6px 12px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 7px !important;
    cursor: pointer !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03) !important;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .topbar-refresh-btn:hover {
    transform: translateY(-2px) !important;
    border-color: var(--amber2) !important;
    box-shadow: 0 4px 14px var(--nav-glow-gold) !important;
  }
  .topbar-refresh-btn:active {
    transform: scale(0.95) !important;
  }

  /* ==========================================================================
     MOBILE FLOATING BOTTOM NAVIGATION DOCK (PHONES < 768px)
     ========================================================================== */
  .judge-bottom-dock {
    display: none;
    position: fixed;
    bottom: 16px;
    left: 16px;
    right: 16px;
    height: 64px;
    background: rgba(15, 23, 42, 0.88);
    backdrop-filter: blur(28px) saturate(200%);
    -webkit-backdrop-filter: blur(28px) saturate(200%);
    border: 1.5px solid rgba(255, 255, 255, 0.16);
    border-radius: 24px;
    z-index: 9999;
    padding: 0 10px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25);
    align-items: center;
    justify-content: space-around;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
  }
  
  /* When typing, hide dock to keep keyboard unblocked */
  body.keyboard-open .judge-bottom-dock {
    transform: translateY(120%);
    opacity: 0;
    pointer-events: none;
  }

  .dock-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    flex: 1;
    height: 52px;
    border-radius: 16px;
    color: #94a3b8;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    user-select: none;
  }
  .dock-nav-item:active {
    transform: scale(0.90);
  }
  .dock-nav-icon {
    font-size: 19px;
    line-height: 1;
    position: relative;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .dock-nav-label {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.2px;
    transition: color 0.2s ease;
  }
  .dock-nav-item.active {
    color: #fff !important;
  }
  .dock-nav-item.active .dock-nav-icon {
    transform: translateY(-2px) scale(1.12);
    filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.7));
  }
  .dock-nav-item.active .dock-nav-label {
    color: #fbbf24 !important;
    font-weight: 800;
  }
  .dock-nav-item.active::before {
    content: '';
    position: absolute;
    top: 4px;
    width: 20px;
    height: 3px;
    background: linear-gradient(90deg, #fbbf24, #f43f5e);
    border-radius: 4px;
    box-shadow: 0 0 10px #fbbf24;
  }
  .dock-badge {
    position: absolute;
    top: -5px;
    right: -10px;
    background: linear-gradient(135deg, #f43f5e, #e11d48);
    color: #fff;
    font-size: 9px;
    font-weight: 900;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 1.5px solid rgba(15, 23, 42, 0.9);
    box-shadow: 0 2px 6px rgba(244, 63, 94, 0.6);
  }
  .dock-badge.gold {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1e1b4b;
    box-shadow: 0 2px 6px rgba(251, 191, 36, 0.6);
  }
  .dock-badge.chat {
    background: linear-gradient(135deg, #06b6d4, #0284c7);
    color: #fff;
    box-shadow: 0 2px 6px rgba(6, 182, 212, 0.6);
  }

  /* Responsive Rules for Topbar and Navigation */
  @media (max-width: 1080px) {
    .topbar-nav-pill span.pill-text {
      display: none;
    }
    .topbar-nav-pill {
      padding: 7px 10px;
    }
  }
  @media (max-width: 860px) {
    .topbar-nav-deck {
      display: none !important;
    }
  }
  @media (max-width: 768px) {
    .judge-bottom-dock {
      display: flex !important;
    }
    .content {
      padding-bottom: 96px !important; /* Space for floating bottom dock */
    }
    .topbar {
      height: 64px !important;
      padding: 0 14px !important;
      justify-content: space-between !important;
    }
    .topbar-jury-name, .topbar-jury-badge {
      display: none !important;
    }
    .topbar-page-chip {
      padding: 4px 10px !important;
      font-size: 12px !important;
    }
    .mobile-menu-fab {
      display: none !important; /* Replaced by sleek floating bottom dock */
    }
  }
"""

# Insert beautified CSS before </style> in <head>
if 'BEAUTIFUL-SKILL: VIP JURY NAVIGATION BAR' not in code:
    code = code.replace('</style>', nav_beauty_css + '\n</style>', 1)
    print("Added beautified navigation CSS to KNSDC-Judge.html")

# ==============================================================================
# 2. ENHANCE TOPBAR HTML
# ==============================================================================

old_topbar_html = """  <div class="topbar">
    <div onclick="toggleSidebarMenu()" style="display:flex;align-items:center;gap:10px;cursor:pointer;background:var(--surface2);border:1px solid var(--border);padding:6px 12px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.02);" title="Click to show menu">
      <img src="logo.png" alt="Logo" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">
      <div style="display:flex; flex-direction:column; text-align:left; line-height:1;">
        <span style="font-weight:900; font-size:13px; color:var(--text);">KNSDC</span>
        <span style="font-size:7px; letter-spacing:1px; color:var(--text-muted); font-weight:800; text-transform:uppercase; margin-top:2px;">Menu ▾</span>
      </div>
    </div>
    <div class="topbar-title" id="page-title" style="margin-left:8px">Dashboard</div>
    <div id="judge-verification-header-wrap" style="margin-left:16px;"></div>
    <div class="event-badge" id="event-badge" style="margin-left:auto">Loading Event...</div>
    <div id="lock-badge" class="score-lock-badge" style="display:none">⚠️ SCORING LOCKED</div>
    <div style="display:flex;align-items:center;gap:6px" id="judge-status-wrap">
      <div id="judge-status-dot" class="live-dot"></div>
      <span id="judge-status-text" class="live-txt">Live</span>
      
      <!-- Compact Topbar Cloud Sync Indicator -->
      <span id="judge-sync-indicator" title="Cloud Database Sync Status" style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:800;background:rgba(34,197,94,0.12);color:#22c55e;border:1px solid rgba(34,197,94,0.25);margin-left:4px;transition:all 0.2s ease;">
        <span id="judge-sync-dot" class="sync-dot-blink green" style="width:7px;height:7px;border-radius:50%;display:inline-block;"></span>
        <span id="judge-sync-text">Synced</span>
      </span>

      <button class="btn btn-ghost btn-sm" style="border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;gap:6px;font-weight:700;margin-left:10px;padding:4px 10px;font-size:11px" onclick="refreshPortal(this)">
        <span class="refresh-icon">🔄</span> <span class="hide-mobile">Refresh</span>
      </button>
      <label class="switch" title="Toggle Dark Mode">"""

new_topbar_html = """  <div class="topbar">
    <!-- Brand Capsule & Menu Trigger -->
    <div class="topbar-brand-capsule" onclick="toggleSidebarMenu()" title="Toggle Navigation Sidebar">
      <img src="logo.png" alt="Logo" class="brand-logo-glow">
      <div class="brand-title-wrap">
        <span class="brand-title-main">KNSDC</span>
        <span class="brand-title-sub">JURY MENU ▾</span>
      </div>
    </div>

    <!-- Active Section Breadcrumb Chip -->
    <div class="topbar-page-chip" id="topbar-page-chip">
      <span class="topbar-page-chip-icon" id="topbar-page-icon">📊</span>
      <span id="page-title">Dashboard</span>
    </div>

    <!-- Quick Navigation Segmented Dock (Desktop & Tablets) -->
    <div class="topbar-nav-deck" id="topbar-nav-deck">
      <div class="topbar-nav-pill active" onclick="showPage('dashboard', this)" title="Jury Live Dashboard">
        <span>📊</span><span class="pill-text">Dashboard</span>
      </div>
      <div class="topbar-nav-pill" onclick="showPage('scoring', this)" title="Performer Scoring & Audio">
        <span>⚖️</span><span class="pill-text">Scoring</span>
        <span class="nav-pill-badge" id="topbar-pending-badge">3</span>
      </div>
      <div class="topbar-nav-pill" id="topbar-nav-leaderboard" onclick="showPage('leaderboard', this)" title="Official Live Leaderboard">
        <span>🏆</span><span class="pill-text">Leaderboard</span>
        <span class="nav-pill-badge gold">LIVE ⭐</span>
      </div>
      <div class="topbar-nav-pill" onclick="showPage('chat', this)" title="Jury & Official Chat">
        <span>💬</span><span class="pill-text">Chat</span>
        <span class="nav-pill-badge chat" id="topbar-chat-badge" style="display:none;">!</span>
      </div>
      <div class="topbar-nav-pill" onclick="openVerificationModal()" title="View Official Agreement & Terms">
        <span>📜</span><span class="pill-text">Agreement</span>
      </div>
    </div>

    <div id="judge-verification-header-wrap" style="margin-left:auto;"></div>
    <div class="event-badge" id="event-badge">Loading Event...</div>
    <div id="lock-badge" class="score-lock-badge" style="display:none">⚠️ SCORING LOCKED</div>

    <!-- Status, Sync & Control Pod -->
    <div style="display:flex;align-items:center;gap:10px" id="judge-status-wrap">
      <!-- Live Radar Beacon -->
      <div class="live-beacon-wrap" title="Auditorium Live Connection">
        <div id="judge-status-dot" class="live-beacon-radar"></div>
        <span id="judge-status-text" class="live-beacon-label">Live</span>
      </div>
      
      <!-- Compact Topbar Cloud Sync Indicator -->
      <span id="judge-sync-indicator" title="Database Sync Health" style="display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;font-size:11px;font-weight:800;background:rgba(34,197,94,0.12);color:#22c55e;border:1px solid rgba(34,197,94,0.25);transition:all 0.2s ease;">
        <span id="judge-sync-dot" class="sync-dot-blink green" style="width:7px;height:7px;border-radius:50%;display:inline-block;"></span>
        <span id="judge-sync-text">Synced</span>
      </span>

      <!-- VIP Jury Profile Quick Pill -->
      <div class="topbar-jury-profile-pill" onclick="showJudgeProfileModal()" title="View Judge Profile & Mention Note">
        <div class="topbar-jury-avatar-wrap">
          <div class="topbar-jury-avatar" id="topbar-jav">M</div>
          <span class="topbar-jury-status-dot"></span>
        </div>
        <div style="display:flex; flex-direction:column; line-height:1.1;">
          <span class="topbar-jury-name" id="topbar-jname">Jury</span>
          <span class="topbar-jury-badge">VIP</span>
        </div>
      </div>

      <!-- Tactile Refresh Button -->
      <button class="topbar-refresh-btn" onclick="refreshPortal(this)" title="Refresh Portal Data">
        <span class="refresh-icon">🔄</span> <span class="hide-mobile">Refresh</span>
      </button>

      <!-- Dark Mode Switch -->
      <label class="switch" title="Toggle Dark Mode">"""

if old_topbar_html in code:
    code = code.replace(old_topbar_html, new_topbar_html, 1)
    print("Replaced old topbar with beautified VIP topbar in KNSDC-Judge.html")
else:
    print("Warning: old_topbar_html not exact match, checking alternative...")

# ==============================================================================
# 3. ADD MOBILE FLOATING BOTTOM DOCK
# ==============================================================================

bottom_dock_html = """
<!-- MOBILE FLOATING GLASS DOCK (Thumb-First Navigation) -->
<nav class="judge-bottom-dock" id="judge-bottom-dock" aria-label="Mobile Navigation">
  <div class="dock-nav-item active" onclick="showPage('dashboard', this)" title="Dashboard">
    <div class="dock-nav-icon">📊</div>
    <div class="dock-nav-label">Dashboard</div>
  </div>
  <div class="dock-nav-item" onclick="showPage('scoring', this)" title="Score Performers">
    <div class="dock-nav-icon">
      ⚖️
      <span class="dock-badge" id="dock-pending-badge">0</span>
    </div>
    <div class="dock-nav-label">Scoring</div>
  </div>
  <div class="dock-nav-item" id="dock-item-leaderboard" onclick="showPage('leaderboard', this)" title="Leaderboard">
    <div class="dock-nav-icon">
      🏆
      <span class="dock-badge gold" style="font-size:7px; padding:0 3px;">LIVE</span>
    </div>
    <div class="dock-nav-label">Ranks</div>
  </div>
  <div class="dock-nav-item" onclick="showPage('chat', this)" title="Team Chat">
    <div class="dock-nav-icon">
      💬
      <span class="dock-badge chat" id="dock-chat-badge" style="display:none;">!</span>
    </div>
    <div class="dock-nav-label">Chat</div>
  </div>
  <div class="dock-nav-item" onclick="showJudgeProfileModal()" title="Judge Profile">
    <div class="dock-nav-icon">👤</div>
    <div class="dock-nav-label">Profile</div>
  </div>
</nav>
"""

if 'judge-bottom-dock' not in code:
    # Insert right before </body>
    code = code.replace('</body>', bottom_dock_html + '\n</body>', 1)
    print("Inserted #judge-bottom-dock into KNSDC-Judge.html")

# ==============================================================================
# 4. UPDATE showPage JAVASCRIPT TO KEEP TOPBAR & DOCK IN SYNC
# ==============================================================================

old_showpage_js = """  document.querySelectorAll('.pp').forEach(p=>p.classList.remove('active'));
  document.getElementById('pp-'+page).classList.add('active');
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(t=>t.classList.remove('active'));
  
  document.querySelectorAll(`.nav-item, .bottom-nav-item`).forEach(item => {
    if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`'${page}'`)) {
      item.classList.add('active');
    }
  });"""

new_showpage_js = """  document.querySelectorAll('.pp').forEach(p=>p.classList.remove('active'));
  document.getElementById('pp-'+page).classList.add('active');
  
  // Synchronize Active Classes across Sidebar, Topbar Deck, and Mobile Bottom Dock
  document.querySelectorAll('.nav-item, .bottom-nav-item, .topbar-nav-pill, .dock-nav-item').forEach(t => t.classList.remove('active'));
  
  document.querySelectorAll(`.nav-item, .bottom-nav-item, .topbar-nav-pill, .dock-nav-item`).forEach(item => {
    if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`'${page}'`)) {
      item.classList.add('active');
    }
  });

  // Update Breadcrumb Chip icon & label
  const pageIcons = { dashboard: '📊', scoring: '⚖️', leaderboard: '🏆', chat: '💬' };
  const chipIcon = document.getElementById('topbar-page-icon');
  if (chipIcon && pageIcons[page]) chipIcon.textContent = pageIcons[page];"""

if old_showpage_js in code:
    code = code.replace(old_showpage_js, new_showpage_js, 1)
    print("Updated showPage function to synchronize all navigation surfaces")

# ==============================================================================
# 5. SYNC BADGES TO TOPBAR & BOTTOM DOCK IN REALTIME
# ==============================================================================

# 5.1 In renderParticipantsTable, update topbar-pending-badge and dock-pending-badge
old_badge_sync = """    if (pendingBadge) {
      pendingBadge.textContent = pendingCount;
      pendingBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
    if (mobPending) {
      mobPending.textContent = pendingCount;
      mobPending.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }"""

new_badge_sync = """    if (pendingBadge) {
      pendingBadge.textContent = pendingCount;
      pendingBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
    if (mobPending) {
      mobPending.textContent = pendingCount;
      mobPending.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
    const topPending = document.getElementById('topbar-pending-badge');
    if (topPending) {
      topPending.textContent = pendingCount;
      topPending.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
    const dockPending = document.getElementById('dock-pending-badge');
    if (dockPending) {
      dockPending.textContent = pendingCount;
      dockPending.style.display = pendingCount > 0 ? 'inline-flex' : 'none';
    }"""

if old_badge_sync in code:
    code = code.replace(old_badge_sync, new_badge_sync, 1)
    print("Synchronized pending score badges to topbar & dock")

# 5.2 In chat message received, update topbar-chat-badge and dock-chat-badge
old_chat_badge = """        if (mobBadge) mobBadge.style.display = 'inline-block';"""
new_chat_badge = """        if (mobBadge) mobBadge.style.display = 'inline-block';
        const topChatB = document.getElementById('topbar-chat-badge');
        if (topChatB) topChatB.style.display = 'inline-block';
        const dockChatB = document.getElementById('dock-chat-badge');
        if (dockChatB) dockChatB.style.display = 'inline-flex';"""

if old_chat_badge in code:
    code = code.replace(old_chat_badge, new_chat_badge, 1)
    print("Synchronized chat notification badges to topbar & dock")

# 5.3 In showPage for chat, hide topbar-chat-badge and dock-chat-badge
old_chat_clear = """      const mb = document.getElementById('mobile-chat-badge');
      if (mb) mb.style.display='none';"""

new_chat_clear = """      const mb = document.getElementById('mobile-chat-badge');
      if (mb) mb.style.display='none';
      const topChatB = document.getElementById('topbar-chat-badge');
      if (topChatB) topChatB.style.display='none';
      const dockChatB = document.getElementById('dock-chat-badge');
      if (dockChatB) dockChatB.style.display='none';"""

if old_chat_clear in code:
    code = code.replace(old_chat_clear, new_chat_clear, 1)
    print("Cleared chat notification badges across all bars on chat open")

# 5.4 Update topbar jury profile pill info when judge profile is rendered
old_jname_set = """  document.getElementById('jname').textContent = JUDGE.name || 'Jury Member';
  document.getElementById('jvenue').textContent = JUDGE.venue ? ('📍 ' + JUDGE.venue) : '📍 Venue';"""

new_jname_set = """  document.getElementById('jname').textContent = JUDGE.name || 'Jury Member';
  document.getElementById('jvenue').textContent = JUDGE.venue ? ('📍 ' + JUDGE.venue) : '📍 Venue';
  const topJname = document.getElementById('topbar-jname');
  if (topJname) topJname.textContent = (JUDGE.name || 'Jury').split(' ')[0];
  const topJav = document.getElementById('topbar-jav');
  if (topJav) {
    if (JUDGE.avatar) {
      topJav.textContent = '';
      topJav.style.backgroundImage = `url('${JUDGE.avatar}')`;
    } else {
      topJav.textContent = (JUDGE.name || 'J').charAt(0).toUpperCase();
      topJav.style.backgroundImage = 'none';
    }
  }"""

if old_jname_set in code:
    code = code.replace(old_jname_set, new_jname_set, 1)
    print("Synchronized Judge avatar and name to topbar jury profile pill")

# 5.5 Auto-hide mobile dock when input/textarea is focused to prevent keyboard collision
keyboard_dock_js = """
// Auto-hide floating mobile dock when virtual keyboard appears
if (typeof window !== 'undefined') {
  window.addEventListener('focusin', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      document.body.classList.add('keyboard-open');
    }
  });
  window.addEventListener('focusout', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      document.body.classList.remove('keyboard-open');
    }
  });
}
"""

if 'keyboard-open' not in code:
    code += "\n\n" + keyboard_dock_js
    print("Added keyboard collision auto-hide handler for mobile dock")

with open('KNSDC-Judge.html', 'w', encoding='utf-8') as f:
    f.write(code)

print("KNSDC-Judge.html navigation beautification completed successfully!")
