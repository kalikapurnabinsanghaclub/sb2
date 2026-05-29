export const renderGallery = (data) => {
  const { galleryImages } = data;
  
  return `
    <section id="gallery" style="padding: 80px 0; background: #fff;">
      <div class="container">
        <div style="text-align: center; margin-bottom: 50px;">
          <div class="section-pill" style="background: linear-gradient(135deg, #7B2D8B, #E91E8C);">
            <span style="color: #fff; font-weight: 800; font-size: 0.88rem; letter-spacing: 1px; text-transform: uppercase;">📸 Moments Captured</span>
          </div>
          <h2 style="font-family: 'Playfair Display', serif; font-size: clamp(2rem, 5vw, 2.8rem); font-weight: 900; background: linear-gradient(135deg, #7B2D8B, #E91E8C); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Photo Gallery</h2>
          <div class="divider-bar" style="width: 80px; background: linear-gradient(90deg, #7B2D8B, #E91E8C, #FF6B35);"></div>
        </div>

        <!-- Filters -->
        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 36px;">
          <button class="tab-b galBtn on" onclick="window.KNS.filterGallery('All', this)">All</button>
          <button class="tab-b galBtn" onclick="window.KNS.filterGallery('Cultural', this)">Cultural</button>
          <button class="tab-b galBtn" onclick="window.KNS.filterGallery('Sports', this)">Sports</button>
          <button class="tab-b galBtn" onclick="window.KNS.filterGallery('Religious', this)">Religious</button>
          <button class="tab-b galBtn" onclick="window.KNS.filterGallery('Community', this)">Community</button>
        </div>

        <!-- Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;" id="gallery-grid">
          ${galleryImages.map((img, index) => `
            <div class="photo-w gallery-item" data-category="${img.category}" style="height: 220px;">
              <img src="${img.src}" alt="${img.title}" style="width: 100%; height: 100%; object-fit: cover;">
              <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); opacity: 0; transition: opacity 0.3s; display: flex; align-items: flex-end; padding: 16px;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                <div style="color: #fff;">
                  <div style="font-weight: 700; font-size: 0.9rem;">${img.title}</div>
                  <div style="font-size: 0.75rem; opacity: 0.8;">${img.category}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
};
