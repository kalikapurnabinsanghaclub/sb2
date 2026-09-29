const { createClient } = require('@supabase/supabase-js');

const sourceUrl = 'https://fjscpohgysbelzkrkrxm.supabase.co';
const sourceKey = 'sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5';

const targetUrl = 'https://sbbmxgohhcywldzmuikh.supabase.co';
const targetKey = 'sb_publishable__OcvPiBZKmKXGQAHsxPOGQ_92zCOLCZ';

const sourceDb = createClient(sourceUrl, sourceKey);
const targetDb = createClient(targetUrl, targetKey);

async function migrateTable(tableName, idCol = 'id') {
  try {
    const { data, error } = await sourceDb.from(tableName).select('*');
    if (error) {
      console.log(`[${tableName}] Source fetch notice:`, error.message);
      return;
    }
    if (!data || data.length === 0) {
      console.log(`[${tableName}] No rows to migrate.`);
      return;
    }
    console.log(`[${tableName}] Migrating ${data.length} rows...`);

    let success = 0;
    for (const row of data) {
      const { error: upsertErr } = await targetDb.from(tableName).upsert(row, { onConflict: idCol });
      if (upsertErr) {
        console.error(`[${tableName}] Error upserting ${row[idCol] || 'row'}:`, upsertErr.message);
      } else {
        success++;
      }
    }
    console.log(`[${tableName}] Successfully migrated ${success}/${data.length} rows.`);
  } catch (err) {
    console.error(`[${tableName}] Error:`, err.message);
  }
}

async function runFullMigration() {
  console.log('--- Migrating ALL data from fjscpohgysbelzkrkrxm to sbbmxgohhcywldzmuikh ---');
  await migrateTable('sync_state', 'id');
  await migrateTable('staff_credentials', 'email');
  await migrateTable('judge_credentials', 'email');
  await migrateTable('judge_agreements', 'id');
  await migrateTable('public_registrations', 'id');
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

runFullMigration();
