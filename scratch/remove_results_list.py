import sys
import io

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"c:\Users\sourav pc\Desktop\kalikapur\index.html"

with open(file_path, "r", encoding="utf-8", errors="surrogateescape", newline="") as f:
    content = f.read()

# 1. Replace the HTML structure in renderLiveUI to remove categoryFilters and resultsList
target_html = """            <div id="resultsTab" class="mainTabContent">
              <div id="resultsStatsLive" style="margin-bottom:20px;"></div>

              <div id="categoryFilters" style="display:flex; gap:8px; margin-bottom:12px; overflow-x:auto; padding-bottom:5px;"></div>
              <div id="resultsList" style="display:grid; gap:10px;"></div>
            </div>"""

replacement_html = """            <div id="resultsTab" class="mainTabContent">
              <div id="resultsStatsLive" style="margin-bottom:20px;"></div>
            </div>"""

# 2. Replace the render logic in renderResults() that populates resultsList
target_js = """      const list = document.getElementById("resultsList");
      if (!list) return;
      const filtered = currentCategory === "All" ? LIVE_RESULTS : LIVE_RESULTS.filter(r => r.cat.includes(currentCategory));
      list.innerHTML = "";
      filtered.forEach((r, i) => {
        const state = syncEngine.getData();
        const p = state.participants.find(x => x.name === r.name);
        const div = document.createElement("div");
        const medalColors = ["rgba(255,215,0,.08)", "rgba(192,192,192,.08)", "rgba(205,127,50,.08)"];
        const medalBorders = ["rgba(255,215,0,.3)", "rgba(192,192,192,.3)", "rgba(205,127,50,.3)"];
        const medalEmojis = ["🥇", "🥈", "🥉"];

        div.style.cssText = `display:flex; align-items:center; gap:16px; background:${r.rank <= 3 ? medalColors[r.rank - 1] : "#ffffff"}; border-radius:18px; padding:16px 24px; border:${r.rank <= 3 ? `2px solid ${medalBorders[r.rank - 1]}` : "1px solid #e2e8f0"}; animation:fadeUp 0.35s ${i * 0.05}s ease both; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.04);`;

        const medalGradients = ["linear-gradient(135deg,#FFD700,#FFA500)", "linear-gradient(135deg,#C0C0C0,#888)", "linear-gradient(135deg,#CD7F32,#8B4513)"];

        const pData = { id: p ? p.id : 'N/A', phone: p ? (p.phone || '') : '', name: r.name, cat: r.cat, catId: p ? p.catId : '', eventId: p ? p.eventId : '', rank: r.rank, score: r.score };
        const pEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(pData))));

        div.innerHTML = `
          <div style="width:46px; height:46px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:${r.rank <= 3 ? "1.4rem" : "1.1rem"}; background:${r.rank <= 3 ? medalGradients[r.rank - 1] : "#f1f5f9"}; color:${r.rank > 3 ? "#4F46E5" : "#fff"}; border:2px solid ${r.rank <= 3 ? "rgba(255,255,255,0.3)" : "#e2e8f0"}; box-shadow:0 4px 8px rgba(0,0,0,0.08);">${medalEmojis[r.rank - 1] || r.rank}</div>
          <div style="flex:1">
            <div style="font-weight:800; font-size:1.05rem; color:#1E293B; letter-spacing:0.3px;">${r.name}</div>
            <div style="font-size:0.82rem; color:#64748B; font-weight:600;">${r.cat}</div>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="font-family:'Cinzel Decorative',cursive; font-size:1.3rem; font-weight:900; color:#7C3AED;">${r.score}</div>
            <button class="btn btn-p" style="padding:10px 14px; font-size:1.2rem; border-radius:12px; background:#f5f3ff; border:1px solid rgba(124,58,237,0.15); color:#7C3AED;" onclick="window.generateParticipantCertificate(JSON.parse(decodeURIComponent(escape(atob('${pEncoded}')))))" title="Download Certificate">🎓</button>
          </div>
        `;
        list.appendChild(div);
      });"""

replacement_js = """      // resultsList rendered section removed per user request"""

content_lf = content.replace("\r\n", "\n")
target_html_lf = target_html.replace("\r\n", "\n")
replacement_html_lf = replacement_html.replace("\r\n", "\n")
target_js_lf = target_js.replace("\r\n", "\n")
replacement_js_lf = replacement_js.replace("\r\n", "\n")

modified = False
if target_html_lf in content_lf:
    content_lf = content_lf.replace(target_html_lf, replacement_html_lf)
    print("SUCCESS: HTML structure for resultsList removed.")
    modified = True
else:
    print("WARNING: HTML structure target not found!")

if target_js_lf in content_lf:
    content_lf = content_lf.replace(target_js_lf, replacement_js_lf)
    print("SUCCESS: Javascript render logic for resultsList removed.")
    modified = True
else:
    print("WARNING: Javascript render logic target not found!")

if modified:
    with open(file_path, "w", encoding="utf-8", errors="surrogateescape", newline="") as f:
        f.write(content_lf)
    print("SUCCESS: index.html modified successfully!")
else:
    print("FAILURE: No changes made.")
