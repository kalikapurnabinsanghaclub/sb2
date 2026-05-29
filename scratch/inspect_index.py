import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

files = ["full_portal_integrated.html", "portal.html", "view_immediately.html", "knsdc-website-1.html"]
for f_name in files:
    path = os.path.join(r"c:\Users\sourav pc\Desktop\kalikapur", f_name)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        pos = content.find("liveContent")
        print(f"File {f_name}: liveContent found at {pos}")
        if pos != -1:
            print("Context:", repr(content[pos-150:pos+150]))
            print()
