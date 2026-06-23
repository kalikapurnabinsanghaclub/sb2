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

  // --- Auth ---
  async login(email, password) {
    if (!this.supabase) return { success: false, error: 'No backend connection' };
    
    // Default hardcoded super umpire account as requested
    if (email.toLowerCase() === 'ump@knsdc.in' && password === 'knsdc743336') {
      return { success: true, user: { name: 'Amit', email: 'ump@knsdc.in', role: 'umpire', id: 'supa_umpior' } };
    }
    
    try {
      const { data, error } = await this.supabase
        .from('knsdc_state')
        .select('state')
        .eq('id', 'knsdc_global_sync')
        .single();
        
      if (error || !data) return { success: false, error: 'Cannot fetch staff list' };
      
      const state = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
      const staffList = (state.staff || []).concat(state.judges || []).concat(state.hostAssignments || []);
      
      const user = staffList.find(s => s.email && s.email.toLowerCase() === email.toLowerCase());
      
      if (!user) return { success: false, error: 'User not found in system' };
      if (user.password !== password) return { success: false, error: 'Incorrect password' };
      if (user.role !== 'umpire' && user.role !== 'admin') return { success: false, error: 'Unauthorized. Umpire role required.' };
      
      return { success: true, user };
    } catch (e) {
      return { success: false, error: e.message };
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
      const sportsEvents = (state.events || []).filter(e => e.type === 'Sports');
      
      const myEvents = sportsEvents.filter(e => 
        e.staff && e.staff.some(s => s.toLowerCase() === umpireEmail.toLowerCase())
      );
      
      return myEvents;
    } catch (e) {
      console.error('[SportsSync] Failed to fetch matches', e);
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
