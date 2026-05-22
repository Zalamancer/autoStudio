import { Link } from 'react-router-dom'
import { Logo } from './icons/Logo'

export default function TermsOfService() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-12">Last updated: February 26, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ProAnimate ("the Service"), operated at tryproanimate.com, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              ProAnimate is a web-based content creation platform that enables users to create short-form videos using AI-powered tools including character animation, text-to-speech, script generation, motion graphics, and video export capabilities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Account Registration</h2>
            <p>
              To use certain features of the Service, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating your account and keep it up to date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. User Content</h2>
            <p className="mb-3">
              You retain ownership of content you create using the Service ("User Content"). By using the Service, you grant ProAnimate a limited, non-exclusive license to process your content solely for the purpose of providing the Service to you.
            </p>
            <p>You are solely responsible for your User Content and agree that you will not upload, create, or distribute content that:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Violates any applicable law or regulation</li>
              <li>Infringes on intellectual property rights of others</li>
              <li>Contains harmful, abusive, defamatory, or obscene material</li>
              <li>Impersonates another person or entity</li>
              <li>Contains malware, viruses, or other harmful code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. AI-Generated Content</h2>
            <p>
              The Service uses third-party AI models to generate text, images, audio, and video. While we strive for quality and accuracy, AI-generated content may contain errors or inaccuracies. You are responsible for reviewing and verifying all AI-generated content before publishing or distributing it. ProAnimate does not guarantee the accuracy, completeness, or suitability of AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Third-Party Services</h2>
            <p>
              The Service integrates with third-party APIs and services (including but not limited to Google Gemini, ElevenLabs, Meshy, Pixabay, and Supabase). Your use of these services through ProAnimate is also subject to their respective terms of service. ProAnimate is not responsible for the availability or performance of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Payments and Credits</h2>
            <p>
              Certain features of the Service may require the purchase of credits or a subscription. All payments are processed through secure third-party payment providers. Pricing is subject to change with reasonable notice. Refund policies are handled on a case-by-case basis. Unused credits may expire as described in the applicable plan terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Prohibited Uses</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse-engineer, decompile, or disassemble the Service</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Use automated tools to scrape, crawl, or extract data from the Service</li>
              <li>Resell or redistribute the Service without authorization</li>
              <li>Use the Service to generate content that violates the rights of others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Intellectual Property</h2>
            <p>
              The Service, including its design, code, features, and branding, is owned by ProAnimate and protected by intellectual property laws. You may not copy, modify, or create derivative works of the Service itself. Templates, animations, and assets provided within the Service are licensed for use within the platform and in exported content only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, ProAnimate shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses, resulting from your use of or inability to use the Service. The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations of these Terms. You may delete your account at any time. Upon termination, your right to use the Service ceases immediately. We may retain certain data as required by law or for legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify users of material changes by posting the updated terms on the Service. Your continued use of the Service after changes are posted constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Contact</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:support@tryproanimate.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                support@tryproanimate.com
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
