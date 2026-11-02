const supabaseUrl = "https://cquterfxuwafvhnlfjob.supabase.co";
const supabaseAnonKey = "sb_publishable_7sreVLnqfdTxN3d_4-Jd6w_lzXrleIo";

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
