with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

import re
idx = text.find('broadcastPayload.publicVotesUpdate')
print("=== Broadcast Assembly ===")
print(text[idx-50:idx+600].encode('ascii', errors='replace').decode('ascii'))

idx2 = text.find('if (payload.chatMessagesUpdate')
print("\n=== Broadcast Receive ===")
print(text[idx2-50:idx2+600].encode('ascii', errors='replace').decode('ascii'))
