with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('id="pp-dashboard"')
if idx == -1:
    idx = text.find("id='pp-dashboard'")
print("pp-dashboard found at:", idx)

# Find where pp-dashboard ends (next <div class="pp")
idx_next = text.find('class="pp"', idx + 20)
if idx_next == -1:
    idx_next = text.find("class='pp'", idx + 20)
print("pp-dashboard length:", idx_next - idx)

with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\scratch\dashboard_dump.html", "w", encoding="utf-8") as out:
    out.write(text[idx:idx_next])
print("Saved dashboard section to scratch/dashboard_dump.html")
