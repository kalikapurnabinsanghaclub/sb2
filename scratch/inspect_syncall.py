with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8", errors="ignore") as f:
    mon = f.read()

import re
for fn in ['syncAll', 'addChatMsg', 'sendChatMessage']:
    m = re.search(r'function\s+' + fn + r'[\s\S]*?\{([\s\S]*?\n\})', mon)
    if m:
        code = m.group(0).encode('ascii', errors='replace').decode('ascii')
        print(f"=== {fn} ===")
        print(code[:600])
        print("...\n")
