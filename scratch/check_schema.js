const supabaseUrl = "https://mmbtfbxxnprtzpzdklot.supabase.co";
const supabaseAnonKey = "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA";

async function test() {
  // Get table definition via OpenAPI schema
  const res = await fetch(supabaseUrl + "/rest/v1/", {
    headers: { "apikey": supabaseAnonKey, "Authorization": "Bearer " + supabaseAnonKey }
  });
  const schema = await res.json();
  
  const tables = schema.definitions || {};
  const tableNames = Object.keys(tables);
  console.log("=== All tables:", tableNames);
  
  if (tables.public_registrations) {
    console.log("\n=== public_registrations columns:");
    const cols = tables.public_registrations.properties;
    Object.entries(cols).forEach(([col, def]) => {
      console.log(" -", col, ":", def.type || def.format || JSON.stringify(def));
    });
  }
}

test().catch(console.error);
