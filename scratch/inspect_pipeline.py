import re

def analyze():
    with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8", errors="ignore") as f:
        ls_text = f.read()

    print("=== localSync-v4.js ===")
    print("Length:", len(ls_text))
    channels = set(re.findall(r'channel\(["\']([^"\']+)["\']\)', ls_text))
    tables = set(re.findall(r'\.from\(["\']([^"\']+)["\']\)', ls_text))
    print("Channels:", channels)
    print("Tables:", tables)

    # Search for pipelines, events, broadcast, postgres_changes
    pg_changes = re.findall(r'postgres_changes[\s\S]*?schema:\s*["\']([^"\']+)["\'][\s\S]*?table:\s*["\']([^"\']+)["\']', ls_text)
    print("Postgres changes:", pg_changes[:10])

    # Search for custom broadcast events
    broadcasts = set(re.findall(r'event:\s*["\']([^"\']+)["\']', ls_text))
    print("Broadcast events:", broadcasts)

    # Read KNSDC-Monitor.html key pipeline sections
    with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8", errors="ignore") as f:
        mon_text = f.read()

    print("\n=== KNSDC-Monitor.html Key Sections ===")
    matches = re.findall(r'(?:function\s+|const\s+|let\s+|var\s+)(init[A-Za-z0-9_]+|sync[A-Za-z0-9_]+|render[A-Za-z0-9_]+|handle[A-Za-z0-9_]+)', mon_text)
    print("Init/Sync/Render/Handle fns count:", len(matches))
    unique_fns = sorted(list(set(matches)))
    print("Sample functions:", unique_fns[:30])

if __name__ == "__main__":
    analyze()
