import re
import sys

# Reconfigure stdout to use UTF-8 just in case
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

with open(r"c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

search_terms = ["renderStageView", "on-stage-judge-scores", "Scores", "currently-on-stage", "stage-card"]
for term in search_terms:
    print(f"=== Matches for '{term}' ===")
    for idx, line in enumerate(lines):
        if term.lower() in line.lower():
            safe_line = line.strip().encode('ascii', errors='replace').decode('ascii')
            print(f"Line {idx+1}: {safe_line}")
