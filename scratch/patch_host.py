path = r'C:\Users\soura\OneDrive\Desktop\kalikapur\KNSDC-Host.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove 3s polling loop and replace with stage_updated and score_received event listeners
target_poll = """// Realtime reconcile polling every 3 seconds to stay synced with Monitor changes
setInterval(() => {
  if (syncEngine && typeof syncEngine.loadParticipants === 'function') {
    syncEngine.loadParticipants().catch(() => {});
  }
}, 3000);"""

replacement_poll = """// Real-time instant push listeners via native WebSocket (Zero Egress, zero polling)
window.addEventListener('knsdc:stage_updated', () => {
  renderDashboard();
  renderStage();
  renderLeaderboard();
});

window.addEventListener('knsdc:score_received', () => {
  renderDashboard();
  renderStage();
  renderLeaderboard();
});"""

assert target_poll in content, "target_poll not found in KNSDC-Host.html"
content = content.replace(target_poll, replacement_poll, 1)

# 2. Update sortQueue to check formAnswers._queueOrder and formAnswers._queuedAt
target_sort = """function sortQueue(queueArray) {
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

replacement_sort = """function sortQueue(queueArray) {
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

assert target_sort in content, "target_sort not found in KNSDC-Host.html"
content = content.replace(target_sort, replacement_sort, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: KNSDC-Host.html patched!")
