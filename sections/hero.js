export const renderHero = (data) => {
  return `
    <section id="hero" style="min-height: 100vh; position: relative; overflow: hidden; padding: 0; display: flex; align-items: center; justify-content: center;">
      <!-- Hero Content -->
      <div style="position: relative; z-index: 1; text-align: center; padding: 110px 20px 50px; max-width: 920px;">
        <div style="display: inline-block; background: rgba(255, 210, 63, 0.2); border: 1px solid rgba(255, 210, 63, 0.45); border-radius: 30px; padding: 8px 24px; margin-bottom: 24px; animation: fadeUp 0.8s ease both;">
          <span style="color: #FFD23F; font-weight: 800; font-size: 0.9rem; letter-spacing: 2px;">✦ EST. 1985  •  KALIKAPUR, South 24 Pgs ✦</span>
        </div>

        <h1 style="font-family: 'Cinzel Decorative', cursive; font-size: clamp(2.5rem, 8vw, 4.5rem); color: #fff; font-weight: 900; margin-bottom: 16px; line-height: 1.2; animation: fadeUp 0.8s 0.2s ease both; text-shadow: 0 4px 20px rgba(0,0,0,0.3);">Celebrate Community, Embrace Culture</h1>

        <p style="font-size: 1.2rem; color: rgba(255, 255, 255, 0.85); line-height: 1.8; margin-bottom: 36px; animation: fadeUp 0.8s 0.4s ease both;">
          Four decades of cultural excellence, sports glory & youth empowerment in South 24 Pgs. Dance · Sports · Celebration — We Live It All!
        </p>
            <div style="font-size:13px; color:var(--color-text-dim); text-transform:uppercase; letter-spacing:1px; margin-top:8px;">Annual Events</div>
          </div>
          <div>
            <div style="font-size:36px; font-weight:900; color:var(--color-text); line-height:1;">40 yrs</div>
            <div style="font-size:13px; color:var(--color-text-dim); text-transform:uppercase; letter-spacing:1px; margin-top:8px;">Rich Legacy</div>
          </div>
        </div>
      </div>
      
      <div class="hero-visual" style="position:absolute; right:-100px; top:50%; transform:translateY(-50%); width:800px; height:800px; background:radial-gradient(circle, var(--color-primary-glow), transparent 70%); border-radius:50%; z-index:1; opacity:0.6;">
        <div style="position:absolute; inset:20%; border:2px dashed var(--color-border); border-radius:50%; animation: spin 60s linear infinite;"></div>
      </div>
    </div>
    <style>
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>
  `;
};
