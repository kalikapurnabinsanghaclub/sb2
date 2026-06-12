const supabaseUrl = "https://mmbtfbxxnprtzpzdklot.supabase.co";
const supabaseKey = "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA";

async function run() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.from('sync_state').select('*');
  console.dir(data[0].payload.eventSwitches, { depth: null });
  console.dir(data[0].payload.systemStatus, { depth: null });
}

run();
