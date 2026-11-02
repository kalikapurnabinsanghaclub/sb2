const supabaseUrl = "https://cquterfxuwafvhnlfjob.supabase.co";
const supabaseAnonKey = "sb_publishable_7sreVLnqfdTxN3d_4-Jd6w_lzXrleIo";

async function query() {
  const res = await fetch(supabaseUrl + "/rest/v1/sync_state?select=payload", {
    headers: { "apikey": supabaseAnonKey, "Authorization": "Bearer " + supabaseAnonKey }
  });
  const data = await res.json();
  if (data[0] && data[0].payload) {
    const payload = data[0].payload;
    // Show event form fields
    console.log("=== EVENT FORM FIELDS ===");
    console.log(JSON.stringify(payload.eventFormFields, null, 2));
    
    // Show participant formAnswers
    console.log("\n=== PARTICIPANTS formAnswers ===");
    (payload.participants || []).forEach(p => {
      console.log(p.id, p.name, ":", JSON.stringify(p.formAnswers, null, 2));
    });
  }
}
query();
