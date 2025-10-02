-- EMERGENCY ADMIN SETUP
-- Copy and paste this ENTIRE block into Supabase Dashboard -> SQL Editor

-- Step 1: Make alpalmcino@hotmail.com an admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'alpalmcino@hotmail.com';

-- Step 2: Verify the change worked
SELECT 
  id, 
  email, 
  role, 
  created_at
FROM profiles 
WHERE email = 'alpalmcino@hotmail.com';

-- Step 3: Show all admins (should include your email)
SELECT 
  id, 
  email, 
  role, 
  created_at
FROM profiles 
WHERE role = 'admin';

-- If the above doesn't work, try this force update:
UPDATE profiles 
SET role = 'admin', updated_at = now()
WHERE email = 'alpalmcino@hotmail.com' 
RETURNING *;

COMMIT;
