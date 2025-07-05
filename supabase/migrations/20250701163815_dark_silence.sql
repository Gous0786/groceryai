/*
  # Add grocery delivery tables to existing schema

  1. New Tables
    - `categories` - Product categories (fruits, vegetables, etc.)
    - `products` - Individual grocery products with pricing and stock
    - `cart_items` - User shopping cart items
    - `order_items` - Items within each order

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Public read access for categories and products

  3. Sample Data
    - Insert sample categories and products for demo
*/

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Products table  
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL DEFAULT 0.00,
  image_url text,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  stock_quantity integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'piece',
  created_at timestamptz DEFAULT now()
);

-- Cart items table (using auth.users since this is for end customers, not businesses)
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Order items table (linking to existing orders table)
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id integer REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  price decimal(10,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz DEFAULT now()
);

-- Add missing columns to existing orders table if they don't exist
DO $$
BEGIN
  -- Add total_amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN total_amount decimal(10,2) DEFAULT 0.00;
  END IF;

  -- Add user_id column if it doesn't exist (for end customer orders)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable Row Level Security on new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for categories (public read)
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

-- Policies for products (public read)
CREATE POLICY "Anyone can read products"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Policies for cart_items (users can manage their own cart)
CREATE POLICY "Users can read own cart items"
  ON cart_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for order_items (users can read their own order items)
CREATE POLICY "Users can read own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.business_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.business_id = auth.uid())
    )
  );

-- Insert sample categories
INSERT INTO categories (name, description, image_url) VALUES
  ('Fruits', 'Fresh and organic fruits', 'https://images.pexels.com/photos/1128678/pexels-photo-1128678.jpeg'),
  ('Vegetables', 'Farm fresh vegetables', 'https://images.pexels.com/photos/1556909/pexels-photo-1556909.jpeg'),
  ('Dairy', 'Milk, cheese, and dairy products', 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg'),
  ('Grains', 'Rice, flour, and cereals', 'https://images.pexels.com/photos/1446320/pexels-photo-1446320.jpeg'),
  ('Snacks', 'Chips, cookies, and treats', 'https://images.pexels.com/photos/1188537/pexels-photo-1188537.jpeg'),
  ('Beverages', 'Juices, sodas, and drinks', 'https://images.pexels.com/photos/1571861/pexels-photo-1571861.jpeg')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, image_url, category_id, stock_quantity, unit) VALUES
  -- Fruits
  ('Bananas', 'Fresh yellow bananas', 2.99, 'https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg', (SELECT id FROM categories WHERE name = 'Fruits'), 50, 'kg'),
  ('Apples', 'Crisp red apples', 4.99, 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg', (SELECT id FROM categories WHERE name = 'Fruits'), 30, 'kg'),
  ('Oranges', 'Juicy oranges', 3.99, 'https://images.pexels.com/photos/161559/background-bitter-breakfast-bright-161559.jpeg', (SELECT id FROM categories WHERE name = 'Fruits'), 25, 'kg'),
  
  -- Vegetables
  ('Tomatoes', 'Fresh red tomatoes', 3.49, 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg', (SELECT id FROM categories WHERE name = 'Vegetables'), 40, 'kg'),
  ('Potatoes', 'Organic potatoes', 2.99, 'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg', (SELECT id FROM categories WHERE name = 'Vegetables'), 60, 'kg'),
  ('Onions', 'Fresh onions', 2.49, 'https://images.pexels.com/photos/533342/pexels-photo-533342.jpeg', (SELECT id FROM categories WHERE name = 'Vegetables'), 35, 'kg'),
  
  -- Dairy
  ('Milk', 'Fresh whole milk', 4.99, 'https://images.pexels.com/photos/236010/pexels-photo-236010.jpeg', (SELECT id FROM categories WHERE name = 'Dairy'), 20, 'liter'),
  ('Cheese', 'Cheddar cheese', 6.99, 'https://images.pexels.com/photos/773253/pexels-photo-773253.jpeg', (SELECT id FROM categories WHERE name = 'Dairy'), 15, 'piece'),
  ('Yogurt', 'Greek yogurt', 3.99, 'https://images.pexels.com/photos/1435715/pexels-photo-1435715.jpeg', (SELECT id FROM categories WHERE name = 'Dairy'), 25, 'piece'),
  
  -- Grains
  ('Rice', 'Basmati rice', 8.99, 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg', (SELECT id FROM categories WHERE name = 'Grains'), 30, 'kg'),
  ('Flour', 'All-purpose flour', 5.99, 'https://images.pexels.com/photos/1115990/pexels-photo-1115990.jpeg', (SELECT id FROM categories WHERE name = 'Grains'), 40, 'kg'),
  ('Sugar', 'White sugar', 3.99, 'https://images.pexels.com/photos/1346347/pexels-photo-1346347.jpeg', (SELECT id FROM categories WHERE name = 'Grains'), 50, 'kg')
ON CONFLICT DO NOTHING;