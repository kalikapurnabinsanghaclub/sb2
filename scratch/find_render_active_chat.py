with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

target = "function renderActiveHelpdeskChat("
pos = text.find(target)
print("Found renderActiveHelpdeskChat:", pos)
print(text[pos:pos+2000].encode('ascii', errors='replace').decode('ascii'))
