with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

target = "newState.switchStates = { ...(newState.switchStates || {}), ...switchStates };"
pos = text.find(target)
print("Found target in KNSDC-Monitor:", pos)
print(text[pos-100:pos+500].encode('ascii', errors='replace').decode('ascii'))
