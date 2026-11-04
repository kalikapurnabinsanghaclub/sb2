with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\scratch\dashboard_dump.html", "r", encoding="utf-8") as f:
    text = f.read()

lines = text.split("\n")
print(f"Total lines: {len(lines)}")
for i, l in enumerate(lines[:120]):
    print(f"{i+1}: {l.encode('ascii', errors='replace').decode('ascii')}")
