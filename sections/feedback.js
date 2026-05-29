export const renderFeedback = () => {
  return `
    <div class="container">
      <div class="section-header">
        <div class="section-badge">Feedback</div>
        <h2 class="section-title">Your Voice Matters</h2>
        <p class="section-subtitle">Help us improve by sharing your thoughts, suggestions, or concerns with us.</p>
      </div>

      <div class="feedback-container">
        <div class="feedback-form">
          <form onsubmit="window.KNS.submitFeedback(event)">
            <div class="form-group">
              <label class="form-label">How happy are you with our services?</label>
              <div class="star-rating">
                <i class="fas fa-star" onclick="this.parentElement.querySelectorAll('i').forEach((s, idx) => idx <= 0 ? s.classList.add('active') : s.classList.remove('active'))"></i>
                <i class="fas fa-star" onclick="this.parentElement.querySelectorAll('i').forEach((s, idx) => idx <= 1 ? s.classList.add('active') : s.classList.remove('active'))"></i>
                <i class="fas fa-star" onclick="this.parentElement.querySelectorAll('i').forEach((s, idx) => idx <= 2 ? s.classList.add('active') : s.classList.remove('active'))"></i>
                <i class="fas fa-star" onclick="this.parentElement.querySelectorAll('i').forEach((s, idx) => idx <= 3 ? s.classList.add('active') : s.classList.remove('active'))"></i>
                <i class="fas fa-star" onclick="this.parentElement.querySelectorAll('i').forEach((s, idx) => idx <= 4 ? s.classList.add('active') : s.classList.remove('active'))"></i>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="feedback-msg">Your Message</label>
              <textarea id="feedback-msg" class="form-textarea" placeholder="Tell us more about your experience..." required></textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-input">
                <option value="General">General feedback</option>
                <option value="Event">Regarding an event</option>
                <option value="Suggestion">A new suggestion</option>
                <option value="Complaint">A complaint</option>
              </select>
            </div>
            
            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
              Submit Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
};
