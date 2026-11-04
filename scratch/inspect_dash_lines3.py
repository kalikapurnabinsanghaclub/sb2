with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\scratch\dashboard_dump.html", "r", encoding="utf-8") as f:
    text = f.read()

lines = text.split("\n")
for i, l in enumerate(lines[240:], start=241):
    print(f"{i}: {l.encode('ascii', errors='replace').decode('ascii')}")
