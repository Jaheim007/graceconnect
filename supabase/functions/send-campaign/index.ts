import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { campaign_id } = await req.json();
    if (!campaign_id) return new Response(JSON.stringify({ error: 'campaign_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Fetch campaign
    const { data: campaign } = await db.from('email_campaigns').select('*').eq('id', campaign_id).single();
    if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Verify user can manage this org
    const { data: canManage } = await db.rpc('can_manage_org', { _user_id: user.id, _org_id: campaign.organization_id });
    if (!canManage) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Get org info for sender name
    const { data: org } = await db.from('organizations').select('name, slug').eq('id', campaign.organization_id).single();

    // Get contacts — filter by tags if specified
    let contactsQuery = db.from('contacts').select('email, name').eq('organization_id', campaign.organization_id).eq('is_subscribed', true);
    const { data: contacts } = await contactsQuery;
    
    if (!contacts?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'No contacts' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Filter by tags if campaign has recipient_tags
    let recipients = contacts;
    if (campaign.recipient_tags?.length > 0) {
      // We'd need to fetch contacts with tags — re-query
      const { data: taggedContacts } = await db.from('contacts').select('email, name, tags')
        .eq('organization_id', campaign.organization_id).eq('is_subscribed', true);
      recipients = (taggedContacts || []).filter((c: any) => {
        const cTags = c.tags || [];
        return campaign.recipient_tags.some((t: string) => cTags.includes(t));
      });
    }

    if (!RESEND_API_KEY) {
      // Mark as sent with 0 count
      await db.from('email_campaigns').update({ status: 'sent', sent_at: new Date().toISOString(), sent_count: 0, recipient_count: recipients.length }).eq('id', campaign_id);
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: 'RESEND_API_KEY not configured' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Send via Resend in batches of 50
    let sentCount = 0;
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const emails = batch.map((c: any) => c.email);

      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(emails.map((email: string) => ({
          from: `${org?.name || 'Siteviral'} <noreply@siteviral.com>`,
          to: email,
          subject: campaign.subject,
          html: campaign.body,
        }))),
      });

      if (res.ok) {
        sentCount += batch.length;
      } else if (res.status === 429) {
        // Rate limited — wait and retry once
        console.warn('[send-campaign] Rate limited by Resend, waiting 2s before retry...');
        await new Promise(r => setTimeout(r, 2000));
        const retryRes = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(emails.map((email: string) => ({
            from: `${org?.name || 'Siteviral'} <noreply@siteviral.com>`,
            to: email,
            subject: campaign.subject,
            html: campaign.body,
          }))),
        });
        if (retryRes.ok) sentCount += batch.length;
        else console.error('[send-campaign] Retry failed:', await retryRes.text());
      } else {
        console.error('[send-campaign] Batch send failed:', res.status, await res.text());
      }

      // Rate limit: wait 1.5s between batches to stay under Resend's 2 req/s limit
      if (i + batchSize < recipients.length) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // Update campaign
    await db.from('email_campaigns').update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
      recipient_count: recipients.length,
    }).eq('id', campaign_id);

    return new Response(JSON.stringify({ ok: true, sent: sentCount, total: recipients.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-campaign error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
