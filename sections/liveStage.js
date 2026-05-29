export const renderLiveStage = (data) => {
  const { participants, currentOnStage, switchStates, categories, upcomingEvents } = data;
  
  const isStageVisible = switchStates && (switchStates['stage-preview'] || switchStates['stagePreview']);
  const isResultVisible = switchStates && (switchStates['result-public'] || switchStates['resultPublic']);
  
  if (!isStageVisible && !isResultVisible) return '';

  const p = participants?.find(x => x.id === currentOnStage);
  const cat = p ? categories?.find(c => c.id === p.catId) : null;

  const calculateAvg = (player) => {
    const scores = player.scores || {};
    const all = Object.values(scores).flatMap(j => Object.values(j));
    return all.length ? (all.reduce((a,b)=>a+b,0)/all.length).toFixed(1) : 0;
  };

  const leaderboard = participants
    .filter(p => p.stageStatus === 'done')
    .map(p => ({ ...p, avg: parseFloat(calculateAvg(p)) }))
    .filter(p => p.avg > 0)
    .sort((a,b) => b.avg - a.avg);

  const queue = participants
    .filter(p => p.stageStatus === 'waiting')
    .slice(0, 3);

  return `
    <div class="glass" style="border-radius: 24px; overflow: hidden; border: 1px solid rgba(255, 107, 53, 0.3);">
      <!-- Live Event Header -->
      <div style="background: linear-gradient(135deg, #FF6B35, #7B2D8B); padding: 26px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.18); color: #fff; padding: 4px 14px; border-radius: 20px; margin-bottom: 10px; font-size: 0.78rem; font-weight: 800; border: 1px solid rgba(255, 255, 255, 0.35);">
            <span class="live-dot" style="background: #fff;"></span> CULTURAL PERFORMANCE — LIVE
          </div>
          <h3 style="font-family: 'Playfair Display', serif; font-size: 2rem; color: #fff; font-weight: 900;">${p ? p.name : 'Waiting for Start'}</h3>
          <p style="color: rgba(255, 255, 255, 0.78); margin-top: 6px; font-size: 0.9rem;">📍 Main Stage · Kalikapur Nabin Sangha</p>
        </div>
        <div style="background: rgba(255, 255, 255, 0.14); border-radius: 14px; padding: 14px 22px; border: 1px solid rgba(255, 255, 255, 0.28); text-align: center;">
          <div style="color: rgba(255, 255, 255, 0.65); font-size: 0.75rem; margin-bottom: 4px;">Status</div>
          <div style="color: #FFD23F; font-weight: 800; font-size: 0.95rem;">🎭 ${p ? 'Performing Now' : 'Intermission'}</div>
        </div>
      </div>

          <!-- Live Event Body -->
          <div style="padding: 32px;">
            ${isStageVisible ? `
            <div style="background: linear-gradient(180deg, #1A237E 0%, #7B2D8B 55%, #1A237E 100%); border-radius: 16px; padding: 40px 20px; text-align: center; margin-bottom: 32px; position: relative; overflow: hidden; min-height: 180px;">
              <div style="position: absolute; top: -30px; left: 25%; width: 180px; height: 220px; background: radial-gradient(ellipse at top, rgba(255, 210, 63, 0.2) 0%, transparent 70%); animation: stageLight 2s ease-in-out infinite; transform: translateX(-50%); pointer-events: none;"></div>
              <div style="position: absolute; top: -30px; left: 75%; width: 180px; height: 220px; background: radial-gradient(ellipse at top, rgba(255, 210, 63, 0.2) 0%, transparent 70%); animation: stageLight 3s ease-in-out infinite; animation-delay: 0.8s; transform: translateX(-50%); pointer-events: none;"></div>
              <div style="position: relative; z-index: 1;">
                <div style="font-size: 2.8rem; margin-bottom: 8px;">🎭</div>
                <h4 style="color: #FFD23F; font-family: 'Playfair Display', serif; font-size: 1.5rem; margin-bottom: 8px;">🎬 ON STAGE</h4>
                <div class="performer-card-live" style="background: var(--gradient-gold); color: white; padding: 24px; border-radius: 16px; margin: 0 auto; max-width: 500px; animation: fadeUp 0.6s ease 0.2s backwards;">
                  <div class="performer-label-live" style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; opacity: 0.8; margin-bottom: 8px;">Now Performing</div>
                  <div class="performer-name-live" style="font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; margin-bottom: 8px;">${p ? p.name : 'Readying...'}</div>
                  <div class="performer-category-live" style="font-size: 1.1rem; font-weight: 600; opacity: 0.9;">${cat ? cat.name : 'Main Event'}</div>
                </div>
              </div>
            </div>
            ` : ''}

            ${queue.length > 0 ? `
            <div style="background: linear-gradient(135deg, #00BFA5, #1A237E); color: white; padding: 30px; border-radius: 16px; margin-bottom: 32px;">
              <h3 style="font-family: 'Cinzel Decorative', cursive; font-size: 1.3rem; margin-bottom: 20px; font-weight: 700;">📋 Coming Next</h3>
              <div>
                ${queue.map((u, i) => `
                  <div class="queue-item" style="padding: 12px 16px; background: rgba(255, 255, 255, 0.1); border-left: 3px solid #FFD23F; margin-bottom: 12px; border-radius: 8px; transition: all 0.3s ease; display: flex; align-items: center;">
                    <span class="queue-number" style="font-weight: 800; color: #FFD23F; margin-right: 12px; width: 24px;">${i+1}</span>
                    <span class="queue-name" style="font-weight: 600; font-size: 1.1rem;">${u.name}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}

            ${isResultVisible ? `
            <div>
              <h3 style="font-family: 'Cinzel Decorative', cursive; font-size: 1.3rem; margin-bottom: 20px; font-weight: 700; color: #1A1A2E;">📊 Live Standings</h3>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${leaderboard.slice(0, 5).map((r, i) => `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: #f9fafb; border-radius: 12px; border-left: 4px solid ${i === 0 ? '#FFD23F' : '#e5e7eb'};">
                    <div style="display: flex; align-items: center; gap: 16px;">
                      <span style="font-weight: 800; color: ${i === 0 ? '#FF6B35' : '#9ca3af'}; font-size: 1.2rem;">#${i+1}</span>
                      <div>
                        <div style="font-weight: 700; font-size: 1.1rem; color: #1A1A2E;">${r.name}</div>
                        <div style="font-size: 0.85rem; color: #6b7280;">Average Score</div>
                      </div>
                    </div>
                    <div style="font-family: 'Playfair Display', serif; font-weight: 900; font-size: 1.8rem; color: #1A237E;">${r.avg}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    </section>
  `;
};
