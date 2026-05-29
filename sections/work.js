export const renderWork = (data) => {
  const { workItems } = data;
  
  return `
    <div class="container" style="padding:100px 0;">
      <div class="section-header" style="text-align:center; margin-bottom:80px;">
        <div class="section-badge" style="background:var(--color-bg-alt); border:1px solid var(--color-border); color:var(--color-primary); padding:6px 20px; border-radius:var(--radius-full); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:16px; display:inline-flex;">Our Impact</div>
        <h2 class="section-title" style="font-size:clamp(32px, 5vw, 48px); font-weight:900; color:var(--color-text); margin-bottom:20px;">Previous & Upcoming Projects</h2>
        <p class="section-subtitle" style="font-size:18px; color:var(--color-text-muted); max-width:700px; margin:0 auto;">Transparency in action — from completed milestones to our future roadmap.</p>
      </div>

      <div style="margin-bottom:80px;">
        <h3 style="font-size:24px; font-weight:800; color:var(--color-text); margin-bottom:32px; display:flex; align-items:center; gap:12px;">
          <i class="fas fa-history" style="color:var(--color-primary)"></i> Previous Achievements
        </h3>
        <div class="work-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:30px;">
          ${workItems.filter(i => i.status === 'completed').map(item => `
            <div class="card" style="padding:32px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); box-shadow:var(--shadow-md);">
              <div style="font-size:12px; color:var(--color-success); font-weight:800; text-transform:uppercase; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-check-circle"></i> Completed
              </div>
              <h4 style="font-size:18px; font-weight:700; margin-bottom:12px;">${item.title}</h4>
              <p style="color:var(--color-text-muted); font-size:14px; line-height:1.6; margin-bottom:20px;">${item.description}</p>
              <div style="font-size:12px; color:var(--color-text-dim);"><i class="far fa-calendar-alt"></i> ${item.date}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div>
        <h3 style="font-size:24px; font-weight:800; color:var(--color-text); margin-bottom:32px; display:flex; align-items:center; gap:12px;">
          <i class="fas fa-rocket" style="color:var(--color-accent)"></i> Upcoming & Ongoing
        </h3>
        <div class="work-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:30px;">
          ${workItems.filter(i => i.status !== 'completed').map(item => `
            <div class="card" style="padding:32px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); box-shadow:var(--shadow-md); border-left:4px solid var(--color-accent);">
              <div style="font-size:12px; color:var(--color-accent); font-weight:800; text-transform:uppercase; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-spinner fa-spin"></i> ${item.status === 'in-progress' ? 'In Progress' : 'Planned'}
              </div>
              <h4 style="font-size:18px; font-weight:700; margin-bottom:12px;">${item.title}</h4>
              <p style="color:var(--color-text-muted); font-size:14px; line-height:1.6; margin-bottom:20px;">${item.description}</p>
              
              <div style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:6px; font-weight:700;">
                  <span>Development Progress</span>
                  <span>${item.progress}%</span>
                </div>
                <div style="height:6px; background:var(--color-bg-alt); border-radius:99px; overflow:hidden;">
                  <div style="width:${item.progress}%; height:100%; background:var(--gradient-accent); border-radius:99px;"></div>
                </div>
              </div>
              <div style="font-size:12px; color:var(--color-text-dim);"><i class="far fa-calendar-alt"></i> Expected: ${item.date}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};
