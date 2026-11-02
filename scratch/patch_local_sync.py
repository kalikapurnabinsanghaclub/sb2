import sys

path = r'C:\Users\soura\OneDrive\Desktop\kalikapur\lib\localSync-v4.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update updateParticipant to persist queueOrder, queuedAt, roundPresence, waAlertSent
target_1 = """      if (pObj.comment !== undefined) { dbObj.comment = pObj.comment; hasDbUpdates = true; }"""
replacement_1 = """      if (pObj.comment !== undefined) { dbObj.comment = pObj.comment; hasDbUpdates = true; }
      if (pObj.queueOrder !== undefined || pObj.queuedAt !== undefined || pObj.roundPresence !== undefined || pObj.waAlertSent !== undefined) {
        if (!dbObj.form_answers) {
          const currentPart = (this.state.participants || []).find(p => String(p.id) === String(id));
          dbObj.form_answers = currentPart ? { ...(currentPart.formAnswers || {}) } : {};
        }
        if (pObj.queueOrder !== undefined) dbObj.form_answers._queueOrder = pObj.queueOrder;
        if (pObj.queuedAt !== undefined) dbObj.form_answers._queuedAt = pObj.queuedAt;
        if (pObj.roundPresence !== undefined) dbObj.form_answers._roundPresence = pObj.roundPresence;
        if (pObj.waAlertSent !== undefined) dbObj.form_answers._waAlertSent = pObj.waAlertSent;
        pObj.formAnswers = { ...dbObj.form_answers };
        hasDbUpdates = true;
      }"""

assert target_1 in content, "target_1 not found"
content = content.replace(target_1, replacement_1, 1)

# Add stage/update fetch call inside updateParticipant
target_1b = """      // 2. Instant Realtime Broadcast to all connected clients (<50ms)
      if (this.broadcastChannel) {
        this.broadcastChannel.send({
          type: 'broadcast',
          event: 'state_update',
          payload: {
            participantsUpdate: [{ id, ...pObj }]
          }
        }).catch(e => console.warn('[updateParticipant] broadcast error:', e));
      }"""

replacement_1b = """      // 2. Instant Realtime Broadcast to all connected clients (<50ms)
      if (this.broadcastChannel) {
        this.broadcastChannel.send({
          type: 'broadcast',
          event: 'state_update',
          payload: {
            participantsUpdate: [{ id, ...pObj }]
          }
        }).catch(e => console.warn('[updateParticipant] broadcast error:', e));
      }
      if (pObj.stageStatus !== undefined || pObj.queueOrder !== undefined) {
        fetch('/api/stage/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: id,
            stageStatus: pObj.stageStatus,
            queueOrder: pObj.queueOrder,
            queuedAt: pObj.queuedAt,
            roundPresence: pObj.roundPresence
          })
        }).catch(() => {});
      }"""

assert target_1b in content, "target_1b not found"
content = content.replace(target_1b, replacement_1b, 1)

# 2. Update loadParticipants to read _queueOrder, _queuedAt, _roundPresence
target_2 = """          queueOrder: isLocallyLocked && existing.queueOrder !== undefined ? existing.queueOrder : (existing.queueOrder !== undefined ? existing.queueOrder : null),
          queuedAt: isLocallyLocked && existing.queuedAt !== undefined ? existing.queuedAt : (existing.queuedAt || null),"""

replacement_2 = """          queueOrder: isLocallyLocked && existing.queueOrder !== undefined ? existing.queueOrder : (existing.queueOrder !== undefined ? existing.queueOrder : ((formAns && typeof formAns._queueOrder === 'number') ? formAns._queueOrder : null)),
          queuedAt: isLocallyLocked && existing.queuedAt !== undefined ? existing.queuedAt : (existing.queuedAt || ((formAns && formAns._queuedAt) ? Number(formAns._queuedAt) : null)),"""

assert target_2 in content, "target_2 not found"
content = content.replace(target_2, replacement_2, 1)

target_2b = """roundPresence: isLocallyLocked && existing.roundPresence ? existing.roundPresence : (existing.roundPresence || null),"""
replacement_2b = """roundPresence: isLocallyLocked && existing.roundPresence ? existing.roundPresence : (existing.roundPresence || ((formAns && formAns._roundPresence) ? formAns._roundPresence : null)),"""

assert target_2b in content, "target_2b not found"
content = content.replace(target_2b, replacement_2b, 1)

# 3. Add audio_control and stage_update handling in initNativeWsSync
target_3 = """          } else if (msg.type === 'score_updated' || msg.type === 'score_update') {
            window.dispatchEvent(new CustomEvent('knsdc:score_received', { detail: msg }));
          }"""

replacement_3 = """          } else if (msg.type === 'score_updated' || msg.type === 'score_update') {
            window.dispatchEvent(new CustomEvent('knsdc:score_received', { detail: msg }));
          } else if (msg.type === 'audio_control' && msg.cmd) {
            this.setData(state => ({ ...state, remoteAudioCommand: msg.cmd }));
            window.dispatchEvent(new CustomEvent('knsdc:audio_control', { detail: msg.cmd }));
          } else if (msg.type === 'stage_update' && msg.payload) {
            this.setData(state => {
              const currentParts = [...(state.participants || [])];
              if (msg.payload.updates && Array.isArray(msg.payload.updates)) {
                msg.payload.updates.forEach(upd => {
                  const idx = currentParts.findIndex(p => String(p.id) === String(upd.id));
                  if (idx !== -1) currentParts[idx] = { ...currentParts[idx], ...upd };
                });
              }
              if (msg.payload.participantId) {
                const idx = currentParts.findIndex(p => String(p.id) === String(msg.payload.participantId));
                if (idx !== -1) {
                  if (msg.payload.stageStatus !== undefined) currentParts[idx].stageStatus = msg.payload.stageStatus;
                  if (msg.payload.queueOrder !== undefined) currentParts[idx].queueOrder = msg.payload.queueOrder;
                  if (msg.payload.queuedAt !== undefined) currentParts[idx].queuedAt = msg.payload.queuedAt;
                }
              }
              const venKey = msg.payload.venKey || (msg.payload.venueId ? String(msg.payload.venueId) : 'global');
              const nextVen = { ...(state.venueStageState || {}) };
              nextVen[venKey] = {
                currentOnStage: msg.payload.currentOnStage,
                stageStatus: msg.payload.stageStatus || 'active',
                transitionAt: msg.payload.transitionAt || Date.now()
              };
              return {
                ...state,
                participants: currentParts,
                currentOnStage: msg.payload.currentOnStage !== undefined ? msg.payload.currentOnStage : state.currentOnStage,
                stageTransitionAt: msg.payload.transitionAt || state.stageTransitionAt,
                venueStageState: nextVen
              };
            });
            window.dispatchEvent(new CustomEvent('knsdc:stage_updated', { detail: msg.payload }));
          }"""

assert target_3 in content, "target_3 not found"
content = content.replace(target_3, replacement_3, 1)

# 4. stagePush notification to /api/stage/update
target_4 = """      this.broadcastChannel.send({
        type: 'broadcast',
        event: 'state_update',
        payload: {
          stageTransitionAt: now,
          currentOnStage: participantId,
          venueStageState: this.state.venueStageState,
          participantsUpdate: pUpdates
        }
      }).catch(e => console.warn('[stagePush] broadcast error:', e));"""

replacement_4 = """      this.broadcastChannel.send({
        type: 'broadcast',
        event: 'state_update',
        payload: {
          stageTransitionAt: now,
          currentOnStage: participantId,
          venueStageState: this.state.venueStageState,
          participantsUpdate: pUpdates
        }
      }).catch(e => console.warn('[stagePush] broadcast error:', e));

      fetch('/api/stage/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentOnStage: participantId,
          venueId: venueId,
          stageStatus: 'active',
          transitionAt: now,
          updates: pUpdates
        })
      }).catch(() => {});"""

assert target_4 in content, "target_4 not found"
content = content.replace(target_4, replacement_4, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS: localSync-v4.js patched perfectly!')
