with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

import re
idx = text.find('function triggerSOS()')
print("=== triggerSOS context ===")
print(text[idx-100:idx+800].encode('ascii', errors='replace').decode('ascii'))
