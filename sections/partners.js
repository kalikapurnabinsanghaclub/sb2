export const renderPartners = (data) => {
  const { partners } = data;
  
  return `
    <div class="container">
      <div class="section-header">
        <div class="section-badge">Partners</div>
        <h2 class="section-title">Proudly Supported By</h2>
        <p class="section-subtitle">We collaborate with local organizations and businesses to drive meaningful impact in our community.</p>
      </div>

      <div class="partners-grid">
        ${partners.map(partner => `
          <div class="partner-card" onclick="window.KNS.showToast('Visiting ${partner.name}...', 'info')">
            <div class="partner-icon" style="background: ${partner.color}22; color: ${partner.color};">
              <i class="${partner.icon}"></i>
            </div>
            <div class="partner-name">${partner.name}</div>
          </div>
        `).join('')}
      </div>
      
      <div style="text-align: center; margin-top: 48px;">
        <p style="color: var(--color-text-dim); font-size: 0.9rem; margin-bottom: 20px;">Interested in partnering with us?</p>
        <button class="btn btn-outline" onclick="document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })">
          Become a Partner
        </button>
      </div>
    </div>
  `;
};
