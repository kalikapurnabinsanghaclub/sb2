path = r'C:\Users\soura\OneDrive\Desktop\kalikapur\server.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

staff_api_code = """
// ─── Staff Management API (MongoDB + Memory Cloud Engine) ───
app.get('/api/staff/list', async (req, res) => {
  try {
    let list = [];
    if (db) {
      list = await db.collection('staff_credentials').find({ active: { $ne: false } }).toArray();
    }
    if (!list || list.length === 0) {
      list = [...SEED_STAFF];
    }
    const sanitized = list.map(s => ({
      email: (s.email || '').toLowerCase().trim(),
      name: s.name || '',
      role: s.role || 'monitor',
      created_at: s.created_at || s.updated_at || null
    }));
    res.json({ success: true, staff: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/staff/upsert', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    const emailNorm = String(email).trim().toLowerCase();
    const pHash = password ? crypto.createHash('sha256').update(password).digest('hex') : null;

    if (db) {
      const col = db.collection('staff_credentials');
      const updateData = {
        email: emailNorm,
        name: name || emailNorm.split('@')[0],
        role: role || 'monitor',
        active: true,
        updated_at: new Date()
      };
      if (pHash) updateData.password_hash = pHash;
      await col.updateOne({ email: emailNorm }, { $set: updateData, $setOnInsert: { created_at: new Date() } }, { upsert: true });
      console.log(`[MongoDB] Upserted staff account: ${emailNorm} (${role})`);
    }

    const state = loadState();
    if (!state.staff) state.staff = [];
    state.staff = state.staff.filter(s => s.email !== emailNorm);
    state.staff.push({ email: emailNorm, name, role, password });
    saveState(state);

    res.json({ success: true, message: 'Staff successfully saved' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/staff/delete', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    const emailNorm = String(email).trim().toLowerCase();

    if (db) {
      await db.collection('staff_credentials').deleteOne({ email: emailNorm });
      console.log(`[MongoDB] Deleted staff account: ${emailNorm}`);
    }

    const state = loadState();
    if (state.staff) {
      state.staff = state.staff.filter(s => s.email !== emailNorm);
      saveState(state);
    }

    res.json({ success: true, message: 'Staff successfully deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
"""

target = "app.get('/api/staff/validate', async (req, res) => {"
assert target in content, "target not found in server.js"
content = content.replace(target, staff_api_code + "\n" + target, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: server.js updated with staff endpoints!")
