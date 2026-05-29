export const renderAuthModal = (type, state) => {
  if (type === 'login') {
    return `
      <button class="modal-close" onclick="window.KNS.closeModal()">&times;</button>
      <h2 class="auth-title">Welcome Back</h2>
      <p class="auth-subtitle">Log in to your KNS account to continue</p>
      
      <form onsubmit="event.preventDefault(); window.KNS.login(this.email.value, this.password.value)">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" name="email" class="form-input" placeholder="name@example.com" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" name="password" class="form-input" placeholder="••••••••" required>
        </div>
        <div style="margin-bottom: 20px; font-size: 0.82rem; color: var(--color-text-dim);">
          <p><strong>Demo Logins:</strong></p>
          <p>Admin: admin@kns.org | monitor@kns.org</p>
          <p>Judge: judge@kns.org | Host: host@kns.org</p>
          <p>Password: admin123 (or any 4+ chars)</p>
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">Log In</button>
      </form>
      
      <div class="auth-switch">
        Don't have an account? <a onclick="window.KNS.openAuth('signup')">Sign Up</a>
      </div>
    `;
  }

  if (type === 'signup') {
    return `
      <button class="modal-close" onclick="window.KNS.closeModal()">&times;</button>
      <h2 class="auth-title">Join the Sangha</h2>
      <p class="auth-subtitle">Become a part of Kalikapur's favorite club</p>
      
      <form onsubmit="event.preventDefault(); window.KNS.signup({
        name: this.fullname.value,
        email: this.email.value,
        password: this.password.value
      })">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" name="fullname" class="form-input" placeholder="John Doe" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" name="email" class="form-input" placeholder="name@example.com" required>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" name="password" class="form-input" placeholder="••••••••" required>
        </div>
        <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">Create Account</button>
      </form>
      
      <div class="auth-switch">
        Already have an account? <a onclick="window.KNS.openAuth('login')">Log In</a>
      </div>
    `;
  }

  if (type === 'role-select') {
    return `
      <h2 class="auth-title">Select Your Role</h2>
      <p class="auth-subtitle">How would you like to participate today?</p>
      
      <div class="role-grid">
        <div class="role-card" onclick="window.KNS.selectRole('monitor')">
          <div class="role-icon"><i class="fas fa-desktop"></i></div>
          <div class="role-name">Monitor</div>
          <div class="role-desc">Track and oversee daily club activities</div>
        </div>
        <div class="role-card" onclick="window.KNS.selectRole('judge')">
          <div class="role-icon"><i class="fas fa-gavel"></i></div>
          <div class="role-name">Judge</div>
          <div class="role-desc">Review and evaluate contest entries</div>
        </div>
        <div class="role-card" onclick="window.KNS.selectRole('host')">
          <div class="role-icon"><i class="fas fa-microphone"></i></div>
          <div class="role-name">Host</div>
          <div class="role-desc">Manage and lead community events</div>
        </div>
      </div>
    `;
  }

  return '';
};

export const handleLogin = (email, password) => {
  // Simple mock logic
  if (email && password.length >= 4) {
    let role = 'member';
    if (email === 'admin@kns.org' || email === 'monitor@kns.org') role = 'monitor';
    else if (email === 'judge@kns.org') role = 'judge';
    else if (email === 'host@kns.org') role = 'host';

    return {
      success: true,
      user: { name: email.split('@')[0], email, role }
    };
  }
  return { success: false, error: 'Invalid email or password' };
};

export const handleSignup = (userData) => {
  if (userData.name && userData.email && userData.password.length >= 4) {
    return {
      success: true,
      user: { name: userData.name, email: userData.email, role: 'member' }
    };
  }
  return { success: false, error: 'Please fill all fields correctly' };
};

export const handleLogout = () => {
  // Logic is handled in app.js state
};

export const handleRoleSelect = (role) => {
  // Logic is handled in app.js state
};
