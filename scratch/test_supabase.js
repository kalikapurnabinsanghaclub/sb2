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
      events.forEach(e => {
        console.log(`Event details:`, e);
      });
    }

    // Try updating sync_state payload
    console.log('Attempting to update eventFormFields in sync_state payload...');
    if (data && data[0] && data[0].payload) {
      const payload = data[0].payload;
      if (!payload.eventFormFields) payload.eventFormFields = {};
      
      payload.eventFormFields["1781271255289"] = [
        { type: 'text', label: 'Full Name', required: true, placeholder: 'As per ID proof' },
        { type: 'radio', label: 'Gender', required: true, options: ['Male', 'Female', 'Other'] },
        { type: 'number', label: 'Phone Number', required: true, placeholder: '98XXXXXXXX' },
        { type: 'category', label: 'Category Field', required: true },
        { type: 'venue', label: 'Venue Field', required: true }
      ];
      payload.lastUpdated = Date.now();

      const { error: syncUpdateError } = await supabase
        .from('sync_state')
        .update({ payload: payload, last_updated: new Date().toISOString() })
        .eq('id', 'knsdc_global_sync');

      if (syncUpdateError) {
        console.error('Error updating sync_state payload:', syncUpdateError);
      } else {
        console.log('Successfully updated eventFormFields in sync_state!');
      }
    }

    // Query judge_agreements
    console.log('Querying judge_agreements table...');
    const { data: agrs, error: agrError } = await supabase.from('judge_agreements').select('*');
    if (agrError) {
      console.error('Error querying judge_agreements:', agrError);
      return;
    }
    console.log('Successfully queried judge_agreements. Found rows:', agrs.length);

    // Map agreements to the correct object structure
    const mappedAgrs = agrs.map(a => ({
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
      agreedTc: a.agreed_tc
    }));

    // Update sync_state payload
    console.log('Migrating agreements to sync_state payload...');
    if (data && data[0] && data[0].payload) {
      const payload = data[0].payload;
      payload.agreements = mappedAgrs;
      payload.judgeAgreements = mappedAgrs;
      payload.lastUpdated = Date.now();

      const { error: syncUpdateError } = await supabase
        .from('sync_state')
        .update({ payload: payload, last_updated: new Date().toISOString() })
        .eq('id', 'knsdc_global_sync');

      if (syncUpdateError) {
        console.error('Error updating sync_state payload:', syncUpdateError);
      } else {
        console.log('Successfully migrated agreements to sync_state payload!');
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
