import sys; sys.stdout.reconfigure(encoding='utf-8')
with open('scratch/58cd9f3_file.html', 'r', encoding='utf-16') as f:
    text = f.read()

import re
scripts = re.findall(r'<script.*?>\s*(.*?)\s*</script>', text, re.DOTALL | re.IGNORECASE)
for i, s in enumerate(scripts):
    if 'launchBrickGame' in s or 'activeGameMode' in s:
        with open(f'scratch/game_script_{i}.js', 'w', encoding='utf-8') as sf:
            sf.write(s)
        print(f'Wrote script {i} length {len(s)}')
