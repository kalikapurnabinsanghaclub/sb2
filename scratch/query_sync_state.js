const supabaseUrl = "https://cquterfxuwafvhnlfjob.supabase.co";
const supabaseAnonKey = "sb_publishable_7sreVLnqfdTxN3d_4-Jd6w_lzXrleIo";

async function query() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/sync_state?select=payload`, {
      headers: { "apikey": supabaseAnonKey, "Authorization": `Bearer ${supabaseAnonKey}` }
    });
    const data = await res.json();
    console.log("=== SYNC STATE PAYLOAD ===");
    if (data && data[0] && data[0].payload) {
      const payload = data[0].payload;
      console.log("Participants count:", payload.participants ? payload.participants.length : 0);
      console.log("Participants list:", JSON.stringify(payload.participants?.map(p => ({ id: p.id, name: p.name, formLocked: p.formLocked, formAnswers: p.formAnswers })), null, 2));
    } else {
      console.log("No sync_state found:", data);
    }
  } catch (err) {
    console.error(err);
  }
}

query();
