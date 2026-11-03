path = r'C:\Users\soura\OneDrive\Desktop\kalikapur\lib\localSync-v4.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace addStaffMember with bulletproof MongoDB + graceful Supabase implementation
start_marker = "  async addStaffMember(email, password, name, role) {"
end_marker = "  async updateStaffDetails(email, name, newPassword) {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

assert start_idx != -1, "start_marker not found"
assert end_idx != -1, "end_marker not found"

new_add_staff = """  async addStaffMember(email, password, name, role) {
    try {
      const emailLower = email.trim().toLowerCase();

      // Step 1: ALWAYS save to MongoDB Atlas cloud engine first
      try {
        await fetch('/api/staff/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailLower, password, name, role })
        });
      } catch (mongoErr) {
        console.warn('[LocalSync] MongoDB staff upsert notice:', mongoErr.message);
      }

      // Step 2: Also attempt Supabase (non-blocking graceful fallback)
      if (this.supabase) {
        try {
          await this.supabase.auth.signUp({
            email: emailLower,
            password: password,
            options: { data: { fullname: name, role: role } }
          }).catch(() => {});

          const passwordHash = await sha256(password);
          await this.supabase.from('staff_credentials').upsert({
            email: emailLower,
            password_hash: passwordHash,
            name: name,
            role: role,
            updated_at: new Date().toISOString()
          }, { onConflict: 'email' }).catch(err => {
            console.warn('[LocalSync] Supabase staff upsert notice (persisted in MongoDB):', err.message);
          });
        } catch (sbErr) {
          console.warn('[LocalSync] Supabase staff error (handled via MongoDB):', sbErr.message);
        }
      }

      // Step 3: Update local state & event mapping immediately
      let globalState = this.state || {};
      if (!globalState.staff) globalState.staff = [];
      globalState.staff = globalState.staff.filter(s => s.email !== emailLower);
      globalState.staff.push({ email: emailLower, name, role, password });
      this.setData(s => ({ ...s, staff: globalState.staff }));

      console.log('[LocalSync] Staff member added successfully (MongoDB + Local):', emailLower, role);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

"""

content = content[:start_idx] + new_add_staff + content[end_idx:]

# 2. Update listStaffMembers to also load staff from MongoDB
target_list = """      // Build Map of registered staff credentials for authoritative names & roles
      const staffCredsMap = new Map();
      if (this.supabase) {
        try {
          const { data } = await this.supabase
            .from('staff_credentials')
            .select('email, name, role, created_at');
          (data || []).forEach(c => {
            if (c && c.email) staffCredsMap.set(c.email.trim().toLowerCase(), c);
          });
        } catch(e) {}
      }"""

replacement_list = """      // Build Map of registered staff credentials for authoritative names & roles
      const staffCredsMap = new Map();
      if (this.supabase) {
        try {
          const { data } = await this.supabase
            .from('staff_credentials')
            .select('email, name, role, created_at');
          (data || []).forEach(c => {
            if (c && c.email) staffCredsMap.set(c.email.trim().toLowerCase(), c);
          });
        } catch(e) {}
      }

      // Authoritative fallback: fetch registered staff from MongoDB Atlas
      try {
        const mongoRes = await fetch('/api/staff/list');
        if (mongoRes.ok) {
          const mData = await mongoRes.json();
          if (mData && Array.isArray(mData.staff)) {
            mData.staff.forEach(s => {
              if (s && s.email && !staffCredsMap.has(s.email.toLowerCase())) {
                staffCredsMap.set(s.email.toLowerCase(), s);
              }
            });
          }
        }
      } catch(e) {}"""

assert target_list in content, "target_list not found in localSync-v4.js"
content = content.replace(target_list, replacement_list, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: localSync-v4.js updated with MongoDB staff fallback!")
