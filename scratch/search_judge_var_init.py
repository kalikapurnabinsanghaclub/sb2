with open(r"c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Judge.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "const judge =" in line.lower() or "let judge =" in line.lower() or "var judge =" in line.lower() or "judge = {" in line.lower() or "judge = [" in line.lower():
        safe_line = line.strip().encode('ascii', errors='replace').decode('ascii')
        print(f"Line {idx+1}: {safe_line}")
