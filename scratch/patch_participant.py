path = r'C:\Users\soura\OneDrive\Desktop\kalikapur\KNSDC-Participant.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update renderParticipantUpcomingQueue
target_q = """  // On stage performer matching event & venue
  const onStagePart = allParts.find(part => part.stageStatus === 'on-stage' && isSameEvent(part) && isSameVenue(part));

  // Queue matching event & venue, strictly excluding whoever is on stage
  let queue = allParts.filter(part => part.stageStatus === 'queue' && isSameEvent(part) && isSameVenue(part) && (!onStagePart || String(part.id) !== String(onStagePart.id)));

  // Sort accurately matching Monitor sortQueue (Strict Click Order / queueOrder)
  queue.sort((a, b) => {
    const hasOrderA = typeof a.queueOrder === 'number';
    const hasOrderB = typeof b.queueOrder === 'number';
    if (hasOrderA && hasOrderB) return a.queueOrder - b.queueOrder;
    if (hasOrderA && !hasOrderB) return -1;
    if (!hasOrderA && hasOrderB) return 1;
    const timeA = a.queuedAt ? Number(a.queuedAt) : 0;
    const timeB = b.queuedAt ? Number(b.queuedAt) : 0;
    if (timeA && timeB) return timeA - timeB;
    if (timeA && !timeB) return -1;
    if (!timeA && timeB) return 1;
    const pTimeA = a.presentMarkedAt ? Number(a.presentMarkedAt) : (a.regDate ? Date.parse(a.regDate) : 0);
    const pTimeB = b.presentMarkedAt ? Number(b.presentMarkedAt) : (b.regDate ? Date.parse(b.regDate) : 0);
    return pTimeA - pTimeB;
  });"""

replacement_q = """  // On stage performer matching event & venue (checked via currentOnStage ID or stageStatus)
  const onStagePart = allParts.find(part => 
    (appState.currentOnStage && String(part.id) === String(appState.currentOnStage)) ||
    (part.stageStatus === 'on-stage' && isSameEvent(part) && isSameVenue(part))
  );

  // Queue matching event & venue, strictly excluding whoever is on stage
  let queue = allParts.filter(part => part.stageStatus === 'queue' && isSameEvent(part) && isSameVenue(part) && (!onStagePart || String(part.id) !== String(onStagePart.id)));

  // Sort accurately matching Monitor sortQueue (Strict Click Order / queueOrder / formAnswers fallback)
  queue.sort((a, b) => {
    const orderA = typeof a.queueOrder === 'number' ? a.queueOrder : (a.formAnswers && typeof a.formAnswers._queueOrder === 'number' ? a.formAnswers._queueOrder : null);
    const orderB = typeof b.queueOrder === 'number' ? b.queueOrder : (b.formAnswers && typeof b.formAnswers._queueOrder === 'number' ? b.formAnswers._queueOrder : null);
    const hasOrderA = typeof orderA === 'number';
    const hasOrderB = typeof orderB === 'number';
    if (hasOrderA && hasOrderB) return orderA - orderB;
    if (hasOrderA && !hasOrderB) return -1;
    if (!hasOrderA && hasOrderB) return 1;
    const timeA = a.queuedAt ? Number(a.queuedAt) : (a.formAnswers && a.formAnswers._queuedAt ? Number(a.formAnswers._queuedAt) : 0);
    const timeB = b.queuedAt ? Number(b.queuedAt) : (b.formAnswers && b.formAnswers._queuedAt ? Number(b.formAnswers._queuedAt) : 0);
    if (timeA && timeB) return timeA - timeB;
    if (timeA && !timeB) return -1;
    if (!timeA && timeB) return 1;
    const pTimeA = a.presentMarkedAt ? Number(a.presentMarkedAt) : (a.regDate ? Date.parse(a.regDate) : 0);
    const pTimeB = b.presentMarkedAt ? Number(b.presentMarkedAt) : (b.regDate ? Date.parse(b.regDate) : 0);
    return pTimeA - pTimeB;
  });"""

assert target_q in content, "target_q not found in KNSDC-Participant.html"
content = content.replace(target_q, replacement_q, 1)

# 2. Add listener for knsdc:stage_updated
target_sub = """let lastParticipantGoldenRibbonTrigger = 0;
if (window.syncEngine) {"""

replacement_sub = """window.addEventListener('knsdc:stage_updated', (e) => {
  if (CURRENT_USER && document.getElementById('dashboard-view') && document.getElementById('dashboard-view').style.display === 'block') {
    const state = window.syncEngine ? window.syncEngine.getData() : {};
    const p = (state.participants || []).find(part => String(part.id) === String(CURRENT_USER));
    if (p) {
      renderParticipantUpcomingQueue(p, state);
      updateParticipantFlashMessage(p, state);
    }
  }
});

let lastParticipantGoldenRibbonTrigger = 0;
if (window.syncEngine) {"""

assert target_sub in content, "target_sub not found in KNSDC-Participant.html"
content = content.replace(target_sub, replacement_sub, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: KNSDC-Participant.html patched!")
