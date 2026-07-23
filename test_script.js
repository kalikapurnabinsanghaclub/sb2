
    // State management & LocalStorage Key
    const LS_KEY = 'KNSDC_SPORTS_MANAGER_STATE';
    
    let state = {
      teams: [],
      format: 'round-robin',
      fixtures: [],
      matchSetup: null,
      liveScorer: {
        runs: 0,
        wickets: 0,
        ballsCount: 0, // total legal balls bowled
        extras: 0,
        oversLimit: 5,
        wicketsLimit: 10,
        targetScore: null,
        deliveries: [], // complete ball-by-ball array of strings
        currentOverDeliveries: [], // subset of balls in current over
        battingTeamName: "Team A",
        bowlingTeamName: "Team B",
        matchStatus: "First Innings"
      }
    };

    // --- UNIFIED TEAMS & MODAL LOGIC ---
    let tdmCurrentTeam = null;
    let tdmPlayersCache = [];

    window.isSportsEvent = function(ev) {
      if (!ev) return false;
      const cat = (ev.cat || ev.type || ev.category || '').toLowerCase();
      return cat === 'sports' || cat === 'cricket' || cat === 'sport' || cat === 'football';
    };

    function getUnifiedTeams() {
      const combined = [...state.teams]; // internal teams
      
      if (window.syncEngine) {
        const fullState = window.syncEngine.getData();
        const pubTeams = (fullState.participants || []).filter(p => {
          const ev = (fullState.events || []).find(e => String(e.id) === String(p.eventId));
          return window.isSportsEvent(ev);
        });
        
        pubTeams.forEach(pt => {
          let players = [];
          if (pt.formAnswers && pt.formAnswers['Squad Players']) {
            try { players = JSON.parse(pt.formAnswers['Squad Players']); } catch(e) {}
          }
          
          players.forEach((pl, i) => { if (!pl.id) pl.id = pt.id + '_p_' + i; });
          
          combined.push({
            id: pt.id,
            isPublic: true,
            name: (pt.formAnswers && pt.formAnswers['Team / Club Name']) || pt.name,
            phone: (pt.formAnswers && pt.formAnswers['Contact Phone']) || pt.phone || '',
            color: (pt.formAnswers && pt.formAnswers['Select Team Emblem Color']) || '#3b82f6',
            players: players,
            membersCount: players.length || 11,
            email: pt.email,
            password: pt.password
          });
        });
      }
      return combined;
    }

    function openTeamDetailsModal(teamId) {
      const allTeams = getUnifiedTeams();
      const team = allTeams.find(t => String(t.id) === String(teamId));
      if (!team) return;
      
      tdmCurrentTeam = JSON.parse(JSON.stringify(team)); // deep copy
      tdmPlayersCache = tdmCurrentTeam.players || [];
      
      document.getElementById('tdm-color').style.background = team.color;
      document.getElementById('tdm-name').innerText = team.name;
      document.getElementById('tdm-phone').innerText = team.phone || 'No Phone Number';
      
      const credsBox = document.getElementById('tdm-creds-box');
      if (team.isPublic) {
        credsBox.style.display = 'block';
        document.getElementById('tdm-email').innerText = team.email || '—';
        document.getElementById('tdm-pass').innerText = team.password || '—';
      } else {
        credsBox.style.display = 'none';
      }
      
      renderTdmPlayers();
      document.getElementById('teamDetailsModal').classList.add('active');
    }

    function closeTeamDetailsModal() {
      document.getElementById('teamDetailsModal').classList.remove('active');
      tdmCurrentTeam = null;
    }

    function renderTdmPlayers() {
      const container = document.getElementById('tdm-players-container');
      container.innerHTML = '';
      if (tdmPlayersCache.length === 0) {
        container.innerHTML = '<div style="font-size:12px; color:var(--text-muted); font-style:italic;">No players found.</div>';
        return;
      }
      
      tdmPlayersCache.forEach(p => {
        const row = document.createElement('div');
        row.style.cssText = "display:flex; gap:10px; align-items:center; background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2e8f0; flex-wrap:wrap;";
        
        const photoUrl = p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'Player')}&background=random&color=fff&size=80`;
        
        row.innerHTML = `
          <img src="${photoUrl}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.1);" onerror="this.src='https://ui-avatars.com/api/?name=Error&background=fca5a5&color=fff'">
          <div style="display:flex; flex-direction:column; gap:6px; flex:1; min-width:200px;">
            <input type="text" placeholder="Player Name" value="${p.name || ''}" onchange="tdmUpdatePlayer('${p.id}', 'name', this.value)" style="padding:6px; font-size:13px; border-radius:6px; border:1px solid #cbd5e1; width:100%;">
            <input type="text" placeholder="Photo URL (Optional)" value="${p.photo || ''}" onchange="tdmUpdatePlayer('${p.id}', 'photo', this.value)" style="padding:6px; font-size:11px; border-radius:6px; border:1px solid #cbd5e1; width:100%; color:#64748b;">
          </div>
          <select onchange="tdmUpdatePlayer('${p.id}', 'role', this.value)" style="width:110px; padding:6px; font-size:13px; border-radius:6px; background:#fff; border:1px solid #cbd5e1;">
            <option value="" ${p.role === '' ? 'selected' : ''}>-- Role --</option>
            <option value="Batsman" ${p.role === 'Batsman' ? 'selected' : ''}>Batsman</option>
            <option value="Bowler" ${p.role === 'Bowler' ? 'selected' : ''}>Bowler</option>
            <option value="Allrounder" ${p.role === 'Allrounder' ? 'selected' : ''}>Allrounder</option>
            <option value="Goalkeeper" ${p.role === 'Goalkeeper' ? 'selected' : ''}>Goalkeeper</option>
          </select>
          <label style="display:flex; align-items:center; gap:4px; font-size:12px; font-weight:700; color:var(--text-muted); cursor:pointer;">
            <input type="checkbox" ${p.isCaptain ? 'checked' : ''} onchange="tdmUpdatePlayer('${p.id}', 'isCaptain', this.checked)"> Capt
          </label>
          <button type="button" class="btn btn-ghost btn-sm" onclick="tdmRemovePlayer('${p.id}')" style="color:#ef4444; padding:4px 8px; font-size:14px;">✕</button>
        `;
        container.appendChild(row);
      });
    }

    window.tdmUpdatePlayer = function(id, field, value) {
      const p = tdmPlayersCache.find(x => String(x.id) === String(id));
      if (p) {
        p[field] = value;
        if (field === 'photo' || field === 'name') renderTdmPlayers();
      }
    };

    window.tdmRemovePlayer = function(id) {
      tdmPlayersCache = tdmPlayersCache.filter(x => String(x.id) !== String(id));
      renderTdmPlayers();
    };

    window.tdmAddPlayer = function() {
      tdmPlayersCache.push({
        id: 'new_p_' + Date.now(),
        name: '',
        role: '',
        isCaptain: false,
        photo: ''
      });
      renderTdmPlayers();
    };

    window.saveTeamDetailsModal = function() {
      if (!tdmCurrentTeam) return;
      
      // Filter out empty names
      tdmPlayersCache = tdmPlayersCache.filter(p => (p.name || '').trim() !== '');
      
      if (tdmCurrentTeam.isPublic && window.syncEngine) {
         // Update in public participants array
         window.syncEngine.setData(full => {
            const p = full.participants.find(x => String(x.id) === String(tdmCurrentTeam.id));
            if (p) {
               if (!p.formAnswers) p.formAnswers = {};
               p.formAnswers['Squad Players'] = JSON.stringify(tdmPlayersCache);
            }
            return full;
         });
      } else {
         // Update in internal teams array
         const t = state.teams.find(x => String(x.id) === String(tdmCurrentTeam.id));
         if (t) {
            t.players = tdmPlayersCache;
            t.membersCount = tdmPlayersCache.length || 11;
         }
         saveState();
      }
      
      closeTeamDetailsModal();
      renderTeams();
    };

    // Color picker logic
    let selectedColor = '#3b82f6';
    document.querySelectorAll('.color-preset').forEach(preset => {
      preset.addEventListener('click', () => {
        document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
        preset.classList.add('selected');
        selectedColor = preset.getAttribute('data-color');
      });
    });

    // --- STAFF PROFILE MODAL CONTROLLERS ---
    let plainPasswordText = "••••••••";
    let isPasswordVisible = false;

    function openProfileDetailsModal() {
      const userStr = localStorage.getItem('kns_user');
      if (!userStr) return;
      try {
        const u = JSON.parse(userStr);
        const email = u.email ? u.email.toLowerCase() : '';
        
        document.getElementById('profile-modal-name').innerText = u.name || 'Staff';
        document.getElementById('profile-modal-email').innerText = u.email || '—';
        document.getElementById('profile-modal-event').innerText = assignedEvent ? `${assignedEvent.name || assignedEvent.title || 'Event'} (${assignedEvent.venue || 'No Venue'})` : 'No Event Assigned';
        
        // Retrieve plain password from state staff array if present
        plainPasswordText = "••••••••";
        if (window.syncEngine) {
          const staffList = window.syncEngine.getData().staff || [];
          const matched = staffList.find(s => s.email && s.email.toLowerCase() === email);
          if (matched && matched.password) {
            plainPasswordText = matched.password;
          }
        }
        
        const passSpan = document.getElementById('profile-modal-password');
        passSpan.style.webkitTextSecurity = 'disc';
        passSpan.innerText = plainPasswordText;
        isPasswordVisible = false;
        
        document.getElementById('profile-details-modal').classList.add('active');
      } catch (err) {
        console.error("Error displaying profile details modal", err);
      }
    }

    function closeProfileDetailsModal() {
      document.getElementById('profile-details-modal').classList.remove('active');
    }

    function togglePasswordVisibility() {
      const passSpan = document.getElementById('profile-modal-password');
      if (!passSpan) return;
      isPasswordVisible = !isPasswordVisible;
      if (isPasswordVisible) {
        passSpan.style.webkitTextSecurity = 'none';
      } else {
        passSpan.style.webkitTextSecurity = 'disc';
      }
    }

    function handleStaffLogout() {
      localStorage.removeItem('kns_role');
      localStorage.removeItem('kns_user');
      if (window.syncEngine && typeof window.syncEngine.signOut === 'function') {
        window.syncEngine.signOut();
      }
      window.location.href = 'index.html';
    }

    // --- DASHBOARD & CUSTOMIZE FORM FUNCTIONS ---
    let localFormFields = [];

    function updateDashboardStats() {
      const teamsCountEl = document.getElementById('dash-teams-count');
      const matchesCountEl = document.getElementById('dash-matches-count');
      if (teamsCountEl) teamsCountEl.innerText = state.teams.length;
      if (matchesCountEl) matchesCountEl.innerText = state.fixtures.length;
    }

    async function toggleTeamRegistration(isOpen) {
      if (!assignedEvent) {
        alert("No assigned sports event found to change registration status!");
        document.getElementById('reg-toggle-switch').checked = !isOpen;
        return;
      }
      if (!window.syncEngine) return;
      
      try {
        const res = await window.syncEngine.updateEvent(assignedEvent.id, { publicReg: isOpen });
        if (res === true || (res && res.success !== false)) {
          assignedEvent.publicReg = isOpen;
          console.log(`[SportsManager] Team registration toggle set to: ${isOpen}`);
        } else {
          alert(`Failed to update registration status: ${res ? (res.error || res.message || JSON.stringify(res)) : 'Unknown error'}`);
          document.getElementById('reg-toggle-switch').checked = !isOpen;
        }
      } catch (err) {
        console.error("Error toggling registration", err);
        document.getElementById('reg-toggle-switch').checked = !isOpen;
      }
    }

    // Toggle whether the live score is visible on the public page
    function togglePublicScore(isOn) {
      // Immediately re-call saveState which will push sportLiveScore with updated public flag
      saveState();
      const label = isOn ? '🟢 Live score is now visible on the public page' : '⚫ Live score is now hidden from public page';
      console.log('[SportsManager] ' + label);
    }

    async function toggleEventActiveStatus(isActive) {
      if (!assignedEvent) {
        alert("No assigned sports event found to change visibility!");
        document.getElementById('active-toggle-switch').checked = !isActive;
        return;
      }
      if (!window.syncEngine) return;
      
      try {
        const res = await window.syncEngine.updateEvent(assignedEvent.id, { active: isActive });
        if (res === true || (res && res.success !== false)) {
          assignedEvent.active = isActive;
          console.log(`[SportsManager] Event active status set to: ${isActive}`);
        } else {
          alert(`Failed to update visibility status: ${res ? (res.error || res.message || JSON.stringify(res)) : 'Unknown error'}`);
          document.getElementById('active-toggle-switch').checked = !isActive;
        }
      } catch (err) {
        console.error("Error toggling event active status", err);
        document.getElementById('active-toggle-switch').checked = !isActive;
      }
    }

    function openCustomizeFormModal() {
      localFormFields = [];
      if (assignedEvent && assignedEvent.formFields) {
        localFormFields = [...assignedEvent.formFields];
      } else if (assignedEvent && assignedEvent.form_fields) {
        localFormFields = [...assignedEvent.form_fields];
      } else {
        // Default basic fields
        localFormFields = [
          { label: 'Captain Name', type: 'text', required: true },
          { label: 'Player List (comma separated)', type: 'text', required: true }
        ];
      }
      renderModalFormFields();
      document.getElementById('customize-form-modal').classList.add('active');
    }

    function closeCustomizeFormModal() {
      document.getElementById('customize-form-modal').classList.remove('active');
    }

    function renderModalFormFields() {
      const container = document.getElementById('modal-fields-list');
      container.innerHTML = '';
      if (localFormFields.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:12px; color:var(--text-muted); font-size:12px;">No custom fields setup yet.</p>';
        return;
      }
      localFormFields.forEach((field, index) => {
        const item = document.createElement('div');
        item.className = 'form-field-row';
        item.innerHTML = `
          <span style="font-weight:700; font-size:13px; flex:1;">${field.label} (${field.type})</span>
          <button class="delete-btn" onclick="removeFieldFromModal(${index})" style="padding:4px; font-size:12px;">🗑️</button>
        `;
        container.appendChild(item);
      });
    }

    function addCustomFieldToModal() {
      const labelInput = document.getElementById('new-field-label');
      const typeInput = document.getElementById('new-field-type');
      const label = labelInput.value.trim();
      if (!label) {
        alert("Please enter a field label!");
        return;
      }
      
      localFormFields.push({
        label: label,
        type: typeInput.value,
        required: true
      });
      labelInput.value = '';
      renderModalFormFields();
    }

    function removeFieldFromModal(index) {
      localFormFields.splice(index, 1);
      renderModalFormFields();
    }

    async function saveCustomFormFields() {
      if (!assignedEvent) {
        alert("No assigned sports event found to customize form fields!");
        closeCustomizeFormModal();
        return;
      }
      if (!window.syncEngine) return;
      
      try {
        const res = await window.syncEngine.updateEvent(assignedEvent.id, { formFields: localFormFields });
        if (res === true || (res && res.success !== false)) {
          assignedEvent.formFields = [...localFormFields];
          assignedEvent.form_fields = [...localFormFields];
          alert("Team registration form customized successfully!");
          closeCustomizeFormModal();
        } else {
          alert(`Failed to save form fields: ${res ? (res.error || res.message || JSON.stringify(res)) : 'Unknown error'}`);
        }
      } catch (err) {
        console.error("Error saving form fields", err);
        alert("Failed to save layout.");
      }
    }

    // On Load
    window.addEventListener('DOMContentLoaded', () => {
      const savedState = localStorage.getItem(LS_KEY);
      if (savedState) {
        try {
          state = JSON.parse(savedState);
        } catch (e) {
          console.error("Failed parsing localstorage state", e);
        }
      }
      renderTeams();
      renderFixtures();
      populateMatchSetupTeams();
      updateScorerUI();
      updateDashboardStats();
      
      // Select appropriate format UI based on saved state
      selectFormat(state.format);
    });

    function saveState() {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      updateDashboardStats();
      // Push live scorer to syncEngine so public page can read it
      if (window.syncEngine) {
        const publicScoreOn = document.getElementById('public-score-toggle')?.checked || false;
        window.syncEngine.setData(s => ({
          ...s,
          sportLiveScore: {
            public: publicScoreOn,
            eventId: (window.assignedEvent && window.assignedEvent.id) || null,
            eventName: (window.assignedEvent && (window.assignedEvent.name || window.assignedEvent.title)) || '',
            battingTeam: state.liveScorer.battingTeamName,
            bowlingTeam: state.liveScorer.bowlingTeamName,
            runs: state.liveScorer.runs,
            wickets: state.liveScorer.wickets,
            ballsCount: state.liveScorer.ballsCount,
            extras: state.liveScorer.extras,
            oversLimit: state.liveScorer.oversLimit,
            targetScore: state.liveScorer.targetScore,
            matchStatus: state.liveScorer.matchStatus,
            deliveries: state.liveScorer.deliveries,
            matchPlayerStats: state.liveScorer.matchPlayerStats,
            extrasBreakdown: state.liveScorer.extrasBreakdown,
            updatedAt: Date.now()
          }
        }));
      }
    }

    // Switch Tabs
    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.querySelectorAll('.tab-link').forEach(link => {
        link.classList.remove('active');
      });
      
      document.getElementById(tabId).classList.add('active');
      
      // highlight active tab button
      const clickedTabButton = Array.from(document.querySelectorAll('.tab-link')).find(btn => btn.getAttribute('onclick').includes(tabId));
      if (clickedTabButton) clickedTabButton.classList.add('active');
    }

    // --- TEAMS TAB CONTROLLER ---
    let squadPlayers = [];
    
    function addSquadPlayer() {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      squadPlayers.push({ id, name: '', role: '', isCaptain: false });
      renderSquadPlayers();
    }
    
    function removeSquadPlayer(id) {
      squadPlayers = squadPlayers.filter(p => p.id !== id);
      renderSquadPlayers();
    }
    
    function updateSquadPlayer(id, field, value) {
      const p = squadPlayers.find(x => x.id === id);
      if (p) p[field] = value;
    }
    
    function renderSquadPlayers() {
      const container = document.getElementById('sp-list');
      if (!container) return;
      container.innerHTML = '';
      
      if (squadPlayers.length === 0) {
        container.innerHTML = '<div style="font-size:12px; color:var(--text-muted); font-style:italic;">No players added. Click "+ Add Player" to build the squad.</div>';
        return;
      }
      
      squadPlayers.forEach((p, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.alignItems = 'center';
        row.style.marginBottom = '8px';
        
        row.innerHTML = `
          <input type="text" placeholder="Player Name" value="${p.name}" onchange="updateSquadPlayer(${p.id}, 'name', this.value)" style="flex:1; padding:6px 10px; font-size:13px; border-radius:6px;">
          <select onchange="updateSquadPlayer(${p.id}, 'role', this.value)" style="width:120px; padding:6px 10px; font-size:13px; border-radius:6px; background:#fff;">
            <option value="" ${p.role === '' ? 'selected' : ''}>-- Role --</option>
            <option value="Batsman" ${p.role === 'Batsman' ? 'selected' : ''}>Batsman</option>
            <option value="Bowler" ${p.role === 'Bowler' ? 'selected' : ''}>Bowler</option>
            <option value="Allrounder" ${p.role === 'Allrounder' ? 'selected' : ''}>Allrounder</option>
            <option value="Goalkeeper" ${p.role === 'Goalkeeper' ? 'selected' : ''}>Goalkeeper</option>
          </select>
          <label style="display:flex; align-items:center; gap:4px; font-size:12px; font-weight:700; color:var(--text-muted); cursor:pointer;">
            <input type="checkbox" ${p.isCaptain ? 'checked' : ''} onchange="updateSquadPlayer(${p.id}, 'isCaptain', this.checked)"> Capt
          </label>
          <button type="button" class="btn btn-ghost btn-sm" onclick="removeSquadPlayer(${p.id})" style="color:red; padding:4px 8px;">✕</button>
        `;
        container.appendChild(row);
      });
    }

    // Initialize an empty squad list on load
    window.addEventListener('load', () => setTimeout(() => renderSquadPlayers(), 500));

    function handleTeamRegister(event) {
      event.preventDefault();
      const input = document.getElementById('teamName');
      const phoneInput = document.getElementById('teamPhone');
      const name = input.value.trim();
      if (!name) return;

      const teamId = 'team_' + Date.now();
      
      // Filter out empty player names
      const validPlayers = squadPlayers.filter(p => p.name.trim() !== '');

      const newTeam = {
        id: teamId,
        name: name,
        phone: phoneInput ? phoneInput.value.trim() : '',
        color: selectedColor,
        players: validPlayers,
        membersCount: validPlayers.length > 0 ? validPlayers.length : 11 // default squad size if no players provided
      };

      state.teams.push(newTeam);
      
      input.value = '';
      if (phoneInput) phoneInput.value = '';
      squadPlayers = [];
      renderSquadPlayers();
      
      saveState();
      renderTeams();
      populateMatchSetupTeams();
    }

    function deleteTeam(teamId) {
      if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
        // Try deleting from public participants first
        if (window.syncEngine) {
           window.syncEngine.setData(full => {
              full.participants = (full.participants || []).filter(p => String(p.id) !== String(teamId));
              return full;
           });
        }
        
        // Also try deleting from internal teams
        state.teams = state.teams.filter(t => String(t.id) !== String(teamId));
        saveState();
        renderTeams();
        populateMatchSetupTeams();
      }
    }

    function renderTeams() {
      const container = document.getElementById('teams-container');
      const emptyState = document.getElementById('teams-empty-state');
      const countEl = document.getElementById('registered-count');
      
      const allTeams = getUnifiedTeams();
      
      container.innerHTML = '';
      countEl.innerText = allTeams.length;

      if (allTeams.length === 0) {
        emptyState.classList.remove('hidden');
        return;
      }
      
      emptyState.classList.add('hidden');

      allTeams.forEach(team => {
        const item = document.createElement('div');
        item.className = 'team-card';
        item.style.cursor = 'pointer';
        item.onclick = (e) => {
           // Prevent opening modal if clicking delete button
           if (e.target.closest('.delete-btn')) return;
           openTeamDetailsModal(team.id);
        };
        item.title = "Click to view and edit team details";
        
        // Build players HTML summary
        let playersHtml = '';
        if (team.players && team.players.length > 0) {
           playersHtml = '<div style="margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 11px;">';
           // Only show first 3 players in summary
           const showPlayers = team.players.slice(0, 3);
           showPlayers.forEach(p => {
              const badgeStyle = p.isCaptain ? 'background:#fef08a; color:#854d0e; padding:1px 4px; border-radius:3px; font-weight:800; margin-right:4px;' : 'background:#e2e8f0; color:#475569; padding:1px 4px; border-radius:3px; font-weight:700; margin-right:4px;';
              playersHtml += `<div style="margin-bottom:4px; display:flex; justify-content:space-between;">
                <div><b>${p.name || 'Unnamed'}</b> ${team.phone && p.isCaptain ? `<span style="color:#94a3b8">(${team.phone})</span>` : ''}</div>
                <div>
                  ${p.isCaptain ? `<span style="${badgeStyle}">C</span>` : ''}
                  <span style="color:#64748b;">${p.role || ''}</span>
                </div>
              </div>`;
           });
           if (team.players.length > 3) {
             playersHtml += `<div style="color:#64748b; font-style:italic; margin-top:4px;">+ ${team.players.length - 3} more players</div>`;
           }
           playersHtml += '</div>';
        }

        item.innerHTML = `
          <div class="team-info" style="align-items: flex-start;">
            <div class="team-color-badge" style="background: ${team.color || '#3b82f6'}; margin-top: 4px;"></div>
            <div style="flex:1;">
              <div class="team-name" style="display:flex; align-items:center; gap:8px;">
                ${team.name}
                ${team.isPublic ? '<span style="background:#e0e7ff; color:#4f46e5; font-size:9px; padding:2px 6px; border-radius:10px; font-weight:800;">PUBLIC</span>' : '<span style="background:#f1f5f9; color:#64748b; font-size:9px; padding:2px 6px; border-radius:10px; font-weight:800;">INTERNAL</span>'}
              </div>
              <div class="team-members-count">${team.membersCount} Squad Players ${team.phone ? ` • 📞 ${team.phone}` : ''}</div>
              ${playersHtml}
            </div>
          </div>
          <button class="delete-btn" onclick="deleteTeam('${team.id}')" title="Delete Team" style="align-self:flex-start;">🗑️</button>
        `;
        container.appendChild(item);
      });
    }

    // --- RULE SELECTION / TOURNAMENT TAB ---
    function selectFormat(formatType) {
      state.format = formatType;
      document.querySelectorAll('.format-card').forEach(card => {
        card.classList.remove('active');
      });
      document.getElementById('format-' + formatType).classList.add('active');
      saveState();
    }

    function generateTournamentSchedule() {
      if (state.teams.length < 2) {
        alert("Please register at least 2 teams to generate a tournament!");
        return;
      }

      state.fixtures = [];
      const groupsContainer = document.getElementById('groups-container-card');
      const groupsList = document.getElementById('groups-list');
      groupsContainer.classList.add('hidden');
      groupsList.innerHTML = '';

      if (state.format === 'round-robin') {
        // Round Robin Fixtures
        for (let i = 0; i < state.teams.length; i++) {
          for (let j = i + 1; j < state.teams.length; j++) {
            state.fixtures.push({
              id: 'fix_' + i + '_' + j + '_' + Date.now(),
              teamA: state.teams[i],
              teamB: state.teams[j],
              time: 'TBD',
              venue: 'KNS Community Ground'
            });
          }
        }
      } else if (state.format === 'knockout') {
        // Simple Knockout Bracket Generators (Semi Finals setup or finals based on count)
        const teamCount = state.teams.length;
        if (teamCount === 2) {
          state.fixtures.push({
            id: 'fix_final_' + Date.now(),
            teamA: state.teams[0],
            teamB: state.teams[1],
            stage: 'Grand Finale',
            venue: 'KNS Stadium Center'
          });
        } else {
          // semi finals setup
          const matchesCount = Math.floor(teamCount / 2);
          for (let i = 0; i < matchesCount; i++) {
            state.fixtures.push({
              id: 'fix_semi_' + i + '_' + Date.now(),
              teamA: state.teams[i * 2],
              teamB: state.teams[i * 2 + 1],
              stage: 'Semi Final ' + (i + 1),
              venue: 'KNS Arena Ground'
            });
          }
          if (teamCount % 2 !== 0) {
            state.fixtures.push({
              id: 'fix_bye_' + Date.now(),
              teamA: state.teams[teamCount - 1],
              teamB: { name: 'BYE / Match Winner' },
              stage: 'Qualifier Round',
              venue: 'KNS Arena Ground'
            });
          }
        }
      } else if (state.format === 'group') {
        // FIFA Group format (Create Group A & Group B and assign teams)
        groupsContainer.classList.remove('hidden');
        const groups = {
          'Group A': [],
          'Group B': []
        };
        
        state.teams.forEach((team, index) => {
          if (index % 2 === 0) {
            groups['Group A'].push(team);
          } else {
            groups['Group B'].push(team);
          }
        });

        // Render Groups
        for (const [groupName, groupTeams] of Object.entries(groups)) {
          const gBox = document.createElement('div');
          gBox.className = 'group-box';
          let teamListItems = '';
          groupTeams.forEach(t => {
            teamListItems += `
              <li class="group-team-item">
                <div class="team-color-badge" style="background: ${t.color}; width:16px; height:16px"></div>
                ${t.name}
              </li>`;
          });
          gBox.innerHTML = `
            <div class="group-title">${groupName}</div>
            <ul class="group-team-list">${teamListItems || 'No teams mapping'}</ul>
          `;
          groupsList.appendChild(gBox);
        }

        // Generate Match fixtures for group stages
        for (const [groupName, groupTeams] of Object.entries(groups)) {
          for (let i = 0; i < groupTeams.length; i++) {
            for (let j = i + 1; j < groupTeams.length; j++) {
              state.fixtures.push({
                id: 'fix_group_' + i + '_' + j + '_' + Date.now(),
                teamA: groupTeams[i],
                teamB: groupTeams[j],
                stage: groupName + ' Match',
                venue: 'KNS Community Ground'
              });
            }
          }
        }
      }

      saveState();
      renderFixtures();
    }

    function renderFixtures() {
      const container = document.getElementById('fixtures-container');
      const emptyState = document.getElementById('fixtures-empty-state');
      
      container.innerHTML = '';
      if (state.fixtures.length === 0) {
        emptyState.classList.remove('hidden');
        return;
      }
      emptyState.classList.add('hidden');

      state.fixtures.forEach((fix, index) => {
        const item = document.createElement('div');
        item.className = 'fixture-item';
        
        const stageTag = fix.stage ? `<span style="background:#dbeafe; color:#1e40af; padding: 2px 8px; border-radius: 99px; font-size:10px; font-weight:800; text-transform:uppercase">${fix.stage}</span>` : '';
        
        item.innerHTML = `
          <div class="fixture-teams">
            <div class="fixture-team-block">
              <div class="team-color-badge" style="background: ${fix.teamA.color || '#94a3b8'}; width:14px; height:14px"></div>
              <span>${fix.teamA.name}</span>
            </div>
            <div class="vs-divider">VS</div>
            <div class="fixture-team-block">
              <div class="team-color-badge" style="background: ${fix.teamB.color || '#94a3b8'}; width:14px; height:14px"></div>
              <span>${fix.teamB.name}</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            ${stageTag}
            <div class="fixture-meta">
              <span>🏟️ ${fix.venue}</span>
            </div>
            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 11px;" onclick="loadFixtureToMatchSetup(${index})">Load Config</button>
          </div>
        `;
        container.appendChild(item);
      });
    }

    function loadFixtureToMatchSetup(index) {
      const fix = state.fixtures[index];
      switchTab('setup-tab');
      
      const teamASelect = document.getElementById('matchTeamA');
      const teamBSelect = document.getElementById('matchTeamB');
      
      // Set values matching name
      Array.from(teamASelect.options).forEach(opt => {
        if (opt.text === fix.teamA.name) teamASelect.value = opt.value;
      });
      Array.from(teamBSelect.options).forEach(opt => {
        if (opt.text === fix.teamB.name) teamBSelect.value = opt.value;
      });
    }

    // --- MATCH SETUP CONTROLLER ---
    function populateMatchSetupTeams() {
      const selectA = document.getElementById('matchTeamA');
      const selectB = document.getElementById('matchTeamB');
      
      selectA.innerHTML = '';
      selectB.innerHTML = '';

      state.teams.forEach(team => {
        const optA = document.createElement('option');
        optA.value = team.id;
        optA.text = team.name;
        selectA.add(optA);

        const optB = document.createElement('option');
        optB.value = team.id;
        optB.text = team.name;
        selectB.add(optB);
      });
      
      // select different second option if available
      if (selectB.options.length > 1) {
        selectB.selectedIndex = 1;
      }
    }

    function handleMatchSetup(event) {
      event.preventDefault();
      
      const selectA = document.getElementById('matchTeamA');
      const selectB = document.getElementById('matchTeamB');
      
      if (selectA.value === selectB.value) {
        alert("A team cannot play against itself!");
        return;
      }

      const teamAName = selectA.options[selectA.selectedIndex].text;
      const teamBName = selectB.options[selectB.selectedIndex].text;
      
      const totalOvers = parseInt(document.getElementById('oversLimit').value) || 5;
      const totalWickets = parseInt(document.getElementById('wicketsLimit').value) || 10;
      
      const tossWin = document.getElementById('tossWinner').value;
      const tossDec = document.getElementById('tossDecision').value;
      const customTarget = parseInt(document.getElementById('targetScore').value) || null;

      // Determine who bats first
      let battingTeam = teamAName;
      let bowlingTeam = teamBName;

      // If Toss winner was Team B
      const winnerName = (tossWin === 'Team A') ? teamAName : teamBName;
      const loserName = (tossWin === 'Team A') ? teamBName : teamAName;
      
      if (tossDec === 'bat') {
        battingTeam = winnerName;
        bowlingTeam = loserName;
      } else {
        battingTeam = loserName;
        bowlingTeam = winnerName;
      }

      state.matchSetup = {
        teamAName,
        teamBName,
        totalOvers,
        totalWickets,
        tossWinner: winnerName,
        tossDecision: tossDec
      };

      // Reset Scorer
      state.liveScorer = {
        runs: 0,
        wickets: 0,
        ballsCount: 0,
        extras: 0,
        oversLimit: totalOvers,
        wicketsLimit: totalWickets,
        targetScore: customTarget,
        deliveries: [],
        currentOverDeliveries: [],
        battingTeamName: battingTeam,
        bowlingTeamName: bowlingTeam,
        matchStatus: customTarget ? "Second Innings" : "First Innings"
      };

      saveState();
      updateScorerUI();
      switchTab('scorer-tab');
    }

    // --- LIVE SCORER ENGINE CONTROLLER ---
    function addScoreRecord(action) {
      if (!state.matchSetup) {
        alert("Please set up and start a match before scoring!");
        switchTab('setup-tab');
        return;
      }

      const sc = state.liveScorer;
      let deliveryLog = '';

      if (sc.wickets >= sc.wicketsLimit || sc.ballsCount >= sc.oversLimit * 6) {
        alert("The innings/match is already complete! Press End Innings to switch sides or end.");
        return;
      }

      const overNumber = Math.floor(sc.ballsCount / 6);
      const ballInOverNum = (sc.ballsCount % 6) + 1;
      const currentBallStr = `${overNumber}.${ballInOverNum}`;

      if (action === '0') {
        sc.ballsCount++;
        sc.deliveries.push("0");
        sc.currentOverDeliveries.push("0");
        deliveryLog = `${currentBallStr}: Dot ball`;
      } else if (action === '1' || action === '2' || action === '3' || action === '4' || action === '6') {
        const runVal = parseInt(action);
        sc.runs += runVal;
        sc.ballsCount++;
        sc.deliveries.push(action);
        sc.currentOverDeliveries.push(action);
        deliveryLog = `${currentBallStr}: ${action} run(s) from batting team`;
      } else if (action === 'W') {
        sc.wickets++;
        sc.ballsCount++;
        sc.deliveries.push("W");
        sc.currentOverDeliveries.push("W");
        deliveryLog = `${currentBallStr}: 🔴 WICKET! OUT.`;
      } else if (action === 'WD') {
        sc.runs += 1;
        sc.extras += 1;
        sc.deliveries.push("WD");
        sc.currentOverDeliveries.push("Wd");
        deliveryLog = `Extra: Wide (+1 run)`;
      } else if (action === 'NB') {
        sc.runs += 1;
        sc.extras += 1;
        sc.deliveries.push("NB");
        sc.currentOverDeliveries.push("Nb");
        deliveryLog = `Extra: No Ball (+1 run)`;
      } else if (action === 'B') {
        // Bye extra (needs user input for runs generated on bye)
        const byeRuns = parseInt(prompt("Enter runs scored on Bye:", "1")) || 1;
        sc.runs += byeRuns;
        sc.extras += byeRuns;
        sc.ballsCount++;
        sc.deliveries.push(`${byeRuns}B`);
        sc.currentOverDeliveries.push(`B${byeRuns}`);
        deliveryLog = `${currentBallStr}: Extra - ${byeRuns} Bye runs`;
      }

      // Check if over completed (6 legal balls)
      if (sc.ballsCount > 0 && sc.ballsCount % 6 === 0 && action !== 'WD' && action !== 'NB') {
        deliveryLog += ` | ⚠️ OVER COMPLETED.`;
        sc.currentOverDeliveries = []; // Reset current over ball track
      }

      // Log action to panel
      logCommentary(deliveryLog, action === 'W');

      // Auto transition/Target check for 2nd innings
      if (sc.targetScore && sc.runs >= sc.targetScore) {
        logCommentary(`🎉 Match Finished! ${sc.battingTeamName} chased down the target successfully!`, false);
        alert(`${sc.battingTeamName} won the match!`);
      }

      saveState();
      updateScorerUI();
    }

    function undoLastDelivery() {
      const sc = state.liveScorer;
      if (sc.deliveries.length === 0) return;

      const lastAct = sc.deliveries.pop();
      sc.currentOverDeliveries.pop();

      if (lastAct === '0') {
        sc.ballsCount--;
      } else if (lastAct === '1' || lastAct === '2' || lastAct === '3' || lastAct === '4' || lastAct === '6') {
        sc.runs -= parseInt(lastAct);
        sc.ballsCount--;
      } else if (lastAct === 'W') {
        sc.wickets--;
        sc.ballsCount--;
      } else if (lastAct === 'WD' || lastAct === 'NB') {
        sc.runs -= 1;
        sc.extras -= 1;
      } else if (lastAct.endsWith('B')) {
        const bRuns = parseInt(lastAct) || 1;
        sc.runs -= bRuns;
        sc.extras -= bRuns;
        sc.ballsCount--;
      }

      // Remove last log
      const logs = document.getElementById('delivery-logs');
      if (logs.children.length > 0) {
        logs.removeChild(logs.firstElementChild);
      }

      saveState();
      updateScorerUI();
    }

    function logCommentary(text, isWicket = false) {
      const logs = document.getElementById('delivery-logs');
      const item = document.createElement('div');
      item.className = 'log-item' + (isWicket ? ' wicket' : '');
      item.innerHTML = `<span>${text}</span> <span>${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>`;
      
      logs.insertBefore(item, logs.firstChild);
    }

    function updateScorerUI() {
      const sc = state.liveScorer;
      
      document.getElementById('score-runs').innerText = sc.runs;
      document.getElementById('score-wickets').innerText = sc.wickets;
      
      // Calculate overs format (e.g. 1.4 overs)
      const oversFormat = `${Math.floor(sc.ballsCount / 6)}.${sc.ballsCount % 6}`;
      document.getElementById('score-overs').innerText = oversFormat;
      document.getElementById('score-total-overs').innerText = sc.oversLimit;

      // Calculate rates
      const oversBowled = sc.ballsCount / 6;
      const crr = oversBowled > 0 ? (sc.runs / oversBowled).toFixed(2) : "0.00";
      document.getElementById('score-crr').innerText = crr;

      // Projected Scores based on CRR & constant rates
      const totalOvers = sc.oversLimit;
      const currentCRR = parseFloat(crr);
      const projectedScoreCRR = Math.round(currentCRR * totalOvers);
      
      // Display projected scores based on current rate or total matches
      document.getElementById('score-proj').innerText = projectedScoreCRR;

      const runsAt8RPO = Math.round(sc.runs + (8 * (totalOvers - oversBowled)));
      const runsAt10RPO = Math.round(sc.runs + (10 * (totalOvers - oversBowled)));
      document.getElementById('score-proj-rpo').innerText = `${runsAt8RPO} / ${runsAt10RPO}`;

      // Set teams display
      document.getElementById('score-teams-display').innerText = `${sc.battingTeamName} vs ${sc.bowlingTeamName}`;
      document.getElementById('score-meta-display').innerText = `${sc.matchStatus} • Venue: ${state.matchSetup ? state.matchSetup.groundName : 'Not Set'}`;

      // Update current over history balls
      const ballsRow = document.getElementById('current-over-balls');
      ballsRow.innerHTML = '';
      sc.currentOverDeliveries.forEach(ball => {
        const dot = document.createElement('div');
        dot.className = 'ball-dot';
        if (ball === 'W') dot.classList.add('wicket');
        else if (ball.includes('Wd') || ball.includes('Nb') || ball.includes('B')) dot.classList.add('extra');
        else if (ball === '4' || ball === '6') dot.classList.add('boundary');
        dot.innerText = ball;
        ballsRow.appendChild(dot);
      });

      // Target Banner & RRR details
      const rrrItem = document.getElementById('score-rrr-item');
      const targetBanner = document.getElementById('target-banner-display');
      
      if (sc.targetScore) {
        rrrItem.classList.remove('hidden');
        targetBanner.classList.remove('hidden');
        
        document.getElementById('target-score-display').innerText = sc.targetScore;
        document.getElementById('target-overs-display').innerText = sc.oversLimit;

        const runsNeeded = sc.targetScore - sc.runs;
        const ballsRemaining = (sc.oversLimit * 6) - sc.ballsCount;
        
        if (ballsRemaining > 0) {
          const rrr = ((runsNeeded / ballsRemaining) * 6).toFixed(2);
          document.getElementById('score-rrr').innerText = rrr;
        } else {
          document.getElementById('score-rrr').innerText = "0.00";
        }
      } else {
        rrrItem.classList.add('hidden');
        targetBanner.classList.add('hidden');
      }
    }

    function endInningsTrigger() {
      if (!state.matchSetup) return;
      const sc = state.liveScorer;
      
      if (sc.matchStatus === "First Innings") {
        const target = sc.runs + 1;
        const confirmSwitch = confirm(`Switching to Second Innings. Set target score to ${target}?`);
        if (confirmSwitch) {
          sc.targetScore = target;
          sc.matchStatus = "Second Innings";
          
          // Swap Batting and Bowling teams
          const temp = sc.battingTeamName;
          sc.battingTeamName = sc.bowlingTeamName;
          sc.bowlingTeamName = temp;
          
          // Reset runs & counts for 2nd Innings
          sc.runs = 0;
          sc.wickets = 0;
          sc.ballsCount = 0;
          sc.extras = 0;
          sc.deliveries = [];
          sc.currentOverDeliveries = [];
          
          document.getElementById('delivery-logs').innerHTML = '';
          logCommentary(`🔄 Innings Switch! ${sc.battingTeamName} chasing a target of ${target}.`);
          
          saveState();
          updateScorerUI();
        }
      } else {
        // Complete Match Summary
        const scoreDiff = sc.targetScore - 1 - sc.runs;
        let resultMsg = "";
        if (sc.runs >= sc.targetScore) {
          resultMsg = `${sc.battingTeamName} won the match!`;
        } else if (sc.runs === sc.targetScore - 1) {
          resultMsg = `It's a TIE match!`;
        } else {
          resultMsg = `${sc.bowlingTeamName} won the match by ${scoreDiff} run(s)!`;
        }
        alert(`Match Complete!\nResult: ${resultMsg}`);
        logCommentary(`🏁 Match Completed. ${resultMsg}`);
      }
    }

    function confirmResetData() {
      if (confirm("Are you sure you want to reset all tournament registrations, matches, and scoring data?")) {
        localStorage.removeItem(LS_KEY);
        state = {
          teams: [],
          format: 'round-robin',
          fixtures: [],
          matchSetup: null,
          liveScorer: {
            runs: 0,
            wickets: 0,
            ballsCount: 0,
            extras: 0,
            oversLimit: 5,
            wicketsLimit: 10,
            targetScore: null,
            deliveries: [],
            currentOverDeliveries: [],
            battingTeamName: "Team A",
            bowlingTeamName: "Team B",
            matchStatus: "First Innings"
          }
        };
        saveState();
        renderTeams();
        renderFixtures();
        populateMatchSetupTeams();
        updateScorerUI();
        alert("All data reset successfully!");
      }
    }
  



    // Authentication Guard and Assigned Event Loader
    function showUnauthorizedOverlay(message, isLoginRedirect = false) {
      const overlay = document.createElement('div');
      overlay.id = 'unauthorized-overlay';
      overlay.style.cssText = 'position:fixed; inset:0; background:radial-gradient(circle, #0f172a, #020617); color:white; z-index:100000; display:flex; align-items:center; justify-content:center; flex-direction:column; font-family:\'Inter\', sans-serif; text-align:center; padding:24px;';
      
      const redirectUrl = isLoginRedirect ? 'index.html?login=true' : 'index.html';
      const buttonText = isLoginRedirect ? 'Go to Login Page' : 'Go to Home Page';
      
      overlay.innerHTML = `
        <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.08); padding: 48px; border-radius: 28px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); max-width: 480px; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);">
          <div style="font-size: 80px; margin-bottom: 24px; filter: drop-shadow(0 0 20px rgba(239,68,68,0.3));">🛡️</div>
          <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 16px; background: linear-gradient(135deg, #f87171, #fca5a5); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.5px;">Access Restricted</h2>
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin-bottom: 32px;" id="unauth-msg">${message}</p>
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 20px; font-family: monospace;" id="unauth-timer">Redirecting in 5 seconds...</div>
          <button onclick="window.location.href='${redirectUrl}'" style="background: linear-gradient(135deg, #3b82f6, #4f46e5); color: white; border: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; transition: 0.25s; box-shadow: 0 4px 16px rgba(59,130,246,0.3);">${buttonText}</button>
        </div>
      `;
      document.body.appendChild(overlay);
      
      localStorage.removeItem('kns_role');
      localStorage.removeItem('kns_user');
      
      let sec = 5;
      const timer = setInterval(() => {
        sec--;
        const el = document.getElementById('unauth-timer');
        if (el) el.textContent = `Redirecting in ${sec} seconds...`;
        if (sec <= 0) {
          clearInterval(timer);
          window.location.href = redirectUrl;
        }
      }, 1000);
    }

    async function checkAuth(requiredRoles) {
      document.body.style.visibility = 'hidden';
      const localRole = localStorage.getItem('kns_role');
      const localUser = localStorage.getItem('kns_user');
      if (localRole && localUser) {
        try {
          const u = JSON.parse(localUser);
          if (requiredRoles.includes(localRole)) {
            document.body.style.visibility = 'visible';
            console.log(`[AuthGuard] ✅ Authorized via localStorage: ${u.email} (Role: ${localRole})`);
            return true;
          }
        } catch(e) {}
      }
      await new Promise(r => setTimeout(r, 500));
      const engine = window.syncEngine;
      if (engine) {
        try {
          const user = await engine.getCurrentUser();
          if (user) {
            const role = user.user_metadata?.role || localStorage.getItem('kns_role');
            if (requiredRoles.includes(role)) {
              localStorage.setItem('kns_role', role);
              if (user.email) {
                localStorage.setItem('kns_user', JSON.stringify({
                   email: user.email, 
                   name: user.user_metadata?.fullname || user.user_metadata?.name || user.email.split('@')[0],
                   role: role
                }));
              }
              document.body.style.visibility = 'visible';
              return true;
            }
            document.body.innerHTML = '';
            document.body.style.visibility = 'visible';
            showUnauthorizedOverlay(`You are logged in, but your role (${role}) is not authorized to access this portal.`);
            return false;
          }
        } catch(e) { console.warn('[AuthGuard] error:', e); }
      }
      document.body.innerHTML = '';
      document.body.style.visibility = 'visible';
      showUnauthorizedOverlay('You must log in to access this portal.', true);
      return false;
    }

    let assignedEvent = null;
    function loadAssignedEvent() {
      if (!window.syncEngine) return;
      const userStr = localStorage.getItem('kns_user');
      if (!userStr) return;
      try {
        const u = JSON.parse(userStr);
        
        // Populate header staff profile widget
        const nameEl = document.getElementById('user-name-display');
        const roleEl = document.getElementById('user-role-display');
        if (nameEl) nameEl.innerText = u.name || u.email.split('@')[0];
        if (roleEl) roleEl.innerText = u.role ? u.role.replace('_', ' ') : 'Sports Manager';

        const email = u.email ? u.email.toLowerCase() : '';
        if (!email) return;
        
        // Ensure state is synced
        const stateData = window.syncEngine.getData();
        const events = stateData.events || [];
        assignedEvent = events.find(e => e.staff && e.staff.map(s => s.toLowerCase()).includes(email));
        
        if (assignedEvent) {
          console.log("Assigned Event found:", assignedEvent);
          
          // Set registration toggle switch
          const regSwitch = document.getElementById('reg-toggle-switch');
          if (regSwitch) {
            regSwitch.checked = (assignedEvent.publicReg === true || (assignedEvent.switchStates && assignedEvent.switchStates.publicReg === true));
          }

          // Set public score toggle switch
          const scoreSwitch = document.getElementById('public-score-toggle');
          if (scoreSwitch) {
            scoreSwitch.checked = stateData.sportLiveScore?.public === true;
          }


          // Set active visibility toggle switch
          const activeSwitch = document.getElementById('active-toggle-switch');
          if (activeSwitch) {
            activeSwitch.checked = assignedEvent.active === true;
          }

          // Pre-fill setup fields
          const groundInput = document.getElementById('groundName');
          if (groundInput && assignedEvent.venue) {
            groundInput.value = assignedEvent.venue;
          }
          
          const timeInput = document.getElementById('matchTime');
          if (timeInput && assignedEvent.date && assignedEvent.time) {
            try {
              const dParts = assignedEvent.date.split('-');
              let dateStr = assignedEvent.date;
              if (dParts.length === 3 && dParts[0].length === 2) {
                dateStr = `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
              }
              timeInput.value = `${dateStr}T${assignedEvent.time}`;
            } catch (err) {}
          }
          

        }
      } catch (e) {
        console.error("Error loading assigned event", e);
      }
    }

    // Run auth check on load
    document.addEventListener('DOMContentLoaded', async () => {
      const authorized = await checkAuth(['sportsmanager', 'admin']);
      if (authorized) {
        // Hydrate immediately
        loadAssignedEvent();
        // Subscribe to real-time state updates
        if (window.syncEngine) {
          window.syncEngine.subscribe(() => {
            loadAssignedEvent();
          });
        }
      }
    });
  

