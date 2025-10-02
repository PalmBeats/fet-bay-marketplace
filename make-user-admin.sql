-- This SQL will make alpalmcino@hotmail.com an admin
-- Run this in Supabase Dashboard -> SQL Editor

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'alpalmcino@hotmail.com';

-- Verify the update worked
SELECT id, email, role, created_at 
FROM profiles 
WHERE email = 'alpalmcino@hotmail.com';
