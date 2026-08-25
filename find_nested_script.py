import sys; sys.stdout.reconfigure(encoding='utf-8')
import re
with open('KNSDC-Participant.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's find the main script tag
idx_start = text.find('<script>')
idx_end = text.find('</script>', idx_start)

script_content = text[idx_start:idx_end]

# Find any <script or </script inside the script content
matches = list(re.finditer(r'</?script', script_content, re.IGNORECASE))
for m in matches:
    print(f"Found {m.group()} inside the script block at relative position {m.start()}")
    # print context
    print(repr(script_content[max(0, m.start()-50):min(len(script_content), m.end()+50)]))
