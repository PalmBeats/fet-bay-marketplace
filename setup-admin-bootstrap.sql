-- Setup Admin Bootstrap for Fet-Bay
-- Run this in Supabase Dashboard SQL Editor

-- Set environment variable for admin bootstrap secret
-- You can choose any secure secret - this example uses 'fet-bay-admin-2024'
-- In production, this should be a long, random string

-- First, let's check if there are any current admins
SELECT id, email, role FROM profiles WHERE role = 'admin';

-- Create admin bootstrap environment (if it doesn't exist)
-- Note: You'll need to set this manually in Supabase Dashboard > Settings > Edge Functions Environment Variables
-- Set variable: ADMIN_BOOTSTRAP_SECRET
-- Value: fet-bay-admin-2024

-- Alternative method: Manually promote any user to admin via SQL
-- Replace 'YOUR_USER_ID_HERE' with actual user ID from auth.users table

-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE id = 'YOUR_USER_ID_HERE';

COMMIT;
