'use client';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using Roolify ("Service", "Application", "we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). 
              If you disagree with any part of these terms, you do not have permission to access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Roolify is a Webflow application that provides advanced form functionality including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Conditional logic for form fields (show/hide, enable/disable, set values)</li>
              <li>Smart email routing and notifications based on form data</li>
              <li>Form submission management and storage</li>
              <li>Designer Extension for Webflow</li>
              <li>Multi-site form management</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Account Registration</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.1 Account Creation</h3>
            <p className="text-gray-700 leading-relaxed mb-3">To use Roolify, you must:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Create an account with accurate and complete information</li>
              <li>Be at least 18 years of age or the age of majority in your jurisdiction</li>
              <li>Have a valid Webflow account</li>
              <li>Maintain the security of your account credentials</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.2 Account Responsibility</h3>
            <p className="text-gray-700 leading-relaxed">
              You are responsible for all activities that occur under your account. You must notify us immediately of any unauthorized 
              use of your account or any other breach of security. We will not be liable for any loss or damage arising from your 
              failure to maintain account security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Acceptable Use Policy</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.1 Permitted Use</h3>
            <p className="text-gray-700 leading-relaxed">
              You may use Roolify only for lawful purposes and in accordance with these Terms. You agree to use the Service 
              in compliance with all applicable laws and regulations.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.2 Prohibited Activities</h3>
            <p className="text-gray-700 leading-relaxed mb-3">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Infringe upon or violate our intellectual property rights or the rights of others</li>
              <li>Harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>Submit false or misleading information</li>
              <li>Upload or transmit viruses, malware, or any malicious code</li>
              <li>Spam, phish, or send unsolicited messages</li>
              <li>Attempt to bypass any security features or access restrictions</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated systems (bots, scrapers) without our permission</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Subscription Plans and Billing</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.1 Plan Tiers</h3>
            <p className="text-gray-700 leading-relaxed mb-3">Roolify offers multiple subscription tiers:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Free Plan:</strong> Limited features with usage restrictions</li>
              <li><strong>Pro Plan:</strong> Enhanced features and higher limits</li>
              <li><strong>Business Plan:</strong> Full features with priority support</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Current pricing and plan details are available at <a href="/plans" className="text-blue-600 hover:underline">roolify.com/plans</a>.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.2 Billing</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Paid subscriptions are billed monthly or annually in advance</li>
              <li>All fees are in U.S. Dollars (USD) unless otherwise stated</li>
              <li>Payment is processed securely through Stripe</li>
              <li>You authorize us to charge your payment method on a recurring basis</li>
              <li>Fees are non-refundable except as required by law</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.3 Price Changes</h3>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to change our pricing at any time. Price changes will not affect your current billing cycle 
              and will take effect at your next renewal. We will provide at least 30 days' notice of any price increases.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.4 Cancellation and Refunds</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Cancellation takes effect at the end of your current billing period</li>
              <li>You will retain access to paid features until the end of your billing period</li>
              <li>No refunds are provided for partial months or unused features</li>
              <li>Upon cancellation, your data will be retained for 30 days before deletion</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.5 Usage Limits</h3>
            <p className="text-gray-700 leading-relaxed">
              Each plan has specific usage limits (number of rules, submissions, sites, etc.). If you exceed your plan's limits, 
              we may require you to upgrade or may temporarily restrict access to certain features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Intellectual Property Rights</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.1 Our Rights</h3>
            <p className="text-gray-700 leading-relaxed">
              The Service, including its original content, features, and functionality, is owned by Roolify and is protected by 
              international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, 
              modify, distribute, sell, or lease any part of our Service without our express written permission.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.2 Your Rights</h3>
            <p className="text-gray-700 leading-relaxed">
              You retain all rights to the data you submit to Roolify, including form submissions, rules, and configurations. 
              By using our Service, you grant us a limited license to use, store, and process your data solely for the purpose 
              of providing the Service to you.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.3 Feedback</h3>
            <p className="text-gray-700 leading-relaxed">
              If you provide us with feedback, suggestions, or ideas about the Service, you grant us the right to use them 
              without any obligation to compensate you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Data and Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Your use of the Service is also governed by our Privacy Policy, available at <a href="/privacy" className="text-blue-600 hover:underline">/privacy</a>. 
              By using Roolify, you consent to the collection and use of information as described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Roolify integrates with third-party services including Webflow, Xano, Stripe, and SendGrid. Your use of these 
              services is subject to their respective terms and conditions:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><a href="https://webflow.com/legal/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Webflow Terms of Service</a></li>
              <li><a href="https://www.xano.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Xano Terms of Service</a></li>
              <li><a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Stripe Terms of Service</a></li>
              <li><a href="https://www.twilio.com/legal/tos" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">SendGrid Terms of Service</a></li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We are not responsible for the availability, content, or practices of these third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Service Availability and Modifications</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9.1 Availability</h3>
            <p className="text-gray-700 leading-relaxed">
              We strive to provide reliable service but do not guarantee that the Service will be uninterrupted, timely, secure, 
              or error-free. We may experience downtime for maintenance, updates, or unforeseen issues.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9.2 Modifications</h3>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. 
              We will not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Termination</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">10.1 Termination by You</h3>
            <p className="text-gray-700 leading-relaxed">
              You may terminate your account at any time by contacting support or through your account settings.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">10.2 Termination by Us</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, 
              for any reason, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Breach of these Terms</li>
              <li>Violation of applicable laws</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Non-payment of fees</li>
              <li>Extended inactivity</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">10.3 Effect of Termination</h3>
            <p className="text-gray-700 leading-relaxed">
              Upon termination, your right to use the Service will immediately cease. We will retain your data for 30 days 
              to allow for account recovery, after which all data will be permanently deleted. Provisions of these Terms that 
              by their nature should survive termination will survive.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Disclaimers and Limitation of Liability</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">11.1 Disclaimers</h3>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
              <p className="text-gray-700 leading-relaxed font-semibold mb-2">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.</p>
              <p className="text-gray-700 leading-relaxed text-sm">
                We disclaim all warranties, express or implied, including but not limited to implied warranties of merchantability, 
                fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, 
                error-free, or secure, or that defects will be corrected.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">11.2 Limitation of Liability</h3>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-gray-700 leading-relaxed text-sm">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ROOLIFY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, 
                OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm mt-2">
                <li>Your use or inability to use the Service</li>
                <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
                <li>Any interruption or cessation of transmission to or from the Service</li>
                <li>Any bugs, viruses, or malicious code transmitted through the Service</li>
                <li>Any errors or omissions in any content or for any loss or damage incurred as a result of your use of any content</li>
              </ul>
              <p className="text-gray-700 leading-relaxed text-sm mt-3">
                IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES EXCEED THE AMOUNT YOU PAID US IN THE PAST TWELVE MONTHS, 
                OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify, defend, and hold harmless Roolify, its officers, directors, employees, and agents from and 
              against any claims, liabilities, damages, losses, and expenses, including reasonable attorney's fees, arising out of 
              or in any way connected with your access to or use of the Service, your violation of these Terms, or your violation 
              of any rights of another party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">13.1 Governing Law</h3>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Arizona and the 
              United States, without regard to its conflict of law provisions.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">13.2 Informal Resolution</h3>
            <p className="text-gray-700 leading-relaxed">
              Before filing a claim, you agree to try to resolve the dispute informally by contacting us at info@roolify.com. 
              We'll try to resolve the dispute informally by contacting you via email.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">13.3 Arbitration</h3>
            <p className="text-gray-700 leading-relaxed">
              If we can't resolve the dispute informally, any dispute will be resolved through binding arbitration in accordance 
              with the rules of the American Arbitration Association. The arbitration will take place in Arizona, and 
              judgment on the arbitration award may be entered in any court having jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. General Provisions</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">14.1 Entire Agreement</h3>
            <p className="text-gray-700 leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Roolify regarding 
              the Service and supersede all prior agreements.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">14.2 Waiver and Severability</h3>
            <p className="text-gray-700 leading-relaxed">
              Our failure to enforce any right or provision of these Terms will not be considered a waiver. If any provision 
              is found to be invalid or unenforceable, the remaining provisions will remain in effect.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">14.3 Assignment</h3>
            <p className="text-gray-700 leading-relaxed">
              You may not assign or transfer these Terms without our prior written consent. We may assign our rights and obligations 
              without restriction.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">14.4 Changes to Terms</h3>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the new 
              Terms on this page and updating the "Last Updated" date. Your continued use of the Service after changes become 
              effective constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">15. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <p className="text-gray-900 font-semibold mb-2">Roolify Support</p>
              <p className="text-gray-700">Email: <a href="mailto:info@roolify.com" className="text-blue-600 hover:underline">info@roolify.com</a></p>
              <p className="text-gray-700 mt-2 text-sm">We will respond to your inquiry within 48 hours.</p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              By using Roolify, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

