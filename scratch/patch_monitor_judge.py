# 1. Patch KNSDC-Judge.html
judge_path = r'C:\Users\soura\OneDrive\Desktop\kalikapur\KNSDC-Judge.html'
with open(judge_path, 'r', encoding='utf-8') as f:
    j_content = f.read()

target_cmd = """    window.syncEngine.setData(state => {
      return {
        ...state,
        remoteAudioCommand: cmd
      };
    });"""

replacement_cmd = """    window.syncEngine.setData(state => {
      return {
        ...state,
        remoteAudioCommand: cmd
      };
    });
    if (window.syncEngine.broadcastChannel && typeof window.syncEngine.broadcastChannel.send === 'function') {
      window.syncEngine.broadcastChannel.send({
        type: 'audio_control',
        cmd: cmd
      });
    }"""

assert target_cmd in j_content, "target_cmd not found in KNSDC-Judge.html"
j_content = j_content.replace(target_cmd, replacement_cmd, 1)

with open(judge_path, 'w', encoding='utf-8') as f:
    f.write(j_content)
print("SUCCESS: KNSDC-Judge.html patched!")

# 2. Patch KNSDC-Monitor.html
mon_path = r'C:\Users\soura\OneDrive\Desktop\kalikapur\KNSDC-Monitor.html'
with open(mon_path, 'r', encoding='utf-8') as f:
    m_content = f.read()

target_mon_sort = """function sortQueue(queueArray) {
  return [...queueArray].sort((a, b) => {
    // 1. Explicit click sequence / manual move queueOrder
    const hasOrderA = typeof a.queueOrder === 'number';
    const hasOrderB = typeof b.queueOrder === 'number';
    if (hasOrderA && hasOrderB) return a.queueOrder - b.queueOrder;
    if (hasOrderA && !hasOrderB) return -1;
    if (!hasOrderA && hasOrderB) return 1;

    // 2. Click order timestamp (queuedAt)
    const timeA = a.queuedAt ? Number(a.queuedAt) : 0;
    const timeB = b.queuedAt ? Number(b.queuedAt) : 0;
    if (timeA && timeB) return timeA - timeB;
    if (timeA && !timeB) return -1;
    if (!timeA && timeB) return 1;

    // 3. Fallback timestamp
    const pTimeA = a.presentMarkedAt ? Number(a.presentMarkedAt) : (a.regDate ? Date.parse(a.regDate) : 0);
    const pTimeB = b.presentMarkedAt ? Number(b.presentMarkedAt) : (b.regDate ? Date.parse(b.regDate) : 0);
    return pTimeA - pTimeB;
  });
}"""

replacement_mon_sort = """function sortQueue(queueArray) {
  return [...queueArray].sort((a, b) => {
    // 1. Explicit click sequence / manual move queueOrder (with fallback to formAnswers._queueOrder)
    const orderA = typeof a.queueOrder === 'number' ? a.queueOrder : (a.formAnswers && typeof a.formAnswers._queueOrder === 'number' ? a.formAnswers._queueOrder : null);
    const orderB = typeof b.queueOrder === 'number' ? b.queueOrder : (b.formAnswers && typeof b.formAnswers._queueOrder === 'number' ? b.formAnswers._queueOrder : null);
    const hasOrderA = typeof orderA === 'number';
    const hasOrderB = typeof orderB === 'number';
    if (hasOrderA && hasOrderB) return orderA - orderB;
    if (hasOrderA && !hasOrderB) return -1;
    if (!hasOrderA && hasOrderB) return 1;

    // 2. Click order timestamp (queuedAt with fallback to formAnswers._queuedAt)
    const timeA = a.queuedAt ? Number(a.queuedAt) : (a.formAnswers && a.formAnswers._queuedAt ? Number(a.formAnswers._queuedAt) : 0);
    const timeB = b.queuedAt ? Number(b.queuedAt) : (b.formAnswers && b.formAnswers._queuedAt ? Number(b.formAnswers._queuedAt) : 0);
    if (timeA && timeB) return timeA - timeB;
    if (timeA && !timeB) return -1;
    if (!timeA && timeB) return 1;

    // 3. Fallback timestamp
    const pTimeA = a.presentMarkedAt ? Number(a.presentMarkedAt) : (a.regDate ? Date.parse(a.regDate) : 0);
    const pTimeB = b.presentMarkedAt ? Number(b.presentMarkedAt) : (b.regDate ? Date.parse(b.regDate) : 0);
    return pTimeA - pTimeB;
  });
}"""

assert target_mon_sort in m_content, "target_mon_sort not found in KNSDC-Monitor.html"
m_content = m_content.replace(target_mon_sort, replacement_mon_sort, 1)

# Add listeners in Monitor for instant WebSocket triggers
target_mon_audio = """window.toast = toast;"""
replacement_mon_audio = """window.addEventListener('knsdc:stage_updated', () => {
  renderVenueParticipants();
  renderStageView();
});

window.addEventListener('knsdc:audio_control', (e) => {
  const cmd = e.detail;
  if (!cmd || cmd.source === 'monitor') return;
  const allAudios = document.querySelectorAll('audio[id^="monitor-audio-"]');
  allAudios.forEach(audioEl => {
    if (audioEl.src.includes(cmd.url.replace(/"/g, '&quot;').replace(/'/g, "\\\\'")) || audioEl.src.includes(encodeURI(cmd.url))) {
      const idxMatch = audioEl.id.match(/monitor-audio-(\\d+)/);
      if (idxMatch) {
        const idx = idxMatch[1];
        if (cmd.action === 'play') {
          audioEl.currentTime = cmd.time;
          const p = audioEl.play();
          if (p) p.catch(() => {});
        } else if (cmd.action === 'pause') {
          audioEl.pause();
          audioEl.currentTime = cmd.time;
        } else if (cmd.action === 'seek') {
          audioEl.currentTime = cmd.time;
        }
        updateCustomAudioUI('monitor', idx);
      }
    }
  });
});

window.toast = toast;"""

assert target_mon_audio in m_content, "target_mon_audio not found in KNSDC-Monitor.html"
m_content = m_content.replace(target_mon_audio, replacement_mon_audio, 1)

with open(mon_path, 'w', encoding='utf-8') as f:
    f.write(m_content)
print("SUCCESS: KNSDC-Monitor.html patched!")
