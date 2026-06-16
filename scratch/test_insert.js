const supabaseUrl = "https://mmbtfbxxnprtzpzdklot.supabase.co";
const supabaseAnonKey = "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA";

async function testInsert() {
  try {
    const dbObj = {
      id: "AB8888",
      event_id: "1781271255289",
      name: "Test Mapper Candidate",
      phone: "9876543210",
      age: 22,
      gender: "Male",
      category: "1", // Storing catId as category string
      venue: "1",    // Storing venueId as venue string
      reg_date: new Date().toISOString(),
      form_answers: { "Name": "Test Mapper Candidate", "Phone": "9876543210" },
      present: true,
      round: "audition",
      stage_status: "waiting",
      is_verified: true
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/public_registrations`, {
      method: "POST",
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(dbObj)
    });
    const result = await res.json();
    console.log("=== INSERT RESULT ===");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
}

testInsert();
