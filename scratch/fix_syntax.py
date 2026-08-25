import sys

path = r'c:\Users\sourav pc\Desktop\kalikapur\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The bad string I injected:
# `${input.replace(/\'/g, \'&apos;\').replace(/\"/g, \'&quot;\')}`
# and
# `this.style.color=\'#fff\'`

bad1 = r"${input.replace(/\'/g, \'&apos;\').replace(/\"/g, \'&quot;\')}"
good1 = r"${input.replace(/'/g, '&apos;').replace(/\"/g, '&quot;')}"

bad2 = r"onmouseover=\"this.style.color=\'#fff\'\""
good2 = r"onmouseover=\"this.style.color='#fff'\""

bad3 = r"onmouseout=\"this.style.color=\'rgba(255,255,255,0.95)\'\""
good3 = r"onmouseout=\"this.style.color='rgba(255,255,255,0.95)'\""

content = content.replace(bad1, good1)
content = content.replace(bad2, good2)
content = content.replace(bad3, good3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed syntax error")
