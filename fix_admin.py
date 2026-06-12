import sys

file_path = 'KNSDC-Admin.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<!-- ════════════════ TOTAL REGISTRATION ════════════════ -->'
end_marker = '<!-- ════════════════ STATISTICS ════════════════ -->'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print('Markers not found')
    sys.exit(1)

replacement = """<!-- ════════════════ TOTAL REGISTRATION ════════════════ -->
  <div class="pp" id="pp-participants">
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <div>
          <div class="card-title">👥 Total Registration</div>
          <div style="font-size:10px; color:var(--text-muted); margin-top:2px">All public applications and approved participants</div>
        </div>
        <div style="display:flex; gap:10px">
          <div class="sbox"><span class="sicon">🔍</span><input type="text" id="admin-p-search" placeholder="Name or Phone..." oninput="renderAdminParticipants()"/></div>
          <select id="admin-p-event-filter" onchange="renderAdminParticipants()" style="width:150px!important"></select>
          <button class="btn btn-ghost btn-sm" onclick="refreshUI('participants')">🔄 Refresh</button>
        </div>
      </div>
      <div class="tbl-wrap" style="max-height:600px; overflow-y:auto">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Event</th>
              <th>Status / Verification</th>
            </tr>
          </thead>
          <tbody id="admin-p-tbody"></tbody>
        </table>
      </div>
    </div>
  </div>

  """

new_content = content[:start_idx] + replacement + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Successfully replaced HTML')
