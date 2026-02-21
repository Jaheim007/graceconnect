-- Fix existing campaign amount based on completed donations
UPDATE donation_campaigns 
SET current_amount = COALESCE(
  (SELECT SUM(amount) FROM donations WHERE campaign_id = donation_campaigns.id AND status = 'completed'),
  0
);
