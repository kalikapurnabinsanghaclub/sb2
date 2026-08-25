import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')
out = subprocess.check_output(['git', 'show', '58cd9f3:KNSDC-Participant.html']).decode('utf-8')
lines = out.splitlines()

start = -1
end = -1
for i, l in enumerate(lines):
    if 'KNSDC Arcade' in l:
        for j in range(i, -1, -1):
            if 'class="card"' in lines[j] or 'id="arcade-section"' in lines[j] or '<!-- ARCADE' in lines[j]:
                start = j
                break
    if start != -1 and i > start + 30 and 'class="card"' in l:
        end = i
        break

if start != -1 and end != -1:
    with open('scratch/arcade_block.html', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines[start:end]))
    print(f'Wrote {end-start} lines to scratch/arcade_block.html')
