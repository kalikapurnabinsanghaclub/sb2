with open(r"c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Admin.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "savenewjudge" in line.lower():
        safe_line = line.strip().encode('ascii', errors='replace').decode('ascii')
        print(f"Line {idx+1}: {safe_line}")
