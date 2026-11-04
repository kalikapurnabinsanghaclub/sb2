with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    text = f.read()

import re

actions = ['pushNextToStage', 'markStageDone', 'dropToQueue', 'markStageDoneSNUL', 'autoPromoteTopN']
for act in actions:
    pos = text.find(f'function {act}(')
    if pos != -1:
        end = text.find('\nfunction ', pos + 10)
        code = text[pos:end]
        print(f"\n=== {act} ({len(code)} bytes) ===")
        print(code[:600].encode('ascii', errors='replace').decode('ascii'))
    else:
        print(f"❌ Function {act} NOT FOUND!")
