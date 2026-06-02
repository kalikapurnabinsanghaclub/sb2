// Supabase Configuration
let supabaseUrl = "https://mmbtfbxxnprtzpzdklot.supabase.co";
let supabaseAnonKey = "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA";

// ─── SHA-256 Helper (Web Crypto API — works in all modern browsers) ───
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
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
      lastUpdated: Date.now(),
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
    const cached = localStorage.getItem('knsdc_sync');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        this.state = { ...this.state, ...parsed };

        // Ensure default donations are initialized/migrated
        if (!this.state.donations || this.state.donations.length < 5 || !this.state.donations.some(d => d.name === "Youth Scholarship")) {
          this.state.donations = this.getDefaultState().donations;
          localStorage.setItem('knsdc_sync', JSON.stringify(this.state));
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

        // ONE-TIME RESET: Delete all current events and participants as requested by the user
        if (!localStorage.getItem('knsdc_all_events_deleted_v2')) {
          this.state.events = [];
          this.state.upcomingEvents = [];
          this.state.participants = [];
          this.state.activeEventId = null;
          this.state.eventName = null;
          localStorage.setItem('knsdc_sync', JSON.stringify(this.state));
          localStorage.setItem('knsdc_all_events_deleted_v2', 'true');
          console.log('[LocalSync] Successfully deleted all events and participants on user request.');
        }

        // DYNAMIC MIGRATION: Auto-initialize missing score & roundScores objects
        if (this.state.participants) {
          let updated = false;
          this.state.participants.forEach(p => {
            if (p) {
              if (!p.roundScores) { p.roundScores = {}; updated = true; }
              if (!p.scores) { p.scores = {}; updated = true; }
            }
          });
          if (updated) {
            localStorage.setItem('knsdc_sync', JSON.stringify(this.state));
            console.log('[LocalSync] Successfully auto-migrated participants with missing scores/roundScores.');
          }
        }

        // AUTO-POPULATE PARTICIPANTS: If there is an active event but no participants, auto-populate the 5 mock performers (unless explicitly deleted)
        if (this.state.activeEventId && (!this.state.participants || this.state.participants.length === 0) && !localStorage.getItem('knsdc_participants_deleted_v1')) {
          const ae = this.state.events.find(e => String(e.id) === String(this.state.activeEventId));
          const aeCats = ae ? (ae.categories || []) : [];
          
          const getCatId = (name) => {
            const match = aeCats.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
            return match ? match.id : 1;
          };

          this.state.participants = [
            {
              id: "KN001",
              name: "Priya Sharma",
              catId: getCatId("Solo Dance"),
              category: "Solo Dance",
              round: "audition",
              stageStatus: "on-stage",
              present: true,
              eventId: this.state.activeEventId,
              scores: {},
              roundScores: {},
              phone: "9876543210"
            },
            {
              id: "KN002",
              name: "Riya Das",
              catId: getCatId("Solo Dance"),
              category: "Solo Dance",
              round: "audition",
              stageStatus: "queue",
              present: true,
              eventId: this.state.activeEventId,
              scores: {},
              roundScores: {},
              phone: "9876543211"
            },
            {
              id: "KN003",
              name: "Team Rhythmica",
              catId: getCatId("Group Dance"),
              category: "Group Dance",
              round: "audition",
              stageStatus: "queue",
              present: true,
              eventId: this.state.activeEventId,
              scores: {},
              roundScores: {},
              phone: "9876543212"
            },
            {
              id: "KN004",
              name: "Ankita Roy",
              catId: getCatId("Folk Dance"),
              category: "Folk Dance",
              round: "audition",
              stageStatus: "queue",
              present: true,
              eventId: this.state.activeEventId,
              scores: {},
              roundScores: {},
              phone: "9876543213"
            },
            {
              id: "KN005",
              name: "Modern Groove Crew",
              catId: getCatId("Contemporary"),
              category: "Contemporary",
              round: "audition",
              stageStatus: "queue",
              present: true,
              eventId: this.state.activeEventId,
              scores: {},
              roundScores: {},
              phone: "9876543214"
            }
          ];
          
          this.state.currentOnStage = "KN001";
          localStorage.setItem('knsdc_sync', JSON.stringify(this.state));
          console.log('[LocalSync] Auto-populated active event participants list with mock data.');
        }

        // USER REQUESTED WIPE: Clear all participants from test1
        if (!localStorage.getItem('knsdc_participants_deleted_v1')) {
          this.state.participants = [];
          this.state.currentOnStage = null;
          localStorage.setItem('knsdc_sync', JSON.stringify(this.state));
          localStorage.setItem('knsdc_participants_deleted_v1', 'true');
          console.log('[LocalSync] Successfully wiped all participants for test1 on user request.');
        }
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
        if (!this.state.lastUpdated || fetchedState.lastUpdated > this.state.lastUpdated) {
          this.state = { ...this.state, ...fetchedState };
          localStorage.setItem('knsdc_sync', JSON.stringify(this.state));
          this.notify();
        }
      } else {
        console.log('[LocalSync] No global state found in Supabase. Initializing in database...');
        await this.saveStateToSupabase(this.state);
      }
    } catch (err) {
      console.error('[LocalSync] Exception in fetchSupabaseState:', err);
    }
  }

  async saveStateToSupabase(state) {
    if (!this.supabase) return;
    try {
      const { error } = await this.supabase
        .from('sync_state')
        .upsert({
          id: this.syncStateId,
          payload: state,
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
              if (!this.state.lastUpdated || newState.lastUpdated > this.state.lastUpdated) {
                this.state = { ...this.state, ...newState };
                localStorage.setItem('knsdc_sync', JSON.stringify(this.state));
                this.notify();
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('[LocalSync] Realtime subscription active:', status);
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

  setData(updater) {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    
    this.state.lastUpdated = Date.now();
    localStorage.setItem('knsdc_sync', JSON.stringify(this.state));
    this.notify();

    if (this.supabase) {
      this.saveStateToSupabase(this.state);
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
      const { data, error } = await supabase.from('events').select('*');
      if (error) {
        console.error('[LocalSync] Error loading events from Supabase', error);
        return this.state.events || [];
      }
      
      const mappedEvents = data.map(dbEv => ({
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
        active: dbEv.active,
        createdAt: dbEv.created_at
      }));
      
      this.setData(state => ({ ...state, events: mappedEvents, upcomingEvents: mappedEvents }));
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
      
      const { error } = await supabase.from('events').insert([dbObj]);
      if (error) {
        console.error('[LocalSync] Error creating event in Supabase', error);
      }
      
      this.setData(state => {
        const events = state.events || [];
        const upcomingEvents = state.upcomingEvents || [];
        events.push(eventObj);
        upcomingEvents.push(eventObj);
        return { ...state, events, upcomingEvents };
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
      
      const { error } = await supabase.from('events').update(dbObj).eq('id', id);
      if (error) {
        console.error('[LocalSync] Error updating event in Supabase', error);
      }
      
      this.setData(state => {
        const events = (state.events || []).map(e => String(e.id) === String(id) ? { ...e, ...eventObj } : e);
        const upcomingEvents = (state.upcomingEvents || []).map(e => String(e.id) === String(id) ? { ...e, ...eventObj } : e);
        return { ...state, events, upcomingEvents };
      });
      return true;
    } catch (e) {
      console.error('[LocalSync] Exception updating event', e);
      return false;
    }
  }

  async deleteEvent(id) {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
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
