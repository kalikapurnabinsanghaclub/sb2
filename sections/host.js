/**
 * Host Dashboard Component
 * Event management and coordination tools for club hosts.
 */
export const renderHost = (sampleData, state) => {
  return `
    <div class="container">
      <div class="db-grid">
        <div class="db-stat reveal">
          <div class="db-stat-num text-gradient">3</div>
          <div class="db-stat-lbl">Events I'm Hosting</div>
        </div>
        <div class="db-stat reveal" style="animation-delay: 0.1s;">
          <div class="db-stat-num" style="color: var(--color-accent);">42</div>
          <div class="db-stat-lbl">New Registrations</div>
        </div>
        <div class="db-stat reveal" style="animation-delay: 0.2s;">
          <div class="db-stat-num" style="color: var(--color-success);">2</div>
          <div class="db-stat-lbl">Confirmed Venues</div>
        </div>
      </div>

      <div class="card reveal" style="padding: 32px; animation-delay: 0.3s;">
        <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-family: var(--font-heading); margin-bottom: 4px;">My Events</h3>
            <p style="color: var(--color-text-muted); font-size: 0.88rem;">Manage registrations and logistics for your assigned events.</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.KNS.showToast('Launching new event wizard...', 'info')">
            <i class="fas fa-plus"></i> Host New Event
          </button>
        </div>

        <div class="db-table-container">
          <table class="db-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Reg. Count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Rabindra Jayanti</td>
                <td>May 8, 2026</td>
                <td>Community Hall</td>
                <td>28</td>
                <td><span class="work-status in-progress">Preparing</span></td>
                <td><button class="btn btn-primary btn-sm" onclick="window.KNS.showToast('Opening event manager...', 'info')">Manage</button></td>
              </tr>
              <tr>
                <td>Annual Sports Meet</td>
                <td>Jun 15, 2026</td>
                <td>Playground</td>
                <td>124</td>
                <td><span class="work-status planned">Planned</span></td>
                <td><button class="btn btn-primary btn-sm" onclick="window.KNS.showToast('Opening event manager...', 'info')">Manage</button></td>
              </tr>
              <tr>
                <td>Art Workshop</td>
                <td>May 25, 2026</td>
                <td>Activity Center</td>
                <td>19</td>
                <td><span class="work-status completed">Confirmed</span></td>
                <td><button class="btn btn-primary btn-sm" onclick="window.KNS.showToast('Opening event manager...', 'info')">Manage</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card reveal" style="padding: 24px; margin-top: 24px; background: rgba(15, 118, 110, 0.05); border-color: rgba(15, 118, 110, 0.2); animation-delay: 0.4s;">
        <div style="display: flex; gap: 20px; align-items: center;">
          <div style="font-size: 2rem; color: var(--color-primary-light);">
            <i class="fas fa-bullhorn"></i>
          </div>
          <div style="flex: 1;">
            <h4 style="margin-bottom: 4px;">Post an Announcement</h4>
            <p style="font-size: 0.85rem; color: var(--color-text-muted);">Send a quick update to the club's Notice Board for your events.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <input type="text" class="form-input" placeholder="Type your announcement..." style="width: 300px;">
            <button class="btn btn-primary" onclick="window.KNS.showToast('Announcement posted!', 'success')">Post</button>
          </div>
        </div>
      </div>
    </div>
  `;
};
