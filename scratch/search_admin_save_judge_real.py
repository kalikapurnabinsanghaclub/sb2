with open(r"c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Admin.html", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = [m.start() for m in re.finditer("saveNewJudge", content, re.IGNORECASE)]
print(f"Total matches found: {len(matches)}")
for m in matches:
    start_line = content[:m].count("\n") + 1
    line = content.splitlines()[start_line - 1]
    print(f"Line {start_line}: {line}")
