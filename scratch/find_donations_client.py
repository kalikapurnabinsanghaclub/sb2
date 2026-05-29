import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('c:/Users/sourav pc/Desktop/kalikapur/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- index.html donation matches ---")
for i, line in enumerate(lines):
    if 'donation' in line.lower():
        print(f"  Line {i+1}: {line.strip()[:120]}")
