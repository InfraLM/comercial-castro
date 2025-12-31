-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view user mappings" ON user_mappings;
DROP POLICY IF EXISTS "Anyone can create user mappings" ON user_mappings;
DROP POLICY IF EXISTS "Anyone can update user mappings" ON user_mappings;
DROP POLICY IF EXISTS "Anyone can delete user mappings" ON user_mappings;

-- Create proper RLS policies for authenticated users only
-- Authenticated users can view all mappings (needed for app functionality)
CREATE POLICY "Authenticated users can view mappings"
  ON user_mappings FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert mappings
CREATE POLICY "Authenticated users can create mappings"
  ON user_mappings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update mappings
CREATE POLICY "Authenticated users can update mappings"
  ON user_mappings FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated users can delete mappings
CREATE POLICY "Authenticated users can delete mappings"
  ON user_mappings FOR DELETE
  TO authenticated
  USING (true);