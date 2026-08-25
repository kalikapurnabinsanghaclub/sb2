import sys; sys.stdout.reconfigure(encoding='utf-8')
with open('scratch/58cd9f3_file.html', 'r', encoding='utf-16') as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    if 'id="arcade-game-modal"' in l:
        for j in range(i-2, i+40):
            print(f'{j+1}: {lines[j].strip()}')
        break
