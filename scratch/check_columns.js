const supabaseUrl = "https://mmbtfbxxnprtzpzdklot.supabase.co";
const supabaseAnonKey = "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA";

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
