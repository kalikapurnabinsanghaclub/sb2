import sys; sys.stdout.reconfigure(encoding='utf-8')
with open('KNSDC-Participant.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Prepare Arcade Zone HTML (collapsible)
arcade_html = '''
    <!-- ARCADE ZONE (Collapsible) -->
    <div class="card" id="arcade-games-section" style="margin-top: 30px; cursor: pointer; background:linear-gradient(135deg, rgba(124,58,237,0.05), rgba(124,58,237,0.1)); border: 1px solid rgba(124,58,237,0.2);" onclick="toggleArcadeZone()">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="background:linear-gradient(135deg, #7c3aed, #4f46e5); color:white; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 4px 10px rgba(124,58,237,0.3);">??</div>
          <div>
            <div class="card-title" style="font-size:18px; font-weight:800; color:var(--primary); margin:0;">KNSDC Arcade & Games Zone</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Tap to expand and play 2D games while waiting!</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="badge" style="background:rgba(124,58,237,0.1); color:#7c3aed; font-weight:800; padding:6px 12px; border-radius:99px; border:1px solid rgba(124,58,237,0.3);">??? 2 Games Live</span>
          <span id="arcade-chevron" style="transition: transform 0.3s; color:var(--text-muted); font-size:20px;">?</span>
        </div>
      </div>

      <!-- Collapsible Content -->
      <div id="arcade-games-content" style="display:none; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:14px; margin-top:20px; border-top:1px dashed var(--border); padding-top:20px;">
        <!-- Game 1: Rhythm Blitz -->
        <div style="background:linear-gradient(135deg, #1e1b4b, #312e81); border:1px solid #4338ca; border-radius:16px; padding:18px; color:#fff; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 8px 20px rgba(49,46,129,0.25);" onclick="event.stopPropagation();">
          <div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
              <span style="font-size:32px;">??</span>
              <span style="background:#7c3aed; font-size:10px; font-weight:900; padding:4px 10px; border-radius:12px; text-transform:uppercase; letter-spacing:0.5px;">Rhythm</span>
            </div>
            <h4 style="margin:0 0 6px 0; font-size:17px; font-weight:800; color:#e0e7ff;">Stage Rhythm Blitz</h4>
            <p style="margin:0 0 16px 0; font-size:12px; color:#a5b4fc; line-height:1.5;">Tap 4 stage note lanes to the beat! Build combo streaks, hit PERFECT notes, and light up the stage.</p>
          </div>
          <button onclick="launchRhythmGame()" style="background:linear-gradient(135deg, #8b5cf6, #6d28d9); color:#fff; border:none; padding:12px; border-radius:12px; font-weight:800; font-size:14px; cursor:pointer; width:100%; box-shadow:0 4px 14px rgba(139,92,246,0.4); display:flex; align-items:center; justify-content:center; gap:8px; transition:transform 0.2s;">
            ?? Play Rhythm Blitz
          </button>
        </div>

        <!-- Game 2: Neon Brick Breaker -->
        <div style="background:linear-gradient(135deg, #064e3b, #065f46); border:1px solid #059669; border-radius:16px; padding:18px; color:#fff; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 8px 20px rgba(5,150,105,0.25);" onclick="event.stopPropagation();">
          <div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
              <span style="font-size:32px;">??</span>
              <span style="background:#10b981; font-size:10px; font-weight:900; padding:4px 10px; border-radius:12px; text-transform:uppercase; letter-spacing:0.5px;">Arcade</span>
            </div>
            <h4 style="margin:0 0 6px 0; font-size:17px; font-weight:800; color:#d1fae5;">Neon Brick Breaker</h4>
            <p style="margin:0 0 16px 0; font-size:12px; color:#6ee7b7; line-height:1.5;">Smash category bricks! Catch Multi-Ball ?, Fireball ??, and Wide Paddle ?? power-ups.</p>
          </div>
          <button onclick="launchBrickGame()" style="background:linear-gradient(135deg, #10b981, #047857); color:#fff; border:none; padding:12px; border-radius:12px; font-weight:800; font-size:14px; cursor:pointer; width:100%; box-shadow:0 4px 14px rgba(16,185,129,0.4); display:flex; align-items:center; justify-content:center; gap:8px; transition:transform 0.2s;">
            ?? Play Brick Breaker
          </button>
        </div>
      </div>
    </div>
    
    <script>
      function toggleArcadeZone() {
        const content = document.getElementById('arcade-games-content');
        const chevron = document.getElementById('arcade-chevron');
        if (content.style.display === 'none') {
          content.style.display = 'grid';
          chevron.style.transform = 'rotate(180deg)';
        } else {
          content.style.display = 'none';
          chevron.style.transform = 'rotate(0deg)';
        }
      }
    </script>
'''

# 2. Prepare Overlay HTML
with open('scratch/arcade_overlay.html', 'r', encoding='utf-8') as f:
    overlay_html = f.read()

# 3. Prepare JS HTML
with open('scratch/clean_arcade.js', 'r', encoding='utf-8') as f:
    engine_js = f.read()
    
# Construct full script tag
arcade_script = f"""
<!-- ARCADE ENGINE -->
<script>
{engine_js}
</script>
"""

# Insert Arcade Zone just before Services Section or end of dashboard view
if '<!-- SERVICES SECTION -->' in text:
    text = text.replace('<!-- SERVICES SECTION -->', arcade_html + '\n\n    <!-- SERVICES SECTION -->')
else:
    text = text.replace('</section>\n\n    <!-- DETAILED RESULTS CARD -->', '</section>\n\n' + arcade_html + '\n\n    <!-- DETAILED RESULTS CARD -->')

# Insert overlay and script at the very end of body
body_end_idx = text.find('</body>')
text = text[:body_end_idx] + overlay_html + '\n\n' + arcade_script + '\n' + text[body_end_idx:]

with open('KNSDC-Participant.html', 'w', encoding='utf-8') as f:
    f.write(text)
    
print("Successfully injected arcade zone into Participant Portal!")
