import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('c:/Users/sourav pc/Desktop/kalikapur/KNSDC-Admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- modal definitions ---")
for i, line in enumerate(lines):
    if 'class="modal"' in line or 'class="modal-box"' in line or 'id="create-event-modal"' in line or 'id="edit-event-modal"' in line:
        print(f"  Line {i+1}: {line.strip()[:120]}")
