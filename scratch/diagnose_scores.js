const supabaseUrl = "https://mmbtfbxxnprtzpzdklot.supabase.co";
const supabaseAnonKey = "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA";

async function test() {
  // 1. Fetch entire sync_state payload
  const res = await fetch(supabaseUrl + "/rest/v1/sync_state?select=id,payload", {
    headers: { "apikey": supabaseAnonKey, "Authorization": "Bearer " + supabaseAnonKey }
  });
  const rows = await res.json();
  console.log("=== SYNC STATE rows:", rows.length);
  
  if (rows[0] && rows[0].payload) {
    const payload = rows[0].payload;
    const parts = payload.participants || [];
    console.log("Participants in sync_state:", parts.length);
    parts.forEach(p => {
      console.log(" -", p.id, p.name, "| scores:", JSON.stringify(p.scores), "| roundScores:", JSON.stringify(p.roundScores));
    });
    
    // Check if table schemas for public_registrations exist
    const res2 = await fetch(supabaseUrl + "/rest/v1/public_registrations?select=id&limit=1", {
      headers: { "apikey": supabaseAnonKey, "Authorization": "Bearer " + supabaseAnonKey }
    });
    const tableTest = await res2.json();
    console.log("\n=== public_registrations table response:", JSON.stringify(tableTest));

    // Try to INSERT one of the sync_state participants into public_registrations
    if (parts[0]) {
      const p = parts[0];
      console.log("\n=== Trying INSERT for:", p.id, p.name);
      const insertRes = await fetch(supabaseUrl + "/rest/v1/public_registrations", {
        method: "POST",
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": "Bearer " + supabaseAnonKey,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          id: p.id,
          name: p.name,
          phone: p.phone || null,
          event_id: p.eventId || null,
          form_data: p.formAnswers || {},
          scores: p.scores || {},
          round_scores: p.roundScores || {}
        })
      });
      const insertText = await insertRes.text();
      console.log("INSERT status:", insertRes.status);
      console.log("INSERT body:", insertText);
    }
  }
}

test().catch(console.error);
