-- Add SELECT and INSERT policies for connect_accounts table
CREATE POLICY "Enable read access for authenticated users" ON connect_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON connect_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users" ON connect_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Verify policies were created
SELECT * FROM pg_policies WHERE tablename = 'connect_accounts';
