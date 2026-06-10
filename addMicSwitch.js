const fs = require('fs');

// --- 1. Modify KNSDC-Monitor.html ---
let monitor = fs.readFileSync('KNSDC-Monitor.html', 'utf8');

const micCSS = `
  /* MIC PLUG SWITCH ANIMATION */
  .mic-switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 24px;
    cursor: pointer;
  }
  .mic-switch input { opacity: 0; width: 0; height: 0; }
  .mic-slider {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #e2e8f0;
    border-radius: 12px;
    transition: 0.4s;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  .mic-socket {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 16px;
    background: #1e293b;
    border-radius: 3px;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.6);
    transition: 0.4s;
  }
  .mic-plug {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 4px;
    display: flex;
    align-items: center;
    transition: 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
    z-index: 2;
  }
  .plug-tip {
    width: 8px;
    height: 8px;
    background: linear-gradient(to bottom, #f3f4f6, #9ca3af, #f3f4f6);
    border-radius: 0 3px 3px 0;
    border-right: 1px solid #4b5563;
  }
  .plug-body {
    width: 14px;
    height: 12px;
    background: #0f172a;
    border-radius: 2px 0 0 2px;
  }
  .plug-wire {
    width: 40px;
    height: 3px;
    background: #334155;
    position: absolute;
    right: 100%;
  }
  .mic-switch input:checked + .mic-slider { background: #bbf7d0; }
  .mic-switch input:checked + .mic-slider .mic-plug { left: calc(100% - 28px); }
  .mic-switch input:checked + .mic-slider .mic-socket {
    background: #22c55e;
    box-shadow: inset 0 0 8px rgba(0,0,0,0.2), 0 0 8px #4ade80;
  }
</style>
`;
monitor = monitor.replace('</style>', micCSS);

const hostSwitchHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:var(--surface2);border-radius:14px;border:1px solid var(--border);margin-bottom:16px">
          <div>
            <div style="font-weight:800;font-size:13px" id="host-score-vis-label">Host Live Ranking: OFF 🔒</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">Toggle to show scores in Host panel</div>
          </div>
          <label class="mic-switch" title="Mic Plug Switch">
            <input type="checkbox" id="host-score-vis-toggle" onchange="handleHostScoreVisToggle(this)"/>
            <span class="mic-slider">
              <div class="mic-socket"></div>
              <div class="mic-plug">
                <div class="plug-wire"></div>
                <div class="plug-body"></div>
                <div class="plug-tip"></div>
              </div>
            </span>
          </label>
        </div>
`;

// Insert the new switch below the existing one
monitor = monitor.replace('</label>\n        </div>\n\n        <div id="score-pin-prompt"', '</label>\n        </div>\n' + hostSwitchHTML + '\n        <div id="score-pin-prompt"');

// Add the JS logic
const hostSwitchJS = `
function handleHostScoreVisToggle(cb) {
  const isVisible = cb.checked;
  syncEngine.setData(s => ({ ...s, hostScoresVisible: isVisible }));
  toast(isVisible ? '🎤 Host scores are now VISIBLE (Plug In)' : '🔇 Host scores are now HIDDEN (Plug Out)');
}

// Ensure the UI stays in sync if another monitor changes it
syncEngine.subscribe(state => {
  if (!state) return;
  const toggle = document.getElementById('host-score-vis-toggle');
  const label = document.getElementById('host-score-vis-label');
  const isVisible = state.hostScoresVisible !== false; // Default true if not set
  
  if (toggle && toggle.checked !== isVisible) {
    toggle.checked = isVisible;
  }
  if (label) {
    label.innerHTML = isVisible ? 'Host Live Ranking: ON 🎤' : 'Host Live Ranking: OFF 🔒';
  }
});
`;

monitor = monitor.replace('function verifyScorePin() {', hostSwitchJS + '\nfunction verifyScorePin() {');

fs.writeFileSync('KNSDC-Monitor.html', monitor);


// --- 2. Modify KNSDC-Host.html ---
let host = fs.readFileSync('KNSDC-Host.html', 'utf8');

// Replace standard \${p.totalScore} and \${top3[X].totalScore} with conditional
// We will do a generic replace in the renderLeaderboard section
// First we inject the flag at the top of renderLeaderboard
host = host.replace('function renderLeaderboard() {', `function renderLeaderboard() {\n  const hostScoresVisible = syncEngine.getData().hostScoresVisible !== false;`);

// Top 3 replacements
host = host.replace(/\$\{top3\[1\]\.totalScore\} pts/g, `\${hostScoresVisible ? top3[1].totalScore + ' pts' : '🔒 HIDDEN'}`);
host = host.replace(/\$\{top3\[0\]\.totalScore\} pts/g, `\${hostScoresVisible ? top3[0].totalScore + ' pts' : '🔒 HIDDEN'}`);
host = host.replace(/\$\{top3\[2\]\.totalScore\} pts/g, `\${hostScoresVisible ? top3[2].totalScore + ' pts' : '🔒 HIDDEN'}`);

// List replacements
host = host.replace(/\$\{p\.totalScore\}<\/div>/g, `\${hostScoresVisible ? p.totalScore : '🔒'}</div>`);

fs.writeFileSync('KNSDC-Host.html', host);

console.log('Update successful');
