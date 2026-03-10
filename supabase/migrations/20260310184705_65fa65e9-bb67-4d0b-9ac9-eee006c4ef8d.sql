-- Fix credit packs: credits = base amount, base + bonus% = desired total
-- starter: 150 total, 0% bonus → base = 150
-- creator: 300 total, 10% bonus → base = 273 (273 + 27 = 300)
-- pro: 700 total, 15% bonus → base = 609 (609 + 91 = 700)
-- business: 2000 total, 20% bonus → base = 1667 (1667 + 333 = 2000)
-- enterprise: 5000 total, 25% bonus → base = 4000 (4000 + 1000 = 5000)
UPDATE credit_packs SET credits = 150, bonus_percent = 0 WHERE pack_key = 'starter';
UPDATE credit_packs SET credits = 273, bonus_percent = 10 WHERE pack_key = 'creator';
UPDATE credit_packs SET credits = 609, bonus_percent = 15 WHERE pack_key = 'pro';
UPDATE credit_packs SET credits = 1667, bonus_percent = 20 WHERE pack_key = 'business';
UPDATE credit_packs SET credits = 4000, bonus_percent = 25 WHERE pack_key = 'enterprise';