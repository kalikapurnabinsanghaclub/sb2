import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('c:/Users/sourav pc/Desktop/kalikapur/KNSDC-Admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- g3 CSS ---")
for i, line in enumerate(lines):
    if '.g3' in line or '.g2{' in line or '.g5{' in line:
        print(f"  Line {i+1}: {line.strip()[:120]}")

print("\n--- btn-danger delete button occurrences ---")
for i, line in enumerate(lines):
    if 'btn-danger' in line and ('delete' in line.lower() or 'delet' in line.lower() or '\U0001f5d1' in line):
        print(f"  Line {i+1}: {line.strip()[:120]}")
