import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET_NAME = 'knsdc-registration';
const FOLDER_PREFIX = 'participants/';
const EXPIRATION_HOURS = 10;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be provided as environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanupFiles() {
  console.log(`Starting cleanup job for bucket '${BUCKET_NAME}' inside folder '${FOLDER_PREFIX}'...`);
  
  try {
    // List all files in the participants/ folder
    // Note: The Supabase storage list api doesn't return full recursive results without `search` but prefix works for flat directories
    const { data: files, error: listError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(FOLDER_PREFIX, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (listError) {
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('No files found in the specified folder.');
      return;
    }

    const now = new Date();
    const expirationMs = EXPIRATION_HOURS * 60 * 60 * 1000;
    
    // Filter files older than EXPIRATION_HOURS
    // Note: Supabase list returns a placeholder `.emptyFolderPlaceholder` file sometimes, we filter it out.
    const expiredFiles = files.filter(file => {
      if (file.name === '.emptyFolderPlaceholder' || !file.created_at) return false;
      const fileDate = new Date(file.created_at);
      const ageMs = now - fileDate;
      return ageMs > expirationMs;
    });

    if (expiredFiles.length === 0) {
      console.log(`Found ${files.length} files, but none are older than ${EXPIRATION_HOURS} hours. Nothing to delete.`);
      return;
    }

    console.log(`Found ${expiredFiles.length} expired file(s). Deleting...`);
    
    // The remove API requires the full path including the prefix
    const pathsToDelete = expiredFiles.map(file => `${FOLDER_PREFIX}${file.name}`);
    
    // Batch delete
    const { data: deleteData, error: deleteError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .remove(pathsToDelete);

    if (deleteError) {
      throw deleteError;
    }

    console.log('Successfully deleted the following files:');
    deleteData.forEach(d => console.log(`- ${d.name}`));
    console.log('Cleanup job completed successfully.');
    
  } catch (error) {
    console.error('Error during cleanup:', error.message || error);
    process.exit(1);
  }
}

cleanupFiles();
