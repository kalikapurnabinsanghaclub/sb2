const supabaseUrl = "https://mmbtfbxxnprtzpzdklot.supabase.co";
const supabaseAnonKey = "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA";

async function test() {
  // 1. Check public_registrations for scores
  const res = await fetch(supabaseUrl + "/rest/v1/public_registrations?select=*", {
    headers: { "apikey": supabaseAnonKey, "Authorization": "Bearer " + supabaseAnonKey }
  });
  const rows = await res.json();
  console.log("=== public_registrations (scores) ===");
  console.log(JSON.stringify(rows, null, 2));

  // 2. Also try a test UPDATE to see if RLS allows it
  const testId = rows[0] && rows[0].id;
  if (testId) {
    console.log("\n=== Testing UPDATE on id:", testId, "===");
    const upd = await fetch(supabaseUrl + "/rest/v1/public_registrations?id=eq." + testId, {
      method: "PATCH",
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": "Bearer " + supabaseAnonKey,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ scores: { test_judge: { test_subject: 99 } } })
    });
    const updText = await upd.text();
    console.log("Update response status:", upd.status);
    console.log("Update response body:", updText);
  }
}

test().catch(console.error);
