const supabaseUrl = "https://cquterfxuwafvhnlfjob.supabase.co";
const supabaseAnonKey = "sb_publishable_7sreVLnqfdTxN3d_4-Jd6w_lzXrleIo";

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
