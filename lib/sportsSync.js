// Supabase Configuration
let supabaseUrl = "https://mmbtfbxxnprtzpzdklot.supabase.co";
let supabaseAnonKey = "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA";

try {
  const metaEnv = Function('return typeof import.meta !== "undefined" ? import.meta.env : null')();
  if (metaEnv) {
    if (metaEnv.VITE_SUPABASE_URL) supabaseUrl = metaEnv.VITE_SUPABASE_URL;
    if (metaEnv.VITE_SUPABASE_ANON_KEY) supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY;
  }
} catch (e) {}

class SportsSync {
  constructor() {
    this.supabase = null;
    this.init();
  }

  init() {
    if (window.supabase) {
      try {
        this.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log('[SportsSync] Supabase client successfully initialized.');
      } catch (err) {
        console.error('[SportsSync] Error initializing Supabase client:', err);
      }
    }
  }

  async sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // --- Auth ---
  async login(email, password) {
    if (!this.supabase) return { success: false, error: 'No backend connection' };
    
    // Default hardcoded super umpire account as requested
    if (email.toLowerCase() === 'ump@knsdc.in' && password === 'knsdc743336') {
      return { success: true, user: { name: 'Amit', email: 'ump@knsdc.in', role: 'umpire', id: 'supa_umpior' } };
    }
    
    try {
      // Step 1: Check staff_credentials table (the source of truth)
      const passwordHash = await this.sha256(password);
      const { data: staffData, error: staffErr } = await this.supabase
        .from('staff_credentials')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();
        
      if (!staffErr && staffData) {
        if (staffData.password_hash !== passwordHash) return { success: false, error: 'Incorrect password' };
        if (staffData.role !== 'umpire' && staffData.role !== 'admin') return { success: false, error: 'Unauthorized. Umpire role required.' };
        return { success: true, user: { name: staffData.name, email: staffData.email, role: staffData.role } };
      }

      // Step 2: Fallback to global state for legacy entries
      const { data, error } = await this.supabase
        .from('knsdc_state')
        .select('state')
        .eq('id', 'knsdc_global_sync')
        .single();
        
      if (error || !data) return { success: false, error: 'User not found in system' };
      
      const state = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
      const staffList = (state.staff || []).concat(state.judges || []).concat(state.hostAssignments || []);
      
      const user = staffList.find(s => s.email && s.email.toLowerCase() === email.toLowerCase());
      
      if (!user) return { success: false, error: 'User not found in system' };
      if (user.password !== password) return { success: false, error: 'Incorrect password' };
      if (user.role !== 'umpire' && user.role !== 'admin') return { success: false, error: 'Unauthorized. Umpire role required.' };
      
      return { success: true, user };
    } catch (e) {
      return { success: false, error: 'Auth failed' };
    }
  }

  // --- Matches ---
  async getAssignedMatches(umpireEmail) {
    if (!this.supabase) return [];
    try {
      const { data, error } = await this.supabase
        .from('knsdc_state')
        .select('state')
        .eq('id', 'knsdc_global_sync')
        .single();
        
      if (error || !data) return [];
      
      const state = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
      const events = state.events || [];
      
      // Filter events where staff array contains umpireEmail and type is Sports
      // Super umpire (ump@knsdc.in) sees ALL sports events
      return events.filter(ev => {
        if (ev.type !== 'Sports') return false;
        if (umpireEmail.toLowerCase() === 'ump@knsdc.in') return true;
        
        return ev.staff && 
               Array.isArray(ev.staff) && 
               ev.staff.map(s => s.toLowerCase()).includes(umpireEmail.toLowerCase());
      });
    } catch(err) {
      return [];
    }
  }

  async initCricketMatch(event_id, team1_name, team2_name, toss_winner, toss_decision, max_overs, umpire_email) {
    if (!this.supabase) return null;
    const matchId = Date.now();
    const matchObj = {
      id: matchId,
      event_id,
      team1_name,
      team2_name,
      toss_winner,
      toss_decision,
      max_overs,
      umpire_email,
      status: 'live',
      current_inning: 1
    };
    
    const { error } = await this.supabase.from('cricket_matches').insert(matchObj);
    if (error) console.error(error);
    
    const battingTeam = toss_decision === 'bat' ? toss_winner : (toss_winner === team1_name ? team2_name : team1_name);
    const bowlingTeam = battingTeam === team1_name ? team2_name : team1_name;
    
    const { data: innData, error: innError } = await this.supabase.from('cricket_innings').insert({
      match_id: matchId,
      inning_number: 1,
      batting_team: battingTeam,
      bowling_team: bowlingTeam,
      status: 'live'
    }).select().single();
    
    if (innError) console.error(innError);
    
    return { match: matchObj, currentInning: innData };
  }

  async getActiveMatch(event_id) {
    if (!this.supabase) return null;
    const { data, error } = await this.supabase.from('cricket_matches')
      .select('*')
      .eq('event_id', event_id)
      .eq('status', 'live')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) return null;
    
    const { data: innData } = await this.supabase.from('cricket_innings')
      .select('*')
      .eq('match_id', data.id)
      .eq('status', 'live')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    return { match: data, currentInning: innData };
  }

  async pushBall(inning_id, ballData) {
    if (!this.supabase) return false;
    const { error } = await this.supabase.from('cricket_balls').insert({
      inning_id,
      ...ballData
    });
    if (error) {
      console.error('[SportsSync] pushBall error', error);
      return false;
    }
    return true;
  }
  
  async updateInningScore(inning_id, total_runs, total_wickets, overs_bowled, extras) {
    if (!this.supabase) return false;
    const { error } = await this.supabase.from('cricket_innings')
      .update({ total_runs, total_wickets, overs_bowled, extras })
      .eq('id', inning_id);
    return !error;
  }
}

window.sportsEngine = new SportsSync();
