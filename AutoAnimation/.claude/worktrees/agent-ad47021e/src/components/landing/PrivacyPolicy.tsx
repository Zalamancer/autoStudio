import { Link } from 'react-router-dom'
import { Logo } from './icons/Logo'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo size={24} />
            <span className="text-sm font-bold text-white">ProAnimate</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-12">Last updated: February 26, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              ProAnimate ("we", "us", or "our"), operated at tryproanimate.com, is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h2>

            <h3 className="text-base font-medium text-zinc-200 mt-4 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-zinc-200">Account information:</strong> email address, name, and password when you register</li>
              <li><strong className="text-zinc-200">Payment information:</strong> billing details processed securely through third-party payment providers (we do not store full card numbers)</li>
              <li><strong className="text-zinc-200">User content:</strong> scripts, images, characters, audio, videos, and other content you create or upload</li>
              <li><strong className="text-zinc-200">Communications:</strong> messages you send to us for support or feedback</li>
            </ul>

            <h3 className="text-base font-medium text-zinc-200 mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-zinc-200">Usage data:</strong> features used, actions taken, session duration, and interaction patterns</li>
              <li><strong className="text-zinc-200">Device information:</strong> browser type, operating system, screen resolution, and device identifiers</li>
              <li><strong className="text-zinc-200">Log data:</strong> IP address, access times, pages viewed, and referring URLs</li>
              <li><strong className="text-zinc-200">Local storage:</strong> we use IndexedDB and browser local storage to cache assets (3D models, images) on your device for performance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process your transactions and manage your account</li>
              <li>Generate AI content (scripts, characters, voices, animations) as requested by you</li>
              <li>Improve and personalize your experience</li>
              <li>Analyze usage patterns to enhance features and performance</li>
              <li>Communicate with you about updates, support, and promotional offers (with your consent)</li>
              <li>Detect and prevent fraud, abuse, and security incidents</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-3">
              To provide the Service, we transmit certain data to third-party APIs. Each provider processes data according to their own privacy policies:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-zinc-200">Google (Gemini AI):</strong> text prompts for script generation, image generation, and orchestration</li>
              <li><strong className="text-zinc-200">ElevenLabs:</strong> text for voice synthesis and audio generation</li>
              <li><strong className="text-zinc-200">Meshy:</strong> text and images for 3D model generation</li>
              <li><strong className="text-zinc-200">Pixabay:</strong> search queries for stock media</li>
              <li><strong className="text-zinc-200">Supabase:</strong> account data, project data, and file storage</li>
              <li><strong className="text-zinc-200">Stripe:</strong> payment processing</li>
            </ul>
            <p className="mt-3">
              We only share the minimum data necessary for each service to function. We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Data Storage and Security</h2>
            <p className="mb-3">
              Your data is stored using Supabase (hosted on secure cloud infrastructure) with row-level security policies ensuring you can only access your own data. Uploaded files (sprites, audio, thumbnails) are stored in secure cloud storage buckets.
            </p>
            <p>
              We implement industry-standard security measures including encryption in transit (TLS), secure authentication, and access controls. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Data Retention</h2>
            <p>
              We retain your account information and project data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., fraud prevention). Locally cached data (IndexedDB) remains on your device until you clear your browser storage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-2">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-zinc-200">Access:</strong> request a copy of the personal data we hold about you</li>
              <li><strong className="text-zinc-200">Correction:</strong> request correction of inaccurate personal data</li>
              <li><strong className="text-zinc-200">Deletion:</strong> request deletion of your personal data</li>
              <li><strong className="text-zinc-200">Portability:</strong> request your data in a portable format</li>
              <li><strong className="text-zinc-200">Objection:</strong> object to certain processing of your data</li>
              <li><strong className="text-zinc-200">Withdrawal of consent:</strong> withdraw consent for optional data processing at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@tryproanimate.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                privacy@tryproanimate.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Cookies and Tracking</h2>
            <p>
              We use essential cookies for authentication and session management. We may use analytics cookies to understand how users interact with the Service. You can control cookie preferences through your browser settings. The Service also uses browser local storage and IndexedDB for caching application data locally on your device.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Children's Privacy</h2>
            <p>
              The Service is not intended for children under the age of 13 (or the applicable age of consent in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. These countries may have different data protection laws. By using the Service, you consent to the transfer of your information to these countries. We take steps to ensure your data receives adequate protection wherever it is processed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Service and updating the "Last updated" date. Your continued use of the Service after changes are posted constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us at{' '}
              <a href="mailto:privacy@tryproanimate.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                privacy@tryproanimate.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="max-w-4xl mx-auto text-center text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} ProAnimate. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
