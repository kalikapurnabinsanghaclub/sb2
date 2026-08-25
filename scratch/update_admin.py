import sys
sys.stdout.reconfigure(encoding='utf-8')
path = r'c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Admin.html'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if '</div> <!-- /content -->' in line:
        new_lines.append('''  <div class="pp" id="pp-feedback">
    <div class="card" style="margin-bottom: 24px;">
      <h2 style="font-size:1.5rem;font-weight:800;color:var(--text-main);margin-bottom:8px;">Public Ratings & Messages</h2>
      <p style="color:var(--text-muted);font-size:0.9rem;">View feedback and contact form submissions from the public portal.</p>
    </div>
    
    <div class="grid-2" style="margin-bottom: 24px;">
      <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 40px;">
        <h3 style="font-size:1rem; color:var(--text-muted); margin-bottom:12px; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Average Rating</h3>
        <div id="fb-avg-rating" style="font-size:3.5rem; font-weight:900; color:var(--text-main); line-height:1;">-</div>
        <div id="fb-stars" style="font-size:1.5rem; margin-top:8px;">⭐⭐⭐⭐⭐</div>
        <div id="fb-total-ratings" style="font-size:0.85rem; color:var(--text-muted); margin-top:12px;">0 total ratings</div>
      </div>
      <div class="card" style="display:flex; flex-direction:column; justify-content:center; padding: 40px;">
        <h3 style="font-size:1rem; color:var(--text-muted); margin-bottom:12px; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Quick Stats</h3>
        <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:1.1rem; font-weight:600; color:var(--text-main);">
          <span>Total Messages:</span>
          <span id="fb-total-msgs">0</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:1.1rem; font-weight:600; color:var(--text-main);">
          <span>Recent (last 7 days):</span>
          <span id="fb-recent-msgs">0</span>
        </div>
      </div>
    </div>

    <div class="card" style="padding: 0;">
      <div style="padding: 24px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
        <h3 style="font-size:1.1rem;font-weight:700;">Recent Messages</h3>
        <button class="btn btn-primary" onclick="renderFeedback()">🔄 Refresh</button>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr>
            <th>Date</th>
            <th>Sender</th>
            <th>Subject</th>
            <th>Message</th>
          </tr></thead>
          <tbody id="fb-tbody"><tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-muted)">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>\n''')
        new_lines.append(line)
    elif 'function renderStaffPage() {' in line:
        new_lines.append('''async function renderFeedback() {
  try {
    document.getElementById("fb-tbody").innerHTML = '<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-muted)">Loading feedback...</td></tr>';
    
    // Fetch Data
    const messages = await window.syncEngine.fetchContactMessages();
    const ratings = await window.syncEngine.fetchRatings();
    
    // Calculate Ratings
    const totalRatings = ratings.length;
    let avg = 0;
    if (totalRatings > 0) {
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      avg = (sum / totalRatings).toFixed(1);
    }
    
    document.getElementById("fb-avg-rating").textContent = totalRatings > 0 ? avg : "-";
    document.getElementById("fb-stars").textContent = totalRatings > 0 ? "⭐".repeat(Math.round(avg)) : "⭐⭐⭐⭐⭐";
    document.getElementById("fb-total-ratings").textContent = `${totalRatings} total ratings`;
    
    // Calculate Message Stats
    const totalMsgs = messages.length;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMsgs = messages.filter(m => new Date(m.created_at) >= sevenDaysAgo).length;
    
    document.getElementById("fb-total-msgs").textContent = totalMsgs;
    document.getElementById("fb-recent-msgs").textContent = recentMsgs;
    
    // Render Table
    const tbody = document.getElementById("fb-tbody");
    if (messages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-muted)">No messages found.</td></tr>';
      return;
    }
    
    let html = '';
    messages.forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
      html += `
        <tr>
          <td style="white-space:nowrap;font-size:0.85rem;color:var(--text-muted);">${date}</td>
          <td>
            <div style="font-weight:700;color:var(--text-main);">${m.name}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${m.email}</div>
          </td>
          <td style="font-weight:600;">${m.subject || '---'}</td>
          <td style="max-width:300px; white-space:pre-wrap; line-height:1.4; font-size:0.9rem;">${m.message}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
    
  } catch (e) {
    console.error(e);
    document.getElementById("fb-tbody").innerHTML = '<tr><td colspan="4" style="text-align:center;padding:30px;color:#ef4444">Error loading feedback. Try again.</td></tr>';
  }
}\n\n''')
        new_lines.append(line)
    else:
        new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Updated KNSDC-Admin.html successfully')
