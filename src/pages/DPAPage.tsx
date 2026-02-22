import LegalPageShell from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';

export default function DPAPage() {
  return (
    <LegalPageShell>
      <SEOHead title="Data Processing Agreement — Siteviral" description="Siteviral DPA: how we handle data processing on behalf of organizations." />

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Data Processing Agreement (DPA)</h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">Last updated: February 2026</p>

      <div className="max-w-none space-y-6 text-foreground text-[15px] sm:text-base font-semibold leading-relaxed">
        <p>This Data Processing Agreement ("DPA") forms part of the Terms of Service between Hacktualiz Inc. ("Processor", "we", "us") and the Organization ("Controller", "you") using the Siteviral platform.</p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">1. Roles</h2>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li><strong>Data Controller:</strong> The Organization that uses Siteviral to manage its community, content, and transactions.</li>
          <li><strong>Data Processor:</strong> Hacktualiz Inc., operator of the Siteviral platform, processing data on behalf of the Controller.</li>
        </ul>

        <h2 className="text-xl font-extrabold mt-8 mb-3">2. Data Processed</h2>
        <p className="font-medium">We process personal data including but not limited to: names, email addresses, phone numbers (E.164), payment references, IP addresses, device identifiers, and transaction records, strictly as necessary to provide platform services.</p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">3. Authorized Processing</h2>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li>Hosting and serving platform content</li>
          <li>Processing payments via Paystack</li>
          <li>Sending transactional emails via Resend</li>
          <li>Security monitoring and fraud prevention</li>
          <li>AML/KYC compliance checks</li>
        </ul>

        <h2 className="text-xl font-extrabold mt-8 mb-3">4. Sub-Processors</h2>
        <p className="font-medium mb-3">We engage the following sub-processors to deliver our services:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-bold">Sub-Processor</th>
                <th className="text-left p-3 font-bold">Purpose</th>
                <th className="text-left p-3 font-bold">Location</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Supabase Inc.</td><td className="p-3">Database, auth, storage, edge functions</td><td className="p-3">United States</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Paystack (Stripe)</td><td className="p-3">Payment processing, verification</td><td className="p-3">Nigeria / US</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Resend Inc.</td><td className="p-3">Transactional email delivery</td><td className="p-3">United States</td></tr>
              <tr><td className="p-3 font-medium text-foreground">Sentry</td><td className="p-3">Error monitoring</td><td className="p-3">United States</td></tr>
            </tbody>
          </table>
        </div>
        <p className="font-medium mt-3">See our full <a href="/subprocessors" className="text-primary underline">Sub-Processors list</a>.</p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">5. Security Measures</h2>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li>Encryption in transit (TLS) and at rest</li>
          <li>Row-level security (RLS) for multi-tenant data isolation</li>
          <li>HMAC webhook signature verification</li>
          <li>Rate limiting on critical endpoints</li>
          <li>Idempotent transaction processing</li>
          <li>Signed URLs for protected file downloads</li>
          <li>Audit logging on all sensitive actions</li>
        </ul>

        <h2 className="text-xl font-extrabold mt-8 mb-3">6. Data Retention Schedule</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-bold">Data Category</th>
                <th className="text-left p-3 font-bold">Retention Period</th>
                <th className="text-left p-3 font-bold">Legal Basis</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Payment events & audit logs</td><td className="p-3">24 months (or longer if required by law)</td><td className="p-3">Legal obligation</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Download logs</td><td className="p-3">12 months</td><td className="p-3">Legitimate interest</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">KYC submissions</td><td className="p-3">5 years after end of relationship</td><td className="p-3">AML regulations</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">Support tickets</td><td className="p-3">24 months after resolution</td><td className="p-3">Legitimate interest</td></tr>
              <tr className="border-b border-border/50"><td className="p-3 font-medium text-foreground">User profiles</td><td className="p-3">Duration of account + 30 days</td><td className="p-3">Contract performance</td></tr>
              <tr><td className="p-3 font-medium text-foreground">Transaction records</td><td className="p-3">7 years</td><td className="p-3">Financial/tax compliance</td></tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-extrabold mt-8 mb-3">7. Data Subject Rights (DSAR)</h2>
        <p className="font-medium mb-3">We assist Controllers in fulfilling data subject requests:</p>
        <ul className="list-disc pl-5 space-y-1 font-medium">
          <li><strong>Right of Access:</strong> Users can export their personal data from profile settings.</li>
          <li><strong>Right to Rectification:</strong> Users can update their profile directly.</li>
          <li><strong>Right to Erasure:</strong> Users can delete accounts; completed within 30 days, except legally retained data.</li>
          <li><strong>Right to Data Portability:</strong> Export in machine-readable format available on request.</li>
          <li><strong>Right to Object:</strong> Users can opt out of non-essential processing.</li>
        </ul>
        <p className="font-medium mt-3">
          Submit a DSAR to <a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a>. Response within 30 days.
        </p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">8. Breach Notification</h2>
        <p className="font-medium">In the event of a personal data breach, we will notify the Controller without undue delay and within 72 hours, providing details and remediation steps.</p>

        <h2 className="text-xl font-extrabold mt-8 mb-3">9. Contact</h2>
        <p className="font-medium">
          Hacktualiz Inc.<br />
          131 Continental Dr, Suite 305, Newark, DE 19713, United States<br />
          Email: <a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a>
        </p>
      </div>
    </LegalPageShell>
  );
}
