import re
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

with open(r"c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

search_terms = ["currentOnStage", "activeEventId", "activeEvent"]
for term in search_terms:
    print(f"=== Matches for '{term}' ===")
    for idx, line in enumerate(lines):
        if term in line:
            safe_line = line.strip().encode('ascii', errors='replace').decode('ascii')
            print(f"Line {idx+1}: {safe_line}")
