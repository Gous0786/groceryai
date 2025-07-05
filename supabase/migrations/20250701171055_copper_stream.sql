/*
  # Update product pricing to Indian Rupees

  1. Changes
    - Update all product prices to Indian Rupee equivalents
    - Maintain reasonable pricing for Indian market
*/

-- Update product prices to Indian Rupees (approximate conversion and market adjustment)
UPDATE products SET price = 
  CASE 
    WHEN name = 'Bananas' THEN 60.00
    WHEN name = 'Apples' THEN 120.00
    WHEN name = 'Oranges' THEN 80.00
    WHEN name = 'Tomatoes' THEN 40.00
    WHEN name = 'Potatoes' THEN 30.00
    WHEN name = 'Onions' THEN 35.00
    WHEN name = 'Milk' THEN 60.00
    WHEN name = 'Cheese' THEN 250.00
    WHEN name = 'Yogurt' THEN 45.00
    WHEN name = 'Rice' THEN 80.00
    WHEN name = 'Flour' THEN 50.00
    WHEN name = 'Sugar' THEN 45.00
    ELSE price
  END
WHERE name IN ('Bananas', 'Apples', 'Oranges', 'Tomatoes', 'Potatoes', 'Onions', 'Milk', 'Cheese', 'Yogurt', 'Rice', 'Flour', 'Sugar');