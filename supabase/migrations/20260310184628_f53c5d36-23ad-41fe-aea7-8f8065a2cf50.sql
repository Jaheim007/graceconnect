-- Update credit packs with corrected pricing
UPDATE credit_packs SET credits = 150, bonus_percent = 0 WHERE pack_key = 'starter';
UPDATE credit_packs SET credits = 300, bonus_percent = 10 WHERE pack_key = 'creator';
UPDATE credit_packs SET credits = 700, bonus_percent = 15 WHERE pack_key = 'pro';
UPDATE credit_packs SET credits = 2000, bonus_percent = 20 WHERE pack_key = 'business';
UPDATE credit_packs SET credits = 5000, bonus_percent = 25 WHERE pack_key = 'enterprise';