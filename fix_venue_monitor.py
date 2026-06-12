import sys

file_path = 'KNSDC-Monitor.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# ─── 1. HTML: replace static table card with dynamic container ───
old_html = """    <div class="card">
      <div class="card-header" style="display:flex;align-items:center;gap:12px">
        <div class="card-title" style="margin:0">Present Participants</div>
        <div id="venue-present-count" class="badge b-green">0 Present</div>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>#</th><th>Name</th><th>ID</th><th>Category</th><th>Round</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="venue-participants-tbody"></tbody>
        </table>
      </div>
    </div>"""

new_html = """    <div id="venue-categories-container"></div>"""

if old_html in content:
    content = content.replace(old_html, new_html, 1)
    print('HTML section replaced.')
else:
    print('HTML section NOT found. Manual intervention needed.')

# ─── 2. JS: replace the all participants table render block ───
old_js = """  // All participants table
  document.getElementById('venue-participants-tbody').innerHTML = data.map((p,i)=>{
    const c=categories.find(x=>x.id===p.catId);
    return `<tr>
      <td>${i+1}</td>
      <td><strong>${p.name}</strong><div style="font-size:10px;color:var(--text-muted);font-family:var(--fm)">${p.id}</div></td>
      <td style="font-family:var(--fm);font-size:11px;color:var(--text-muted)">${p.id}</td>
      <td>${c?`<span class="badge ${c.color}">${c.name}</span>`:'—'}</td>
      <td><span class="badge ${roundBadge(p.round)}">${p.round}</span></td>
      <td>
        ${p.stageStatus==='on-stage'?'<span class="badge b-amber">On Stage</span>':
          p.stageStatus==='done'?'<span class="badge b-green">Done</span>':
          p.stageStatus==='queue'?'<span class="badge b-blue">In Queue</span>':
          '<span class="badge b-gray">Waiting</span>'}
        ${p.present?'':'<span class="badge b-red" style="margin-left:4px">Absent</span>'}
      </td>
      <td style="display:flex;gap:4px">
        ${p.stageStatus!=='on-stage'&&p.stageStatus!=='done'?`<button class="btn btn-amber btn-xs" onclick="pushToStage('${p.id}')">▶ Stage</button>`:''}
        <button class="btn btn-ghost btn-xs" onclick="markPresent('${p.id}')">${p.present?'✓':'Mark P'}</button>
        ${p.stageStatus === 'waiting' ? `<button class="btn btn-blue btn-xs" onclick="addToUpcoming('${p.id}')">➕ Upcoming</button>` : ''}
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px">No participants for this venue/round</td></tr>`;
}"""

new_js = """  // Present participants only — grouped by category
  const presentOnly = data.filter(p => p.present === true);

  const container = document.getElementById('venue-categories-container');
  if (!container) return;

  if (presentOnly.length === 0) {
    container.innerHTML = `<div class="card"><div style="text-align:center;color:var(--text-muted);padding:30px;font-size:14px">No present participants yet. Mark participants as present from the Registration tab.</div></div>`;
    return;
  }

  // Group by category
  const catMap = {};
  presentOnly.forEach(p => {
    const c = categories.find(x => x.id === p.catId);
    const catKey = c ? c.id : '__no_cat__';
    const catLabel = c ? c.name : 'No Category';
    const catColor = c ? c.color : 'b-gray';
    if (!catMap[catKey]) catMap[catKey] = { label: catLabel, color: catColor, participants: [] };
    catMap[catKey].participants.push(p);
  });

  container.innerHTML = Object.values(catMap).map(group => {
    const rows = group.participants.map((p, idx) => {
      return `<tr>
        <td style="font-weight:700;color:var(--text-muted)">${idx + 1}</td>
        <td><strong>${p.name}</strong><div style="font-size:10px;color:var(--text-muted);font-family:var(--fm)">${p.id}</div></td>
        <td style="font-family:var(--fm);font-size:11px;color:var(--text-muted)">${p.id}</td>
        <td><span class="badge ${group.color}">${group.label}</span></td>
        <td>
          ${p.stageStatus==='on-stage'?'<span class="badge b-amber">On Stage</span>':
            p.stageStatus==='done'?'<span class="badge b-green">Done</span>':
            p.stageStatus==='queue'?'<span class="badge b-blue">In Queue</span>':
            '<span class="badge b-gray">Waiting</span>'}
        </td>
        <td style="display:flex;gap:4px">
          ${p.stageStatus!=='on-stage'&&p.stageStatus!=='done'?`<button class="btn btn-amber btn-xs" onclick="pushToStage('${p.id}')">&#9654; Stage</button>`:''}
          ${p.stageStatus === 'waiting' ? `<button class="btn btn-blue btn-xs" onclick="addToUpcoming('${p.id}')">&#43; Queue</button>` : ''}
          <button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="markPresent('${p.id}')">&#10005; Absent</button>
        </td>
      </tr>`;
    }).join('');

    return `
      <div class="card" style="margin-bottom:14px">
        <div class="card-header" style="display:flex;align-items:center;gap:12px">
          <div class="card-title" style="margin:0"><span class="badge ${group.color}" style="font-size:13px;padding:4px 14px">${group.label}</span></div>
          <div class="badge b-green">${group.participants.length} Present</div>
        </div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>#</th><th>Name</th><th>ID</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }).join('');
}"""

if old_js in content:
    content = content.replace(old_js, new_js, 1)
    print('JS section replaced.')
else:
    print('JS section NOT found — trying trimmed match...')
    # Try finding unique anchor
    anchor = "  // All participants table\n  document.getElementById('venue-participants-tbody').innerHTML"
    if anchor in content:
        print('Anchor found, needs manual range replacement.')
    else:
        print('Anchor also not found.')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done.')
