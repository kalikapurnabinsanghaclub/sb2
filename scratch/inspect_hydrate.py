with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

import re
idx = text.find('function hydrate(')
if idx != -1:
    print(text[idx:idx+1500].encode('ascii', errors='replace').decode('ascii'))
