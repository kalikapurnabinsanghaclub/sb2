with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'chatMessages', text)]
print("Found chatMessages occurrences in localSync:", len(matches))
for pos in matches:
    print("---")
    print(text[max(0, pos-100):min(len(text), pos+200)].encode('ascii', errors='replace').decode('ascii'))
