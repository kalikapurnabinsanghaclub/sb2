with open(r"c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Admin.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "judge" in line.lower() or "present" in line.lower():
        if "style" in line or "class" in line or "function" in line or "=>" in line:
            safe_line = line.strip().encode('ascii', errors='replace').decode('ascii')
            print(f"Line {idx+1}: {safe_line}")
