const fs = require('fs');

// --- 1. Modify KNSDC-Monitor.html ---
let monitor = fs.readFileSync('KNSDC-Monitor.html', 'utf8');

const micCSS = `
  /* ==========================================================================
     Isolated State-Color Stylesheet (Message-Free Configuration)
     ========================================================================== */

  /* Component Isolation Namespace Wrapper */
  .jack-toggle-component {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Console Panel Board Backing */
  .jack-toggle-component .jack-toggle-panel {
    background: #f0f2f5;
    border: 2px solid #dcdfe4;
    padding: 30px;
    border-radius: 8px;
    width: 240px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 
      0px 8px 24px rgba(160, 174, 192, 0.25),
      inset 1px 1px 0px #ffffff;
    box-sizing: border-box;
  }

  /* Header Text Label */
  .jack-toggle-component .jack-toggle-title {
    color: #718096;
    font-family: Arial, sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    margin-bottom: 35px;
  }

  /* Main Interactive Hitbox Layout Box */
  .jack-toggle-component .jack-toggle-container {
    position: relative;
    width: 180px;
    height: 60px;
    display: flex;
    align-items: center;
    cursor: pointer;
    box-sizing: border-box;
  }

  /* Hide native checkbox element */
  .jack-toggle-component .jack-toggle-input {
    display: none;
  }

  /* Audio Input Socket Hole */
  .jack-toggle-component .jack-socket-port {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #1a202c; 
    border: 3px solid #cbd5e0; 
    box-shadow: 
      inset 0px 3px 6px rgba(0, 0, 0, 0.9),
      0px 2px 4px rgba(0, 0, 0, 0.05);
    position: absolute;
    left: 10px;
    z-index: 1;
    box-sizing: border-box;
  }

  /* Cable Plug Assembly Master Node */
  .jack-toggle-component .jack-cable-plug {
    position: absolute;
    left: 95px; /* Default pulled out position (OFF state) */
    display: flex;
    align-items: center;
    transition: left 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    will-change: left;
  }

  /* Metal Probe Shaft */
  .jack-toggle-component .jack-plug-shaft {
    width: 30px;
    height: 8px;
    background: linear-gradient(to bottom, #ffffff 0%, #e2e8f0 40%, #a0aec0 70%, #4a5568 100%);
    border-radius: 1px 0 0 1px;
    position: relative;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.15);
  }

  /* Tip segment detail marking on the probe */
  .jack-toggle-component .jack-plug-shaft::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 6px;
    height: 8px;
    background: linear-gradient(to bottom, #cbd5e0, #4a5568);
    border-radius: 2px 0 0 2px;
    border-right: 2px solid #1a202c;
  }

  /* Textured Grip Handle */
  .jack-toggle-component .jack-plug-handle {
    width: 45px;
    height: 20px;
    background: repeating-linear-gradient(
      to right, 
      #edf2f7, 
      #edf2f7 4px, 
      #e2e8f0 4px, 
      #e2e8f0 6px
    );
    border: 1px solid #cbd5e0;
    border-radius: 3px;
    box-shadow: 0px 3px 6px rgba(160, 174, 192, 0.3);
  }

  /* The Trailing Wire Line - DEFAULT STATE (PLUG-OUT: YELLOW) */
  .jack-toggle-component .jack-wire-tail {
    width: 50px;
    height: 6px;
    background: #ecc94b; 
    border-radius: 0 3px 3px 0;
    box-shadow: 0px 2px 4px rgba(236, 201, 75, 0.3);
    transition: background 0.25s ease, box-shadow 0.25s ease;
  }

  /* ==========================================================================
     State Transformations (ON Action / PLUG-IN INTERLOCKS)
     ========================================================================== */

  /* Shift the cable forward smoothly into the input hole container */
  .jack-toggle-component .jack-toggle-input:checked ~ .jack-cable-plug {
    left: 22px; 
  }

  /* Transition the wire line color when plugged in (PLUG-IN: GREEN) */
  .jack-toggle-component .jack-toggle-input:checked ~ .jack-cable-plug .jack-wire-tail {
    background: #38a169; 
    box-shadow: 0px 2px 4px rgba(56, 161, 105, 0.3);
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
          <div class="jack-toggle-component" style="display:inline-block; padding: 0;">
            <label class="jack-toggle-container">
              <input type="checkbox" class="jack-toggle-input" id="host-score-vis-toggle" onchange="handleHostScoreVisToggle(this)"/>
              <div class="jack-socket-port"></div>
              <div class="jack-cable-plug">
                <div class="jack-plug-shaft"></div>
                <div class="jack-plug-handle"></div>
                <div class="jack-wire-tail"></div>
              </div>
            </label>
          </div>
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
