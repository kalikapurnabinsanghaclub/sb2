const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually since this is a raw Node script
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    env[parts[0].trim()] = parts[1].trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    // 1. Test connection by selecting from sync_state
    console.log('Querying sync_state table...');
    const { data, error } = await supabase.from('sync_state').select('*');
    if (error) {
      console.error('Error querying sync_state:', error);
    } else {
      console.log('Successfully queried sync_state. Found rows:', data.length);
      console.log('Rows:', data);
    }

    // 2. Test events table
    console.log('Querying events table...');
    const { data: events, error: eventsError } = await supabase.from('events').select('*');
    if (eventsError) {
      console.error('Error querying events:', eventsError);
    } else {
      console.log('Successfully queried events. Found rows:', events.length);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
