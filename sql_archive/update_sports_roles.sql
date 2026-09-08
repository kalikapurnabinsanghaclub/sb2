-- Drop the existing role check constraint from staff_credentials table
ALTER TABLE "public"."staff_credentials" DROP CONSTRAINT IF EXISTS staff_credentials_role_check;

-- Re-create the constraint to allow 'umpire' and 'referee' roles alongside existing ones
ALTER TABLE "public"."staff_credentials" ADD CONSTRAINT staff_credentials_role_check 
CHECK (role IN ('admin', 'monitor', 'host', 'judge', 'sportsmanager', 'umpire', 'referee'));
