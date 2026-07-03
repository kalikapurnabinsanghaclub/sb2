const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const code = fs.readFileSync('lib/supabase.js', 'utf8');
const urlMatch = code.match(/supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = code.match(/supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const s = createClient(urlMatch[1], keyMatch[1]);
  s.from('public_registrations').update({ name: 'halo' }).eq('id', 'UR3335').then(d => {
    console.log('UPDATE RESULT:', JSON.stringify(d, null, 2));
  }).catch(console.error);
}
