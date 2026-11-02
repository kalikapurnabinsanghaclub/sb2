const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  'https://cquterfxuwafvhnlfjob.supabase.co',
  'sb_publishable_7sreVLnqfdTxN3d_4-Jd6w_lzXrleIo'
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
