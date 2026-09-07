const supabaseUrl = "https://fjscpohgysbelzkrkrxm.supabase.co";
const supabaseAnonKey = "sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5";

async function check() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/public_registrations?select=*&limit=1`, {
      headers: { "apikey": supabaseAnonKey, "Authorization": `Bearer ${supabaseAnonKey}` }
    });
    const data = await res.json();
    console.log("=== REGISTRATION ROW SAMPLE ===");
    console.log(data[0]);
  } catch (err) {
    console.error(err);
  }
}

check();
