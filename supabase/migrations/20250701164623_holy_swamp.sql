/*
  # Add RLS policy for users to create orders

  1. Security Changes
    - Add policy to allow authenticated users to insert their own orders
    - Users can only create orders where user_id matches their auth.uid()

  This fixes the RLS violation error when users try to place orders.
*/

-- Allow authenticated users to insert their own orders
CREATE POLICY "Users can create their own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);