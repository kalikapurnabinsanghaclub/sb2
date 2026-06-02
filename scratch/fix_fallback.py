import sys, re

path = r'c:\Users\sourav pc\Desktop\kalikapur\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find the `return` statement in the inline JS player generator
# `return \`\n<div style="margin-top: 20px; position:relative; width:100%; padding-bottom:56.25%; border-radius:12px; overflow:hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.3); background: #000;">\n  <iframe src="${embedUrl}" ...></iframe>\n</div>\`;`

# We have two instances of return strings in the IIFE:
# 1. for <iframe codes
# 2. for URLs
# It's easier to just replace the closing `</div>`;` of the return strings.
# The exact string is `</iframe>\n</div>\`;` and ` border:none;"')}</div>\`;`

old_html1 = r'</iframe>\n</div>`;'
new_html1 = r'</iframe>\n</div>\n<div style="margin-top: 12px; text-align: center;"><a href="${input.replace(/\'/g, \'&apos;\').replace(/\"/g, \'&quot;\')}" target="_blank" style="color: rgba(255,255,255,0.95); text-decoration: underline; font-size: 0.9rem; font-weight: 700; letter-spacing: 0.5px; transition: color 0.2s;" onmouseover="this.style.color=\'#fff\'" onmouseout="this.style.color=\'rgba(255,255,255,0.95)\'">⚠️ Not playing? Click here to watch directly</a></div>`;'

old_html2 = r'border:none;"\')}</div>`;'
new_html2 = r'border:none;"\')}</div>\n<div style="margin-top: 12px; text-align: center;"><a href="${input.replace(/\'/g, \'&apos;\').replace(/\"/g, \'&quot;\')}" target="_blank" style="color: rgba(255,255,255,0.95); text-decoration: underline; font-size: 0.9rem; font-weight: 700; letter-spacing: 0.5px; transition: color 0.2s;" onmouseover="this.style.color=\'#fff\'" onmouseout="this.style.color=\'rgba(255,255,255,0.95)\'">⚠️ Not playing? Click here to watch directly</a></div>`;'


content = content.replace(old_html1, new_html1)
content = content.replace(old_html2, new_html2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fallback direct link added successfully!")
