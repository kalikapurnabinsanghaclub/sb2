with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

idx = text.find('if (payload.chatMessagesUpdate')
print(text[idx-100:idx+800].encode('ascii', errors='replace').decode('ascii'))
