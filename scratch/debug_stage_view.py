with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    text = f.read()

pos = text.find('function renderStageView(){')
end_pos = text.find('\nfunction ', pos + 10)
stage_view_code = text[pos:end_pos]
print("renderStageView length:", len(stage_view_code))

# Check for document.getElementById inside renderStageView
import re
ids = re.findall(r'document\.getElementById\(["\']([^"\']+)["\']\)', stage_view_code)
print("IDs queried in renderStageView:", ids)

all_ids = set(re.findall(r'id=["\']([a-zA-Z0-9_\-]+)["\']', text))
for i in ids:
    print(f"  #{i}: {'EXISTS' if i in all_ids else 'MISSING IN DOM!'}")
