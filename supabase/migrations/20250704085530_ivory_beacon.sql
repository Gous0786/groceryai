/*
  # Add Chole Bhature Products

  1. New Products for Chole Bhature
    - Chickpeas (Chole)
    - All-purpose flour (for Bhature)
    - Yogurt (for Bhature dough)
    - Baking powder
    - Onions (for Chole)
    - Tomatoes (for Chole)
    - Ginger-Garlic paste
    - Green chilies
    - Cumin seeds
    - Coriander powder
    - Turmeric powder
    - Red chili powder
    - Garam masala
    - Amchur (dry mango powder)
    - Fresh coriander leaves
    - Cooking oil
    - Salt

  2. Add Spices category if not exists
*/

-- Add Spices category if it doesn't exist
INSERT INTO categories (name, description, image_url) VALUES
  ('Spices & Condiments', 'Essential spices and condiments for Indian cooking', 'https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg')
ON CONFLICT DO NOTHING;

-- Add Chole Bhature specific products
INSERT INTO products (name, description, price, image_url, category_id, stock_quantity, unit) VALUES
  -- Legumes & Grains for Chole Bhature
  ('Chickpeas (Kabuli Chana)', 'Premium quality chickpeas for making chole', 85.00, 'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg', (SELECT id FROM categories WHERE name = 'Grains'), 40, 'kg'),
  ('Baking Powder', 'Double acting baking powder for fluffy bhature', 45.00, 'https://images.pexels.com/photos/6544378/pexels-photo-6544378.jpeg', (SELECT id FROM categories WHERE name = 'Grains'), 25, 'piece'),
  
  -- Fresh Vegetables for Chole
  ('Ginger', 'Fresh ginger root', 120.00, 'https://images.pexels.com/photos/161556/ginger-plant-asia-rhizome-161556.jpeg', (SELECT id FROM categories WHERE name = 'Vegetables'), 30, 'kg'),
  ('Garlic', 'Fresh garlic bulbs', 180.00, 'https://images.pexels.com/photos/1435740/pexels-photo-1435740.jpeg', (SELECT id FROM categories WHERE name = 'Vegetables'), 25, 'kg'),
  ('Green Chilies', 'Fresh green chilies', 80.00, 'https://images.pexels.com/photos/7129160/pexels-photo-7129160.jpeg', (SELECT id FROM categories WHERE name = 'Vegetables'), 20, 'kg'),
  ('Fresh Coriander', 'Fresh coriander leaves (dhania)', 40.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Vegetables'), 15, 'bunch'),
  
  -- Essential Spices for Chole
  ('Cumin Seeds (Jeera)', 'Whole cumin seeds', 320.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 20, 'kg'),
  ('Coriander Powder (Dhania)', 'Ground coriander powder', 180.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 25, 'kg'),
  ('Turmeric Powder (Haldi)', 'Pure turmeric powder', 220.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 30, 'kg'),
  ('Red Chili Powder (Lal Mirch)', 'Spicy red chili powder', 280.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 25, 'kg'),
  ('Garam Masala', 'Aromatic garam masala blend', 450.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 20, 'kg'),
  ('Amchur (Dry Mango Powder)', 'Tangy dry mango powder', 380.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 15, 'kg'),
  ('Bay Leaves (Tej Patta)', 'Aromatic bay leaves', 150.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 10, 'piece'),
  ('Black Cardamom (Badi Elaichi)', 'Large black cardamom pods', 800.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 8, 'kg'),
  ('Cinnamon Sticks (Dalchini)', 'Whole cinnamon sticks', 650.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 12, 'kg'),
  
  -- Cooking Essentials
  ('Cooking Oil (Sunflower)', 'Refined sunflower cooking oil', 140.00, 'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpeg', (SELECT id FROM categories WHERE name = 'Grains'), 30, 'liter'),
  ('Salt (Table Salt)', 'Iodized table salt', 25.00, 'https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 50, 'kg'),
  ('Ginger-Garlic Paste', 'Ready-made ginger-garlic paste', 85.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 20, 'piece'),
  
  -- Additional Indian Staples
  ('Basmati Rice (Premium)', 'Long grain basmati rice', 150.00, 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg', (SELECT id FROM categories WHERE name = 'Grains'), 35, 'kg'),
  ('Whole Wheat Flour (Atta)', 'Fresh ground whole wheat flour', 55.00, 'https://images.pexels.com/photos/1115990/pexels-photo-1115990.jpeg', (SELECT id FROM categories WHERE name = 'Grains'), 45, 'kg'),
  ('Ghee (Clarified Butter)', 'Pure cow ghee', 650.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Dairy'), 15, 'kg'),
  ('Paneer', 'Fresh cottage cheese', 320.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Dairy'), 12, 'kg'),
  
  -- Pickles and Accompaniments
  ('Mixed Pickle (Achar)', 'Spicy mixed vegetable pickle', 180.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 20, 'piece'),
  ('Mint Chutney', 'Fresh mint chutney', 65.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 15, 'piece'),
  ('Tamarind Paste', 'Concentrated tamarind paste', 95.00, 'https://images.pexels.com/photos/4198017/pexels-photo-4198017.jpeg', (SELECT id FROM categories WHERE name = 'Spices & Condiments'), 18, 'piece')
ON CONFLICT DO NOTHING;