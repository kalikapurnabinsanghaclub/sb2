const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  'https://fjscpohgysbelzkrkrxm.supabase.co',
  'sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5'
);

async function sha256(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

async function run() {
  const email = "testumpire@knsdc.in";
  const password = "password";
  const name = "Test Umpire";
  const role = "umpire";

  const passwordHash = await sha256(password);
  
  const { data, error } = await supabase
    .from('staff_credentials')
    .upsert({ email: email.trim().toLowerCase(), password_hash: passwordHash, name, role }, { onConflict: 'email' });
    
  console.log("Upsert Error:", error);
  console.log("Upsert Data:", data);
}

run();
