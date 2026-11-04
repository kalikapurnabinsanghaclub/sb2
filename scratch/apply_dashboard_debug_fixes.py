import os

def patch_files():
    # 1. Patch localSync-v4.js
    ls_path = r"C:\Users\soura\.gemini\antigravity\scratch\sb2\lib\localSync-v4.js"
    with open(ls_path, "rb") as f:
        ls_data = f.read()

    # Add snul to changedParts check
    target_snul = b'oldP.queueOrder !== p.queueOrder ||\r\n          oldP.queuedAt !== p.queuedAt) {'
    repl_snul = (
        b'oldP.queueOrder !== p.queueOrder ||\r\n'
        b'          oldP.queuedAt !== p.queuedAt ||\r\n'
        b'          oldP.snul !== p.snul ||\r\n'
        b'          oldP.snulResolved !== p.snulResolved) {'
    )
    if target_snul in ls_data:
        ls_data = ls_data.replace(target_snul, repl_snul, 1)
        print("[localSync] Added snul check to changedParts")
    else:
        print("[localSync] Warning: target_snul not found!")

    # Add snul fields to changedParts.push
    target_push = b'scores: p.scores,\r\n          roundScores: p.roundScores,'
    repl_push = (
        b'scores: p.scores,\r\n'
        b'          roundScores: p.roundScores,\r\n'
        b'          snul: p.snul,\r\n'
        b'          snulResolved: p.snulResolved,'
    )
    if target_push in ls_data:
        ls_data = ls_data.replace(target_push, repl_push, 1)
        print("[localSync] Added snul fields to changedParts payload")
    else:
        print("[localSync] Warning: target_push not found!")

    # Add flashMessage to broadcast assembly
    target_flash_send = b'broadcastPayload.chatMessages = this.state.chatMessages;\r\n      shouldBroadcast = true;\r\n    }'
    repl_flash_send = (
        b'broadcastPayload.chatMessages = this.state.chatMessages;\r\n'
        b'      shouldBroadcast = true;\r\n'
        b'    }\r\n\r\n'
        b'    if (JSON.stringify(this.state.flashMessage) !== JSON.stringify(lastSaved.flashMessage)) {\r\n'
        b'      broadcastPayload.flashMessage = this.state.flashMessage;\r\n'
        b'      shouldBroadcast = true;\r\n'
        b'    }'
    )
    if target_flash_send in ls_data:
        ls_data = ls_data.replace(target_flash_send, repl_flash_send, 1)
        print("[localSync] Added flashMessage to broadcast assembly")
    else:
        print("[localSync] Warning: target_flash_send not found!")

    # Add flashMessage to broadcast receive
    target_flash_recv = b'if (payload.chatMessages && Array.isArray(payload.chatMessages)) {'
    repl_flash_recv = (
        b'if (payload.flashMessage !== undefined) {\r\n'
        b'      this.state.flashMessage = payload.flashMessage;\r\n'
        b'      changed = true;\r\n'
        b'    }\r\n\r\n'
        b'    if (payload.chatMessages && Array.isArray(payload.chatMessages)) {'
    )
    if target_flash_recv in ls_data:
        ls_data = ls_data.replace(target_flash_recv, repl_flash_recv, 1)
        print("[localSync] Added flashMessage to broadcast receive")
    else:
        print("[localSync] Warning: target_flash_recv not found!")

    with open(ls_path, "wb") as f:
        f.write(ls_data)

    # 2. Patch KNSDC-Monitor.html
    mon_path = r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html"
    with open(mon_path, "r", encoding="utf-8") as f:
        mon_text = f.read()

    # Patch onStage resolution in renderStageView
    t_stage = "const onStage = data.find(p => p.stageStatus === 'on-stage' && getRoundPresent(p, p.round));"
    r_stage = "const onStage = data.find(p => p.stageStatus === 'on-stage') || data.find(p => String(p.id) === String(currentOnStage));"
    if t_stage in mon_text:
        mon_text = mon_text.replace(t_stage, r_stage, 1)
        print("[Monitor] Patched onStage resolution in renderStageView")
    else:
        print("[Monitor] Warning: t_stage not found!")

    # Patch upcoming-list empty queue placeholder in renderStageView
    t_up = "document.getElementById('upcoming-list').innerHTML = upcoming.map((p, i) => {"
    idx_up = mon_text.find(t_up)
    if idx_up != -1:
        # Find the closing .join('');
        idx_join = mon_text.find("}).join('');", idx_up)
        if idx_join != -1:
            full_target = mon_text[idx_up : idx_join + len("}).join('');")]
            full_repl = full_target.replace(
                "}).join('');",
                "}).join('') || '<div style=\"color:var(--text-muted);font-size:12px;padding:16px;text-align:center;font-family:var(--fm);\">No participants waiting in queue</div>';"
            )
            mon_text = mon_text.replace(full_target, full_repl, 1)
            print("[Monitor] Added empty queue fallback placeholder to upcoming-list")
        else:
            print("[Monitor] Warning: idx_join not found!")
    else:
        print("[Monitor] Warning: idx_up not found!")

    # Patch autoPromoteTopN dash-promo-from null safety
    t_promo = "const fromRound = document.getElementById('dash-promo-from').value;"
    r_promo = "const _fromEl = document.getElementById('dash-promo-from');\n  const fromRound = _fromEl ? _fromEl.value : 'audition';"
    if t_promo in mon_text:
        mon_text = mon_text.replace(t_promo, r_promo, 1)
        print("[Monitor] Patched dash-promo-from null check in autoPromoteTopN")
    else:
        print("[Monitor] Warning: t_promo not found!")

    with open(mon_path, "w", encoding="utf-8") as f:
        f.write(mon_text)

    print("All dashboard debugging fixes applied successfully!")

if __name__ == "__main__":
    patch_files()
