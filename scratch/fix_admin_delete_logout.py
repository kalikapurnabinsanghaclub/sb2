import sys

path = r'c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Admin.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# ── Fix 1: Sidebar CSS — ensure it's full height so Logout always visible ──
old_sidebar_css = """  .sidebar { 
    width: 260px; 
    min-width: 260px; 
    background: #ffffff; 
    border-right: 1px solid #e2e8f0; 
    display: flex; 
    flex-direction: column; 
    z-index: 100; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
    box-shadow: 10px 0 40px rgba(0, 0, 0, 0.05); 
  }"""

new_sidebar_css = """  .sidebar { 
    width: 260px; 
    min-width: 260px; 
    background: #ffffff; 
    border-right: 1px solid #e2e8f0; 
    display: flex; 
    flex-direction: column; 
    z-index: 100; 
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    position: sticky;
    top: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
    box-shadow: 10px 0 40px rgba(0, 0, 0, 0.05); 
  }"""

if old_sidebar_css in content:
    content = content.replace(old_sidebar_css, new_sidebar_css)
    changes += 1
    print('Fix 1 applied: sidebar CSS fixed')
else:
    print('Fix 1 SKIP: sidebar CSS not found (may already be fixed)')

# ── Fix 2: Staff Matrix card — add delete button ──
old_staff_card = """            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px">
                    <div style="width:32px; height:32px; border-radius:50%; background:var(--blue); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-family:var(--fh)">${st.name[0]}</div>
                    <div style="font-weight:700; font-size:14px">${st.name}</div>
                </div>"""

new_staff_card = """            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px">
                    <div style="width:32px; height:32px; border-radius:50%; background:var(--blue); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-family:var(--fh)">${st.name[0]}</div>
                    <div style="font-weight:700; font-size:14px; flex:1">${st.name}<br><span style="font-size:10px;color:#64748b;font-weight:500">${st.role || 'Judge'}</span></div>
                    <button onclick="deleteStaffCard('${st.id}','${st.name}')" title="Remove staff" style="background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.2);color:#dc2626;border-radius:8px;padding:4px 8px;cursor:pointer;font-size:13px;line-height:1;transition:all 0.2s" onmouseover="this.style.background='rgba(220,38,38,0.18)'" onmouseout="this.style.background='rgba(220,38,38,0.08)'">🗑</button>
                </div>"""

if old_staff_card in content:
    content = content.replace(old_staff_card, new_staff_card)
    changes += 1
    print('Fix 2 applied: delete button added to staff matrix card')
else:
    print('Fix 2 SKIP: staff card header not found exactly')
    # Try to show context
    idx = content.find('renderStaffMatrix')
    if idx > -1:
        print('  renderStaffMatrix found at char', idx)
        print('  Context:', repr(content[idx:idx+300]))

# ── Fix 3: Add deleteStaffCard function after removeStaff ──
old_remove_staff_fn = """async function removeStaff(email, name) {
  if (!confirm(`Remove ${name} (${email}) from staff? They will not be able to log in anymore.`)) return;
  const res = await syncEngine.deleteStaffMember(email);
  if (!res.success) { toast('Failed: ' + res.error, 'error'); return; }
  toast(`🗑️ ${name} removed from staff.`);
  renderStaffPage();
}"""

new_remove_staff_fn = """async function removeStaff(email, name) {
  if (!confirm(`Remove ${name} (${email}) from staff? They will not be able to log in anymore.`)) return;
  const res = await syncEngine.deleteStaffMember(email);
  if (!res.success) { toast('Failed: ' + res.error, 'error'); return; }
  toast(`🗑️ ${name} removed from staff.`);
  renderStaffPage();
}

// Delete staff from Dashboard Staff Overview matrix card
async function deleteStaffCard(staffId, staffName) {
  if (!confirm(`Remove ${staffName} from staff? This action cannot be undone.`)) return;
  const s = syncEngine.getData();
  // Find email by matching id in staff credentials
  const creds = s.staffCredentials || {};
  const email = Object.keys(creds).find(k => creds[k].id === staffId || k === staffId) || staffId;
  // Also try judgeCredentials
  const jCreds = s.judgeCredentials || {};
  const jEmail = Object.keys(jCreds).find(k => (jCreds[k].id === staffId || k === staffId));
  if (jEmail) {
    // Remove from judgeCredentials
    delete jCreds[jEmail];
    const newState = { ...s, judgeCredentials: jCreds };
    syncEngine.saveState(newState);
    toast(`🗑️ ${staffName} removed successfully.`);
    refreshUI('dashboard');
    return;
  }
  const res = await syncEngine.deleteStaffMember(email);
  if (!res.success) {
    // Fallback: remove from local state
    const newCreds = { ...creds };
    delete newCreds[email];
    const newState = { ...s, staffCredentials: newCreds };
    syncEngine.saveState(newState);
    toast(`🗑️ ${staffName} removed from local state.`);
  } else {
    toast(`🗑️ ${staffName} removed.`);
  }
  refreshUI('dashboard');
}
window.deleteStaffCard = deleteStaffCard;"""

if old_remove_staff_fn in content:
    content = content.replace(old_remove_staff_fn, new_remove_staff_fn)
    changes += 1
    print('Fix 3 applied: deleteStaffCard function added')
else:
    print('Fix 3 SKIP: removeStaff function not found exactly')

# ── Fix 4: Make sure Logout button in sidebar is styled properly ──
old_logout_div = """  <div style="margin-top:auto;padding:16px;border-top:1px solid var(--border)">
    <button class="btn btn-ghost" style="width:100%;justify-content:center;color:var(--red2);border-color:rgba(220,38,38,0.2)" onclick="logout()">🚪 Logout</button>
  </div>"""

new_logout_div = """  <div style="margin-top:auto;padding:16px;border-top:1px solid var(--border);position:sticky;bottom:0;background:#fff;z-index:10">
    <div style="font-size:10px;color:#94a3b8;text-align:center;margin-bottom:8px;font-family:var(--fm);letter-spacing:1px;text-transform:uppercase">Admin Session</div>
    <button class="btn btn-ghost" style="width:100%;justify-content:center;color:#dc2626;border-color:rgba(220,38,38,0.25);background:rgba(220,38,38,0.04);font-weight:700;border-radius:10px;padding:10px" onclick="logout()">🚪 Logout</button>
  </div>"""

if old_logout_div in content:
    content = content.replace(old_logout_div, new_logout_div)
    changes += 1
    print('Fix 4 applied: Logout button styled and sticky')
else:
    print('Fix 4 SKIP: logout div not found exactly — checking variant...')
    # Try CRLF version
    old2 = old_logout_div.replace('\n', '\r\n')
    if old2 in content:
        content = content.replace(old2, new_logout_div)
        changes += 1
        print('Fix 4 applied (CRLF): Logout button styled and sticky')
    else:
        print('  Logout div not found in either format')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\nDone. {changes} fixes applied.')
