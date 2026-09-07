const supabaseUrl = "https://fjscpohgysbelzkrkrxm.supabase.co";
const supabaseKey = "sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5";

async function run() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.from('sync_state').select('*');
  console.dir(data[0].payload.eventSwitches, { depth: null });
  console.dir(data[0].payload.systemStatus, { depth: null });
}

run();
