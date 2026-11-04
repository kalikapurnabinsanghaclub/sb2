import re

with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8", errors="ignore") as f:
    mon = f.read()

# Let's inspect Helpdesk & SOS logic (Script 12 was identified earlier as HELPDESK LOGIC)
lines = mon.split("\n")
helpdesk_lines = []
capture = False
for i, line in enumerate(lines):
    if "HELPDESK LOGIC" in line:
        capture = True
    if capture and len(helpdesk_lines) < 250:
        helpdesk_lines.append(f"{i+1}: {line}")

print("=== Helpdesk lines preview ===")
print("\n".join(helpdesk_lines[:60]))

# Search for SOS handlers
sos_matches = [l for l in lines if "sos" in l.lower() or "helpdesk" in l.lower()]
print(f"\nTotal SOS/Helpdesk lines: {len(sos_matches)}")
for l in sos_matches[:20]:
    print(" ", l.strip()[:100])
