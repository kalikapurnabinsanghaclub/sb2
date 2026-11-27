with open('KNSDC-Host.html', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Move leading <script> before <!DOCTYPE html> into <head>
leading_script = """<script>
// Clean up stale default 1+4 formula from previous sessions
try {
  if (localStorage.getItem('knsdc_ranking_formula') === '1+4' && localStorage.getItem('knsdc_ranking_formula_active') !== '1') {
    localStorage.removeItem('knsdc_ranking_formula');
  }
} catch(e) {}
</script>
<!DOCTYPE html>"""

leading_script_crlf = leading_script.replace('\n', '\r\n')
if leading_script_crlf in code:
    code = code.replace(leading_script_crlf, '<!DOCTYPE html>', 1)
    print("Removed leading script before DOCTYPE (CRLF)")
elif leading_script in code:
    code = code.replace(leading_script, '<!DOCTYPE html>', 1)
    print("Removed leading script before DOCTYPE (LF)")

# 2. Add PWA manifest, Apple meta tags, and theme-color to <head>
old_title = '<title>KNSDC — Host Panel</title>'
new_title = """<title>KNSDC — Host Panel</title>
<link rel="manifest" href="/manifest-host.json"/>
<meta name="theme-color" id="pwa-theme-color" content="#070a14"/>
<meta name="mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="apple-mobile-web-app-title" content="KNSDC Host"/>
<link rel="apple-touch-icon" href="/logo.png"/>
<link rel="icon" type="image/png" href="/logo.png"/>
<script>
try {
  if (localStorage.getItem('knsdc_ranking_formula') === '1+4' && localStorage.getItem('knsdc_ranking_formula_active') !== '1') {
    localStorage.removeItem('knsdc_ranking_formula');
  }
} catch(e) {}
</script>"""

if old_title in code and 'manifest-host.json' not in code:
    code = code.replace(old_title, new_title, 1)
    print("Added PWA manifest & Apple meta tags to <head>")

# 3. Auto-sync system bars with active Light/Dark theme in FOUC script
old_fouc = """  // Apply theme immediately to prevent FOUC
  (function() {
    const savedTheme = localStorage.getItem('knsdc_host_theme');
    if (savedTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  })();"""

new_fouc = """  // Auto-sync PWA Top Status Bar & Bottom System Navigation Bar with active theme
  window.syncHostSystemBarsWithTheme = function() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const barColor = isDark ? '#070a14' : '#f8fafc';
    const metaTheme = document.getElementById('pwa-theme-color') || document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', barColor);
    const metaApple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (metaApple) metaApple.setAttribute('content', isDark ? 'black-translucent' : 'default');
    document.documentElement.style.backgroundColor = barColor;
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    if (document.body) document.body.style.backgroundColor = barColor;
  };

  // Apply theme immediately to prevent FOUC
  (function() {
    const savedTheme = localStorage.getItem('knsdc_host_theme');
    if (savedTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    window.syncHostSystemBarsWithTheme();
    try {
      new MutationObserver(() => window.syncHostSystemBarsWithTheme())
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    } catch (e) {}
  })();"""

old_fouc_crlf = old_fouc.replace('\n', '\r\n')
if old_fouc_crlf in code:
    code = code.replace(old_fouc_crlf, new_fouc.replace('\n', '\r\n'), 1)
    print("Added syncHostSystemBarsWithTheme (CRLF)")
elif old_fouc in code:
    code = code.replace(old_fouc, new_fouc, 1)
    print("Added syncHostSystemBarsWithTheme (LF)")

# 4. Call syncHostSystemBarsWithTheme inside toggleTheme()
old_toggle = """function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('knsdc_host_theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('knsdc_host_theme', 'dark');
  }
}"""

new_toggle = """function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('knsdc_host_theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('knsdc_host_theme', 'dark');
  }
  if (typeof window.syncHostSystemBarsWithTheme === 'function') window.syncHostSystemBarsWithTheme();
}"""

old_toggle_crlf = old_toggle.replace('\n', '\r\n')
if old_toggle_crlf in code:
    code = code.replace(old_toggle_crlf, new_toggle.replace('\n', '\r\n'), 1)
    print("Updated toggleTheme() in KNSDC-Host.html (CRLF)")
elif old_toggle in code:
    code = code.replace(old_toggle, new_toggle, 1)
    print("Updated toggleTheme() in KNSDC-Host.html (LF)")

# 5. Add Install App button to Topbar right before Refresh button
old_refresh_btn = """      <button class="btn btn-ghost btn-sm" style="border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;gap:6px;font-weight:700;margin-left:10px;padding:4px 10px;font-size:11px" onclick="refreshPortal(this)">"""
install_btn_html = """      <button type="button" id="host-install-btn" onclick="triggerHostAppInstall()" title="Install Host Portal as App" style="display:none;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;font-size:11px;font-weight:800;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#ffffff;border:none;box-shadow:0 3px 10px rgba(79,70,229,0.35);cursor:pointer;white-space:nowrap;margin-left:8px;transition:all 0.2s;">
        <span>📲</span> <span>Install App</span>
      </button>
""" + old_refresh_btn

old_refresh_crlf = old_refresh_btn.replace('\n', '\r\n')
if old_refresh_btn in code and 'host-install-btn' not in code:
    code = code.replace(old_refresh_btn, install_btn_html, 1)
    print("Added Install App button to Host Topbar")

# 6. Register Service Worker & beforeinstallprompt handler before </body>
pwa_js = """
<script>
// ════════════════════════════════════════
// HOST PORTAL PWA INSTALLATION & SERVICE WORKER
// ════════════════════════════════════════
(function initHostPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    });
  }

  window._deferredHostInstallPrompt = null;
  const installBtn = document.getElementById('host-install-btn');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window._deferredHostInstallPrompt = e;
    if (installBtn && !isStandalone) {
      installBtn.style.display = 'inline-flex';
    }
  });

  window.addEventListener('appinstalled', () => {
    window._deferredHostInstallPrompt = null;
    if (installBtn) installBtn.style.display = 'none';
    if (typeof toast === 'function') toast('✅ KNSDC Host App installed on your device!');
  });

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  if (isIOS && !isStandalone && installBtn) {
    installBtn.style.display = 'inline-flex';
  }
})();

window.triggerHostAppInstall = async function() {
  if (window._deferredHostInstallPrompt) {
    window._deferredHostInstallPrompt.prompt();
    const choice = await window._deferredHostInstallPrompt.userChoice;
    if (choice && choice.outcome === 'accepted') {
      const btn = document.getElementById('host-install-btn');
      if (btn) btn.style.display = 'none';
    }
    window._deferredHostInstallPrompt = null;
    return;
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  if (isIOS) {
    alert('To install on iPhone/iPad:\\n1. Tap the Share button (⬆️) at the bottom of Safari.\\n2. Scroll down and tap "Add to Home Screen".');
  } else {
    alert('To install on Android:\\nTap the browser menu (⋮) at the top-right and select "Install app" or "Add to Home screen".');
  }
};
</script>
"""

if 'initHostPWA' not in code:
    code = code.replace('</body>', pwa_js + '\n</body>', 1)
    print("Added Host PWA Service Worker & Install handler")

with open('KNSDC-Host.html', 'w', encoding='utf-8') as f:
    f.write(code)
print("Saved KNSDC-Host.html")
