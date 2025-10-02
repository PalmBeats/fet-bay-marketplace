-- Add INSERT policy for profiles table
CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify the trigger exists
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- Test: Check if trigger function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
