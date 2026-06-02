import sys

path = r'c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Monitor.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = 'function renderAssignedJudges() {'
idx_start = content.find(start_marker)
if idx_start == -1:
    print('ERROR: function not found')
    sys.exit(1)

# Find the closing brace of this function (first lone \r\n}\r\n after start)
idx_end = content.find('\r\n}\r\n', idx_start)
if idx_end == -1:
    idx_end = content.find('\n}\n', idx_start)
if idx_end == -1:
    print('ERROR: closing brace not found')
    sys.exit(1)

old_fn = content[idx_start : idx_end + 4]

new_fn = """function renderAssignedJudges() {
  const container = document.getElementById('assigned-judges-list');
  if (!container) return;

  // Filter: ONLY agreements for THIS active event that are confirmed or verified
  const verified = (agreements || []).filter(function(a) {
    return String(a.eventId) === String(activeEventId) &&
      (a.status === 'confirmed' || a.status === 'verified' || a.submitted === true);
  });

  const allParticipants = (syncEngine && syncEngine.getData().participants) || [];

  if (verified.length === 0) {
    container.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:60px 20px">' +
      '<div style="font-size:48px;margin-bottom:16px">\u2696\ufe0f</div>' +
      '<div style="font-weight:800;font-size:16px;margin-bottom:8px">No Verified Judges for This Event</div>' +
      '<div style="font-size:12px;color:#64748b;max-width:360px;margin:0 auto;line-height:1.7">' +
      'Only judges whose agreements are <strong>confirmed</strong> and assigned to ' +
      '<strong>' + (eventName || 'this event') + '</strong> appear here. ' +
      'Go to <em>Agreements &amp; Roles</em> to create and confirm judge agreements.' +
      '</div></div>';
    return;
  }

  const avatarColors = ['#3b82f6','#8b5cf6','#f97316','#f59e0b','#10b981','#06b6d4','#ec4899'];
  const total = verified.length;

  let html = '<div style="grid-column:1/-1;display:flex;align-items:center;gap:12px;margin-bottom:4px;padding:14px 20px;background:rgba(5,150,105,0.06);border:1px solid rgba(5,150,105,0.18);border-radius:16px">' +
    '<div style="width:36px;height:36px;border-radius:10px;background:rgba(5,150,105,0.15);display:flex;align-items:center;justify-content:center;font-size:18px">&#x2705;</div>' +
    '<div>' +
    '<div style="font-weight:800;font-size:13px;color:#059669">Verified Panel &middot; ' + (eventName || 'Active Event') + '</div>' +
    '<div style="font-size:11px;color:#64748b;margin-top:2px">' + total + ' judge' + (total!==1?'s':'') + ' confirmed for this event only</div>' +
    '</div>' +
    '<div style="margin-left:auto"><span class="badge b-green">' + total + ' VERIFIED</span></div>' +
    '</div>';

  verified.forEach(function(a, idx) {
    const scoresGiven = allParticipants.filter(function(p) {
      return p && p.scores && (p.scores[a.id] || p.scores[a.name]);
    }).length;
    const payPct = a.amount > 0 ? Math.round(((a.paymentReceived || a.advance || 0) / a.amount) * 100) : 0;
    const initial = (a.name || '?')[0].toUpperCase();
    const ac = avatarColors[idx % avatarColors.length];
    const statusLabel = a.status === 'verified' ? 'VERIFIED' : 'CONFIRMED';
    const avatarHtml = a.photoUrl
      ? '<img src="' + a.photoUrl + '" alt="' + a.name + '" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:3px solid ' + ac + '60;box-shadow:0 4px 12px rgba(0,0,0,0.12);flex-shrink:0">'
      : '<div style="width:52px;height:52px;border-radius:50%;background:' + ac + '20;color:' + ac + ';display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;border:2px solid ' + ac + '50;flex-shrink:0">' + initial + '</div>';

    html +=
      '<div class="card glass-card card-hover judge-assign-card confirmed" style="padding:0;overflow:hidden">' +
      '<div style="height:3px;background:linear-gradient(90deg,' + ac + ',' + ac + '80)"></div>' +
      '<div style="padding:20px">' +

      // Judge header
      '<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:16px">' +
      avatarHtml +
      '<div style="flex:1;min-width:0">' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">' +
      '<div style="font-weight:900;font-size:15px">' + a.name + '</div>' +
      '<span class="badge b-green" style="font-size:8px">&#x2705; ' + statusLabel + '</span>' +
      '</div>' +
      '<div style="font-size:11px;color:#64748b;margin-bottom:3px">&#x1F4CD; ' + (a.spec || 'General Judge') + (a.venueName ? ' &middot; &#x1F3DB; ' + a.venueName : '') + '</div>' +
      '<div style="font-size:11px;color:#64748b">&#x1F4DE; ' + (a.phone || '&mdash;') + (a.city ? ' &middot; ' + a.city : '') + '</div>' +
      '</div>' +
      '<div style="text-align:right;flex-shrink:0">' +
      '<div class="badge b-green" style="margin-bottom:6px"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;display:inline-block;margin-right:4px;animation:blink 1.5s infinite"></span>PRESENT</div>' +
      '<div style="font-size:10px;color:#64748b;font-family:var(--fm)">' + (scoresGiven > 0 ? '&#x2696;&#xFE0F; ' + scoresGiven + ' scored' : 'No scores yet') + '</div>' +
      '</div>' +
      '</div>' +

      // Info grid
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-family:var(--fm)">Agreement Date</div><div style="font-size:12px;font-weight:700">' + (a.date || '&mdash;') + '</div></div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-family:var(--fm)">Report Time</div><div style="font-size:12px;font-weight:700">' + (a.time || '&mdash;') + '</div></div>' +
      '<div style="background:var(--surface2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-family:var(--fm)">Scores Given</div><div style="font-size:14px;font-weight:900;color:' + (scoresGiven>0?'#059669':'#94a3b8') + '">' + scoresGiven + '</div></div>' +
      '</div>' +

      // Payment bar
      '<div style="margin-bottom:14px">' +
      '<div style="display:flex;justify-content:space-between;font-size:10px;color:#64748b;margin-bottom:6px;font-family:var(--fm)"><span>PAYMENT &middot; &#x20B9;' + ((a.paymentReceived||a.advance||0)).toLocaleString() + ' of &#x20B9;' + (a.amount||0).toLocaleString() + '</span><span style="font-weight:700;color:' + (payPct>=100?'#059669':'#d97706') + '">' + payPct + '%</span></div>' +
      '<div class="payment-progress"><div class="payment-fill" style="width:' + Math.min(payPct,100) + '%;background:' + (payPct>=100?'linear-gradient(90deg,#059669,#10b981)':'linear-gradient(90deg,#d97706,#f59e0b)') + '"></div></div>' +
      '</div>' +

      // Credentials
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(37,99,235,0.05);border:1px solid rgba(37,99,235,0.12);border-radius:10px">' +
      '<div style="font-size:10px;font-family:var(--fm);color:#3b82f6"><div>&#x1F4E7; ' + (a.email || 'Not set') + '</div><div style="margin-top:2px">&#x1F511; ' + (a.password ? '\u25CF'.repeat(Math.min(a.password.length,8)) : 'Not set') + '</div></div>' +
      '<div style="display:flex;gap:6px">' +
      (a.agreedTc ? '<span class="badge b-green" style="font-size:8px">T&amp;C &#x2713;</span>' : '') +
      '<button class="btn btn-ghost btn-xs" onclick="openAgreementModal(' + a.id + ')" style="font-size:10px">&#x270F;&#xFE0F; Edit</button>' +
      '</div></div>' +

      (a.notes ? '<div style="margin-top:10px;font-size:11px;color:#64748b;padding:8px 12px;background:var(--surface2);border-radius:8px;border-left:3px solid var(--amber2)">&#x1F4DD; ' + a.notes + '</div>' : '') +
      '</div></div>';
  });

  container.innerHTML = html;
}
"""

new_content = content.replace(old_fn, new_fn)

if new_content == content:
    print('ERROR: replacement had no effect')
    sys.exit(1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('SUCCESS: renderAssignedJudges updated')
