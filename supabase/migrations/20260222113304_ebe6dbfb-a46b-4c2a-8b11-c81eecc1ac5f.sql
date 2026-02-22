-- Delete 3 test product purchases
DELETE FROM product_purchases WHERE id IN (
  '560f4356-b038-4b1b-a7a6-df55db6bf6ae',
  'c34a9c88-d305-4e31-b600-a57c0c7a346d',
  'c9057288-9292-4ec7-ba84-f7255df7f5f6'
);

-- Delete 1 test donation
DELETE FROM donations WHERE id = '6c75a8c6-2471-490f-bd47-25f350601c8a';

-- Fix sales_count: was 4, remove 3 test = 1
UPDATE digital_products SET sales_count = 1 WHERE id = '56ec9157-0fe4-4816-a19b-8bc8a27b88e9';
