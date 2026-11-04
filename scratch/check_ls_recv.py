with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

target = "this.state.chatMessages = payload.chatMessages.filter(m => !m.participantId && m.senderRole !== 'participant' && m.role !== 'participant');"
pos = text.find(target)
print("=== Broadcast Receive Block ===")
print(text[pos-100:pos+300])
