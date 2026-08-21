# Siteviral

You are building the backend of a production-grade multi-tenant SaaS called GraceConnect (Community Growth & Commerce Platform) using Supabase Postgres + RLS + Storage + Edge Functions.

GOAL: Create the COMPLETE database schema with strict multi-tenant isolation (organization_id), progressive KYC gating, monetization modules (donations + digital products), affiliate tracking, notifications, audit logs, reports, and superadmin role.

COUNTRY DEFAULTS: Côte d’Ivoire (CI) and currency XOF across organization + donations/products/purchases.

IMPORTANT:

- Enable RLS on ALL tables.

- Use SECURITY DEFINER helper functions to avoid recursive policies.

- Implement updated_at triggers.

- Implement role-based access at org-level: owner/admin/editor/member/affiliate.

- Implement platform-level role: superadmin.

- Public users can read ONLY published org public profile + published content + published campaigns + published products.

- Any non-published content must never be public.

- Monetization (donations + purchases) requires KYC level1 approved OR monetization_enabled = true (set only when approved).

- Store uploads use Supabase Storage; keep file_url fields.

- Add indexes for performance.

CREATE ALL SQL NOW.

========================

1) EXTENSIONS

========================

Enable uuid extension if needed:

- pgcrypto for gen_random_uuid()

========================

2) TYPES (ENUMS)

========================

Create enums for:

- org_category: church, ministry, leader, ngo, community, other

- org_plan: free, pro, growth, enterprise

- kyc_status: none, pending, level1, level2, rejected

- org_member_role: owner, admin, editor, member, affiliate

- platform_role: superadmin, user

- media_type: video, audio, reel, live_replay

- payment_status: pending, completed, failed, refunded

- purchase_status: pending, completed, failed

- report_status: pending, reviewed, resolved, dismissed

- affiliate_sale_status: pending, payable, paid, cancelled

========================

3) CORE MULTI-TENANT TABLES

========================

Create tables:

A) organizations

- id uuid pk default gen_random_uuid()

- name text not null

- slug text unique not null (lowercase, url safe)

- description text

- logo_url text

- banner_url text

- category org_category default 'church'

- plan_type org_plan default 'free'

- country text default 'CI'

- currency text default 'XOF'

- whatsapp text

- website text

- is_active boolean default true

- is_verified boolean default false

- owner_id uuid not null (store auth.users id)

- kyc_status kyc_status default 'none'

- monetization_enabled boolean default false

- affiliation_enabled boolean default false

- affiliation_commission_percent numeric default 10

- platform_fee_percent numeric default 10

- paystack_subaccount_code text

- created_at timestamptz default now()

- updated_at timestamptz default now()

Indexes: slug, owner_id, is_active, category.

B) organization_members

- id uuid pk default gen_random_uuid()

- organization_id uuid fk organizations on delete cascade

- user_id uuid not null

- role org_member_role default 'member'

- invited_by uuid

- joined_at timestamptz default now()

Unique(organization_id, user_id)

Index: (user_id, organization_id), (organization_id, role)

C) profiles (global)

- id uuid pk (equals auth.users.id)

- display_name text

- avatar_url text

- bio text

- phone text

- country text default 'CI'

- created_at timestamptz default now()

- updated_at timestamptz default now()

D) user_platform_roles

- id uuid pk default gen_random_uuid()

- user_id uuid unique not null

- role platform_role default 'user'

- created_at timestamptz default now()

========================

4) CONTENT MODULES

========================

A) media_content

- id uuid pk

- organization_id uuid fk organizations

- created_by uuid not null

- title text not null

- description text

- media_type media_type default 'video'

- media_url text

- thumbnail_url text

- duration_seconds int

- aspect_ratio text default '16:9'

- tags text[]

- series text

- speaker text

- is_premium boolean default false

- is_featured boolean default false

- is_published boolean default false

- display_order int default 0

- view_count int default 0

- like_count int default 0

- created_at timestamptz default now()

- updated_at timestamptz default now()

Indexes: organization_id, is_published, media_type, created_at

B) media_likes

- id uuid pk

- media_id uuid fk media_content on delete cascade

- organization_id uuid not null (denormalized for RLS + indexing)

- user_id uuid not null

- created_at timestamptz default now()

Unique(media_id, user_id)

Index: organization_id, user_id

C) media_saves

(similar to likes)

D) watch_history

- id uuid pk

- media_id uuid fk media_content

- organization_id uuid not null

- user_id uuid not null

- progress_seconds int default 0

- completed boolean default false

- watched_at timestamptz default now()

Unique(media_id, user_id)

Index: user_id, organization_id

E) announcements

- id uuid pk

- organization_id uuid fk organizations

- created_by uuid

- title text not null

- body text not null

- image_url text

- image_position text default 'center'

- is_pinned boolean default false

- published_at timestamptz default now()

- expires_at timestamptz

- is_published boolean default true

- created_at timestamptz default now()

- updated_at timestamptz default now()

F) events

- id uuid pk

- organization_id uuid

- created_by uuid

- title text not null

- description text

- image_url text

- video_url text

- location text

- event_date timestamptz

- is_featured boolean default false

- is_published boolean default false

- display_order int default 0

- created_at timestamptz default now()

- updated_at timestamptz default now()

========================

5) MONETIZATION MODULES

========================

A) donation_campaigns

- id uuid pk

- organization_id uuid

- created_by uuid

- title text not null

- description text

- image_url text

- goal_amount numeric

- current_amount numeric default 0

- currency text default 'XOF'

- is_active boolean default true

- is_featured boolean default false

- is_published boolean default true

- end_date timestamptz

- created_at timestamptz default now()

- updated_at timestamptz default now()

B) donations

- id uuid pk

- organization_id uuid

- campaign_id uuid nullable fk donation_campaigns

- user_id uuid nullable

- donor_name text

- donor_email text

- amount numeric not null

- currency text default 'XOF'

- paystack_reference text unique not null

- status payment_status default 'pending'

- is_recurring boolean default false

- affiliate_link_id uuid nullable

- platform_fee numeric

- affiliate_commission numeric

- organization_amount numeric

- completed_at timestamptz

- created_at timestamptz default now()

Indexes: organization_id, status, created_at

C) digital_products

- id uuid pk

- organization_id uuid

- created_by uuid

- title text not null

- description text

- cover_image_url text

- file_url text

- external_link text

- product_type text default 'pdf'

- price numeric default 0

- currency text default 'XOF'

- is_free boolean default false

- is_featured boolean default false

- is_published boolean default false

- display_order int default 0

- sales_count int default 0

- created_at timestamptz default now()

- updated_at timestamptz default now()

Indexes: organization_id, is_published, created_at

D) product_purchases

- id uuid pk

- product_id uuid fk digital_products on delete cascade

- organization_id uuid not null

- user_id uuid not null

- amount numeric not null

- currency text default 'XOF'

- paystack_reference text unique not null

- status purchase_status default 'pending'

- affiliate_link_id uuid nullable

- platform_fee numeric

- affiliate_commission numeric

- organization_amount numeric

- completed_at timestamptz

- created_at timestamptz default now()

Indexes: organization_id, user_id, status

========================

6) AFFILIATION MODULE

========================

A) affiliate_links

- id uuid pk

- organization_id uuid fk organizations

- user_id uuid not null

- code text unique not null

- product_id uuid nullable fk digital_products

- campaign_id uuid nullable fk donation_campaigns

- link_type text default 'org' (org/product/donation)

- clicks int default 0

- conversions int default 0

- total_earned numeric default 0

- is_active boolean default true

- created_at timestamptz default now()

Indexes: organization_id, user_id, code

B) affiliate_sales

- id uuid pk

- affiliate_link_id uuid fk affiliate_links

- affiliate_user_id uuid not null

- organization_id uuid not null

- transaction_type text check (donation/product)

- transaction_id uuid not null

- gross_amount numeric not null

- commission_amount numeric not null

- commission_percent numeric not null

- status affiliate_sale_status default 'pending'

- payable_at timestamptz (e.g. now()+72h)

- paid_at timestamptz

- created_at timestamptz default now()

Indexes: organization_id, affiliate_user_id, status

C) payout_requests (optional but recommended for manual payouts later)

- id uuid pk

- organization_id uuid

- user_id uuid (affiliate or org owner)

- payout_type text (affiliate/org/platform)

- amount numeric not null

- currency text default 'XOF'

- status text (requested/approved/rejected/paid)

- requested_at timestamptz default now()

- processed_at timestamptz

- metadata jsonb default '{}'

========================

7) KYC MODULE

========================

A) kyc_submissions

- id uuid pk

- organization_id uuid fk organizations

- submitted_by uuid not null

- kyc_level int default 1

- id_document_url text

- id_document_type text

- phone_verified boolean default false

- bank_account_name text

- bank_account_number text

- bank_name text

- paystack_recipient_code text

- org_document_url text

- org_document_type text

- status text default 'pending' check (pending/approved/rejected)

- reviewed_by uuid

- rejection_reason text

- submitted_at timestamptz default now()

- reviewed_at timestamptz

========================

8) NOTIFICATIONS + PWA

========================

A) push_subscriptions

- id uuid pk

- user_id uuid not null

- organization_id uuid nullable (if per org)

- endpoint text not null

- p256dh text not null

- auth text not null

- created_at timestamptz default now()

- updated_at timestamptz default now()

B) user_notifications

- id uuid pk

- user_id uuid not null

- organization_id uuid nullable

- title text not null

- body text not null

- notification_type text default 'general'

- action_url text

- image_url text

- is_read boolean default false

- created_at timestamptz default now()

Indexes: user_id, is_read

========================

9) GOVERNANCE + AUDIT

========================

A) audit_logs

- id uuid pk

- organization_id uuid nullable

- user_id uuid nullable

- action text not null

- resource_type text

- resource_id uuid

- metadata jsonb default '{}'

- ip_address text

- created_at timestamptz default now()

Indexes: organization_id, created_at

B) content_reports

- id uuid pk

- reporter_user_id uuid not null

- content_type text not null

- content_id uuid not null

- organization_id uuid nullable

- reason text not null

- status report_status default 'pending'

- created_at timestamptz default now()

========================

10) UPDATED_AT TRIGGERS

========================

Implement set_updated_at() trigger and apply to tables with updated_at:

- organizations, profiles, media_content, announcements, events, donation_campaigns, digital_products, push_subscriptions

========================

11) HELPER FUNCTIONS (SECURITY DEFINER)

========================

Create:

- is_superadmin(user_id)

- get_org_role(user_id, org_id)

- is_org_member(user_id, org_id)

- can_manage_org(user_id, org_id) => role in owner/admin/editor

- can_admin_org(user_id, org_id) => role in owner/admin

- org_monetization_allowed(org_id) => organizations.monetization_enabled = true

Also create a function to safely create an organization and membership in one transaction:

- create_organization_with_owner(name, slug, category, description) returning org_id

This function inserts into organizations and organization_members as owner.

========================

12) RLS POLICIES (STRICT)

========================

Enable RLS on ALL tables.

POLICY RULES SUMMARY:

- organizations:

  - Public SELECT only is_active=true (and show limited public fields)

  - Members SELECT full org row if member

  - Owner/admin/editor UPDATE org settings

  - Only owner or superadmin can deactivate org

- organization_members:

  - Members can SELECT members list only if admin/owner (or at least member if you want)

  - Only admin/owner can INSERT invites

  - Users can delete their own membership (leave org)

- profiles:

  - Users can SELECT own profile

  - Users can UPDATE own profile

- user_platform_roles:

  - Only superadmin can read/write

- media_content/events/announcements/donation_campaigns/digital_products:

  - Public SELECT only when is_published=true (and for campaigns: is_published=true and is_active=true)

  - Editors+ can INSERT/UPDATE within org

  - Admin+ can DELETE within org

  - Unpublished content visible only to editors/admin/owner and superadmin

- donations/product_purchases:

  - INSERT allowed only when org_monetization_allowed(org_id)=true OR is_superadmin

  - Users SELECT their own rows

  - Org admin can SELECT aggregated view via RPC or SELECT policy limited (optional)

  - No UPDATE by users except maybe donor_name/email if pending (optional)

- affiliate_links:

  - INSERT allowed only if organizations.affiliation_enabled=true AND member exists

  - SELECT only owner of link + org admin/owner + superadmin

  - UPDATE only owner + org admin/owner

- affiliate_sales:

  - SELECT only affiliate_user_id + org admin/owner + superadmin

- kyc_submissions:

  - INSERT only by org owner/admin

  - SELECT by org owner/admin + superadmin

  - UPDATE only superadmin (review)

- audit_logs/content_reports/push_subscriptions/user_notifications:

  - push_subscriptions: users manage their own

  - notifications: users read their own; org admin can create via edge function with service key

  - reports: reporter can see their own report; superadmin can see all

IMPORTANT: Provide sample policies in SQL for at least: organizations, media_content, donations, digital_products, affiliate_links, kyc_submissions, profiles.

Also create indexes and constraints necessary.

DELIVER:

- One full SQL migration script that creates everything end-to-end.

- Turn on RLS for all tables.

- Include sample policies.

Now generate the SQL.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://graceconnect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fdcfbb7e-0039-431a-8533-89045b2dbc70).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
