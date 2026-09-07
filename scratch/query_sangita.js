const supabaseUrl = "https://fjscpohgysbelzkrkrxm.supabase.co";
const supabaseAnonKey = "sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5";

async function query() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/public_registrations?select=*`, {
      headers: { "apikey": supabaseAnonKey, "Authorization": `Bearer ${supabaseAnonKey}` }
    });
    const data = await res.json();
    console.log("=== ALL PARTICIPANTS ===");
    console.log(JSON.stringify(data.map(p => ({ id: p.id, name: p.name, form_data: p.form_data })), null, 2));
  } catch (err) {
    console.error(err);
  }
}

query();
