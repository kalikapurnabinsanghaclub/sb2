import re

with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8", errors="ignore") as f:
    mon = f.read()
with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js", "r", encoding="utf-8", errors="ignore") as f:
    ls = f.read()

# Check SOS alert bar and alert sound
sos_bar = "sos-alert-bar" in mon
sos_sound = "staffAudio" in mon
print("sos-alert-bar present in HTML:", sos_bar)
print("staffAudio present in HTML:", sos_sound)

# Check DOM elements used in renderHelpdesk and SOS
dom_checks = [
    'helpdesk-event-badge',
    'helpdesk-user-list',
    'helpdesk-chat-box',
    'helpdesk-input',
    'sos-alert-bar',
    'sos-alert-text',
    'sos-dismiss-btn',
    'helpdesk-toast-container',
    'float-chat-panel'
]

for dom_id in dom_checks:
    print(f"DOM id '{dom_id}': in HTML = {'id=\"' + dom_id + '\"' in mon or 'id=\'' + dom_id + '\'' in mon}")

# Check incoming SOS handlers
sos_handlers = re.findall(r'function\s+([a-zA-Z0-9_]*sos[a-zA-Z0-9_]*)\s*\(', mon, re.I)
print("SOS functions:", sos_handlers)

# Find where knsdc:score_received is dispatched or used
print("Score listeners & dispatch:")
for m in re.finditer(r'knsdc:score_received', mon + ls):
    print("Found knsdc:score_received")

# Find where knsdc:stage_updated is dispatched or used
print("Stage listeners & dispatch:")
for m in re.finditer(r'knsdc:stage_updated', mon + ls):
    print("Found knsdc:stage_updated")

# Find where knsdc:audio_control is dispatched or used
print("Audio listeners & dispatch:")
for m in re.finditer(r'knsdc:audio_control', mon + ls):
    print("Found knsdc:audio_control")
