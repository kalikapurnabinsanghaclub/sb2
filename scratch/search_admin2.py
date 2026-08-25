import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('c:/Users/sourav pc/Desktop/kalikapur/KNSDC-Admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- .g5 and .stat CSS ---")
for i, line in enumerate(lines):
    if '.g5' in line or '.stat{' in line or '.stat ' in line or '.stat.' in line:
        print(f"  Line {i+1}: {line.strip()[:120]}")

print("\n--- renderAttendanceBreakdown / renderJudgeStatus ---")
for i, line in enumerate(lines):
    if 'attendance' in line.lower() and ('render' in line.lower() or 'function' in line.lower()):
        print(f"  Line {i+1}: {line.strip()[:120]}")
    if 'judge' in line.lower() and ('status' in line.lower() and ('render' in line.lower() or 'function' in line.lower())):
        print(f"  Line {i+1}: {line.strip()[:120]}")
