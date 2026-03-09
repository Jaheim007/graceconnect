// Manual TypeScript types matching the Siteviral DB schema
// (auto-generated types.ts doesn't include our migrated tables yet)

export type OrgCategory = 'church' | 'ministry' | 'leader' | 'ngo' | 'community' | 'other';
export type OrgPlan = 'free' | 'pro' | 'growth' | 'enterprise';
export type KycStatus = 'none' | 'pending' | 'level1' | 'level2' | 'rejected';
export type OrgMemberRole = 'owner' | 'admin' | 'editor' | 'member' | 'affiliate';
export type PlatformRole = 'superadmin' | 'user';
export type MediaType = 'video' | 'audio' | 'reel' | 'live_replay';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PurchaseStatus = 'pending' | 'completed' | 'failed';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type AffiliateSaleStatus = 'pending' | 'payable' | 'paid' | 'cancelled';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  category: OrgCategory;
  plan_type: OrgPlan;
  country: string;
  currency: string;
  whatsapp?: string;
  website?: string;
  is_active: boolean;
  is_verified: boolean;
  owner_id: string;
  kyc_status: KycStatus;
  monetization_enabled: boolean;
  affiliation_enabled: boolean;
  affiliation_commission_percent: number;
  platform_fee_percent: number;
  paystack_subaccount_code?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgMemberRole;
  invited_by?: string;
  joined_at: string;
}

export interface Profile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  country: string;
  referral_code?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPlatformRole {
  id: string;
  user_id: string;
  role: PlatformRole;
  created_at: string;
}

export interface MediaContent {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  description?: string;
  media_type: MediaType;
  media_url?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  aspect_ratio: string;
  tags?: string[];
  series?: string;
  speaker?: string;
  is_premium: boolean;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  organization_id: string;
  created_by?: string;
  title: string;
  body: string;
  image_url?: string;
  image_position: string;
  is_pinned: boolean;
  published_at: string;
  expires_at?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  organization_id: string;
  created_by?: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  location?: string;
  map_url?: string;
  event_date?: string;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DonationCampaign {
  id: string;
  organization_id: string;
  created_by?: string;
  title: string;
  description?: string;
  image_url?: string;
  goal_amount?: number;
  current_amount: number;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  is_published: boolean;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  organization_id: string;
  campaign_id?: string;
  user_id?: string;
  donor_name?: string;
  donor_email?: string;
  amount: number;
  currency: string;
  paystack_reference: string;
  status: PaymentStatus;
  is_recurring: boolean;
  affiliate_link_id?: string;
  platform_fee?: number;
  affiliate_commission?: number;
  organization_amount?: number;
  completed_at?: string;
  created_at: string;
}

export interface DigitalProduct {
  id: string;
  organization_id: string;
  created_by?: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  file_url?: string;
  external_link?: string;
  product_type: string;
  price: number;
  currency: string;
  is_free: boolean;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductPurchase {
  id: string;
  product_id: string;
  organization_id: string;
  user_id: string;
  amount: number;
  currency: string;
  paystack_reference: string;
  status: PurchaseStatus;
  affiliate_link_id?: string;
  platform_fee?: number;
  affiliate_commission?: number;
  organization_amount?: number;
  completed_at?: string;
  created_at: string;
}

export interface AffiliateLink {
  id: string;
  organization_id: string;
  user_id: string;
  code: string;
  product_id?: string;
  campaign_id?: string;
  link_type: string;
  clicks: number;
  conversions: number;
  total_earned: number;
  is_active: boolean;
  created_at: string;
}

export interface KycSubmission {
  id: string;
  organization_id: string;
  submitted_by: string;
  kyc_level: number;
  id_document_url?: string;
  id_document_type?: string;
  phone_verified: boolean;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  paystack_recipient_code?: string;
  org_document_url?: string;
  org_document_type?: string;
  status: string;
  reviewed_by?: string;
  rejection_reason?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  organization_id?: string;
  title: string;
  body: string;
  notification_type: string;
  action_url?: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
}
