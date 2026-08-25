import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('c:/Users/sourav pc/Desktop/kalikapur/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Remaining scrollTo( calls (excluding window.scrollTo):")
found = 0
for i, line in enumerate(lines):
    if 'scrollTo(' in line and 'window.scrollTo(' not in line:
        print(f"  Line {i+1}: {line.strip()[:120]}")
        found += 1

print(f"\nTotal stray: {found}")
