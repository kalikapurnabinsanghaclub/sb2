with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8") as f:
    text = f.read()

import re

# Find changedParts in setData
pos = text.find('const changedParts = [];')
print("changedParts in setData:")
print(text[pos:pos+800].encode('ascii', errors='replace').decode('ascii'))

# Find changedParts receiver
pos2 = text.find('if (payload.participantUpdates')
if pos2 == -1: pos2 = text.find('payload.changedParts')
if pos2 == -1: pos2 = text.find('payload.participantsUpdate')
print("\nchangedParts receiver:")
print(text[pos2:pos2+800].encode('ascii', errors='replace').decode('ascii'))
