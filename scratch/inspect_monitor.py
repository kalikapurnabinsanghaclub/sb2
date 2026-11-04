import re
import os

filepath = r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html"
with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

print("File size:", len(text), "bytes")

# Find titles / headers
sections = re.findall(r'/\*+\s*([A-Z0-9\s:_\-\(\)\/]{3,60})\s*\*+/', text)
print("\n=== Comment Headers ===")
for s in sections[:40]:
    s_clean = s.strip()
    if s_clean and len(s_clean) > 3:
        print(f"  * {s_clean}")

# Find DOM sections / tabs / views
tabs = re.findall(r'data-tab=["\']([^"\']+)["\']', text)
views = re.findall(r'id=["\']([a-zA-Z0-9_\-]+(?:view|tab|panel|section|container|pipeline|monitor|dashboard))["\']', text, re.I)
print("\n=== Tabs ===", set(tabs))
print("\n=== Key Views ===", set(views[:30]))

# Supabase queries & subscriptions
tables = set(re.findall(r'\.from\(["\']([a-zA-Z0-9_\-]+)["\']\)', text))
print("\n=== Supabase Tables ===", tables)

channels = set(re.findall(r'channel\(["\']([a-zA-Z0-9_\-]+)["\']\)', text))
print("\n=== Realtime Channels ===", channels)

# Broadcast / Custom Events / postMessage
events = set(re.findall(r'(?:dispatchEvent|addEventListener)\(["\']([a-zA-Z0-9_\-:]+)["\']', text))
print("\n=== Events Dispatched / Listened ===", list(events)[:30])

# LocalStorage keys
ls_keys = set(re.findall(r'localStorage\.(?:getItem|setItem)\(["\']([a-zA-Z0-9_\-]+)["\']', text))
print("\n=== LocalStorage Keys ===", ls_keys)

# Key pipelines / functions
fns = re.findall(r'(?:function\s+([a-zA-Z0-9_]+)\s*\(|window\.([a-zA-Z0-9_]+)\s*=)', text)
fn_names = set([a or b for a, b in fns if (a or b)])
pipeline_fns = [f for f in fn_names if any(w in f.lower() for w in ['sync', 'pipeline', 'stream', 'audio', 'feed', 'render', 'init', 'update', 'load', 'refresh', 'socket', 'channel', 'judge', 'venue', 'dj', 'staff', 'sub'])]
print(f"\n=== Pipeline & Data Flow Functions ({len(pipeline_fns)} total) ===")
print(sorted(pipeline_fns)[:50])
