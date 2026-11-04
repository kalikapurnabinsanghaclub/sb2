with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    text = f.read()

pos = text.find('function renderDashboard(')
if pos == -1:
    pos = text.find('renderDashboard =')
print("renderDashboard pos:", pos)
print(text[pos:pos+3000].encode('ascii', errors='replace').decode('ascii'))
