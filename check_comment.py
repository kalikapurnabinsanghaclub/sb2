import sys; sys.stdout.reconfigure(encoding='utf-8')
with open('scratch/c57944e_full.html', 'r', encoding='utf-16') as f:
    text = f.read()

idx = text.find('window.syncEngine = new')
print(text[idx-500:idx])
