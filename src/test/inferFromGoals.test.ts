import { describe, it, expect } from 'vitest';
import { inferSiteviralConfig } from '@/lib/siteviral/inferFromGoals';

describe('inferSiteviralConfig', () => {
  it('anchor: beauty + appointments + payments + digital + location + reviews', () => {
    const { siteviral_type, enabled_features } = inferSiteviralConfig([
      'offer_beauty',
      'receive_appointments',
      'accept_payments',
      'sell_digital',
      'show_location',
      'receive_reviews',
    ]);
    expect(siteviral_type).toBe('beauty');
    const set = new Set(enabled_features);
    ['appointment','order_generator','payment','location','reviews','digital_products','product_comments','kyc','affiliation']
      .forEach((f) => expect(set.has(f as any)).toBe(true));
  });

  it('events alone → generic services (unclear/mixed)', () => {
    const { siteviral_type, enabled_features } = inferSiteviralConfig(['create_events']);
    expect(siteviral_type).toBe('services');
    expect(enabled_features).toContain('events');
    expect(enabled_features).not.toContain('payment');
  });

  it('donations only → church', () => {
    const { siteviral_type } = inferSiteviralConfig(['receive_donations']);
    expect(siteviral_type).toBe('church');
  });

  it('donations + beauty → beauty wins', () => {
    const { siteviral_type } = inferSiteviralConfig(['receive_donations', 'offer_beauty']);
    expect(siteviral_type).toBe('beauty');
  });
});
