with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    text = f.read()

pos1 = text.find('function renderAttendanceBreakdown()')
print("=== renderAttendanceBreakdown ===")
print(text[pos1:pos1+1500].encode('ascii', errors='replace').decode('ascii'))

pos2 = text.find('function renderJudgeStatus()')
print("\n=== renderJudgeStatus ===")
print(text[pos2:pos2+1500].encode('ascii', errors='replace').decode('ascii'))
