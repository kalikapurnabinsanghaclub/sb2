const { createClient } = require('@supabase/supabase-js');

const oldUrl = 'https://fjscpohgysbelzkrkrxm.supabase.co';
const oldKey = 'sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5';
const newUrl = 'https://fjscpohgysbelzkrkrxm.supabase.co';
const newKey = 'sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5';

const oldSupabase = createClient(oldUrl, oldKey);
const newSupabase = createClient(newUrl, newKey);

async function migrateTable(tableName, idCol = 'id') {
  try {
    const { data, error } = await oldSupabase.from(tableName).select('*');
    if (error) {
      console.log(`[${tableName}] Old fetch notice:`, error.message);
      return;
    }
    if (!data || data.length === 0) {
      console.log(`[${tableName}] No rows to migrate.`);
      return;
    }
    console.log(`[${tableName}] Migrating ${data.length} rows...`);

    for (const row of data) {
      const { error: upsertErr } = await newSupabase.from(tableName).upsert(row, { onConflict: idCol });
      if (upsertErr) {
        console.error(`[${tableName}] Error upserting row ${row[idCol]}:`, upsertErr.message);
      }
    }
    console.log(`[${tableName}] Done migrating!`);
  } catch (err) {
    console.error(`[${tableName}] Error:`, err.message);
  }
}

async function runMigration() {
  console.log('--- Starting Data Migration to New Supabase ---');
  await migrateTable('sync_state', 'id');
  await migrateTable('staff_credentials', 'email');
  await migrateTable('judge_credentials', 'email');
  await migrateTable('events', 'id');
  await migrateTable('categories', 'id');
  await migrateTable('venues', 'id');
  await migrateTable('scoring_subjects', 'id');
  await migrateTable('donations', 'id');
  await migrateTable('members', 'id');
  await migrateTable('membership_plans', 'id');
  await migrateTable('payment_records', 'id');
  await migrateTable('club_earnings', 'id');
  console.log('--- Migration Finished! ---');
}

runMigration();
