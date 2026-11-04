with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'(?:dashboard|dash-stats|pp-dashboard)', text)]
print("Total dashboard occurrences:", len(matches))

# Let's inspect nav function
nav_pos = text.find('function nav(')
print("=== function nav ===")
print(text[nav_pos:nav_pos+1500].encode('ascii', errors='replace').decode('ascii'))
