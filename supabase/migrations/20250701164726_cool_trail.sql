/*
  # Fix Order RLS Policies

  1. Policy Updates
    - Update existing policies to handle both business and user orders correctly
    - Add policy for users to insert orders with proper business_id handling
  
  2. Schema Updates
    - Make business_id nullable to allow direct user orders
    - Add default business_id logic if needed

  3. Security
    - Ensure users can only create orders for themselves
    - Maintain business access to their orders
*/

-- Make business_id nullable for direct user orders
ALTER TABLE orders ALTER COLUMN business_id DROP NOT NULL;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Businesses can manage their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;

-- Policy for businesses to manage their orders
CREATE POLICY "Businesses can manage their own orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (business_id = auth.uid());

-- Policy for users to create and view their own orders
CREATE POLICY "Users can manage their own orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy for users to insert orders (covers both business and direct user orders)
CREATE POLICY "Users can insert orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid()) OR 
    (business_id = auth.uid())
  );