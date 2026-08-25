with open('scratch/58cd9f3_file.html', 'r', encoding='utf-16') as f:
    lines = f.readlines()
    
# Find arcade HTML block
html_start = -1
html_end = -1
for i, l in enumerate(lines):
    if 'KNSDC Arcade' in l:
        for j in range(i, -1, -1):
            if 'class="card"' in lines[j] or 'id="arcade-games-section"' in lines[j]:
                html_start = j
                break
    if html_start != -1 and i > html_start + 10 and ('<!-- Form Box -->' in l or 'id="services-section"' in l):
        html_end = i
        break

# Find arcade overlay block
overlay_start = -1
overlay_end = -1
for i, l in enumerate(lines):
    if 'id="game-overlay"' in l:
        overlay_start = i - 1
    if overlay_start != -1 and i > overlay_start + 10 and '<!-- Arcade Game Modal -->' in l:
        for j in range(i, len(lines)):
            if '</dialog>' in lines[j] or '</div>' in lines[j] and 'id="arcade-game-modal"' in lines[j]:
                overlay_end = j + 2
                break
        if overlay_end != -1: break
        
# Find arcade JS block
js_start = -1
js_end = -1
for i, l in enumerate(lines):
    if 'window.launchRhythmGame =' in l or 'let gameAnimId' in l:
        js_start = i
        # scan upwards to include any game-related vars
        for j in range(i, i-20, -1):
            if 'let activeGameMode' in lines[j]:
                js_start = j
        break

if js_start != -1:
    for i in range(js_start, len(lines)):
        if 'window.renderDetailedResults =' in lines[i] or 'function renderDetailedResults' in lines[i]:
            js_end = i
            break

print('HTML bounds:', html_start, html_end)
print('Overlay bounds:', overlay_start, overlay_end)
print('JS bounds:', js_start, js_end)

if html_start != -1 and js_start != -1:
    with open('scratch/arcade_html.html', 'w', encoding='utf-8') as f:
        f.writelines(lines[html_start:html_end])
    with open('scratch/arcade_overlay.html', 'w', encoding='utf-8') as f:
        if overlay_start != -1:
            f.writelines(lines[overlay_start:overlay_end])
    with open('scratch/arcade_js.js', 'w', encoding='utf-8') as f:
        f.writelines(lines[js_start:js_end])
    print('Successfully extracted!')
