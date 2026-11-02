const supabaseUrl = "https://cquterfxuwafvhnlfjob.supabase.co";
const supabaseAnonKey = "sb_publishable_7sreVLnqfdTxN3d_4-Jd6w_lzXrleIo";

async function inspect() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: { "apikey": supabaseAnonKey, "Authorization": `Bearer ${supabaseAnonKey}` }
    });
    const schema = await res.json();
    console.log("=== KNSDC REGISTRATION SCHEMAS ===");
    const tableDef = schema.definitions && schema.definitions["knsdc-registration"];
    if (tableDef) {
      console.log(JSON.stringify(tableDef.properties, null, 2));
    } else {
      console.log("Table 'knsdc-registration' not found in definitions. Available definitions:");
      console.log(Object.keys(schema.definitions || {}));
    }
  } catch (err) {
    console.error(err);
  }
}

inspect();
