import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';

export default function TermsPage() {
  return (
    <LegalPageShell>
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Terms of Service</h1>
      <p className="text-lg font-bold text-foreground mb-1">SITEVIRAL</p>
      <p className="text-sm text-muted-foreground mb-8 font-medium">Last updated: February 22, 2026</p>

      <div className={proseClasses}>
        <section>
          <h2>1. Introduction</h2>
          <p>
            These Terms of Service ("Terms") govern access to and use of the Siteviral platform, including all related websites,
            subdomains (including siteviral.com and siteviral.co), applications, and services (collectively, the "Service").
          </p>
          <p>The Service is operated by <strong>Hacktualiz Inc.</strong>, a Delaware corporation (C-Corporation), with its principal business address at:</p>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            131 Continental Dr, Suite 305<br />
            Newark, DE 19713<br />
            United States
          </p>
          <p>Throughout these Terms:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>"Company," "we," "us,"</strong> or <strong>"our"</strong> refers to Hacktualiz Inc.</li>
            <li><strong>"Siteviral"</strong> refers to the product and platform operated by the Company.</li>
            <li><strong>"User," "you,"</strong> or <strong>"your"</strong> refers to any individual or entity accessing or using the Service.</li>
            <li><strong>"Organization"</strong> refers to any entity, community, business, NGO, religious body, or leader operating within Siteviral.</li>
            <li><strong>"Member"</strong> refers to a user who joins or interacts with an Organization.</li>
            <li><strong>"Affiliate"</strong> refers to a user participating in the Siteviral affiliate program.</li>
          </ul>
          <p>
            By accessing or using the Service, you agree to be bound by these Terms.
            <strong> If you do not agree, you must not access or use the Service.</strong>
          </p>
        </section>

        <section>
          <h2>2. Description of the Service</h2>
          <p>Siteviral is a multi-tenant SaaS infrastructure that enables Organizations to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Publish and distribute digital content (videos, audio, media)</li>
            <li>Sell digital products</li>
            <li>Accept donations</li>
            <li>Operate affiliate marketing programs</li>
            <li>Manage members and communications</li>
            <li>Process payouts subject to compliance and KYC review</li>
          </ul>
          <p>
            The Company provides infrastructure and payment facilitation tools.
            <strong> The Company does not act as the seller of products, recipient of donations (except platform fees), or provider of Organization content.</strong>
          </p>
          <p>Organizations remain solely responsible for their content, offerings, and compliance with applicable laws.</p>
        </section>

        <section>
          <h2>3. Eligibility</h2>
          <p>To use the Service:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be at least <strong>18 years old</strong> or the legal age of majority in your jurisdiction.</li>
            <li>You must have the legal authority to enter into binding agreements.</li>
            <li>If acting on behalf of an Organization, you must have authority to bind that Organization.</li>
          </ul>
          <p>The Company may refuse service to any person or entity at its sole discretion.</p>
        </section>

        <section>
          <h2>4. Account Registration</h2>
          <p>To access certain features, you must create an account. You agree to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide accurate and complete information.</li>
            <li>Maintain the security of your login credentials.</li>
            <li>Notify us immediately of unauthorized use.</li>
            <li>Accept full responsibility for all activity under your account.</li>
          </ul>
          <p>The Company is not liable for losses resulting from unauthorized access due to your failure to safeguard credentials.</p>
        </section>

        <section>
          <h2>5. Organizations & Content Responsibility</h2>
          <p>Organizations may create public pages and offer products, donations, and affiliate links.</p>
          <p>Each Organization represents and warrants that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>It has the legal right to offer its content, products, and services.</li>
            <li>Its activities comply with all applicable laws and regulations.</li>
            <li>Its content does not infringe intellectual property rights.</li>
            <li>Its activities do not violate AML, anti-fraud, sanctions, or export laws.</li>
          </ul>
          <p>The Company does not review all content and is not responsible for the legality, accuracy, or quality of Organization materials.</p>
          <p>The Company reserves the right to suspend, restrict, or remove content or Organizations that violate these Terms.</p>
        </section>

        <section>
          <h2>6. Payments</h2>
          <h3 className="text-lg font-bold text-foreground mt-4 mb-2">6.1 Payment Processing</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Payments are processed through third-party payment providers, including but not limited to Paystack.</li>
            <li>Payment method availability may vary by country and jurisdiction.</li>
            <li>The Company does not store full card details.</li>
          </ul>
          <h3 className="text-lg font-bold text-foreground mt-4 mb-2">6.2 Platform Fee</h3>
          <p>The Company may charge a platform fee on transactions processed through the Service. This fee may vary by plan or configuration.</p>
          <h3 className="text-lg font-bold text-foreground mt-4 mb-2">6.3 Transaction Splits</h3>
          <p>For eligible transactions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>A platform fee is retained by the Company.</li>
            <li>An affiliate commission (if applicable) is allocated.</li>
            <li>The remaining amount is allocated to the Organization.</li>
          </ul>
          <p>All splits are automated.</p>
        </section>

        <section>
          <h2>7. Affiliate Program</h2>
          <p>The affiliate system allows users to promote Organizations and earn commissions.</p>
          <p>Affiliate commissions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Are subject to last-click attribution within a defined cookie window.</li>
            <li>May be subject to review for fraud or abuse.</li>
            <li>Become payable only after a holding period (minimum 15 days).</li>
          </ul>
          <p>Self-referrals, fraudulent activity, artificial traffic, or manipulation of attribution mechanisms are <strong>strictly prohibited</strong>.</p>
          <p>The Company may cancel commissions determined to be fraudulent.</p>
        </section>

        <section>
          <h2>8. KYC & Payouts</h2>
          <p>To receive payouts, Organizations and Affiliates may be required to complete identity verification ("KYC").</p>
          <p>The Company reserves the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Request additional documentation.</li>
            <li>Delay payouts for review.</li>
            <li>Freeze payouts in cases of fraud, dispute, AML review, or chargebacks.</li>
            <li>Deny payouts if compliance standards are not met.</li>
          </ul>
          <p>Payout timelines may vary depending on compliance review and payment provider processing.</p>
        </section>

        <section>
          <h2>9. Refunds & Chargebacks</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Digital goods are generally <strong>non-refundable</strong> unless explicitly stated.</li>
            <li>Organizations are responsible for honoring applicable refund policies.</li>
          </ul>
          <p>The Company may:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Freeze payouts if excessive chargebacks occur.</li>
            <li>Deduct chargeback amounts from future payouts.</li>
            <li>Use transaction and download logs as proof of delivery in disputes.</li>
          </ul>
        </section>

        <section>
          <h2>10. Prohibited Activities</h2>
          <p>Users and Organizations may not use the Service for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fraud or deception</li>
            <li>Money laundering</li>
            <li>Terrorist financing</li>
            <li>Intellectual property infringement</li>
            <li>Sale of illegal goods or services</li>
            <li>Hate speech or violent content</li>
            <li>Distribution of malicious software</li>
            <li>Impersonation or identity fraud</li>
            <li>Sanctions violations</li>
          </ul>
          <p>Violation may result in immediate suspension and reporting to authorities.</p>
        </section>

        <section>
          <h2>11. Suspension & Termination</h2>
          <p>The Company may suspend or terminate access at its sole discretion, including but not limited to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violation of these Terms</li>
            <li>Fraud indicators</li>
            <li>Regulatory concerns</li>
            <li>Security risks</li>
          </ul>
          <p>Upon termination, access to the Service may cease immediately.</p>
        </section>

        <section>
          <h2>12. Intellectual Property</h2>
          <p>The Siteviral platform, including design, software, trademarks, and branding, is owned by <strong>Hacktualiz Inc.</strong></p>
          <p>Users retain ownership of their content but grant the Company a limited license to host and display such content to operate the Service.</p>
        </section>

        <section>
          <h2>13. Disclaimers</h2>
          <p>The Service is provided <strong>"AS IS"</strong> and <strong>"AS AVAILABLE."</strong></p>
          <p>The Company makes no warranties regarding:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Availability</li>
            <li>Reliability</li>
            <li>Financial outcomes</li>
            <li>Revenue generation</li>
            <li>Legal compliance of Organizations</li>
          </ul>
        </section>

        <section>
          <h2>14. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Hacktualiz Inc. shall not be liable for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Indirect or consequential damages</li>
            <li>Loss of profits</li>
            <li>Data loss</li>
            <li>Business interruption</li>
          </ul>
          <p>Total liability shall not exceed fees paid to the Company in the preceding 12 months.</p>
        </section>

        <section>
          <h2>15. Indemnification</h2>
          <p>You agree to <strong>indemnify and hold harmless</strong> Hacktualiz Inc., its officers, employees, and affiliates from any claims arising out of:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your use of the Service</li>
            <li>Your content</li>
            <li>Your violation of these Terms</li>
            <li>Your breach of law</li>
          </ul>
        </section>

        <section>
          <h2>16. Governing Law</h2>
          <p>
            These Terms shall be governed by the <strong>laws of the State of Delaware</strong>, United States, without regard to conflict of law principles.
          </p>
          <p>
            Any disputes shall be resolved in competent courts located in Delaware, unless otherwise required by applicable law.
          </p>
        </section>

        <section>
          <h2>17. Modifications</h2>
          <p>The Company may modify these Terms at any time. Continued use of the Service constitutes acceptance of updated Terms.</p>
        </section>

        <section>
          <h2>18. Contact</h2>
          <p>For legal inquiries:</p>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            131 Continental Dr, Suite 305<br />
            Newark, DE 19713<br />
            United States
          </p>
          <p className="font-medium mt-2">
            Contact: <a href="mailto:legal@siteviral.com" className="text-primary underline">legal@siteviral.com</a><br />
            Privacy: <a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a>
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-10 text-center">© 2026 Hacktualiz Inc. All rights reserved.</p>
      </div>
    </LegalPageShell>
  );
}
