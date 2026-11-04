mon_path = r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html"
with open(mon_path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. syncAll
t1 = "newState.participants = [...participants];"
r1 = """newState.participants = [...participants];
    // Pipeline 4 Fix: Synchronize chat & SOS state to syncEngine for network broadcast
    newState.chatMessages = Array.isArray(chatHistory) ? [...chatHistory] : [];
    newState.sosActive = Boolean(sosActive);
    newState.sosHistory = Array.isArray(sosHistory) ? [...sosHistory] : [];"""

assert t1 in text, "Target 1 not found"
text = text.replace(t1, r1, 1)
print("Applied Fix 1 (syncAll)")

# 2. triggerSOS and stopSOS
t2 = """function triggerSOS(){
  sosActive=true;
  const now=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  sosHistory.push({time:now,msg:'SOS Broadcast triggered by Monitor'});
  
  addChatMsg('MONITOR 🚨 SOS','🚨 EMERGENCY BROADCAST 🚨 Monitor needs immediate assistance! All staff please respond NOW.', 'out', true);
  
  syncAll();
  updateSOSUI();
  toast('🚨 SOS Broadcast sent to all staff!');
}

function stopSOS(){
  sosActive=false;
  addChatMsg('Monitor Staff', '✅ SOS CANCELLED — Situation resolved. Thank you all for responding!', 'out');
  
  syncAll();
  updateSOSUI();
  toast('SOS cancelled.');
}"""

r2 = """function triggerSOS(){
  sosActive=true;
  const now=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  const sosEntry = {time:now,msg:'SOS Broadcast triggered by Monitor'};
  sosHistory.push(sosEntry);
  
  addChatMsg('MONITOR 🚨 SOS','🚨 EMERGENCY BROADCAST 🚨 Monitor needs immediate assistance! All staff please respond NOW.', 'out', true);
  
  if (window.syncEngine && typeof window.syncEngine.setData === 'function') {
    window.syncEngine.setData(s => ({
      ...s,
      sosActive: true,
      sosHistory: [...sosHistory],
      chatMessages: [...chatHistory]
    }));
  }
  syncAll();
  updateSOSUI();
  if (window.staffAudio && typeof window.staffAudio.playAlert === 'function') {
    window.staffAudio.playAlert();
  }
  toast('🚨 SOS Broadcast sent to all staff!');
}

function stopSOS(){
  sosActive=false;
  addChatMsg('Monitor Staff', '✅ SOS CANCELLED — Situation resolved. Thank you all for responding!', 'out');
  
  if (window.syncEngine && typeof window.syncEngine.setData === 'function') {
    window.syncEngine.setData(s => ({
      ...s,
      sosActive: false,
      sosHistory: [...sosHistory],
      chatMessages: [...chatHistory]
    }));
  }
  syncAll();
  updateSOSUI();
  toast('SOS cancelled.');
}"""

assert t2 in text, "Target 2 not found"
text = text.replace(t2, r2, 1)
print("Applied Fix 2 (triggerSOS & stopSOS)")

# 3. checkHelpdeskFromState
t3 = """function checkHelpdeskFromState(state) {
  if (!state) return;
  const msgs = [...(state.helpdeskMessages || []), ...(state.chatMessages || [])];
  const curEventId = String(activeEventId || '');
  
  let newFound = false;
  msgs.forEach(m => {
    if (!_lastChatIds.has(m.id)) {
      _lastChatIds.add(m.id);
      newFound = true;
      // Show toast if it's from participant, unread, and belongs to this monitor's locked event
      if (m.senderRole === 'participant' && !m.read && (Date.now() - m.timestamp < 30000)) {
        const pInfo = (state.participants || []).find(x => String(x.id) === String(m.participantId));
        const pEvId = pInfo ? (pInfo.eventId || pInfo.event_id) : (m.eventId || null);
        const isLockedEvent = curEventId
          ? (String(pEvId) === curEventId || (!pEvId && (!state.events || state.events.length <= 1)))
          : true;
        if (isLockedEvent) {
          showHelpdeskToast(m, pInfo ? pInfo.name : 'Participant');
        }
      }
    }
  });
  // Lightweight signature check to avoid unnecessary DOM renders
  const newSig = msgs.map(m => m.id + ':' + (m.read ? '1' : '0')).join('|');
  if (newFound || newSig !== _lastHelpdeskSig) {
    _lastHelpdeskSig = newSig;
    renderHelpdesk();
  }
}"""

r3 = """function checkHelpdeskFromState(state) {
  if (!state) return;

  // Pipeline 4 Fix: Network-wide SOS state synchronization
  if (state.sosActive !== undefined && Boolean(state.sosActive) !== Boolean(sosActive)) {
    sosActive = Boolean(state.sosActive);
    if (state.sosHistory && Array.isArray(state.sosHistory)) {
      sosHistory = state.sosHistory;
    }
    if (typeof updateSOSUI === 'function') updateSOSUI();
    if (sosActive && window.staffAudio && typeof window.staffAudio.playAlert === 'function') {
      window.staffAudio.playAlert();
    }
  }

  const msgs = [...(state.helpdeskMessages || []), ...(state.chatMessages || [])];
  const curEventId = String(activeEventId || '');
  
  let newFound = false;
  msgs.forEach(m => {
    if (!_lastChatIds.has(m.id)) {
      _lastChatIds.add(m.id);
      newFound = true;

      // Pipeline 4 Fix: Immediate alert for inbound emergency SOS messages
      const isSosMsg = Boolean(m.sos || m.type === 'sos' || (m.from && m.from.includes('SOS')) || (m.text && m.text.includes('EMERGENCY')));
      if (isSosMsg && (Date.now() - (m.timestamp || 0) < 60000)) {
        if (typeof handleIncomingSOS === 'function') {
          handleIncomingSOS({ from: m.from || 'Emergency Alert', msg: m.text || 'Emergency broadcast received' });
        }
        if (window.staffAudio && typeof window.staffAudio.playAlert === 'function') {
          window.staffAudio.playAlert();
        }
      }

      // Show toast if it's from participant, unread, and belongs to this monitor's locked event
      if (m.senderRole === 'participant' && !m.read && (Date.now() - m.timestamp < 30000)) {
        const pInfo = (state.participants || []).find(x => String(x.id) === String(m.participantId));
        const pEvId = pInfo ? (pInfo.eventId || pInfo.event_id) : (m.eventId || null);
        const isLockedEvent = curEventId
          ? (String(pEvId) === curEventId || (!pEvId && (!state.events || state.events.length <= 1)))
          : true;
        if (isLockedEvent || isSosMsg) {
          showHelpdeskToast(m, pInfo ? pInfo.name : (m.from || 'Participant'));
        }
      }
    }
  });
  // Lightweight signature check to avoid unnecessary DOM renders
  const newSig = msgs.map(m => m.id + ':' + (m.read ? '1' : '0')).join('|');
  if (newFound || newSig !== _lastHelpdeskSig) {
    _lastHelpdeskSig = newSig;
    renderHelpdesk();
  }
}"""

assert t3 in text, "Target 3 not found"
text = text.replace(t3, r3, 1)
print("Applied Fix 3 (checkHelpdeskFromState)")

# 4. renderHelpdesk isLockedEvent bypass for emergency
t4 = "if (!isLockedEvent) return; // Exclude messages from other events"
r4 = """const isEmergencyThread = Boolean(pMsgs.some(m => m.sos || m.type === 'sos' || (m.from && m.from.includes('SOS')) || (m.text && m.text.includes('EMERGENCY'))));
    if (!isLockedEvent && !isEmergencyThread) return; // Exclude messages from other events unless emergency"""

assert t4 in text, "Target 4 not found"
text = text.replace(t4, r4, 1)
print("Applied Fix 4 (renderHelpdesk emergency bypass)")

# 5. sendHelpdeskReply async fix
t5 = "function sendHelpdeskReply() {"
r5 = "async function sendHelpdeskReply() {"
assert t5 in text, "Target 5 not found"
text = text.replace(t5, r5, 1)
print("Applied Fix 5 (sendHelpdeskReply async)")

# 6. hydrate updateSOSUI
t6 = "sosActive = s.sosActive || false;\n  sosHistory = s.sosHistory || [];"
r6 = """sosActive = s.sosActive || false;
  sosHistory = s.sosHistory || [];
  if (typeof updateSOSUI === 'function') updateSOSUI();"""

assert t6 in text, "Target 6 not found"
text = text.replace(t6, r6, 1)
print("Applied Fix 6 (hydrate updateSOSUI)")

# 7. Add safety unblocker before </body>
t7 = "</body>"
r7 = """<!-- PIPELINE 4 SAFETY & AUDIO UNLOCKER -->
<script>
(function initPipeline4Safety() {
  function unlockAllAudio() {
    try {
      if (window.staffAudio && window.staffAudio.ctx && window.staffAudio.ctx.state === 'suspended') {
        window.staffAudio.ctx.resume();
      }
      if (window.audioCtx && window.audioCtx.state === 'suspended') {
        window.audioCtx.resume();
      }
    } catch(e) {}
  }
  ['click', 'touchstart', 'keydown'].forEach(ev => {
    document.addEventListener(ev, unlockAllAudio, { passive: true });
  });

  window.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('golden-ribbon-celebration-overlay')) {
      const el = document.createElement('div');
      el.id = 'golden-ribbon-celebration-overlay';
      el.style.display = 'none';
      document.body.appendChild(el);
    }
    if (!document.getElementById('sos-history')) {
      const el = document.createElement('div');
      el.id = 'sos-history';
      el.style.display = 'none';
      document.body.appendChild(el);
    }
  });
})();
</script>
</body>"""

assert t7 in text, "Target 7 not found"
text = text.replace(t7, r7, 1)
print("Applied Fix 7 (Audio unblocker & overlay stubs)")

with open(mon_path, "w", encoding="utf-8") as f:
    f.write(text)

print("KNSDC-Monitor.html successfully updated and saved!")
