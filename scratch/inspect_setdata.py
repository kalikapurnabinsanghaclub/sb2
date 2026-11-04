with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8", errors="ignore") as f:
    ls = f.read()

import re
m = re.search(r'setData\s*\([^)]*\)\s*\{([\s\S]*?\n\s*\})', ls)
if m:
    print(m.group(0)[:1200])
