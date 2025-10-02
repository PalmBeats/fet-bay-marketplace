-- Delete the existing profile to allow fresh signup
DELETE FROM profiles WHERE email = 'alpalmcino@hotmail.com';

-- Also delete from auth.users to start completely fresh  
DELETE FROM auth.users WHERE email = 'alpalmcino@hotmail.com';
