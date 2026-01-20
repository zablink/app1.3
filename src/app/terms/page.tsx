// src/app/terms/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Terms of Use - Zablink",
  description: "Terms of Use for Zablink Platform",
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Terms of Use</h1>
          <p className="text-gray-600 mt-2">Last Updated: October 27, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using the Zablink platform ("Service"), you acknowledge that you have read, understood, and agree to be bound by all of these Terms of Use. 
              If you do not agree to any of these terms, please do not use our Service.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use of Service</h2>
            <div className="space-y-3 text-gray-700">
              <p>You agree to use our Service lawfully and will not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Impersonate any person or entity</li>
                <li>Upload or distribute content that infringes on copyright</li>
                <li>Use any method that may damage, disrupt, or interfere with the Service</li>
                <li>Access our systems without authorization</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
            <div className="space-y-3 text-gray-700">
              <p>When creating an account with us, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate, complete, and up-to-date information</li>
                <li>Maintain the security of your password</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be responsible for all activities that occur under your account</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User-Generated Content</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you upload or publish content on our platform (such as reviews, images, videos), you warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>You own or have the rights to use such content</li>
              <li>The content does not infringe on the rights of others</li>
              <li>The content does not contain defamatory, obscene, or illegal material</li>
              <li>You grant us the right to use, display, and distribute such content on the platform</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All services and content (including but not limited to logos, graphics, software) 
              are the property of Zablink and are protected by copyright and intellectual property laws. 
              You are not permitted to copy, modify, or distribute such content without written authorization.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Termination and Suspension</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to suspend or terminate your account immediately, without prior notice, 
              if we believe you have violated these Terms of Use or engaged in behavior harmful to other users.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Our Service is provided "AS IS" and "AS AVAILABLE". 
              We shall not be liable for any damages arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              <li>Use or inability to use our Service</li>
              <li>Delays, errors, or interruptions in the Service</li>
              <li>Loss of data</li>
              <li>Actions of other users</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms of Use at any time. 
              Significant changes will be communicated via email or website announcement. 
              Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Use are governed by the laws of Thailand. 
              Any disputes arising from or relating to these terms shall be subject to the jurisdiction of Thai courts.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you have any questions about these Terms of Use, please contact us at:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-gray-700">
              <p><strong>Email:</strong> legal@zablink.com</p>
              <p><strong>Website:</strong> www.zablink.com</p>
            </div>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-4 text-sm">
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
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