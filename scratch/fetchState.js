import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase variables in .env:', { supabaseUrl, supabaseAnonKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Fetching sync_state...');
  const { data: syncState, error: err1 } = await supabase.from('sync_state').select('*');
  if (err1) {
    console.error('Error fetching sync_state:', err1);
  } else {
    console.log('sync_state payload keys:', syncState.map(s => ({ id: s.id, keys: s.payload ? Object.keys(s.payload) : null })));
    const knsdcGlobal = syncState.find(s => s.id === 'knsdc_global_sync');
    if (knsdcGlobal && knsdcGlobal.payload) {
      console.log('knsdc_global_sync workItems:', knsdcGlobal.payload.workItems);
    }
  }

  console.log('\nFetching work_items...');
  const { data: workItems, error: err2 } = await supabase.from('work_items').select('*');
  if (err2) {
    console.error('Error fetching work_items:', err2);
  } else {
    console.log('work_items in DB:', JSON.stringify(workItems, null, 2));
  }
}

main();
