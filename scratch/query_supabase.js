const supabaseUrl = "https://fjscpohgysbelzkrkrxm.supabase.co";
const supabaseAnonKey = "sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5";

async function query() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/judge_agreements`, {
      headers: { "apikey": supabaseAnonKey, "Authorization": `Bearer ${supabaseAnonKey}` }
    });
    const data = await res.json();
    console.log("=== JUDGE AGREEMENTS ===");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

query();
