import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

files = [
    'KNSDC-Admin.html',
    'KNSDC-Host.html',
    'KNSDC-Judge.html',
    'KNSDC-Monitor.html',
    'portal.html',
    'view_immediately.html'
]

print("--- OTHER FILES SEARCH ---")
for f_name in files:
    path = os.path.join('c:/Users/sourav pc/Desktop/kalikapur', f_name)
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    scroll_to_lines = []
    nl_lines = []
    for idx, line in enumerate(lines):
        if 'scrollTo(' in line:
            scroll_to_lines.append((idx+1, line.strip()))
        if 'class="nl"' in line or "class='nl'" in line:
            nl_lines.append((idx+1, line.strip()))
            
    if scroll_to_lines or nl_lines:
        print(f"\nFile: {f_name}")
        if scroll_to_lines:
            print("  scrollTo occurrences:")
            for l_num, text in scroll_to_lines[:5]:
                print(f"    Line {l_num}: {text}")
        if nl_lines:
            print("  class='nl' occurrences:")
            for l_num, text in nl_lines[:5]:
                print(f"    Line {l_num}: {text}")
