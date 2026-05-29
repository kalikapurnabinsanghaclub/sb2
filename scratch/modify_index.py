import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

file_path = r"c:\Users\sourav pc\Desktop\kalikapur\index.html"

# Load current contents
with open(file_path, "r", encoding="utf-8", errors="surrogateescape", newline="") as f:
    content = f.read()

replacements = []

# --- 1. switchMainTab Safety Check ---
target_1 = """    function switchMainTab(event) {
      const btn = event.currentTarget;
      const tabName = btn.getAttribute("data-tab");

      // Hide all tabs
      document.querySelectorAll(".mainTabContent").forEach(t => t.classList.add("hidden"));

      // Show selected tab
      document.getElementById(tabName + "Tab").classList.remove("hidden");

      // Update button styles
      document.querySelectorAll(".mainTab").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
    }"""

replacement_1 = """    function switchMainTab(event) {
      const btn = event.currentTarget;
      const tabName = btn.getAttribute("data-tab");

      // Hide all tabs
      document.querySelectorAll(".mainTabContent").forEach(t => t.classList.add("hidden"));

      // Show selected tab
      const tabEl = document.getElementById(tabName + "Tab");
      if (tabEl) tabEl.classList.remove("hidden");

      // Update button styles
      document.querySelectorAll(".mainTab").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
    }"""

replacements.append(("switchMainTab", target_1, replacement_1))

# --- 2. renderCategoryFilters Simplification ---
target_2 = """    function renderCategoryFilters() {
      // 1. Render Promotion Categories Filter
      const promoContainer = document.getElementById("categoryFilters");
      if (promoContainer) {
        let html = `<button class="catBtn ${currentCategory === 'All' ? 'on' : ''}" data-cat="All" onclick="window.switchCategory(event)">All Categories</button>`;
        CATEGORIES.forEach(c => {
          const emojiMap = { 'Dance': '💃', 'Music': '🎵', 'Art': '🎨', 'Yoga': '🧘', 'Sports': '⚽' };
          let emoji = '';
          for (let key in emojiMap) {
            if (c.name.includes(key)) { emoji = emojiMap[key] + ' '; break; }
          }
          html += `<button class="catBtn ${currentCategory === c.name ? 'on' : ''}" data-cat="${c.name}" onclick="window.switchCategory(event)">${emoji}${c.name}</button>`;
        });
        promoContainer.innerHTML = html;
      }

      // 2. Render Leaderboard Results Categories Filter
      const leadContainer = document.getElementById("categoriesDiv");
      if (leadContainer) {
        let html = `<button class="catBtn ${currentCategory === 'All' ? 'on' : ''}" data-cat="All" onclick="window.switchCategory(event)">🌟 All Categories</button>`;
        CATEGORIES.forEach(c => {
          const emojiMap = { 'Dance': '💃', 'Music': '🎵', 'Art': '🎨', 'Yoga': '🧘', 'Sports': '⚽' };
          let emoji = '';
          for (let key in emojiMap) {
            if (c.name.includes(key)) { emoji = emojiMap[key] + ' '; break; }
          }
          html += `<button class="catBtn ${currentCategory === c.name ? 'on' : ''}" data-cat="${c.name}" onclick="window.switchCategory(event)">${emoji}${c.name}</button>`;
        });
        leadContainer.innerHTML = html;
      }
    }"""

replacement_2 = """    function renderCategoryFilters() {
      // 1. Render Promotion Categories Filter
      const promoContainer = document.getElementById("categoryFilters");
      if (promoContainer) {
        let html = `<button class="catBtn ${currentCategory === 'All' ? 'on' : ''}" data-cat="All" onclick="window.switchCategory(event)">🌟 All Categories</button>`;
        CATEGORIES.forEach(c => {
          const emojiMap = { 'Dance': '💃', 'Music': '🎵', 'Art': '🎨', 'Yoga': '🧘', 'Sports': '⚽' };
          let emoji = '';
          for (let key in emojiMap) {
            if (c.name.includes(key)) { emoji = emojiMap[key] + ' '; break; }
          }
          html += `<button class="catBtn ${currentCategory === c.name ? 'on' : ''}" data-cat="${c.name}" onclick="window.switchCategory(event)">${emoji}${c.name}</button>`;
        });
        promoContainer.innerHTML = html;
      }
    }"""

replacements.append(("renderCategoryFilters", target_2, replacement_2))

# --- 3. checkLiveStatus resultsSection Toggle Removal ---
target_3 = """      const resultsSection = document.getElementById('live-results-section');
      if (resultsSection) {
        resultsSection.style.display = hasLiveStage ? 'block' : 'none';
      }"""

replacement_3 = """      // (results-section removed)"""

replacements.append(("checkLiveStatus resultsSection", target_3, replacement_3))

# --- 4. Sync Tab Buttons (Section 5 of Sync Engine) ---
target_4 = """        // 5. Sync Live Results & Ranking
        const showResults = state.switchStates?.resultPublic === true;
        const showPromo = state.switchStates?.promoPublic === true;
        const showDownload = state.switchStates?.downloadPublic === true;

        const resBtn = document.getElementById("resultsTabBtn");
        const proBtn = document.getElementById("promotionTabBtn");
        const dwnBtn = document.getElementById("downloadTabBtn");

        if (resBtn) resBtn.style.display = showResults ? "inline-flex" : "none";
        if (proBtn) proBtn.style.display = showPromo ? "inline-flex" : "none";
        if (dwnBtn) dwnBtn.style.display = showDownload ? "inline-flex" : "none";"""

replacement_4 = """        // 5. Sync Live Results & Ranking
        const showResults = state.switchStates?.resultPublic === true;
        const showPromo = state.switchStates?.promoPublic === true;
        const showDownload = state.switchStates?.downloadPublic === true;

        const resBtn = document.getElementById("resultsTabBtn");
        const proBtn = document.getElementById("promoTabBtn"); // Updated to match HTML ID
        const dwnBtn = document.getElementById("downloadTabBtn");

        if (resBtn) resBtn.style.display = showResults ? "inline-flex" : "none";
        if (proBtn) proBtn.style.display = showPromo ? "inline-flex" : "none";
        if (dwnBtn) dwnBtn.style.display = showDownload ? "inline-flex" : "none";

        // Auto-switch active tabs if current active is hidden
        if (!showResults && showPromo) {
          const promoTab = document.getElementById("promotionTab");
          const resultsTab = document.getElementById("resultsTab");
          if (promoTab) promoTab.classList.remove("hidden");
          if (resultsTab) resultsTab.classList.add("hidden");
          if (proBtn) proBtn.classList.add("on");
          if (resBtn) resBtn.classList.remove("on");
        } else if (showResults) {
          const promoTab = document.getElementById("promotionTab");
          const resultsTab = document.getElementById("resultsTab");
          if (proBtn && !proBtn.classList.contains("on")) {
            if (resultsTab) resultsTab.classList.remove("hidden");
            if (promoTab) promoTab.classList.add("hidden");
            if (resBtn) resBtn.classList.add("on");
          }
        }"""

replacements.append(("Sync Tab Buttons", target_4, replacement_4))

# --- 5. Global Variables sync update ---
target_5 = """              window.LIVE_RESULTS = LIVE_RESULTS.map((p, idx) => ({
                rank: idx + 1,
                name: p.name,
                cat: activeEv.categories?.find(c => String(c.id) === String(p.catId))?.name || 'Participant',
                score: p.score,
                round: p.round || 'audition',
                id: p.id
              }));
              
              window.PROMOTED = PROMOTED.map(p => ({
                id: p.id,
                name: p.name,
                cat: activeEv.categories?.find(c => String(c.id) === String(p.catId))?.name || 'Participant',
                round: p.round
              }));"""

replacement_5 = """              const mappedLiveResults = LIVE_RESULTS.map((p, idx) => ({
                rank: idx + 1,
                name: p.name,
                cat: activeEv.categories?.find(c => String(c.id) === String(p.catId))?.name || 'Participant',
                score: p.score,
                round: p.round || 'audition',
                id: p.id
              }));
              window.LIVE_RESULTS = mappedLiveResults;
              LIVE_RESULTS = mappedLiveResults;
              
              const mappedPromoted = PROMOTED.map(p => ({
                id: p.id,
                name: p.name,
                cat: activeEv.categories?.find(c => String(c.id) === String(p.catId))?.name || 'Participant',
                round: p.round
              }));
              window.PROMOTED = mappedPromoted;
              PROMOTED = mappedPromoted;"""

replacements.append(("Global Variables Sync", target_5, replacement_5))

# --- 6. Live Content Tab Buttons HTML Template ---
target_6 = """            <div style="display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap;">
              <button id="promoTabBtn" class="mainTab hidden" data-tab="promotion" onclick="switchMainTab(event)">✅ Selected / Promoted</button>
            </div>"""

replacement_6 = """            <div style="display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap;">
              <button id="resultsTabBtn" class="tab-b mainTab on" data-tab="results" onclick="switchMainTab(event)">📊 Results</button>
              <button id="promoTabBtn" class="tab-b mainTab hidden" data-tab="promotion" onclick="switchMainTab(event)">🏆 Selected / Promoted</button>
            </div>"""

replacements.append(("HTML Tab Buttons Template", target_6, replacement_6))

success = True
for name, target, replacement in replacements:
    if target in content:
        content = content.replace(target, replacement)
        print(f"[{name}] SUCCESS: Replacement applied.")
    else:
        print(f"[{name}] WARNING: Target string not found in content!")
        # Let's show part of the target to aid debug
        lines = target.split("\n")
        print("  Looking for prefix:", repr(lines[0] if lines else ""))
        success = False

if success:
    with open(file_path, "w", encoding="utf-8", errors="surrogateescape", newline="") as f:
        f.write(content)
    print("SUCCESS: Modified file successfully written!")
else:
    print("FAILURE: Not all replacements succeeded. File was NOT modified.")
