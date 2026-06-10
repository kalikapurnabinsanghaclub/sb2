const fs = require('fs');
let c = fs.readFileSync('c:\\\\Users\\\\sourav pc\\\\Desktop\\\\kalikapur\\\\index.html', 'utf8');

const directFetchCode = `    // ── DIRECT SUPABASE EVENTS FETCH ─────────────────────────────────────
    async function fetchEventsDirectly() {
      try {
        if (!window.supabase) return;
        const client = window.supabase.createClient(
          "https://mmbtfbxxnprtzpzdklot.supabase.co",
          "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA"
        );
        const { data, error } = await client.from('events').select('*').order('start_date', { ascending: true });
        if (error || !data || data.length === 0) return;
        const today = new Date();
        const mapped = data.map(dbEv => ({
          id: dbEv.id,
          name: dbEv.name || 'Unknown Event',
          date: dbEv.start_date || '',
          startDate: dbEv.start_date || '',
          startTime: dbEv.start_time || '',
          endDate: dbEv.end_date || '',
          endTime: dbEv.end_time || '',
          disp: dbEv.start_date || '',
          cat: dbEv.type || 'General',
          venue: dbEv.venue || 'Kalikapur Community Hall',
          banner: dbEv.banner || null,
          description: dbEv.description || '',
          org: dbEv.org || 'KNSDC',
          roundSchedules: dbEv.round_schedules || {},
          staff: dbEv.staff || [],
          formFields: dbEv.form_fields || null,
          switchStates: dbEv.switch_states || { publicReg: true, stagePreview: true, resultPublic: true },
          icon: dbEv.type === 'Cultural' ? '\\u{1F483}' : dbEv.type === 'Sports' ? '\\u26BD' : '\\uD83D\\uDCC5',
          col: dbEv.type === 'Cultural' ? '#7B2D8B' : dbEv.type === 'Sports' ? '#F59E0B' : '#FF6B35'
        }));
        const activeEvents = mapped.filter(ev => {
          const ed = ev.endDate || ev.startDate || '';
          const et = ev.endTime || '23:59';
          if (!ed) return true;
          const evEndObj = new Date(ed.replace(/-/g, '/') + ' ' + et + ':00');
          return isNaN(evEndObj.getTime()) ? true : evEndObj >= today;
        });
        if (activeEvents.length > 0) {
          EVENTS = activeEvents;
          if (typeof renderEvents === 'function') renderEvents();
          if (typeof renderMarquee === 'function') renderMarquee();
          if (typeof checkLiveStatus === 'function') checkLiveStatus();
          console.log('[DirectFetch] ' + activeEvents.length + ' events loaded from Supabase.');
        }
        if (!window._eventsRealtimeSubscribed) {
          window._eventsRealtimeSubscribed = true;
          client.channel('public:events-index')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
              fetchEventsDirectly();
            })
            .subscribe();
        }
      } catch (e) { console.error('[DirectFetch] Exception:', e); }
    }
    fetchEventsDirectly();
    // ─────────────────────────────────────────────────────────────────────

`;

// Find the exact position of "function setupSync" and insert before it
const marker = '    function setupSync() {';
const idx = c.indexOf(marker);
if (idx === -1) {
  console.error('Could not find setupSync marker!');
  process.exit(1);
}

c = c.slice(0, idx) + directFetchCode + c.slice(idx);
fs.writeFileSync('c:\\\\Users\\\\sourav pc\\\\Desktop\\\\kalikapur\\\\index.html', c);
console.log('Done! Inserted direct fetch before setupSync at index', idx);
