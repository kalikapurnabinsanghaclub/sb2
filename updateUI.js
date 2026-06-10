const fs = require('fs');

let content = fs.readFileSync('KNSDC-Host.html', 'utf8');

// The new stage hero HTML (Lines 1018 - 1031)
const oldStageHeroRegex = /<div class="stage-hero">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>`/m;
const newStageHero = `<div class="stage-hero" style="background: linear-gradient(135deg, rgba(14,165,233,0.05) 0%, rgba(56,189,248,0.15) 100%); border: 2px solid rgba(56,189,248,0.4); border-radius: 28px; padding: 36px; box-shadow: 0 20px 50px rgba(14,165,233,0.15); animation: pulseStage 3s infinite ease-in-out; position: relative; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
          <div style="position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; background: #eab308; filter: blur(90px); opacity: 0.25; border-radius: 50%; pointer-events: none;"></div>
          <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap; position: relative; z-index: 1;">
            <div class="performer-avatar" style="width: 80px; height: 80px; font-size: 40px; background: linear-gradient(135deg, #0ea5e9, #38bdf8); box-shadow: 0 12px 30px rgba(14,165,233,0.4); border: 4px solid #fff; animation: floatAvatar 3.5s ease-in-out infinite;">💃</div>
            <div style="flex:1">
              <div style="font-size:10px; font-weight:900; color:#0ea5e9; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px; display:inline-flex; align-items:center; gap:6px;"><span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#0ea5e9; animation: blink 1s infinite;"></span> LIVE ON STAGE</div>
              <div style="font-family:var(--fh);font-size:32px;font-weight:900;color:#0f172a; line-height:1.2; letter-spacing: -0.5px;">\${onStage.name}</div>
              <div style="font-size:13px;color:var(--text-muted); font-weight:700; margin-top:4px; font-family: monospace;">ID: \${onStage.id}</div>
            </div>
            <div style="display:flex;gap:14px">
              <button class="st-btn" onclick="dropToQueue('\${onStage.id}')" style="background: linear-gradient(135deg, #eab308, #fde047); color:#422006; padding:14px 28px; border-radius:16px; border:none; cursor:pointer; font-weight:800; font-size:14px; box-shadow: 0 10px 25px rgba(234,179,8,0.35); transition: all 0.3s; display:flex; align-items:center; gap:8px;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 15px 35px rgba(234,179,8,0.45)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 25px rgba(234,179,8,0.35)'">⬇ Drop to Queue</button>
              <button class="st-btn" onclick="markDone('\${onStage.id}')" style="background: linear-gradient(135deg, #84cc16, #a3e635); color:#14532d; padding:14px 28px; border-radius:16px; border:none; cursor:pointer; font-weight:800; font-size:14px; box-shadow: 0 10px 25px rgba(132,204,22,0.35); transition: all 0.3s; display:flex; align-items:center; gap:8px;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 15px 35px rgba(132,204,22,0.45)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 25px rgba(132,204,22,0.35)'">✓ Complete</button>
            </div>
          </div>
        </div>\``;
        
content = content.replace(oldStageHeroRegex, newStageHero);

// The new queue item HTML (Lines 1040 - 1054)
const oldQueueRegex = /<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;background:white;border:1px solid var\(--bd\);margin-bottom:8px">[\s\S]*?<\/div>`/m;
const newQueue = `<div style="display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:16px;background:rgba(255,255,255,0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border:1px solid rgba(255,255,255,0.6); margin-bottom:12px; box-shadow: 0 4px 15px rgba(15,23,42,0.03); transition: all 0.3s ease; animation: slideUpQueue 0.4s ease-out backwards; animation-delay: \${idx * 0.05}s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 25px rgba(15,23,42,0.06)'; this.style.borderColor='rgba(14,165,233,0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(15,23,42,0.03)'; this.style.borderColor='rgba(255,255,255,0.6)'">
          <div style="font-family:var(--fh);font-size:20px;font-weight:900;color:#0ea5e9;width:36px;height:36px; border-radius:10px; background:rgba(14,165,233,0.1); display:flex; align-items:center; justify-content:center;">#\${idx + 1}</div>
          <div style="flex:1">
            <div style="font-size:15px;font-weight:800; color:#0f172a;">\${p.name}</div>
            <div style="font-size:11px;color:var(--text-muted); font-family: monospace; margin-top:2px; font-weight: 600;">ID: \${p.id}</div>
          </div>
          <!-- Position Up/Down Reorder Actions -->
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-ghost" onclick="moveQueueItem('\${p.id}','up')" \${idx === 0 ? 'disabled' : ''} style="padding:6px 10px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid rgba(0,0,0,0.08);background:#fff;font-weight:700;\${idx === 0 ? 'opacity:0.3;cursor:not-allowed;' : 'box-shadow: 0 2px 5px rgba(0,0,0,0.02);'}" onmouseover="\${idx === 0 ? '' : 'this.style.background=\\'#f8fafc\\''}" onmouseout="this.style.background='#fff'">▲</button>
            <button class="btn btn-sm btn-ghost" onclick="moveQueueItem('\${p.id}','down')" \${idx === upcoming.length - 1 ? 'disabled' : ''} style="padding:6px 10px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid rgba(0,0,0,0.08);background:#fff;font-weight:700;\${idx === upcoming.length - 1 ? 'opacity:0.3;cursor:not-allowed;' : 'box-shadow: 0 2px 5px rgba(0,0,0,0.02);'}" onmouseover="\${idx === upcoming.length - 1 ? '' : 'this.style.background=\\'#f8fafc\\''}" onmouseout="this.style.background='#fff'">▼</button>
          </div>
          <!-- Push to Stage -->
          <button onclick="pushToStage('\${p.id}')" style="padding:10px 20px;border-radius:12px;background:linear-gradient(135deg, #0ea5e9, #38bdf8);color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:800; box-shadow: 0 4px 15px rgba(14,165,233,0.3); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(14,165,233,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(14,165,233,0.3)'">▶ Push</button>
        </div>\``;
        
content = content.replace(oldQueueRegex, newQueue);

// Add missing animations to CSS
const animationsCSS = `
  @keyframes floatAvatar {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-5px) rotate(3deg); }
  }
  @keyframes pulseStage {
    0%, 100% { box-shadow: 0 16px 40px rgba(14,165,233,0.15); border-color: rgba(56,189,248,0.3); }
    50% { box-shadow: 0 20px 50px rgba(14,165,233,0.25); border-color: rgba(56,189,248,0.6); }
  }
  @keyframes slideUpQueue {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
`;
content = content.replace('</style>', animationsCSS);

fs.writeFileSync('KNSDC-Host.html', content);
console.log('Update successful');
