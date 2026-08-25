import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('c:/Users/sourav pc/Desktop/kalikapur/KNSDC-Admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- nav matches ---")
for i, line in enumerate(lines):
    if 'function nav(' in line or 'window.nav =' in line or 'nav = ' in line:
        print(f"  Line {i+1}: {line.strip()[:120]}")
