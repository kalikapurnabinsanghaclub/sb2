
    window.addEventListener('error', function(e) {
      const div = document.createElement('div');
      div.id = 'runtime-error-overlay';
      div.style.cssText = 'position:fixed; top:0; left:0; right:0; background:#ef4444; color:white; z-index:100000; padding:20px; font-family:monospace; font-size:14px; word-break:break-all; border-bottom:4px solid #991b1b; box-shadow:0 10px 30px rgba(0,0,0,0.5)';
      div.innerHTML = `
        <div style="font-weight:bold; font-size:18px; margin-bottom:10px">⚠️ Runtime Error Detected</div>
        <div style="margin-bottom:10px">Message: ${e.message}</div>
        <div style="font-size:12px; opacity:0.8">Source: ${e.filename}:${e.lineno}</div>
        <button onclick="this.parentElement.remove()" style="margin-top:15px; padding:8px 16px; background:#991b1b; color:white; border:none; border-radius:4px; cursor:pointer">Close Overlay</button>
      `;
      document.body ? document.body.appendChild(div) : document.documentElement.appendChild(div);
    });

    function showAuth(isSignup = false) {
      const modal = document.getElementById('auth-modal');
      if (!modal) return;
      modal.classList.add('active');
      if (isSignup) {
        document.getElementById('auth-login').style.display = 'none';
        document.getElementById('auth-signup').style.display = 'block';
      } else {
        document.getElementById('auth-login').style.display = 'block';
        document.getElementById('auth-signup').style.display = 'none';
      }
    }

    function hideAuth() {
      const modal = document.getElementById('auth-modal');
      if (modal) modal.classList.remove('active');
    }

    window.showAuth = showAuth;
    window.hideAuth = hideAuth;
    
    // Local Mode Check
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      window.addEventListener('DOMContentLoaded', () => {
        const warn = document.createElement('div');
        warn.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ef4444;color:white;text-align:center;padding:12px;z-index:9999;font-weight:bold;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.2)';
        warn.innerHTML = '⚠️ WARNING: You are using LOCALHOST. Please run <b>LAUNCH.bat</b> for the stable Offline Portal.';
        document.body.prepend(warn);
      });
    }
  