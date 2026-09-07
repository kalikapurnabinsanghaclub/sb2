const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fjscpohgysbelzkrkrxm.supabase.co',
  'sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5'
);

async function run() {
  const { data, error } = await supabase.from('staff_credentials').select('*');
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
