with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    text = f.read()

import re

for fn in ['getRoundPresent', 'pushToStage']:
    pos = text.find(f'function {fn}(')
    if pos != -1:
        end = text.find('\nfunction ', pos + 10)
        print(f"=== {fn} ===")
        print(text[pos:pos+800].encode('ascii', errors='replace').decode('ascii'))
