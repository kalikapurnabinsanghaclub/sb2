const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mmbtfbxxnprtzpzdklot.supabase.co',
  'sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA'
);

async function run() {
  const { data, error } = await supabase.from('staff_credentials').select('*');
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
