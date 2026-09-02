import { MongoClient } from 'mongodb';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mmbtfbxxnprtzpzdklot.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA';
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://kalikapurnabinsanghaclub_db_user:Sb%40210617@knsdc.ewmcdmb.mongodb.net/knsdc?appName=Knsdc";

async function pingSupabase() {
  console.log('[1/2] Pinging Supabase Cloud Database...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sync_state?select=id,last_updated&limit=2`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    console.log(`✅ Supabase ping SUCCESSFUL! Synced rows: ${data.map(r => r.id).join(', ')}`);
    console.log('   -> Supabase 7-day auto-pause countdown has been RESET to 0.');
    return true;
  } catch (err) {
    console.warn('⚠️ Supabase ping warning:', err.message);
    return false;
  }
}

async function pingMongoDB() {
  console.log('[2/2] Pinging MongoDB Atlas Cluster (knsdc.ewmcdmb.mongodb.net)...');
  const client = new MongoClient(MONGO_URI, {
    tls: true,
    connectTimeoutMS: 15000,
    serverSelectionTimeoutMS: 15000
  });

  try {
    await client.connect();
    const pingResult = await client.db('admin').command({ ping: 1 });
    console.log('✅ MongoDB Atlas ping SUCCESSFUL! Response:', JSON.stringify(pingResult));

    // Update heartbeat in club_settings to trigger database write activity
    const db = client.db('knsdc');
    await db.collection('club_settings').updateOne(
      { key: 'cloud_keepalive_heartbeat' },
      { $set: { key: 'cloud_keepalive_heartbeat', lastPing: new Date(), source: 'GitHub Actions 24/7 Bot' } },
      { upsert: true }
    );
    console.log('   -> MongoDB Atlas 30-day inactivity countdown has been RESET to 0.');
    return true;
  } catch (err) {
    console.warn('⚠️ MongoDB Atlas ping warning:', err.message);
    return false;
  } finally {
    try { await client.close(); } catch (e) {}
  }
}

async function runKeepAlive() {
  console.log('========================================================');
  console.log(`⏰ KNSDC Cloud Keep-Alive Job Started: ${new Date().toISOString()}`);
  console.log('========================================================');

  const supaOk = await pingSupabase();
  const mongoOk = await pingMongoDB();

  console.log('--------------------------------------------------------');
  console.log(`Job Status: Supabase = ${supaOk ? 'ONLINE' : 'FAILED'} | MongoDB Atlas = ${mongoOk ? 'ONLINE' : 'FAILED'}`);
  console.log('========================================================');

  // If at least one succeeded, keep the run passing
  if (supaOk || mongoOk) {
    console.log('🎉 Keep-alive cycle completed successfully.');
    process.exit(0);
  } else {
    console.error('❌ Both pings failed. Please verify credentials/network access.');
    process.exit(1);
  }
}

runKeepAlive();
