with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'upcoming-list', text)]
print("Occurrences of 'upcoming-list':", len(matches))
for pos in matches:
    print(text[max(0, pos-100):min(len(text), pos+300)])
    print("---")
