const supabaseUrl = "https://cquterfxuwafvhnlfjob.supabase.co";
const supabaseKey = "sb_publishable_7sreVLnqfdTxN3d_4-Jd6w_lzXrleIo";

async function run() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.from('sync_state').select('*');
  console.dir(data[0].payload.eventSwitches, { depth: null });
  console.dir(data[0].payload.systemStatus, { depth: null });
}

run();
