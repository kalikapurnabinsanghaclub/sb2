import sys; sys.stdout.reconfigure(encoding='utf-8')
with open('scratch/game_script_3.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
start = -1
end = -1
for i, l in enumerate(lines):
    if 'KNSDC ARCADE GAMES ENGINE' in l:
        start = i
    if start != -1 and 'function runBrickGameEngine' in l:
        # scan for end of function
        for j in range(i, len(lines)):
            if lines[j].strip() == '}' and lines[j-1].strip() == '}':
                end = j + 1
                break
        if end != -1: break

if start != -1 and end != -1:
    with open('scratch/pure_arcade_engine.js', 'w', encoding='utf-8') as f:
        f.writelines(lines[start:end])
    print(f'Extracted pure engine! {end-start} lines.')
else:
    print(f'Failed: start {start}, end {end}')
