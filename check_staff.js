const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function checkStaff() {
  const html = fs.readFileSync('c:\\Users\\sourav pc\\Desktop\\kalikapur\\lib\\localSync-v4.js', 'utf8');
  const urlMatch = html.match(/const SUPABASE_URL = '(.*?)';/);
  const keyMatch = html.match(/const SUPABASE_ANON_KEY = '(.*?)';/);
  
  if (!urlMatch || !keyMatch) {
    console.log("Could not find supabase credentials");
    return;
  }
  
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  const { data, error } = await supabase.from('staff_credentials').select('*');
  
  console.log("Staff Credentials:");
  console.log(JSON.stringify(data, null, 2));
}

checkStaff();
