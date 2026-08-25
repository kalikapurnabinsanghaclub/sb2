import sys; sys.stdout.reconfigure(encoding='utf-8')
with open('KNSDC-Participant.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('win.document.write(')
if idx != -1:
    print(text[idx:idx+800])
