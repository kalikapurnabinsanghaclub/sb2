with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

target = "broadcastPayload.chatMessages = this.state.chatMessages;"
pos = text.find(target)
print("pos:", pos)
print(repr(text[pos-60:pos+160]))
