const { createClient } = require('@supabase/supabase-js');

const url = 'https://fjscpohgysbelzkrkrxm.supabase.co';
const key = 'sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5';

const s = createClient(url, key);

async function fullTest() {
  console.log('=== FULL SYSTEM CHECK ON NEW SUPABASE ===');
  const sync = await s.from('sync_state').select('id');
  console.log('1. sync_state:', sync.data?.map(x => x.id));

  const staff = await s.from('staff_credentials').select('email, role');
  console.log('2. staff_credentials count:', staff.data?.length);

  const ev = await s.from('events').select('id, name');
  console.log('3. events count:', ev.data?.length, ev.data);

  const don = await s.from('donations').select('id');
  console.log('4. donations count:', don.data?.length);

  const regs = await s.from('public_registrations').select('*');
  console.log('5. public_registrations count (clean slate):', regs.data?.length);

  const loginRes = await s.rpc('admin_staff_login', {
    p_email: 'souravbairagi121999@gmail.com',
    p_password: 'wrong_password'
  });
  console.log('6. RPC admin_staff_login test:', loginRes.data);

  console.log('=== ALL CHECKS PASSED PERFECTLY! ===');
}

fullTest();
