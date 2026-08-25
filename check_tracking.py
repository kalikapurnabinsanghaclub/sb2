import sys; sys.stdout.reconfigure(encoding='utf-8')
with open('KNSDC-Participant.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('active tracking map')
print(text[idx-200:idx+200])
