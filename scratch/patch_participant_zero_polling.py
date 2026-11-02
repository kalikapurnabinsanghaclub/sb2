path = r'C:\Users\soura\OneDrive\Desktop\kalikapur\KNSDC-Participant.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the 5-second polling loop and visibility change reload
target_poll = """// 5-second auto-polling loop: only runs when participant is logged in and form is currently locked
setInterval(async () => {
  if (CURRENT_USER && window.syncEngine) {
    const state = window.syncEngine.getData() || {};
    const p = (state.participants || []).find(part => String(part.id) === String(CURRENT_USER));
    if (p) {
      const formLocked = p.formLocked === true;
      if (formLocked) {
        try {
          await window.syncEngine.loadParticipants();
        } catch(e) {
          console.error('[Participant] Auto-poll status failed:', e);
        }
      }
    }
  }
}, 5000);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && window.syncEngine) {
    window.syncEngine.loadParticipants().catch(e => console.error(e));
  }
});"""

replacement_poll = """// ─── ZERO-POLLING ARCHITECTURE (Zero Supabase Egress) ───
// No periodic queries or polling loops to Supabase database.
// All live stage updates, queue movements, and scores are delivered via targeted WebSocket stream."""

assert target_poll in content, "target_poll not found in KNSDC-Participant.html"
content = content.replace(target_poll, replacement_poll, 1)

# 2. Enhance _participantWs.onmessage to handle stage_update
target_ws_msg = """    _participantWs.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'score_updated') {
          applyLiveScoreUpdate(msg);
        }
      } catch (err) {}
    };"""

replacement_ws_msg = """    _participantWs.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'score_updated') {
          applyLiveScoreUpdate(msg);
        } else if (msg.type === 'stage_update' || msg.type === 'state_update') {
          if (CURRENT_USER && document.getElementById('dashboard-view') && document.getElementById('dashboard-view').style.display === 'block') {
            const state = window.syncEngine ? window.syncEngine.getData() : {};
            const p = (state.participants || []).find(part => String(part.id) === String(CURRENT_USER));
            if (p) {
              renderParticipantUpcomingQueue(p, state);
              updateParticipantFlashMessage(p, state);
            }
          }
        }
      } catch (err) {}
    };"""

assert target_ws_msg in content, "target_ws_msg not found in KNSDC-Participant.html"
content = content.replace(target_ws_msg, replacement_ws_msg, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: 5-second polling loop permanently eliminated from KNSDC-Participant.html!")
