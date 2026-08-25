// lib/couchbaseAuth.js

class CouchbaseAuthService {
  constructor() {
    this._loadCredentials();
  }

  _loadCredentials() {
    this.endpoint = localStorage.getItem('kns_couchbase_url') || window.COUCHBASE_URL || '';
    this.username = localStorage.getItem('kns_couchbase_user') || window.COUCHBASE_USER || '';
    this.password = localStorage.getItem('kns_couchbase_pass') || window.COUCHBASE_PASS || '';
  }

  isConfigured() {
    this._loadCredentials();
    return this.endpoint.trim().length > 0;
  }

  _getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.username && this.password) {
      headers['Authorization'] = 'Basic ' + btoa(this.username + ':' + this.password);
    }
    return headers;
  }

  async signIn(email, password) {
    this._loadCredentials();
    if (!this.isConfigured()) {
      throw new Error('Couchbase endpoint is not configured! Please click the gear icon at the top right to configure your URL.');
    }
    
    try {
      const res = await fetch(`${this.endpoint}/_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: email,
          password: password
        })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.reason || 'Invalid email or password');
      }
      
      const data = await res.json();
      localStorage.setItem('kns_cb_session_token', data.session_id);
      localStorage.setItem('kns_cb_current_user', email);
      return { success: true, user: email, session: data.session_id };
    } catch (e) {
      console.error('[Couchbase] Sign In Error:', e);
      throw e;
    }
  }

  async signUp(name, email, password) {
    this._loadCredentials();
    if (!this.isConfigured()) {
      throw new Error('Couchbase endpoint is not configured! Please click the gear icon at the top right to configure your URL.');
    }

    try {
      const res = await fetch(`${this.endpoint}/_user/`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({
          name: email,
          password: password,
          admin_channels: ['public'],
          email: email,
          display_name: name
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.reason || 'Failed to create user account');
      }

      return { success: true, message: 'Verification email has been sent to ' + email + '. Please verify to activate your Workshop Manager account.' };
    } catch (e) {
      console.error('[Couchbase] Sign Up Error:', e);
      throw e;
    }
  }

  async forgotPassword(email) {
    this._loadCredentials();
    if (!this.isConfigured()) {
      throw new Error('Couchbase endpoint is not configured! Please click the gear icon at the top right to configure your URL.');
    }

    try {
      const res = await fetch(`${this.endpoint}/_password_recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!res.ok && res.status === 404) {
        return { success: true, message: 'Password recovery email verification message has been sent to ' + email + '!' };
      }

      if (!res.ok) {
        throw new Error('Failed to request password reset');
      }

      return { success: true, message: 'Password recovery email verification message has been sent to ' + email + '!' };
    } catch (e) {
      console.error('[Couchbase] Forgot Password Error:', e);
      throw e;
    }
  }
}

window.couchbaseAuth = new CouchbaseAuthService();
