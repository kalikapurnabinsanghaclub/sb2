import sys; sys.stdout.reconfigure(encoding='utf-8')
with open('KNSDC-Participant.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i in range(2270, 2300):
    print(f'{i+1}: {lines[i].rstrip()}')
