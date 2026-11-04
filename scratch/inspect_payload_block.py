with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

target = "this.state.helpdeskMessages = payload.helpdeskMessages;"
pos = text.find(target)
print(text[pos:pos+1500].encode('ascii', errors='replace').decode('ascii'))
