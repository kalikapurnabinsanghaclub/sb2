ALTER TABLE staff_credentials DROP CONSTRAINT IF EXISTS staff_credentials_role_check;

ALTER TABLE staff_credentials ADD CONSTRAINT staff_credentials_role_check 
CHECK (role IN ('admin', 'monitor', 'host', 'judge', 'umpire'));
