
-- Grant 100 bonus credits to user c073d267-b5ed-45e2-a5df-80dc6ab7d830
SELECT grant_bonus_credits(
  'c073d267-b5ed-45e2-a5df-80dc6ab7d830'::uuid,
  100,
  'manual_grant:creator_compensation',
  60
);
