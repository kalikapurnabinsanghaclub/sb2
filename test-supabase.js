const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const code = fs.readFileSync('lib/supabase.js', 'utf8');
const urlMatch = code.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const s = createClient(urlMatch[1], keyMatch[1]);
  s.from('public_registrations').select('id, name, form_data').then(d => {
    const readyParts = d.data.filter(p => p.form_data && p.form_data._isReady);
    console.log('READY PARTICIPANTS:', JSON.stringify(readyParts, null, 2));
  }).catch(console.error);
}
