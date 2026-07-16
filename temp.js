
// ==========================================
// HELPDESK LOGIC
// ==========================================
let activeHelpdeskParticipant = null;
let lastRenderedHelpdeskState = "";

function renderHelpdesk() {
  if(!window.syncEngine) return;
  const state = window.syncEngine.getData() || {};
  // ONLY show messages that belong to the Helpdesk (they always have a participantId)
  // Staff chat messages never have a participantId — strictly exclude them
  const FIVE_HOURS = 5 * 60 * 60 * 1000;
  const now = Date.now();
  const msgs = (state.chatMessages || []).filter(m => m.participantId && m.senderRole && (now - m.timestamp <= FIVE_HOURS));
  
  // Group by participant
  const byUser = {};
  msgs.forEach(m => {
    if(!byUser[m.participantId]) byUser[m.participantId] = [];
    byUser[m.participantId].push(m);
  });

  
  const userList = document.getElementById('helpdesk-user-list');
  if(!userList) return;
  
  let html = '';
  let totalUnread = 0;
  
  Object.keys(byUser).forEach(pid => {
    const pMsgs = byUser[pid];
    pMsgs.sort((a,b) => a.timestamp - b.timestamp);
    const lastMsg = pMsgs[pMsgs.length - 1];
    const unread = pMsgs.filter(m => m.senderRole === 'participant' && !m.read).length;
    totalUnread += unread;
    
    const pInfo = (state.participants || []).find(x => String(x.id) === String(pid));
    const pName = pInfo ? pInfo.name : 'Unknown';
    const isActive = String(activeHelpdeskParticipant) === String(pid);
    
    html += `
      <div onclick="selectHelpdeskParticipant('${pid}')" style="padding:12px 15px; margin-bottom:8px; cursor:pointer; background:${isActive ? 'var(--bg2)' : (unread > 0 ? 'rgba(37,211,102,0.05)' : 'transparent')}; border-radius:12px; display:flex; align-items:center; gap:12px; transition:all 0.2s; border-left:4px solid ${isActive ? '#25D366' : 'transparent'};">
        <div style="width:45px; height:45px; border-radius:50%; background:linear-gradient(135deg, #128C7E, #25D366); color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px; flex-shrink:0;">
          ${pName.charAt(0).toUpperCase()}
        </div>
        <div style="flex:1; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:700; font-size:15px; color:var(--text); text-overflow:ellipsis; white-space:nowrap; overflow:hidden;">${pName}</div>
            <div style="font-size:11px; color:${unread > 0 ? '#25D366' : 'var(--text-muted)'}; font-weight:${unread > 0 ? '800' : 'normal'}; flex-shrink:0;">
              ${new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <div style="font-size:13px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${lastMsg.senderRole === 'monitor' ? 'You: ' : ''}${lastMsg.text}</div>
            ${unread > 0 ? `<div style="background:#25D366; color:white; font-size:11px; padding:2px 8px; border-radius:20px; font-weight:800; flex-shrink:0;">${unread}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  });
  
  if(!html) html = '<div style="text-align:center; color:var(--text-muted); font-size:12px; margin-top:20px;">No active chats.</div>';
  userList.innerHTML = html;
  
  // Update badge
  const badge = document.getElementById('nb-helpdesk');
  if(badge) {
    if(totalUnread > 0) {
      badge.style.display = 'inline-block';
      badge.innerText = totalUnread;
    } else {
      badge.style.display = 'none';
    }
  }
  
  // Render active chat
  renderActiveHelpdeskChat(byUser[activeHelpdeskParticipant] || [], window.syncEngine.getData().participants || []);
}

function selectHelpdeskParticipant(pid) {
  activeHelpdeskParticipant = pid;
  if(window.syncEngine) window.syncEngine.markMessagesAsRead(pid, 'monitor');
  renderHelpdesk();
}

function renderActiveHelpdeskChat(pMsgs, participants) {
  const container = document.getElementById('helpdesk-chat-history');
  const header = document.getElementById('helpdesk-active-header');
  const input = document.getElementById('helpdesk-chat-input');
  const btn = document.getElementById('helpdesk-send-btn');
  if(!container) return;
  
  if(!activeHelpdeskParticipant) {
    header.innerHTML = 'Select a chat';
    container.innerHTML = '';
    input.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.pointerEvents = 'none';
    return;
  }
  
  const pInfo = participants.find(x => String(x.id) === String(activeHelpdeskParticipant));
  const pName = pInfo ? pInfo.name : 'Unknown';
  header.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px;">
      <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, #128C7E, #25D366); color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px;">
        ${pName.charAt(0).toUpperCase()}
      </div>
      <div>
        <div style="font-weight:700; font-size:16px;">${pName}</div>
        <div style="font-size:12px; color:#25D366; font-weight:600;">● Online</div>
      </div>
    </div>
  `;
  input.disabled = false;
  btn.style.opacity = '1';
  btn.style.pointerEvents = 'auto';
  
  const wasScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 20;
  
  // Set a subtle WhatsApp-like chat background pattern
  container.style.backgroundImage = "url('https://www.transparenttextures.com/patterns/cubes.png')";
  container.style.backgroundSize = "100px";
  container.style.backgroundColor = "var(--bg3)";
  
  let html = '';
  pMsgs.sort((a,b) => a.timestamp - b.timestamp).forEach(m => {
    const isMe = m.senderRole === 'monitor';
    html += `
      <div style="display:flex; flex-direction:column; align-items:${isMe ? 'flex-end' : 'flex-start'}; margin-bottom:4px;">
        <div style="max-width:75%; padding:8px 12px; border-radius:12px; background:${isMe ? '#D9FDD3' : 'var(--surface)'}; color:var(--text); border:${isMe ? 'none' : '1px solid var(--border)'}; font-size:14.5px; box-shadow:0 1px 2px rgba(0,0,0,0.1); word-wrap:break-word; position:relative; border-top-${isMe ? 'right' : 'left'}-radius:4px; display:flex; align-items:flex-end; gap:8px;">
          <div style="margin-bottom:2px;">${m.text}</div>
          <div style="font-size:10px; color:${isMe ? '#667781' : 'var(--text-muted)'}; margin-bottom:-4px; white-space:nowrap; flex-shrink:0;">
            ${new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            ${isMe ? `<span style="color:#53bdeb; margin-left:2px;">✓✓</span>` : ''}
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  if (wasScrolledToBottom) {
    container.scrollTop = container.scrollHeight;
  }
}

async function sendHelpdeskReply() {
  if(!activeHelpdeskParticipant || !window.syncEngine) return;
  const input = document.getElementById('helpdesk-chat-input');
  const text = input.value.trim();
  if(!text) return;
  
  input.value = '';
  await window.syncEngine.addChatMessage(text, activeHelpdeskParticipant, 'monitor');
  renderHelpdesk();
  setTimeout(() => {
    const cont = document.getElementById('helpdesk-chat-history');
    cont.scrollTop = cont.scrollHeight;
  }, 50);
}

function showHelpdeskToast(msg, pName) {
  const container = document.getElementById('helpdesk-toast-container');
  if(!container) return;
  
  const toast = document.createElement('div');
  toast.style = "background:var(--surface); border:1px solid var(--border); box-shadow:0 10px 25px rgba(0,0,0,0.2); border-left:4px solid var(--blue); border-radius:8px; padding:12px 16px; width:300px; display:flex; justify-content:space-between; align-items:flex-start; animation:fadeIn 0.3s ease-out;";
  toast.innerHTML = `
    <div style="flex:1;">
      <div style="font-weight:800; font-size:12px; color:var(--text); margin-bottom:4px;">New message from ${pName}</div>
      <div style="font-size:12px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${msg.text}</div>
    </div>
    <button style="background:none; border:none; font-size:16px; color:var(--text-muted); cursor:pointer; padding:0; margin-left:10px;" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => { if(toast.parentElement) toast.remove(); }, 10000);
}

// Hook into syncEngine update loop to show toasts
let _lastChatIds = new Set();
setInterval(() => {
  if(!window.syncEngine) return;
  const state = window.syncEngine.getData() || {};
  const msgs = state.chatMessages || [];
  
  let newFound = false;
  msgs.forEach(m => {
    if(!_lastChatIds.has(m.id)) {
      _lastChatIds.add(m.id);
      newFound = true;
      // Show toast if it's from participant and it's new
      if(m.senderRole === 'participant' && !m.read && (Date.now() - m.timestamp < 30000)) {
        const pInfo = (state.participants || []).find(x => String(x.id) === String(m.participantId));
        showHelpdeskToast(m, pInfo ? pInfo.name : 'Unknown');
      }
    }
  });
  if(newFound || JSON.stringify(msgs) !== lastRenderedHelpdeskState) {
    lastRenderedHelpdeskState = JSON.stringify(msgs);
    renderHelpdesk();
  }
}, 1000);

// --- CUSTOM AUDIO PLAYER UI FUNCTIONS ---
window.toggleCustomAudio = function(source, participantId, url, idx) {
  const audioEl = document.getElementById(`${source}-audio-${idx}`);
  if (!audioEl) return;
  if (audioEl.paused) {
    audioEl.play().catch(e => console.error("Playback prevented", e));
    dispatchRemoteAudioCommand(participantId, url, 'play', audioEl.currentTime, source);
  } else {
    audioEl.pause();
    dispatchRemoteAudioCommand(participantId, url, 'pause', audioEl.currentTime, source);
  }
};

window.seekCustomAudioDrag = function(source, idx) {
  const audioEl = document.getElementById(`${source}-audio-${idx}`);
  const seekBar = document.getElementById(`${source}-seek-bar-${idx}`);
  const currentSpan = document.getElementById(`${source}-time-current-${idx}`);
  if (audioEl && seekBar && currentSpan && audioEl.duration) {
    const time = (seekBar.value / 100) * audioEl.duration;
    currentSpan.textContent = formatAudioTime(time);
  }
};

window.markAudioCompleted = function(participantId) {
  if (window.syncEngine && window.syncEngine.state && window.syncEngine.state.participants) {
    const p = window.syncEngine.state.participants.find(x => String(x.id) === String(participantId));
    if (p && p.formAnswers) {
      const updatedForm = { ...p.formAnswers, _audioCompletedAt: Date.now() };
      window.syncEngine.updateParticipant(p.id, { formAnswers: updatedForm });
      console.log('[Audio] Marked participant audio as completed for auto-deletion:', participantId);
    }
  }
};

window.setCustomVolume = function(source, idx) {
  const audioEl = document.getElementById(`${source}-audio-${idx}`);
  const volFader = document.getElementById(`${source}-volume-${idx}`);
  const muteBtn = document.getElementById(`${source}-mute-btn-${idx}`);
  const goldShaft = document.getElementById(`${source}-goldShaft-${idx}`);
  
  if (audioEl && volFader) {
    audioEl.volume = volFader.value;
    if (goldShaft) goldShaft.style.height = `${audioEl.volume * 100}%`;
    
    if (audioEl.volume === 0) {
      if (muteBtn) muteBtn.textContent = '🔇';
    } else {
      if (muteBtn) muteBtn.textContent = '🔊';
    }
  }
};

window.toggleCustomMute = function(source, idx) {
  const audioEl = document.getElementById(`${source}-audio-${idx}`);
  const volFader = document.getElementById(`${source}-volume-${idx}`);
  const muteBtn = document.getElementById(`${source}-mute-btn-${idx}`);
  const goldShaft = document.getElementById(`${source}-goldShaft-${idx}`);
  
  if (audioEl && muteBtn) {
    if (audioEl.volume > 0) {
      audioEl.dataset.prevVol = audioEl.volume;
      audioEl.volume = 0;
      if (volFader) volFader.value = 0;
      if (goldShaft) goldShaft.style.height = '0%';
      muteBtn.textContent = '🔇';
    } else {
      audioEl.volume = audioEl.dataset.prevVol || 1;
      if (volFader) volFader.value = audioEl.volume;
      if (goldShaft) goldShaft.style.height = `${audioEl.volume * 100}%`;
      muteBtn.textContent = '🔊';
    }
  }
};

window.seekCustomAudioEnd = function(source, participantId, url, idx) {
  const audioEl = document.getElementById(`${source}-audio-${idx}`);
  const seekBar = document.getElementById(`${source}-seek-bar-${idx}`);
  if (!audioEl || !seekBar || !audioEl.duration) return;
  
  const time = (seekBar.value / 100) * audioEl.duration;
  audioEl.currentTime = time;
  dispatchRemoteAudioCommand(participantId, url, 'seek', time, source);
};

window.updateCustomAudioUI = function(source, idx) {
  const audioEl = document.getElementById(`${source}-audio-${idx}`);
  const playIcon = document.getElementById(`${source}-play-icon-${idx}`);
  const pauseIcon = document.getElementById(`${source}-pause-icon-${idx}`);
  const seekBar = document.getElementById(`${source}-seek-bar-${idx}`);
  const currentSpan = document.getElementById(`${source}-time-current-${idx}`);
  const totalSpan = document.getElementById(`${source}-time-total-${idx}`);
  const wave = document.getElementById(source === 'judge' ? `sound-wave-${idx}` : `monitor-sound-wave-${idx}`);

  if (!audioEl) return;
  
  if (playIcon && pauseIcon) {
    playIcon.style.display = audioEl.paused ? 'block' : 'none';
    pauseIcon.style.display = audioEl.paused ? 'none' : 'block';
  }
  
  if (wave) {
    if (audioEl.paused) {
      wave.classList.remove('sound-wave-active');
      wave.style.opacity = '0.2';
    } else {
      wave.classList.add('sound-wave-active');
      wave.style.opacity = '1';
    }
  }

  if (audioEl.duration && !isNaN(audioEl.duration)) {
    if (totalSpan) totalSpan.textContent = formatAudioTime(audioEl.duration);
    if (currentSpan) currentSpan.textContent = formatAudioTime(audioEl.currentTime);
    if (seekBar && document.activeElement !== seekBar) {
      seekBar.value = (audioEl.currentTime / audioEl.duration) * 100;
    }
  }
};

window.dispatchRemoteAudioCommand = function(participantId, url, action, time, source) {
  if (window.syncEngine && window.syncEngine.broadcastChannel) {
    const cmd = {
      participantId,
      url,
      action,
      time,
      timestamp: Date.now(),
      source: source,
      senderId: 'monitor'
    };
    
    // Broadcast purely over WebSockets for minimum delay (no database write)
    window.syncEngine.broadcastChannel.send({
      type: 'broadcast',
      event: 'state_update',
      payload: { remoteAudioCommand: cmd }
    }).catch(e => console.error("Fast broadcast failed:", e));
    
    // Also update local state memory so UI stays consistent
    if (window.syncEngine.state) {
      window.syncEngine.state.remoteAudioCommand = cmd;
    }
  } else if (window.syncEngine) {
    // Fallback to slow DB sync if broadcast channel is dead
    syncEngine.setData(state => {
      return {
        ...state,
        remoteAudioCommand: {
          participantId,
          url,
          action,
          time,
          timestamp: Date.now(),
          source: source
        }
      };
    });
  }
};

function formatAudioTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

