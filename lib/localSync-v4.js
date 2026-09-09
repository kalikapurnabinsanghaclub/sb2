// Supabase Configuration
let supabaseUrl = window.supabaseUrl || (typeof localStorage !== 'undefined' && localStorage.getItem('knsdc_supabase_url')) || "https://fjscpohgysbelzkrkrxm.supabase.co";
let supabaseAnonKey = window.supabaseAnonKey || (typeof localStorage !== 'undefined' && localStorage.getItem('knsdc_supabase_key')) || "sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5";

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

function parseBanners(bannerData) {
  if (!bannerData) return [];
  if (Array.isArray(bannerData)) return bannerData.filter(Boolean);
  if (typeof bannerData === 'object') return Object.values(bannerData).filter(Boolean);
  if (typeof bannerData !== 'string') return [];
  
  const trimmed = bannerData.trim();
  if (!trimmed) return [];

  // Try JSON array parsing (e.g. '["http...", "data:..."]')
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (e) {}
  }

  // Handle delimiter '|||'
  if (trimmed.includes('|||')) {
    return trimmed.split('|||').map(s => s.trim()).filter(Boolean);
  }

  // If it's a single base64 data URL without other comma-separated images
  if (trimmed.startsWith('data:image') && !trimmed.includes('http://') && !trimmed.includes('https://')) {
    const dataCount = (trimmed.match(/data:image/g) || []).length;
    if (dataCount === 1) {
      return [trimmed];
    }
  }

  // Handle strings with commas (both HTTP URLs, data: URLs, or legacy broken base64 pieces)
  if (trimmed.includes(',')) {
    if (trimmed.includes('data:image')) {
      const rawParts = trimmed.split(',');
      const result = [];
      let current = null;
      for (let i = 0; i < rawParts.length; i++) {
        const part = rawParts[i].trim();
        if (!part) continue;
        if (part.startsWith('data:image')) {
          if (current) result.push(current);
          current = part;
        } else if (current !== null) {
          current += ',' + part;
          result.push(current);
          current = null;
        } else {
          result.push(part);
        }
      }
      if (current) result.push(current);
      if (result.length > 0) return result;
    } else {
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  return [trimmed];
}
if (typeof window !== 'undefined') {
  window.parseBanners = parseBanners;
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
    this.saveStateTimeout = null;
    this.pendingStateToSave = null;
    this.broadcastChannel = null;
    this.lastSavedState = null;
    this._lastSeenCloudTimestamp = null;
    this.init();
  }

  getDefaultState() {
    return {
      activeEventId: null,
      eventName: null,
      organizer: "Kalikapur Nabin Sangha",
      liveEventToday: null,
      currentOnStage: null,
      stageTransitionAt: 0,
      venueStageState: {},
      lastUpdated: 0,
      participants: [],
      chatMessages: [],
      judges: [],
      hostAssignments: [],
      events: [],
      upcomingEvents: [],
      feedbacks: [],
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
      const lsUpcomingEvents = localStorage.getItem('knsdc_upcomingEvents');
      if (lsUpcomingEvents) {
        this.state.upcomingEvents = JSON.parse(lsUpcomingEvents);
        console.log('[LocalSync] Restored upcomingEvents from localStorage');
      }
      const lsSportLiveScore = localStorage.getItem('knsdc_sportLiveScore');
      if (lsSportLiveScore) {
        this.state.sportLiveScore = JSON.parse(lsSportLiveScore);
        console.log('[LocalSync] Restored sportLiveScore from localStorage');
      }

      // Foolproof Stage State Restoration from localStorage (0ms boot)
      const lsStageState = localStorage.getItem('knsdc_stage_state');
      if (lsStageState) {
        try {
          const parsedStage = JSON.parse(lsStageState);
          if (parsedStage.currentOnStage !== undefined) this.state.currentOnStage = parsedStage.currentOnStage;
          if (parsedStage.venueStageState) this.state.venueStageState = parsedStage.venueStageState;
          if (parsedStage.stageTransitionAt) this.state.stageTransitionAt = parsedStage.stageTransitionAt;
          console.log('[LocalSync] Restored stage state from localStorage cache');
        } catch(e) {}
      }

      // Foolproof Participants Restoration from localStorage cache (0ms boot)
      const lsParticipants = localStorage.getItem('knsdc_participants_cache');
      if (lsParticipants) {
        try {
          const cachedParts = JSON.parse(lsParticipants);
          if (Array.isArray(cachedParts) && cachedParts.length > 0) {
            this.state.participants = cachedParts;
            console.log(`[LocalSync] Restored ${cachedParts.length} participants from localStorage cache`);
          }
        } catch(e) {}
      }

      // Restore offline pending outbox
      const lsOutbox = localStorage.getItem('knsdc_pending_outbox');
      if (lsOutbox) {
        try {
          this._pendingOutbox = JSON.parse(lsOutbox);
          console.log(`[LocalSync] Restored ${this._pendingOutbox.length} pending outbox items from localStorage`);
        } catch(e) {}
      }
    } catch(e) { console.warn('[LocalSync] localStorage read error:', e); }

    // Initialize background audio garbage collector (runs every 5 minutes)
    setInterval(() => this.runAudioGarbageCollector(), 5 * 60 * 1000);

    // ── 2-Second Foolproof LocalStorage Auto-Save Loop ──
    setInterval(() => this.saveToLocalStorage(), 2000);

    // ── 2-Second Bidirectional Network Heartbeat (Push Outbox & Pull Reconcile) ──
    setInterval(() => this.runHeartbeatSync(), 2000);

    this.notify();
  }

  async runAudioGarbageCollector() {
    if (!this.supabase || !this.state.participants) return;
    
    // Only run the GC if we are on a portal that stays open like Admin or Monitor
    const isGCEnabled = window.location.pathname.includes('KNSDC-Admin.html') || window.location.pathname.includes('KNSDC-Monitor.html');
    if (!isGCEnabled) return;

    console.log('[LocalSync] Running Audio Garbage Collector...');
    
    for (const p of this.state.participants) {
      if (!p.formAnswers) continue;
      
      const filesToDelete = [];
      let updatedFormAnswers = { ...p.formAnswers };
      let needsUpdate = false;
      
      Object.entries(p.formAnswers).forEach(([k, v]) => {
         if (typeof v === 'string' && v.includes('/storage/v1/object/public/knsdc-registration/')) {
            // Extract the upload timestamp from the filename if it matches our Date.now() format
            const tsMatch = v.match(/\/(\d{13})_/);
            let shouldDelete = false;
            
            // Rule A: Was it marked completed 30 minutes ago?
            if (updatedFormAnswers._audioCompletedAt && (Date.now() - updatedFormAnswers._audioCompletedAt >= 30 * 60 * 1000)) {
                shouldDelete = true;
                console.log(`[AutoClean] Rule A Match: Participant ${p.id} completed >30m ago.`);
            } 
            // Rule B: Has it been 9 hours since upload and it wasn't played?
            else if (tsMatch) {
                const uploadTs = parseInt(tsMatch[1]);
                if (Date.now() - uploadTs >= 9 * 60 * 60 * 1000) {
                    shouldDelete = true;
                    console.log(`[AutoClean] Rule B Match: Participant ${p.id} uploaded >9h ago.`);
                }
            }
            
            if (shouldDelete) {
                filesToDelete.push(v);
                delete updatedFormAnswers[k];
                needsUpdate = true;
            }
         }
      });
      
      if (needsUpdate) {
          // If we are deleting all audio, we can also clean up the completion timestamp
          delete updatedFormAnswers._audioCompletedAt;
          
          for (const fileUrl of filesToDelete) {
             const bucketName = 'knsdc-registration';
             const parts = fileUrl.split(`/public/${bucketName}/`);
             if (parts.length > 1) {
                const filePath = parts[1];
                console.log(`[AutoClean] Deleting from Supabase: ${filePath}`);
                await this.supabase.storage.from(bucketName).remove([filePath]);
             }
          }
          
          // Update the DB so the URL is gone forever
          await this.updateParticipant(p.id, { formAnswers: updatedFormAnswers });
      }
    }
  }

  async fetchSupabaseState() {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase
        .from('sync_state')
        .select('payload, last_updated')
        .eq('id', this.syncStateId)
        .maybeSingle();

      if (error) {
        console.error('[LocalSync] Error fetching state from Supabase:', error);
        return;
      }

      if (data && data.payload) {
        if (data.last_updated) {
          this._lastSeenCloudTimestamp = data.last_updated;
        }
        console.log('[LocalSync] State loaded from Supabase:', data.payload);
        const fetchedState = data.payload;
        
        if (fetchedState.eventFormFields) {
          this.state.eventFormFields = { ...(this.state.eventFormFields || {}), ...fetchedState.eventFormFields };
        }
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
        if (fetchedState.partnerAssignments) {
          this.state.partnerAssignments = fetchedState.partnerAssignments;
        }
        const localTransition = this.state.stageTransitionAt || 0;
        const remoteTransition = fetchedState.stageTransitionAt || 0;
        const preserveLocalStage = localTransition > remoteTransition;
        const preservedCurrentOnStage = this.state.currentOnStage;
        const preservedVenueStageState = this.state.venueStageState;
        const preservedStageTransitionAt = this.state.stageTransitionAt;

        if (!preserveLocalStage && fetchedState.currentOnStage !== undefined) {
          this.state.currentOnStage = fetchedState.currentOnStage;
        }
        
        // Preserve switch data, form fields, and assignments we just merged
        const preservedEventFormFields = this.state.eventFormFields;
        const preservedSwitches = this.state.eventSwitches;
        const preservedSwitchStates = this.state.switchStates;
        const preservedHostAssignments = this.state.hostAssignments;
        const preservedPartnerAssignments = this.state.partnerAssignments;
        this.state = { ...this.state, ...fetchedState };
        // Re-apply preserved switch data, form fields (localStorage + cloud merged) and assignments
        if (preservedEventFormFields) this.state.eventFormFields = preservedEventFormFields;
        if (preservedSwitches) this.state.eventSwitches = preservedSwitches;
        if (preservedSwitchStates) this.state.switchStates = preservedSwitchStates;
        if (preservedHostAssignments) this.state.hostAssignments = preservedHostAssignments;
        if (preservedPartnerAssignments) this.state.partnerAssignments = preservedPartnerAssignments;
        if (preserveLocalStage) {
          this.state.currentOnStage = preservedCurrentOnStage;
          this.state.venueStageState = preservedVenueStageState;
          this.state.stageTransitionAt = preservedStageTransitionAt;
        }
        
        if (this.state.chatMessages && this.state.chatMessages.length > 0) {
          const sixteenHoursMs = 16 * 60 * 60 * 1000;
          const now = Date.now();
          this.state.chatMessages = this.state.chatMessages.filter(msg => {
            if (!msg.timestamp) { msg.timestamp = now; return true; }
            return (now - msg.timestamp) < sixteenHoursMs;
          });
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
          const lsSportLiveScore = localStorage.getItem('knsdc_sportLiveScore');
          if (lsSportLiveScore) {
            this.state.sportLiveScore = { ...JSON.parse(lsSportLiveScore), ...(this.state.sportLiveScore || {}) };
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
          if (this.state.upcomingEvents) {
            localStorage.setItem('knsdc_upcomingEvents', JSON.stringify(this.state.upcomingEvents));
          }
          if (this.state.judges) {
            localStorage.setItem('knsdc_judges', JSON.stringify(this.state.judges));
          }
        } catch (e) { /* ignore localStorage write errors */ }
        
        this.isInitialized = true;
        try {
          await this.loadEvents();
        } catch (le) {
          console.error('[LocalSync] Error pre-loading database tables in fetchSupabaseState:', le);
        }
        this.lastSavedState = JSON.parse(JSON.stringify(this.state));
        this.notify();
      } else {
        console.log('[LocalSync] No global state found in Supabase. Initializing in database...');
        this.isInitialized = true;
        try {
          await this.loadEvents();
        } catch (le) {
          console.error('[LocalSync] Error pre-loading database tables in fetchSupabaseState:', le);
        }
        this.lastSavedState = JSON.parse(JSON.stringify(this.state));
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

    this.pendingStateToSave = { ...state };

    if (this.saveStateTimeout) {
      return; // Save is already scheduled
    }

    this.saveStateTimeout = setTimeout(async () => {
      this.saveStateTimeout = null;
      const stateToSave = this.pendingStateToSave;
      this.pendingStateToSave = null;
      if (!stateToSave) return;

      try {
        // Create a shallow copy and strip heavy objects to minimize Supabase Egress
        const payloadToSave = { ...stateToSave };
        delete payloadToSave.events;
        delete payloadToSave.pastEvents;
        delete payloadToSave.agreements;
        delete payloadToSave.judgeAgreements;
        delete payloadToSave.participants; // Critical: Participants are stored in public_registrations table

        // Ensure foodMenu items never bloat sync_state with huge base64 strings
        if (payloadToSave.foodMenu && Array.isArray(payloadToSave.foodMenu)) {
          payloadToSave.foodMenu = payloadToSave.foodMenu.map(m => {
            if (m && m.image && m.image.length > 5000) {
              return { ...m, image: '' };
            }
            return m;
          });
        }

        const nowIso = new Date().toISOString();
        console.log('[LocalSync] Debounced upsert of lean sync state to Supabase...');
        const { error } = await this.supabase
          .from('sync_state')
          .upsert({
            id: this.syncStateId,
            payload: payloadToSave,
            last_updated: nowIso
          });

        if (error) {
          console.error('[LocalSync] Error upserting sync state in Supabase:', error);
        } else {
          this._lastSeenCloudTimestamp = nowIso;
        }
      } catch (err) {
        console.error('[LocalSync] Exception in saveStateToSupabase:', err);
      }
    }, 3000); // Debounce DB writes at 3-second intervals to reduce Egress
  }

  async forceSaveStateToSupabase() {
    if (!this.supabase) return false;
    if (this.saveStateTimeout) {
      clearTimeout(this.saveStateTimeout);
      this.saveStateTimeout = null;
    }
    const stateToSave = this.state;
    try {
      const payloadToSave = { ...stateToSave };
      delete payloadToSave.events;
      delete payloadToSave.pastEvents;
      delete payloadToSave.agreements;
      delete payloadToSave.judgeAgreements;
      delete payloadToSave.participants; // Critical: Participants are stored in public_registrations table

      // Ensure foodMenu items never bloat sync_state with huge base64 strings
      if (payloadToSave.foodMenu && Array.isArray(payloadToSave.foodMenu)) {
        payloadToSave.foodMenu = payloadToSave.foodMenu.map(m => {
          if (m && m.image && m.image.length > 5000) {
            return { ...m, image: '' };
          }
          return m;
        });
      }

      const nowIso = new Date().toISOString();
      console.log('[LocalSync] FORCED immediate upsert of lean sync state to Supabase...');
      const { error } = await this.supabase
        .from('sync_state')
        .upsert({
          id: this.syncStateId,
          payload: payloadToSave,
          last_updated: nowIso
        });

      if (error) {
        console.error('[LocalSync] Error in forced upsert:', error);
        return false;
      }
      this._lastSeenCloudTimestamp = nowIso;
      this.lastSavedState = JSON.parse(JSON.stringify(stateToSave));
      this._pendingOfflineSync = false;
      return true;
    } catch (err) {
      console.error('[LocalSync] Exception in forced upsert:', err);
      return false;
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
            if (payload.new && payload.new.last_updated) {
              this._lastSeenCloudTimestamp = payload.new.last_updated;
            }
            if (payload.new && payload.new.payload) {
              const newState = payload.new.payload;
              if (newState.hostAssignments !== undefined) {
                this.state.hostAssignments = newState.hostAssignments;
              }
              if (newState.partnerAssignments !== undefined) {
                this.state.partnerAssignments = newState.partnerAssignments;
              }
              if (newState.eventFormFields) {
                this.state.eventFormFields = { ...(this.state.eventFormFields || {}), ...newState.eventFormFields };
              }
              if (newState.eventSwitches) {
                this.state.eventSwitches = { ...(this.state.eventSwitches || {}), ...newState.eventSwitches };
              }
              if (newState.switchStates) {
                this.state.switchStates = { ...(this.state.switchStates || {}), ...newState.switchStates };
              }
              
              const preservedHostAssignments = this.state.hostAssignments;
              const preservedPartnerAssignments = this.state.partnerAssignments;
              const preservedEventFormFields = this.state.eventFormFields;
              const preservedEventSwitches = this.state.eventSwitches;
              const preservedSwitchStates = this.state.switchStates;

              const localTransition = this.state.stageTransitionAt || 0;
              const remoteTransition = newState.stageTransitionAt || 0;
              const preserveLocalStage = localTransition > remoteTransition;
              const preservedCurrentOnStage = this.state.currentOnStage;
              const preservedVenueStageState = this.state.venueStageState;
              const preservedStageTransitionAt = this.state.stageTransitionAt;
 
              // Smart participant merge: protect recent local mutations from slow network overwrites
              let mergedParticipants = newState.participants;
              if (mergedParticipants && this.state.participants && this.state.participants.length > 0) {
                const localPartsMap = new Map(this.state.participants.map(p => [String(p.id), p]));
                const now = Date.now();
                mergedParticipants = mergedParticipants.map(np => {
                  const lp = localPartsMap.get(String(np.id));
                  if (!lp) return np;
                  
                  // Restore stripped heavy properties
                  np.image = lp.image || np.image;
                  np.posterData = lp.posterData || np.posterData;
                  np.qrDataUrl = lp.qrDataUrl || np.qrDataUrl;
                  
                  // 1. BUG-FIX: Split Optimistic Mutation Lock + Monotonic Stage Protection
                  const hasStageChange = lp.stageStatus !== undefined || lp.queueOrder !== undefined || lp.present !== undefined || lp.roundPresence !== undefined;
                  const lockWindow = hasStageChange ? 4000 : 15000;
                  const isLocallyLocked = (lp.localMutatedAt && (now - lp.localMutatedAt < lockWindow)) || preserveLocalStage;
                  if (isLocallyLocked) {
                    return {
                      ...np,
                      stageStatus: lp.stageStatus !== undefined ? lp.stageStatus : np.stageStatus,
                      queueOrder: lp.queueOrder !== undefined ? lp.queueOrder : np.queueOrder,
                      queuedAt: lp.queuedAt !== undefined ? lp.queuedAt : np.queuedAt,
                      present: lp.present !== undefined ? lp.present : np.present,
                      presentMarkedAt: lp.presentMarkedAt !== undefined ? lp.presentMarkedAt : np.presentMarkedAt,
                      roundPresence: lp.roundPresence || np.roundPresence,
                      goldenRibbon: lp.goldenRibbon !== undefined ? lp.goldenRibbon : np.goldenRibbon,
                      goldenRibbonBy: lp.goldenRibbonBy || np.goldenRibbonBy,
                      goldenRibbonAt: lp.goldenRibbonAt || np.goldenRibbonAt,
                      scores: { ...(np.scores || {}), ...(lp.scores || {}) },
                      roundScores: { ...(np.roundScores || {}), ...(lp.roundScores || {}) },
                      roundComments: { ...(np.roundComments || {}), ...(lp.roundComments || {}) },
                      localMutatedAt: lp.localMutatedAt
                    };
                  }

                  // 2. Score conflict resolution
                  const localHasScores = lp.scores && Object.keys(lp.scores).length > 0;
                  const cloudHasScores = np.scores && Object.keys(np.scores).length > 0;
                  if (localHasScores && !cloudHasScores) {
                     return { ...np, scores: lp.scores, roundScores: lp.roundScores || np.roundScores, roundComments: lp.roundComments || np.roundComments };
                  }
                  return np;
                });

                // Preserve local participants that may not yet be in remote payload
                const incomingIds = new Set(mergedParticipants.map(p => String(p.id)));
                for (const p of this.state.participants) {
                  if (!incomingIds.has(String(p.id))) {
                    mergedParticipants.push(p);
                  }
                }
              }

              this.state = { ...this.state, ...newState };
              this.state.hostAssignments = preservedHostAssignments;
              if (preservedEventFormFields) this.state.eventFormFields = preservedEventFormFields;
              if (preservedEventSwitches) this.state.eventSwitches = preservedEventSwitches;
              if (preservedSwitchStates) this.state.switchStates = preservedSwitchStates;
              if (preserveLocalStage) {
                this.state.currentOnStage = preservedCurrentOnStage;
                this.state.venueStageState = preservedVenueStageState;
                this.state.stageTransitionAt = preservedStageTransitionAt;
              }
              
              if (mergedParticipants) {
                this.state.participants = mergedParticipants;
              }
              
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
                if (this.state.eventFormFields) {
                  localStorage.setItem('knsdc_eventFormFields', JSON.stringify(this.state.eventFormFields));
                }
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
              this.lastSavedState = JSON.parse(JSON.stringify(this.state));
              this.notify();
              this.notify();
            } else if (payload.new) {
              console.log('[LocalSync] Realtime change detected but payload was omitted (TOAST). Fetching full state...');
              this.fetchSupabaseState();
            }
          }

        )
        .subscribe((status) => {
          console.log('[LocalSync] Realtime subscription to sync_state active:', status);
        });

      // Subscribe to public_registrations with surgical in-memory patching (0 REST egress)
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
            console.log('[LocalSync] Realtime change detected in public_registrations:', payload.eventType, payload);
            this.handleParticipantRealtimeChange(payload);
          }
        )
        .subscribe((status) => {
          console.log('[LocalSync] Realtime subscription to public_registrations active:', status);
        });

      // Subscribe to events with debounced loading to eliminate egress spikes
      this.supabase
        .channel('public:events')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'events'
          },
          (payload) => {
            console.log('[LocalSync] Realtime change detected in events:', payload);
            this.debouncedLoadEvents();
          }
        )
        .subscribe((status) => {
          console.log('[LocalSync] Realtime subscription to events active:', status);
        });

      // Subscribe to judge_agreements with debounced loading
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
            this.debouncedLoadEvents();
          }
        )
        .subscribe((status) => {
          console.log('[LocalSync] Realtime subscription to judge_agreements active:', status);
        });

      // Subscribe to scoring_subjects with debounced loading
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
            this.handleSubjectRealtimeChange(payload);
            this.debouncedLoadEvents();
          }
        )
        .subscribe((status) => {
          console.log('[LocalSync] Realtime subscription to scoring_subjects active:', status);
        });

      // Initialize Realtime Broadcast Channel for instant sub-second sync of transient states
      this.broadcastChannel = this.supabase.channel('knsdc_broadcast_room', {
        config: {
          broadcast: { self: false }
        }
      });
      
      this.broadcastChannel
        .on('broadcast', { event: 'state_update' }, (payload) => {
          console.log('[LocalSync] Broadcast state_update received:', payload);
          if (payload && payload.payload) {
            this.handleBroadcastUpdate(payload.payload);
          }
        })
        .subscribe((status) => {
          console.log('[LocalSync] Realtime broadcast channel status:', status);
        });

    } catch (err) {
      console.error('[LocalSync] Exception setting up realtime subscription:', err);
    }
  }

  handleParticipantRealtimeChange(payload) {
    if (!payload) return;
    const eventType = payload.eventType;
    const newRecord = payload.new;
    const oldRecord = payload.old;

    if (eventType === 'UPDATE' && newRecord && newRecord.id) {
      this.patchParticipantFromDb(newRecord);
    } else if (eventType === 'INSERT' && newRecord && newRecord.id) {
      this.insertParticipantFromDb(newRecord);
    } else if (eventType === 'DELETE' && oldRecord && oldRecord.id) {
      this.removeParticipantLocal(oldRecord.id);
    } else {
      this.debouncedLoadParticipants();
    }
  }

  handleSubjectRealtimeChange(payload) {
    if (!payload) return;
    try {
      const eventType = payload.eventType;
      const newRec = payload.new;
      const oldRec = payload.old;

      if ((eventType === 'INSERT' || eventType === 'UPDATE') && newRec && newRec.id) {
        const sub = {
          id: Number(newRec.id) || newRec.id,
          name: newRec.name || newRec.subject_name || 'Subject',
          maxMarks: Number(newRec.max_marks || newRec.max_score) || 10,
          desc: newRec.description || '',
          eventId: newRec.event_id ? (Number(newRec.event_id) || newRec.event_id) : null
        };

        this.setData(state => {
          const globalSubs = (state.subjects || []).filter(s => String(s.id) !== String(sub.id));
          state.subjects = [...globalSubs, sub];

          if (sub.eventId && state.events) {
            const evIdx = state.events.findIndex(e => String(e.id) === String(sub.eventId));
            if (evIdx !== -1) {
              const evSubs = (state.events[evIdx].subjects || []).filter(s => String(s.id) !== String(sub.id));
              state.events[evIdx].subjects = [...evSubs, sub];
            }
          }
          return { ...state };
        });
      } else if (eventType === 'DELETE' && oldRec && oldRec.id) {
        const idToDelete = oldRec.id;
        this.setData(state => {
          state.subjects = (state.subjects || []).filter(s => String(s.id) !== String(idToDelete));
          if (state.events) {
            state.events.forEach(ev => {
              if (ev.subjects) {
                ev.subjects = ev.subjects.filter(s => String(s.id) !== String(idToDelete));
              }
            });
          }
          return { ...state };
        });
      }
    } catch (err) {
      console.warn('[LocalSync] Error in handleSubjectRealtimeChange:', err);
    }
  }

  patchParticipantFromDb(dbP) {
    if (!dbP || !dbP.id) return;
    const pidStr = String(dbP.id);
    let changed = false;

    this.setData(state => {
      const parts = [...(state.participants || [])];
      const idx = parts.findIndex(p => String(p.id) === pidStr);

      if (idx !== -1) {
        const existing = parts[idx];
        const formAns = dbP.form_answers !== undefined ? (dbP.form_answers || {}) : (dbP.form_data !== undefined ? (dbP.form_data || {}) : existing.formAnswers);
        const userEmail = (formAns && (formAns.email || formAns['Email Address'] || formAns['Email'])) || dbP.email || existing.email || '';
        const updated = {
          ...existing,
          name: dbP.name !== undefined ? dbP.name : existing.name,
          phone: dbP.phone !== undefined ? dbP.phone : existing.phone,
          age: dbP.age !== undefined ? (Number(dbP.age) || existing.age) : existing.age,
          gender: dbP.gender !== undefined ? dbP.gender : existing.gender,
          email: userEmail,
          eventId: dbP.event_id !== undefined ? (Number(dbP.event_id) || dbP.event_id) : existing.eventId,
          catId: dbP.category !== undefined ? (Number(dbP.category) || existing.catId) : existing.catId,
          venueId: dbP.venue !== undefined ? (Number(dbP.venue) || existing.venueId) : existing.venueId,
          stageStatus: dbP.stage_status !== undefined ? dbP.stage_status : (dbP.status !== undefined ? dbP.status : existing.stageStatus),
          round: dbP.round !== undefined ? dbP.round : existing.round,
          present: dbP.present !== undefined ? dbP.present : existing.present,
          isVerified: dbP.is_verified !== undefined ? dbP.is_verified : existing.isVerified,
          formAnswers: formAns,
          formLocked: formAns ? (formAns._formLocked === true) : existing.formLocked,
          isReady: (formAns && formAns._isReady !== undefined) ? formAns._isReady : existing.isReady,
          scores: dbP.scores !== undefined ? (dbP.scores || {}) : existing.scores,
          roundScores: dbP.round_scores !== undefined ? (dbP.round_scores || {}) : existing.roundScores,
          roundComments: dbP.round_comments !== undefined ? (dbP.round_comments || {}) : existing.roundComments,
          comment: dbP.comment !== undefined ? dbP.comment : existing.comment
        };
        parts[idx] = updated;
        changed = true;
        return { ...state, participants: parts };
      } else {
        const mapped = this.mapSingleDbParticipant(dbP);
        changed = true;
        return { ...state, participants: [...parts, mapped] };
      }
    });

    if (changed) {
      console.log(`[LocalSync] Patched participant ${pidStr} from Realtime CDC (0 DB queries)`);
    }
  }

  insertParticipantFromDb(dbP) {
    if (!dbP || !dbP.id || dbP.stage_status === 'Archived' || dbP.status === 'Archived') return;
    const pidStr = String(dbP.id);
    this.setData(state => {
      const parts = [...(state.participants || [])];
      if (!parts.some(p => String(p.id) === pidStr)) {
        parts.push(this.mapSingleDbParticipant(dbP));
        return { ...state, participants: parts };
      }
      return state;
    });
  }

  removeParticipantLocal(id) {
    if (!id) return;
    const pidStr = String(id);
    this.setData(state => {
      const parts = (state.participants || []).filter(p => String(p.id) !== pidStr);
      return { ...state, participants: parts };
    });
  }

  mapSingleDbParticipant(p) {
    const formAns = p.form_answers || p.form_data || {};
    const userEmail = (formAns && (formAns.email || formAns['Email Address'] || formAns['Email'])) || p.email || '';
    return {
      id: p.id,
      name: p.name || '',
      phone: p.phone || '',
      age: Number(p.age) || 0,
      gender: p.gender || '',
      email: userEmail,
      eventId: p.event_id ? (Number(p.event_id) || p.event_id) : null,
      catId: Number(p.category) || null,
      venueId: Number(p.venue) || null,
      date: p.reg_date || p.created_at || new Date().toISOString(),
      formAnswers: formAns,
      present: p.present !== undefined ? p.present : false,
      presentMarkedAt: null,
      queueOrder: null,
      queuedAt: null,
      round: p.round || 'audition',
      stageStatus: p.stage_status || p.status || 'waiting',
      isVerified: p.is_verified !== undefined ? p.is_verified : true,
      goldenRibbon: false,
      goldenRibbonBy: null,
      goldenRibbonAt: null,
      localMutatedAt: null,
      scores: p.scores || {},
      roundScores: p.round_scores || {},
      roundComments: p.round_comments || {},
      comment: p.comment || '',
      roundPresence: null,
      regDate: p.reg_date || p.created_at || new Date().toISOString(),
      formLocked: formAns ? (formAns._formLocked === true) : false,
      isReady: formAns && formAns._isReady !== undefined ? formAns._isReady : false
    };
  }

  debouncedLoadParticipants() {
    if (this._loadPartsDebounceTimer) return;
    this._loadPartsDebounceTimer = setTimeout(() => {
      this._loadPartsDebounceTimer = null;
      this.loadParticipants().catch(e => console.warn('[debouncedLoadParticipants]', e));
    }, 10000);
  }

  debouncedLoadEvents() {
    if (this._loadEventsDebounceTimer) return;
    this._loadEventsDebounceTimer = setTimeout(() => {
      this._loadEventsDebounceTimer = null;
      this.loadEvents().catch(e => console.warn('[debouncedLoadEvents]', e));
    }, 5000);
  }

  handleBroadcastUpdate(payload) {
    let changed = false;

    if (payload.sportLiveScore !== undefined) {
      this.state.sportLiveScore = payload.sportLiveScore;
      changed = true;
    }

    const localStageTrans = this.state.stageTransitionAt || 0;
    const isStaleStageBroadcast = payload.stageTransitionAt !== undefined && payload.stageTransitionAt < localStageTrans;

    if (!isStaleStageBroadcast) {
      if (payload.stageTransitionAt !== undefined) {
        this.state.stageTransitionAt = payload.stageTransitionAt;
      }
      if (payload.currentOnStage !== undefined && payload.currentOnStage !== this.state.currentOnStage) {
        this.state.currentOnStage = payload.currentOnStage;
        changed = true;
      }
      if (payload.venueStageState !== undefined) {
        this.state.venueStageState = { ...(this.state.venueStageState || {}), ...payload.venueStageState };
        changed = true;
      }
    }

    if (payload.onstageTimer !== undefined && JSON.stringify(payload.onstageTimer) !== JSON.stringify(this.state.onstageTimer)) {
      this.state.onstageTimer = payload.onstageTimer;
      changed = true;
    }

    if (payload.hostScoresVisible !== undefined && payload.hostScoresVisible !== this.state.hostScoresVisible) {
      this.state.hostScoresVisible = payload.hostScoresVisible;
      changed = true;
    }

    if (payload.judges !== undefined && JSON.stringify(payload.judges) !== JSON.stringify(this.state.judges)) {
      this.state.judges = payload.judges;
      changed = true;
    }

    if (payload.stopDanceActive !== undefined && JSON.stringify(payload.stopDanceActive) !== JSON.stringify(this.state.stopDanceActive)) {
      this.state.stopDanceActive = payload.stopDanceActive;
      changed = true;
    }

    if (payload.remoteAudioCommand !== undefined && JSON.stringify(payload.remoteAudioCommand) !== JSON.stringify(this.state.remoteAudioCommand)) {
      this.state.remoteAudioCommand = payload.remoteAudioCommand;
      changed = true;
    }

    if (payload.goldenRibbonTrigger !== undefined && JSON.stringify(payload.goldenRibbonTrigger) !== JSON.stringify(this.state.goldenRibbonTrigger)) {
      this.state.goldenRibbonTrigger = payload.goldenRibbonTrigger;
      changed = true;
    }

    if (payload.activeEventId !== undefined && String(payload.activeEventId) !== String(this.state.activeEventId)) {
      this.state.activeEventId = payload.activeEventId;
      try { localStorage.setItem('knsdc_activeEventId', String(payload.activeEventId)); } catch(e) {}
      changed = true;
    }

    if (payload.participantsUpdate && Array.isArray(payload.participantsUpdate)) {
      const parts = [...(this.state.participants || [])];
      payload.participantsUpdate.forEach(u => {
        const idx = parts.findIndex(p => String(p.id) === String(u.id));
        if (idx !== -1) {
          if (isStaleStageBroadcast && u.stageStatus !== undefined) {
            // Do not let older stage status overwrite newer stage status
            const { stageStatus, queueOrder, queuedAt, ...otherUpdates } = u;
            parts[idx] = { ...parts[idx], ...otherUpdates };
          } else {
            parts[idx] = { ...parts[idx], ...u };
          }
          changed = true;
        }
      });
      if (changed) {
        this.state.participants = parts;
      }
    }

    if (payload.chatMessagesUpdate && Array.isArray(payload.chatMessagesUpdate)) {
      const msgs = [...(this.state.chatMessages || [])];
      let changedSync = false;
      payload.chatMessagesUpdate.forEach(u => {
        const idx = msgs.findIndex(m => String(m.id) === String(u.id));
        if (idx !== -1) {
          msgs[idx] = { ...msgs[idx], ...u };
        } else {
          msgs.push(u);
        }
        changedSync = true;
      });
      if (changedSync) {
        this.state.chatMessages = msgs;
      }
    }

    // Handle form fields broadcast from Monitor — safe with own local flag
    if (payload.eventFormFields && typeof payload.eventFormFields === 'object') {
      this.state.eventFormFields = { ...(this.state.eventFormFields || {}), ...payload.eventFormFields };
      try { localStorage.setItem('knsdc_eventFormFields', JSON.stringify(this.state.eventFormFields)); } catch(e) {}
      changed = true;
    }

    if (payload.upcomingEvents && Array.isArray(payload.upcomingEvents)) {
      // Only update formFields in events — do NOT replace the full events array
      const eventsClone = (this.state.events || []).map(ev => {
        const bEv = payload.upcomingEvents.find(b => String(b.id) === String(ev.id));
        if (bEv && bEv.formFields && bEv.formFields.length > 0) {
          return { ...ev, formFields: bEv.formFields };
        }
        return ev;
      });
      this.state.events = eventsClone;
      this.state.upcomingEvents = payload.upcomingEvents;
      try { localStorage.setItem('knsdc_upcomingEvents', JSON.stringify(payload.upcomingEvents)); } catch(e) {}
      changed = true;
    }

    // Handle instant real-time scoring subjects synchronization
    if (payload.subjectsUpdate) {
      const su = payload.subjectsUpdate;
      if (su.action === 'create' && su.subject) {
        const newSub = su.subject;
        const globalSubs = (this.state.subjects || []).filter(s => String(s.id) !== String(newSub.id));
        this.state.subjects = [...globalSubs, newSub];

        if (newSub.eventId && this.state.events) {
          const evIdx = this.state.events.findIndex(e => String(e.id) === String(newSub.eventId));
          if (evIdx !== -1) {
            const evSubs = (this.state.events[evIdx].subjects || []).filter(s => String(s.id) !== String(newSub.id));
            this.state.events[evIdx].subjects = [...evSubs, newSub];
          }
        }
        changed = true;
      } else if (su.action === 'update' && su.subject) {
        const updSub = su.subject;
        const targetId = su.id || updSub.id;
        this.state.subjects = (this.state.subjects || []).map(s => String(s.id) === String(targetId) ? { ...s, ...updSub } : s);
        if (this.state.events) {
          this.state.events.forEach(ev => {
            if (ev.subjects) {
              ev.subjects = ev.subjects.map(s => String(s.id) === String(targetId) ? { ...s, ...updSub } : s);
            }
          });
        }
        changed = true;
      } else if (su.action === 'delete') {
        const delId = su.id;
        this.state.subjects = (this.state.subjects || []).filter(s => String(s.id) !== String(delId));
        if (this.state.events) {
          this.state.events.forEach(ev => {
            if (ev.subjects) {
              ev.subjects = ev.subjects.filter(s => String(s.id) !== String(delId));
            }
          });
        }
        changed = true;
      }
    }

    if (payload.subjects && Array.isArray(payload.subjects)) {
      this.state.subjects = payload.subjects;
      const targetEvId = payload.eventId || payload.activeEventId || this.state.activeEventId;
      if (targetEvId && this.state.events) {
        const evIdx = this.state.events.findIndex(e => String(e.id) === String(targetEvId));
        if (evIdx !== -1) {
          this.state.events[evIdx].subjects = payload.subjects;
        }
      }
      changed = true;
    }

    if (changed) {
      this.state.lastUpdated = Date.now();
      // Proactively persist critical items to localStorage
      try {
        if (this.state.switchStates) {
          localStorage.setItem('knsdc_switchStates', JSON.stringify(this.state.switchStates));
        }
        if (this.state.activeEventId) {
          localStorage.setItem('knsdc_activeEventId', this.state.activeEventId);
        }
      } catch(e) {}
      this.lastSavedState = JSON.parse(JSON.stringify(this.state));
      this.notify();
    }
  }

  // ─── 2-Second Foolproof LocalStorage Auto-Save ────────────────────
  saveToLocalStorage() {
    try {
      // 1. Stage State
      const stageState = {
        currentOnStage: this.state.currentOnStage !== undefined ? this.state.currentOnStage : null,
        venueStageState: this.state.venueStageState || {},
        stageTransitionAt: this.state.stageTransitionAt || 0,
        activeEventId: this.state.activeEventId || null,
        systemStatus: this.state.systemStatus || 'live',
        lastUpdated: this.state.lastUpdated || Date.now()
      };
      localStorage.setItem('knsdc_stage_state', JSON.stringify(stageState));

      // 2. Lean Participants Cache (Strip heavy images/posters to strictly prevent QuotaExceededError)
      if (this.state.participants && Array.isArray(this.state.participants) && this.state.participants.length > 0) {
        const leanParticipants = this.state.participants.map(p => {
          const { image, posterData, qrDataUrl, ...lean } = p;
          return lean;
        });
        localStorage.setItem('knsdc_participants_cache', JSON.stringify(leanParticipants));
      }

      // 3. Outbox Queue
      if (this._pendingOutbox && this._pendingOutbox.length > 0) {
        localStorage.setItem('knsdc_pending_outbox', JSON.stringify(this._pendingOutbox));
      } else {
        localStorage.removeItem('knsdc_pending_outbox');
      }

      // 4. Critical UI Switches
      if (this.state.switchStates) {
        localStorage.setItem('knsdc_switchStates', JSON.stringify(this.state.switchStates));
      }
      if (this.state.eventSwitches) {
        localStorage.setItem('knsdc_eventSwitches', JSON.stringify(this.state.eventSwitches));
      }
    } catch(e) {
      console.warn('[LocalSync] saveToLocalStorage warning:', e);
    }
  }

  // ─── Persistent Outbox Management (Offline-First Queue) ───────────
  enqueueOutbox(item) {
    if (!this._pendingOutbox) this._pendingOutbox = [];
    const existingIdx = this._pendingOutbox.findIndex(x => x.pid && String(x.pid) === String(item.pid) && x.type === item.type);
    if (existingIdx !== -1) {
      this._pendingOutbox[existingIdx] = { ...this._pendingOutbox[existingIdx], ...item, data: { ...(this._pendingOutbox[existingIdx].data || {}), ...(item.data || {}) } };
    } else {
      this._pendingOutbox.push(item);
    }
    try {
      localStorage.setItem('knsdc_pending_outbox', JSON.stringify(this._pendingOutbox));
    } catch(e) {}
  }

  dequeueOutbox(outboxId) {
    if (!this._pendingOutbox || this._pendingOutbox.length === 0) return;
    this._pendingOutbox = this._pendingOutbox.filter(item => item.id !== outboxId && item.pid !== outboxId);
    try {
      if (this._pendingOutbox.length > 0) {
        localStorage.setItem('knsdc_pending_outbox', JSON.stringify(this._pendingOutbox));
      } else {
        localStorage.removeItem('knsdc_pending_outbox');
      }
    } catch(e) {}
  }

  // ─── 2-Second Bidirectional Network Heartbeat (Push Outbox & Pull Fallback) ───
  async runHeartbeatSync() {
    if (this._isHeartbeatRunning) return;
    this._isHeartbeatRunning = true;
    try {
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine !== false;
      if (!this.supabase || !isOnline) return;

      // ─── 1. PUSH PHASE: Process pending offline outbox ───
      if (this._pendingOutbox && this._pendingOutbox.length > 0) {
        const remainingOutbox = [];
        for (const item of this._pendingOutbox) {
          try {
            if (item.type === 'participant_update' && item.pid && item.data) {
              const { error } = await this.supabase
                .from('public_registrations')
                .update(item.data)
                .eq('id', item.pid);
              if (error) {
                console.warn('[Heartbeat Push] DB error updating participant:', item.pid, error);
                remainingOutbox.push(item);
              }
            } else if (item.type === 'stage_transition') {
              const ok = await this.forceSaveStateToSupabase();
              if (!ok) remainingOutbox.push(item);
            }
          } catch(netErr) {
            console.warn('[Heartbeat Push] Network error syncing outbox item:', netErr);
            remainingOutbox.push(item);
          }
        }
        this._pendingOutbox = remainingOutbox;
        try {
          if (remainingOutbox.length > 0) {
            localStorage.setItem('knsdc_pending_outbox', JSON.stringify(remainingOutbox));
          } else {
            localStorage.removeItem('knsdc_pending_outbox');
          }
        } catch(e) {}
      }

      // ─── 2. PULL PHASE: Reconcile sync_state (Safety fallback for dropped broadcasts) ───
      // Ultra-lean timestamp check: Only transfers ~50 bytes instead of 35-400 KB!
      const { data: headerData, error: headerErr } = await this.supabase
        .from('sync_state')
        .select('last_updated')
        .eq('id', this.syncStateId)
        .maybeSingle();

      if (!headerErr && headerData && headerData.last_updated) {
        // Only fetch payload if the cloud state timestamp is strictly newer than our last seen timestamp
        if (!this._lastSeenCloudTimestamp || headerData.last_updated > this._lastSeenCloudTimestamp) {
          const { data, error } = await this.supabase
            .from('sync_state')
            .select('payload, last_updated')
            .eq('id', this.syncStateId)
            .maybeSingle();

          if (!error && data && data.payload) {
            this._lastSeenCloudTimestamp = data.last_updated || headerData.last_updated;
            const remotePayload = data.payload;
            const remoteStageTrans = remotePayload.stageTransitionAt || 0;
            const localStageTrans = this.state.stageTransitionAt || 0;
            let hasStageChanged = false;

            // Pull and apply remote stage if remote transition timestamp is newer
            if (remoteStageTrans > localStageTrans) {
              if (remotePayload.currentOnStage !== undefined && remotePayload.currentOnStage !== this.state.currentOnStage) {
                this.state.currentOnStage = remotePayload.currentOnStage;
                hasStageChanged = true;
              }
              if (remotePayload.venueStageState) {
                this.state.venueStageState = { ...(this.state.venueStageState || {}), ...remotePayload.venueStageState };
                hasStageChanged = true;
              }
              this.state.stageTransitionAt = remoteStageTrans;
            }

            if (hasStageChanged) {
              console.log('[Heartbeat Pull] Reconciled stage state from cloud sync_state pull fallback');
              this.notify();
            }
          }
        }
      }
    } catch(err) {
      console.warn('[LocalSync] Heartbeat sync error:', err);
    } finally {
      this._isHeartbeatRunning = false;
    }
  }

  // ─── Form Fields Broadcast (called by Monitor on saveForm) ───────
  // Safe dedicated method — does NOT touch setData() or handleBroadcastUpdate()
  async broadcastFormUpdate(eventFormFields) {
    if (!this.broadcastChannel) return;
    try {
      const evData = (this.state.events || []).map(ev => ({
        id: ev.id,
        title: ev.name,
        date: ev.date || ev.startDate || '',
        time: ev.time || ev.startTime || '',
        venue: ev.venue || '',
        location: ev.location || '',
        category: ev.type || 'Standard',
        roundSchedules: ev.roundSchedules || {},
        formFields: (eventFormFields && eventFormFields[ev.id] && eventFormFields[ev.id].length > 0)
          ? eventFormFields[ev.id]
          : (ev.formFields || []),
        publicReg: (ev.switchStates || {}).publicReg !== false,
        stagePreview: (ev.switchStates || {}).stagePreview !== false,
        resultPublic: (ev.switchStates || {}).resultPublic !== false,
        promoPublic: (ev.switchStates || {}).promoPublic !== false,
        downloadPublic: (ev.switchStates || {}).downloadPublic !== false,
        publicVoting: (ev.switchStates || {}).publicVoting === true
      }));
      await this.broadcastChannel.send({
        type: 'broadcast',
        event: 'state_update',
        payload: {
          eventFormFields: eventFormFields || {},
          upcomingEvents: evData
        }
      });
      console.log('[LocalSync] Form fields broadcast sent to all clients');
    } catch(err) {
      console.error('[LocalSync] Error broadcasting form fields:', err);
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
  // Uses SECURITY DEFINER database functions (RPC) to bypass RLS safely

  async addStaffMember(email, password, name, role) {
    if (!this.supabase) return { success: false, error: 'No connection' };
    try {
      const emailLower = email.trim().toLowerCase();

      // Step 1: Create Supabase Auth user so they can log in with signInWithPassword
      try {
        const { error: signUpErr } = await this.supabase.auth.signUp({
          email: emailLower,
          password: password,
          options: { data: { fullname: name, role: role } }
        });
        if (signUpErr) {
          // If user already exists in auth, that's OK — continue to upsert staff_credentials
          if (!signUpErr.message.includes('already registered') && !signUpErr.message.includes('already been registered')) {
            console.warn('[LocalSync] Auth signUp warning:', signUpErr.message);
          }
        }
      } catch (authErr) {
        console.warn('[LocalSync] Auth signUp exception (non-fatal):', authErr.message);
      }

      // Step 2: Use SECURITY DEFINER RPC to upsert into staff_credentials (bypasses RLS)
      let rpcSuccess = false;
      let rpcErrorMsg = '';
      try {
        const { data, error } = await this.supabase.rpc('admin_upsert_staff', {
          staff_email: emailLower,
          staff_password: password,
          staff_name: name,
          staff_role: role
        });

        if (!error) {
          const result = typeof data === 'string' ? JSON.parse(data) : data;
          if (!result || result.success !== false) {
            rpcSuccess = true;
          } else {
            rpcErrorMsg = result.error || 'RPC returned unsuccessful';
          }
        } else {
          rpcErrorMsg = error.message;
          console.warn('[LocalSync] admin_upsert_staff RPC notice:', error.message);
        }
      } catch (rpcEx) {
        rpcErrorMsg = rpcEx.message;
        console.warn('[LocalSync] admin_upsert_staff RPC exception:', rpcEx);
      }

      // Step 2.5: Direct table fallback (if RPC failed, e.g. function digest() does not exist)
      if (!rpcSuccess) {
        console.log('[LocalSync] Falling back to direct staff_credentials table upsert with SHA-256...');
        try {
          const passwordHash = await sha256(password);
          const { error: directErr } = await this.supabase
            .from('staff_credentials')
            .upsert({
              email: emailLower,
              password_hash: passwordHash,
              name: name,
              role: role,
              updated_at: new Date().toISOString()
            }, { onConflict: 'email' });

          if (!directErr) {
            rpcSuccess = true;
            console.log('[LocalSync] Staff member successfully saved via direct table upsert fallback.');
          } else {
            console.warn('[LocalSync] Direct upsert error, trying case-insensitive role:', directErr.message);
            const { error: directErr2 } = await this.supabase
              .from('staff_credentials')
              .upsert({
                email: emailLower,
                password_hash: passwordHash,
                name: name,
                role: role.toLowerCase(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'email' });
            if (!directErr2) {
              rpcSuccess = true;
            } else {
              return { success: false, error: directErr2.message || rpcErrorMsg };
            }
          }
        } catch (fbErr) {
          console.error('[LocalSync] Direct upsert fallback exception:', fbErr);
          return { success: false, error: fbErr.message || rpcErrorMsg };
        }
      }

      // Also sync to global knsdc_state so portals can read it
      try {
        let globalState = this.state || {};
        if (!globalState.staff) globalState.staff = [];
        globalState.staff = globalState.staff.filter(s => s.email !== emailLower);
        globalState.staff.push({ email: emailLower, name, role, password });
        await this.pushState(globalState);
      } catch (err) {
        console.warn('Failed to sync staff to global state:', err);
      }

      console.log('[LocalSync] Staff member added successfully:', emailLower, role);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async updateStaffDetails(email, name, newPassword) {
    if (!this.supabase) return { success: false, error: 'No connection' };
    try {
      const emailLower = email.trim().toLowerCase();

      // Use SECURITY DEFINER RPC to update staff (bypasses RLS)
      let rpcSuccess = false;
      try {
        const { data, error } = await this.supabase.rpc('admin_update_staff', {
          target_email: emailLower,
          new_name: name || null,
          new_password: (newPassword && newPassword.trim() !== '') ? newPassword : null
        });

        if (!error) {
          const result = typeof data === 'string' ? JSON.parse(data) : data;
          if (!result || result.success !== false) rpcSuccess = true;
        }
      } catch (rpcEx) {}

      // Direct table update fallback if RPC failed
      if (!rpcSuccess) {
        try {
          const updateObj = { updated_at: new Date().toISOString() };
          if (name) updateObj.name = name;
          if (newPassword && newPassword.trim() !== '') {
            updateObj.password_hash = await sha256(newPassword);
          }
          await this.supabase.from('staff_credentials').update(updateObj).eq('email', emailLower);
        } catch (dirErr) {
          console.warn('[LocalSync] Direct staff update fallback notice:', dirErr);
        }
      }

      // Also sync to global knsdc_state so portals can read it
      try {
        let globalState = this.state || {};
        let needsPush = false;
        const cleanName = name ? name.split('|IMAGE:')[0] : '';
        
        if (globalState.staff) {
          globalState.staff = globalState.staff.map(s => {
            if (s.email === emailLower) {
              needsPush = true;
              const updatedStaff = { ...s };
              if (name) updatedStaff.name = name;
              if (newPassword && newPassword.trim() !== '') {
                updatedStaff.password = newPassword;
              }
              return updatedStaff;
            }
            return s;
          });
        }
        
        if (globalState.hostAssignments) {
          globalState.hostAssignments = globalState.hostAssignments.map(h => {
            if (h.email && h.email.trim().toLowerCase() === emailLower) {
              needsPush = true;
              const updatedHost = { ...h };
              if (cleanName) updatedHost.name = cleanName;
              if (newPassword && newPassword.trim() !== '') {
                updatedHost.password = newPassword;
              }
              return updatedHost;
            }
            return h;
          });
        }
        
        if (globalState.partnerAssignments) {
          globalState.partnerAssignments = globalState.partnerAssignments.map(p => {
            if (p.email && p.email.trim().toLowerCase() === emailLower) {
              needsPush = true;
              const updatedPartner = { ...p };
              if (cleanName) updatedPartner.name = cleanName;
              if (newPassword && newPassword.trim() !== '') {
                updatedPartner.password = newPassword;
              }
              return updatedPartner;
            }
            return p;
          });
        }
        
        if (globalState.judgeAgreements) {
          globalState.judgeAgreements = globalState.judgeAgreements.map(a => {
            if (a.email && a.email.trim().toLowerCase() === emailLower) {
              needsPush = true;
              const updatedAgr = { ...a };
              if (cleanName) updatedAgr.name = cleanName;
              if (newPassword && newPassword.trim() !== '') {
                updatedAgr.password = newPassword;
              }
              return updatedAgr;
            }
            return a;
          });
        }
        
        if (needsPush) {
          await this.pushState(globalState);
          console.log('[LocalSync] Synced staff details to global state.');
        }
      } catch (err) {
        console.warn('Failed to sync updated staff details to global state:', err);
      }

      console.log('[LocalSync] Staff details updated via RPC:', emailLower);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async updateStaffPassword(email, newPassword) {
    if (!this.supabase) return { success: false, error: 'No connection' };
    try {
      const emailLower = email.trim().toLowerCase();
      // Use the same update RPC
      const { data, error } = await this.supabase.rpc('admin_update_staff', {
        target_email: emailLower,
        new_name: null,
        new_password: newPassword
      });
      if (error) return { success: false, error: error.message };

      // Also sync to global knsdc_state so portals can read it
      try {
        let globalState = this.state || {};
        let needsPush = false;
        
        if (globalState.staff) {
          globalState.staff = globalState.staff.map(s => {
            if (s.email === emailLower) {
              needsPush = true;
              const updatedStaff = { ...s };
              if (newPassword && newPassword.trim() !== '') {
                updatedStaff.password = newPassword;
              }
              return updatedStaff;
            }
            return s;
          });
        }
        
        if (globalState.hostAssignments) {
          globalState.hostAssignments = globalState.hostAssignments.map(h => {
            if (h.email && h.email.trim().toLowerCase() === emailLower) {
              needsPush = true;
              const updatedHost = { ...h };
              if (newPassword && newPassword.trim() !== '') {
                updatedHost.password = newPassword;
              }
              return updatedHost;
            }
            return h;
          });
        }
        
        if (globalState.partnerAssignments) {
          globalState.partnerAssignments = globalState.partnerAssignments.map(p => {
            if (p.email && p.email.trim().toLowerCase() === emailLower) {
              needsPush = true;
              const updatedPartner = { ...p };
              if (newPassword && newPassword.trim() !== '') {
                updatedPartner.password = newPassword;
              }
              return updatedPartner;
            }
            return p;
          });
        }
        
        if (globalState.judgeAgreements) {
          globalState.judgeAgreements = globalState.judgeAgreements.map(a => {
            if (a.email && a.email.trim().toLowerCase() === emailLower) {
              needsPush = true;
              const updatedAgr = { ...a };
              if (newPassword && newPassword.trim() !== '') {
                updatedAgr.password = newPassword;
              }
              return updatedAgr;
            }
            return a;
          });
        }
        
        if (needsPush) {
          await this.pushState(globalState);
          console.log('[LocalSync] Synced staff password to global state.');
        }
      } catch (err) {
        console.warn('Failed to sync updated staff password to global state:', err);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deleteStaffMember(email) {
    if (!this.supabase) return { success: false, error: 'No connection' };
    try {
      const emailLower = email.trim().toLowerCase();

      let rpcSuccess = false;
      let rpcErrorMsg = '';

      // Try RPC first
      try {
        const { data, error } = await this.supabase.rpc('admin_delete_staff', {
          target_email: emailLower
        });

        if (!error) {
          const result = typeof data === 'string' ? JSON.parse(data) : data;
          if (!result || result.success !== false) {
            rpcSuccess = true;
          } else {
            rpcErrorMsg = result.error || 'RPC returned unsuccessful';
          }
        } else {
          rpcErrorMsg = error.message;
          console.warn('[LocalSync] RPC admin_delete_staff warning:', error.message);
        }
      } catch (rpcEx) {
        rpcErrorMsg = rpcEx.message;
        console.warn('[LocalSync] RPC admin_delete_staff exception:', rpcEx);
      }

      // Direct table delete fallback
      if (!rpcSuccess) {
        console.log('[LocalSync] Falling back to direct staff_credentials table delete...');
        const { error: directErr } = await this.supabase
          .from('staff_credentials')
          .delete()
          .eq('email', emailLower);

        if (!directErr) {
          rpcSuccess = true;
          console.log('[LocalSync] Staff member successfully deleted via direct table fallback.');
        } else {
          return { success: false, error: directErr.message || rpcErrorMsg };
        }
      }

      // Remove from global state sync
      try {
        let globalState = this.state || {};
        if (globalState.staff) {
          globalState.staff = globalState.staff.filter(s => s.email !== emailLower);
          await this.pushState(globalState);
        }
      } catch (err) {
        console.warn('Failed to sync staff deletion to global state:', err);
      }

      console.log('[LocalSync] Staff member deleted via RPC:', emailLower);
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

    // ── Step 1: Native Supabase Authentication (Required for RLS) ──
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email: emailNorm, password });
        if (!error && data.user) {
          const user = data.user;
          const role = user.user_metadata?.role || 'member';
          
          localStorage.setItem('kns_role', role);
          localStorage.setItem('kns_user', JSON.stringify({
            name: user.user_metadata?.fullname || emailNorm.split('@')[0],
            email: user.email
          }));
          
          console.log('[LocalSync] Authenticated securely via Supabase Auth:', emailNorm, 'role:', role);
          return { success: true, user, role };
        }
      } catch (err) {
        console.warn('[LocalSync] Supabase Auth Error:', err.message);
      }
    }

    // ── Step 1.5: Custom Staff Credentials Fallback ──
    if (this.supabase) {
      try {
        const pHash = await sha256(password);
        const { data: staffData, error: staffErr } = await this.supabase
          .from('staff_credentials')
          .select('*')
          .eq('email', emailNorm)
          .eq('password_hash', pHash)
          .maybeSingle();
        
        if (staffData && !staffErr) {
          const role = staffData.role || 'monitor';
          localStorage.setItem('kns_role', role);
          localStorage.setItem('kns_user', JSON.stringify({ name: staffData.name, email: emailNorm }));
          console.log('[LocalSync] Staff authenticated via custom table:', emailNorm, role);
          return {
            success: true,
            role: role,
            user: { email: emailNorm, user_metadata: { fullname: staffData.name, role: role } }
          };
        }
      } catch (e) {
        console.warn('[LocalSync] Staff credentials check failed:', e.message);
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

    // ── Step 3: Partner Assignments Fallback (Food/Ride partners) ──
    const partnerList = (this.state && this.state.partnerAssignments) || [];
    const matchedPartner = partnerList.find(
      p => p.email && p.password &&
           p.email.trim().toLowerCase() === emailNorm &&
           String(p.password) === password
    );
    if (matchedPartner) {
      const role = matchedPartner.role || 'service_partner';
      localStorage.setItem('kns_role', role);
      localStorage.setItem('kns_user', JSON.stringify({ name: matchedPartner.name, email: emailNorm, phone: matchedPartner.phone || '' }));
      console.log('[LocalSync] Partner authenticated via assignments list:', emailNorm, 'role:', role);
      return {
        success: true,
        role: role,
        user: { email: emailNorm, user_metadata: { fullname: matchedPartner.name, role: role, phone: matchedPartner.phone || '' } }
      };
    }

    // ── Step 4: Director Assignments Fallback ──
    const directorList = (this.state && this.state.directorAssignments) || [];
    const matchedDirector = directorList.find(
      d => d.email && d.password &&
           d.email.trim().toLowerCase() === emailNorm &&
           String(d.password) === password
    );
    if (matchedDirector) {
      localStorage.setItem('kns_role', 'director');
      localStorage.setItem('kns_user', JSON.stringify({ name: matchedDirector.name, email: emailNorm }));
      console.log('[LocalSync] Director authenticated via assignments list:', emailNorm);
      return {
        success: true,
        role: 'director',
        user: { email: emailNorm, user_metadata: { fullname: matchedDirector.name, role: 'director' } }
      };
    }

    // ── Step 5: Host Assignments Fallback ──
    const hostList = (this.state && this.state.hostAssignments) || [];
    const matchedHost = hostList.find(
      h => h.email && h.password &&
           h.email.trim().toLowerCase() === emailNorm &&
           String(h.password) === password
    );
    if (matchedHost) {
      localStorage.setItem('kns_role', 'host');
      localStorage.setItem('kns_user', JSON.stringify({ name: matchedHost.name, email: emailNorm }));
      console.log('[LocalSync] Host authenticated via assignments list:', emailNorm);
      return {
        success: true,
        role: 'host',
        user: { email: emailNorm, user_metadata: { fullname: matchedHost.name, role: 'host' } }
      };
    }

    return { success: false, error: 'Invalid credentials. Please check your email and password.' };
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
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    let needsSave = false;

    if (this.state.foodOrders && this.state.foodOrders.length > 0) {
      const orig = this.state.foodOrders.length;
      this.state.foodOrders = this.state.foodOrders.filter(o => {
        if (!o.timestamp) { o.timestamp = now; needsSave = true; return true; }
        return (now - o.timestamp) < twentyFourHoursMs;
      });
      if (this.state.foodOrders.length !== orig) needsSave = true;
    }
    
    if (this.state.rideBookings && this.state.rideBookings.length > 0) {
      const orig = this.state.rideBookings.length;
      this.state.rideBookings = this.state.rideBookings.filter(b => {
        if (!b.timestamp) { b.timestamp = now; needsSave = true; return true; }
        return (now - b.timestamp) < twentyFourHoursMs;
      });
      if (this.state.rideBookings.length !== orig) needsSave = true;
    }

    if (needsSave) {
      this.saveStateToSupabase(this.state);
    }

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
    this.lastSavedState = JSON.parse(JSON.stringify(this.state));
    this.notify();
  }

  setData(updater) {
    const oldState = JSON.parse(JSON.stringify(this.state));
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    
    const lastSaved = this.lastSavedState || oldState;

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
      if (this.state.sportLiveScore) {
        localStorage.setItem('knsdc_sportLiveScore', JSON.stringify(this.state.sportLiveScore));
      }
      if (this.state.stageTransitionAt) {
        localStorage.setItem('knsdc_stageTransitionAt', String(this.state.stageTransitionAt));
      }
    } catch(e) { /* localStorage full or unavailable */ }
    
    this.notify();

    // Broadcast logic
    const broadcastPayload = {};
    let shouldBroadcast = false;

    if (this.state.currentOnStage !== lastSaved.currentOnStage || this.state.stageTransitionAt !== lastSaved.stageTransitionAt) {
      broadcastPayload.currentOnStage = this.state.currentOnStage;
      broadcastPayload.stageTransitionAt = this.state.stageTransitionAt;
      broadcastPayload.venueStageState = this.state.venueStageState;
      shouldBroadcast = true;
    }

    if (JSON.stringify(this.state.onstageTimer) !== JSON.stringify(lastSaved.onstageTimer)) {
      broadcastPayload.onstageTimer = this.state.onstageTimer;
      shouldBroadcast = true;
    }

    if (this.state.hostScoresVisible !== lastSaved.hostScoresVisible) {
      broadcastPayload.hostScoresVisible = this.state.hostScoresVisible;
      shouldBroadcast = true;
    }

    if (JSON.stringify(this.state.judges) !== JSON.stringify(lastSaved.judges)) {
      broadcastPayload.judges = this.state.judges;
      shouldBroadcast = true;
    }

    if (JSON.stringify(this.state.stopDanceActive) !== JSON.stringify(lastSaved.stopDanceActive)) {
      broadcastPayload.stopDanceActive = this.state.stopDanceActive;
      shouldBroadcast = true;
    }

    if (JSON.stringify(this.state.remoteAudioCommand) !== JSON.stringify(lastSaved.remoteAudioCommand)) {
      broadcastPayload.remoteAudioCommand = this.state.remoteAudioCommand;
      shouldBroadcast = true;
    }

    if (JSON.stringify(this.state.sportLiveScore) !== JSON.stringify(lastSaved.sportLiveScore)) {
      broadcastPayload.sportLiveScore = this.state.sportLiveScore;
      shouldBroadcast = true;
    }

    if (JSON.stringify(this.state.goldenRibbonTrigger) !== JSON.stringify(lastSaved.goldenRibbonTrigger)) {
      broadcastPayload.goldenRibbonTrigger = this.state.goldenRibbonTrigger;
      shouldBroadcast = true;
    }

    if (String(this.state.activeEventId || '') !== String(lastSaved.activeEventId || '')) {
      broadcastPayload.activeEventId = this.state.activeEventId;
      shouldBroadcast = true;
    }

    // Check participants for updates (scores, stageStatus, present, round, goldenRibbon, queueOrder)
    const lastSavedPartsMap = new Map((lastSaved.participants || []).map(p => [String(p.id), p]));
    const changedParts = [];
    (this.state.participants || []).forEach(p => {
      const oldP = lastSavedPartsMap.get(String(p.id));
      if (!oldP || 
          oldP.stageStatus !== p.stageStatus || 
          oldP.round !== p.round || 
          JSON.stringify(oldP.scores) !== JSON.stringify(p.scores) || 
          JSON.stringify(oldP.roundScores) !== JSON.stringify(p.roundScores) || 
          oldP.present !== p.present ||
          oldP.isReady !== p.isReady ||
          oldP.goldenRibbon !== p.goldenRibbon ||
          oldP.goldenRibbonBy !== p.goldenRibbonBy ||
          oldP.queueOrder !== p.queueOrder ||
          oldP.queuedAt !== p.queuedAt) {
        changedParts.push({
          id: p.id,
          stageStatus: p.stageStatus,
          round: p.round,
          scores: p.scores,
          roundScores: p.roundScores,
          present: p.present,
          presentMarkedAt: p.presentMarkedAt,
          roundPresence: p.roundPresence,
          isReady: p.isReady,
          goldenRibbon: p.goldenRibbon,
          goldenRibbonBy: p.goldenRibbonBy,
          goldenRibbonAt: p.goldenRibbonAt,
          queueOrder: p.queueOrder,
          queuedAt: p.queuedAt
        });
      }
    });

    if (changedParts.length > 0) {
      broadcastPayload.participantsUpdate = changedParts;
      shouldBroadcast = true;
    }

    if (shouldBroadcast && this.broadcastChannel) {
      console.log('[LocalSync] Broadcasting changes:', broadcastPayload);
      this.broadcastChannel.send({
        type: 'broadcast',
        event: 'state_update',
        payload: broadcastPayload
      }).catch(err => console.error('[LocalSync] Error sending broadcast:', err));
    }

    // Deep comparison to prevent infinite loop of DB saves if state hasn't changed (ignoring lastUpdated & participants)
    const stateToCompare = { ...this.state };
    delete stateToCompare.lastUpdated;
    delete stateToCompare.participants; // Critical: Participants are stored in public_registrations table
    const lastSavedToCompare = { ...lastSaved };
    delete lastSavedToCompare.lastUpdated;
    delete lastSavedToCompare.participants;

    const hasRealChanges = JSON.stringify(stateToCompare) !== JSON.stringify(lastSavedToCompare);

    if (hasRealChanges && this.supabase) {
      if (navigator.onLine) {
        this.saveStateToSupabase(this.state);
        this._pendingOfflineSync = false;
      } else {
        this._pendingOfflineSync = true;
      }
    }
    
    this.lastSavedState = JSON.parse(JSON.stringify(this.state));
  }

  // ─── Cloudflare R2 (Primary Zero-Egress) & Supabase Storage File Upload ───────────────────────────
  async uploadFile(file, pathPrefix = '') {
    if (!file) return null;

    const prefix = pathPrefix ? pathPrefix.replace(/^\/+|\/+$/g, '') : 'participants';

    // 1. Primary: Upload directly to Cloudflare R2 (Zero Egress, Free Unlimited Bandwidth)
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pathPrefix', prefix);

      const r2WorkerUrl = window.CLOUDFLARE_UPLOAD_URL || 'https://sb2.kalikapurnabinsanghaclub.workers.dev';
      const endpoints = [
        r2WorkerUrl,
        'https://sb2.kalikapurnabinsanghaclub.workers.dev',
        '/api/upload'
      ];
      const uniqueEndpoints = [...new Set(endpoints.filter(Boolean))];

      for (const ep of uniqueEndpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            body: formData
          });
          if (res.ok) {
            const json = await res.json();
            if (json.status === 'success' && (json.fileUrl || json.imageUrl)) {
              const publicUrl = json.fileUrl || json.imageUrl;
              console.log('[LocalSync] Uploaded file to Cloudflare R2 (Zero Egress):', publicUrl);
              return publicUrl;
            }
          }
        } catch (epErr) {
          console.warn('[LocalSync] Cloudflare R2 endpoint notice:', ep, epErr.message);
        }
      }
    } catch (r2Err) {
      console.warn('[LocalSync] Cloudflare R2 upload error, attempting Supabase fallback:', r2Err);
    }

    // 2. Secondary Fallback: Try uploading to Supabase Storage if Supabase is connected
    if (this.supabase && this.supabase.storage) {
      try {
        const bucketName = 'knsdc-registration';
        const ext = file.name ? file.name.split('.').pop() : 'bin';
        const fileName = `${prefix}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        
        const { data, error } = await this.supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            cacheControl: '31536000, public, immutable',
            upsert: true
          });
          
        if (!error && data) {
          const { data: pubUrlData } = this.supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);
          if (pubUrlData && pubUrlData.publicUrl) {
            console.log('[LocalSync] Uploaded file to Supabase Storage:', pubUrlData.publicUrl);
            return pubUrlData.publicUrl;
          }
        } else if (error) {
          console.warn('[LocalSync] Supabase storage upload notice:', error.message);
        }
      } catch (sbErr) {
        console.warn('[LocalSync] Supabase storage upload exception:', sbErr);
      }
    }

    // 3. Base64 Fallback: Reads and compresses image file as compact Data URL string
    return new Promise((resolve) => {
      if (!file || (typeof file.type === 'string' && !file.type.startsWith('image/'))) {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = function(e) {
        if (typeof Image === 'undefined' || typeof document === 'undefined') {
          resolve(e.target.result);
          return;
        }
        const img = new Image();
        img.onload = function() {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          console.log('[LocalSync] Image compressed to compact Base64 JPEG.');
          resolve(compressed);
        };
        img.onerror = function() {
          resolve(e.target.result);
        };
        img.src = e.target.result;
      };
      reader.onerror = function(err) {
        console.error('[LocalSync] Error reading image file as Base64:', err);
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  }

  async deleteFile(fileUrl) {
    if (!this.supabase || !fileUrl) return false;
    try {
      const bucketName = 'knsdc-registration';
      const parts = fileUrl.split(`/public/${bucketName}/`);
      if (parts.length < 2) return false;
      const filePath = parts[1];
      
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .remove([filePath]);
        
      if (error) {
        console.error('[LocalSync] File delete error:', error.message);
        return false;
      }
      console.log('[LocalSync] File deleted successfully:', filePath);
      return true;
    } catch (err) {
      console.error('[LocalSync] Exception in deleteFile:', err);
      return false;
    }
  }

  async reconnect() {
    if (!this.supabase) return false;
    try {
      console.log('[LocalSync] Manual reconnect/refresh requested...');
      // 1. Remove all active channels
      await this.supabase.removeAllChannels();
      // 2. Fetch the latest state from cloud
      await this.fetchSupabaseState();
      // 3. Re-subscribe to realtime channels
      this.subscribeSupabaseRealtime();
      this.notify();
      return true;
    } catch (err) {
      console.error('[LocalSync] Reconnect failed:', err);
      return false;
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
        const { data: aData } = await this.supabase.from('judge_agreements').select('*').order('created_at', { ascending: false });
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
          .map(c => {
            let colorVal = c.color || 'b-amber';
            let prizesVal = [];
            if (colorVal && colorVal.startsWith('{') && colorVal.endsWith('}')) {
              try {
                const parsed = JSON.parse(colorVal);
                colorVal = parsed.color || 'b-amber';
                prizesVal = parsed.prizes || [];
              } catch(e) {}
            }
            return {
              id: Number(c.id),
              name: c.name,
              color: colorVal,
              prizes: prizesVal,
              ageMin: Number(c.age_min),
              ageMax: Number(c.age_max),
              eventId: c.event_id
            };
          });

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
          .map(v => {
            let loc = v.location || '';
            let capacity = Number(v.capacity) || 0;
            let dates = Array.isArray(v.dates) ? v.dates : (v.dates ? [v.dates] : []);
            if (loc.startsWith('{') && loc.endsWith('}')) {
              try {
                const parsed = JSON.parse(loc);
                loc = parsed.location || '';
                capacity = parsed.capacity || capacity;
                dates = parsed.dates || dates;
              } catch(e) {}
            }
            return {
              id: Number(v.id),
              name: v.name,
              location: loc,
              eventId: v.event_id,
              capacity: capacity,
              dates: dates
            };
          });

        let roundSchedules = dbEv.round_schedules || {};
        if (typeof roundSchedules === 'string') {
          try { roundSchedules = JSON.parse(roundSchedules); } catch (e) { roundSchedules = {}; }
        }
        let socialLinks = dbEv.social_links || {};
        if (typeof socialLinks === 'string') {
          try { socialLinks = JSON.parse(socialLinks); } catch (e) { socialLinks = {}; }
        }
        const otherPrizes = roundSchedules.otherPrizes || [];
        
        let formFields = dbEv.form_fields || [];
        if (typeof formFields === 'string') {
          try { formFields = JSON.parse(formFields); } catch (e) { formFields = []; }
        }
        
        let switchStates = dbEv.switch_states || {};
        if (typeof switchStates === 'string') {
          try { switchStates = JSON.parse(switchStates); } catch (e) { switchStates = {}; }
        }

        let directCats = [];
        if (dbEv.categories) {
          try {
            directCats = typeof dbEv.categories === 'string' ? JSON.parse(dbEv.categories) : dbEv.categories;
          } catch(e) {}
        }
        let directVens = [];
        if (dbEv.venues) {
          try {
            directVens = typeof dbEv.venues === 'string' ? JSON.parse(dbEv.venues) : dbEv.venues;
          } catch(e) {}
        }
        let directSubs = [];
        if (dbEv.scoring_subjects || dbEv.subjects) {
          try {
            const rawSubs = typeof (dbEv.scoring_subjects || dbEv.subjects) === 'string'
              ? JSON.parse(dbEv.scoring_subjects || dbEv.subjects)
              : (dbEv.scoring_subjects || dbEv.subjects);
            if (Array.isArray(rawSubs)) {
              directSubs = rawSubs.map(s => ({
                id: Number(s.id) || s.id,
                name: s.name || s.subject_name || 'Subject',
                maxMarks: Number(s.maxMarks || s.max_marks || s.max_score) || 10,
                desc: s.desc || s.description || '',
                eventId: s.eventId || s.event_id || dbEv.id
              }));
            }
          } catch(e) {}
        }

        const mergedEventSubs = [...eventSubjects];
        if (Array.isArray(directSubs)) {
          directSubs.forEach(ds => {
            if (ds && ds.id && !mergedEventSubs.some(es => String(es.id) === String(ds.id))) {
              mergedEventSubs.push(ds);
            }
          });
        }

        const bannerVal = dbEv.banner || dbEv.image || (socialLinks && socialLinks.banner) || (roundSchedules && roundSchedules.banner) || '';

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
          banner: bannerVal,
          social_links: socialLinks,
          whatsapp: dbEv.whatsapp || dbEv.whatsapp_number || roundSchedules.whatsapp || '',
          facebook: dbEv.facebook || dbEv.facebook_url || roundSchedules.facebook || '',
          allowDonations: dbEv.allow_donations !== undefined ? dbEv.allow_donations : (roundSchedules.allowDonations !== undefined ? roundSchedules.allowDonations : true),
          targetGoal: Number(dbEv.target_goal) || (roundSchedules.targetGoal ? Number(roundSchedules.targetGoal) : 50000),
          raisedAmount: Number(dbEv.raised_amount) || (roundSchedules.raisedAmount ? Number(roundSchedules.raisedAmount) : 0),
          upiId: dbEv.upi_id || roundSchedules.upiId || 'kalikapurnabinsangha@sbi',
          description: dbEv.description,
          staff: (typeof dbEv.staff === 'string' ? JSON.parse(dbEv.staff || '[]') : dbEv.staff) || [],
          judges: (typeof dbEv.judges === 'string' ? JSON.parse(dbEv.judges || '[]') : dbEv.judges) || [],
          roundSchedules,
          otherPrizes,
          formFields,
          switchStates,
          publicReg: dbEv.publicReg !== undefined ? dbEv.publicReg : dbEv["publicReg"],
          stagePreview: dbEv.stagePreview !== undefined ? dbEv.stagePreview : dbEv["stagePreview"],
          resultPublic: dbEv.resultPublic !== undefined ? dbEv.resultPublic : dbEv["resultPublic"],
          active: dbEv.active,
          createdAt: dbEv.created_at,
          categories: (eventCats && eventCats.length > 0) ? eventCats : (Array.isArray(directCats) ? directCats : []),
          subjects: mergedEventSubs,
          venues: (eventVens && eventVens.length > 0) ? eventVens : (Array.isArray(directVens) ? directVens : [])
        };
      });

      const globalCats = catData.map(c => {
        let colorVal = c.color || 'b-amber';
        let prizesVal = [];
        let ageMin = Number(c.age_min);
        let ageMax = Number(c.age_max);

        if (c.age_limit && typeof c.age_limit === 'string') {
          if (c.age_limit.startsWith('{') && c.age_limit.endsWith('}')) {
            try {
              const parsed = JSON.parse(c.age_limit);
              colorVal = parsed.color || colorVal;
              prizesVal = parsed.prizes || prizesVal;
              if (parsed.ageMin !== undefined) ageMin = Number(parsed.ageMin);
              if (parsed.ageMax !== undefined) ageMax = Number(parsed.ageMax);
            } catch(e) {}
          } else if (c.age_limit.includes('-')) {
            const parts = c.age_limit.split('-');
            ageMin = parseInt(parts[0]) || 0;
            ageMax = parseInt(parts[1]) || 99;
          }
        }

        if (colorVal && colorVal.startsWith('{') && colorVal.endsWith('}')) {
          try {
            const parsed = JSON.parse(colorVal);
            colorVal = parsed.color || 'b-amber';
            prizesVal = parsed.prizes || prizesVal;
          } catch(e) {}
        }
        return {
          id: Number(c.id),
          name: c.name,
          color: colorVal,
          prizes: prizesVal,
          ageMin: isNaN(ageMin) ? 0 : ageMin,
          ageMax: isNaN(ageMax) ? 99 : ageMax,
          eventId: c.event_id
        };
      });

      const globalVens = venData.map(v => {
        let loc = v.location || '';
        let capacity = Number(v.capacity) || 0;
        let dates = Array.isArray(v.dates) ? v.dates : (v.dates ? [v.dates] : []);
        if (loc.startsWith('{') && loc.endsWith('}')) {
          try {
            const parsed = JSON.parse(loc);
            loc = parsed.location || '';
            capacity = parsed.capacity || capacity;
            dates = parsed.dates || dates;
          } catch(e) {}
        }
        return {
          id: Number(v.id),
          name: v.name,
          location: loc,
          eventId: v.event_id,
          capacity: capacity,
          dates: dates
        };
      });
      
      // IMPORTANT: Preserve existing switch & form data when loading events
      // loadEvents should ONLY update events, not overwrite switch/form states
      const preservedEventSwitches = this.state.eventSwitches;
      const preservedSwitchStates = this.state.switchStates;
      const preservedSystemStatus = this.state.systemStatus;
      const preservedActiveEventId = this.state.activeEventId;
      const preservedEventFormFields = this.state.eventFormFields;

      // Determine active event: keep current, or restore from localStorage, or pick DB active:true, or default to first event
      const savedActiveId = localStorage.getItem('knsdc_activeEventId');
      let determinedActiveId = preservedActiveEventId || savedActiveId;
      if ((!determinedActiveId || !mappedEvents.some(e => String(e.id) === String(determinedActiveId))) && mappedEvents.length > 0) {
        const activeDbEvent = mappedEvents.find(e => e.active === true);
        determinedActiveId = activeDbEvent ? activeDbEvent.id : mappedEvents[0].id;
      }
      if (determinedActiveId) {
        this.state.activeEventId = determinedActiveId;
        try { localStorage.setItem('knsdc_activeEventId', String(determinedActiveId)); } catch(e) {}
      }

      const eventCatsFlattened = mappedEvents.flatMap(e => e.categories || []);
      const finalGlobalCats = (globalCats && globalCats.length > 0)
        ? globalCats
        : (eventCatsFlattened.length > 0
           ? eventCatsFlattened
           : (this.state.categories && this.state.categories.length > 0 ? this.state.categories : []));

      const eventVensFlattened = mappedEvents.flatMap(e => e.venues || []);
      const finalGlobalVens = (globalVens && globalVens.length > 0)
        ? globalVens
        : (eventVensFlattened.length > 0
           ? eventVensFlattened
           : (this.state.venues && this.state.venues.length > 0 ? this.state.venues : []));

      const eventSubsFlattened = mappedEvents.flatMap(e => e.subjects || []);
      const subDataMapped = (subData || []).map(s => ({
        id: Number(s.id) || s.id,
        name: s.name || s.subject_name || 'Subject',
        maxMarks: Number(s.max_marks || s.max_score) || 10,
        desc: s.description || '',
        eventId: s.event_id
      }));
      const combinedGlobalSubs = [...subDataMapped];
      eventSubsFlattened.forEach(es => {
        if (es && es.id && !combinedGlobalSubs.some(gs => String(gs.id) === String(es.id))) {
          combinedGlobalSubs.push(es);
        }
      });
      const finalGlobalSubs = combinedGlobalSubs.length > 0
        ? combinedGlobalSubs
        : (this.state.subjects && this.state.subjects.length > 0 ? this.state.subjects : []);
      
      this.updateStateLocal(state => ({
        ...state,
        events: mappedEvents,
        upcomingEvents: mappedEvents,
        categories: finalGlobalCats,
        venues: finalGlobalVens,
        subjects: finalGlobalSubs,
        agreements: agrData || [],
        judgeAgreements: agrData || [],
        // Re-apply preserved data to prevent race condition overwrites
        eventSwitches: preservedEventSwitches || state.eventSwitches,
        switchStates: preservedSwitchStates || state.switchStates,
        systemStatus: preservedSystemStatus || state.systemStatus,
        activeEventId: determinedActiveId || preservedActiveEventId || state.activeEventId,
        eventFormFields: preservedEventFormFields || state.eventFormFields
      }));

      try {
        localStorage.setItem('knsdc_upcomingEvents', JSON.stringify(mappedEvents));
      } catch(e) {}
      
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
        name: eventObj.name || 'New Event',
        title: eventObj.name || 'New Event',
        org: eventObj.org || 'Kalikapur Nabin Sangha',
        organizer: eventObj.org || 'Kalikapur Nabin Sangha',
        type: eventObj.type || 'cultural',
        category: eventObj.type || 'cultural',
        venue: eventObj.venue || '',
        date: eventObj.startDate || new Date().toISOString().split('T')[0],
        start_date: eventObj.startDate || '',
        time: eventObj.startTime || '',
        start_time: eventObj.startTime || '',
        end_date: eventObj.endDate || '',
        end_time: eventObj.endTime || '',
        capacity: eventObj.capacity || null,
        description: eventObj.description || '',
        banner: eventObj.banner || '',
        image: eventObj.banner || '',
        whatsapp: eventObj.whatsapp || '',
        facebook: eventObj.facebook || '',
        allow_donations: eventObj.allowDonations !== undefined ? eventObj.allowDonations : true,
        target_goal: eventObj.targetGoal || 50000,
        raised_amount: eventObj.raisedAmount || 0,
        upi_id: eventObj.upiId || 'kalikapurnabinsangha@sbi',
        staff: eventObj.staff || [],
        social_links: {
          banner: eventObj.banner || '',
          whatsapp: eventObj.whatsapp || '',
          facebook: eventObj.facebook || ''
        },
        round_schedules: {
          ...(eventObj.roundSchedules || {}),
          banner: eventObj.banner || '',
          whatsapp: eventObj.whatsapp || '',
          facebook: eventObj.facebook || '',
          allowDonations: eventObj.allowDonations !== undefined ? eventObj.allowDonations : true,
          targetGoal: eventObj.targetGoal || 50000,
          upiId: eventObj.upiId || 'kalikapurnabinsangha@sbi'
        },
        switch_states: eventObj.switchStates || {},
        form_fields: eventObj.formFields || [],
        active: false
      };
      
      // Insert with all columns, let DB ignore unknown ones
      let { error } = await this.supabase.from('events').insert([dbObj]);
      if (error) {
        console.warn('[LocalSync] Full event insert failed, trying minimal insert with column sync:', error.message);
        // Try bare minimum core insert
        const minObj = {
          id: eventObj.id,
          title: eventObj.name || 'New Event',
          date: eventObj.startDate || new Date().toISOString().split('T')[0],
          active: false
        };
        const { error: errorMin } = await this.supabase.from('events').insert([minObj]);
        if (!errorMin) {
          // Immediately populate all optional columns via tolerant per-column updateEvent
          await this.updateEvent(eventObj.id, eventObj);
        } else {
          console.error('[LocalSync] Minimum event insert failed:', errorMin.message);
          // Try with string id if bigint failed
          const strMinObj = { ...minObj, id: String(eventObj.id) };
          await this.supabase.from('events').insert([strMinObj]);
          await this.updateEvent(eventObj.id, eventObj);
        }
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
      alert('ERROR creating event: ' + e.message);
      return false;
    }
  }

  async setActiveEvent(eventId) {
    if (!eventId) return false;
    this.state.activeEventId = eventId;
    try { localStorage.setItem('knsdc_activeEventId', String(eventId)); } catch(e) {}
    this.setData(state => ({ ...state, activeEventId: eventId }));
    try {
      if (this.supabase) {
        await this.supabase.from('events').update({ active: false }).neq('id', eventId);
        await this.supabase.from('events').update({ active: true }).eq('id', eventId);
      }
    } catch(e) {
      console.warn('[LocalSync] Error updating active event in DB:', e);
    }
    return true;
  }

  async updateEvent(id, eventObj) {
    try {
      // ── Helper: try one column at a time — silently skip if column missing or network fails ──
      const tryCol = async (colObj) => {
        try {
          const { error } = await this.supabase.from('events').update(colObj).eq('id', id);
          if (!error) return true;
          const numId = Number(id);
          if (!isNaN(numId)) {
            const { error: numErr } = await this.supabase.from('events').update(colObj).eq('id', numId);
            if (!numErr) return true;
          }
          console.warn('[LocalSync] Column skipped (not in DB):', Object.keys(colObj).join(','), '-', error ? error.message : 'failed');
          return false;
        } catch (err) {
          console.warn('[LocalSync] Column skipped (network/schema error):', Object.keys(colObj).join(','), '-', err.message || err);
          return false;
        }
      };

      // ── STEP 1: ABSOLUTE MINIMUM CORE ──────────────────────────────────────
      // Only the most basic columns that exist in EVERY version of the schema.
      const coreObj = {};
      if (eventObj.name !== undefined) coreObj.title = eventObj.name;

      try {
        const { error: coreError } = await this.supabase.from('events').update(coreObj).eq('id', id);
        if (coreError) {
          const numId = Number(id);
          if (!isNaN(numId)) {
            const { error: numErr } = await this.supabase.from('events').update(coreObj).eq('id', numId);
            if (numErr) console.warn('[LocalSync] Core update failed:', numErr.message);
          } else {
            console.warn('[LocalSync] Core update failed:', coreError.message);
          }
        }
      } catch (coreErr) {
        console.warn('[LocalSync] Core update network error:', coreErr.message || coreErr);
      }

      // ── STEP 1.5: TRY CORE OPTIONAL COLUMNS INDIVIDUALLY ───────────────────
      if (eventObj.startDate   !== undefined) {
        await tryCol({ date: eventObj.startDate });
        await tryCol({ start_date: eventObj.startDate });
      }
      if (eventObj.startTime   !== undefined) {
        await tryCol({ time: eventObj.startTime });
        await tryCol({ start_time: eventObj.startTime });
      }
      if (eventObj.venue       !== undefined) await tryCol({ venue: eventObj.venue });
      if (eventObj.description !== undefined) await tryCol({ description: eventObj.description });
      if (eventObj.banner      !== undefined) {
        await tryCol({ banner: eventObj.banner });
        await tryCol({ image: eventObj.banner });
        // Also persist banner into social_links (JSONB column) so it is never lost even without banner column
        try {
          const curState = this.getData() || {};
          const curEv = (curState.events || []).find(e => String(e.id) === String(id)) || {};
          let sl = curEv.social_links || {};
          if (typeof sl === 'string') {
            try { sl = JSON.parse(sl); } catch(e) { sl = {}; }
          }
          sl = { ...sl, banner: eventObj.banner };
          await tryCol({ social_links: sl });
        } catch (slErr) {
          console.warn('[LocalSync] Failed saving banner to social_links:', slErr);
        }
      }

      // ── STEP 2: OPTIONAL COLUMNS — each tried individually ─────────────────
      // These are silently skipped if the column doesn't exist in this DB version.
      // Run add_missing_event_columns.sql in Supabase SQL Editor to add them all.

      // Category / event type
      if (eventObj.type !== undefined) {
        const ok = await tryCol({ category: eventObj.type });
        if (!ok) await tryCol({ type: eventObj.type }); // fallback alternate name
      }

      // Organizer
      if (eventObj.org !== undefined) {
        const ok = await tryCol({ organizer: eventObj.org });
        if (!ok) await tryCol({ org: eventObj.org });
      }

      // Active flag
      if (eventObj.active !== undefined) await tryCol({ active: eventObj.active });

      // Form fields
      if (eventObj.formFields !== undefined) {
        await tryCol({
          form_fields: typeof eventObj.formFields === 'string'
            ? eventObj.formFields
            : JSON.stringify(eventObj.formFields)
        });
      }

      // Staff assignments
      if (eventObj.staff !== undefined) {
        let staffVal = eventObj.staff;
        if (typeof staffVal === 'string') {
          try { staffVal = JSON.parse(staffVal); } catch(e) {}
        }
        const ok = await tryCol({ staff: staffVal });
        if (!ok) {
          await tryCol({ staff: JSON.stringify(staffVal) });
        }
      }

      // Boolean visibility switches (stored as individual columns)
      if (eventObj.switchStates !== undefined) {
        const sw = eventObj.switchStates;
        if (sw.publicReg    !== undefined) await tryCol({ '"publicReg"':    sw.publicReg });
        if (sw.stagePreview !== undefined) await tryCol({ '"stagePreview"': sw.stagePreview });
        if (sw.resultPublic !== undefined) await tryCol({ '"resultPublic"': sw.resultPublic });
        // Also try as a single JSONB column
        await tryCol({ switch_states: sw });
      }

      // Root-level visibility switches (stored as individual columns)
      if (eventObj.publicReg !== undefined) {
        await tryCol({ '"publicReg"': eventObj.publicReg });
        await tryCol({ publicReg: eventObj.publicReg });
      }
      if (eventObj.stagePreview !== undefined) {
        await tryCol({ '"stagePreview"': eventObj.stagePreview });
        await tryCol({ stagePreview: eventObj.stagePreview });
      }
      if (eventObj.resultPublic !== undefined) {
        await tryCol({ '"resultPublic"': eventObj.resultPublic });
        await tryCol({ resultPublic: eventObj.resultPublic });
      }

      // Extended columns (added by migration SQL)
      if (eventObj.endDate !== undefined)
        await tryCol({ end_date: eventObj.endDate || null });
      if (eventObj.endTime !== undefined)
        await tryCol({ end_time: eventObj.endTime || null });
      if (eventObj.capacity !== undefined)
        await tryCol({ capacity: eventObj.capacity || null });
      if (eventObj.whatsapp !== undefined) {
        await tryCol({ whatsapp: eventObj.whatsapp });
        await tryCol({ whatsapp_number: eventObj.whatsapp });
      }
      if (eventObj.facebook !== undefined) {
        await tryCol({ facebook: eventObj.facebook });
        await tryCol({ facebook_url: eventObj.facebook });
      }
      if (eventObj.allowDonations !== undefined) await tryCol({ allow_donations: eventObj.allowDonations });
      if (eventObj.targetGoal     !== undefined) await tryCol({ target_goal: eventObj.targetGoal });
      if (eventObj.raisedAmount   !== undefined) await tryCol({ raised_amount: eventObj.raisedAmount });
      if (eventObj.upiId          !== undefined) await tryCol({ upi_id: eventObj.upiId });
      
      if (eventObj.roundSchedules !== undefined || eventObj.banner !== undefined || eventObj.otherPrizes !== undefined || eventObj.whatsapp !== undefined || eventObj.facebook !== undefined || eventObj.allowDonations !== undefined || eventObj.targetGoal !== undefined || eventObj.upiId !== undefined) {
        const curState = this.getData() || {};
        const curEv = (curState.events || []).find(e => String(e.id) === String(id)) || {};
        let rs = eventObj.roundSchedules || curEv.roundSchedules || {};
        if (typeof rs === 'string') {
          try { rs = JSON.parse(rs); } catch(e) { rs = {}; }
        }
        rs = { ...rs };
        if (eventObj.banner !== undefined) {
          rs.banner = eventObj.banner;
        }
        if (eventObj.otherPrizes !== undefined) {
          rs.otherPrizes = eventObj.otherPrizes;
        }
        if (eventObj.whatsapp !== undefined) rs.whatsapp = eventObj.whatsapp;
        if (eventObj.facebook !== undefined) rs.facebook = eventObj.facebook;
        if (eventObj.allowDonations !== undefined) rs.allowDonations = eventObj.allowDonations;
        if (eventObj.targetGoal !== undefined) rs.targetGoal = eventObj.targetGoal;
        if (eventObj.raisedAmount !== undefined) rs.raisedAmount = eventObj.raisedAmount;
        if (eventObj.upiId !== undefined) rs.upiId = eventObj.upiId;
        await tryCol({
          round_schedules: JSON.stringify(rs)
        });
      }

      // ── STEP 3: Update local in-memory state (always succeeds) ─────────────
      this.setData(state => {
        const newFormFields = { ...(state.eventFormFields || {}) };
        if (eventObj.formFields) {
          newFormFields[id] = [...eventObj.formFields];
        }
        
        const mappedUpdate = {
          id: id,
          name: eventObj.name,
          org: eventObj.org,
          type: eventObj.type,
          venue: eventObj.venue,
          startDate: eventObj.startDate,
          startTime: eventObj.startTime,
          endDate: eventObj.endDate,
          endTime: eventObj.endTime,
          capacity: eventObj.capacity,
          banner: eventObj.banner,
          whatsapp: eventObj.whatsapp,
          facebook: eventObj.facebook,
          allowDonations: eventObj.allowDonations,
          targetGoal: eventObj.targetGoal,
          raisedAmount: eventObj.raisedAmount,
          upiId: eventObj.upiId,
          description: eventObj.description,
          staff: eventObj.staff,
          roundSchedules: eventObj.roundSchedules,
          otherPrizes: eventObj.otherPrizes,
          formFields: eventObj.formFields,
          switchStates: eventObj.switchStates,
          publicReg: eventObj.publicReg,
          active: eventObj.active
        };

        const updateFn = e => {
          if (String(e.id) === String(id)) {
            // Keep existing sub-entities like categories, venues, subjects
            const merged = { ...e };
            Object.keys(mappedUpdate).forEach(k => {
              if (mappedUpdate[k] !== undefined) {
                merged[k] = mappedUpdate[k];
              }
            });
            return merged;
          }
          return e;
        };

        const events = (state.events || []).map(updateFn);
        const upcomingEvents = (state.upcomingEvents || []).map(updateFn);

        return { ...state, events, upcomingEvents, eventFormFields: newFormFields };
      });

      // Proactively reload from Supabase so local cache exactly matches DB structure
      setTimeout(() => {
        this.loadEvents().catch(err => console.error('[LocalSync] Error reloading events after update:', err));
      }, 500);

      return true;
    } catch (e) {
      console.error('[LocalSync] Exception updating event', e);
      return { success: false, message: e.message || 'Database update error' };
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
  // SUPABASE DONATIONS & EVENT SUPPORT CRUD
  // ════════════════════════════════════════
  async createDonation(dObj) {
    try {
      const dbObj = {
        event_id: dObj.eventId ? String(dObj.eventId) : null,
        event_name: dObj.eventName || 'KNSDC Event',
        donor_name: dObj.donorName || dObj.name || 'Well Wisher',
        donor_phone: dObj.donorPhone || dObj.phone || '',
        donor_email: dObj.donorEmail || dObj.email || '',
        amount: Number(dObj.amount) || 0,
        message: dObj.message || '',
        upi_ref_no: dObj.upiRefNo || dObj.utr || '',
        payment_status: dObj.status || 'completed',
        is_anonymous: dObj.isAnonymous === true
      };

      try {
        const { error } = await this.supabase.from('donations').insert([dbObj]);
        if (error) console.warn('[LocalSync] Donation table insert warning:', error.message);
      } catch(err) {
        console.warn('[LocalSync] Error inserting to donations table:', err);
      }

      // Update in-memory state and syncEngine donations
      this.setData(state => {
        const donations = [dObj, ...(state.donations || [])];
        let events = state.events || [];
        if (dObj.eventId) {
          events = events.map(ev => {
            if (String(ev.id) === String(dObj.eventId)) {
              const currentRaised = Number(ev.raisedAmount) || 0;
              return { ...ev, raisedAmount: currentRaised + (Number(dObj.amount) || 0) };
            }
            return ev;
          });
        }
        return { ...state, donations, events };
      });

      return { success: true };
    } catch(e) {
      console.error('[LocalSync] Exception creating donation:', e);
      return { success: false, error: e.message };
    }
  }

  async fetchDonations(eventId = null) {
    try {
      let query = this.supabase.from('donations').select('*').order('created_at', { ascending: false });
      if (eventId) {
        query = query.eq('event_id', String(eventId));
      }
      const { data, error } = await query;
      if (error) {
        console.warn('[LocalSync] Error fetching donations:', error.message);
        return (this.state.donations || []).filter(d => !eventId || String(d.eventId) === String(eventId));
      }
      return data || [];
    } catch(e) {
      console.warn('[LocalSync] Exception fetching donations:', e);
      return (this.state.donations || []).filter(d => !eventId || String(d.eventId) === String(eventId));
    }
  }

  // ════════════════════════════════════════
  // SUPABASE REGISTRATIONS (PARTICIPANTS) CRUD
  // ════════════════════════════════════════
  async createParticipant(pObj) {
    try {
      if (!this.supabase) {
        console.warn('[LocalSync] Supabase not initialized, saving participant locally only');
        this.setData(state => {
          const parts = state.participants || [];
          if (!parts.some(p => String(p.id) === String(pObj.id))) {
            parts.push(pObj);
          }
          return { ...state, participants: parts };
        });
        return true;
      }

      // Ensure event_id is valid numeric bigint or null
      let eventIdNum = null;
      if (pObj.eventId) {
        const parsed = Number(pObj.eventId);
        if (!isNaN(parsed) && parsed > 0) {
          eventIdNum = parsed;
        }
      }

      const formAnswers = pObj.formAnswers ? { ...pObj.formAnswers } : {};
      if (pObj.email && !formAnswers.email && !formAnswers['Email Address'] && !formAnswers['Email']) {
        formAnswers.email = pObj.email;
      }

      const dbObj = {
        id: String(pObj.id),
        event_id: eventIdNum,
        name: pObj.name || '',
        phone: pObj.phone || '',
        age: pObj.age ? (Number(pObj.age) || null) : null,
        gender: pObj.gender || '',
        category: pObj.catId ? String(pObj.catId) : null,
        venue: pObj.venueId ? String(pObj.venueId) : null,
        form_answers: formAnswers,
        stage_status: pObj.stageStatus || 'waiting',
        round: pObj.round || 'audition',
        present: pObj.present !== undefined ? pObj.present : false,
        is_verified: pObj.isVerified !== undefined ? pObj.isVerified : true,
        scores: pObj.scores || {},
        round_scores: pObj.roundScores || {},
        round_comments: pObj.roundComments || {},
        comment: pObj.comment || '',
        reg_date: pObj.regDate || new Date().toISOString()
      };
      
      const { error } = await this.supabase.from('public_registrations').insert([dbObj]);
      if (error) {
        console.error('[LocalSync] Error creating registration in Supabase:', error);
        return false;
      }
      
      this.setData(state => {
        const parts = state.participants || [];
        if (!parts.some(p => String(p.id) === String(pObj.id))) {
          parts.push(pObj);
        }
        return { ...state, participants: parts };
      });
      return true;
    } catch(e) {
      console.error('[LocalSync] Exception in createParticipant:', e);
      return false;
    }
  }

  async submitFeedback(participantId, rating, text) {
    try {
      const state = this.state || {};
      const p = (state.participants || []).find(x => String(x.id) === String(participantId));
      if (!p) return false;
      
      const formAnswers = p.formAnswers ? { ...p.formAnswers } : {};
      formAnswers._feedback = {
        rating,
        text,
        timestamp: Date.now()
      };
      
      return await this.updateParticipant(participantId, { formAnswers });
    } catch(e) { console.error(e); return false; }
  }

  async updateParticipant(id, pObj) {
    try {
      pObj.localMutatedAt = Date.now();
      const dbObj = {};
      let hasDbUpdates = false;
      if (pObj.name !== undefined) { dbObj.name = pObj.name; hasDbUpdates = true; }
      if (pObj.phone !== undefined) { dbObj.phone = pObj.phone; hasDbUpdates = true; }
      if (pObj.age !== undefined) { dbObj.age = pObj.age; hasDbUpdates = true; }
      if (pObj.gender !== undefined) { dbObj.gender = pObj.gender; hasDbUpdates = true; }
      if (pObj.catId !== undefined) { dbObj.category = pObj.catId ? String(pObj.catId) : null; hasDbUpdates = true; }
      if (pObj.venueId !== undefined) { dbObj.venue = pObj.venueId ? String(pObj.venueId) : null; hasDbUpdates = true; }
      if (pObj.stageStatus !== undefined) { dbObj.stage_status = pObj.stageStatus; hasDbUpdates = true; }
      if (pObj.round !== undefined) { dbObj.round = pObj.round; hasDbUpdates = true; }
      if (pObj.present !== undefined) { dbObj.present = pObj.present; hasDbUpdates = true; }
      if (pObj.isVerified !== undefined) { dbObj.is_verified = pObj.isVerified; hasDbUpdates = true; }
      if (pObj.formAnswers !== undefined) { dbObj.form_answers = pObj.formAnswers; hasDbUpdates = true; }
      if (pObj.formLocked !== undefined) {
        if (!dbObj.form_answers) {
          const currentPart = (this.state.participants || []).find(p => String(p.id) === String(id));
          dbObj.form_answers = currentPart ? { ...(currentPart.formAnswers || {}) } : {};
        }
        dbObj.form_answers._formLocked = pObj.formLocked;
        pObj.formAnswers = { ...dbObj.form_answers };
        hasDbUpdates = true;
      }
      if (pObj.isReady !== undefined) {
        if (!dbObj.form_answers) {
          const currentPart = (this.state.participants || []).find(p => String(p.id) === String(id));
          dbObj.form_answers = currentPart ? { ...(currentPart.formAnswers || {}) } : {};
        }
        dbObj.form_answers._isReady = pObj.isReady;
        pObj.formAnswers = { ...dbObj.form_answers };
        hasDbUpdates = true;
      }
      if (pObj.scores !== undefined) { dbObj.scores = pObj.scores; hasDbUpdates = true; }
      if (pObj.roundScores !== undefined) { dbObj.round_scores = pObj.roundScores; hasDbUpdates = true; }
      if (pObj.roundComments !== undefined) { dbObj.round_comments = pObj.roundComments; hasDbUpdates = true; }
      if (pObj.comment !== undefined) { dbObj.comment = pObj.comment; hasDbUpdates = true; }

      // 1. Optimistic Local State Update (0ms latency)
      this.setData(state => {
        const parts = (state.participants || []).map(p => String(p.id) === String(id) ? { ...p, ...pObj } : p);
        return { ...state, participants: parts };
      });

      // 2. Instant Realtime Broadcast to all connected clients (<50ms)
      if (this.broadcastChannel) {
        this.broadcastChannel.send({
          type: 'broadcast',
          event: 'state_update',
          payload: {
            participantsUpdate: [{ id, ...pObj }]
          }
        }).catch(e => console.warn('[updateParticipant] broadcast error:', e));
      }

      // 3. Database persistence in background (non-blocking) + Persistent Outbox
      if (hasDbUpdates && id) {
        const outboxId = 'upd_' + id + '_' + Date.now();
        this.enqueueOutbox({ id: outboxId, type: 'participant_update', pid: id, data: dbObj, timestamp: Date.now() });
        if (this.supabase) {
          this.supabase.from('public_registrations').update(dbObj).eq('id', id).then(({ error }) => {
            if (!error) {
              this.dequeueOutbox(outboxId);
            } else {
              console.warn('[LocalSync] Error updating registration (kept in outbox):', error);
            }
          }).catch(netErr => {
            console.warn('[LocalSync] Network/Supabase exception updating registration (kept in outbox):', netErr);
          });
        }
      }

      // Force-save sync_state in background when scores or stage changes are involved
      if (pObj.scores !== undefined || pObj.roundScores !== undefined || pObj.roundComments !== undefined || pObj.stageStatus !== undefined || pObj.queueOrder !== undefined) {
        if (this.forceSaveStateToSupabase) {
          this.forceSaveStateToSupabase().catch(err =>
            console.warn('[LocalSync] Force-save after update failed:', err)
          );
        }
      }

      return true;
    } catch(e) { console.error(e); return false; }
  }

  // ─── Atomic Live Stage & Queue Transitions ────────────────────────
  async stagePush(participantId, venueId = null) {
    const now = Date.now();
    const pidStr = String(participantId);
    const venKey = venueId ? String(venueId) : 'global';
    const prevStageParts = [];
    let targetPart = null;

    // 1. Synchronous Optimistic State Mutation
    this.setData(state => {
      const currentParts = [...(state.participants || [])];
      
      // Move any performer currently on stage to 'done' (same venue or globally)
      currentParts.forEach(p => {
        const isSameVenue = venueId ? (String(p.venueId) === String(venueId) || !p.venueId) : true;
        if (p.stageStatus === 'on-stage' && String(p.id) !== pidStr && isSameVenue) {
          p.stageStatus = 'done';
          p.isReady = false;
          p.localMutatedAt = now;
          prevStageParts.push({ ...p });
        }
      });

      // Set target performer to 'on-stage'
      const targetIdx = currentParts.findIndex(p => String(p.id) === pidStr);
      if (targetIdx !== -1) {
        const target = { ...currentParts[targetIdx] };
        target.stageStatus = 'on-stage';
        target.isReady = false;
        target.localMutatedAt = now;
        if (!target.roundPresence) target.roundPresence = {};
        const r = target.round || 'audition';
        target.roundPresence[r] = { present: true, markedAt: now };
        target.present = true;
        target.presentMarkedAt = now;
        currentParts[targetIdx] = target;
        targetPart = target;
      }

      const nextVenueStage = { ...(state.venueStageState || {}) };
      nextVenueStage[venKey] = {
        currentOnStage: participantId,
        stageStatus: 'active',
        transitionAt: now
      };

      return {
        ...state,
        participants: currentParts,
        currentOnStage: participantId,
        stageTransitionAt: now,
        venueStageState: nextVenueStage,
        lastUpdated: now
      };
    });

    // 2. Instant Realtime WebSocket Broadcast to all clients (<50ms)
    if (this.broadcastChannel) {
      const pUpdates = prevStageParts.map(p => ({
        id: p.id,
        stageStatus: 'done',
        isReady: false,
        localMutatedAt: now
      }));
      if (targetPart) {
        pUpdates.push({
          id: targetPart.id,
          stageStatus: 'on-stage',
          isReady: false,
          present: true,
          presentMarkedAt: now,
          roundPresence: targetPart.roundPresence,
          localMutatedAt: now
        });
      }
      this.broadcastChannel.send({
        type: 'broadcast',
        event: 'state_update',
        payload: {
          stageTransitionAt: now,
          currentOnStage: participantId,
          venueStageState: this.state.venueStageState,
          participantsUpdate: pUpdates
        }
      }).catch(e => console.warn('[stagePush] broadcast error:', e));
    }

    // 3. Background DB Persistence + Outbox Enqueue (non-blocking, 0 UI delay)
    if (targetPart) {
      const outboxTarget = 'stage_target_' + targetPart.id + '_' + now;
      this.enqueueOutbox({ id: outboxTarget, type: 'participant_update', pid: targetPart.id, data: { stage_status: 'on-stage', present: true }, timestamp: now });
      if (this.supabase) {
        this.supabase.from('public_registrations').update({ stage_status: 'on-stage', present: true }).eq('id', targetPart.id).then(({ error }) => {
          if (!error) this.dequeueOutbox(outboxTarget);
        }).catch(() => {});
      }
    }
    for (const prev of prevStageParts) {
      const outboxPrev = 'stage_prev_' + prev.id + '_' + now;
      this.enqueueOutbox({ id: outboxPrev, type: 'participant_update', pid: prev.id, data: { stage_status: 'done' }, timestamp: now });
      if (this.supabase) {
        this.supabase.from('public_registrations').update({ stage_status: 'done' }).eq('id', prev.id).then(({ error }) => {
          if (!error) this.dequeueOutbox(outboxPrev);
        }).catch(() => {});
      }
    }

    const outboxTrans = 'trans_' + now;
    this.enqueueOutbox({ id: outboxTrans, type: 'stage_transition', timestamp: now });
    if (this.forceSaveStateToSupabase) {
      this.forceSaveStateToSupabase().then(ok => {
        if (ok) this.dequeueOutbox(outboxTrans);
      }).catch(e => console.warn('[stagePush] force-save error:', e));
    }
    return true;
  }

  async stageDrop(participantId = null, venueId = null) {
    const now = Date.now();
    const pidStr = participantId ? String(participantId) : (this.state.currentOnStage ? String(this.state.currentOnStage) : null);
    const venKey = venueId ? String(venueId) : 'global';
    const droppedParts = [];

    // 1. Synchronous Optimistic State Mutation
    this.setData(state => {
      const currentParts = [...(state.participants || [])];
      
      // Find highest queueOrder among current queue
      const queuedParts = currentParts.filter(p => p.stageStatus === 'queue');
      const maxOrder = queuedParts.reduce((max, p) => (typeof p.queueOrder === 'number' && p.queueOrder > max ? p.queueOrder : max), -1);

      // Target participant or currently on stage
      currentParts.forEach((p, idx) => {
        const isTarget = pidStr ? String(p.id) === pidStr : (p.stageStatus === 'on-stage' && (venueId ? (String(p.venueId) === String(venueId) || !p.venueId) : true));
        if (isTarget) {
          const updated = {
            ...p,
            stageStatus: 'queue',
            queuedAt: now,
            queueOrder: maxOrder + 1,
            localMutatedAt: now
          };
          currentParts[idx] = updated;
          droppedParts.push(updated);
        }
      });

      const nextVenueStage = { ...(state.venueStageState || {}) };
      nextVenueStage[venKey] = {
        currentOnStage: null,
        stageStatus: 'empty',
        transitionAt: now
      };

      const newCurrent = (state.currentOnStage && (!pidStr || String(state.currentOnStage) === pidStr)) ? null : state.currentOnStage;

      return {
        ...state,
        participants: currentParts,
        currentOnStage: newCurrent,
        stageTransitionAt: now,
        venueStageState: nextVenueStage,
        lastUpdated: now
      };
    });

    // 2. Instant Realtime WebSocket Broadcast to all clients (<50ms)
    if (this.broadcastChannel && droppedParts.length > 0) {
      this.broadcastChannel.send({
        type: 'broadcast',
        event: 'state_update',
        payload: {
          stageTransitionAt: now,
          currentOnStage: this.state.currentOnStage,
          venueStageState: this.state.venueStageState,
          participantsUpdate: droppedParts.map(p => ({
            id: p.id,
            stageStatus: 'queue',
            queuedAt: p.queuedAt,
            queueOrder: p.queueOrder,
            localMutatedAt: now
          }))
        }
      }).catch(e => console.warn('[stageDrop] broadcast error:', e));
    }

    // 3. Background DB Persistence + Outbox Enqueue (non-blocking)
    for (const dp of droppedParts) {
      const outboxDp = 'stage_drop_' + dp.id + '_' + now;
      this.enqueueOutbox({ id: outboxDp, type: 'participant_update', pid: dp.id, data: { stage_status: 'queue' }, timestamp: now });
      if (this.supabase) {
        this.supabase.from('public_registrations').update({ stage_status: 'queue' }).eq('id', dp.id).then(({ error }) => {
          if (!error) this.dequeueOutbox(outboxDp);
        }).catch(() => {});
      }
    }

    const outboxDropTrans = 'drop_trans_' + now;
    this.enqueueOutbox({ id: outboxDropTrans, type: 'stage_transition', timestamp: now });
    if (this.forceSaveStateToSupabase) {
      this.forceSaveStateToSupabase().then(ok => {
        if (ok) this.dequeueOutbox(outboxDropTrans);
      }).catch(e => console.warn('[stageDrop] force-save error:', e));
    }
    return true;
  }

  async stageComplete(participantId = null, venueId = null) {
    const now = Date.now();
    const pidStr = participantId ? String(participantId) : (this.state.currentOnStage ? String(this.state.currentOnStage) : null);
    const venKey = venueId ? String(venueId) : 'global';
    const completedParts = [];

    // 1. Synchronous Optimistic State Mutation
    this.setData(state => {
      const currentParts = [...(state.participants || [])];

      currentParts.forEach((p, idx) => {
        const isTarget = pidStr ? String(p.id) === pidStr : (p.stageStatus === 'on-stage' && (venueId ? (String(p.venueId) === String(venueId) || !p.venueId) : true));
        if (isTarget) {
          const updated = {
            ...p,
            stageStatus: 'done',
            isReady: false,
            localMutatedAt: now
          };
          currentParts[idx] = updated;
          completedParts.push(updated);
        }
      });

      const nextVenueStage = { ...(state.venueStageState || {}) };
      nextVenueStage[venKey] = {
        currentOnStage: null,
        stageStatus: 'empty',
        transitionAt: now
      };

      const newCurrent = (state.currentOnStage && (!pidStr || String(state.currentOnStage) === pidStr)) ? null : state.currentOnStage;

      return {
        ...state,
        participants: currentParts,
        currentOnStage: newCurrent,
        stageTransitionAt: now,
        venueStageState: nextVenueStage,
        lastUpdated: now
      };
    });

    // 2. Instant Realtime WebSocket Broadcast to all clients (<50ms)
    if (this.broadcastChannel && completedParts.length > 0) {
      this.broadcastChannel.send({
        type: 'broadcast',
        event: 'state_update',
        payload: {
          stageTransitionAt: now,
          currentOnStage: this.state.currentOnStage,
          venueStageState: this.state.venueStageState,
          participantsUpdate: completedParts.map(p => ({
            id: p.id,
            stageStatus: 'done',
            isReady: false,
            localMutatedAt: now
          }))
        }
      }).catch(e => console.warn('[stageComplete] broadcast error:', e));
    }

    // 3. Background DB Persistence + Outbox Enqueue (non-blocking)
    for (const cp of completedParts) {
      const outboxCp = 'stage_comp_' + cp.id + '_' + now;
      this.enqueueOutbox({ id: outboxCp, type: 'participant_update', pid: cp.id, data: { stage_status: 'done' }, timestamp: now });
      if (this.supabase) {
        this.supabase.from('public_registrations').update({ stage_status: 'done' }).eq('id', cp.id).then(({ error }) => {
          if (!error) this.dequeueOutbox(outboxCp);
        }).catch(() => {});
      }
    }

    const outboxCompTrans = 'comp_trans_' + now;
    this.enqueueOutbox({ id: outboxCompTrans, type: 'stage_transition', timestamp: now });
    if (this.forceSaveStateToSupabase) {
      this.forceSaveStateToSupabase().then(ok => {
        if (ok) this.dequeueOutbox(outboxCompTrans);
      }).catch(e => console.warn('[stageComplete] force-save error:', e));
    }
    return true;
  }

  // ─── Atomic Judge Presence & Session Synchronization ─────────────
  // ─── Atomic Judge Presence & Session Synchronization ─────────────
  async setJudgePresence(identifier, isPresent = true, eventId = null, venueId = null, extraData = {}) {
    const nowStr = new Date().toISOString();
    const idNorm = String(identifier || '').toLowerCase().trim();
    const extraEmail = String((extraData && extraData.email) || (idNorm.includes('@') ? identifier : '')).toLowerCase().trim();
    const extraName = String((extraData && extraData.name) || (!idNorm.includes('@') ? identifier : '')).toLowerCase().trim();
    const extraId = String((extraData && extraData.id) || '');

    this.setData(state => {
      const judgesList = [...(state.judges || [])];
      let target = judgesList.find(j => {
        if (!j) return false;
        const jEmail = String(j.email || '').toLowerCase().trim();
        const jName = String(j.name || '').toLowerCase().trim();
        const jId = String(j.id || '');
        return (idNorm && (jEmail === idNorm || jName === idNorm || jId === idNorm)) ||
               (extraEmail && jEmail && jEmail === extraEmail) ||
               (extraName && jName && jName === extraName) ||
               (extraId && jId && jId === extraId);
      });

      if (target) {
        target.present = !!isPresent;
        if (eventId) target.eventId = String(eventId);
        if (venueId) target.venueId = String(venueId);
        if (extraEmail && !target.email) target.email = extraEmail;
        if (extraName && (!target.name || target.name.includes('@'))) target.name = (extraData && extraData.name) || target.name;
        if (extraData && extraData.avatar && !target.avatar) target.avatar = extraData.avatar;

        target.attendanceLog = target.attendanceLog || [];
        if (isPresent) {
          const lastLog = target.attendanceLog[target.attendanceLog.length - 1];
          if (!lastLog || lastLog.checkOut) {
            target.attendanceLog.push({ checkIn: nowStr, checkOut: null });
          }
        } else {
          const lastLog = target.attendanceLog[target.attendanceLog.length - 1];
          if (lastLog && !lastLog.checkOut) lastLog.checkOut = nowStr;
        }
      } else {
        // Find matching confirmed agreement
        const allAgreements = state.judgeAgreements || state.agreements || [];
        const agr = allAgreements.find(a => {
          if (!a) return false;
          const aEmail = String(a.email || '').toLowerCase().trim();
          const aName = String(a.name || '').toLowerCase().trim();
          const aId = String(a.id || '');
          return (idNorm && (aEmail === idNorm || aName === idNorm || aId === idNorm)) ||
                 (extraEmail && aEmail && aEmail === extraEmail) ||
                 (extraName && aName && aName === extraName) ||
                 (extraId && aId && aId === extraId);
        });

        const newId = extraId ? (Number(extraId) || extraId) : (agr ? agr.id : (judgesList.length ? Math.max(...judgesList.map(j => Number(j.id) || 0)) + 1 : 1));
        const newName = (extraData && extraData.name) || (agr ? agr.name : (idNorm.includes('@') ? identifier.split('@')[0] : identifier));
        const newEmail = extraEmail || (agr ? agr.email : (idNorm.includes('@') ? identifier : ''));

        judgesList.push({
          id: newId,
          name: newName,
          email: newEmail,
          eventId: eventId || (agr ? agr.eventId : '0'),
          venueId: venueId || (agr ? agr.venueId : null),
          role: 'Judge',
          present: !!isPresent,
          isUnlocked: false,
          avatar: (extraData && extraData.avatar) || (agr ? agr.photoUrl : '') || '',
          attendanceLog: isPresent ? [{ checkIn: nowStr, checkOut: null }] : [],
          color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
        });
      }

      return { ...state, judges: judgesList, lastUpdated: Date.now() };
    });

    try {
      if (this.state.judges) {
        localStorage.setItem('knsdc_judges', JSON.stringify(this.state.judges));
      }
    } catch(e) {}

    if (this.forceSaveStateToSupabase) {
      await this.forceSaveStateToSupabase().catch(e => console.warn('[setJudgePresence] force-save error:', e));
    }
    return true;
  }

  // ─── Double-Check Authorization: Monitor Scoring Unlock Switch ─────
  async setJudgeUnlock(identifier, isUnlocked = true) {
    const idNorm = String(identifier || '').toLowerCase().trim();

    this.setData(state => {
      const judgesList = [...(state.judges || [])];
      let target = judgesList.find(j => {
        if (!j) return false;
        const jEmail = String(j.email || '').toLowerCase().trim();
        const jName = String(j.name || '').toLowerCase().trim();
        const jId = String(j.id || '');
        return (jEmail && jEmail === idNorm) || 
               (jName && jName === idNorm) || 
               (jId === idNorm);
      });

      if (target) {
        target.isUnlocked = !!isUnlocked;
        if (isUnlocked) target.scoresLocked = false;
      } else {
        const allAgreements = state.judgeAgreements || state.agreements || [];
        const agr = allAgreements.find(a => {
          if (!a) return false;
          const aEmail = String(a.email || '').toLowerCase().trim();
          const aName = String(a.name || '').toLowerCase().trim();
          const aId = String(a.id || '');
          return (aEmail && aEmail === idNorm) || 
                 (aName && aName === idNorm) || 
                 (aId === idNorm);
        });

        const newId = agr ? agr.id : (judgesList.length ? Math.max(...judgesList.map(j => Number(j.id) || 0)) + 1 : 1);
        const newName = agr ? agr.name : (idNorm.includes('@') ? identifier.split('@')[0] : identifier);
        const newEmail = agr ? agr.email : (idNorm.includes('@') ? identifier : '');

        judgesList.push({
          id: newId,
          name: newName,
          email: newEmail,
          eventId: (agr ? agr.eventId : '0'),
          venueId: (agr ? agr.venueId : null),
          role: 'Judge',
          present: false,
          isUnlocked: !!isUnlocked,
          scoresLocked: false,
          avatar: agr ? agr.photoUrl : '',
          attendanceLog: [],
          color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
        });
      }

      return { ...state, judges: judgesList, lastUpdated: Date.now() };
    });

    try {
      if (this.state.judges) {
        localStorage.setItem('knsdc_judges', JSON.stringify(this.state.judges));
      }
    } catch(e) {}

    if (this.forceSaveStateToSupabase) {
      await this.forceSaveStateToSupabase().catch(e => console.warn('[setJudgeUnlock] force-save error:', e));
    }
    return true;
  }

  // ─── Final Score Submission: Password Lock & Automatic Absenteeism ──
  async lockJudgeFinalScores(identifier, password) {
    const idNorm = String(identifier || '').toLowerCase().trim();
    const now = Date.now();
    const nowStr = new Date().toISOString();

    this.setData(state => {
      const judgesList = [...(state.judges || [])];
      let target = judgesList.find(j => {
        if (!j) return false;
        const jEmail = String(j.email || '').toLowerCase().trim();
        const jName = String(j.name || '').toLowerCase().trim();
        const jId = String(j.id || '');
        return (jEmail && jEmail === idNorm) || 
               (jName && jName === idNorm) || 
               (jId === idNorm);
      });

      if (target) {
        target.scoresSubmitted = true;
        target.scoresSubmittedAt = now;
        target.scoresLocked = true;
        target.lockPassword = String(password || '');
        target.lockedAt = now;
        target.present = false;       // Automatically mark Absent
        target.isUnlocked = false;    // Lock scoring

        // Log checkout in attendance if active
        target.attendanceLog = target.attendanceLog || [];
        const lastLog = target.attendanceLog[target.attendanceLog.length - 1];
        if (lastLog && !lastLog.checkOut) lastLog.checkOut = nowStr;
      } else {
        const allAgreements = state.judgeAgreements || state.agreements || [];
        const agr = allAgreements.find(a => {
          if (!a) return false;
          const aEmail = String(a.email || '').toLowerCase().trim();
          const aName = String(a.name || '').toLowerCase().trim();
          const aId = String(a.id || '');
          return (aEmail && aEmail === idNorm) || 
                 (aName && aName === idNorm) || 
                 (aId === idNorm);
        });

        judgesList.push({
          id: judgesList.length ? Math.max(...judgesList.map(j => Number(j.id) || 0)) + 1 : 1,
          name: agr ? agr.name : identifier,
          email: agr ? agr.email : '',
          eventId: (agr ? agr.eventId : '0'),
          venueId: (agr ? agr.venueId : null),
          role: 'Judge',
          present: false,
          isUnlocked: false,
          scoresSubmitted: true,
          scoresSubmittedAt: now,
          scoresLocked: true,
          lockPassword: String(password || ''),
          lockedAt: now,
          attendanceLog: [],
          color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
        });
      }

      return { ...state, judges: judgesList, lastUpdated: now };
    });

    try {
      if (this.state.judges) {
        localStorage.setItem('knsdc_judges', JSON.stringify(this.state.judges));
      }
    } catch(e) {}

    if (this.forceSaveStateToSupabase) {
      await this.forceSaveStateToSupabase().catch(e => console.warn('[lockJudgeFinalScores] force-save error:', e));
    }
    return true;
  }

  // ─── Monitor Unlock for Final Submitted Judge ───────────────────────
  async unlockJudgeFinalScores(identifier) {
    const idNorm = String(identifier || '').toLowerCase().trim();
    const now = Date.now();

    this.setData(state => {
      const judgesList = [...(state.judges || [])];
      let target = judgesList.find(j => {
        if (!j) return false;
        const jEmail = String(j.email || '').toLowerCase().trim();
        const jName = String(j.name || '').toLowerCase().trim();
        const jId = String(j.id || '');
        return (jEmail && jEmail === idNorm) || 
               (jName && jName === idNorm) || 
               (jId === idNorm);
      });

      if (target) {
        target.scoresLocked = false;
        target.isUnlocked = true;
        target.unlockedAt = now;
      }

      return { ...state, judges: judgesList, lastUpdated: now };
    });

    try {
      if (this.state.judges) {
        localStorage.setItem('knsdc_judges', JSON.stringify(this.state.judges));
      }
    } catch(e) {}

    if (this.forceSaveStateToSupabase) {
      await this.forceSaveStateToSupabase().catch(e => console.warn('[unlockJudgeFinalScores] force-save error:', e));
    }
    return true;
  }

  async deleteParticipant(id) {
    try {
      // ⚠️ SOFT DELETE ONLY — Registration data is NEVER permanently deleted.
      // We mark the participant as 'Archived' so they are hidden from active
      // lists but their registration, scores, and uploaded files are preserved.
      const archivedUpdate = {
        stage_status: 'Archived'
      };

      if (this.supabase) {
        const { error } = await this.supabase
          .from('public_registrations')
          .update(archivedUpdate)
          .eq('id', id);
        if (error) {
          console.error('[LocalSync] Error archiving registration', error);
          return false;
        }
      }

      // Remove from local active list (data still exists in DB as Archived)
      this.setData(st => ({
        ...st,
        participants: (st.participants || []).filter(part => String(part.id) !== String(id))
      }));
      return true;
    } catch(e) { console.error(e); return false; }
  }
  // ─────────────────────────────────────────────────────────────────────
  // PERMANENT DELETE — Only use when Monitor explicitly confirms.
  // Removes the row from the database and deletes all uploaded files.
  // ─────────────────────────────────────────────────────────────────────
  async permanentlyDeleteParticipant(id) {
    try {
      const state = this.state || {};
      const p = (state.participants || []).find(part => String(part.id) === String(id));

      // Delete uploaded files from storage
      if (p && p.formAnswers) {
        const filesToDelete = [];
        const checkUrl = (val) => {
          if (typeof val === 'string' && val.includes('supabase.co/storage/v1/object/public/knsdc-registration/')) {
            const path = val.split('knsdc-registration/')[1];
            if (path) filesToDelete.push(path);
          }
        };
        Object.values(p.formAnswers).forEach(val => {
          if (Array.isArray(val)) val.forEach(v => checkUrl(v));
          else checkUrl(val);
        });
        if (filesToDelete.length > 0 && this.supabase) {
          console.log('[LocalSync] Permanently deleting files:', filesToDelete);
          await this.supabase.storage.from('knsdc-registration').remove(filesToDelete);
        }
      }

      // Hard DELETE row from database
      if (this.supabase) {
        const { error } = await this.supabase.from('public_registrations').delete().eq('id', id);
        if (error) { console.error('[LocalSync] Error permanently deleting registration', error); return false; }
      }

      this.setData(st => ({
        ...st,
        participants: (st.participants || []).filter(part => String(part.id) !== String(id))
      }));
      return true;
    } catch(e) { console.error(e); return false; }
  }


  async addChatMessage(text, participantId, senderRole, eventId = null) {
    try {
      const st = this.state || {};
      let resolvedEventId = eventId;
      if (!resolvedEventId && st.participants) {
        const foundP = st.participants.find(p => String(p.id) === String(participantId));
        if (foundP) {
          resolvedEventId = foundP.eventId || foundP.event_id || null;
        }
      }
      if (!resolvedEventId) {
        resolvedEventId = st.activeEventId || null;
      }

      const msg = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        participantId: String(participantId),
        eventId: resolvedEventId ? String(resolvedEventId) : null,
        senderRole, // 'participant' or 'monitor'
        text,
        timestamp: Date.now(),
        read: false
      };
      
      st.chatMessages = st.chatMessages || [];
      
      // Auto-delete older than 3 hours (3 * 60 * 60 * 1000)
      const THREE_HOURS = 3 * 60 * 60 * 1000;
      const now = Date.now();
      st.chatMessages = st.chatMessages.filter(m => (now - m.timestamp) < THREE_HOURS);
      
      st.chatMessages.push(msg);
      
      // Broadcast locally
      if (this.broadcastChannel) {
        this.broadcastChannel.send({
          type: 'broadcast',
          event: 'state_update',
          payload: { chatMessagesUpdate: [msg] }
        });
      }
      
      this.saveStateToSupabase(this.state);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async markMessagesAsRead(participantId, readerRole) {
    try {
      const st = this.state || {};
      if (!st.chatMessages) return;
      
      let changed = false;
      const updatedMessages = [];
      
      st.chatMessages.forEach(msg => {
        if (String(msg.participantId) === String(participantId)) {
          // If monitor is reading, mark participant's messages as read.
          // If participant is reading, mark everyone else's messages as read.
          if (readerRole === 'monitor' && msg.senderRole === 'participant' && !msg.read) {
            msg.read = true;
            changed = true;
            updatedMessages.push(msg);
          } else if (readerRole === 'participant' && msg.senderRole !== 'participant' && !msg.read) {
            msg.read = true;
            changed = true;
            updatedMessages.push(msg);
          }
        }
      });
      
      if (changed) {
        if (this.broadcastChannel) {
          this.broadcastChannel.send({
            type: 'broadcast',
            event: 'state_update',
            payload: { chatMessagesUpdate: updatedMessages }
          });
        }
        this.saveStateToSupabase(this.state);
      }
    } catch(e) {
      console.error(e);
    }
  }

  async loadParticipants() {
    if (!this.supabase) return this.state.participants || [];
    try {
      // Only fetch active (non-archived) participants with lean columns to minimize egress
      const { data, error } = await this.supabase
        .from('public_registrations')
        .select('id, name, phone, age, gender, event_id, category, venue, form_answers, stage_status, round, present, reg_date, scores, round_scores, round_comments, comment, is_verified')
        .neq('stage_status', 'Archived');
      if (error) {
        console.error('[LocalSync] Error loading participants from Supabase', error);
        return this.state.participants || [];
      }
      
      const currentPartsMap = new Map((this.state.participants || []).map(p => [String(p.id), p]));
      const now = Date.now();
      const mappedParts = data.map(p => {
        const existing = currentPartsMap.get(String(p.id)) || {};
        const formAns = p.form_answers || existing.formAnswers || {};
        const userEmail = (formAns && (formAns.email || formAns['Email Address'] || formAns['Email'])) || existing.email || '';
        const hasStageChange = existing.stageStatus !== undefined || existing.queueOrder !== undefined || existing.present !== undefined || existing.roundPresence !== undefined;
        const isLocallyLocked = existing.localMutatedAt && (now - existing.localMutatedAt < (hasStageChange ? 6000 : 15000));

        return {
          id: p.id,
          name: p.name,
          phone: p.phone,
          age: Number(p.age) || existing.age || 0,
          gender: p.gender || existing.gender || '',
          email: userEmail,
          eventId: p.event_id ? (Number(p.event_id) || p.event_id) : existing.eventId,
          catId: Number(p.category) || existing.catId || null,
          venueId: Number(p.venue) || existing.venueId || null,
          date: existing.date || p.reg_date,
          formAnswers: formAns,
          present: isLocallyLocked && existing.present !== undefined ? existing.present : (p.present !== undefined ? p.present : (existing.present !== undefined ? existing.present : false)),
          presentMarkedAt: isLocallyLocked && existing.presentMarkedAt ? existing.presentMarkedAt : (existing.presentMarkedAt || null),
          queueOrder: isLocallyLocked && existing.queueOrder !== undefined ? existing.queueOrder : (existing.queueOrder !== undefined ? existing.queueOrder : null),
          queuedAt: isLocallyLocked && existing.queuedAt !== undefined ? existing.queuedAt : (existing.queuedAt || null),
          round: isLocallyLocked && existing.round ? existing.round : (p.round || existing.round || 'audition'),
          stageStatus: isLocallyLocked && existing.stageStatus ? existing.stageStatus : (p.stage_status || existing.stageStatus || 'waiting'),
          isVerified: p.is_verified !== undefined ? p.is_verified : (existing.isVerified !== undefined ? existing.isVerified : true),
          goldenRibbon: existing.goldenRibbon || false,
          goldenRibbonBy: existing.goldenRibbonBy || null,
          goldenRibbonAt: existing.goldenRibbonAt || null,
          localMutatedAt: existing.localMutatedAt || null,
          scores: p.scores || existing.scores || {},
          roundScores: p.round_scores || existing.roundScores || {},
          roundComments: p.round_comments || existing.roundComments || {},
          comment: p.comment || existing.comment || '',
          roundPresence: isLocallyLocked && existing.roundPresence ? existing.roundPresence : (existing.roundPresence || null),
          regDate: p.reg_date || existing.regDate,
          formLocked: formAns ? (formAns._formLocked === true) : (existing.formLocked || false),
          isReady: formAns && formAns._isReady !== undefined ? formAns._isReady : (existing.isReady || false)
        };
      });
      
      // Preserve any local participants that aren't in public_registrations yet
      const fetchedIds = new Set(mappedParts.map(p => String(p.id)));
      for (const p of this.state.participants || []) {
        if (!fetchedIds.has(String(p.id))) {
          mappedParts.push(p);
        }
      }
      
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
      const serializedMeta = JSON.stringify({ color: cObj.color, ageMin: cObj.ageMin, ageMax: cObj.ageMax, prizes: cObj.prizes || [] });
      const fullObj = {
        id: cObj.id,
        name: cObj.name,
        color: serializedMeta,
        age_min: cObj.ageMin,
        age_max: cObj.ageMax,
        event_id: cObj.eventId
      };
      let { error } = await this.supabase.from('categories').insert([fullObj]);
      if (error) {
        console.warn('[LocalSync] Category full insert notice, using fallback columns:', error.message);
        const fallbackObj = {
          id: cObj.id,
          name: cObj.name,
          event_id: cObj.eventId,
          age_limit: serializedMeta
        };
        const { error: fbErr } = await this.supabase.from('categories').insert([fallbackObj]);
        if (fbErr) {
          console.warn('[LocalSync] Category fallback insert notice, trying minimal:', fbErr.message);
          await this.supabase.from('categories').insert([{ id: cObj.id, name: cObj.name, event_id: cObj.eventId }]);
        }
      }

      // Also persist to parent event in events table
      if (cObj.eventId) {
        try {
          const curState = this.getData() || {};
          const curEv = (curState.events || []).find(e => String(e.id) === String(cObj.eventId));
          if (curEv) {
            const updatedCats = [...((curEv.categories || []).filter(c => String(c.id) !== String(cObj.id))), cObj];
            await this.supabase.from('events').update({ categories: JSON.stringify(updatedCats) }).eq('id', cObj.eventId);
          }
        } catch(evErr) {}
      }

      this.setData(state => ({
        ...state,
        categories: [...(state.categories || []).filter(c => String(c.id) !== String(cObj.id)), cObj]
      }));
      return true;
    } catch(e) {
      console.error('[LocalSync] createCategory exception:', e);
      return false;
    }
  }

  async updateCategory(id, cObj) {
    try {
      const serializedMeta = JSON.stringify({ color: cObj.color, ageMin: cObj.ageMin, ageMax: cObj.ageMax, prizes: cObj.prizes || [] });
      const fullObj = {
        name: cObj.name,
        color: serializedMeta,
        age_min: cObj.ageMin,
        age_max: cObj.ageMax
      };
      let { error } = await this.supabase.from('categories').update(fullObj).eq('id', id);
      if (error) {
        console.warn('[LocalSync] Category full update notice, using fallback:', error.message);
        const fallbackObj = {
          name: cObj.name,
          age_limit: serializedMeta
        };
        const { error: fbErr } = await this.supabase.from('categories').update(fallbackObj).eq('id', id);
        if (fbErr) {
          await this.supabase.from('categories').update({ name: cObj.name }).eq('id', id);
        }
      }

      // Also sync to parent event in events table
      const curState = this.getData() || {};
      const existingCat = (curState.categories || []).find(c => String(c.id) === String(id));
      const evId = cObj.eventId || (existingCat && existingCat.eventId);
      if (evId) {
        try {
          const curEv = (curState.events || []).find(e => String(e.id) === String(evId));
          if (curEv && curEv.categories) {
            const updatedCats = curEv.categories.map(c => String(c.id) === String(id) ? { ...c, ...cObj } : c);
            await this.supabase.from('events').update({ categories: JSON.stringify(updatedCats) }).eq('id', evId);
          }
        } catch(evErr) {}
      }

      this.setData(state => ({
        ...state,
        categories: (state.categories || []).map(c => String(c.id) === String(id) ? { ...c, ...cObj } : c)
      }));
      return true;
    } catch(e) {
      console.error('[LocalSync] updateCategory exception:', e);
      return false;
    }
  }

  async deleteCategory(id) {
    try {
      await this.supabase.from('categories').delete().eq('id', id);
      const curState = this.getData() || {};
      const catToDelete = (curState.categories || []).find(c => String(c.id) === String(id));
      const evId = catToDelete && catToDelete.eventId;
      if (evId) {
        try {
          const curEv = (curState.events || []).find(e => String(e.id) === String(evId));
          if (curEv && curEv.categories) {
            const remainingCats = curEv.categories.filter(c => String(c.id) !== String(id));
            await this.supabase.from('events').update({ categories: JSON.stringify(remainingCats) }).eq('id', evId);
          }
        } catch(evErr) {}
      }
      this.setData(state => ({
        ...state,
        categories: (state.categories || []).filter(c => String(c.id) !== String(id))
      }));
      return true;
    } catch(e) {
      return false;
    }
  }

  // ════════════════════════════════════════
  // SUPABASE VENUES CRUD
  // ════════════════════════════════════════
  async createVenue(vObj) {
    try {
      const serializedLocation = JSON.stringify({
        location: vObj.location || '',
        capacity: vObj.capacity || 0,
        dates: vObj.dates || []
      });
      // Try with dedicated columns first
      const fullObj = {
        id: vObj.id,
        name: vObj.name,
        location: vObj.location || '',
        capacity: vObj.capacity || 0,
        dates: vObj.dates || [],
        event_id: vObj.eventId
      };
      let { error } = await this.supabase.from('venues').insert([fullObj]);
      if (error) {
        console.warn('[LocalSync] Venue full insert notice, using serialized location:', error.message);
        const fallbackObj = {
          id: vObj.id,
          name: vObj.name,
          location: serializedLocation,
          event_id: vObj.eventId
        };
        await this.supabase.from('venues').insert([fallbackObj]);
      }

      // Also persist to parent event in events table
      if (vObj.eventId) {
        try {
          const curState = this.getData() || {};
          const curEv = (curState.events || []).find(e => String(e.id) === String(vObj.eventId));
          if (curEv) {
            const updatedVens = [...((curEv.venues || []).filter(v => String(v.id) !== String(vObj.id))), vObj];
            await this.supabase.from('events').update({ venues: JSON.stringify(updatedVens) }).eq('id', vObj.eventId);
          }
        } catch(evErr) {}
      }

      this.setData(state => ({
        ...state,
        venues: [...(state.venues || []).filter(v => String(v.id) !== String(vObj.id)), vObj]
      }));
      return true;
    } catch(e) {
      console.error('[LocalSync] createVenue exception:', e);
      return false;
    }
  }

  async updateVenue(id, vObj) {
    try {
      const serializedLocation = JSON.stringify({
        location: vObj.location || '',
        capacity: vObj.capacity || 0,
        dates: vObj.dates || []
      });
      const fullObj = {
        name: vObj.name,
        location: vObj.location || '',
        capacity: vObj.capacity || 0,
        dates: vObj.dates || []
      };
      let { error } = await this.supabase.from('venues').update(fullObj).eq('id', id);
      if (error) {
        const fallbackObj = { name: vObj.name, location: serializedLocation };
        await this.supabase.from('venues').update(fallbackObj).eq('id', id);
      }

      // Also sync to parent event in events table
      const curState = this.getData() || {};
      const existingVen = (curState.venues || []).find(v => String(v.id) === String(id));
      const evId = vObj.eventId || (existingVen && existingVen.eventId);
      if (evId) {
        try {
          const curEv = (curState.events || []).find(e => String(e.id) === String(evId));
          if (curEv && curEv.venues) {
            const updatedVens = curEv.venues.map(v => String(v.id) === String(id) ? { ...v, ...vObj } : v);
            await this.supabase.from('events').update({ venues: JSON.stringify(updatedVens) }).eq('id', evId);
          }
        } catch(evErr) {}
      }

      this.setData(state => ({
        ...state,
        venues: (state.venues || []).map(v => String(v.id) === String(id) ? { ...v, ...vObj } : v)
      }));
      return true;
    } catch(e) {
      return false;
    }
  }

  async deleteVenue(id) {
    try {
      await this.supabase.from('venues').delete().eq('id', id);
      const curState = this.getData() || {};
      const venToDelete = (curState.venues || []).find(v => String(v.id) === String(id));
      const evId = venToDelete && venToDelete.eventId;
      if (evId) {
        try {
          const curEv = (curState.events || []).find(e => String(e.id) === String(evId));
          if (curEv && curEv.venues) {
            const remainingVens = curEv.venues.filter(v => String(v.id) !== String(id));
            await this.supabase.from('events').update({ venues: JSON.stringify(remainingVens) }).eq('id', evId);
          }
        } catch(evErr) {}
      }
      this.setData(state => ({
        ...state,
        venues: (state.venues || []).filter(v => String(v.id) !== String(id))
      }));
      return true;
    } catch(e) {
      return false;
    }
  }

  // ════════════════════════════════════════
  // SUPABASE JUDGE AGREEMENTS CRUD
  // ════════════════════════════════════════
  async createAgreement(aObj) {
    try {
      const dbObj = {
        id: Number(aObj.id) || aObj.id,
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
      const targetId = Number(id) || id;
      const { error } = await this.supabase.from('judge_agreements').update(dbObj).eq('id', targetId);
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
      const targetId = Number(id) || id;
      if (this.supabase) {
        await this.supabase.from('judge_agreements').delete().eq('id', targetId);
        await this.supabase.from('judge_agreements').delete().eq('id', String(id));
      }
      this.setData(state => {
        const agr = (state.judgeAgreements || state.agreements || []).find(a => String(a.id) === String(id));
        const agrEmail = agr && agr.email ? agr.email.trim().toLowerCase() : '';
        const agrName = agr && agr.name ? agr.name.trim().toLowerCase() : '';

        const agreementsList = state.judgeAgreements || state.agreements || [];
        const newAgreements = agreementsList.filter(a => String(a.id) !== String(id) && String(a.id) !== String(targetId));
        const newJudges = (state.judges || []).filter(j => {
          if (String(j.id) === String(id) || String(j.id) === String(targetId)) return false;
          if (j.agreementId && (String(j.agreementId) === String(id) || String(j.agreementId) === String(targetId))) return false;
          if (agrEmail && j.email && String(j.email).trim().toLowerCase() === agrEmail) return false;
          if (agrName && j.name && String(j.name).trim().toLowerCase() === agrName) return false;
          return true;
        });

        // Clean event.judges
        const newEvents = (state.events || []).map(ev => {
          if (ev.judges && Array.isArray(ev.judges)) {
            ev.judges = ev.judges.filter(j => {
              if (String(j.id) === String(id) || String(j.id) === String(targetId)) return false;
              if (j.agreementId && (String(j.agreementId) === String(id) || String(j.agreementId) === String(targetId))) return false;
              if (agrEmail && j.email && String(j.email).trim().toLowerCase() === agrEmail) return false;
              if (agrName && j.name && String(j.name).trim().toLowerCase() === agrName) return false;
              return true;
            });
          }
          return ev;
        });

        // Clean participants scores
        const newParticipants = (state.participants || []).map(p => {
          if (p.scores) {
            delete p.scores[id];
            delete p.scores[String(id)];
            if (agr && agr.name) delete p.scores[agr.name];
            if (agrEmail) delete p.scores[agrEmail];
          }
          if (p.roundScores) {
            Object.keys(p.roundScores).forEach(r => {
              if (p.roundScores[r]) {
                delete p.roundScores[r][id];
                delete p.roundScores[r][String(id)];
                if (agr && agr.name) delete p.roundScores[r][agr.name];
                if (agrEmail) delete p.roundScores[r][agrEmail];
              }
            });
          }
          if (p.judgeLocks) {
            delete p.judgeLocks[id];
            delete p.judgeLocks[String(id)];
            if (agr && agr.name) delete p.judgeLocks[agr.name];
            if (agrEmail) delete p.judgeLocks[agrEmail];
          }
          return p;
        });

        return {
          ...state,
          agreements: newAgreements,
          judgeAgreements: newAgreements,
          judges: newJudges,
          events: newEvents,
          participants: newParticipants
        };
      });
      return true;
    } catch(e) { console.error('[LocalSync] Error deleting agreement:', e); return false; }
  }

  // ════════════════════════════════════════
  // SUPABASE SUBJECTS CRUD
  // ════════════════════════════════════════
  async createSubject(sObj) {
    try {
      const numId = Number(sObj.id) || Date.now();
      const maxM = Number(sObj.maxMarks) || 10;
      const evId = sObj.eventId ? (Number(sObj.eventId) || sObj.eventId) : null;
      const normalizedSub = {
        id: numId,
        name: sObj.name,
        maxMarks: maxM,
        desc: sObj.desc || '',
        eventId: evId
      };

      const fullObj = {
        id: numId,
        name: sObj.name,
        subject_name: sObj.name,
        max_marks: maxM,
        max_score: maxM,
        description: sObj.desc || '',
        event_id: evId
      };
      let { error } = await this.supabase.from('scoring_subjects').upsert([fullObj]);
      if (error) {
        console.warn('[LocalSync] Subject full upsert notice, trying individual fields:', error.message);
        await this.supabase.from('scoring_subjects').upsert([{
          id: numId,
          name: sObj.name,
          max_marks: maxM,
          description: sObj.desc || '',
          event_id: evId
        }]);
      }

      // Also persist to parent event in events table
      if (evId) {
        try {
          const curState = this.getData() || {};
          const curEv = (curState.events || []).find(e => String(e.id) === String(evId));
          if (curEv) {
            let existingSubs = [];
            if (Array.isArray(curEv.subjects) && curEv.subjects.length > 0) {
              existingSubs = curEv.subjects;
            } else if (curEv.scoring_subjects) {
              existingSubs = typeof curEv.scoring_subjects === 'string' ? JSON.parse(curEv.scoring_subjects) : curEv.scoring_subjects;
            }
            const updatedSubs = [...(existingSubs.filter(s => String(s.id) !== String(numId))), normalizedSub];
            curEv.subjects = updatedSubs;
            curEv.scoring_subjects = updatedSubs;
            await this.supabase.from('events').update({ scoring_subjects: JSON.stringify(updatedSubs) }).eq('id', Number(evId) || evId);
          }
        } catch(evErr) {
          console.warn('[LocalSync] Error updating events.scoring_subjects:', evErr);
        }
      }
      
      this.setData(state => {
        const evIdx = state.events ? state.events.findIndex(e => String(e.id) === String(evId)) : -1;
        if (evIdx !== -1) {
          const evSubs = (state.events[evIdx].subjects || []).filter(s => String(s.id) !== String(numId));
          state.events[evIdx].subjects = [...evSubs, normalizedSub];
          state.events[evIdx].scoring_subjects = [...evSubs, normalizedSub];
        }
        const globalSubs = (state.subjects || []).filter(s => String(s.id) !== String(numId));
        state.subjects = [...globalSubs, normalizedSub];
        return { ...state };
      });

      // Instant sub-second realtime broadcast (<50ms) to Judge portals and other clients
      if (this.broadcastChannel) {
        this.broadcastChannel.send({
          type: 'broadcast',
          event: 'state_update',
          payload: {
            subjectsUpdate: {
              action: 'create',
              subject: normalizedSub,
              eventId: evId,
              timestamp: Date.now()
            }
          }
        }).catch(err => console.error('[LocalSync] Broadcast subject create error:', err));
      }

      return true;
    } catch(e) { console.error(e); return false; }
  }

  async updateSubject(id, sObj) {
    try {
      const numId = Number(id) || id;
      const maxM = Number(sObj.maxMarks) || 10;
      const curState = this.getData() || {};
      const existingSub = (curState.subjects || []).find(s => String(s.id) === String(id));
      const evId = sObj.eventId ? (Number(sObj.eventId) || sObj.eventId) : (existingSub && existingSub.eventId ? (Number(existingSub.eventId) || existingSub.eventId) : null);

      const normalizedSub = {
        id: numId,
        name: sObj.name,
        maxMarks: maxM,
        desc: sObj.desc || '',
        eventId: evId
      };

      const fullObj = {
        name: sObj.name,
        subject_name: sObj.name,
        max_marks: maxM,
        max_score: maxM,
        description: sObj.desc || '',
        event_id: evId
      };
      let { error } = await this.supabase.from('scoring_subjects').update(fullObj).eq('id', numId);
      if (error) {
        await this.supabase.from('scoring_subjects').update({
          name: sObj.name,
          max_marks: maxM,
          description: sObj.desc || '',
          event_id: evId
        }).eq('id', numId);
      }

      // Also sync to parent event in events table
      if (evId) {
        try {
          const curEv = (curState.events || []).find(e => String(e.id) === String(evId));
          if (curEv) {
            let existingSubs = [];
            if (Array.isArray(curEv.subjects) && curEv.subjects.length > 0) {
              existingSubs = curEv.subjects;
            } else if (curEv.scoring_subjects) {
              existingSubs = typeof curEv.scoring_subjects === 'string' ? JSON.parse(curEv.scoring_subjects) : curEv.scoring_subjects;
            }
            const updatedSubs = existingSubs.map(s => String(s.id) === String(id) ? { ...s, ...normalizedSub } : s);
            curEv.subjects = updatedSubs;
            curEv.scoring_subjects = updatedSubs;
            await this.supabase.from('events').update({ scoring_subjects: JSON.stringify(updatedSubs) }).eq('id', Number(evId) || evId);
          }
        } catch(evErr) {}
      }
      
      this.setData(state => {
        const evIdx = state.events ? state.events.findIndex(e => String(e.id) === String(evId)) : -1;
        if (evIdx !== -1) {
          state.events[evIdx].subjects = (state.events[evIdx].subjects || []).map(s => String(s.id) === String(id) ? { ...s, ...normalizedSub } : s);
          state.events[evIdx].scoring_subjects = (state.events[evIdx].scoring_subjects || []).map(s => String(s.id) === String(id) ? { ...s, ...normalizedSub } : s);
        }
        state.subjects = (state.subjects || []).map(s => String(s.id) === String(id) ? { ...s, ...normalizedSub } : s);
        return { ...state };
      });

      // Instant sub-second realtime broadcast (<50ms) to Judge portals
      if (this.broadcastChannel) {
        this.broadcastChannel.send({
          type: 'broadcast',
          event: 'state_update',
          payload: {
            subjectsUpdate: {
              action: 'update',
              id: numId,
              subject: normalizedSub,
              eventId: evId,
              timestamp: Date.now()
            }
          }
        }).catch(err => console.error('[LocalSync] Broadcast subject update error:', err));
      }

      return true;
    } catch(e) { console.error(e); return false; }
  }

  async deleteSubject(id) {
    try {
      const numId = Number(id) || id;
      const { error } = await this.supabase.from('scoring_subjects').delete().eq('id', numId);
      if (error) console.error('[LocalSync] Error deleting subject', error);

      const curState = this.getData() || {};
      const subToDelete = (curState.subjects || []).find(s => String(s.id) === String(id));
      const evId = subToDelete && subToDelete.eventId;
      if (evId) {
        try {
          const curEv = (curState.events || []).find(e => String(e.id) === String(evId));
          if (curEv) {
            let existingSubs = [];
            if (Array.isArray(curEv.subjects) && curEv.subjects.length > 0) {
              existingSubs = curEv.subjects;
            } else if (curEv.scoring_subjects) {
              existingSubs = typeof curEv.scoring_subjects === 'string' ? JSON.parse(curEv.scoring_subjects) : curEv.scoring_subjects;
            }
            const remainingSubs = existingSubs.filter(s => String(s.id) !== String(id));
            curEv.subjects = remainingSubs;
            curEv.scoring_subjects = remainingSubs;
            await this.supabase.from('events').update({ scoring_subjects: JSON.stringify(remainingSubs) }).eq('id', Number(evId) || evId);
          }
        } catch(evErr) {}
      }
      
      this.setData(state => {
        if (state.events) {
          state.events.forEach(ev => {
            ev.subjects = (ev.subjects || []).filter(s => String(s.id) !== String(id));
            if (ev.scoring_subjects) {
              ev.scoring_subjects = (ev.scoring_subjects || []).filter(s => String(s.id) !== String(id));
            }
          });
        }
        state.subjects = (state.subjects || []).filter(s => String(s.id) !== String(id));
        return { ...state };
      });

      // Instant sub-second realtime broadcast (<50ms) to Judge portals
      if (this.broadcastChannel) {
        this.broadcastChannel.send({
          type: 'broadcast',
          event: 'state_update',
          payload: {
            subjectsUpdate: {
              action: 'delete',
              id: numId,
              eventId: evId,
              timestamp: Date.now()
            }
          }
        }).catch(err => console.error('[LocalSync] Broadcast subject delete error:', err));
      }

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

  async deleteContactMessage(id) {
    try {
      const { error } = await this.supabase.from('public_messages').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('[LocalSync] Error deleting message', e);
      return false;
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
