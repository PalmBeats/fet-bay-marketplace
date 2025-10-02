-- Find the auth.users ID for alpalmcino@hotmail.com
SELECT id, email FROM auth.users WHERE email = 'alpalmcino@hotmail.com';

-- Also check what's in profiles table
SELECT id, email FROM profiles WHERE email = 'alpalmcino@hotmail.com';
