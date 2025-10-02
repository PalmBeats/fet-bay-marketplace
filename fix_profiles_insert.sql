-- Fix INSERT policy for profiles table
-- Check current policies
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Add INSERT policy if missing
INSERT INTO profiles (id, email, role)
VALUES ('user-example', 'example@test.com', 'user')
ON CONFLICT DO NOTHING;
