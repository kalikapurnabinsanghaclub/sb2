import sys
import re

path = r'c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Admin.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'function renderStaffMatrix\(s\) \{[\s\S]*?\}\n\nlet pieChartInstance', re.DOTALL)

def replacer(match):
    return "let pieChartInstance"

if pattern.search(content):
    content = pattern.sub(replacer, content)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully removed renderStaffMatrix function")
else:
    print("Could not find renderStaffMatrix function")
