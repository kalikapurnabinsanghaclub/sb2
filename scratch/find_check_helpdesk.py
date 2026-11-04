with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

target = "function checkHelpdeskFromState(state) {"
pos = text.find(target)
print("Found checkHelpdeskFromState:", pos)
print(text[pos:pos+1600].encode('ascii', errors='replace').decode('ascii'))
