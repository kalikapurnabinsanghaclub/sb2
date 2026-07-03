const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const code = fs.readFileSync('lib/supabase.js', 'utf8');
const urlMatch = code.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const s = createClient(urlMatch[1], keyMatch[1]);
  s.from('sync_state').select('*').eq('id', 'global_knsdc_state').then(d => {
    if (d.data && d.data.length > 0) {
      const state = d.data[0].payload;
      const ready = state.participants.filter(p => p.isReady);
      console.log('READY PARTICIPANTS IN SYNC_STATE:', JSON.stringify(ready, null, 2));
    } else {
      console.log('NO SYNC STATE');
    }
    process.exit(0);
  }).catch(e => { console.error(e); process.exit(1); });
}
