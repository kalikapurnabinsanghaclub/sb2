import re

def check_diagnostics():
    with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8", errors="ignore") as f:
        mon = f.read()
    with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8", errors="ignore") as f:
        ls = f.read()

    print("Checking Monitor Portal diagnostics...")
    
    # 1. Check undefined or orphaned element IDs referenced in JS
    js_ids = set(re.findall(r'document\.getElementById\(["\']([a-zA-Z0-9_\-]+)["\']\)', mon))
    html_ids = set(re.findall(r'id=["\']([a-zA-Z0-9_\-]+)["\']', mon))
    missing_ids = js_ids - html_ids
    print(f"Total IDs referenced in JS: {len(js_ids)}")
    print(f"Total IDs in HTML DOM: {len(html_ids)}")
    print(f"Missing DOM IDs (referenced in JS but not in DOM): {len(missing_ids)}")
    print("Sample missing IDs:", sorted(list(missing_ids))[:15])

    # 2. Check channel mismatch between localSync and Monitor
    mon_channels = set(re.findall(r'channel\(["\']([^"\']+)["\']\)', mon))
    ls_channels = set(re.findall(r'channel\(["\']([^"\']+)["\']\)', ls))
    print(f"\nChannels subscribed in Monitor: {mon_channels}")
    print(f"Channels subscribed in localSync: {ls_channels}")

    # 3. Check Event listeners vs Dispatchers
    dispatched = set(re.findall(r'dispatchEvent\(new CustomEvent\(["\']([^"\']+)["\']', mon + ls))
    listened = set(re.findall(r'addEventListener\(["\']([^"\']+)["\']', mon + ls))
    print(f"\nCustom Events Dispatched: {dispatched}")
    print(f"Events Listened (subset matching knsdc:): {[e for e in listened if 'knsdc' in e]}")

    # 4. Check console.warn or error checks
    warnings = re.findall(r'console\.(?:warn|error)\([^)]+\)', mon)
    print(f"\nExplicit console warn/error handlers: {len(warnings)}")

if __name__ == "__main__":
    check_diagnostics()
