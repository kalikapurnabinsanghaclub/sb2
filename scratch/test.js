const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cquterfxuwafvhnlfjob.supabase.co',
  'sb_publishable_7sreVLnqfdTxN3d_4-Jd6w_lzXrleIo'
);

async function run() {
  const { data, error } = await supabase.from('staff_credentials').select('*');
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
