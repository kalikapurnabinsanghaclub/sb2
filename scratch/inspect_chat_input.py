with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

idx = text.find('function triggerSOS()')
print(text[idx-700:idx].encode('ascii', errors='replace').decode('ascii'))
