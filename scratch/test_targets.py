import re

mon_path = r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html"
with open(mon_path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

print("File size:", len(text))

# Target 1: syncAll participants line
t1 = "newState.participants = [...participants];"
print("Target 1 found:", t1 in text)

# Target 2: triggerSOS
t2 = "function triggerSOS(){"
print("Target 2 found:", t2 in text)

# Target 3: stopSOS
t3 = "function stopSOS(){"
print("Target 3 found:", t3 in text)

# Target 4: checkHelpdeskFromState
t4 = "function checkHelpdeskFromState(state) {"
print("Target 4 found:", t4 in text)

# Target 5: renderHelpdesk isLockedEvent
t5 = "if (!isLockedEvent) return; // Exclude messages from other events"
print("Target 5 found:", t5 in text)

# Target 6: renderActiveHelpdeskChat
t6 = "function renderActiveHelpdeskChat(pMsgs, participants, activeUserObj) {"
print("Target 6 found:", t6 in text)

# Target 7: sendHelpdeskReply
t7 = "function sendHelpdeskReply() {"
print("Target 7 found:", t7 in text)

# Target 8: hydrate sosActive
t8 = "sosActive = s.sosActive || false;\n  sosHistory = s.sosHistory || [];"
if not t8 in text:
    t8_crlf = "sosActive = s.sosActive || false;\r\n  sosHistory = s.sosHistory || [];"
    print("Target 8 found (CRLF):", t8_crlf in text)
else:
    print("Target 8 found (LF): True")
