import sys; sys.stdout.reconfigure(encoding='utf-8')
with open('scratch/c57944e_full.html', 'r', encoding='utf-16') as f:
    text = f.read()

script_body = text[51435:114281]
import re
matches = re.findall(r'</[a-zA-Z]+>', script_body)
print('Closing tags found in script body:')
for m in set(matches):
    print(m)
