import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { Shield } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function SecurityPage() {
  return (
    <LegalPageShell>
      <SEOHead title="Security — Siteviral" description="How Siteviral protects your data. Encryption, SOC 2 compliance, infrastructure security." canonicalUrl="https://siteviral.com/security" locale="en_US" />
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">Security</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8 font-medium">How Siteviral protects your data and your organization's integrity</p>

      <div className={proseClasses}>
        <section>
          <h2>1. Architecture Overview</h2>
          <p>
            Siteviral is built on a modern, security-first architecture. All data is hosted on Supabase (backed by AWS) with strict multi-tenant isolation.
            Edge Functions run server-side logic in Deno isolates, ensuring no direct database access from the client.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>All traffic encrypted via TLS 1.2+</li>
            <li>Multi-tenant data isolation via Row Level Security (RLS) on every table</li>
            <li>Server-side payment verification — no client-side trust</li>
            <li>Signed URLs for all protected file downloads</li>
          </ul>
        </section>

        <section>
          <h2>2. Row Level Security (RLS)</h2>
          <p>
            Every table in our database enforces RLS policies. Users can only access data belonging to their organization or their own profile.
            Admin-level queries are restricted to users with verified roles. Superadmin access is limited to designated platform operators.
          </p>
        </section>

        <section>
          <h2>3. Payment Security</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>All payments processed server-side via Paystack (PCI-DSS Level 1 certified)</li>
            <li>Webhook signatures verified using HMAC SHA-512 before processing</li>
            <li>Idempotent transaction processing via <code>payment_events</code> table to prevent double-processing</li>
            <li>Transaction references prefixed with <code>SV-</code> for traceability</li>
            <li>Rate limiting on payment endpoints to prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2>4. Authentication</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Magic Link (passwordless email authentication)</li>
            <li>Google OAuth 2.0</li>
            <li>No passwords stored — zero risk of password database compromise</li>
            <li>Session tokens managed by Supabase Auth with automatic refresh</li>
          </ul>
        </section>

        <section>
          <h2>5. Monitoring & Audit</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Permanent audit trail on all sensitive actions (KYC, payouts, account changes)</li>
            <li>Fraud detection flags with automatic alerts for suspicious transaction patterns</li>
            <li>Download logs for proof-of-delivery in dispute resolution</li>
            <li>Sentry error monitoring on frontend for rapid incident detection</li>
            <li>Structured logs with correlation IDs on Edge Functions</li>
          </ul>
        </section>

        <section>
          <h2>6. Incident Response</h2>
          <p>
            In the event of a security incident, Siteviral follows a structured response process:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Detection:</strong> Automated monitoring + manual review</li>
            <li><strong>Containment:</strong> Immediate isolation of affected systems/accounts</li>
            <li><strong>Notification:</strong> Affected users and organizations notified within 72 hours</li>
            <li><strong>Remediation:</strong> Root cause analysis and patch deployment</li>
            <li><strong>Post-mortem:</strong> Internal review and process improvement</li>
          </ul>
        </section>

        <section>
          <h2>7. Data Protection</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>KYC documents stored in private, access-controlled storage buckets</li>
            <li>File downloads require time-limited signed URLs</li>
            <li>No sensitive data exposed in client-side code or API responses</li>
            <li>API keys and secrets stored in encrypted environment variables</li>
            <li>Secret rotation supported without service interruption</li>
          </ul>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            To report a security vulnerability or concern:
          </p>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            Security Team<br />
            131 Continental Dr, Suite 305, Newark, DE 19713, USA<br />
            Email : security@siteviral.com
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
