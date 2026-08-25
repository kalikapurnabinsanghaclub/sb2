import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('c:/Users/sourav pc/Desktop/kalikapur/KNSDC-Admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- event creation handlers ---")
for i, line in enumerate(lines):
    if 'saveEvent' in line or 'addEvent' in line or 'createEvent' in line or 'newEvent' in line:
        print(f"  Line {i+1}: {line.strip()[:120]}")
