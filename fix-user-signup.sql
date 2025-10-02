-- Fix user signup policy - Run this in Supabase Dashboard SQL Editor
-- This will fix the "Database error saving new user" issue

-- First, drop any existing policy that might conflict
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

-- Add the correct INSERT policy for profiles
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Also allow insert for the service role (needed for triggers)
CREATE POLICY "Service role can insert profiles" ON profiles
    FOR INSERT WITH CHECK (true);

-- Ensure the trigger function exists and is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions for service role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT INSERT ON profiles TO service_role;
GRANT SELECT ON profiles TO service_role;

COMMIT;
