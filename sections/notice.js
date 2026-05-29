export const renderNotice = (data) => {
  const events = data.upcomingEvents || [];
  
  return `
    ${events.map(e => `
      <div class="glass ch" style="padding: 24px; border-radius: 20px; border-top: 4px solid var(--color-primary); height: 100%; display: flex; flex-direction: column;">
        <div style="font-size: 2rem; margin-bottom: 12px;">📅</div>
        <h3 style="font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700; margin-bottom: 8px; color: #1A1A2E;">${e.name}</h3>
        <p style="color: #6b7280; font-size: 0.9rem; line-height: 1.6; margin-bottom: 16px;">${e.description || 'Join us for this exciting community event!'}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
          <span style="font-weight: 800; color: var(--color-primary); font-size: 0.85rem;">${e.date}</span>
          <button class="btn btn-o" style="padding: 6px 16px; font-size: 0.75rem; border-radius: 12px;" onclick="window.KNS.submitPublicReg('${e.id}')">Register</button>
        </div>
      </div>
    `).join('')}
  `;
};

