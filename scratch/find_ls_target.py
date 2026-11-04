with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

target = "if (this.state.chatMessages && JSON.stringify(this.state.chatMessages) !== JSON.stringify(lastSaved.chatMessages)) {"
pos = text.find(target)
print("Found target in localSync:", pos)
print(text[pos-100:pos+400].encode('ascii', errors='replace').decode('ascii'))
