with open(r"c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "function hydrate" in line:
        print(f"Line {idx+1}: {line.strip()}")
