const supabaseUrl = "https://fjscpohgysbelzkrkrxm.supabase.co";
const supabaseAnonKey = "sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5";

async function query() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/sync_state?id=eq.knsdc_global_sync`, {
      headers: { "apikey": supabaseAnonKey, "Authorization": `Bearer ${supabaseAnonKey}` }
    });
    const data = await res.json();
    console.log("=== SYNC STATE PAYLOAD ===");
    console.log(data[0].payload.judges);
  } catch (err) {
    console.error(err);
  }
}

query();
