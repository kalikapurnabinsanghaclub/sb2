path = r'C:\Users\soura\OneDrive\Desktop\kalikapur\server.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update ws.on('message') to forward audio_control and stage_update
old_ws = """      if (msg.type === 'broadcast' || msg.type === 'state_update' || msg.type === 'sql_watch' || msg.type === 'score_update') {
        broadcastToAllClients(msg, ws);
      }"""

new_ws = """      if (msg.type === 'broadcast' || msg.type === 'state_update' || msg.type === 'sql_watch' || msg.type === 'score_update' || msg.type === 'audio_control' || msg.type === 'stage_update') {
        broadcastToAllClients(msg, ws);
      }"""

assert old_ws in content, "old_ws not found in server.js"
content = content.replace(old_ws, new_ws, 1)

# 2. Add stage endpoints
stage_endpoints = """

// ══════════════════════════════════════════════════════════════
// 🎭 LIVE STAGE & QUEUE SYNC ENGINE (MONGODB + WEBSOCKET)
// ══════════════════════════════════════════════════════════════

app.get('/api/stage/state', async (req, res) => {
  try {
    if (db) {
      const doc = await db.collection('stage_state').findOne({ id: 'global_stage_state' });
      if (doc) return res.json({ status: 'ok', data: doc });
    }
    const state = loadState();
    return res.json({
      status: 'ok',
      data: {
        currentOnStage: state.currentOnStage || null,
        venueStageState: state.venueStageState || {},
        stageTransitionAt: state.stageTransitionAt || null
      }
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/stage/update', async (req, res) => {
  try {
    const { currentOnStage, venueId, stageStatus, transitionAt, queueOrder, participantId, queuedAt, roundPresence, updates } = req.body;
    const now = transitionAt || Date.now();
    const venKey = venueId ? String(venueId) : 'global';

    if (db) {
      const col = db.collection('stage_state');
      const updateDoc = {
        $set: {
          lastUpdated: now,
          ...(currentOnStage !== undefined ? { currentOnStage } : {}),
          ...(stageStatus !== undefined ? { stageStatus } : {}),
          ...(now ? { stageTransitionAt: now } : {})
        }
      };
      if (venueId || currentOnStage !== undefined) {
        updateDoc.$set[`venueStageState.${venKey}`] = {
          currentOnStage: currentOnStage || null,
          stageStatus: stageStatus || 'active',
          transitionAt: now
        };
      }
      await col.updateOne({ id: 'global_stage_state' }, updateDoc, { upsert: true });

      // Save participant queue details to MongoDB
      if (participantId && (queueOrder !== undefined || stageStatus !== undefined)) {
        const pCol = db.collection('stage_queue');
        await pCol.updateOne(
          { id: String(participantId) },
          { 
            $set: { 
              id: String(participantId),
              ...(queueOrder !== undefined ? { queueOrder } : {}),
              ...(stageStatus !== undefined ? { stageStatus } : {}),
              ...(queuedAt !== undefined ? { queuedAt } : {}),
              ...(roundPresence !== undefined ? { roundPresence } : {}),
              updatedAt: now
            }
          },
          { upsert: true }
        );
      }
    }

    // Save to local sync_state.json
    const state = loadState();
    if (currentOnStage !== undefined) state.currentOnStage = currentOnStage;
    if (now) state.stageTransitionAt = now;
    if (!state.venueStageState) state.venueStageState = {};
    state.venueStageState[venKey] = {
      currentOnStage: currentOnStage || null,
      stageStatus: stageStatus || 'active',
      transitionAt: now
    };
    saveState(state);

    // Broadcast live stage event to all connected clients (Monitors, Hosts, Participants)
    broadcastToAllClients({
      type: 'stage_update',
      payload: {
        currentOnStage,
        venueId,
        venKey,
        stageStatus,
        transitionAt: now,
        participantId,
        queueOrder,
        queuedAt,
        roundPresence,
        updates: updates || []
      }
    });

    return res.json({ status: 'ok', success: true });
  } catch (err) {
    console.error('[API stage/update] error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});
"""

insert_target = """    res.json({ success: true, message: `Deleted transaction ${id}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});"""

assert insert_target in content, "insert_target not found in server.js"
content = content.replace(insert_target, insert_target + stage_endpoints, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: server.js patched with stage engine and WS relay!")
