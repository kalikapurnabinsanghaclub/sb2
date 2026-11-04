with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('function triggerSOS(){')
idx_stop = text.find('function stopSOS(){')
idx_end = text.find('// ════════════════ HOST ASSIGNMENT', idx_stop)
print("triggerSOS block:")
print(repr(text[idx:idx_end]))
