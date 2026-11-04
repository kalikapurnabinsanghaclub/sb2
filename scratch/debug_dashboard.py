import re

with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\scratch\dashboard_dump.html", "r", encoding="utf-8") as f:
    dash_html = f.read()

with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    mon_html = f.read()

print("=== 1. Checking Handlers in Dashboard HTML ===")
# Find all inline event handlers (onclick, onchange, oninput)
handlers = re.findall(r'(on[a-z]+)=["\']([^"\']+)["\']', dash_html)
print(f"Total inline handlers found: {len(handlers)}")

# Extract function names called
called_fns = set()
for ev, code in handlers:
    m = re.findall(r'([a-zA-Z0-9_$]+)\s*\(', code)
    for fn in m:
        called_fns.add(fn)

print(f"Unique functions called: {len(called_fns)}")
for fn in sorted(called_fns):
    # Check if defined in JS
    is_defined = bool(re.search(r'(?:function\s+' + re.escape(fn) + r'\b|window\.' + re.escape(fn) + r'\s*=)', mon_html))
    print(f"  - {fn}(): {'[EXISTS]' if is_defined else '[MISSING! CRITICAL BUG]'}")

print("\n=== 2. Checking DOM IDs in Dashboard vs JS lookups ===")
dash_ids = set(re.findall(r'id=["\']([a-zA-Z0-9_\-]+)["\']', dash_html))
print(f"Total IDs declared in Dashboard: {len(dash_ids)}")

# Check if dashboard functions access IDs that are missing
dash_fn_sources = []
for fn in called_fns:
    m = re.search(r'(?:function\s+' + re.escape(fn) + r'\s*\([^)]*\)\s*\{[\s\S]*?\n\}|window\.' + re.escape(fn) + r'\s*=\s*(?:function|\([^)]*\)\s*=>)[\s\S]*?\n\})', mon_html)
    if m:
        dash_fn_sources.append((fn, m.group(0)))

all_dash_js = "\n".join([code for _, code in dash_fn_sources])
js_referenced_ids = set(re.findall(r'document\.getElementById\(["\']([a-zA-Z0-9_\-]+)["\']\)', all_dash_js))
all_html_ids = set(re.findall(r'id=["\']([a-zA-Z0-9_\-]+)["\']', mon_html))

missing_in_dom = js_referenced_ids - all_html_ids
print(f"\nIDs referenced by Dashboard handlers: {len(js_referenced_ids)}")
print(f"IDs missing across entire HTML: {missing_in_dom}")
for mid in sorted(missing_in_dom):
    print(f"  [MISSING DOM TARGET]: #{mid}")

print("\n=== 3. Inspecting Dashboard Rendering Functions ===")
# Inspect renderAttendanceBreakdown, renderUpcoming, renderStageView, updateFlashStatusUI, etc.
render_fns = ['renderAttendanceBreakdown', 'renderUpcoming', 'updateFlashStatusUI', 'handlePublicRatingPosChange', 'handleLiveStreamStepChange', 'autoPromoteTopN', 'pushNextToStage', 'markStageDone', 'dropToQueue', 'markStageDoneSNUL']
for rfn in render_fns:
    is_def = bool(re.search(r'(?:function\s+' + re.escape(rfn) + r'\b|window\.' + re.escape(rfn) + r'\s*=)', mon_html))
    print(f"  - {rfn}(): {'[EXISTS]' if is_def else '[MISSING! CRITICAL BUG]'}")
