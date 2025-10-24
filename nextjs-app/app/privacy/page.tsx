'use client';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Roolify ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Webflow application and services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
              <li><strong>Webflow Site Data:</strong> Site IDs, site names, and OAuth access tokens when you connect your Webflow sites</li>
              <li><strong>Form Data:</strong> Form structures, field names, and configurations from your Webflow sites</li>
              <li><strong>Form Submissions:</strong> Data submitted through forms on your Webflow sites that use Roolify</li>
              <li><strong>Payment Information:</strong> Billing details processed through Stripe (we do not store credit card numbers)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent in the application</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
              <li><strong>Cookies:</strong> Authentication tokens and session data stored in your browser</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Service Delivery:</strong> To provide, maintain, and improve Roolify's functionality</li>
              <li><strong>Form Logic:</strong> To execute conditional logic rules on your Webflow forms</li>
              <li><strong>Notifications:</strong> To send email notifications based on form submissions</li>
              <li><strong>Data Management:</strong> To store and display form submissions in your dashboard</li>
              <li><strong>Authentication:</strong> To verify your identity and manage your account</li>
              <li><strong>Billing:</strong> To process payments and manage subscriptions</li>
              <li><strong>Support:</strong> To respond to your inquiries and provide customer support</li>
              <li><strong>Analytics:</strong> To understand usage patterns and improve our services</li>
              <li><strong>Security:</strong> To detect, prevent, and address technical issues and fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Storage and Security</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.1 Where We Store Your Data</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Xano:</strong> User accounts, site connections, form data, rules, and submissions are stored on Xano's secure infrastructure</li>
              <li><strong>Vercel:</strong> Application hosting and delivery</li>
              <li><strong>Your Browser:</strong> Authentication tokens stored in cookies and local storage</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.2 Security Measures</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>All data transmitted between your browser and our servers is encrypted using HTTPS/TLS</li>
              <li>Webflow access tokens are stored securely and never exposed to the client</li>
              <li>User data is isolated - you can only access your own sites, forms, and submissions</li>
              <li>Regular security audits and updates to address vulnerabilities</li>
              <li>Server-side authentication on all API endpoints</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-3">Roolify integrates with the following third-party services:</p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Webflow</h4>
                <p className="text-gray-700 text-sm">We connect to your Webflow sites via OAuth to access form structures and site information. 
                See <a href="https://webflow.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Webflow's Privacy Policy</a>.</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Xano</h4>
                <p className="text-gray-700 text-sm">Backend-as-a-Service provider that stores all application data. 
                See <a href="https://www.xano.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Xano's Privacy Policy</a>.</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Stripe (Optional)</h4>
                <p className="text-gray-700 text-sm">Payment processing for paid subscriptions. We do not store credit card information. 
                See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Stripe's Privacy Policy</a>.</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">SendGrid (Optional)</h4>
                <p className="text-gray-700 text-sm">Email delivery service for form notifications. 
                See <a href="https://www.twilio.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">SendGrid's Privacy Policy</a>.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share specific information</li>
              <li><strong>Service Providers:</strong> With third-party services listed above that help us operate Roolify</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>Protection:</strong> To protect our rights, property, or safety, or that of our users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You have the following rights regarding your personal information:</p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900">Access</h4>
                <p className="text-gray-700 text-sm">You can access your account information, connected sites, and form data through your dashboard.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Correction</h4>
                <p className="text-gray-700 text-sm">You can update your profile information at any time through the Profile page.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Deletion</h4>
                <p className="text-gray-700 text-sm">You can delete your account and all associated data by contacting support. This action is irreversible.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Export</h4>
                <p className="text-gray-700 text-sm">You can export your form submissions as CSV files from the Submissions page.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Disconnect</h4>
                <p className="text-gray-700 text-sm">You can disconnect Webflow sites at any time, which will revoke our access to those sites.</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Opt-Out</h4>
                <p className="text-gray-700 text-sm">You can opt out of marketing emails by clicking the unsubscribe link in any email.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We use cookies and similar technologies for:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Authentication:</strong> To keep you logged in and maintain your session</li>
              <li><strong>Preferences:</strong> To remember your settings and preferences</li>
              <li><strong>Security:</strong> To detect and prevent fraudulent activity</li>
              <li><strong>Analytics:</strong> To understand how you use our application (anonymized)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You can control cookies through your browser settings, but disabling cookies may affect the functionality of Roolify.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide services. 
              When you delete your account, we will delete or anonymize your personal information within 30 days, except where 
              we are required to retain it for legal or regulatory purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. 
              These countries may have data protection laws that are different from the laws of your country. 
              We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Roolify is not intended for use by children under the age of 13. We do not knowingly collect personal information 
              from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. GDPR Compliance (EU Users)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">If you are located in the European Economic Area (EEA), you have additional rights under GDPR:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent at any time</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. CCPA Compliance (California Users)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">If you are a California resident, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Know what personal information is collected, used, shared, or sold</li>
              <li>Delete personal information held by us</li>
              <li>Opt-out of the sale of personal information (we do not sell personal information)</li>
              <li>Non-discrimination for exercising your CCPA rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, 
              or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page 
              and updating the "Last Updated" date. Your continued use of Roolify after such changes constitutes your acceptance 
              of the updated Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">15. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <p className="text-gray-900 font-semibold mb-2">Roolify Support</p>
              <p className="text-gray-700">Email: <a href="mailto:info@roolify.com" className="text-blue-600 hover:underline">info@roolify.com</a></p>
              <p className="text-gray-700 mt-2 text-sm">We will respond to your inquiry within 48 hours.</p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              By using Roolify, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




