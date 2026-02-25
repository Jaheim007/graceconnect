import LegalPageShell from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';

const subprocessors = [
  {
    name: 'Supabase Inc.',
    purpose: 'Database hosting, authentication, file storage, edge functions (serverless compute)',
    location: 'United States',
    website: 'https://supabase.com',
  },
  {
    name: 'Paystack (Stripe Inc.)',
    purpose: 'Payment processing, transaction verification, payout disbursement',
    location: 'Nigeria / United States',
    website: 'https://paystack.com',
  },
  {
    name: 'Resend Inc.',
    purpose: 'Transactional and campaign email delivery',
    location: 'United States',
    website: 'https://resend.com',
  },
  {
    name: 'Sentry (Functional Software Inc.)',
    purpose: 'Frontend error monitoring and performance tracking',
    location: 'United States',
    website: 'https://sentry.io',
  },
];

export default function SubprocessorsPage() {
  return (
    <LegalPageShell>
      <SEOHead title="Sub-Processors — Siteviral" description="List of third-party sub-processors used by Siteviral. Data processing, hosting, payments." canonicalUrl="https://siteviral.com/subprocessors" locale="en_US" />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Sub-Processors</h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">Last updated: February 2026</p>

      <p className="text-foreground text-[15px] sm:text-base font-semibold leading-relaxed mb-6">
        Siteviral, operated by Hacktualiz Inc., engages the following third-party sub-processors to deliver
        our platform services. Each sub-processor is contractually bound to protect your data in accordance
        with our <a href="/dpa" className="text-primary underline">Data Processing Agreement</a>.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-lg">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-bold text-foreground">Sub-Processor</th>
              <th className="text-left p-3 font-bold text-foreground">Purpose</th>
              <th className="text-left p-3 font-bold text-foreground">Location</th>
            </tr>
          </thead>
          <tbody>
            {subprocessors.map((sp, i) => (
              <tr key={sp.name} className={i < subprocessors.length - 1 ? 'border-b border-border/50' : ''}>
                <td className="p-3 font-semibold text-foreground">
                  <a href={sp.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {sp.name}
                  </a>
                </td>
                <td className="p-3 text-muted-foreground">{sp.purpose}</td>
                <td className="p-3 text-muted-foreground">{sp.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 space-y-4 text-[15px] sm:text-base font-semibold leading-relaxed text-foreground">
        <h2 className="text-xl font-extrabold">Changes to this list</h2>
        <p>
          We will update this page when sub-processors are added or removed. Organizations using our platform
          will be notified of material changes via email at least 30 days in advance.
        </p>

        <h2 className="text-xl font-extrabold mt-8">Contact</h2>
        <p className="font-medium">
          For questions about our sub-processors or data processing practices:<br />
          <a href="mailto:privacy@siteviral.com" className="text-primary hover:underline">privacy@siteviral.com</a>
        </p>
      </div>
    </LegalPageShell>
  );
}
