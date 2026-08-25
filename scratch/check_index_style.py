with open(r"c:\Users\sourav pc\Desktop\kalikapur\index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "blue" in line.lower() or "score" in line.lower() or "judge" in line.lower() or "stage" in line.lower():
        if "style" in line or "class" in line:
            safe_line = line.strip().encode('ascii', errors='replace').decode('ascii')
            print(f"Line {idx+1}: {safe_line}")
