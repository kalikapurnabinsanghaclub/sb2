with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

target = "localStorage.setItem('knsdc_switchStates'"
pos = text.find(target)
print("=== Persistence Block ===")
print(text[pos-100:pos+600])
