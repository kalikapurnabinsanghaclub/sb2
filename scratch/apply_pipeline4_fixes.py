import os

def patch_localsync():
    ls_path = r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js"
    with open(ls_path, "rb") as f:
        data = f.read()

    # 1. Add sosActive & sosHistory to broadcast assembly
    target1 = b'broadcastPayload.chatMessages = this.state.chatMessages;\r\n      shouldBroadcast = true;\r\n    }'
    repl1 = (
        b'broadcastPayload.chatMessages = this.state.chatMessages;\r\n'
        b'      shouldBroadcast = true;\r\n'
        b'    }\r\n\r\n'
        b'    if (this.state.sosActive !== lastSaved.sosActive) {\r\n'
        b'      broadcastPayload.sosActive = Boolean(this.state.sosActive);\r\n'
        b'      shouldBroadcast = true;\r\n'
        b'    }\r\n\r\n'
        b'    if (this.state.sosHistory && JSON.stringify(this.state.sosHistory) !== JSON.stringify(lastSaved.sosHistory)) {\r\n'
        b'      broadcastPayload.sosHistory = this.state.sosHistory;\r\n'
        b'      shouldBroadcast = true;\r\n'
        b'    }'
    )
    if target1 in data:
        data = data.replace(target1, repl1, 1)
        print("[localSync] Patched broadcast assembly.")
    else:
        print("[localSync] Target 1 not found!")

    # 2. Add sosActive & sosHistory to broadcast receive
    target2 = b'if (payload.chatMessages && Array.isArray(payload.chatMessages)) {\r\n      this.state.chatMessages = payload.chatMessages.filter(m => !m.participantId && m.senderRole !== \'participant\' && m.role !== \'participant\');\r\n      changed = true;\r\n    }'
    repl2 = (
        b'if (payload.sosActive !== undefined && Boolean(payload.sosActive) !== Boolean(this.state.sosActive)) {\r\n'
        b'      this.state.sosActive = Boolean(payload.sosActive);\r\n'
        b'      changed = true;\r\n'
        b'    }\r\n\r\n'
        b'    if (payload.sosHistory && Array.isArray(payload.sosHistory)) {\r\n'
        b'      this.state.sosHistory = payload.sosHistory;\r\n'
        b'      changed = true;\r\n'
        b'    }\r\n\r\n'
        b'    if (payload.chatMessages && Array.isArray(payload.chatMessages)) {\r\n'
        b'      this.state.chatMessages = payload.chatMessages.filter(m => !m.participantId && m.senderRole !== \'participant\' && m.role !== \'participant\');\r\n'
        b'      changed = true;\r\n'
        b'    }'
    )
    if target2 in data:
        data = data.replace(target2, repl2, 1)
        print("[localSync] Patched broadcast receive.")
    else:
        print("[localSync] Target 2 not found!")

    # 3. Add localStorage persistence for sosActive
    target3 = b'localStorage.setItem(\'knsdc_switchStates\', JSON.stringify(this.state.switchStates));\r\n          }'
    repl3 = (
        b'localStorage.setItem(\'knsdc_switchStates\', JSON.stringify(this.state.switchStates));\r\n          }\r\n'
        b'          if (this.state.sosActive !== undefined) {\r\n'
        b'            localStorage.setItem(\'knsdc_sosActive\', String(this.state.sosActive));\r\n'
        b'          }'
    )
    if target3 in data:
        data = data.replace(target3, repl3, 1)
        print("[localSync] Patched localStorage persistence.")
    else:
        print("[localSync] Target 3 not found!")

    with open(ls_path, "wb") as f:
        f.write(data)
    print("[localSync] Saved successfully.")

if __name__ == "__main__":
    patch_localsync()
