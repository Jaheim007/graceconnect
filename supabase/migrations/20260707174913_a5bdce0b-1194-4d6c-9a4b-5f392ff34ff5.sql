-- Safety backfill: guarantee existing users keep access to everything
-- they previously had in the old dashboard, in addition to detected usage
-- and their SiteViral type defaults. Purely additive — never removes a key.

-- Legacy baseline = the set of features that were reachable from the old
-- dashboard for every org regardless of vertical. Filtering the sidebar
-- against enabled_features must not hide any of these for existing orgs.
WITH legacy_baseline AS (
  SELECT ARRAY[
    'digital_products',
    'order_generator',
    'donation_gifts',
    'payment',
    'ai_book_creation',
    'ai_formation_creation',
    'product_comments',
    'affiliation'
  ]::text[] AS keys
),
-- Per-type defaults mirror src/lib/siteviral/config.ts. Kept inline so this
-- migration is self-contained and idempotent.
type_defaults AS (
  SELECT * FROM (VALUES
    ('church',                  ARRAY['appointment','digital_products','order_generator','donation_gifts','payment','ai_book_creation','ai_formation_creation','product_comments','location','kyc','affiliation']::text[]),
    ('digital_products',        ARRAY['digital_products','order_generator','donation_gifts','payment','ai_book_creation','ai_formation_creation','events','product_comments','kyc','affiliation']::text[]),
    ('sport',                   ARRAY['appointment','order_generator','payment','location','events','reviews','kyc','affiliation']::text[]),
    ('artisans_home_services',  ARRAY['appointment','order_generator','payment','reviews','location','kyc','affiliation']::text[]),
    ('beauty',                  ARRAY['appointment','order_generator','payment','ai_book_creation','ai_formation_creation','reviews','location','kyc','affiliation']::text[]),
    ('tutors_home_teachers',    ARRAY['digital_products','order_generator','reviews','location','kyc','affiliation']::text[]),
    ('instrumentists',          ARRAY['appointment','order_generator','payment','reviews','location','kyc','affiliation']::text[]),
    ('influencers',             ARRAY['appointment','order_generator','donation_gifts','reviews','kyc','affiliation']::text[]),
    ('services',                ARRAY['appointment','digital_products','order_generator','payment','reviews','product_comments','kyc','affiliation']::text[])
  ) AS t(type_key, keys)
),
merged AS (
  SELECT
    o.id AS org_id,
    ARRAY(
      SELECT DISTINCT unnest(
        COALESCE(o.enabled_features, ARRAY[]::text[])
        || COALESCE((SELECT keys FROM type_defaults WHERE type_key = o.siteviral_type), ARRAY[]::text[])
        || (SELECT keys FROM legacy_baseline)
      )
    ) AS new_features
  FROM public.organizations o
  WHERE o.created_at < now()  -- all existing orgs
)
UPDATE public.organizations o
SET enabled_features = m.new_features
FROM merged m
WHERE o.id = m.org_id
  AND (
    o.enabled_features IS NULL
    OR NOT (o.enabled_features @> m.new_features)  -- only touch rows that would gain keys
  );
