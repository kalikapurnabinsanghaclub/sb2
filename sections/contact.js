export const renderContact = () => {
  return `
    <div class="container">
      <div class="section-header">
        <div class="section-badge">Connect</div>
        <h2 class="section-title">Get in Touch</h2>
        <p class="section-subtitle">Have questions? We'd love to hear from you. Reach out to us using any of the methods below.</p>
      </div>

      <div class="contact-grid">
        <div class="contact-info">
          <div class="contact-info-card">
            <div class="info-icon"><i class="fas fa-map-marker-alt"></i></div>
            <div>
              <h4>Our Location</h4>
              <p>Kalikapur Main Road, Near Community Park,<br>Kolkata, West Bengal 700099</p>
            </div>
          </div>
          <div class="contact-info-card">
            <div class="info-icon"><i class="fas fa-phone-alt"></i></div>
            <div>
              <h4>Phone Number</h4>
              <p>+91 98765 43210 (Main Office)<br>+91 90123 45678 (Secretary)</p>
            </div>
          </div>
          <div class="contact-info-card">
            <div class="info-icon"><i class="fas fa-envelope"></i></div>
            <div>
              <h4>Email Address</h4>
              <p>info@kalikpurns.org<br>support@kalikpurns.org</p>
            </div>
          </div>
          <div class="contact-info-card">
            <div class="info-icon"><i class="fas fa-clock"></i></div>
            <div>
              <h4>Working Hours</h4>
              <p>Monday - Friday: 10 AM - 8 PM<br>Saturday - Sunday: 9 AM - 6 PM</p>
            </div>
          </div>
        </div>

        <div class="contact-form-wrap">
          <div class="feedback-form">
            <form onsubmit="event.preventDefault(); window.KNS.showToast('Message sent! We will get back to you soon.', 'success'); this.reset();">
              <div class="form-group">
                <label class="form-label" for="contact-name">Full Name</label>
                <input type="text" id="contact-name" class="form-input" placeholder="Enter your name" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="contact-email">Email Address</label>
                <input type="email" id="contact-email" class="form-input" placeholder="Enter your email" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="contact-msg">Message</label>
                <textarea id="contact-msg" class="form-textarea" placeholder="How can we help you?" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
                Send Message <i class="fas fa-paper-plane" style="margin-left: 8px;"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
};
