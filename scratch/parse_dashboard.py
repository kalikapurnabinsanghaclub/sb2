import re

with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\scratch\dashboard_dump.html", "r", encoding="utf-8") as f:
    text = f.read()

print("Dashboard Length:", len(text))

# Find all cards, stat boxes, headers, buttons, containers
headers = re.findall(r'<h[1-6][^>]*>([\s\S]*?)</h[1-6]>', text)
print("\n=== Headers ===")
for h in headers:
    clean = re.sub(r'<[^>]+>', '', h).strip()
    if clean:
        print("  -", clean)

# Find stat boxes
stat_labels = re.findall(r'class="stat-label"[^>]*>([\s\S]*?)</div>', text)
stat_vals = re.findall(r'class="stat-val"[^>]*id="([^"]+)"', text)
print("\n=== Stats ===")
for l, v in zip(stat_labels, stat_vals):
    print(f"  {l.strip()}: #{v}")

# Find all div IDs in dashboard
ids = re.findall(r'id="([^"]+)"', text)
print("\n=== IDs in Dashboard ===")
print(ids)

# Find cards / sections
sections = re.findall(r'class="card[^"]*"[\s\S]*?<div class="card-title"[^>]*>([\s\S]*?)</div>', text)
print("\n=== Card Titles ===")
for s in sections:
    print("  *", re.sub(r'<[^>]+>', '', s).strip())
