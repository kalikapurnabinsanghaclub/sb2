/**
 * Judge Dashboard Component
 * Interface for evaluating participants and scoring entries.
 */
export const renderJudge = (sampleData, state) => {
  return `
    <div class="container">
      <div class="db-grid">
        <div class="db-stat reveal">
          <div class="db-stat-num" style="color: var(--color-accent);">8</div>
          <div class="db-stat-lbl">Entries to Review</div>
        </div>
        <div class="db-stat reveal" style="animation-delay: 0.1s;">
          <div class="db-stat-num" style="color: var(--color-success);">5</div>
          <div class="db-stat-lbl">Scored</div>
        </div>
        <div class="db-stat reveal" style="animation-delay: 0.2s;">
          <div class="db-stat-num" style="color: var(--color-info);">3</div>
          <div class="db-stat-lbl">Pending Review</div>
        </div>
      </div>

      <div class="card reveal" style="padding: 32px; animation-delay: 0.3s;">
        <div style="margin-bottom: 24px;">
          <h3 style="font-family: var(--font-heading); margin-bottom: 8px;">Score Entries — Rabindra Jayanti</h3>
          <p style="color: var(--color-text-muted); font-size: 0.88rem;">Enter performance scores (out of 10) and qualitative remarks for each participant.</p>
        </div>

        <div class="db-table-container">
          <table class="db-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Category</th>
                <th>Performance Score /10</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sritama Das</td>
                <td>Singing</td>
                <td><input type="number" class="score-input" placeholder="—" min="0" max="10"></td>
                <td><input type="text" class="form-input" placeholder="Feedback..." style="height:38px; padding: 6px 12px; font-size: 0.85rem;"></td>
                <td><button class="btn btn-primary btn-sm" onclick="window.KNS.showToast('Score saved for Sritama', 'success')">Save</button></td>
              </tr>
              <tr>
                <td>Ananya Roy</td>
                <td>Dance</td>
                <td><input type="number" class="score-input" placeholder="—" min="0" max="10"></td>
                <td><input type="text" class="form-input" placeholder="Feedback..." style="height:38px; padding: 6px 12px; font-size: 0.85rem;"></td>
                <td><button class="btn btn-primary btn-sm" onclick="window.KNS.showToast('Score saved for Ananya', 'success')">Save</button></td>
              </tr>
              <tr>
                <td>Rohan Sen</td>
                <td>Recitation</td>
                <td><input type="number" class="score-input" placeholder="—" min="0" max="10"></td>
                <td><input type="text" class="form-input" placeholder="Feedback..." style="height:38px; padding: 6px 12px; font-size: 0.85rem;"></td>
                <td><button class="btn btn-primary btn-sm" onclick="window.KNS.showToast('Score saved for Rohan', 'success')">Save</button></td>
              </tr>
              <tr>
                <td>Bikram Paul</td>
                <td>Flute</td>
                <td><input type="number" class="score-input" placeholder="8.5" min="0" max="10" value="8.5"></td>
                <td><input type="text" class="form-input" value="Excellent breath control" style="height:38px; padding: 6px 12px; font-size: 0.85rem;"></td>
                <td><button class="btn btn-outline btn-sm" onclick="window.KNS.showToast('Score updated', 'success')">Update</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
          <button class="btn btn-ghost" onclick="window.KNS.showToast('Draft saved', 'info')">Save as Draft</button>
          <button class="btn btn-primary" onclick="window.KNS.showToast('All scores submitted successfully!', 'success')">
            <i class="fas fa-paper-plane" style="margin-right: 8px;"></i> Finalize & Submit
          </button>
        </div>
      </div>
    </div>
  `;
};
