const fs = require('fs');

let content = fs.readFileSync('KNSDC-Host.html', 'utf8');

// 1. Sidebar profile & assigned event HTML
const sidebarReplacement = `<div class="logo-sub">Host Panel</div>
    </div>
  </div>
  <div style="padding:10px 16px 0; font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="showHostProfileModal()">
    <div id="sidebar-user-avatar" style="width:24px;height:24px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;flex-shrink:0;">H</div>
    <div style="overflow:hidden;">
      <div id="sidebar-user-name" style="font-weight:700;font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Loading...</div>
      <div id="sidebar-user-role" style="font-weight:700;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Host Portal</div>
    </div>
  </div>
  <div class="event-selector" id="event-selector-wrap" style="padding: 10px 16px;">
    <label style="font-size: 10px;font-weight: 800;color: var(--text-muted);text-transform: uppercase;letter-spacing: 1px;display: block;margin-bottom: 6px;">Assigned Event</label>
    <div id="assigned-event-display" style="background:rgba(255,255,255,0.9);border:1.5px solid rgba(59,130,246,0.25);padding:10px 14px;border-radius:10px;font-size:13px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;flex-shrink:0;"></span>
      <span id="assigned-event-name">Loading...</span>
      <span style="margin-left:auto;font-size:9px;color:#3b82f6;font-weight:800;letter-spacing:0.5px;">LOCKED</span>
    </div>
  </div>`;
content = content.replace(/<div class="logo-sub">Host Panel<\/div>\s*<\/div>\s*<\/div>/, sidebarReplacement);

// 2. Remove topbar dropdown
const topbarRegex = /<div id="host-event-selector-wrap"[\s\S]*?<\/select>\s*<\/div>/;
content = content.replace(topbarRegex, `<div id="host-event-selector-wrap" style="flex:1; display:flex; align-items:center; justify-content:center; gap:10px"></div>`);

// 3. Add Host Profile Modal HTML at the end before </body>
const modalHtml = `
<div class="modal-overlay" id="host-profile-modal" style="display:none; z-index:2500;" onclick="closeOnBg(event,'host-profile-modal')">
  <div class="modal" style="max-width:400px; padding:0; overflow:hidden;">
    <div class="modal-header" style="padding:24px 28px; border-bottom:1px solid rgba(0,0,0,0.05); background:#fff;">
      <div class="modal-title" style="font-family:var(--fh); font-size:18px; font-weight:800;" id="hpm-modal-title">My Profile</div>
      <button class="btn btn-ghost btn-sm" onclick="closeM('host-profile-modal')" style="border-radius:50%; width:32px; height:32px; padding:0; display:flex; align-items:center; justify-content:center;">✕</button>
    </div>
    <div class="modal-body" style="padding:28px;">
      <div style="text-align:center; margin-bottom:20px">
        <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--blue2), var(--blue)); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #fff; font-size: 32px; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); margin: 0 auto 12px" id="hpm-initial">H</div>
        <div style="font-family:var(--fh); font-size:18px; font-weight:800; color:var(--text)" id="hpm-name">-</div>
        <div style="font-size:12px; font-weight:700; margin-top:2px" id="hpm-role">Host Panel</div>
      </div>
      
      <div style="background:rgba(241, 245, 249, 0.8); border:1px solid rgba(226, 232, 240, 0.8); border-radius:12px; padding:16px; margin-bottom:16px; font-size:13px">
        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(0,0,0,0.06)">
          <span style="color:var(--text-muted); font-weight:600">Email</span><strong id="hpm-email" style="user-select:all">-</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:6px 0">
          <span style="color:var(--text-muted); font-weight:600">Account Type</span><strong id="hpm-type" style="color:var(--blue2);">-</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:6px 0; border-top:1px solid rgba(0,0,0,0.06); margin-top:4px">
          <span style="color:var(--text-muted); font-weight:600">Portal Access</span><strong id="hpm-portal" style="color:var(--green2);">Host Panel</strong>
        </div>
      </div>
    </div>
  </div>
</div>
</body>`;
content = content.replace(/<\/body>$/, modalHtml);

// 4. JS logic for profile and auto-lock
const jsInsert = `
const ROLE_PROFILE_CONFIG = {
  monitor: { label: 'Monitor Panel', color: '#3b82f6', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', shadow: 'rgba(59,130,246,0.3)', title: 'Monitor Details', portal: 'Monitor Panel' },
  judge:   { label: 'Judge Portal',   color: '#059669', gradient: 'linear-gradient(135deg, #047857, #059669)', shadow: 'rgba(5,150,105,0.3)',  title: 'Judge Details',   portal: 'Judge Portal' },
  host:    { label: 'Host Portal',    color: '#7c3aed', gradient: 'linear-gradient(135deg, #6d28d9, #7c3aed)', shadow: 'rgba(124,58,237,0.3)', title: 'Host Details',    portal: 'Host Portal' },
  admin:   { label: 'Admin Panel',    color: '#e11d48', gradient: 'linear-gradient(135deg, #be123c, #e11d48)', shadow: 'rgba(225,29,72,0.3)',  title: 'Admin Details',   portal: 'Admin Panel' }
};

function updateSidebarUserInfo() {
  const localUser = localStorage.getItem('kns_user');
  const localRole = localStorage.getItem('kns_role') || 'host';
  const cfg = ROLE_PROFILE_CONFIG[localRole] || ROLE_PROFILE_CONFIG.host;
  let name = 'Host', email = '';
  if (localUser) {
    try { const u = JSON.parse(localUser); name = u.name || 'Host'; email = u.email || ''; } catch(e) {}
  }
  const avatarEl = document.getElementById('sidebar-user-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  if (avatarEl) { avatarEl.textContent = name.charAt(0).toUpperCase(); avatarEl.style.background = cfg.color; }
  if (nameEl) nameEl.textContent = name;
  if (roleEl) { roleEl.textContent = cfg.label; roleEl.style.color = cfg.color; }
}

function showHostProfileModal() {
  const localUser = localStorage.getItem('kns_user');
  const localRole = localStorage.getItem('kns_role') || 'host';
  const cfg = ROLE_PROFILE_CONFIG[localRole] || ROLE_PROFILE_CONFIG.host;
  let email = 'Unknown', name = 'Staff';
  if (localUser) {
    try { const u = JSON.parse(localUser); email = u.email || 'Unknown'; name = u.name || 'Staff'; } catch(e) {}
  }
  const titleEl = document.getElementById('hpm-modal-title');
  if (titleEl) titleEl.textContent = cfg.title;
  const avatarEl = document.getElementById('hpm-initial');
  if (avatarEl) {
    avatarEl.textContent = name.charAt(0).toUpperCase();
    avatarEl.style.background = cfg.gradient;
    avatarEl.style.boxShadow = \`0 4px 10px \${cfg.shadow}\`;
  }
  const roleEl = document.getElementById('hpm-role');
  if (roleEl) { roleEl.textContent = cfg.label; roleEl.style.color = cfg.color; }
  const typeEl = document.getElementById('hpm-type');
  if (typeEl) { typeEl.textContent = localRole.charAt(0).toUpperCase() + localRole.slice(1); typeEl.style.color = cfg.color; }
  document.getElementById('hpm-name').textContent = name;
  document.getElementById('hpm-email').textContent = email;
  document.getElementById('host-profile-modal').style.display = 'flex';
}

function closeM(id) { document.getElementById(id).style.display='none'; }
function closeOnBg(e, id) { if(e.target.id===id) closeM(id); }

setTimeout(updateSidebarUserInfo, 500);

let hostAssignedEventId = null;
`;

content = content.replace('let chatOpen = false;', 'let chatOpen = false;\n' + jsInsert);

// 5. Replace renderEventSelector call with the auto-lock logic in subscribe
const subscribeLogicRegex = /renderEventSelector\(state\);\s*const activeEvId = state\.activeEventId;\s*const activeEv = \(state\.events \|\| \[\]\)\.find\(e => String\(e\.id\) === String\(activeEvId\)\);/;
const subscribeLogicReplacement = `
  const events = state.events || [];
  let hostEmail = '';
  try { hostEmail = JSON.parse(localStorage.getItem('kns_user')).email; } catch(e){}
  
  hostAssignedEventId = null;
  if (hostEmail) {
    const assignedEv = events.find(e => Array.isArray(e.staff) && e.staff.map(x => (x || '').toLowerCase()).includes(hostEmail.toLowerCase()));
    if (assignedEv) hostAssignedEventId = String(assignedEv.id);
  }
  if (!hostAssignedEventId && events.length > 0) hostAssignedEventId = String(events[0].id);

  if (hostAssignedEventId && String(state.activeEventId) !== hostAssignedEventId) {
    state.activeEventId = hostAssignedEventId;
    if (window.syncEngine) window.syncEngine.setData(s => ({ ...s, activeEventId: hostAssignedEventId }));
  }

  const activeEvId = hostAssignedEventId || state.activeEventId;
  const activeEv = events.find(e => String(e.id) === String(activeEvId));

  const assignedNameEl = document.getElementById('assigned-event-name');
  if (assignedNameEl) assignedNameEl.textContent = activeEv ? activeEv.name : 'No Event Assigned';
`;
content = content.replace(subscribeLogicRegex, subscribeLogicReplacement);

fs.writeFileSync('KNSDC-Host.html', content);
console.log('Update successful');
