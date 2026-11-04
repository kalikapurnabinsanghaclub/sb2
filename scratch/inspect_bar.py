with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8", errors="ignore") as f:
    mon = f.read()

import re
m = re.search(r'<div[^>]*id=["\']sos-alert-bar["\'][\s\S]*?</div>', mon)
if m:
    print(m.group(0).encode('ascii', errors='replace').decode('ascii'))
