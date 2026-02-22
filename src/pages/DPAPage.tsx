import { SEOHead } from '@/components/seo/SEOHead';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function DPAPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Data Processing Agreement — Siteviral" description="Siteviral DPA: how we handle data processing on behalf of organizations." />
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-14 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">Data Processing Agreement</span>
      </div>
      <div className="container max-w-3xl px-4 py-8 prose prose-invert prose-sm max-w-none">
        <h1 className="text-2xl font-bold mb-2">Data Processing Agreement (DPA)</h1>
        <p className="text-muted-foreground text-sm mb-6">Last updated: February 2026</p>

        <p>This Data Processing Agreement (&quot;DPA&quot;) forms part of the Terms of Service between Hacktualiz Inc. (&quot;Processor&quot;, &quot;we&quot;, &quot;us&quot;) and the Organization (&quot;Controller&quot;, &quot;you&quot;) using the Siteviral platform.</p>

        <h2 className="text-lg font-semibold mt-8 mb-3">1. Roles</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          <li><strong className="text-foreground">Data Controller:</strong> The Organization that uses Siteviral to manage its community, content, and transactions.</li>
          <li><strong className="text-foreground">Data Processor:</strong> Hacktualiz Inc., operator of the Siteviral platform, processing data on behalf of the Controller.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-8 mb-3">2. Data Processed</h2>
        <p className="text-sm text-muted-foreground">We process personal data including but not limited to: names, email addresses, phone numbers, payment references, IP addresses, device identifiers, and transaction records, strictly as necessary to provide platform services.</p>

        <h2 className="text-lg font-semibold mt-8 mb-3">3. Sub-Processors</h2>
        <p className="text-sm text-muted-foreground mb-3">We engage the following sub-processors to deliver our services:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-semibold">Sub-Processor</th>
                <th className="text-left p-3 font-semibold">Purpose</th>
                <th className="text-left p-3 font-semibold">Location</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="p-3 font-medium text-foreground">Supabase Inc.</td>
                <td className="p-3">Database hosting, authentication, file storage, edge functions</td>
                <td className="p-3">United States</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-3 font-medium text-foreground">Paystack (Stripe)</td>
                <td className="p-3">Payment processing, transaction verification</td>
                <td className="p-3">Nigeria / United States</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Resend Inc.</td>
                <td className="p-3">Transactional email delivery</td>
                <td className="p-3">United States</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-lg font-semibold mt-8 mb-3">4. Security Measures</h2>
        <p className="text-sm text-muted-foreground">We implement industry-standard security measures including: encryption in transit (TLS), row-level security (RLS) for multi-tenant data isolation, HMAC webhook signature verification, rate limiting on critical endpoints, and audit logging.</p>

        <h2 className="text-lg font-semibold mt-8 mb-3">5. Data Retention</h2>
        <p className="text-sm text-muted-foreground">Personal data is retained for the duration of the Controller&apos;s account. Upon account deletion, personal data is removed within 30 days, except where retention is required by law (e.g., financial transaction records).</p>

        <h2 className="text-lg font-semibold mt-8 mb-3">6. Data Subject Rights</h2>
        <p className="text-sm text-muted-foreground">We assist Controllers in fulfilling data subject requests (access, rectification, erasure, portability) through our platform tools and admin APIs. Users can delete their accounts and associated data directly from their profile settings.</p>

        <h2 className="text-lg font-semibold mt-8 mb-3">7. Breach Notification</h2>
        <p className="text-sm text-muted-foreground">In the event of a personal data breach, we will notify the Controller without undue delay and within 72 hours of becoming aware, providing details of the breach and remediation steps.</p>

        <h2 className="text-lg font-semibold mt-8 mb-3">8. Contact</h2>
        <p className="text-sm text-muted-foreground">
          For DPA-related inquiries:<br />
          Hacktualiz Inc.<br />
          131 Continental Dr, Suite 305, Newark, DE 19713, United States<br />
          Email: <a href="mailto:privacy@siteviral.com" className="text-primary hover:underline">privacy@siteviral.com</a>
        </p>
      </div>
    </div>
  );
}
