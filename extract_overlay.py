with open('scratch/58cd9f3_file.html', 'r', encoding='utf-16') as f:
    lines = f.readlines()
    
overlay_start = -1
overlay_end = -1
for i, l in enumerate(lines):
    if 'id="game-overlay"' in l:
        overlay_start = i - 1
    if overlay_start != -1 and i > overlay_start + 5 and 'id="arcade-game-modal"' in l:
        # found the modal right after the overlay
        for j in range(i, len(lines)):
            if '</div>' in lines[j] and j > i + 15: # roughly end of modal
                pass
            if '<!-- Detailed Results Card -->' in lines[j] or '<!-- Form Box -->' in lines[j] or 'window.scrollTo' in lines[j]:
                overlay_end = j
                break
        break
        
if overlay_start != -1 and overlay_end != -1:
    with open('scratch/arcade_overlay.html', 'w', encoding='utf-8') as f:
        f.writelines(lines[overlay_start:overlay_end])
    print(f'Wrote overlay from {overlay_start} to {overlay_end}')
else:
    print(f'Failed: {overlay_start} to {overlay_end}')
