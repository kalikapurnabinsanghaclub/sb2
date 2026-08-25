import sys; sys.stdout.reconfigure(encoding='utf-8')
import re
with open('scratch/58cd9f3_file.html', 'r', encoding='utf-16') as f:
    text = f.read()
    
# Extract JS
# Find start of engine
idx = text.find('let activeGameMode = null;')
if idx != -1:
    # find end
    # runBrickGameEngine is the last function
    end_idx = text.find('function runBrickGameEngine()')
    # scan for end of runBrickGameEngine
    loop_call = text.find('loop();', end_idx)
    end_bracket = text.find('}', loop_call)
    
    js = text[idx:end_bracket+1]
    
    # check syntax
    with open('scratch/clean_arcade.js', 'w', encoding='utf-8') as f:
        f.write('// ARCADE ENGINE\n')
        f.write(js)
        f.write('\n')
    print('Extracted JS successfully')
