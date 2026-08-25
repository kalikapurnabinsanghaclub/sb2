with open(r"c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "judges" in line.lower() and ("=" in line or "push" in line or "find" in line or "filter" in line):
        safe_line = line.strip().encode('ascii', errors='replace').decode('ascii')
        print(f"Line {idx+1}: {safe_line}")
