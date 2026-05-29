/**
 * Donations Section Component
 * Handles community contributions with premium design and 80G eligibility.
 */
export const renderDonations = (data) => {
  // Use data from sync engine or fallback to defaults
  const donations = [
    {id:1, name:"Annual Fast Fund", target:50000, raised:32500, icon:"🙏", col:"#FF6B35"},
    {id:2, name:"Dance Ignition Vol.7", target:100000, raised:78000, icon:"💃", col:"#7B2D8B"},
    {id:3, name:"Sports Equipment", target:30000, raised:18000, icon:"⚽", col:"#10B981"},
    {id:4, name:"Club Infrastructure", target:200000, raised:145000, icon:"🏛️", col:"#F59E0B"},
    {id:5, name:"Youth Scholarship", target:80000, raised:55000, icon:"🎓", col:"#E91E8C"},
  ];

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; margin-bottom: 50px;">
      ${donations.map(d => {
        const pct = Math.round((d.raised / d.target) * 100);
        return `
          <div class="ch" style="border-radius:24px; padding:28px; border:1px solid #e2e8f0; cursor:pointer; overflow:hidden; position:relative; background:#ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.03); display:flex; flex-direction:column; justify-content:space-between; height:100%;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div style="font-size:2.8rem;">${d.icon}</div>
                <div style="font-size:0.9rem; font-weight:800; color:${d.col};">${pct}% funded</div>
              </div>
              <h3 style="font-weight:800; font-size:1.25rem; margin-bottom:10px; color:#1E293B; font-family:'Nunito', sans-serif;">${d.name}</h3>
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#64748B; margin-bottom:12px; font-weight:600; font-family:'Nunito', sans-serif;">
                <span>Raised: <strong style="color:${d.col}">₹${d.raised.toLocaleString()}</strong></span>
                <span>Goal: <strong style="color:#1E293B">₹${d.target.toLocaleString()}</strong></span>
              </div>
              <div class="pbar" style="height:8px; background:#f1f5f9; border-radius:10px; margin-bottom:24px; overflow:hidden;">
                <div class="pfill" style="height:100%; background:${d.col}; width:${pct}%; border-radius:10px;"></div>
              </div>
            </div>
            <button class="btn" style="width:100%; justify-content:center; background:${d.col}; color:#fff; padding:14px; border-radius:16px; font-size:0.95rem; cursor:pointer; border:none; font-family:'Nunito', sans-serif; font-weight:900; display:flex; align-items:center; gap:8px; transition: opacity 0.2s;" onclick="window.KNS ? window.KNS.nextDonationStep() : (window.openDonationForm && window.openDonationForm('${d.name}', '${d.col}'))" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">❤️ Donate Now</button>
          </div>
        `;
      }).join('')}
    </div>

    <!-- 80G Callout -->
    <div style="padding: 32px; background: #d4edda; border-left: 4px solid #28a745; border-radius: 16px; animation: fadeUp 0.8s ease both;">
      <p style="color: #155724; font-weight: 700; margin-bottom: 8px; font-size: 1.1rem;">📜 80G Tax Certificate Eligibility</p>
      <p style="color: #155724; font-size: 1rem; line-height: 1.6;">Donations above ₹2000 are eligible for 80G tax deduction certificate under Section 80G of the Indian Income Tax Act. Automatic certificate generation after successful payment!</p>
    </div>
  `;
};

