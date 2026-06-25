const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL\s*=\s*(.+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.+)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : 'https://mmbtfbxxnprtzpzdklot.supabase.co';
const supabaseKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  // Let's perform a postgrest request to get table schema or see what fields are available
  // We can try to insert a record with capacity and see if it works, or query using supabase.rpc
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'venues' });
  if (error) {
    console.error('RPC Error:', error);
    // fallback: list keys of select *
    const { data: selectData } = await supabase.from('venues').select('*').limit(1);
    if (selectData && selectData.length > 0) {
      console.log('Columns in venues table:', Object.keys(selectData[0]));
    }
  } else {
    console.log('Columns via RPC:', data);
  }
}

checkColumns();
