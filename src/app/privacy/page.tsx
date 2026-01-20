// src/app/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Zablink",
  description: "Privacy Policy for Zablink Platform",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last Updated: October 27, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              At Zablink, we take your privacy seriously. 
              This Privacy Policy explains how we collect, use, and protect your personal information 
              when you use our Service.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">1.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li><strong>Account Information:</strong> Name, email, password, profile picture</li>
              <li><strong>Profile Information:</strong> Shop name, address, phone number, business type</li>
              <li><strong>User-Generated Content:</strong> Reviews, images, videos, comments</li>
              <li><strong>Contact Information:</strong> Messages sent to support team</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">1.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li><strong>Usage Data:</strong> Pages visited, time spent, features used</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
              <li><strong>Cookies:</strong> Data stored to improve user experience</li>
              <li><strong>Location Data:</strong> Approximate location from IP address (if permitted)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">1.3 Third-Party Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li><strong>Social Login:</strong> Information from Google, Facebook, LINE (name, email, profile picture)</li>
              <li><strong>Analytics:</strong> Data from analytics tools to improve services</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>Provide and maintain your account</li>
              <li>Improve and develop our services</li>
              <li>Send notifications about your account and usage</li>
              <li>Respond to inquiries and provide support</li>
              <li>Prevent fraud and maintain security</li>
              <li>Analyze user behavior to improve services</li>
              <li>Send newsletters and promotions (with your consent)</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We do not sell, rent, or share your personal information with third parties, except in the following cases:
            </p>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">3.1 Sharing With Your Consent</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>Public information you choose to display (e.g., name, profile picture, reviews)</li>
              <li>Information shared with other users as you wish</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">3.2 Service Providers</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>Cloud hosting providers (e.g., AWS, Google Cloud)</li>
              <li>Payment processors (for payments)</li>
              <li>Analytics services (e.g., Google Analytics)</li>
              <li>Email service providers (for sending emails)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">3.3 Legal Requirements</h3>
            <p className="text-gray-700 ml-4">
              We may disclose information if required by law, court order, or to protect rights and safety.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We employ appropriate security measures to protect your information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>Data encryption (SSL/TLS)</li>
              <li>Strict access controls</li>
              <li>Regular security audits</li>
              <li>Regular data backups</li>
              <li>Staff training on data security</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              However, no system is 100% secure, and we cannot guarantee absolute data security.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li><strong>Access:</strong> Request to view personal information we hold about you</li>
              <li><strong>Rectification:</strong> Update or correct inaccurate information</li>
              <li><strong>Erasure:</strong> Request deletion of your information (subject to certain limitations)</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a readable format</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for certain types of data processing</li>
              <li><strong>Object:</strong> Object to processing of certain types of data</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              To exercise these rights, please contact us at privacy@zablink.com
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>Remember your preferences and settings</li>
              <li>Maintain login sessions</li>
              <li>Analyze usage and improve services</li>
              <li>Display relevant content</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You can configure your browser to reject cookies, but this may affect some features.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as necessary to provide services or as required by law. 
              When you delete your account, we will delete or anonymize your information within 90 days 
              (except for information required to be retained by law).
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Information</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Service is not intended for persons under 13 years of age. 
              We do not knowingly collect personal information from children. 
              If you know that a child has provided us with information, please contact us to have it removed.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and stored on servers located outside Thailand. 
              We will take appropriate measures to ensure your information is protected in accordance with this policy.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Policy Changes</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. 
              Significant changes will be communicated via email or website announcement. 
              Please review this policy regularly.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you have questions about this Privacy Policy or wish to exercise your rights, 
              please contact us at:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-gray-700">
              <p><strong>Data Protection Officer (DPO)</strong></p>
              <p><strong>Email:</strong> privacy@zablink.com</p>
              <p><strong>General Email:</strong> support@zablink.com</p>
              <p><strong>Website:</strong> www.zablink.com</p>
            </div>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4 text-sm">
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms of Use
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/about" className="text-blue-600 hover:underline">
            About Us
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}