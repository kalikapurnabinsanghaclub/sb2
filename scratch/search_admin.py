import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('c:/Users/sourav pc/Desktop/kalikapur/KNSDC-Admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}\n")

keywords = ['btn-danger', 'btn-red', 'delete', 'trash', '🗑', 'red', 'PRESENT', 'ATTENDANCE', 'JUDGE STATUS', 'attendanceBreakdown', 'judgeStatus', 'presenceCount', 'monitorCount', 'hostCount']

for kw in keywords:
    print(f"\n--- {kw} ---")
    for i, line in enumerate(lines):
        if kw.lower() in line.lower():
            print(f"  Line {i+1}: {line.strip()[:120]}")
