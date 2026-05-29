export const renderEvents = (data) => {
  const { upcomingEvents, pastEvents, liveStage, leaderboard, publicRegs } = data;
  
  return `
    <div class="container">
      <div class="section-header" style="text-align:center; margin-bottom:80px;">
        <div class="section-badge" style="background:var(--color-bg-alt); border:1px solid var(--color-border); color:var(--color-primary); padding:6px 20px; border-radius:var(--radius-full); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:16px; display:inline-flex;">Events</div>
        <h2 class="section-title" style="font-size:clamp(32px, 5vw, 48px); font-weight:900; color:var(--color-text); margin-bottom:20px;">Club Activities</h2>
        <p class="section-subtitle" style="font-size:18px; color:var(--color-text-muted); max-width:700px; margin:0 auto;">Stay updated with our latest happenings and look back at our memorable celebrations.</p>
      </div>

      <div class="events-tabs" style="display:flex; justify-content:center; gap:16px; margin-bottom:60px;">
        <button class="tab-btn active" style="padding:12px 32px; border-radius:var(--radius-full); font-weight:700; font-size:14px; transition:all 0.3s;" onclick="this.parentElement.nextElementSibling.classList.remove('past-active'); this.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); this.classList.add('active')">Upcoming Events</button>
        <button class="tab-btn" style="padding:12px 32px; border-radius:var(--radius-full); font-weight:700; font-size:14px; transition:all 0.3s;" onclick="this.parentElement.nextElementSibling.classList.add('past-active'); this.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); this.classList.add('active')">Past Events</button>
      </div>

      <div class="events-container-wrapper">
        <style>
          .events-container-wrapper.past-active .upcoming-grid { display: none; }
          .events-container-wrapper:not(.past-active) .past-grid { display: none; }
          .upcoming-grid, .past-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; animation: fadeIn 0.4s ease; }
          
          /* === PUBLIC WIDGET STYLES === */
          .ev-widget { margin-top:16px; border-radius:14px; padding:16px; animation: widgetSlide 0.4s ease-out; }
          @keyframes widgetSlide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
          
          .ev-widget-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
          .ev-widget-badge { display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; }
          
          /* Registration Widget */
          .reg-widget { background: linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.03)); border: 1px solid rgba(16,185,129,0.2); }
          .reg-widget .ev-widget-badge { color: #059669; }
          .reg-widget input { display:block; width:100%; padding:10px 14px; border:1px solid rgba(5,150,105,0.2); border-radius:10px; font-size:13px; background:rgba(255,255,255,0.8); color:var(--text-main); margin-bottom:8px; outline:none; font-family: inherit; }
          .reg-widget input:focus { border-color:#059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
          .reg-widget .reg-submit { width:100%; padding:11px; border:none; border-radius:10px; background:linear-gradient(135deg,#059669,#10b981); color:#fff; font-weight:700; font-size:13px; cursor:pointer; letter-spacing:0.5px; transition:all 0.2s; }
          .reg-widget .reg-submit:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(5,150,105,0.3); }
          
          /* Stage Widget */
          .stage-widget { background: linear-gradient(135deg, rgba(37,99,235,0.06), rgba(59,130,246,0.03)); border: 1px solid rgba(37,99,235,0.2); }
          .stage-widget .ev-widget-badge { color: #2563eb; }
          .live-dot-pulse { width:8px; height:8px; background:#2563eb; border-radius:50%; display:inline-block; animation: dotPulse 1.5s infinite; box-shadow: 0 0 8px rgba(37,99,235,0.5); }
          @keyframes dotPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:0.5} }
          
          /* Result Widget */
          .result-widget { background: linear-gradient(135deg, rgba(217,119,6,0.06), rgba(245,158,11,0.03)); border: 1px solid rgba(217,119,6,0.2); }
          .result-widget .ev-widget-badge { color: #d97706; }
          .result-row { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:10px; margin-bottom:4px; transition: background 0.2s; }
          .result-row:hover { background: rgba(217,119,6,0.06); }
          .result-rank { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:11px; flex-shrink:0; }
          .result-bar { height:4px; border-radius:99px; background:rgba(0,0,0,0.06); overflow:hidden; margin-top:3px; }
          .result-bar-fill { height:100%; border-radius:99px; background: linear-gradient(90deg, #d97706, #f59e0b); transition: width 0.8s ease; }
        </style>
        
        <div class="upcoming-grid">
          ${upcomingEvents.map(event => {
            const hasAnyWidget = event.publicReg || event.stagePreview || event.resultPublic;
            const stageData = liveStage && liveStage[event.id];
            const resultData = leaderboard && leaderboard[event.id];
            const regs = publicRegs && publicRegs[event.id];
            
            return `
            <div class="card event-card">
              <div class="card-img-wrap">
                <span class="event-category">${event.category}</span>
                ${hasAnyWidget ? '<span style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.6);color:#fff;padding:3px 10px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:1px;backdrop-filter:blur(4px);">LIVE EVENT</span>' : ''}
                <img src="${event.image}" class="card-img" alt="${event.title}">
              </div>
              <div class="card-body">
                <div class="event-date">
                  <i class="far fa-calendar-alt"></i> ${event.date} | <i class="far fa-clock"></i> ${event.time}
                </div>
                <h3 class="card-title">${event.title}</h3>
                <p class="card-text">${event.description}</p>
                <div class="event-venue">
                  <i class="fas fa-map-marker-alt"></i> ${event.venue}
                </div>

                ${event.publicReg ? renderRegWidget(event, regs) : ''}
                ${event.stagePreview ? renderStageWidget(event, stageData) : ''}
                ${event.resultPublic ? renderResultWidget(event, resultData) : ''}
              </div>
            </div>
          `}).join('')}
        </div>

        <div class="past-grid">
           ${pastEvents.map(event => `
            <div class="card event-card">
              <div class="card-img-wrap">
                <span class="event-category">${event.category}</span>
                <img src="${event.image}" class="card-img" alt="${event.title}">
              </div>
              <div class="card-body">
                <div class="event-date">
                  <i class="far fa-calendar-alt"></i> ${event.date}
                </div>
                <h3 class="card-title">${event.title}</h3>
                <p class="card-text">${event.description}</p>
                <div class="event-highlights">
                  ${event.highlights.map(h => `<span>${h}</span>`).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};

// ═══════════════════════════════════════
// WIDGET: Public Registration Form
// ═══════════════════════════════════════
function renderRegWidget(event, regs) {
  const regCount = regs ? regs.length : 0;
  return `
    <div class="ev-widget reg-widget" id="reg-form-${event.id}">
      <div class="ev-widget-header">
        <div class="ev-widget-badge">
          <span>📝</span> OPEN REGISTRATION
        </div>
        ${regCount > 0 ? `<span style="font-size:10px;color:#059669;font-weight:700;">${regCount} registered</span>` : ''}
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
        <input type="text" id="reg-name-${event.id}" placeholder="Full Name *" />
        <input type="text" id="reg-phone-${event.id}" placeholder="Phone Number *" />
      </div>
      <input type="number" id="reg-age-${event.id}" placeholder="Age (optional)" style="margin-bottom:12px;" />
      <button class="reg-submit" onclick="window.KNS.submitPublicReg(${event.id})">
        <i class="fas fa-paper-plane"></i> &nbsp; Submit Registration
      </button>
    </div>
  `;
}

// ═══════════════════════════════════════
// WIDGET: Live Stage Preview
// ═══════════════════════════════════════
function renderStageWidget(event, stageData) {
  return `
    <div class="ev-widget stage-widget">
      <div class="ev-widget-header">
        <div class="ev-widget-badge">
          <span class="live-dot-pulse"></span> LIVE STAGE
        </div>
        ${stageData ? `<span style="font-size:9px;color:var(--text-muted);font-family:var(--font-mono);">${new Date(stageData.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>` : ''}
      </div>
      ${stageData && stageData.onStage ? `
        <div style="margin-bottom:12px; padding-bottom:12px; border-bottom:1px dashed rgba(37,99,235,0.15);">
          <div style="font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:4px;">ON STAGE NOW</div>
          <div style="font-size:20px; font-weight:800; color:var(--text-main); letter-spacing:0.3px;">${stageData.onStage.name}</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">${stageData.onStage.id} • ${stageData.onStage.round?.toUpperCase() || ''}</div>
        </div>
      ` : '<div style="font-size:13px;color:var(--text-muted);text-align:center;padding:14px;">🎤 Stage is being prepared...</div>'}
      
      ${stageData && stageData.upcoming && stageData.upcoming.length > 0 ? `
        <div>
          <div style="font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:8px;">NEXT UP</div>
          <div style="display:flex; flex-direction:column; gap:5px;">
            ${stageData.upcoming.map((u, i) => `
              <div style="display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:8px; background:rgba(37,99,235,0.04);">
                <span style="width:20px;height:20px;border-radius:50%;background:rgba(37,99,235,0.1);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#2563eb;">${i+1}</span>
                <span style="font-size:13px;font-weight:600;color:var(--text-main);">${u.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// ═══════════════════════════════════════
// WIDGET: Public Results / Leaderboard
// ═══════════════════════════════════════
function renderResultWidget(event, resultData) {
  const results = resultData && resultData.data ? resultData.data : [];
  const maxScore = results.length > 0 ? results[0].total : 1;
  
  return `
    <div class="ev-widget result-widget">
      <div class="ev-widget-header">
        <div class="ev-widget-badge">
          <span>🏆</span> LIVE RESULTS
        </div>
        ${resultData ? `<span style="font-size:9px;color:var(--text-muted);font-family:var(--font-mono);">${new Date(resultData.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>` : ''}
      </div>
      ${results.length > 0 ? `
        <div>
          ${results.slice(0, 5).map((r, i) => {
            const pct = maxScore > 0 ? Math.round(r.total / maxScore * 100) : 0;
            const isTop3 = i < 3;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
            const rankBg = i === 0 ? 'linear-gradient(135deg,#d97706,#f59e0b)' : i === 1 ? 'linear-gradient(135deg,#64748b,#94a3b8)' : i === 2 ? 'linear-gradient(135deg,#b45309,#d97706)' : 'rgba(0,0,0,0.06)';
            const rankColor = isTop3 ? '#fff' : 'var(--text-muted)';
            return `
              <div class="result-row">
                <div class="result-rank" style="background:${rankBg};color:${rankColor}">${isTop3 ? medal : r.rank}</div>
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-weight:700;font-size:13px;color:var(--text-main);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.name}</span>
                    <span style="font-weight:800;font-size:14px;color:#d97706;flex-shrink:0;margin-left:8px;">${r.total}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;">
                    <span style="font-size:10px;color:var(--text-muted);">${r.category}</span>
                    <span style="font-size:9px;color:var(--text-muted);text-transform:uppercase;">${r.round}</span>
                  </div>
                  <div class="result-bar"><div class="result-bar-fill" style="width:${pct}%"></div></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px;">📊 Results will appear here when available</div>'}
    </div>
  `;
}
