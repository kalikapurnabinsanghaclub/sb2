import sys; sys.stdout.reconfigure(encoding='utf-8')
with open('scratch/c57944e_full.html', 'r', encoding='utf-16') as f:
    text = f.read()

idx = text.find('<script>')
html_before = text[:idx]

# Find all comments
import re
comments = re.findall(r'<!--.*?-->', html_before, re.DOTALL)
# Remove all valid comments from html_before
for c in comments:
    html_before = html_before.replace(c, '')

# Now see if there is a <!-- left
unclosed = html_before.find('<!--')
if unclosed != -1:
    print('Found unclosed comment!')
    print(html_before[unclosed:unclosed+200])
else:
    print('No unclosed comment found')
