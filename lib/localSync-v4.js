// Supabase Configuration
let supabaseUrl = "https://mmbtfbxxnprtzpzdklot.supabase.co";
let supabaseAnonKey = "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA";

// ─── SHA-256 Helper (Web Crypto API — works in all modern browsers) ───
async function sha256(text) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  console.warn("crypto.subtle unavailable (likely HTTP connection). Using plain text fallback.");
  return text;
}

function mergeHostAssignments(listA, listB = []) {
  const merged = {};
  (listA || []).forEach(h => {
    if (h && h.email) {
      merged[h.email.toLowerCase()] = h;
    }
  });
  (listB || []).forEach(h => {
    if (h && h.email) {
      const existing = merged[h.email.toLowerCase()];
      if (!existing || (h.id && existing.id && h.id > existing.id)) {
        merged[h.email.toLowerCase()] = h;
      }
    }
  });
  return Object.values(merged);
}

try {
  // Avoid parser syntax error for import.meta in classic scripts by evaluating dynamically
  const metaEnv = Function('return typeof import.meta !== "undefined" ? import.meta.env : null')();
  if (metaEnv) {
    if (metaEnv.VITE_SUPABASE_URL) supabaseUrl = metaEnv.VITE_SUPABASE_URL;
    if (metaEnv.VITE_SUPABASE_ANON_KEY) supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY;
  }
} catch (e) {
  // Ignore syntax/reference error in classic scripts
}

class LocalSync {
  constructor() {
    this.isInitialized = false;
    this.state = this.getDefaultState();
    this.subscribers = [];
    this.supabase = null;
    this.syncStateId = 'knsdc_global_sync';
    this.init();
  }

  getDefaultState() {
    return {
      activeEventId: null,
      eventName: null,
      organizer: "Kalikapur Nabin Sangha",
      liveEventToday: null,
      currentOnStage: null,
      lastUpdated: 0,
      participants: [],
      chatMessages: [],
      judges: [],
      hostAssignments: [],
      events: [],
      upcomingEvents: [],
      sosActive: false,
      sosHistory: [],
      nxtId: { reg: 1, cat: 3, venue: 3, subj: 6, agr: 1 },
      donations: [
        { id: 1, name: "Annual Fast Fund", target: 50000, raised: 32500, icon: "🙏", col: "#FF6B35" },
        { id: 2, name: "Dance Ignition Vol.7", target: 100000, raised: 78000, icon: "💃", col: "#7B2D8B" },
        { id: 3, name: "Sports Equipment", target: 30000, raised: 18000, icon: "⚽", col: "#10B981" },
        { id: 4, name: "Club Infrastructure", target: 200000, raised: 145000, icon: "🏛️", col: "#F59E0B" },
        { id: 5, name: "Youth Scholarship", target: 80000, raised: 55000, icon: "🎓", col: "#E91E8C" }
      ]
    };
  }

  init() {
    // Initialize Supabase if available
    if (window.supabase) {
      try {
        this.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log('[LocalSync] Supabase client successfully initialized.');
        this.fetchSupabaseState();
        this.subscribeSupabaseRealtime();
      } catch (err) {
        console.error('[LocalSync] Error initializing Supabase client:', err);
      }
    } else {
      console.warn('[LocalSync] Supabase client script not loaded. Running in offline/local-only mode.');
    }

    // Load from LocalStorage
    const cached = null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        this.state = { ...this.state, ...parsed };

        // Ensure default donations are initialized/migrated
        if (!this.state.donations || this.state.donations.length < 5 || !this.state.donations.some(d => d.name === "Youth Scholarship")) {
          this.state.donations = this.getDefaultState().donations;
          // localStorage.setItem('knsdc_sync', JSON.stringify(this.state));
          console.log('[LocalSync] Auto-populated default donations list.');
        }
        
        // CLEANUP: Remove legacy top-level properties to prevent cross-event leakage
        const legacyProps = ['categories', 'subjects', 'venues', 'switchStates', 'formFields'];
        legacyProps.forEach(prop => {
          if (this.state[prop]) {
             console.log(`[LocalSync] Migrating legacy ${prop} to event-specific storage...`);
             // We don't delete them yet if Task 1 is empty, but we ensure Task 1 has them.
             const t1 = this.state.events.find(e => e.id === 'task-1');
             if (t1 && (!t1[prop] || (Array.isArray(t1[prop]) && t1[prop].length === 0))) {
                t1[prop] = this.state[prop];
             }
             delete this.state[prop];
          }
        });

        // (Removed previous one-time resets to prevent accidental data wipes)
      } catch (e) {
        console.error('[LocalSync] Cache corrupt', e);
      }
    }

    // Cross-tab offline sync
    window.addEventListener('storage', (e) => {
      if (e.key === 'knsdc_sync' && e.newValue) {
        this.state = JSON.parse(e.newValue);
        this.notify();
      }
    });

    window.addEventListener('online', () => {
      console.log('[LocalSync] Internet connection restored. Syncing local state to cloud...');
      if (this.supabase && this._pendingOfflineSync) {
        this.saveStateToSupabase(this.state);
        this._pendingOfflineSync = false;
      }
      this.setData(state => ({ ...state, systemStatus: 'live' }));
    });

    window.addEventListener('offline', () => {
      console.warn('[LocalSync] Internet connection lost. Entering offline mode...');
      this.setData(state => ({ ...state, systemStatus: 'offline' }));
    });
    // Load cached switch states from localStorage immediately (synchronous, no race condition)
    try {
      const lsEventSwitches = localStorage.getItem('knsdc_eventSwitches');
      if (lsEventSwitches) {
        this.state.eventSwitches = JSON.parse(lsEventSwitches);
        console.log('[LocalSync] Restored eventSwitches from localStorage');
      }
      const lsSwitchStates = localStorage.getItem('knsdc_switchStates');
      if (lsSwitchStates) {
        this.state.switchStates = JSON.parse(lsSwitchStates);
        console.log('[LocalSync] Restored switchStates from localStorage');
      }
      const lsSystemStatus = localStorage.getItem('knsdc_systemStatus');
      if (lsSystemStatus) {
        this.state.systemStatus = lsSystemStatus;
      }
      const lsActiveEventId = localStorage.getItem('knsdc_activeEventId');
      if (lsActiveEventId) {
        this.state.activeEventId = lsActiveEventId;
      }
      const lsEventFormFields = localStorage.getItem('knsdc_eventFormFields');
      if (lsEventFormFields) {
        this.state.eventFormFields = JSON.parse(lsEventFormFields);
        console.log('[LocalSync] Restored eventFormFields from localStorage');
      }
      const lsHostAssignments = localStorage.getItem('knsdc_hostAssignments');
      if (lsHostAssignments) {
        this.state.hostAssignments = JSON.parse(lsHostAssignments);
        console.log('[LocalSync] Restored hostAssignments from localStorage');
      }
    } catch(e) { console.warn('[LocalSync] localStorage read error:', e); }

    this.notify();
  }

  async fetchSupabaseState() {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase
        .from('sync_state')
        .select('payload')
        .eq('id', this.syncStateId)
        .maybeSingle();

      if (error) {
        console.error('[LocalSync] Error fetching state from Supabase:', error);
        return;
      }

      if (data && data.payload) {
        console.log('[LocalSync] State loaded from Supabase:', data.payload);
        const fetchedState = data.payload;
        
        // Always merge switch-critical data from Supabase, regardless of lastUpdated
        if (fetchedState.eventSwitches) {
          this.state.eventSwitches = { ...(this.state.eventSwitches || {}), ...fetchedState.eventSwitches };
        }
        if (fetchedState.switchStates) {
          this.state.switchStates = { ...(this.state.switchStates || {}), ...fetchedState.switchStates };
        }
        if (fetchedState.systemStatus) {
          this.state.systemStatus = fetchedState.systemStatus;
        }
        if (fetchedState.activeEventId) {
          this.state.activeEventId = fetchedState.activeEventId;
        }
        if (fetchedState.hostAssignments) {
          this.state.hostAssignments = mergeHostAssignments(this.state.hostAssignments, fetchedState.hostAssignments);
        }
        
        // Merge the rest normally based on lastUpdated
        if (!this.state.lastUpdated || fetchedState.lastUpdated > this.state.lastUpdated) {
          // Preserve switch data and host assignments we just merged
          const preservedSwitches = this.state.eventSwitches;
          const preservedSwitchStates = this.state.switchStates;
          const preservedHostAssignments = this.state.hostAssignments;
          this.state = { ...this.state, ...fetchedState };
          // Re-apply preserved switch data (localStorage + cloud merged) and host assignments
          if (preservedSwitches) this.state.eventSwitches = preservedSwitches;
          if (preservedSwitchStates) this.state.switchStates = preservedSwitchStates;
          if (preservedHostAssignments) this.state.hostAssignments = preservedHostAssignments;
          
          if (this.state.chatMessages && this.state.chatMessages.length > 0) {
            const sixteenHoursMs = 16 * 60 * 60 * 1000;
            const now = Date.now();
            this.state.chatMessages = this.state.chatMessages.filter(msg => {
              if (!msg.timestamp) { msg.timestamp = now; return true; }
              return (now - msg.timestamp) < sixteenHoursMs;
            });
          }
        }
        
        // Also merge localStorage switch data (survives race conditions) as a fallback (cloud values take precedence)
        try {
          const lsEventSwitches = localStorage.getItem('knsdc_eventSwitches');
          if (lsEventSwitches) {
            const parsed = JSON.parse(lsEventSwitches);
            this.state.eventSwitches = { ...parsed, ...(this.state.eventSwitches || {}) };
          }
          const lsSwitchStates = localStorage.getItem('knsdc_switchStates');
          if (lsSwitchStates) {
            this.state.switchStates = { ...JSON.parse(lsSwitchStates), ...(this.state.switchStates || {}) };
          }
          const lsSystemStatus = localStorage.getItem('knsdc_systemStatus');
          if (lsSystemStatus) {
            this.state.systemStatus = this.state.systemStatus || lsSystemStatus;
          }
        } catch(e) { /* ignore parse errors */ }

        // Proactively persist the merged, cloud-dominant state back to localStorage
        try {
          if (this.state.eventSwitches) {
            localStorage.setItem('knsdc_eventSwitches', JSON.stringify(this.state.eventSwitches));
          }
          if (this.state.switchStates) {
            localStorage.setItem('knsdc_switchStates', JSON.stringify(this.state.switchStates));
          }
          if (this.state.systemStatus) {
            localStorage.setItem('knsdc_systemStatus', this.state.systemStatus);
          }
          if (this.state.activeEventId) {
            localStorage.setItem('knsdc_activeEventId', this.state.activeEventId);
          }
        } catch (e) { /* ignore localStorage write errors */ }
        
        this.isInitialized = true;
        this.notify();
      } else {
        console.log('[LocalSync] No global state found in Supabase. Initializing in database...');
        this.isInitialized = true;
        await this.saveStateToSupabase(this.state);
      }
    } catch (err) {
      console.error('[LocalSync] Exception in fetchSupabaseState:', err);
    }
  }

  async saveStateToSupabase(state) {
    if (!this.supabase) return;
    if (!this.isInitialized) {
      console.warn('[LocalSync] Ignored saveStateToSupabase: Engine not fully initialized from cloud yet.');
      return;
    }
    try {
      // Create a shallow copy and strip heavy objects to fit within Supabase Realtime 1MB payload limits
      const payloadToSave = { ...state };
      delete payloadToSave.events;
      delete payloadToSave.upcomingEvents;
      delete payloadToSave.pastEvents;
      delete payloadToSave.agreements;
      delete payloadToSave.judgeAgreements;

      const { error } = await this.supabase
        .from('sync_state')
        .upsert({
          id: this.syncStateId,
          payload: payloadToSave,
          last_updated: new Date().toISOString()
        });

      if (error) {
        console.error('[LocalSync] Error upserting sync state in Supabase:', error);
      }
    } catch (err) {
      console.error('[LocalSync] Exception in saveStateToSupabase:', err);
    }
  }

  subscribeSupabaseRealtime() {
    if (!this.supabase) return;
    try {
      // Subscribe to global sync_state changes
      this.supabase
        .channel('public:sync_state')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sync_state',
            filter: `id=eq.${this.syncStateId}`
          },
          (payload) => {
            console.log('[LocalSync] Realtime change detected in sync_state:', payload);
            if (payload.new && payload.new.payload) {
              const newState = payload.new.payload;
              // Safe merge of hostAssignments to prevent duplicates and data loss on realtime notifications
              if (newState.hostAssignments) {
                this.state.hostAssignments = mergeHostAssignments(this.state.hostAssignments, newState.hostAssignments);
              }
              if (!this.state.lastUpdated || newState.lastUpdated > this.state.lastUpdated) {
                // Preserve host assignments that were merged or newer
                const preservedHostAssignments = this.state.hostAssignments;
                this.state = { ...this.state, ...newState };
                this.state.hostAssignments = preservedHostAssignments;
                
                if (this.state.chatMessages && this.state.chatMessages.length > 0) {
                  const sixteenHoursMs = 16 * 60 * 60 * 1000;
                  const now = Date.now();
                  this.state.chatMessages = this.state.chatMessages.filter(msg => {
                    if (!msg.timestamp) { msg.timestamp = now; return true; }
                    return (now - msg.timestamp) < sixteenHoursMs;
                  });
                }
                // Proactively persist the realtime state to localStorage
                try {
                  if (this.state.eventSwitches) {
                    localStorage.setItem('knsdc_eventSwitches', JSON.stringify(this.state.eventSwitches));
                  }
                  if (this.state.switchStates) {
                    localStorage.setItem('knsdc_switchStates', JSON.stringify(this.state.switchStates));
                  }
                  if (this.state.systemStatus) {
                    localStorage.setItem('knsdc_systemStatus', this.state.systemStatus);
                  }
                  if (this.state.activeEventId) {
                    localStorage.setItem('knsdc_activeEventId', this.state.activeEventId);
                  }
                } catch (e) { /* ignore localStorage write errors */ }
                
                this.notify();
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('[LocalSync] Realtime subscription to sync_state active:', status);
        });

      // Subscribe to public_registrations database changes to support instant sync on monitor
      this.supabase
        .channel('public:public_registrations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'public_registrations'
          },
          (payload) => {
            console.log('[LocalSync] Realtime change detected in public_registrations:', payload);
            this.loadParticipants();
          }
        )
        .subscribe((status) => {
          console.log('[LocalSync] Realtime subscription to public_registrations active:', status);
        });

      // Subscribe to judge_agreements database changes to support instant sync on monitor
      this.supabase
        .channel('public:judge_agreements')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'judge_agreements'
          },
          (payload) => {
            console.log('[LocalSync] Realtime change detected in judge_agreements:', payload);
            this.loadEvents();
          }
        )
        .subscribe((status) => {
          console.log('[LocalSync] Realtime subscription to judge_agreements active:', status);
        });

      // Subscribe to scoring_subjects database changes to support instant sync on monitor/judges
      this.supabase
        .channel('public:scoring_subjects')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'scoring_subjects'
          },
          (payload) => {
            console.log('[LocalSync] Realtime change detected in scoring_subjects:', payload);
            this.loadEvents();
          }
        )
        .subscribe((status) => {
          console.log('[LocalSync] Realtime subscription to scoring_subjects active:', status);
        });
    } catch (err) {
      console.error('[LocalSync] Exception setting up realtime subscription:', err);
    }
  }

  // ─── Auth Operations ─────────────────────────────────────────────

  async signUp(email, password, fullname, role) {
    if (!this.supabase) return { success: false, error: 'Supabase client not initialized' };
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: { data: { fullname, role } }
      });
      if (error) return { success: false, error: error.message };
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ── Staff Management (Admin only) ────────────────────────────────

  async addStaffMember(email, password, name, role) {
    if (!this.supabase) return { success: false, error: 'No connection' };
    try {
      const passwordHash = await sha256(password);
      const { error } = await this.supabase
        .from('staff_credentials')
        .upsert({ email: email.trim().toLowerCase(), password_hash: passwordHash, name, role }, { onConflict: 'email' });
      if (error) return { success: false, error: error.message };
      console.log('[LocalSync] Staff member added:', email, role);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async updateStaffPassword(email, newPassword) {
    if (!this.supabase) return { success: false, error: 'No connection' };
    try {
      const passwordHash = await sha256(newPassword);
      const { error } = await this.supabase
        .from('staff_credentials')
        .update({ password_hash: passwordHash })
        .eq('email', email.trim().toLowerCase());
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deleteStaffMember(email) {
    if (!this.supabase) return { success: false, error: 'No connection' };
    try {
      const emailLower = email.trim().toLowerCase();
      // Try to delete from staff_credentials
      await this.supabase.from('staff_credentials').delete().eq('email', emailLower);
      // Try to delete from judge_credentials
      await this.supabase.from('judge_credentials').delete().eq('email', emailLower);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async listStaffMembers() {
    if (!this.supabase) return [];
    try {
      const { data, error } = await this.supabase
        .from('staff_credentials')
        .select('email, name, role, created_at')
        .order('created_at', { ascending: true });
      if (error) return [];
      return data || [];
    } catch (err) {
      return [];
    }
  }

  // Save judge credentials to Supabase judge_credentials table (called by Monitor on agreement save)
  async saveJudgeCredential(email, password, name, eventId, agreementId) {
    try {
      const passwordHash = await sha256(password);
      const record = {
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
        name,
        event_id: String(eventId || ''),
        agreement_id: agreementId || null
      };

      // Also persist in local state as backup (plain text for local-only fallback)
      const judgeAgreements = this.state.judgeAgreements || [];
      const existingIdx = judgeAgreements.findIndex(a => a.email && a.email.toLowerCase() === email.trim().toLowerCase());
      if (existingIdx >= 0) {
        judgeAgreements[existingIdx] = { ...judgeAgreements[existingIdx], email: email.trim().toLowerCase(), password, name, agreement_id: agreementId };
      } else {
        judgeAgreements.push({ email: email.trim().toLowerCase(), password, name, agreement_id: agreementId });
      }
      // (judgeAgreements are managed by Monitor separately, no push here)

      if (this.supabase) {
        const { error } = await this.supabase
          .from('judge_credentials')
          .upsert(record, { onConflict: 'email' });
        if (error) {
          console.error('[LocalSync] Failed to save judge credential to Supabase:', error.message);
          return { success: false, error: error.message };
        }
        console.log('[LocalSync] Judge credential saved to Supabase for:', email);
        return { success: true };
      }
      console.warn('[LocalSync] Supabase not available — judge credential saved in local state only.');
      return { success: true, local: true };
    } catch (err) {
      console.error('[LocalSync] Exception in saveJudgeCredential:', err);
      return { success: false, error: err.message };
    }
  }

  async signIn(email, password) {
    const emailNorm = email.trim().toLowerCase();

    // ── Step 1: Check staff_credentials table (all roles: admin, monitor, host, judge) ──
    if (this.supabase) {
      try {
        const passwordHash = await sha256(password);
        const { data: staffRow, error: staffErr } = await this.supabase
          .from('staff_credentials')
          .select('name, email, role')
          .eq('email', emailNorm)
          .eq('password_hash', passwordHash)
          .maybeSingle();

        if (!staffErr && staffRow) {
          localStorage.setItem('kns_role', staffRow.role);
          localStorage.setItem('kns_user', JSON.stringify({ name: staffRow.name, email: emailNorm }));
          console.log('[LocalSync] Authenticated via staff_credentials:', emailNorm, 'role:', staffRow.role);
          return {
            success: true,
            role: staffRow.role,
            user: { email: emailNorm, user_metadata: { fullname: staffRow.name, role: staffRow.role } }
          };
        }
      } catch (e) {
        console.warn('[LocalSync] staff_credentials check failed, continuing:', e.message);
      }
    }

    // ── Step 2: Offline fallback — check local judgeAgreements ──
    const localAgreements = (this.state && this.state.judgeAgreements) || [];
    const matchedLocal = localAgreements.find(
      a => a.email && a.password &&
           a.email.trim().toLowerCase() === emailNorm &&
           a.password === password
    );
    if (matchedLocal) {
      localStorage.setItem('kns_role', 'judge');
      localStorage.setItem('kns_user', JSON.stringify({ name: matchedLocal.name, email: emailNorm }));
      console.log('[LocalSync] Judge authenticated via local fallback:', emailNorm);
      return {
        success: true,
        role: 'judge',
        user: { email: emailNorm, user_metadata: { fullname: matchedLocal.name, role: 'judge' } }
      };
    }

    // ── Step 3: Supabase Auth fallback (super admin) ──
    if (!this.supabase) return { success: false, error: 'Invalid credentials. Please check your email and password.' };
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: 'Invalid credentials. Please check your email and password.' };
      const user = data.user;
      const role = user.user_metadata?.role || 'member';
      localStorage.setItem('kns_role', role);
      localStorage.setItem('kns_user', JSON.stringify({
        name: user.user_metadata?.fullname || email.split('@')[0],
        email: user.email
      }));
      return { success: true, user, role };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async signOut() {
    localStorage.removeItem('kns_role');
    localStorage.removeItem('kns_user');
    if (!this.supabase) return { success: true };
    try {
      await this.supabase.auth.signOut();
      return { success: true };
    } catch (err) {
      console.error('[LocalSync] Error during Supabase signout:', err);
      return { success: false, error: err.message };
    }
  }

  async getCurrentUser() {
    if (!this.supabase) return this.getLocalSession();
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (user) {
        // Keep local storage in sync
        const role = user.user_metadata?.role || 'member';
        localStorage.setItem('kns_role', role);
        localStorage.setItem('kns_user', JSON.stringify({
          name: user.user_metadata?.fullname || user.email.split('@')[0],
          email: user.email
        }));
        return user;
      }
    } catch (err) {
      console.warn('[LocalSync] Error getting Supabase user, using local session fallback:', err);
    }
    return this.getLocalSession();
  }

  getLocalSession() {
    const localUser = localStorage.getItem('kns_user');
    const localRole = localStorage.getItem('kns_role');
    if (localUser && localRole) {
      try {
        const u = JSON.parse(localUser);
        return {
          email: u.email,
          user_metadata: {
            fullname: u.name,
            role: localRole
          }
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  getData() {
    return this.state;
  }

  generateUniqueParticipantId() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const existingIds = (this.state.participants || []).map(p => p && p.id).filter(Boolean);
    let id;
    do {
      let rLetter1 = letters[Math.floor(Math.random() * letters.length)];
      let rLetter2 = letters[Math.floor(Math.random() * letters.length)];
      let rDigit1 = digits[Math.floor(Math.random() * digits.length)];
      let rDigit2 = digits[Math.floor(Math.random() * digits.length)];
      let rDigit3 = digits[Math.floor(Math.random() * digits.length)];
      let rDigit4 = digits[Math.floor(Math.random() * digits.length)];
      id = rLetter1 + rLetter2 + rDigit1 + rDigit2 + rDigit3 + rDigit4;
    } while (existingIds.includes(id));
    return id;
  }

  updateStateLocal(updater) {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    this.notify();
  }

  setData(updater) {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    
    // Ensure host assignments are deduplicated
    if (this.state.hostAssignments) {
      this.state.hostAssignments = mergeHostAssignments(this.state.hostAssignments);
    }
    
    // Auto-clean chat messages older than 16 hours
    if (this.state.chatMessages && this.state.chatMessages.length > 0) {
      const sixteenHoursMs = 16 * 60 * 60 * 1000;
      const now = Date.now();
      this.state.chatMessages = this.state.chatMessages.filter(msg => {
        if (!msg.timestamp) { msg.timestamp = now; return true; }
        return (now - msg.timestamp) < sixteenHoursMs;
      });
    }
    
    this.state.lastUpdated = Date.now();
    
    // Persist critical switch states and form fields to localStorage for instant reload recovery
    try {
      if (this.state.eventSwitches) {
        localStorage.setItem('knsdc_eventSwitches', JSON.stringify(this.state.eventSwitches));
      }
      if (this.state.switchStates) {
        localStorage.setItem('knsdc_switchStates', JSON.stringify(this.state.switchStates));
      }
      if (this.state.systemStatus) {
        localStorage.setItem('knsdc_systemStatus', this.state.systemStatus);
      }
      if (this.state.activeEventId) {
        localStorage.setItem('knsdc_activeEventId', this.state.activeEventId);
      }
      if (this.state.eventFormFields) {
        localStorage.setItem('knsdc_eventFormFields', JSON.stringify(this.state.eventFormFields));
      }
      if (this.state.hostAssignments) {
        localStorage.setItem('knsdc_hostAssignments', JSON.stringify(this.state.hostAssignments));
      }
    } catch(e) { /* localStorage full or unavailable */ }
    
    this.notify();

    if (this.supabase) {
      if (navigator.onLine) {
        this.saveStateToSupabase(this.state);
        this._pendingOfflineSync = false;
      } else {
        this._pendingOfflineSync = true;
      }
    }
  }

  // ─── Supabase Storage Upload ─────────────────────────────────────
  async uploadFile(file) {
    if (!this.supabase) {
      console.warn('[LocalSync] Supabase not available, file upload skipped.');
      return null;
    }
    try {
      // Generate unique filename to avoid collisions
      const ext = file.name.split('.').pop();
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2,9)}.${ext}`;
      
      const { data, error } = await this.supabase.storage
        .from('knsdc-registration')
        .upload(uniqueName, file, { cacheControl: '3600', upsert: false });
        
      if (error) {
        console.error('[LocalSync] File upload error:', error.message);
        return null;
      }
      
      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from('knsdc-registration')
        .getPublicUrl(uniqueName);
        
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('[LocalSync] Exception in uploadFile:', err);
      return null;
    }
  }

  // Compatibility with PythonSync updateState
  updateState(update) {
    this.setData(update);
  }
  // ════════════════════════════════════════
  // SUPABASE EVENTS CRUD
  // ════════════════════════════════════════
  
  async loadEvents() {
    try {
      const { data, error } = await this.supabase.from('events').select('*');
      if (error) {
        console.error('[LocalSync] Error loading events from Supabase', error);
        return this.state.events || [];
      }

      // Load categories, venues, judge agreements, and scoring subjects from database tables
      let catData = [];
      let venData = [];
      let agrData = [];
      let subData = [];
      try {
        const { data: cData } = await this.supabase.from('categories').select('*');
        if (cData) catData = cData;
      } catch(e) { console.error('Error loading categories:', e); }

      try {
        const { data: vData } = await this.supabase.from('venues').select('*');
        if (vData) venData = vData;
      } catch(e) { console.error('Error loading venues:', e); }

      try {
        const { data: sData } = await this.supabase.from('scoring_subjects').select('*');
        if (sData) subData = sData;
      } catch(e) { console.error('Error loading subjects:', e); }

      try {
        const { data: aData } = await this.supabase.from('judge_agreements').select('*');
        if (aData) {
          agrData = aData.map(a => ({
            id: Number(a.id) || a.id,
            name: a.name,
            phone: a.phone,
            email: a.email,
            password: a.password,
            city: a.city,
            eventId: a.event_id,
            date: a.date,
            dateUpto: a.date_upto,
            time: a.time,
            venueId: a.venue_id,
            venueName: a.venue_name,
            spec: a.spec,
            amount: Number(a.amount) || 0,
            advance: Number(a.advance) || 0,
            notes: a.notes,
            status: a.status,
            submitted: a.submitted,
            paymentReceived: a.payment_received,
            photoUrl: a.photo_url,
            agreedTc: a.agreed_tc,
            signature: a.signature
          }));
        }
      } catch(e) { console.error('Error loading judge agreements:', e); }
      
      const mappedEvents = data.map(dbEv => {
        const eventCats = catData
          .filter(c => String(c.event_id) === String(dbEv.id))
          .map(c => ({
            id: Number(c.id),
            name: c.name,
            color: c.color,
            ageMin: Number(c.age_min),
            ageMax: Number(c.age_max),
            eventId: c.event_id
          }));

        const eventSubjects = subData
          .filter(s => String(s.event_id) === String(dbEv.id))
          .map(s => ({
            id: Number(s.id) || s.id,
            name: s.name,
            maxMarks: Number(s.max_marks) || 10,
            desc: s.description || '',
            eventId: s.event_id
          }));

        const eventVens = venData
          .filter(v => String(v.event_id) === String(dbEv.id))
          .map(v => ({
            id: Number(v.id),
            name: v.name,
            location: v.location,
            eventId: v.event_id,
            capacity: Number(v.capacity) || 0,
            dates: Array.isArray(v.dates) ? v.dates : (v.dates ? [v.dates] : [])
          }));

        return {
          id: dbEv.id,
          name: dbEv.name || dbEv.title,
          org: dbEv.org || dbEv.organizer,
          type: dbEv.type || dbEv.category,
          venue: dbEv.venue,
          startDate: dbEv.start_date || dbEv.date,
          startTime: dbEv.start_time || dbEv.time,
          endDate: dbEv.end_date,
          endTime: dbEv.end_time,
          capacity: dbEv.capacity,
          banner: dbEv.banner || dbEv.image,
          description: dbEv.description,
          staff: dbEv.staff || [],
          roundSchedules: dbEv.round_schedules || {},
          formFields: dbEv.form_fields || [],
          switchStates: dbEv.switch_states || {},
          active: dbEv.active,
          createdAt: dbEv.created_at,
          categories: eventCats,
          subjects: eventSubjects,
          venues: eventVens
        };
      });

      const globalCats = catData.map(c => ({
        id: Number(c.id),
        name: c.name,
        color: c.color,
        ageMin: Number(c.age_min),
        ageMax: Number(c.age_max),
        eventId: c.event_id
      }));

      const globalVens = venData.map(v => ({
        id: Number(v.id),
        name: v.name,
        location: v.location,
        eventId: v.event_id,
        capacity: Number(v.capacity) || 0,
        dates: Array.isArray(v.dates) ? v.dates : (v.dates ? [v.dates] : [])
      }));
      
      // IMPORTANT: Preserve existing switch & form data when loading events
      // loadEvents should ONLY update events, not overwrite switch/form states
      const preservedEventSwitches = this.state.eventSwitches;
      const preservedSwitchStates = this.state.switchStates;
      const preservedSystemStatus = this.state.systemStatus;
      const preservedActiveEventId = this.state.activeEventId;
      const preservedEventFormFields = this.state.eventFormFields;
      
      this.updateStateLocal(state => ({
        ...state,
        events: mappedEvents,
        upcomingEvents: mappedEvents,
        categories: globalCats,
        venues: globalVens,
        subjects: subData.map(s => ({
          id: Number(s.id) || s.id,
          name: s.name,
          maxMarks: Number(s.max_marks) || 10,
          desc: s.description || '',
          eventId: s.event_id
        })),
        agreements: this.state.judgeAgreements || [],
        judgeAgreements: this.state.judgeAgreements || [],
        // Re-apply preserved data to prevent race condition overwrites
        eventSwitches: preservedEventSwitches || state.eventSwitches,
        switchStates: preservedSwitchStates || state.switchStates,
        systemStatus: preservedSystemStatus || state.systemStatus,
        activeEventId: preservedActiveEventId || state.activeEventId,
        eventFormFields: preservedEventFormFields || state.eventFormFields
      }));
      
      // Auto-load participants from public_registrations table too to ensure data sync
      try {
        await this.loadParticipants();
      } catch(pe) {
        console.error('[LocalSync] Error pre-loading participants:', pe);
      }
      
      return mappedEvents;
    } catch (e) {
      console.error('[LocalSync] Exception loading events', e);
      return this.state.events || [];
    }
  }

  async createEvent(eventObj) {
    try {
      const dbObj = {
        id: eventObj.id,
        name: eventObj.name,
        org: eventObj.org,
        type: eventObj.type,
        venue: eventObj.venue,
        start_date: eventObj.startDate,
        start_time: eventObj.startTime,
        end_date: eventObj.endDate,
        end_time: eventObj.endTime,
        capacity: eventObj.capacity ? parseInt(eventObj.capacity) : null,
        banner: eventObj.banner,
        description: eventObj.description,
        staff: eventObj.staff || [],
        round_schedules: eventObj.roundSchedules || {},
        active: false
      };
      
      const { error } = await this.supabase.from('events').insert([dbObj]);
      if (error) {
        console.error('[LocalSync] Error creating event in Supabase', error);
      }
      
      this.setData(state => {
        const events = [...(state.events || []), eventObj];
        const upcomingEvents = [...(state.upcomingEvents || []), eventObj];
        
        const newFormFields = { ...(state.eventFormFields || {}) };
        if (eventObj.formFields) {
          newFormFields[eventObj.id] = [...eventObj.formFields];
        }
        
        return { ...state, events, upcomingEvents, eventFormFields: newFormFields };
      });
      return true;
    } catch (e) {
      console.error('[LocalSync] Exception creating event', e);
      return false;
    }
  }

  async updateEvent(id, eventObj) {
    try {
      const dbObj = {
        name: eventObj.name,
        org: eventObj.org,
        type: eventObj.type,
        venue: eventObj.venue,
        start_date: eventObj.startDate,
        start_time: eventObj.startTime,
        end_date: eventObj.endDate,
        end_time: eventObj.endTime,
        capacity: eventObj.capacity ? parseInt(eventObj.capacity) : null,
        banner: eventObj.banner,
        description: eventObj.description,
        staff: eventObj.staff || [],
        round_schedules: eventObj.roundSchedules || {},
        updated_at: new Date().toISOString()
      };
      if (eventObj.formFields !== undefined) {
        dbObj.form_fields = typeof eventObj.formFields === 'string' ? eventObj.formFields : JSON.stringify(eventObj.formFields);
      }
      
      const { error } = await this.supabase.from('events').update(dbObj).eq('id', id);
      if (error) {
        console.error('[LocalSync] Error updating event in Supabase', error);
      }
      
      this.setData(state => {
        // Sync robustly to eventFormFields dictionary to survive loadEvents
        const newFormFields = { ...(state.eventFormFields || {}) };
        if (eventObj.formFields) {
          newFormFields[id] = [...eventObj.formFields];
        }
        
        return {
          ...state,
          eventFormFields: newFormFields,
          events: (state.events || []).map(e => String(e.id) === String(id) ? { ...e, ...eventObj } : e),
          upcomingEvents: (state.upcomingEvents || []).map(e => String(e.id) === String(id) ? { ...e, ...eventObj } : e)
        };
      });
      return true;
    } catch (e) {
      console.error('[LocalSync] Exception updating event', e);
      return false;
    }
  }

  async deleteEvent(id) {
    try {
      const { error } = await this.supabase.from('events').delete().eq('id', id);
      if (error) {
        console.error('[LocalSync] Error deleting event in Supabase', error);
      }
      
      this.setData(state => {
        return {
          ...state,
          events: (state.events || []).filter(e => String(e.id) !== String(id)),
          upcomingEvents: (state.upcomingEvents || []).filter(e => String(e.id) !== String(id))
        };
      });
      return true;
    } catch (e) {
      console.error('[LocalSync] Exception deleting event', e);
      return false;
    }
  }
  // ════════════════════════════════════════
  // SUPABASE REGISTRATIONS (PARTICIPANTS) CRUD
  // ════════════════════════════════════════
  async createParticipant(pObj) {
    try {
      const dbObj = {
        id: pObj.id,
        event_id: String(pObj.eventId || ''),
        name: pObj.name,
        phone: pObj.phone || '',
        age: pObj.age || 0,
        gender: pObj.gender || '',
        category: pObj.catId ? String(pObj.catId) : null,
        venue: pObj.venueId ? String(pObj.venueId) : null,
        reg_date: pObj.date || new Date().toISOString(),
        form_answers: pObj.formAnswers || {},
        present: pObj.present || false,
        round: pObj.round || 'audition',
        stage_status: pObj.stageStatus || 'waiting',
        is_verified: true
      };
      
      const { error } = await this.supabase.from('public_registrations').insert([dbObj]);
      if (error) console.error('[LocalSync] Error creating registration', error);
      
      this.setData(state => {
        const parts = state.participants || [];
        parts.push(pObj);
        return { ...state, participants: parts };
      });
      return true;
    } catch(e) { console.error(e); return false; }
  }

  async updateParticipant(id, pObj) {
    try {
      const dbObj = {};
      if (pObj.name !== undefined) dbObj.name = pObj.name;
      if (pObj.phone !== undefined) dbObj.phone = pObj.phone;
      if (pObj.age !== undefined) dbObj.age = pObj.age;
      if (pObj.catId !== undefined) dbObj.category = pObj.catId ? String(pObj.catId) : null;
      if (pObj.venueId !== undefined) dbObj.venue = pObj.venueId ? String(pObj.venueId) : null;
      if (pObj.present !== undefined) dbObj.present = pObj.present;
      if (pObj.round !== undefined) dbObj.round = pObj.round;
      if (pObj.stageStatus !== undefined) dbObj.stage_status = pObj.stageStatus;
      if (pObj.formAnswers !== undefined) dbObj.form_answers = pObj.formAnswers;

      const { error } = await this.supabase.from('public_registrations').update(dbObj).eq('id', id);
      if (error) console.error('[LocalSync] Error updating registration', error);
      
      this.setData(state => {
        const parts = (state.participants || []).map(p => String(p.id) === String(id) ? { ...p, ...pObj } : p);
        return { ...state, participants: parts };
      });
      return true;
    } catch(e) { console.error(e); return false; }
  }

  async deleteParticipant(id) {
    try {
      const { error } = await this.supabase.from('public_registrations').delete().eq('id', id);
      if (error) console.error('[LocalSync] Error deleting registration', error);
      
      this.setData(state => ({
        ...state,
        participants: (state.participants || []).filter(p => String(p.id) !== String(id))
      }));
      return true;
    } catch(e) { console.error(e); return false; }
  }

  async loadParticipants() {
    if (!this.supabase) return this.state.participants || [];
    try {
      const { data, error } = await this.supabase.from('public_registrations').select('*');
      if (error) {
        console.error('[LocalSync] Error loading participants from Supabase', error);
        return this.state.participants || [];
      }
      
      const mappedParts = data.map(p => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        age: Number(p.age) || 0,
        gender: p.gender || '',
        email: p.email || '',
        eventId: p.event_id,
        catId: Number(p.category) || null,
        venueId: Number(p.venue) || null,
        date: p.reg_date,
        formAnswers: p.form_answers || {},
        present: p.present !== false,
        round: p.round || 'audition',
        stageStatus: p.stage_status || 'waiting',
        scores: {},
        roundScores: {},
        regDate: p.reg_date || p.created_at
      }));
      
      this.updateStateLocal(state => ({
        ...state,
        participants: mappedParts
      }));
      return mappedParts;
    } catch (e) {
      console.error('[LocalSync] Exception loading participants', e);
      return this.state.participants || [];
    }
  }

  // ════════════════════════════════════════
  // SUPABASE CATEGORIES CRUD
  // ════════════════════════════════════════
  async createCategory(cObj) {
    try {
      const dbObj = {
        id: cObj.id,
        name: cObj.name,
        color: cObj.color,
        age_min: cObj.ageMin,
        age_max: cObj.ageMax,
        event_id: cObj.eventId
      };
      await this.supabase.from('categories').insert([dbObj]);
      this.setData(state => ({ ...state, categories: [...(state.categories || []), cObj] }));
      return true;
    } catch(e) { return false; }
  }

  async updateCategory(id, cObj) {
    try {
      const dbObj = { name: cObj.name, color: cObj.color, age_min: cObj.ageMin, age_max: cObj.ageMax };
      await this.supabase.from('categories').update(dbObj).eq('id', id);
      this.setData(state => ({
        ...state,
        categories: (state.categories || []).map(c => String(c.id) === String(id) ? { ...c, ...cObj } : c)
      }));
      return true;
    } catch(e) { return false; }
  }

  async deleteCategory(id) {
    try {
      await this.supabase.from('categories').delete().eq('id', id);
      this.setData(state => ({
        ...state,
        categories: (state.categories || []).filter(c => String(c.id) !== String(id))
      }));
      return true;
    } catch(e) { return false; }
  }

  // ════════════════════════════════════════
  // SUPABASE VENUES CRUD
  // ════════════════════════════════════════
  async createVenue(vObj) {
    try {
      const dbObj = { id: vObj.id, name: vObj.name, location: vObj.location, event_id: vObj.eventId };
      await this.supabase.from('venues').insert([dbObj]);
      this.setData(state => ({ ...state, venues: [...(state.venues || []), vObj] }));
      return true;
    } catch(e) { return false; }
  }

  async updateVenue(id, vObj) {
    try {
      const dbObj = { name: vObj.name, location: vObj.location };
      await this.supabase.from('venues').update(dbObj).eq('id', id);
      this.setData(state => ({
        ...state,
        venues: (state.venues || []).map(v => String(v.id) === String(id) ? { ...v, ...vObj } : v)
      }));
      return true;
    } catch(e) { return false; }
  }

  async deleteVenue(id) {
    try {
      await this.supabase.from('venues').delete().eq('id', id);
      this.setData(state => ({
        ...state,
        venues: (state.venues || []).filter(v => String(v.id) !== String(id))
      }));
      return true;
    } catch(e) { return false; }
  }

  // ════════════════════════════════════════
  // SUPABASE JUDGE AGREEMENTS CRUD
  // ════════════════════════════════════════
  async createAgreement(aObj) {
    try {
      const dbObj = {
        id: aObj.id,
        name: aObj.name,
        phone: aObj.phone,
        email: aObj.email,
        password: aObj.password,
        city: aObj.city,
        event_id: aObj.eventId,
        date: aObj.date,
        date_upto: aObj.dateUpto,
        time: aObj.time,
        venue_id: aObj.venueId,
        venue_name: aObj.venueName,
        spec: aObj.spec,
        amount: aObj.amount,
        advance: aObj.advance,
        notes: aObj.notes,
        status: aObj.status,
        submitted: aObj.submitted,
        payment_received: aObj.paymentReceived,
        photo_url: aObj.photoUrl,
        agreed_tc: aObj.agreedTc,
        signature: aObj.signature
      };
      const { error } = await this.supabase.from('judge_agreements').insert([dbObj]);
      if (error) console.error('[LocalSync] Error creating agreement', error);
      this.setData(state => {
        const newAgreements = [...(state.agreements || []), aObj];
        return {
          ...state,
          agreements: newAgreements,
          judgeAgreements: newAgreements
        };
      });
      return true;
    } catch(e) { console.error(e); return false; }
  }

  async updateAgreement(id, aObj) {
    try {
      const dbObj = {
        name: aObj.name,
        phone: aObj.phone,
        email: aObj.email,
        password: aObj.password,
        city: aObj.city,
        event_id: aObj.eventId,
        date: aObj.date,
        date_upto: aObj.dateUpto,
        time: aObj.time,
        venue_id: aObj.venueId,
        venue_name: aObj.venueName,
        spec: aObj.spec,
        amount: aObj.amount,
        advance: aObj.advance,
        notes: aObj.notes,
        status: aObj.status,
        submitted: aObj.submitted,
        payment_received: aObj.paymentReceived,
        photo_url: aObj.photoUrl,
        agreed_tc: aObj.agreedTc,
        signature: aObj.signature
      };
      const { error } = await this.supabase.from('judge_agreements').update(dbObj).eq('id', id);
      if (error) console.error('[LocalSync] Error updating agreement', error);
      this.setData(state => {
        const newAgreements = (state.agreements || []).map(a => String(a.id) === String(id) ? { ...a, ...aObj } : a);
        return {
          ...state,
          agreements: newAgreements,
          judgeAgreements: newAgreements
        };
      });
      return true;
    } catch(e) { console.error(e); return false; }
  }

  async deleteAgreement(id) {
    try {
      const { error } = await this.supabase.from('judge_agreements').delete().eq('id', id);
      if (error) console.error('[LocalSync] Error deleting agreement', error);
      this.setData(state => {
        const newAgreements = (state.agreements || []).filter(a => String(a.id) !== String(id));
        return {
          ...state,
          agreements: newAgreements,
          judgeAgreements: newAgreements
        };
      });
      return true;
    } catch(e) { console.error(e); return false; }
  }

  // ════════════════════════════════════════
  // SUPABASE SUBJECTS CRUD
  // ════════════════════════════════════════
  async createSubject(sObj) {
    try {
      const dbObj = {
        id: sObj.id,
        name: sObj.name,
        max_marks: sObj.maxMarks,
        description: sObj.desc,
        event_id: sObj.eventId
      };
      const { error } = await this.supabase.from('scoring_subjects').insert([dbObj]);
      if (error) console.error('[LocalSync] Error creating subject', error);
      
      this.setData(state => {
        const evIdx = state.events ? state.events.findIndex(e => String(e.id) === String(sObj.eventId)) : -1;
        if (evIdx !== -1) {
          state.events[evIdx].subjects = [...(state.events[evIdx].subjects || []), sObj];
        } else {
          state.subjects = [...(state.subjects || []), sObj];
        }
        return { ...state };
      });
      return true;
    } catch(e) { console.error(e); return false; }
  }

  async updateSubject(id, sObj) {
    try {
      const dbObj = {
        name: sObj.name,
        max_marks: sObj.maxMarks,
        description: sObj.desc,
        event_id: sObj.eventId
      };
      const { error } = await this.supabase.from('scoring_subjects').update(dbObj).eq('id', id);
      if (error) console.error('[LocalSync] Error updating subject', error);
      
      this.setData(state => {
        const evIdx = state.events ? state.events.findIndex(e => String(e.id) === String(sObj.eventId)) : -1;
        if (evIdx !== -1) {
          state.events[evIdx].subjects = (state.events[evIdx].subjects || []).map(s => String(s.id) === String(id) ? { ...s, ...sObj } : s);
        }
        state.subjects = (state.subjects || []).map(s => String(s.id) === String(id) ? { ...s, ...sObj } : s);
        return { ...state };
      });
      return true;
    } catch(e) { console.error(e); return false; }
  }

  async deleteSubject(id) {
    try {
      const { error } = await this.supabase.from('scoring_subjects').delete().eq('id', id);
      if (error) console.error('[LocalSync] Error deleting subject', error);
      
      this.setData(state => {
        if (state.events) {
          state.events.forEach(ev => {
            ev.subjects = (ev.subjects || []).filter(s => String(s.id) !== String(id));
          });
        }
        state.subjects = (state.subjects || []).filter(s => String(s.id) !== String(id));
        return { ...state };
      });
      return true;
    } catch(e) { console.error(e); return false; }
  }

  async seedDefaultSubjects(eventId) {
    const existing = this.state.subjects || [];
    if (existing.length > 0) {
      console.log('[LocalSync] Subjects already exist, skipping seed.');
      return existing;
    }

    const defaults = [
      { id: Date.now() + 1, name: 'Steps', maxMarks: 10, desc: 'Accuracy and clarity of dance steps, footwork precision and variety.', eventId },
      { id: Date.now() + 2, name: 'Tal', maxMarks: 10, desc: 'Adherence to rhythmic cycle (tala), maintaining proper beat structure and tempo.', eventId },
      { id: Date.now() + 3, name: 'Rhythm & Timing', maxMarks: 10, desc: 'Synchronization with music beats, tempo consistency and rhythmic accuracy.', eventId },
      { id: Date.now() + 4, name: 'Technique & Execution', maxMarks: 10, desc: 'Technical proficiency, body control, balance, flexibility and skill execution.', eventId },
      { id: Date.now() + 5, name: 'Costume & Presentation', maxMarks: 10, desc: 'Appropriateness of costume, stage presence, grooming and visual appeal.', eventId },
      { id: Date.now() + 6, name: 'Choreography', maxMarks: 10, desc: 'Creativity and structure of the dance composition, transitions and formations.', eventId },
      { id: Date.now() + 7, name: 'Musicality', maxMarks: 10, desc: 'Emotional connection with music, expression through movement and musical interpretation.', eventId },
      { id: Date.now() + 8, name: 'Overall Performance', maxMarks: 10, desc: 'General impression, entertainment value, confidence and audience engagement.', eventId }
    ];

    console.log('[LocalSync] Seeding', defaults.length, 'default scoring subjects...');
    for (const subj of defaults) {
      await this.createSubject(subj);
    }
    console.log('[LocalSync] ✅ Default subjects seeded successfully!');
    return defaults;
  }

  // ════════════════════════════════════════
  // SUPABASE PUBLIC MESSAGES & RATINGS
  // ════════════════════════════════════════
  async submitContactMessage(msgObj) {
    try {
      const { error } = await this.supabase.from('public_messages').insert([msgObj]);
      if (error) {
        console.error('[LocalSync] Error submitting message', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async fetchContactMessages() {
    try {
      const { data, error } = await this.supabase.from('public_messages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[LocalSync] Error fetching messages', e);
      return [];
    }
  }

  async fetchRatings() {
    try {
      const { data, error } = await this.supabase.from('public_ratings').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[LocalSync] Error fetching ratings', e);
      return [];
    }
  }

  async submitRating(ratingVal) {
    try {
      const { error } = await this.supabase.from('public_ratings').insert([{ rating: ratingVal }]);
      if (error) {
        console.error('[LocalSync] Error submitting rating', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.push(callback);
      callback(this.state);
    }
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => {
      try {
        cb(this.state);
      } catch (e) {
        console.error('[LocalSync] Subscriber error', e);
      }
    });
  }
}

// Global Synchronization Engine for Static Portals
window.LocalSync = LocalSync;
window.syncEngine = new LocalSync();
