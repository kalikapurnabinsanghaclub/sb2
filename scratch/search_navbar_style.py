import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('c:/Users/sourav pc/Desktop/kalikapur/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- STYLE SEARCH FOR .nav-bar ---")
for idx, line in enumerate(lines):
    if '.nav-bar' in line:
        print(f"Line {idx+1}: {line.strip()}")
