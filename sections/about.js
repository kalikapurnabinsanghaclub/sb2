export const renderAbout = (data) => {
  const { teamMembers } = data;
  
  return `
    <div class="container" style="padding:100px 0;">
      <div class="section-header" style="text-align:center; margin-bottom:80px;">
        <div class="section-badge" style="background:var(--color-bg-alt); border:1px solid var(--color-border); color:var(--color-primary); padding:6px 20px; border-radius:var(--radius-full); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin-bottom:16px; display:inline-flex;">Our Story</div>
        <h2 class="section-title" style="font-size:clamp(32px, 5vw, 48px); font-weight:900; color:var(--color-text); margin-bottom:20px;">Kalikapur Nabin Sangha</h2>
        <p class="section-subtitle" style="font-size:18px; color:var(--color-text-muted); max-width:700px; margin:0 auto;">Rooted in tradition, powered by unity, and dedicated to the welfare of our community.</p>
      </div>

      <!-- Moto, Vision, Process Cards -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:30px; margin-bottom:100px;">
        <div class="card" style="padding:40px; text-align:center; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); box-shadow:var(--shadow-md); transition:transform 0.3s;" onmouseover="this.style.transform='translateY(-10px)'" onmouseout="this.style.transform='translateY(0)'">
          <div style="width:70px; height:70px; background:var(--color-bg-alt); color:var(--color-primary); border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 24px;"><i class="fas fa-bullseye"></i></div>
          <h3 style="font-weight:800; margin-bottom:16px; color:var(--color-text);">Our Moto</h3>
          <p style="color:var(--color-text-muted); font-size:15px; line-height:1.6;">"Unity for Progress" — We believe that together, we can overcome any challenge and build a brighter future for all.</p>
        </div>
        <div class="card" style="padding:40px; text-align:center; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); box-shadow:var(--shadow-md); transition:transform 0.3s;" onmouseover="this.style.transform='translateY(-10px)'" onmouseout="this.style.transform='translateY(0)'">
          <div style="width:70px; height:70px; background:var(--color-bg-alt); color:var(--color-accent); border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 24px;"><i class="fas fa-eye"></i></div>
          <h3 style="font-weight:800; margin-bottom:16px; color:var(--color-text);">Our Vision</h3>
          <p style="color:var(--color-text-muted); font-size:15px; line-height:1.6;">To become a model community hub where every individual has the opportunity to thrive and contribute.</p>
        </div>
        <div class="card" style="padding:40px; text-align:center; background:var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-lg); box-shadow:var(--shadow-md); transition:transform 0.3s;" onmouseover="this.style.transform='translateY(-10px)'" onmouseout="this.style.transform='translateY(0)'">
          <div style="width:70px; height:70px; background:var(--color-bg-alt); color:var(--color-success); border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 24px;"><i class="fas fa-cogs"></i></div>
          <h3 style="font-weight:800; margin-bottom:16px; color:var(--color-text);">Working Process</h3>
          <p style="color:var(--color-text-muted); font-size:15px; line-height:1.6;">Transparent, democratic, and community-driven. We listen to your needs and act with purpose and integrity.</p>
        </div>
      </div>

      <div class="about-grid">
        <div class="about-content">
          <h3 style="color:var(--color-primary); font-weight:800; margin-bottom:24px; font-size:24px;">Our Mission</h3>
          <p style="color:var(--color-text-muted); line-height:1.8; margin-bottom:24px;">
            We strive to create an inclusive space where culture meets community action. Our goal is to preserve our rich heritage while embracing modern development for the welfare of all Kalikapur residents.
          </p>
          <div class="about-features" style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div style="display:flex; align-items:center; gap:12px; font-weight:600; font-size:14px; color:var(--color-text);">
              <i class="fas fa-check-circle" style="color:var(--color-success)"></i> Cultural Preservation
            </div>
            <div style="display:flex; align-items:center; gap:12px; font-weight:600; font-size:14px; color:var(--color-text);">
              <i class="fas fa-check-circle" style="color:var(--color-success)"></i> Social Responsibility
            </div>
            <div style="display:flex; align-items:center; gap:12px; font-weight:600; font-size:14px; color:var(--color-text);">
              <i class="fas fa-check-circle" style="color:var(--color-success)"></i> Youth Engagement
            </div>
            <div style="display:flex; align-items:center; gap:12px; font-weight:600; font-size:14px; color:var(--color-text);">
              <i class="fas fa-check-circle" style="color:var(--color-success)"></i> Sports Development
            </div>
          </div>
    <section id="about" style="padding: 100px 0; background: linear-gradient(135deg, #FFF8F0 0%, #F3E8FF 50%, #E0F7FA 100%);">
      <div class="container">
        <div style="text-align: center; margin-bottom: 60px;">
          <div class="section-pill" style="background: linear-gradient(135deg, #00BFA5, #1A237E);">
            <span style="color: #fff; font-weight: 800; font-size: 0.88rem; letter-spacing: 1px; text-transform: uppercase;">🏛️ Who We Are</span>
          </div>
          <h2 style="font-family: 'Playfair Display', serif; font-size: clamp(2.5rem, 5vw, 3.5rem); font-weight: 900; background: linear-gradient(135deg, #00BFA5, #1A237E); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Our 40 Year Legacy</h2>
          <div class="divider-bar" style="width: 80px; background: linear-gradient(90deg, #00BFA5, #1A237E);"></div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 60px; align-items: center; margin-bottom: 80px;">
          <div>
            <h3 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; margin-bottom: 24px; line-height: 1.3;">
              Building Community,<br/>
              <span style="background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Celebrating Culture</span>
            </h3>
            <p style="color: #4b5563; line-height: 1.9; font-size: 1.05rem; margin-bottom: 20px;">Kalikapur Nabin Sangha DC (KNSDC) is one of South 24 Pgs's most vibrant community organisations, founded in 1985 with a vision to unite youth through culture, sports and social welfare.</p>
            <p style="color: #4b5563; line-height: 1.9; font-size: 1.05rem; margin-bottom: 32px;">Over four decades we've grown from a small neighbourhood club to a cornerstone of the Kalikapur community.</p>
            <div style="display: flex; gap: 14px; flex-wrap: wrap;">
              <div class="glass" style="display: flex; align-items: center; gap: 10px; border-radius: 14px; padding: 12px 20px;"><span>🎯</span><span style="font-weight: 700;">Our Mission</span></div>
              <div class="glass" style="display: flex; align-items: center; gap: 10px; border-radius: 14px; padding: 12px 20px;"><span>👁️</span><span style="font-weight: 700;">Our Vision</span></div>
              <div class="glass" style="display: flex; align-items: center; gap: 10px; border-radius: 14px; padding: 12px 20px;"><span>💎</span><span style="font-weight: 700;">Our Values</span></div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            ${aboutItems.map(item => `
              <div class="glass ch" style="padding: 24px; border-radius: 20px; text-align: center; border-bottom: 4px solid ${item.col};">
                <div style="font-size: 2rem; margin-bottom: 12px;">${item.icon}</div>
                <h4 style="font-weight: 800; font-size: 0.9rem; text-transform: uppercase; margin-bottom: 8px;">${item.title}</h4>
                <p style="font-size: 0.8rem; color: #6b7280; line-height: 1.5;">${item.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="text-align: center;">
          <h3 style="font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; margin-bottom: 40px;">Our Leadership</h3>
          <div style="display: flex; gap: 24px; justify-content: center; flex-wrap: wrap;">
            ${leadership.map(l => `
              <div class="glass ch" style="padding: 24px; border-radius: 24px; min-width: 180px; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 12px; animation: float 3s ease-in-out infinite;">${l.emoji}</div>
                <div style="font-weight: 800; font-size: 1.1rem; margin-bottom: 4px;">${l.name}</div>
                <div style="color: var(--color-primary); font-size: 0.85rem; font-weight: 700; text-transform: uppercase;">${l.role}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  `;
};
