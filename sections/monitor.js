/**
 * Monitor Dashboard Component
 * Overview of club metrics and real-time activity tracking.
 */
export const renderMonitor = (sampleData, state) => {
  return `
    <div class="container">
      <div class="db-grid">
        <div class="db-stat reveal">
          <div class="db-stat-num text-gradient">24</div>
          <div class="db-stat-lbl">Active Members Today</div>
        </div>
        <div class="db-stat reveal" style="animation-delay: 0.1s;">
          <div class="db-stat-num" style="color: var(--color-accent);">3</div>
          <div class="db-stat-lbl">Upcoming Events</div>
        </div>
        <div class="db-stat reveal" style="animation-delay: 0.2s;">
          <div class="db-stat-num" style="color: var(--color-success);">5</div>
          <div class="db-stat-lbl">Ongoing Projects</div>
        </div>
        <div class="db-stat reveal" style="animation-delay: 0.3s;">
          <div class="db-stat-num" style="color: var(--color-info);">₹42,000</div>
          <div class="db-stat-lbl">Donations This Month</div>
        </div>
      </div>

      <div class="card reveal" style="padding: 32px; animation-delay: 0.4s;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h3 style="font-family: var(--font-heading);">Activity Monitor</h3>
          <button class="btn btn-ghost btn-sm" onclick="window.KNS.showToast('Refreshing activity data...', 'info')">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
        
        <div class="db-table-container">
          <table class="db-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Check-In</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Amit Roy</td>
                <td>Secretary</td>
                <td>10:02 AM</td>
                <td><span class="work-status completed">Active</span></td>
                <td><button class="btn btn-ghost btn-sm">Mute</button></td>
              </tr>
              <tr>
                <td>Priya Banerjee</td>
                <td>Treasurer</td>
                <td>10:15 AM</td>
                <td><span class="work-status completed">Active</span></td>
                <td><button class="btn btn-ghost btn-sm">Mute</button></td>
              </tr>
              <tr>
                <td>Suman Chatterjee</td>
                <td>Sports Secretary</td>
                <td>11:00 AM</td>
                <td><span class="work-status in-progress">Late</span></td>
                <td><button class="btn btn-ghost btn-sm">Notify</button></td>
              </tr>
              <tr>
                <td>Rajesh Ghosh</td>
                <td>Cultural Sec.</td>
                <td>—</td>
                <td><span class="work-status planned">Absent</span></td>
                <td><button class="btn btn-ghost btn-sm">Call</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
        <div class="card reveal" style="padding: 24px; animation-delay: 0.5s;">
          <h4 style="margin-bottom: 16px;">System Health</h4>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
              <span>Server Latency</span>
              <span style="color: var(--color-success);">Optimized (24ms)</span>
            </div>
            <div class="progress-bar"><div class="progress-bar-fill completed" style="width: 98%;"></div></div>
            
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-top: 8px;">
              <span>Database Sync</span>
              <span style="color: var(--color-success);">Synchronized</span>
            </div>
            <div class="progress-bar"><div class="progress-bar-fill completed" style="width: 100%;"></div></div>
          </div>
        </div>

        <div class="card reveal" style="padding: 24px; animation-delay: 0.6s;">
          <h4 style="margin-bottom: 16px;">Recent Feedback</h4>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.85rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong>John Doe</strong>
                <span style="color: var(--color-accent);"><i class="fas fa-star"></i> 5.0</span>
              </div>
              <p style="color: var(--color-text-muted); font-size: 0.8rem;">The Rabindra Jayanti preparations look great!</p>
            </div>
            <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.85rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong>Anita Roy</strong>
                <span style="color: var(--color-accent);"><i class="fas fa-star"></i> 4.5</span>
              </div>
              <p style="color: var(--color-text-muted); font-size: 0.8rem;">Would love more sports activities for kids.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
