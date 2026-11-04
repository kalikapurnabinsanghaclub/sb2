with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    text = f.read()

pos = text.find('function renderSwitches(){')
print(text[pos:pos+1500].encode('ascii', errors='replace').decode('ascii'))
