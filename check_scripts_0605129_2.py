import sys; sys.stdout.reconfigure(encoding='utf-8')
import re
with open('KNSDC-Participant.html', 'r', encoding='utf-8') as f:
    text = f.read()

script_matches = list(re.finditer(r'<script.*?>', text, re.IGNORECASE))
close_matches = list(re.finditer(r'</script>', text, re.IGNORECASE))

for i in range(len(script_matches)):
    start = script_matches[i].start()
    end = close_matches[i].end()
    print(f"Script {i}: {start} to {end}")
