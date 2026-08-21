// Supabase Configuration
let supabaseUrl = window.supabaseUrl || "https://mmbtfbxxnprtzpzdklot.supabase.co";
let supabaseAnonKey = window.supabaseAnonKey || "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA";

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
    this.saveStateTimeout = null;
    this.pendingStateToSave = null;
    this.broadcastChannel = null;
    this.lastSavedState = null;
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
    } catch(e) { console.warn('[LocalSync] localStorage read error:', e); }

    // Initialize background audio garbage collector (runs every 5 minutes)
    setInterval(() => this.runAudioGarbageCollector(), 5 * 60 * 1000);

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
        if (fetchedState.currentOnStage !== undefined) {
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
        // Create a shallow copy and strip heavy objects to fit within Supabase Realtime 1MB payload limits
        const payloadToSave = { ...stateToSave };
        delete payloadToSave.events;
        delete payloadToSave.pastEvents;
        delete payloadToSave.agreements;
        delete payloadToSave.judgeAgreements;

        console.log('[LocalSync] Debounced upsert of sync state to Supabase...');
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
    }, 1000); // Debounce DB writes at 1-second intervals
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
      if (payloadToSave.participants) {
        payloadToSave.participants = payloadToSave.participants.map(p => {
          const { image, posterData, qrDataUrl, ...rest } = p;
          return rest;
        });
      }
      delete payloadToSave.events;
      delete payloadToSave.pastEvents;
      delete payloadToSave.agreements;
      delete payloadToSave.judgeAgreements;

      console.log('[LocalSync] FORCED immediate upsert of sync state to Supabase...');
      const { error } = await this.supabase
        .from('sync_state')
        .upsert({
          id: this.syncStateId,
          payload: payloadToSave,
          last_updated: new Date().toISOString()
        });

      if (error) {
        console.error('[LocalSync] Error in forced upsert:', error);
        return false;
      }
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
                  
                  // 1. Optimistic Mutation Lock (15-second local protection window for slow internet)
                  const isLocallyLocked = lp.localMutatedAt && (now - lp.localMutatedAt < 15000);
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

      // Subscribe to events database changes to support instant sync on monitor/participant portals
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
            this.loadEvents();
          }
        )
        .subscribe((status) => {
          console.log('[LocalSync] Realtime subscription to events active:', status);
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

  handleBroadcastUpdate(payload) {
    let changed = false;

    if (payload.sportLiveScore !== undefined) {
      this.state.sportLiveScore = payload.sportLiveScore;
      changed = true;
    }

    if (payload.currentOnStage !== undefined && payload.currentOnStage !== this.state.currentOnStage) {
      this.state.currentOnStage = payload.currentOnStage;
      changed = true;
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

    if (payload.participantsUpdate && Array.isArray(payload.participantsUpdate)) {
      const parts = [...(this.state.participants || [])];
      payload.participantsUpdate.forEach(u => {
        const idx = parts.findIndex(p => String(p.id) === String(u.id));
        if (idx !== -1) {
          parts[idx] = { ...parts[idx], ...u };
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
      const { data, error } = await this.supabase.rpc('admin_upsert_staff', {
        staff_email: emailLower,
        staff_password: password,
        staff_name: name,
        staff_role: role
      });

      if (error) return { success: false, error: error.message };
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result && result.success === false) return { success: false, error: result.error };

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

      console.log('[LocalSync] Staff member added via RPC:', emailLower, role);
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
      const { data, error } = await this.supabase.rpc('admin_update_staff', {
        target_email: emailLower,
        new_name: name || null,
        new_password: (newPassword && newPassword.trim() !== '') ? newPassword : null
      });

      if (error) return { success: false, error: error.message };
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result && result.success === false) return { success: false, error: result.error };

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

      // Use SECURITY DEFINER RPC to delete staff (bypasses RLS)
      const { data, error } = await this.supabase.rpc('admin_delete_staff', {
        target_email: emailLower
      });

      if (error) {
        console.error('[LocalSync] RPC admin_delete_staff error:', error);
        return { success: false, error: error.message };
      }

      const result = typeof data === 'string' ? JSON.parse(data) : data;
      if (result && result.success === false) {
        return { success: false, error: result.error || 'Delete failed' };
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
    } catch(e) { /* localStorage full or unavailable */ }
    
    this.notify();

    // Broadcast logic
    const broadcastPayload = {};
    let shouldBroadcast = false;

    if (this.state.currentOnStage !== lastSaved.currentOnStage) {
      broadcastPayload.currentOnStage = this.state.currentOnStage;
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

    // Deep comparison to prevent infinite loop of DB saves if state hasn't changed (ignoring lastUpdated)
    const stateToCompare = { ...this.state };
    delete stateToCompare.lastUpdated;
    const lastSavedToCompare = { ...lastSaved };
    delete lastSavedToCompare.lastUpdated;

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

  // ─── MongoDB Atlas & Base64 Image Upload ───────────────────────────
  async uploadFile(file, pathPrefix = '') {
    if (!file) return null;

    // 1. Try uploading to MongoDB Atlas via backend API if available
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/participant/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.imageUrl) {
          console.log('[LocalSync] Uploaded image to MongoDB Atlas endpoint:', json.imageUrl);
          return json.imageUrl;
        }
      }
    } catch (apiErr) {
      console.warn('[LocalSync] MongoDB API route not reachable, converting to Base64 for MongoDB state sync.');
    }

    // 2. Base64 Fallback: Reads file as Data URL string to store directly inside MongoDB Atlas state collections
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const base64Url = e.target.result;
        console.log('[LocalSync] Image converted to Base64 data URL for MongoDB Atlas.');
        resolve(base64Url);
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
        const otherPrizes = roundSchedules.otherPrizes || [];
        
        let formFields = dbEv.form_fields || [];
        if (typeof formFields === 'string') {
          try { formFields = JSON.parse(formFields); } catch (e) { formFields = []; }
        }
        
        let switchStates = dbEv.switch_states || {};
        if (typeof switchStates === 'string') {
          try { switchStates = JSON.parse(switchStates); } catch (e) { switchStates = {}; }
        }

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
          staff: (typeof dbEv.staff === 'string' ? JSON.parse(dbEv.staff || '[]') : dbEv.staff) || [],
          roundSchedules,
          otherPrizes,
          formFields,
          switchStates,
          publicReg: dbEv.publicReg !== undefined ? dbEv.publicReg : dbEv["publicReg"],
          stagePreview: dbEv.stagePreview !== undefined ? dbEv.stagePreview : dbEv["stagePreview"],
          resultPublic: dbEv.resultPublic !== undefined ? dbEv.resultPublic : dbEv["resultPublic"],
          active: dbEv.active,
          createdAt: dbEv.created_at,
          categories: eventCats,
          subjects: eventSubjects,
          venues: eventVens
        };
      });

      const globalCats = catData.map(c => {
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
        agreements: agrData || [],
        judgeAgreements: agrData || [],
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
        staff: eventObj.staff || [],
        round_schedules: eventObj.roundSchedules || {},
        switch_states: eventObj.switchStates || {},
        form_fields: eventObj.formFields || [],
        active: false
      };
      
      // Insert with all columns, let DB ignore unknown ones
      let { error } = await this.supabase.from('events').insert([dbObj]);
      if (error) {
        console.error('[LocalSync] Event insert failed:', error.message);
        // Try without image column (might not exist)
        delete dbObj.image;
        const { error: error2 } = await this.supabase.from('events').insert([dbObj]);
        if (error2) {
          console.error('[LocalSync] Event insert retry failed:', error2.message);
          // Try bare minimum
          const minObj = {
            id: eventObj.id,
            title: eventObj.name || 'New Event',
            date: eventObj.startDate || new Date().toISOString().split('T')[0],
            active: false
          };
          const { error: error3 } = await this.supabase.from('events').insert([minObj]);
          if (error3) {
            console.error('[LocalSync] Even minimum insert failed:', error3.message);
            alert('ERROR saving event to database: ' + error3.message);
          }
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

  async updateEvent(id, eventObj) {
    try {
      // ── Helper: try one column at a time — silently skip if column missing ──
      const tryCol = async (colObj) => {
        const { error } = await this.supabase.from('events').update(colObj).eq('id', id);
        if (error) {
          console.warn('[LocalSync] Column skipped (not in DB):', Object.keys(colObj).join(','), '-', error.message);
          return false;
        }
        return true;
      };

      // ── STEP 1: ABSOLUTE MINIMUM CORE ──────────────────────────────────────
      // Only the most basic columns that exist in EVERY version of the schema.
      // If even these fail, we return an error.
      const coreObj = {};
      if (eventObj.name        !== undefined) coreObj.title       = eventObj.name;

      const { error: coreError } = await this.supabase.from('events').update(coreObj).eq('id', id);
      if (coreError) {
        console.error('[LocalSync] Core update failed:', coreError);
        return { success: false, message: coreError.message || 'Database write error' };
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
        await tryCol({ image: eventObj.banner });
        await tryCol({ banner: eventObj.banner });
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
        await tryCol({
          staff: typeof eventObj.staff === 'string'
            ? eventObj.staff
            : JSON.stringify(eventObj.staff)
        });
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
      if (eventObj.roundSchedules !== undefined || eventObj.otherPrizes !== undefined) {
        let rs = eventObj.roundSchedules || {};
        if (typeof rs === 'string') {
          try { rs = JSON.parse(rs); } catch(e) { rs = {}; }
        }
        if (eventObj.otherPrizes !== undefined) {
          rs.otherPrizes = eventObj.otherPrizes;
        }
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

        return {
          ...state,
          eventFormFields: newFormFields,
          events:         (state.events        || []).map(updateFn),
          upcomingEvents: (state.upcomingEvents || []).map(updateFn)
        };
      });

      // Proactively reload from Supabase so local cache exactly matches DB structure
      setTimeout(() => {
        this.loadEvents().catch(err => console.error('[LocalSync] Error reloading events after update:', err));
      }, 500);

      return true;
    } catch (e) {
      console.error('[LocalSync] Exception updating event', e);
      return { success: false, message: e.message || 'Unknown error' };
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
        email: pObj.email || '',
        age: pObj.age || 0,
        gender: pObj.gender || '',
        category: pObj.catId ? String(pObj.catId) : null,
        venue: pObj.venueId ? String(pObj.venueId) : null,
        form_data: pObj.formAnswers || {},
        status: pObj.stageStatus === 'approved' ? 'approved' : 'pending',
        scores: pObj.scores || {},
        round_scores: pObj.roundScores || {}
      };
      
      const { error } = await this.supabase.from('public_registrations').insert([dbObj]);
      if (error) console.error('[LocalSync] Error creating registration', error);
      
      this.setData(state => {
        const parts = state.participants || [];
        if (!parts.some(p => String(p.id) === String(pObj.id))) {
          parts.push(pObj);
        }
        return { ...state, participants: parts };
      });
      return true;
    } catch(e) { console.error(e); return false; }
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
      if (pObj.email !== undefined) { dbObj.email = pObj.email; hasDbUpdates = true; }
      if (pObj.age !== undefined) { dbObj.age = pObj.age; hasDbUpdates = true; }
      if (pObj.gender !== undefined) { dbObj.gender = pObj.gender; hasDbUpdates = true; }
      if (pObj.catId !== undefined) { dbObj.category = pObj.catId ? String(pObj.catId) : null; hasDbUpdates = true; }
      if (pObj.venueId !== undefined) { dbObj.venue = pObj.venueId ? String(pObj.venueId) : null; hasDbUpdates = true; }
      if (pObj.formAnswers !== undefined) { dbObj.form_data = pObj.formAnswers; hasDbUpdates = true; }
      if (pObj.formLocked !== undefined) {
        if (!dbObj.form_data) {
          const currentPart = (this.state.participants || []).find(p => String(p.id) === String(id));
          dbObj.form_data = currentPart ? { ...(currentPart.formAnswers || {}) } : {};
        }
        dbObj.form_data._formLocked = pObj.formLocked;
        pObj.formAnswers = { ...dbObj.form_data };
        hasDbUpdates = true;
      }
      if (pObj.isReady !== undefined) {
        if (!dbObj.form_data) {
          const currentPart = (this.state.participants || []).find(p => String(p.id) === String(id));
          dbObj.form_data = currentPart ? { ...(currentPart.formAnswers || {}) } : {};
        }
        dbObj.form_data._isReady = pObj.isReady;
        pObj.formAnswers = { ...dbObj.form_data };
        hasDbUpdates = true;
      }
      if (pObj.scores !== undefined) { dbObj.scores = pObj.scores; hasDbUpdates = true; }
      if (pObj.roundScores !== undefined) { dbObj.round_scores = pObj.roundScores; hasDbUpdates = true; }
      if (pObj.roundComments !== undefined) { dbObj.round_comments = pObj.roundComments; hasDbUpdates = true; }
      if (pObj.comment !== undefined) { dbObj.comment = pObj.comment; hasDbUpdates = true; }

      if (hasDbUpdates) {
        if (this.supabase) {
          try {
            const { error } = await this.supabase.from('public_registrations').update(dbObj).eq('id', id);
            if (error) {
              console.error('[LocalSync] Error updating registration:', error);
            }
          } catch (netErr) {
            console.warn('[LocalSync] Network/Supabase exception updating registration:', netErr);
            // Allow local update to proceed
          }
        } else {
          console.warn('[LocalSync] Supabase not initialized, bypassing public_registrations update');
        }
      }
      
      this.setData(state => {
        const parts = (state.participants || []).map(p => String(p.id) === String(id) ? { ...p, ...pObj } : p);
        return { ...state, participants: parts };
      });

      // Force-save sync_state immediately when scores or stage changes are involved
      if (pObj.scores !== undefined || pObj.roundScores !== undefined || pObj.roundComments !== undefined || pObj.stageStatus !== undefined || pObj.queueOrder !== undefined) {
        this.forceSaveStateToSupabase().catch(err =>
          console.warn('[LocalSync] Force-save after update failed:', err)
        );
      }

      return true;
    } catch(e) { console.error(e); return false; }
  }

  async deleteParticipant(id) {
    try {
      // ⚠️ SOFT DELETE ONLY — Registration data is NEVER permanently deleted.
      // We mark the participant as 'Archived' so they are hidden from active
      // lists but their registration, scores, and uploaded files are preserved.
      const archivedUpdate = {
        status: 'Archived',
        archived_at: new Date().toISOString()
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


  async addChatMessage(text, participantId, senderRole) {
    try {
      const msg = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        participantId: String(participantId),
        senderRole, // 'participant' or 'monitor'
        text,
        timestamp: Date.now(),
        read: false
      };
      
      const st = this.state || {};
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
      // Only fetch active (non-archived) participants
      const { data, error } = await this.supabase
        .from('public_registrations')
        .select('*')
        .neq('status', 'Archived');
      if (error) {
        console.error('[LocalSync] Error loading participants from Supabase', error);
        return this.state.participants || [];
      }
      
      const currentPartsMap = new Map((this.state.participants || []).map(p => [String(p.id), p]));
      
      const mappedParts = data.map(p => {
        const existing = currentPartsMap.get(String(p.id)) || {};
        return {
          id: p.id,
          name: p.name,
          phone: p.phone,
          age: Number(p.age) || existing.age || 0,
          gender: p.gender || existing.gender || '',
          email: p.email || existing.email || '',
          eventId: p.event_id || existing.eventId,
          catId: Number(p.category) || existing.catId || null,
          venueId: Number(p.venue) || existing.venueId || null,
          date: existing.date || p.created_at,
          formAnswers: p.form_data || existing.formAnswers || {},
          present: existing.present !== undefined ? existing.present : false,
          presentMarkedAt: existing.presentMarkedAt || null,
          queueOrder: existing.queueOrder !== undefined ? existing.queueOrder : null,
          queuedAt: existing.queuedAt || null,
          round: existing.round || 'audition',
          stageStatus: existing.stageStatus || 'waiting',
          goldenRibbon: existing.goldenRibbon || false,
          goldenRibbonBy: existing.goldenRibbonBy || null,
          goldenRibbonAt: existing.goldenRibbonAt || null,
          localMutatedAt: existing.localMutatedAt || null,
          scores: p.scores || existing.scores || {},
          roundScores: p.round_scores || existing.roundScores || {},
          roundComments: p.round_comments || existing.roundComments || {},
          comment: p.comment || existing.comment || '',
          roundPresence: existing.roundPresence || null,
          regDate: existing.regDate || p.created_at,
          formLocked: p.form_data ? (p.form_data._formLocked === true) : (existing.formLocked || false),
          isReady: p.form_data && p.form_data._isReady !== undefined ? p.form_data._isReady : (existing.isReady || false)
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
      const dbObj = {
        id: cObj.id,
        name: cObj.name,
        color: JSON.stringify({ color: cObj.color, prizes: cObj.prizes || [] }),
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
      const dbObj = {
        name: cObj.name,
        color: JSON.stringify({ color: cObj.color, prizes: cObj.prizes || [] }),
        age_min: cObj.ageMin,
        age_max: cObj.ageMax
      };
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
      const serializedLocation = JSON.stringify({
        location: vObj.location || '',
        capacity: vObj.capacity || 0,
        dates: vObj.dates || []
      });
      const dbObj = { id: vObj.id, name: vObj.name, location: serializedLocation, event_id: vObj.eventId };
      await this.supabase.from('venues').insert([dbObj]);
      this.setData(state => ({ ...state, venues: [...(state.venues || []), vObj] }));
      return true;
    } catch(e) { return false; }
  }

  async updateVenue(id, vObj) {
    try {
      const serializedLocation = JSON.stringify({
        location: vObj.location || '',
        capacity: vObj.capacity || 0,
        dates: vObj.dates || []
      });
      const dbObj = { name: vObj.name, location: serializedLocation };
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
      const { error } = await this.supabase.from('judge_agreements').delete().eq('id', targetId);
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
